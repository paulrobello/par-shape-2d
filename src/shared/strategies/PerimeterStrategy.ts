/**
 * Perimeter placement strategy for screw positioning
 * Consolidates logic from both game and editor implementations
 */

import { Vector2 } from '@/types/game';
import { Shape } from '@/game/entities/Shape';
import { BasePlacementStrategy, PlacementContext, PlacementConfig, ValidationResult } from './ScrewPlacementStrategy';
import { getShapeVertices, generatePerimeterPoints, getCentroid } from '@/shared/utils/GeometryUtils';

export class PerimeterStrategy extends BasePlacementStrategy {
  getName(): string {
    return 'perimeter';
  }

  getDefaultConfig(): Partial<PlacementConfig> {
    return {
      strategy: 'perimeter',
      perimeterPoints: 8,
      perimeterMargin: 30,
      minSeparation: this.defaultMinSeparation
    };
  }

  validateConfig(config: PlacementConfig): ValidationResult {
    const result = super.validateConfig(config);
    
    if (config.perimeterPoints !== undefined && config.perimeterPoints < 1) {
      result.errors.push('Perimeter points must be at least 1');
      result.isValid = false;
    }
    
    if (config.perimeterMargin !== undefined && config.perimeterMargin < 0) {
      result.errors.push('Perimeter margin must be non-negative');
      result.isValid = false;
    }
    
    return result;
  }

  calculatePositions(context: PlacementContext): Vector2[] {
    const { shape, config } = context;
    const perimeterPoints = config.perimeterPoints || 8;
    const margin = config.perimeterMargin || 30;
    const minSeparation = config.minSeparation || this.defaultMinSeparation;
    
    let positions: Vector2[] = [];
    
    // Handle different shape types
    if (['arrow', 'chevron', 'star', 'horseshoe'].includes(shape.type)) {
      positions = this.calculatePathShapePerimeter(shape, perimeterPoints, margin);
    } else if (shape.radius && shape.radius > 0) {
      positions = this.calculateCirclePerimeter(shape, perimeterPoints, margin);
    } else {
      positions = this.calculatePolygonPerimeter(shape, perimeterPoints, margin);
    }
    
    // Apply minimum separation filtering
    return this.applyMinSeparation(positions, minSeparation);
  }


  private calculatePathShapePerimeter(shape: Shape, perimeterPoints: number, margin: number): Vector2[] {
    const vertices = getShapeVertices(shape);
    if (vertices.length < 3) return [];
    
    // Use the shape's actual vertices for path-based shapes
    const positions = generatePerimeterPoints(vertices, perimeterPoints, margin);
    
    // Apply margin by moving points inward toward the center
    const center = getCentroid(vertices);
    
    return positions.map(point => {
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

  private calculateCirclePerimeter(shape: Shape, perimeterPoints: number, margin: number): Vector2[] {
    const { x, y } = shape.position;
    const radius = shape.radius || 0;
    const adjustedRadius = Math.max(10, radius - margin);
    const positions: Vector2[] = [];
    
    for (let i = 0; i < perimeterPoints; i++) {
      const angle = (2 * Math.PI * i) / perimeterPoints;
      positions.push({
        x: x + Math.cos(angle) * adjustedRadius,
        y: y + Math.sin(angle) * adjustedRadius
      });
    }
    
    return positions;
  }

  private calculatePolygonPerimeter(shape: Shape, perimeterPoints: number, margin: number): Vector2[] {
    const vertices = getShapeVertices(shape);
    if (vertices.length < 3) return [];
    
    // Generate evenly distributed points along the polygon perimeter
    const positions = generatePerimeterPoints(vertices, perimeterPoints, margin);
    
    // Apply additional margin by moving points inward
    const center = getCentroid(vertices);
    
    return positions.map(point => {
      const dx = point.x - center.x;
      const dy = point.y - center.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= margin) {
        return point;
      }
      
      const scale = (distance - margin) / distance;
      return {
        x: center.x + dx * scale,
        y: center.y + dy * scale
      };
    });
  }

  /**
   * Get perimeter points for shapes with a dedicated method (legacy support)
   */
  private getShapePerimeterPoints(shape: Shape, count: number): Vector2[] {
    // Check if shape has getPerimeterPoints method (path shapes)
    if ('getPerimeterPoints' in shape && typeof shape.getPerimeterPoints === 'function') {
      return (shape as Shape & { getPerimeterPoints: (count: number) => Vector2[] }).getPerimeterPoints(count);
    }
    
    // Fallback to vertex-based calculation
    const vertices = getShapeVertices(shape);
    return generatePerimeterPoints(vertices, count, 0);
  }
}