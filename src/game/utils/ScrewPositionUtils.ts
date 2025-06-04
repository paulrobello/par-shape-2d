/**
 * Static utility functions for calculating screw positions on shapes
 * Extracted from ScrewManager to improve modularity
 */

import { Vector2 } from '@/types/game';
import { Shape } from '@/game/entities/Shape';
import { ShapeDefinition } from '@/types/shapes';
import { ShapeRegistry } from '@/game/systems/ShapeRegistry';
import { DEBUG_CONFIG } from '@/game/utils/Constants';

/**
 * Calculate optimal screw positions for a shape using JSON-defined strategy
 */
export function calculateScrewPositions(shape: Shape, count: number): Vector2[] {
  const definition = getShapeDefinition(shape);
  if (!definition) {
    if (DEBUG_CONFIG.logShapeDebug) {
      console.warn(`No definition found for shape ${shape.id}, using legacy placement`);
    }
    return calculateScrewPositionsLegacy(shape, count);
  }

  const positions = getPositionsForStrategy(shape, definition);
  const maxScrews = getMaxScrewsFromDefinition(shape, definition);
  const actualCount = Math.min(count, maxScrews);
  
  const minSeparation = definition.screwPlacement?.minSeparation || 48;
  return selectNonOverlappingPositions(positions, actualCount, minSeparation);
}

/**
 * Legacy screw position calculation for backwards compatibility
 */
export function calculateScrewPositionsLegacy(shape: Shape, count: number): Vector2[] {
  const positions = getShapeScrewLocations(shape);
  const maxScrews = getMaxScrewsForShape(shape, positions);
  const actualCount = Math.min(count, maxScrews);
  
  return selectNonOverlappingPositions(
    [...positions.corners, positions.center, ...positions.alternates],
    actualCount,
    48 // Default minimum separation
  );
}

/**
 * Get maximum screws allowed for a shape based on its area and JSON definition
 */
export function getMaxScrewsForShape(shape: Shape, positions: { corners: Vector2[], center: Vector2, alternates: Vector2[] }): number {
  const area = getShapeArea(shape);
  const availablePositions = positions.corners.length + 1 + positions.alternates.length; // corners + center + alternates
  
  // Area-based limits
  if (area < 2500) return Math.min(1, availablePositions);
  if (area < 4000) return Math.min(2, availablePositions);
  if (area < 6000) return Math.min(3, availablePositions);
  if (area < 10000) return Math.min(4, availablePositions);
  if (area < 15000) return Math.min(5, availablePositions);
  return Math.min(6, availablePositions);
}

/**
 * Select non-overlapping positions from available positions
 */
export function selectNonOverlappingPositions(positions: Vector2[], count: number, minSeparation: number): Vector2[] {
  if (positions.length === 0) return [];
  if (count <= 0) return [];
  if (count === 1) return [positions[0]]; // Always use first position for single screw
  
  const selected: Vector2[] = [positions[0]]; // Always include first position
  
  for (let i = 1; i < positions.length && selected.length < count; i++) {
    const candidate = positions[i];
    let isValid = true;
    
    for (const existing of selected) {
      const distance = Math.sqrt(
        Math.pow(candidate.x - existing.x, 2) + Math.pow(candidate.y - existing.y, 2)
      );
      if (distance < minSeparation) {
        isValid = false;
        break;
      }
    }
    
    if (isValid) {
      selected.push(candidate);
    }
  }
  
  return selected;
}

/**
 * Get potential screw locations for different shape types
 */
