/**
 * Shared collision detection utilities for shapes and screws
 * Consolidated from game and editor implementations
 */

import { Vector2 } from '@/types/game';
import { Shape } from '@/game/entities/Shape';
import { UI_CONSTANTS, DEBUG_CONFIG } from './Constants';
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
 * BROAD PHASE: Check if a circle can possibly intersect with a shape's bounding box
 * This is a fast early elimination test before doing expensive geometric calculations
 */
export function isCircleIntersectingBounds(center: Vector2, radius: number, shape: Shape): boolean {
  const bounds = shape.getBounds();
  
  // Find the closest point on the bounding box to the circle center
  const closestX = Math.max(bounds.x, Math.min(center.x, bounds.x + bounds.width));
  const closestY = Math.max(bounds.y, Math.min(center.y, bounds.y + bounds.height));
  
  // Calculate distance from circle center to closest point on bounding box
  const distanceSquared = Math.pow(center.x - closestX, 2) + Math.pow(center.y - closestY, 2);
  
  // Circle intersects bounding box if distance to closest point <= radius
  return distanceSquared <= (radius * radius);
}

/**
 * Check if a circle intersects with any shape type using two-phase collision detection
 * ENHANCED: Prioritizes physics body vertices for maximum accuracy
 */
export function isCircleIntersectingShape(center: Vector2, radius: number, shape: Shape): boolean {
  // BROAD PHASE: Quick bounding box check for early elimination
  if (!isCircleIntersectingBounds(center, radius, shape)) {
    return false; // No intersection with bounding box, definitely no collision
  }
  
  // ENHANCED NARROW PHASE: Always prioritize physics body vertices when available
  // This ensures we use the actual collision geometry from Matter.js physics engine
  
  // Check for composite shapes with multiple parts first
  if (shape.isComposite && shape.parts && shape.parts.length > 0) {
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`🔧 Using composite shape collision detection for shape ${shape.id}`);
    }
    return isCircleIntersectingCompositeShape(center, radius, shape);
  }
  
  // Check for physics body vertices (most accurate)
  if (shape.body.vertices && shape.body.vertices.length >= 3) {
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`🔧 Using physics body vertices collision detection for shape ${shape.id} (${shape.body.vertices.length} vertices)`);
    }
    // Matter.js vertices are already in world coordinates and include rotation
    return isCircleIntersectingPhysicsBodyVertices(center, radius, shape.body.vertices);
  }
  
  // Fallback to shape-type specific collision detection
  if (DEBUG_CONFIG.logScrewDebug) {
    console.log(`🔧 Using shape-type specific collision detection for shape ${shape.id} (type: ${shape.type})`);
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
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`🔧 Using vertex-based collision detection for shape ${shape.id}`);
        }
        return isCircleIntersectingVertexShape(center, radius, shape);
      }
      // Final fallback to rectangle collision for basic shapes
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`🔧 Using fallback rectangle collision detection for shape ${shape.id}`);
      }
      return isCircleIntersectingRectangle(center, radius, shape);
  }
}

/**
 * Check if a circle intersects with physics body vertices (most accurate method)
 * Uses the actual Matter.js collision geometry
 */
export function isCircleIntersectingPhysicsBodyVertices(center: Vector2, radius: number, vertices: Vector2[]): boolean {
  // Check if circle center is inside the polygon
  if (isPointInPolygon(center, vertices)) {
    return true;
  }
  
  // Check if circle intersects any edge of the physics body
  for (let i = 0; i < vertices.length; i++) {
    const v1 = vertices[i];
    const v2 = vertices[(i + 1) % vertices.length];
    
    if (isCircleIntersectingLineSegment(center, radius, v1, v2)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if a circle intersects with a composite shape (multiple physics bodies)
 */
export function isCircleIntersectingCompositeShape(center: Vector2, radius: number, shape: Shape): boolean {
  if (!shape.parts || shape.parts.length === 0) {
    return false;
  }
  
  // Check collision against each part of the composite shape
  for (const part of shape.parts) {
    if (part.vertices && part.vertices.length >= 3) {
      if (isCircleIntersectingPhysicsBodyVertices(center, radius, part.vertices)) {
        return true;
      }
    }
  }
  
  return false;
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
 * For concave shapes like stars, use original vertices instead of decomposed physics body vertices
 */
export function isCircleIntersectingVertexShape(center: Vector2, radius: number, shape: Shape): boolean {
  // For shapes defined by vertices (arrow, chevron, star, horseshoe, path shapes)
  
  // IMPORTANT: For path-based shapes (stars, arrows, etc), use original vertices if available
  // This avoids collision detection against the convex hull or decomposed parts
  if (shape.vertices && shape.vertices.length > 0) {
    // Original vertices are in local space, need to transform to world space
    const cos = Math.cos(shape.body.angle);
    const sin = Math.sin(shape.body.angle);
    
    // Transform vertices to world coordinates
    const worldVertices: Vector2[] = shape.vertices.map(v => ({
      x: v.x * cos - v.y * sin + shape.body.position.x,
      y: v.x * sin + v.y * cos + shape.body.position.y
    }));
    
    // Check if circle center is inside the polygon
    if (isPointInPolygon(center, worldVertices)) {
      return true;
    }
    
    // Check if circle intersects any edge of the polygon
    for (let i = 0; i < worldVertices.length; i++) {
      const v1 = worldVertices[i];
      const v2 = worldVertices[(i + 1) % worldVertices.length];
      
      if (isCircleIntersectingLineSegment(center, radius, v1, v2)) {
        return true;
      }
    }
    
    return false;
  }
  
  // Fallback to physics body vertices if no original vertices available
  if (!shape.body.vertices || shape.body.vertices.length === 0) {
    return false;
  }
  
  // Matter.js vertices are already transformed to world coordinates
  const worldVertices = shape.body.vertices;
  
  // Check if circle center is inside the polygon
  if (isPointInPolygon(center, worldVertices)) {
    return true;
  }
  
  // Check if circle intersects any edge of the polygon
  for (let i = 0; i < worldVertices.length; i++) {
    const v1 = worldVertices[i];
    const v2 = worldVertices[(i + 1) % worldVertices.length];
    
    if (isCircleIntersectingLineSegment(center, radius, v1, v2)) {
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
 * 
 * @param screwPosition - Position of the screw center
 * @param screwRadius - Radius of the screw
 * @param shape - Shape to check collision against
 * @param precisCheck - If true, uses two-phase collision detection (broad + narrow phase)
 *                      If false, uses simple bounding box check for gameplay blocking
 * @returns true if the screw area is blocked by the shape
 */
export function isScrewAreaBlocked(
  screwPosition: Vector2, 
  screwRadius: number, 
  shape: Shape, 
  precisCheck: boolean = false
): boolean {
  if (precisCheck) {
    // PRECISE MODE: Two-phase collision detection
    // 1. Broad phase: Quick bounding box check
    // 2. Narrow phase: Exact geometric collision detection with rotation
    return isCircleIntersectingShape(screwPosition, screwRadius + UI_CONSTANTS.screws.blockingMargin, shape);
  } else {
    // GAMEPLAY MODE: Simple bounding box check for broader blocking detection
    // Used for shake animations and general gameplay feedback
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