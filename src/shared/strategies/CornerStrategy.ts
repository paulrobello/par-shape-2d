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
    } else if (shape.type === 'circle') {
      corners = this.calculateCircleCorners(shape, margin);
    } else if (shape.type === 'polygon') {
      corners = this.calculatePolygonCorners(shape, margin);
    } else if (shape.type === 'rectangle') {
      corners = this.calculateRectangleCorners(shape, margin);
    } else {
      // Fallback - try to use body vertices
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

  private calculateRectangleCorners(shape: Shape, margin: number): Vector2[] {
    const { x, y } = shape.position;
    const width = shape.width || 60;
    const height = shape.height || 60;
    const halfWidth = width / 2 - margin;
    const halfHeight = height / 2 - margin;
    
    // Four corners of rectangle
    return [
      { x: x - halfWidth, y: y - halfHeight }, // Top-left
      { x: x + halfWidth, y: y - halfHeight }, // Top-right
      { x: x + halfWidth, y: y + halfHeight }, // Bottom-right
      { x: x - halfWidth, y: y + halfHeight }  // Bottom-left
    ];
  }

  private calculatePolygonCorners(shape: Shape, margin: number): Vector2[] {
    // For polygons, use the actual physics body vertices
    if (!shape.body || !shape.body.vertices || shape.body.vertices.length === 0) {
      return [];
    }
    
    const bodyVertices = shape.body.vertices;
    const center = shape.position;
    
    // Convert Matter.js vertices to our Vector2 format and apply margin
    const corners: Vector2[] = bodyVertices.map(vertex => {
      // Calculate local position relative to shape center
      const localX = vertex.x - center.x;
      const localY = vertex.y - center.y;
      const distance = Math.sqrt(localX * localX + localY * localY);
      
      if (distance <= margin) {
        // Too close to center, return as is
        return { x: vertex.x, y: vertex.y };
      }
      
      // Move inward by margin amount
      const scale = (distance - margin) / distance;
      return {
        x: center.x + localX * scale,
        y: center.y + localY * scale
      };
    });
    
    return corners;
  }

  private applyMarginToCorners(corners: Vector2[], shape: Shape, margin: number): Vector2[] {
    if (margin <= 0) return corners;
    
    const vertices = getShapeVertices(shape);
    const center = getCentroid(vertices);
    
    // For regular polygons, we can use a more sophisticated approach
    return corners.map((corner, index) => {
      // For polygon vertices, calculate the bisector of the angle at this corner
      const prevIndex = (index - 1 + vertices.length) % vertices.length;
      const nextIndex = (index + 1) % vertices.length;
      
      const prev = vertices[prevIndex];
      const next = vertices[nextIndex];
      
      // Calculate vectors from corner to adjacent vertices
      const toPrev = { x: prev.x - corner.x, y: prev.y - corner.y };
      const toNext = { x: next.x - corner.x, y: next.y - corner.y };
      
      // Normalize these vectors
      const toPrevLength = Math.sqrt(toPrev.x * toPrev.x + toPrev.y * toPrev.y);
      const toNextLength = Math.sqrt(toNext.x * toNext.x + toNext.y * toNext.y);
      
      if (toPrevLength === 0 || toNextLength === 0) {
        // Fallback to centroid approach
        const dx = corner.x - center.x;
        const dy = corner.y - center.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= margin) {
          return corner;
        }
        
        const scale = (distance - margin) / distance;
        return {
          x: center.x + dx * scale,
          y: center.y + dy * scale
        };
      }
      
      toPrev.x /= toPrevLength;
      toPrev.y /= toPrevLength;
      toNext.x /= toNextLength;
      toNext.y /= toNextLength;
      
      // Calculate the bisector direction (inward)
      let bisector = {
        x: toPrev.x + toNext.x,
        y: toPrev.y + toNext.y
      };
      
      const bisectorLength = Math.sqrt(bisector.x * bisector.x + bisector.y * bisector.y);
      
      if (bisectorLength === 0) {
        // Straight angle, move perpendicular to edge
        bisector = { x: -toPrev.y, y: toPrev.x };
      } else {
        bisector.x /= bisectorLength;
        bisector.y /= bisectorLength;
      }
      
      // Ensure we're moving inward by checking against the center
      const toCenter = { x: center.x - corner.x, y: center.y - corner.y };
      const dotProduct = bisector.x * toCenter.x + bisector.y * toCenter.y;
      
      if (dotProduct < 0) {
        // Bisector points outward, flip it
        bisector.x = -bisector.x;
        bisector.y = -bisector.y;
      }
      
      // Calculate the actual distance to move along the bisector
      // For acute angles, we need to move further to maintain the margin
      const angle = calculateAngle(prev, corner, next);
      const adjustedMargin = margin / Math.sin(angle / 2);
      
      // Limit the adjusted margin to prevent moving too far
      const maxMove = Math.min(adjustedMargin, margin * 2);
      
      const newPosition = {
        x: corner.x + bisector.x * maxMove,
        y: corner.y + bisector.y * maxMove
      };
      
      // Verify the new position is inside the polygon
      // If not, fall back to simple centroid approach
      if (!this.isPointInPolygon(newPosition, vertices)) {
        const dx = corner.x - center.x;
        const dy = corner.y - center.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= margin) {
          return corner;
        }
        
        const scale = (distance - margin) / distance;
        return {
          x: center.x + dx * scale,
          y: center.y + dy * scale
        };
      }
      
      return newPosition;
    });
  }
  
  private isPointInPolygon(point: Vector2, vertices: Vector2[]): boolean {
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
}