export function getShapeScrewLocations(shape: Shape): { corners: Vector2[], center: Vector2, alternates: Vector2[] } {
  const corners: Vector2[] = [];
  const alternates: Vector2[] = [];
  const center = { x: shape.body.position.x, y: shape.body.position.y };
  
  const margin = 30; // Distance from edge
  
  // Get bounds for calculations
  const bounds = shape.body.bounds;
  const width = bounds.max.x - bounds.min.x;
  const height = bounds.max.y - bounds.min.y;
  
  if (shape.type === 'circle') {
    const radius = shape.radius || width / 2;
    const effectiveRadius = Math.max(12, radius - margin); // Minimum 12px from center
    
    // Cardinal directions (N, E, S, W)
    corners.push(
      { x: center.x, y: center.y - effectiveRadius },           // North
      { x: center.x + effectiveRadius, y: center.y },           // East  
      { x: center.x, y: center.y + effectiveRadius },           // South
      { x: center.x - effectiveRadius, y: center.y }            // West
    );
    
    // Diagonal directions as alternates
    const diagRadius = effectiveRadius * 0.707; // cos(45°) ≈ 0.707
    alternates.push(
      { x: center.x + diagRadius, y: center.y - diagRadius },   // NE
      { x: center.x + diagRadius, y: center.y + diagRadius },   // SE  
      { x: center.x - diagRadius, y: center.y + diagRadius },   // SW
      { x: center.x - diagRadius, y: center.y - diagRadius }    // NW
    );
  } else if (shape.type === 'rectangle' || shape.type === 'polygon') {
    const halfWidth = Math.max(margin, width / 2 - margin);
    const halfHeight = Math.max(margin, height / 2 - margin);
    
    // For very narrow shapes, use edge centers instead of corners
    if (width < margin * 2) {
      // Very narrow - use top and bottom edge centers only
      corners.push(
        { x: center.x, y: center.y - halfHeight },
        { x: center.x, y: center.y + halfHeight }
      );
    } else if (height < margin * 2) {
      // Very short - use left and right edge centers only  
      corners.push(
        { x: center.x - halfWidth, y: center.y },
        { x: center.x + halfWidth, y: center.y }
      );
    } else {
      // Normal rectangle - use corners
      corners.push(
        { x: center.x - halfWidth, y: center.y - halfHeight }, // Top-left
        { x: center.x + halfWidth, y: center.y - halfHeight }, // Top-right
        { x: center.x + halfWidth, y: center.y + halfHeight }, // Bottom-right
        { x: center.x - halfWidth, y: center.y + halfHeight }  // Bottom-left
      );
      
      // Edge centers as alternates
      alternates.push(
        { x: center.x, y: center.y - halfHeight },              // Top edge
        { x: center.x + halfWidth, y: center.y },               // Right edge
        { x: center.x, y: center.y + halfHeight },              // Bottom edge
        { x: center.x - halfWidth, y: center.y }                // Left edge
      );
    }
  } else if (shape.type === 'capsule') {
    // For capsule shapes, distribute along the horizontal center line
    const effectiveWidth = Math.max(30, width - 10); // 5px margin from each end
    const count = 4; // Maximum screws for typical capsule
    
    for (let i = 0; i < count; i++) {
      const t = count > 1 ? i / (count - 1) : 0.5; // Normalized position (0 to 1)
      const x = center.x - effectiveWidth / 2 + t * effectiveWidth;
      if (i < 2) {
        corners.push({ x, y: center.y });
      } else {
        alternates.push({ x, y: center.y });
      }
    }
  }
  
  return { corners, center, alternates };
}

/**
 * Calculate shape area for screw limit determination
 */
export function getShapeArea(shape: Shape): number {
  if (shape.type === 'circle') {
    const radius = shape.radius || 50;
    return Math.PI * radius * radius;
  } else if (shape.type === 'rectangle') {
    const bounds = shape.body.bounds;
    const width = bounds.max.x - bounds.min.x;
    const height = bounds.max.y - bounds.min.y;
    return width * height;
  } else if (shape.type === 'polygon') {
    if (shape.vertices && shape.vertices.length > 0) {
      // Use shoelace formula for polygon area
      let area = 0;
      const n = shape.vertices.length;
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        area += shape.vertices[i].x * shape.vertices[j].y;
        area -= shape.vertices[j].x * shape.vertices[i].y;
      }
      return Math.abs(area) / 2;
    } else {
      // Fallback to bounding box
      const bounds = shape.body.bounds;
      const width = bounds.max.x - bounds.min.x;
      const height = bounds.max.y - bounds.min.y;
      return width * height;
    }
  } else if (shape.type === 'capsule') {
    const bounds = shape.body.bounds;
    const width = bounds.max.x - bounds.min.x;
    const height = bounds.max.y - bounds.min.y;
    return width * height; // Approximate area
  }
  
  // Default fallback
  return 2500;
}

