/**
 * Capsule placement strategy for screw positioning
 * Consolidates logic from both game and editor implementations
 */

import { Vector2 } from '@/types/game';
import { Shape } from '@/game/entities/Shape';
import { BasePlacementStrategy, PlacementContext, PlacementConfig, ValidationResult } from './ScrewPlacementStrategy';
import { getShapeVertices, getCentroid } from '@/shared/utils/GeometryUtils';

export class CapsuleStrategy extends BasePlacementStrategy {
  getName(): string {
    return 'capsule';
  }

  getDefaultConfig(): Partial<PlacementConfig> {
    return {
      strategy: 'capsule',
      capsuleEndMargin: 15,
      minSeparation: this.defaultMinSeparation
    };
  }

  validateConfig(config: PlacementConfig): ValidationResult {
    const result = super.validateConfig(config);
    
    if (config.capsuleEndMargin !== undefined && config.capsuleEndMargin < 0) {
      result.errors.push('Capsule end margin must be non-negative');
      result.isValid = false;
    }
    
    return result;
  }

  calculatePositions(context: PlacementContext): Vector2[] {
    const { shape, config } = context;
    const endMargin = config.capsuleEndMargin || 15;
    const minSeparation = config.minSeparation || this.defaultMinSeparation;
    
    const positions = this.generateCapsulePositions(shape, endMargin);
    
    // Apply minimum separation filtering
    return this.applyMinSeparation(positions, minSeparation);
  }

  private generateCapsulePositions(shape: Shape, endMargin: number): Vector2[] {
    // For capsule-like shapes, we want positions at strategic locations:
    // 1. Center position
    // 2. End positions (with margin)
    // 3. Side positions
    
    if (this.isCapsuleShape(shape)) {
      return this.calculateTrueCapsulePositions(shape, endMargin);
    } else if (['arrow', 'chevron', 'star', 'horseshoe'].includes(shape.type)) {
      return this.calculatePathBasedCapsulePositions(shape, endMargin);
    } else {
      // Fallback for other shapes - use corners and center
      return this.calculateGenericCapsulePositions(shape, endMargin);
    }
  }

  private isCapsuleShape(shape: Shape): boolean {
    // Check if this is a true capsule shape based on dimensions
    const { width = 0, height = 0 } = shape;
    
    // A capsule typically has a length much greater than width
    const aspectRatio = Math.max(width, height) / Math.min(width, height);
    return aspectRatio > 2; // Arbitrary threshold for capsule-like shapes
  }


  private calculateTrueCapsulePositions(shape: Shape, endMargin: number): Vector2[] {
    const { x, y } = shape.position;
    const width = shape.width || 0;
    const height = shape.height || 0;
    const positions: Vector2[] = [];
    
    // Determine orientation (horizontal vs vertical)
    const isHorizontal = width > height;
    const length = isHorizontal ? width : height;
    const thickness = isHorizontal ? height : width;
    
    // Center position
    positions.push({ x, y });
    
    // End positions with margin
    const effectiveLength = length / 2 - endMargin;
    
    if (isHorizontal) {
      // Horizontal capsule
      positions.push(
        { x: x - effectiveLength, y }, // Left end
        { x: x + effectiveLength, y }  // Right end
      );
      
      // Side positions (top and bottom)
      const sideOffset = thickness / 4;
      positions.push(
        { x, y: y - sideOffset }, // Top
        { x, y: y + sideOffset }  // Bottom
      );
    } else {
      // Vertical capsule
      positions.push(
        { x, y: y - effectiveLength }, // Top end
        { x, y: y + effectiveLength }  // Bottom end
      );
      
      // Side positions (left and right)
      const sideOffset = thickness / 4;
      positions.push(
        { x: x - sideOffset, y }, // Left
        { x: x + sideOffset, y }  // Right
      );
    }
    
    return positions;
  }

  private calculatePathBasedCapsulePositions(shape: Shape, endMargin: number): Vector2[] {
    const vertices = getShapeVertices(shape);
    if (vertices.length < 3) return [];
    
    const positions: Vector2[] = [];
    const center = getCentroid(vertices);
    
    // Add center position
    positions.push(center);
    
    // Find the extremal points that represent "ends" of the capsule
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
    
    // Determine primary axis (longer dimension)
    const xSpan = maxX.x - minX.x;
    const ySpan = maxY.y - minY.y;
    
    if (xSpan > ySpan) {
      // Horizontal orientation - use left and right extremes
      this.addEndPositionWithMargin(positions, minX, center, endMargin);
      this.addEndPositionWithMargin(positions, maxX, center, endMargin);
    } else {
      // Vertical orientation - use top and bottom extremes
      this.addEndPositionWithMargin(positions, minY, center, endMargin);
      this.addEndPositionWithMargin(positions, maxY, center, endMargin);
    }
    
    return positions;
  }

  private calculateGenericCapsulePositions(shape: Shape, endMargin: number): Vector2[] {
    const positions: Vector2[] = [];
    const { x, y } = shape.position;
    
    // Add center
    positions.push({ x, y });
    
    // Get shape vertices and calculate corners
    const vertices = getShapeVertices(shape);
    if (vertices.length >= 3) {
      const center = getCentroid(vertices);
      
      // Add corner positions with margin applied
      for (const vertex of vertices) {
        this.addEndPositionWithMargin(positions, vertex, center, endMargin);
      }
    }
    
    return positions;
  }

  private addEndPositionWithMargin(positions: Vector2[], endpoint: Vector2, center: Vector2, margin: number): void {
    const dx = endpoint.x - center.x;
    const dy = endpoint.y - center.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance <= margin) {
      // Too close to center, use the endpoint as-is
      positions.push(endpoint);
      return;
    }
    
    // Move inward by margin
    const scale = (distance - margin) / distance;
    positions.push({
      x: center.x + dx * scale,
      y: center.y + dy * scale
    });
  }
}