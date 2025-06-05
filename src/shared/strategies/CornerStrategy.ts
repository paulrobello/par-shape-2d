/**
 * Corner placement strategy for screw positioning
 * Consolidates logic from both game and editor implementations
 */

import { Vector2 } from '@/types/game';
import { Shape } from '@/game/entities/Shape';
import { BasePlacementStrategy, PlacementContext, PlacementConfig, ValidationResult } from './ScrewPlacementStrategy';
import { getShapeVertices, calculateAngle, crossProduct, getCentroid } from '@/shared/utils/GeometryUtils';

export class CornerStrategy extends BasePlacementStrategy {
  getName(): string {
    return 'corners';
  }

  getDefaultConfig(): Partial<PlacementConfig> {
    return {
      strategy: 'corners',
      cornerMargin: 20,
      minSeparation: this.defaultMinSeparation
    };
  }

  validateConfig(config: PlacementConfig): ValidationResult {
    const result = super.validateConfig(config);
    
    if (config.cornerMargin !== undefined && config.cornerMargin < 0) {
      result.errors.push('Corner margin must be non-negative');
      result.isValid = false;
    }
    
    return result;
  }

  calculatePositions(context: PlacementContext): Vector2[] {
    const { shape, config } = context;
    const margin = config.cornerMargin || 20;
    const minSeparation = config.minSeparation || this.defaultMinSeparation;
    
    let corners: Vector2[] = [];
    
    // Handle different shape types
    if (['arrow', 'chevron', 'star', 'horseshoe'].includes(shape.type)) {
      corners = this.calculatePathShapeCorners(shape, margin);
    } else if (shape.radius && shape.radius > 0) {
      corners = this.calculateCircleCorners(shape, margin);
    } else {
      corners = this.calculatePolygonCorners(shape, margin);
    }
    
    // Apply minimum separation filtering
    return this.applyMinSeparation(corners, minSeparation);
  }


  private calculatePathShapeCorners(shape: Shape, margin: number): Vector2[] {
    const vertices = getShapeVertices(shape);
    if (vertices.length < 3) return [];
    
    // Use multi-algorithm approach combining the best from both implementations
    const angleCorners = this.findCornersByAngle(vertices, 30 * Math.PI / 180); // 30 degree threshold
    const directionCorners = this.findCornersByDirectionChange(vertices);
    const curvatureCorners = this.findCornersByCurvature(vertices);
    const extremalPoints = this.findExtremalPoints(vertices);
    
    // Combine all corner detection methods
    const allCorners = new Set<string>();
    const addCorners = (corners: Vector2[]) => {
      corners.forEach(corner => {
        allCorners.add(`${Math.round(corner.x)},${Math.round(corner.y)}`);
      });
    };
    
    addCorners(angleCorners);
    addCorners(directionCorners);
    addCorners(curvatureCorners);
    addCorners(extremalPoints);
    
    // Convert back to Vector2 array and apply margin
    const uniqueCorners: Vector2[] = Array.from(allCorners).map(coordStr => {
      const [x, y] = coordStr.split(',').map(Number);
      return { x, y };
    });
    
    return this.applyMarginToCorners(uniqueCorners, shape, margin);
  }

  private findCornersByAngle(vertices: Vector2[], angleThreshold: number): Vector2[] {
    const corners: Vector2[] = [];
    
    for (let i = 0; i < vertices.length; i++) {
      const prev = vertices[(i - 1 + vertices.length) % vertices.length];
      const curr = vertices[i];
      const next = vertices[(i + 1) % vertices.length];
      
      const angle = calculateAngle(prev, curr, next);
      
      // Sharp angle indicates a corner
      if (angle < angleThreshold) {
        corners.push(curr);
      }
    }
    
    return corners;
  }