/**
 * Get shape definition from ShapeRegistry
 */
export function getShapeDefinition(shape: Shape): ShapeDefinition | null {
  const definitionId = getDefinitionIdFromShape(shape);
  if (!definitionId) return null;
  
  const registry = ShapeRegistry.getInstance();
  return registry.getDefinition(definitionId) || null;
}

/**
 * Determine the definition ID from a shape instance
 */
export function getDefinitionIdFromShape(shape: Shape): string | null {
  // Map shape types to definition IDs
  const typeMapping: Record<string, string> = {
    'circle': 'circle',
    'rectangle': 'rectangle', 
    'polygon': 'polygon',
    'capsule': 'capsule',
    // Path-based shapes
    'arrow': 'arrow',
    'chevron': 'chevron',
    'star': 'star',
    'horseshoe': 'horseshoe'
  };
  
  return typeMapping[shape.type] || null;
}

/**
 * Get positions using JSON-defined strategy
 */
export function getPositionsForStrategy(shape: Shape, definition: ShapeDefinition): Vector2[] {
  const strategy = definition.screwPlacement?.strategy || 'corners';
  
  switch (strategy) {
    case 'corners':
      return getCornerPositions(shape);
    case 'perimeter':
      return getPerimeterPositions(shape, definition);
    case 'capsule':
      return getCapsulePositions(shape);
    case 'custom':
      return getCustomPositions(shape, definition);
    case 'grid':
      return getGridPositions(shape, definition);
    default:
      if (DEBUG_CONFIG.logShapeDebug) {
        console.warn(`Unknown screw placement strategy: ${strategy}`);
      }
      return getCornerPositions(shape);
  }
}

/**
 * Get corner-based positions for shapes
 */
export function getCornerPositions(shape: Shape): Vector2[] {
  // For path-based shapes, identify key vertices as "corners"
  if (shape.type === 'arrow' || shape.type === 'chevron' || shape.type === 'star' || shape.type === 'horseshoe') {
    return getPathShapeCorners(shape);
  }
  
  // For regular shapes, use existing logic
  return getShapeScrewLocations(shape).corners;
}

/**
 * Get corner positions for path-based shapes by analyzing vertices
 */
function getPathShapeCorners(shape: Shape): Vector2[] {
  if (!shape.body.vertices || shape.body.vertices.length < 3) {
    return [];
  }
  
  const vertices = shape.body.vertices;
  const corners: Vector2[] = [];
  const margin = 30; // Distance from edge
  
  // For path shapes, we'll identify corners by finding vertices with significant angle changes
  // This works well for shapes like arrows, stars, etc.
  const angleThreshold = Math.PI / 4; // 45 degrees
  
  for (let i = 0; i < vertices.length; i++) {
    const prev = vertices[(i - 1 + vertices.length) % vertices.length];
    const curr = vertices[i];
    const next = vertices[(i + 1) % vertices.length];
    
    // Calculate vectors
    const v1 = { x: curr.x - prev.x, y: curr.y - prev.y };
    const v2 = { x: next.x - curr.x, y: next.y - curr.y };
    
    // Calculate angle between vectors
    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
    
    if (mag1 > 0 && mag2 > 0) {
      const cosAngle = dot / (mag1 * mag2);
      const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
      
      // If angle is significant (sharp corner), consider it a corner
      if (angle > angleThreshold) {
        // Move the corner point inward by margin amount
        const center = { x: shape.body.position.x, y: shape.body.position.y };
        const dx = curr.x - center.x;
        const dy = curr.y - center.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > margin) {
          const scale = (distance - margin) / distance;
          corners.push({
            x: center.x + dx * scale,
            y: center.y + dy * scale
          });
        } else {
          corners.push({ x: curr.x, y: curr.y });
        }
      }
    }
  }
  
  // If we didn't find enough corners, fall back to extremal points
  if (corners.length < 2) {
    return getPathShapeExtremalPoints(shape);
  }
  
  return corners;
}

/**
 * Get extremal points (leftmost, rightmost, topmost, bottommost) for path shapes
 */
