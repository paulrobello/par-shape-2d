/**
 * Grid placement strategy for screw positioning
 * Consolidates logic from both game and editor implementations
 */

import { Vector2 } from '@/types/game';
import { Shape } from '@/game/entities/Shape';
import { BasePlacementStrategy, PlacementContext, PlacementConfig, ValidationResult } from './ScrewPlacementStrategy';
import { getShapeVertices, isPointInPolygon, getBoundingBox, getCentroid } from '@/shared/utils/GeometryUtils';

export class GridStrategy extends BasePlacementStrategy {
  getName(): string {
    return 'grid';
  }

  getDefaultConfig(): Partial<PlacementConfig> {
    return {
      strategy: 'grid',
      gridSpacing: 40,
      minSeparation: this.defaultMinSeparation
    };
  }

  validateConfig(config: PlacementConfig): ValidationResult {
    const result = super.validateConfig(config);
    
    if (config.gridSpacing !== undefined && config.gridSpacing < 10) {
      result.errors.push('Grid spacing must be at least 10 pixels');
      result.isValid = false;
    }
    
    return result;
  }

  calculatePositions(context: PlacementContext): Vector2[] {
    const { shape, config } = context;
    const gridSpacing = config.gridSpacing || 40;
    const minSeparation = config.minSeparation || this.defaultMinSeparation;
    const margin = 20; // Fixed margin for grid positioning
    
    const positions = this.generateGridPositions(shape, gridSpacing, margin);
    
    // Apply minimum separation filtering
    return this.applyMinSeparation(positions, minSeparation);
  }

  private generateGridPositions(shape: Shape, gridSpacing: number, margin: number): Vector2[] {
    const positions: Vector2[] = [];
    const vertices = getShapeVertices(shape);
    
    if (vertices.length === 0) return positions;
    
    const boundingBox = getBoundingBox(vertices);
    const center = getCentroid(vertices);
    
    // Calculate grid bounds with margin
    const gridWidth = Math.max(gridSpacing, boundingBox.max.x - boundingBox.min.x - 2 * margin);
    const gridHeight = Math.max(gridSpacing, boundingBox.max.y - boundingBox.min.y - 2 * margin);
    
    // Calculate number of grid points in each direction
    const cols = Math.max(1, Math.floor(gridWidth / gridSpacing) + 1);
    const rows = Math.max(1, Math.floor(gridHeight / gridSpacing) + 1);
    
    // Generate grid positions
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = center.x - gridWidth / 2 + (col * gridSpacing);
        const y = center.y - gridHeight / 2 + (row * gridSpacing);
        const point = { x, y };
        
        // Check if point is inside the shape
        if (this.isPointInsideShape(shape, point, margin)) {
          positions.push(point);
        }
      }
    }
    
    return positions;
  }

  private isPointInsideShape(shape: Shape, point: Vector2, margin: number): boolean {
    const vertices = getShapeVertices(shape);
    
    // For circles, use distance-based check
    if (shape.radius && shape.radius > 0) {
      const center = { x: shape.position.x, y: shape.position.y };
      const distance = this.calculateDistance(point, center);
      return distance <= (shape.radius - margin);
    }
    
    // For path shapes and polygons, use ray-casting algorithm
    if (vertices.length >= 3) {
      // First check if point is inside the polygon
      if (!isPointInPolygon(point, vertices)) {
        return false;
      }
      
      // Additional check: ensure point is not too close to edges (margin enforcement)
      if (margin > 0) {
        return this.getDistanceToNearestEdge(point, vertices) >= margin;
      }
      
      return true;
    }
    
    // For rectangles, use bounding box check
    const width = shape.width || 0;
    const height = shape.height || 0;
    const { x, y } = shape.position;
    const halfWidth = width / 2 - margin;
    const halfHeight = height / 2 - margin;
    
    return (
      point.x >= x - halfWidth &&
      point.x <= x + halfWidth &&
      point.y >= y - halfHeight &&
      point.y <= y + halfHeight
    );
  }

  private getDistanceToNearestEdge(point: Vector2, vertices: Vector2[]): number {
    let minDistance = Infinity;
    
    for (let i = 0; i < vertices.length; i++) {
      const j = (i + 1) % vertices.length;
      const distance = this.distanceFromPointToLineSegment(point, vertices[i], vertices[j]);
      minDistance = Math.min(minDistance, distance);
    }
    
    return minDistance;
  }

  private distanceFromPointToLineSegment(point: Vector2, lineStart: Vector2, lineEnd: Vector2): number {
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
}