/**
 * Shared collision detection utilities for shapes and screws
 * Consolidated from game and editor implementations
 */

import { Vector2 } from '@/types/game';
import { Shape } from '@/game/entities/Shape';
import { UI_CONSTANTS } from './Constants';
// Import removed - using local implementation instead

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
      // Fallback to rectangle collision for basic shapes
      return isCircleIntersectingRectangle(center, radius, shape);
  }
}

/**
 * Check if a circle intersects with another circle
 */
export function isCircleIntersectingCircle(center: Vector2, radius: number, shape: Shape): boolean {
  if (!shape.radius) return false;
  
  const shapeCenter = { x: shape.body.position.x, y: shape.body.position.y };
  const distance = Math.sqrt(
    Math.pow(center.x - shapeCenter.x, 2) + Math.pow(center.y - shapeCenter.y, 2)
  );
  
  return distance <= (radius + shape.radius);
}

/**
 * Check if a circle intersects with a rectangle (rotation-aware)
 */
export function isCircleIntersectingRectangle(center: Vector2, radius: number, shape: Shape): boolean {
  const width = shape.width || 60;
  const height = shape.height || 60;

  // Handle rotation by transforming circle center to local coordinates
  const cos = Math.cos(-shape.body.angle);
  const sin = Math.sin(-shape.body.angle);
  const dx = center.x - shape.body.position.x;
  const dy = center.y - shape.body.position.y;
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;

  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const closestX = Math.max(-halfWidth, Math.min(halfWidth, localX));
  const closestY = Math.max(-halfHeight, Math.min(halfHeight, localY));

  const distanceSquared = Math.pow(localX - closestX, 2) + Math.pow(localY - closestY, 2);
  return distanceSquared < (radius * radius);
}

/**
 * Check if a circle intersects with a polygon (rotation-aware for regular polygons)
 */
