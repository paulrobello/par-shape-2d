/**
 * Static utility functions for screw collision detection
 * Extracted from ScrewManager to improve modularity
 */

import { Vector2 } from '@/types/game';
import { Shape } from '@/game/entities/Shape';
import { DEBUG_CONFIG } from '@/shared/utils/Constants';

/**
 * Check if a point is within shape bounds with margin
 */
export function isPointInShapeBoundsWithMargin(point: Vector2, shape: Shape): boolean {
  const bounds = shape.getBounds();
  const margin = 5; // Small margin for edge cases
  
  return point.x >= bounds.x - margin &&
         point.x <= bounds.x + bounds.width + margin &&
         point.y >= bounds.y - margin &&
         point.y <= bounds.y + bounds.height + margin;
}

/**
 * Check if a circle intersects with any shape type
 */
export function isCircleIntersectingShape(center: Vector2, radius: number, shape: Shape): boolean {
  // First check bounding box intersection for performance
  if (!isPointInShapeBoundsWithMargin(center, shape)) {
    const bounds = shape.getBounds();
    const closestX = Math.max(bounds.x, Math.min(center.x, bounds.x + bounds.width));
    const closestY = Math.max(bounds.y, Math.min(center.y, bounds.y + bounds.height));
    const distance = Math.sqrt(
      Math.pow(center.x - closestX, 2) + Math.pow(center.y - closestY, 2)
    );
    if (distance > radius) return false;
  }
  
  switch (shape.type) {
    case 'circle':
      return isCircleIntersectingCircle(center, radius, shape);
    case 'rectangle':
      return isCircleIntersectingRectangle(center, radius, shape);
    case 'polygon':
      return isCircleIntersectingPolygon(center, radius, shape);
    case 'capsule':
      return isCircleIntersectingCapsule(center, radius, shape);
    default:
      // For unknown types or vertex-based shapes, try vertex-based collision
      if (shape.vertices && shape.vertices.length > 0) {
        return isCircleIntersectingVertexShape(center, radius, shape);
      }
      if (DEBUG_CONFIG.logShapeDebug) {
        console.warn(`Unknown shape type for collision detection: ${shape.type}`);
      }
      return false;
  }
}

/**
 * Check circle-circle intersection
 */
export function isCircleIntersectingCircle(center: Vector2, radius: number, shape: Shape): boolean {
  const shapeCenter = { x: shape.body.position.x, y: shape.body.position.y };
  const shapeRadius = shape.radius || 50;
  const distance = Math.sqrt(
    Math.pow(center.x - shapeCenter.x, 2) + Math.pow(center.y - shapeCenter.y, 2)
  );
  return distance < radius + shapeRadius;
}

/**
 * Check circle-rectangle intersection with rotation support
 */
export function isCircleIntersectingRectangle(center: Vector2, radius: number, shape: Shape): boolean {
  const shapeCenter = { x: shape.body.position.x, y: shape.body.position.y };
  const angle = shape.body.angle;
  
  // Transform circle center to shape's local coordinate system
  const cos = Math.cos(-angle);
  const sin = Math.sin(-angle);
  const localX = (center.x - shapeCenter.x) * cos - (center.y - shapeCenter.y) * sin;
  const localY = (center.x - shapeCenter.x) * sin + (center.y - shapeCenter.y) * cos;
  
  const bounds = shape.getBounds();
  const width = bounds.width;
  const height = bounds.height;
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  
  // Find closest point on rectangle to circle center (in local coordinates)
  const closestX = Math.max(-halfWidth, Math.min(localX, halfWidth));
  const closestY = Math.max(-halfHeight, Math.min(localY, halfHeight));
  
  // Calculate distance from circle center to closest point
  const distanceX = localX - closestX;
  const distanceY = localY - closestY;
  const distanceSquared = distanceX * distanceX + distanceY * distanceY;
  
  return distanceSquared < radius * radius;
}

/**
 * Check circle-polygon intersection with rotation support
 */