function getPathShapeExtremalPoints(shape: Shape): Vector2[] {
  if (!shape.body.vertices || shape.body.vertices.length < 3) {
    return [];
  }
  
  const vertices = shape.body.vertices;
  const margin = 30;
  const center = { x: shape.body.position.x, y: shape.body.position.y };
  
  // Find extremal vertices
  let leftmost = vertices[0];
  let rightmost = vertices[0];
  let topmost = vertices[0];
  let bottommost = vertices[0];
  
  vertices.forEach(vertex => {
    if (vertex.x < leftmost.x) leftmost = vertex;
    if (vertex.x > rightmost.x) rightmost = vertex;
    if (vertex.y < topmost.y) topmost = vertex;
    if (vertex.y > bottommost.y) bottommost = vertex;
  });
  
  const extremalPoints = [leftmost, rightmost, topmost, bottommost];
  const corners: Vector2[] = [];
  
  // Remove duplicates and apply margin
  extremalPoints.forEach(point => {
    const isDuplicate = corners.some(corner => 
      Math.abs(corner.x - point.x) < 10 && Math.abs(corner.y - point.y) < 10
    );
    
    if (!isDuplicate) {
      const dx = point.x - center.x;
      const dy = point.y - center.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > margin) {
        const scale = (distance - margin) / distance;
        corners.push({
          x: center.x + dx * scale,
          y: center.y + dy * scale
        });
      } else {
        corners.push({ x: point.x, y: point.y });
      }
    }
  });
  
  return corners;
}

/**
 * Get perimeter-based positions for path shapes
 */
export function getPerimeterPositions(shape: Shape, definition: ShapeDefinition): Vector2[] {
  const perimeterPoints = definition.screwPlacement?.perimeterPoints || 8;
  const margin = definition.screwPlacement?.perimeterMargin || 30;
  
  // For path-based shapes, use the Shape's getPerimeterPoints method which properly handles actual vertices
  if (shape.type === 'arrow' || shape.type === 'chevron' || shape.type === 'star' || shape.type === 'horseshoe') {
    const perimeter = shape.getPerimeterPoints(perimeterPoints);
    
    // Apply margin by moving points inward toward the center
    const center = { x: shape.body.position.x, y: shape.body.position.y };
    return perimeter.map(point => {
      const dx = point.x - center.x;
      const dy = point.y - center.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= margin) {
        // Point is too close to center, keep it as is
        return point;
      }
      
      // Move point inward by margin amount
      const scale = (distance - margin) / distance;
      return {
        x: center.x + dx * scale,
        y: center.y + dy * scale
      };
    });
  }
  
  // Fallback for non-path shapes: use circular distribution
  const positions: Vector2[] = [];
  const center = { x: shape.body.position.x, y: shape.body.position.y };
  const bounds = shape.body.bounds;
  const width = bounds.max.x - bounds.min.x;
  const height = bounds.max.y - bounds.min.y;
  const avgRadius = Math.min(width, height) / 2 - margin;
  
  for (let i = 0; i < perimeterPoints; i++) {
    const angle = (2 * Math.PI * i) / perimeterPoints;
    const x = center.x + Math.cos(angle) * avgRadius;
    const y = center.y + Math.sin(angle) * avgRadius;
    positions.push({ x, y });
  }
  
  return positions;
}

/**
 * Get capsule-specific positions
 */
export function getCapsulePositions(shape: Shape): Vector2[] {
  return getShapeScrewLocations(shape).corners;
}

/**
 * Get grid-based positions for shapes
 */
export function getGridPositions(shape: Shape, definition: ShapeDefinition): Vector2[] {
  const positions: Vector2[] = [];
  const center = { x: shape.body.position.x, y: shape.body.position.y };
  const gridSpacing = definition.screwPlacement?.gridSpacing || 40;
  const margin = 20; // Use a fixed margin since gridMargin is not in the type definition
  
  // Get shape bounds
  const bounds = shape.body.bounds;
  const width = bounds.max.x - bounds.min.x;
  const height = bounds.max.y - bounds.min.y;
  
  // Calculate grid bounds with margin
  const gridWidth = Math.max(gridSpacing, width - 2 * margin);
  const gridHeight = Math.max(gridSpacing, height - 2 * margin);
  
  // Calculate number of grid points in each direction
  const cols = Math.max(1, Math.floor(gridWidth / gridSpacing) + 1);
  const rows = Math.max(1, Math.floor(gridHeight / gridSpacing) + 1);
  
  // Generate grid positions
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = center.x - gridWidth / 2 + (col * gridSpacing);
      const y = center.y - gridHeight / 2 + (row * gridSpacing);
      
      // Check if point is inside the shape bounds (with margin)
      if (isPointInsideShape(shape, { x, y }, margin)) {
        positions.push({ x, y });
      }
    }
  }
  
  return positions;
}

