/**
 * Shared collision detection utilities for shapes and screws
 * Consolidated from game and editor implementations
 */

import { Vector2 } from '@/types/game';
import { Shape } from '@/game/entities/Shape';
import { isCircleIntersectingPolygon as isCircleIntersectingVertices } from './GeometryUtils';

/**
 * Check if a point is within shape bounds with margin
 */
export function isPointInShapeBoundsWithMargin(point: Vector2, shape: Shape): boolean {
  const bounds = shape.body.bounds;
  const margin = 5; // Small margin for edge cases
  
  return point.x >= bounds.min.x - margin &&
         point.x <= bounds.max.x + margin &&
         point.y >= bounds.min.y - margin &&
         point.y <= bounds.max.y + margin;
}

/**
 * Check if a circle intersects with any shape type
 */
export function isCircleIntersectingShape(center: Vector2, radius: number, shape: Shape): boolean {
  // First check bounding box intersection for performance
  if (!isPointInShapeBoundsWithMargin(center, shape)) {
    const bounds = shape.body.bounds;
    const closestX = Math.max(bounds.min.x, Math.min(center.x, bounds.max.x));
    const closestY = Math.max(bounds.min.y, Math.min(center.y, bounds.max.y));
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
 * Check if a circle intersects with a rectangle
 */
export function isCircleIntersectingRectangle(center: Vector2, radius: number, shape: Shape): boolean {
  const bounds = shape.body.bounds;
  
  // Find the closest point on the rectangle to the circle center
  const closestX = Math.max(bounds.min.x, Math.min(center.x, bounds.max.x));
  const closestY = Math.max(bounds.min.y, Math.min(center.y, bounds.max.y));
  
  // Calculate distance from circle center to closest point
  const distance = Math.sqrt(
    Math.pow(center.x - closestX, 2) + Math.pow(center.y - closestY, 2)
  );
  
  return distance <= radius;
}

/**
 * Check if a circle intersects with a polygon
 */
export function isCircleIntersectingPolygon(center: Vector2, radius: number, shape: Shape): boolean {
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
 * Check if a circle intersects with a capsule shape
 */
export function isCircleIntersectingCapsule(center: Vector2, radius: number, shape: Shape): boolean {
  // For now, treat capsule as rectangle - can be enhanced later
  return isCircleIntersectingRectangle(center, radius, shape);
}

/**
 * Check if a circle intersects with a vertex-based shape
 */
export function isCircleIntersectingVertexShape(center: Vector2, radius: number, shape: Shape): boolean {
  if (!shape.vertices || shape.vertices.length < 3) {
    return false;
  }
  
  // Convert relative vertices to world coordinates
  const worldVertices = shape.vertices.map(vertex => ({
    x: shape.body.position.x + vertex.x,
    y: shape.body.position.y + vertex.y
  }));
  
  return isCircleIntersectingVertices(center, radius, worldVertices);
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