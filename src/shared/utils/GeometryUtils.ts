/**
 * Shared geometry utilities for screw placement calculations
 */

import { Vector2 } from '@/types/game';
import { Shape } from '@/game/entities/Shape';

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
export function isPointInPolygon(point: Vector2, vertices: Vector2[]): boolean {
  if (vertices.length < 3) return false;
  
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
 * Calculate distance from a point to a line segment
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
 * Get the bounding box of a set of vertices
 */
export function getBoundingBox(vertices: Vector2[]): { min: Vector2; max: Vector2 } {
  if (vertices.length === 0) {
    return { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } };
  }
  
  let minX = vertices[0].x;
  let minY = vertices[0].y;
  let maxX = vertices[0].x;
  let maxY = vertices[0].y;
  
  for (let i = 1; i < vertices.length; i++) {
    minX = Math.min(minX, vertices[i].x);
    minY = Math.min(minY, vertices[i].y);
    maxX = Math.max(maxX, vertices[i].x);
    maxY = Math.max(maxY, vertices[i].y);
  }
  
  return {
    min: { x: minX, y: minY },
    max: { x: maxX, y: maxY }
  };
}

/**
 * Calculate the angle between three points (angle at middle point)
 */
export function calculateAngle(prev: Vector2, curr: Vector2, next: Vector2): number {
  const vec1 = { x: prev.x - curr.x, y: prev.y - curr.y };
  const vec2 = { x: next.x - curr.x, y: next.y - curr.y };
  
  const dot = vec1.x * vec2.x + vec1.y * vec2.y;
  const mag1 = Math.sqrt(vec1.x * vec1.x + vec1.y * vec1.y);
  const mag2 = Math.sqrt(vec2.x * vec2.x + vec2.y * vec2.y);
  
  if (mag1 === 0 || mag2 === 0) return 0;
  
  const cosAngle = dot / (mag1 * mag2);
  const clampedCos = Math.max(-1, Math.min(1, cosAngle));
  
  return Math.acos(clampedCos);
}

/**
 * Calculate cross product of two 2D vectors
 */
export function crossProduct(v1: Vector2, v2: Vector2): number {
  return v1.x * v2.y - v1.y * v2.x;
}

/**
 * Normalize a vector to unit length
 */
export function normalize(vector: Vector2): Vector2 {
  const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  if (magnitude === 0) return { x: 0, y: 0 };
  
  return {
    x: vector.x / magnitude,
    y: vector.y / magnitude
  };
}

/**
 * Get perpendicular vector (rotated 90 degrees counter-clockwise)
 */
export function getPerpendicular(vector: Vector2): Vector2 {
  return { x: -vector.y, y: vector.x };
}

/**
 * Interpolate between two points
 */
export function interpolate(start: Vector2, end: Vector2, t: number): Vector2 {
  return {
    x: start.x + (end.x - start.x) * t,
    y: start.y + (end.y - start.y) * t
  };
}

/**
 * Get the center point of a polygon
 */
export function getCentroid(vertices: Vector2[]): Vector2 {
  if (vertices.length === 0) return { x: 0, y: 0 };
  
  let x = 0;
  let y = 0;
  
  for (const vertex of vertices) {
    x += vertex.x;
    y += vertex.y;
  }
  
  return {
    x: x / vertices.length,
    y: y / vertices.length
  };
}

/**
 * Get vertices for basic shapes
 */
export function getShapeVertices(shape: Shape): Vector2[] {
  const { x, y } = shape.position;
  const width = shape.width || 0;
  const height = shape.height || 0;
  const radius = shape.radius || 0;
  const sides = shape.sides || 0;
  const originalVertices = shape.vertices;
  
  // Use original vertices if available (path shapes)
  if (originalVertices && originalVertices.length > 0) {
    return originalVertices.map(vertex => ({
      x: x + vertex.x,
      y: y + vertex.y
    }));
  }
  
  // Handle polygon shapes
  if (shape.type === 'polygon') {
    if (radius > 0 && sides > 0) {
      const vertices: Vector2[] = [];
      
      // Generate polygon vertices matching Matter.js orientation
      for (let i = 0; i < sides; i++) {
        const angle = (i * Math.PI * 2) / sides + (Math.PI / sides) + shape.rotation;
        vertices.push({
          x: x + Math.cos(angle) * radius,
          y: y + Math.sin(angle) * radius
        });
      }
      
      return vertices;
    }
  }
  
  // Generate vertices for basic shapes
  if (shape.type === 'circle' && radius > 0) {
    // Circle - approximate with polygon
    const segments = Math.max(8, Math.floor(radius / 5));
    const vertices: Vector2[] = [];
    
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * 2 * Math.PI;
      vertices.push({
        x: x + Math.cos(angle) * radius,
        y: y + Math.sin(angle) * radius
      });
    }
    
    return vertices;
  }
  
  // Rectangle
  if (shape.type === 'rectangle' && width > 0 && height > 0) {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    
    return [
      { x: x - halfWidth, y: y - halfHeight },
      { x: x + halfWidth, y: y - halfHeight },
      { x: x + halfWidth, y: y + halfHeight },
      { x: x - halfWidth, y: y + halfHeight }
    ];
  }
  
  // Fallback to empty array
  return [];
}