/**
 * Check if a point is inside a shape with margin
 */
function isPointInsideShape(shape: Shape, point: Vector2, margin: number): boolean {
  const bounds = shape.body.bounds;
  
  // Basic bounds check with margin
  if (point.x < bounds.min.x + margin || point.x > bounds.max.x - margin ||
      point.y < bounds.min.y + margin || point.y > bounds.max.y - margin) {
    return false;
  }
  
  // For path-based shapes, do more precise collision detection
  if (shape.type === 'arrow' || shape.type === 'chevron' || shape.type === 'star' || shape.type === 'horseshoe') {
    return isPointInsidePathShape(shape, point, margin);
  }
  
  // For simple shapes, bounds check is sufficient
  return true;
}

/**
 * Check if point is inside a path-based shape using ray casting
 */
function isPointInsidePathShape(shape: Shape, point: Vector2, margin: number): boolean {
  // Use the shape's body vertices for accurate collision detection
  if (!shape.body.vertices || shape.body.vertices.length < 3) {
    return false;
  }
  
  const vertices = shape.body.vertices;
  let inside = false;
  
  // Ray casting algorithm
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i].x;
    const yi = vertices[i].y;
    const xj = vertices[j].x;
    const yj = vertices[j].y;
    
    if (((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  // If inside, check distance from edges for margin
  if (inside && margin > 0) {
    return getDistanceToNearestEdge(point, vertices) >= margin;
  }
  
  return inside;
}

/**
 * Get distance from point to nearest edge of polygon
 */
function getDistanceToNearestEdge(point: Vector2, vertices: Matter.Vector[]): number {
  let minDistance = Infinity;
  
  for (let i = 0; i < vertices.length; i++) {
    const v1 = vertices[i];
    const v2 = vertices[(i + 1) % vertices.length];
    const distance = distanceFromPointToLineSegment(point, v1, v2);
    minDistance = Math.min(minDistance, distance);
  }
  
  return minDistance;
}

/**
 * Calculate distance from point to line segment
 */
function distanceFromPointToLineSegment(point: Vector2, lineStart: Matter.Vector, lineEnd: Matter.Vector): number {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  
  if (lenSq === 0) {
    // Line segment is a point
    return Math.sqrt(A * A + B * B);
  }
  
  let param = dot / lenSq;
  param = Math.max(0, Math.min(1, param));
  
  const xx = lineStart.x + param * C;
  const yy = lineStart.y + param * D;
  
  const dx = point.x - xx;
  const dy = point.y - yy;
  
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Get custom predefined positions
 */
export function getCustomPositions(shape: Shape, definition: ShapeDefinition): Vector2[] {
  const customPositions = definition.screwPlacement?.customPositions || [];
  const center = { x: shape.body.position.x, y: shape.body.position.y };
  
  return customPositions.map(pos => ({
    x: center.x + pos.position.x,
    y: center.y + pos.position.y
  }));
}

/**
 * Get maximum screws from JSON definition
 */
export function getMaxScrewsFromDefinition(
  shape: Shape,
  definition: ShapeDefinition
): number {
  const screwPlacement = definition.screwPlacement;
  if (!screwPlacement) return 6; // Default maximum
  
  // Check area-based limits first
  if (screwPlacement.maxScrews?.byArea) {
    const area = getShapeArea(shape);
    for (const limit of screwPlacement.maxScrews.byArea) {
      if (area <= limit.maxArea) {
        return limit.screwCount;
      }
    }
  }
  
  // Fall back to absolute maximum
  return screwPlacement.maxScrews?.absolute || 6;
}