export function isCircleIntersectingPolygon(center: Vector2, radius: number, shape: Shape): boolean {
  // For regular polygons, generate vertices in local space
  if (shape.radius && shape.sides) {
    const shapeRadius = shape.radius;
    const sides = shape.sides;
    
    // Transform circle center to local coordinates
    const cos = Math.cos(-shape.body.angle);
    const sin = Math.sin(-shape.body.angle);
    const dx = center.x - shape.body.position.x;
    const dy = center.y - shape.body.position.y;
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;
    
    // Generate polygon vertices in local space
    const vertices: Vector2[] = [];
    for (let i = 0; i < sides; i++) {
      const angle = (i * Math.PI * 2) / sides - Math.PI / 2; // Start from top
      vertices.push({
        x: Math.cos(angle) * shapeRadius,
        y: Math.sin(angle) * shapeRadius
      });
    }
    
    // Check if circle center is inside polygon
    if (isPointInPolygon({ x: localX, y: localY }, vertices)) {
      return true;
    }
    
    // Check if circle intersects any edge of the polygon
    for (let i = 0; i < vertices.length; i++) {
      const v1 = vertices[i];
      const v2 = vertices[(i + 1) % vertices.length];
      
      if (isCircleIntersectingLineSegment({ x: localX, y: localY }, radius, v1, v2)) {
        return true;
      }
    }
    
    return false;
  }
  
  // Fallback to using body vertices for irregular polygons
  if (!shape.body.vertices || shape.body.vertices.length < 3) {
    return isCircleIntersectingRectangle(center, radius, shape);
  }
  
  const vertices = shape.body.vertices;
  
  // Check if circle center is inside polygon
  if (isPointInPolygon(center, vertices)) {
    return true;
  }
  
  // Check if circle intersects any edge of the polygon
  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length;
    const distance = distanceFromPointToLineSegment(center, vertices[i], vertices[j]);
    
    if (distance <= radius) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if a circle intersects with a capsule shape (rotation-aware)
 */
export function isCircleIntersectingCapsule(center: Vector2, radius: number, shape: Shape): boolean {
  const capsuleWidth = shape.width || 120;
  const capsuleHeight = shape.height || 34;
  const capsuleRadius = capsuleHeight / 2; // Radius of the semicircle ends
  
  // Transform circle center to local coordinates
  const cos = Math.cos(-shape.body.angle);
  const sin = Math.sin(-shape.body.angle);
  const dx = center.x - shape.body.position.x;
  const dy = center.y - shape.body.position.y;
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;
  
  // Capsule geometry: rectangle in the middle + two circles at the ends
  const rectWidth = capsuleWidth - (2 * capsuleRadius);
  
  // Check intersection with the middle rectangle (in local coordinates)
  const halfRectWidth = rectWidth / 2;
  const halfCapsuleHeight = capsuleHeight / 2;
  const closestX = Math.max(-halfRectWidth, Math.min(halfRectWidth, localX));
  const closestY = Math.max(-halfCapsuleHeight, Math.min(halfCapsuleHeight, localY));
  
  const rectDistanceSquared = Math.pow(localX - closestX, 2) + Math.pow(localY - closestY, 2);
  if (rectDistanceSquared < (radius * radius)) {
    return true;
  }
  
  // Check intersection with left semicircle (in local coordinates)
  const leftCircleLocalX = -rectWidth / 2;
  const leftCircleLocalY = 0;
  const leftDistanceSquared = Math.pow(localX - leftCircleLocalX, 2) + Math.pow(localY - leftCircleLocalY, 2);
  if (leftDistanceSquared < Math.pow(radius + capsuleRadius, 2)) {
    return true;
  }
  
  // Check intersection with right semicircle (in local coordinates)
  const rightCircleLocalX = rectWidth / 2;
  const rightCircleLocalY = 0;
  const rightDistanceSquared = Math.pow(localX - rightCircleLocalX, 2) + Math.pow(localY - rightCircleLocalY, 2);
  if (rightDistanceSquared < Math.pow(radius + capsuleRadius, 2)) {
    return true;
  }
  
  return false;
}

/**
 * Check if a circle intersects with a vertex-based shape (rotation-aware)
 */
export function isCircleIntersectingVertexShape(center: Vector2, radius: number, shape: Shape): boolean {
  // For shapes defined by vertices (arrow, chevron, star, horseshoe)
  if (!shape.body.vertices || shape.body.vertices.length === 0) {
    return false;
  }
  
  const vertices = shape.body.vertices;
  
  // Transform circle center to local coordinates
  const cos = Math.cos(-shape.body.angle);
  const sin = Math.sin(-shape.body.angle);
  const dx = center.x - shape.body.position.x;
  const dy = center.y - shape.body.position.y;
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;
  const localCenter = { x: localX, y: localY };
  
  // Transform vertices to local coordinates relative to shape position
  const localVertices: Vector2[] = vertices.map(v => ({
    x: (v.x - shape.body.position.x) * cos - (v.y - shape.body.position.y) * sin,
    y: (v.x - shape.body.position.x) * sin + (v.y - shape.body.position.y) * cos
  }));
  
  // Check if circle center is inside the polygon
  if (isPointInPolygon(localCenter, localVertices)) {
    return true;
  }
  
  // Check if circle intersects any edge of the polygon
  for (let i = 0; i < localVertices.length; i++) {
    const v1 = localVertices[i];
    const v2 = localVertices[(i + 1) % localVertices.length];
    
    if (isCircleIntersectingLineSegment(localCenter, radius, v1, v2)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
export function isPointInPolygon(point: Vector2, vertices: Vector2[]): boolean {
  let inside = false;
  const x = point.x;
  const y = point.y;
  
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i].x;
    const yi = vertices[i].y;
    const xj = vertices[j].x;
    const yj = vertices[j].y;
    
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
}

/**
 * Calculate the minimum distance from a point to a line segment
 */
export function distanceFromPointToLineSegment(point: Vector2, lineStart: Vector2, lineEnd: Vector2): number {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  
  if (lenSq === 0) {
    // Line segment is actually a point
    return Math.sqrt(A * A + B * B);
  }
  
  const param = dot / lenSq;

  let xx: number, yy: number;

  if (param < 0) {
    xx = lineStart.x;
    yy = lineStart.y;
  } else if (param > 1) {
    xx = lineEnd.x;
    yy = lineEnd.y;
  } else {
    xx = lineStart.x + param * C;
    yy = lineStart.y + param * D;
  }

  const dx = point.x - xx;
  const dy = point.y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check if a circle intersects with a line segment
 */
export function isCircleIntersectingLineSegment(center: Vector2, radius: number, lineStart: Vector2, lineEnd: Vector2): boolean {
  const distance = distanceFromPointToLineSegment(center, lineStart, lineEnd);
  return distance <= radius;
}

/**
 * Get the distance to the nearest edge of a polygon
 */
export function getDistanceToNearestEdge(point: Vector2, vertices: Vector2[]): number {
  let minDistance = Infinity;
  
  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length;
    const distance = distanceFromPointToLineSegment(point, vertices[i], vertices[j]);
    minDistance = Math.min(minDistance, distance);
  }
  
  return minDistance;
}

/**
 * Check if a screw area is blocked by a shape
 */
export function isScrewAreaBlocked(
  screwPosition: Vector2, 
  screwRadius: number, 
  shape: Shape, 
  precisCheck: boolean = false
): boolean {
  if (precisCheck) {
    // Use actual screw radius plus blocking margin for better blocking detection
    return isCircleIntersectingShape(screwPosition, screwRadius + UI_CONSTANTS.screws.blockingMargin, shape);
  } else {
    return isPointInShapeBoundsWithMargin(screwPosition, shape);
  }
}

/**
 * Enhanced point-in-bounds check with margin (using shape bounds)
 */
export function isPointInShapeBoundsWithMarginEnhanced(point: Vector2, shape: Shape): boolean {
  const bounds = shape.getBounds();
  const margin = 2;
  return (
    point.x >= bounds.x + margin &&
    point.x <= bounds.x + bounds.width - margin &&
    point.y >= bounds.y + margin &&
    point.y <= bounds.y + bounds.height - margin
  );
}