/**
 * Check if a circle intersects with a polygon
 */
export function isCircleIntersectingPolygon(center: Vector2, radius: number, vertices: Vector2[]): boolean {
  // Check if center is inside polygon
  if (isPointInPolygon(center, vertices)) {
    return true;
  }
  
  // Check if circle intersects any edge
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
 * Generate evenly spaced points along a polygon perimeter
 */
export function generatePerimeterPoints(vertices: Vector2[], count: number, margin: number = 0): Vector2[] {
  if (vertices.length < 3 || count <= 0) return [];
  
  // Calculate total perimeter
  let totalLength = 0;
  const edgeLengths: number[] = [];
  
  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length;
    const length = Math.sqrt(
      Math.pow(vertices[j].x - vertices[i].x, 2) + 
      Math.pow(vertices[j].y - vertices[i].y, 2)
    );
    edgeLengths.push(length);
    totalLength += length;
  }
  
  if (totalLength === 0) return [];
  
  // Generate points along perimeter
  const points: Vector2[] = [];
  const spacing = totalLength / count;
  
  let currentDistance = margin; // Start with margin offset
  let edgeIndex = 0;
  let edgeProgress = 0;
  
  for (let i = 0; i < count; i++) {
    // Find which edge this point falls on
    while (edgeProgress + edgeLengths[edgeIndex] < currentDistance && edgeIndex < vertices.length - 1) {
      edgeProgress += edgeLengths[edgeIndex];
      edgeIndex++;
    }
    
    if (edgeIndex >= vertices.length) break;
    
    // Calculate position along current edge
    const edgeT = (currentDistance - edgeProgress) / edgeLengths[edgeIndex];
    const start = vertices[edgeIndex];
    const end = vertices[(edgeIndex + 1) % vertices.length];
    
    points.push(interpolate(start, end, edgeT));
    
    currentDistance += spacing;
  }
  
  return points;
}

/**
 * Calculate area of a shape based on its type and properties
 */
export function calculateShapeArea(shape: Shape): number {
  switch (shape.type) {
    case 'rectangle':
      const width = shape.width || 60;
      const height = shape.height || 60;
      return width * height;
    case 'circle':
      const radius = shape.radius || 30;
      return Math.PI * radius * radius;
    case 'polygon':
      const polygonRadius = shape.radius || 30;
      const polygonSides = shape.sides || 5;
      // General formula for regular polygon area: (n * r^2 * sin(2π/n)) / 2
      return (polygonSides * polygonRadius * polygonRadius * Math.sin(2 * Math.PI / polygonSides)) / 2;
    case 'capsule':
      const capsuleWidth = shape.width || 120;
      const capsuleHeight = shape.height || 34; // Default capsule height
      const capsuleRadius = capsuleHeight / 2;
      // Area = rectangle area + 2 semicircles (which equal one full circle)
      const rectArea = (capsuleWidth - capsuleHeight) * capsuleHeight;
      const circleArea = Math.PI * capsuleRadius * capsuleRadius;
      return rectArea + circleArea;
    case 'arrow':
    case 'chevron':
    case 'star':
    case 'horseshoe':
      // For vertex-based shapes, calculate area from bounds
      const bounds = shape.getBounds();
      // Use 70% of bounding box area as approximation for complex shapes
      return bounds.width * bounds.height * 0.7;
    default:
      return 3600; // Default fallback area
  }
}

/**
 * Select non-overlapping positions from a list of candidate positions
 */
export function selectNonOverlappingPositions(
  positions: Vector2[], 
  count: number, 
  minSeparation: number
): Vector2[] {
  if (positions.length === 0) return [];
  if (count === 1) return [positions[positions.length - 1]]; // Use center (last position)
  
  const selected: Vector2[] = [];
  const available = [...positions];
  
  // Shuffle positions for random selection
  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [available[i], available[j]] = [available[j], available[i]];
  }
  
  for (const position of available) {
    if (selected.length >= count) break;
    
    // Check if this position overlaps with any selected position
    const overlaps = selected.some(selected => {
      const distance = Math.sqrt(
        Math.pow(position.x - selected.x, 2) + 
        Math.pow(position.y - selected.y, 2)
      );
      return distance < minSeparation;
    });
    
    if (!overlaps) {
      selected.push(position);
    }
  }
  
  // If we couldn't place enough screws due to overlap, ensure we have at least the center
  if (selected.length === 0 && positions.length > 0) {
    selected.push(positions[positions.length - 1]); // Center is typically last
  }
  
  return selected;
}