  private findCornersByDirectionChange(vertices: Vector2[]): Vector2[] {
    const corners: Vector2[] = [];
    
    for (let i = 0; i < vertices.length; i++) {
      const prev = vertices[(i - 1 + vertices.length) % vertices.length];
      const curr = vertices[i];
      const next = vertices[(i + 1) % vertices.length];
      
      const vec1 = { x: curr.x - prev.x, y: curr.y - prev.y };
      const vec2 = { x: next.x - curr.x, y: next.y - curr.y };
      
      const cross = crossProduct(vec1, vec2);
      
      // Significant direction change indicates a corner
      if (Math.abs(cross) > 100) { // Threshold for direction change
        corners.push(curr);
      }
    }
    
    return corners;
  }

  private findCornersByCurvature(vertices: Vector2[]): Vector2[] {
    const corners: Vector2[] = [];
    const curvatures: number[] = [];
    
    // Calculate curvature for each vertex
    for (let i = 0; i < vertices.length; i++) {
      const prev = vertices[(i - 1 + vertices.length) % vertices.length];
      const curr = vertices[i];
      const next = vertices[(i + 1) % vertices.length];
      
      const angle = calculateAngle(prev, curr, next);
      const avgDist = (this.calculateDistance(prev, curr) + this.calculateDistance(curr, next)) / 2;
      
      const curvature = avgDist > 0 ? angle / avgDist : 0;
      curvatures.push(curvature);
    }
    
    // Find local maxima in curvature
    const threshold = Math.max(...curvatures) * 0.3; // 30% of max curvature
    
    for (let i = 0; i < vertices.length; i++) {
      const prevCurv = curvatures[(i - 1 + vertices.length) % vertices.length];
      const currCurv = curvatures[i];
      const nextCurv = curvatures[(i + 1) % vertices.length];
      
      if (currCurv > threshold && currCurv >= prevCurv && currCurv >= nextCurv) {
        corners.push(vertices[i]);
      }
    }
    
    return corners;
  }

  private findExtremalPoints(vertices: Vector2[]): Vector2[] {
    if (vertices.length === 0) return [];
    
    let minX = vertices[0];
    let maxX = vertices[0];
    let minY = vertices[0];
    let maxY = vertices[0];
    
    for (const vertex of vertices) {
      if (vertex.x < minX.x) minX = vertex;
      if (vertex.x > maxX.x) maxX = vertex;
      if (vertex.y < minY.y) minY = vertex;
      if (vertex.y > maxY.y) maxY = vertex;
    }
    
    // Remove duplicates
    const extremal = [minX, maxX, minY, maxY];
    const unique: Vector2[] = [];
    
    for (const point of extremal) {
      const isDuplicate = unique.some(existing => 
        Math.abs(existing.x - point.x) < 5 && Math.abs(existing.y - point.y) < 5
      );
      if (!isDuplicate) {
        unique.push(point);
      }
    }
    
    return unique;
  }

  private calculateCircleCorners(shape: Shape, margin: number): Vector2[] {
    const { x, y } = shape.position;
    const radius = shape.radius || 0;
    const adjustedRadius = Math.max(10, radius - margin);
    
    // Four-point cross pattern for circles
    return [
      { x: x + adjustedRadius, y }, // Right
      { x, y: y - adjustedRadius }, // Top
      { x: x - adjustedRadius, y }, // Left
      { x, y: y + adjustedRadius }  // Bottom
    ];
  }

  private calculatePolygonCorners(shape: Shape, margin: number): Vector2[] {
    const vertices = getShapeVertices(shape);
    return this.applyMarginToCorners(vertices, shape, margin);
  }

  private applyMarginToCorners(corners: Vector2[], shape: Shape, margin: number): Vector2[] {
    if (margin <= 0) return corners;
    
    const center = getCentroid(getShapeVertices(shape));
    
    return corners.map(corner => {
      const dx = corner.x - center.x;
      const dy = corner.y - center.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= margin) {
        return corner; // Keep as is if too close to center
      }
      
      // Move inward by margin
      const scale = (distance - margin) / distance;
      return {
        x: center.x + dx * scale,
        y: center.y + dy * scale
      };
    });
  }
}