export function isCircleIntersectingPolygon(center: Vector2, radius: number, shape: Shape): boolean {
  if (!shape.vertices || shape.vertices.length === 0) {
    if (DEBUG_CONFIG.logShapeDebug) {
      console.warn('Polygon shape has no vertices for collision detection');
    }
    return false;
  }
  
  // Check if circle center is inside polygon
  if (isPointInPolygon(center, shape.vertices)) {
    return true;
  }
  
  // Check if circle intersects any edge of the polygon
  for (let i = 0; i < shape.vertices.length; i++) {
    const j = (i + 1) % shape.vertices.length;
    if (isCircleIntersectingLineSegment(center, radius, shape.vertices[i], shape.vertices[j])) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if point is inside polygon using ray casting algorithm
 */
export function isPointInPolygon(point: Vector2, vertices: Vector2[]): boolean {
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    if (((vertices[i].y > point.y) !== (vertices[j].y > point.y)) &&
        (point.x < (vertices[j].x - vertices[i].x) * (point.y - vertices[i].y) / (vertices[j].y - vertices[i].y) + vertices[i].x)) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Check circle-line segment intersection
 */
export function isCircleIntersectingLineSegment(center: Vector2, radius: number, p1: Vector2, p2: Vector2): boolean {
  // Vector from p1 to p2
  const lineVec = { x: p2.x - p1.x, y: p2.y - p1.y };
  
  // Vector from p1 to circle center
  const toCenter = { x: center.x - p1.x, y: center.y - p1.y };
  
  // Project toCenter onto lineVec
  const lineLengthSquared = lineVec.x * lineVec.x + lineVec.y * lineVec.y;
  if (lineLengthSquared === 0) {
    // Line segment is just a point
    const dist = Math.sqrt(toCenter.x * toCenter.x + toCenter.y * toCenter.y);
    return dist <= radius;
  }
  
  const t = Math.max(0, Math.min(1, (toCenter.x * lineVec.x + toCenter.y * lineVec.y) / lineLengthSquared));
  
  // Find closest point on line segment
  const closest = {
    x: p1.x + t * lineVec.x,
    y: p1.y + t * lineVec.y
  };
  
  // Check distance from circle center to closest point
  const distanceSquared = Math.pow(center.x - closest.x, 2) + Math.pow(center.y - closest.y, 2);
  return distanceSquared <= radius * radius;
}

/**
 * Check circle-capsule intersection (composite shape)
 */
export function isCircleIntersectingCapsule(center: Vector2, radius: number, shape: Shape): boolean {
  // Capsule is composed of a rectangle and two circles
  // Check intersection with the main rectangle body
  if (isCircleIntersectingRectangle(center, radius, shape)) {
    return true;
  }
  
  // For composite shapes, we would need to check each part
  // This is a simplified version that treats capsule as rectangle
  // In practice, the physics engine handles composite collision better
  return false;
}

/**
 * Check circle intersection with vertex-based shapes (paths)
 */
export function isCircleIntersectingVertexShape(center: Vector2, radius: number, shape: Shape): boolean {
  if (!shape.vertices || shape.vertices.length === 0) {
    if (DEBUG_CONFIG.logShapeDebug) {
      console.warn('Vertex shape has no vertices for collision detection');
    }
    return false;
  }
  
  // Transform vertices to world coordinates using shape position and rotation
  const shapeCenter = { x: shape.body.position.x, y: shape.body.position.y };
  const angle = shape.body.angle;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  
  const worldVertices = shape.vertices.map(vertex => ({
    x: shapeCenter.x + (vertex.x * cos - vertex.y * sin),
    y: shapeCenter.y + (vertex.x * sin + vertex.y * cos)
  }));
  
  // Check if circle center is inside the shape
  if (isPointInPolygon(center, worldVertices)) {
    return true;
  }
  
  // Check if circle intersects any edge
  for (let i = 0; i < worldVertices.length; i++) {
    const j = (i + 1) % worldVertices.length;
    if (isCircleIntersectingLineSegment(center, radius, worldVertices[i], worldVertices[j])) {
      return true;
    }
  }
  
  return false;
}

/**
 * Calculate distance from point to nearest edge of shape
 */
export function getDistanceToNearestEdge(point: Vector2, shape: Shape): number {
  switch (shape.type) {
    case 'circle': {
      const center = { x: shape.body.position.x, y: shape.body.position.y };
      const distance = Math.sqrt(
        Math.pow(point.x - center.x, 2) + Math.pow(point.y - center.y, 2)
      );
      const radius = shape.radius || 50;
      return Math.abs(distance - radius);
    }
    
    case 'rectangle': {
      const bounds = shape.getBounds();
      const center = { x: shape.body.position.x, y: shape.body.position.y };
      const halfWidth = bounds.width / 2;
      const halfHeight = bounds.height / 2;
      
      // Distance to rectangle edges
      const dx = Math.max(0, Math.abs(point.x - center.x) - halfWidth);
      const dy = Math.max(0, Math.abs(point.y - center.y) - halfHeight);
      return Math.sqrt(dx * dx + dy * dy);
    }
    
    default:
      // For other shapes, approximate using bounding box
      const bounds = shape.getBounds();
      const center = { x: shape.body.position.x, y: shape.body.position.y };
      const distance = Math.sqrt(
        Math.pow(point.x - center.x, 2) + Math.pow(point.y - center.y, 2)
      );
      const avgRadius = Math.min(bounds.width, bounds.height) / 2;
      return Math.abs(distance - avgRadius);
  }
}