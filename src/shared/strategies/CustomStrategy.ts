/**
 * Custom placement strategy for screw positioning
 * Allows user-defined positions with priority-based selection
 */

import { Vector2 } from '@/types/game';
import { Shape } from '@/game/entities/Shape';
import { BasePlacementStrategy, PlacementContext, PlacementConfig, ValidationResult } from './ScrewPlacementStrategy';

export class CustomStrategy extends BasePlacementStrategy {
  getName(): string {
    return 'custom';
  }

  getDefaultConfig(): Partial<PlacementConfig> {
    return {
      strategy: 'custom',
      customPositions: [],
      minSeparation: this.defaultMinSeparation
    };
  }

  validateConfig(config: PlacementConfig): ValidationResult {
    const result = super.validateConfig(config);
    
    if (!config.customPositions || !Array.isArray(config.customPositions)) {
      result.errors.push('Custom positions array is required');
      result.isValid = false;
      return result;
    }
    
    // Validate each custom position
    for (let i = 0; i < config.customPositions.length; i++) {
      const pos = config.customPositions[i];
      
      if (!pos.position || typeof pos.position.x !== 'number' || typeof pos.position.y !== 'number') {
        result.errors.push(`Custom position ${i}: Invalid position coordinates`);
        result.isValid = false;
      }
      
      if (typeof pos.priority !== 'number' || pos.priority < 0) {
        result.errors.push(`Custom position ${i}: Priority must be a non-negative number`);
        result.isValid = false;
      }
    }
    
    return result;
  }

  calculatePositions(context: PlacementContext): Vector2[] {
    const { shape, config } = context;
    const customPositions = config.customPositions || [];
    const minSeparation = config.minSeparation || this.defaultMinSeparation;
    
    if (customPositions.length === 0) {
      return [];
    }
    
    // Convert custom positions to world coordinates
    const worldPositions = this.convertToWorldCoordinates(shape, customPositions);
    
    // Sort by priority (lower numbers = higher priority)
    const sortedPositions = worldPositions.sort((a, b) => a.priority - b.priority);
    
    // Extract just the positions
    const positions = sortedPositions.map(pos => pos.position);
    
    // Apply minimum separation filtering while preserving priority order
    return this.applyMinSeparationWithPriority(positions, minSeparation);
  }

  private convertToWorldCoordinates(
    shape: Shape, 
    customPositions: Array<{ position: { x: number; y: number }; priority: number }>
  ): Array<{ position: Vector2; priority: number }> {
    const { x: shapeX, y: shapeY } = shape.position;
    
    return customPositions.map(customPos => ({
      position: {
        // Custom positions are typically relative to shape center
        x: shapeX + customPos.position.x,
        y: shapeY + customPos.position.y
      },
      priority: customPos.priority
    }));
  }

  private applyMinSeparationWithPriority(positions: Vector2[], minSeparation: number): Vector2[] {
    if (positions.length === 0) return [];
    if (positions.length === 1) return [...positions];
    
    const selected: Vector2[] = [];
    
    for (const candidate of positions) {
      let isValid = true;
      
      // Check if this position conflicts with any already selected position
      for (const existing of selected) {
        const distance = this.calculateDistance(candidate, existing);
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
   * Convert canvas coordinates to shape-relative coordinates
   * Useful for editor interfaces where users click on canvas
   */
  static convertCanvasToShapeRelative(canvasPosition: Vector2, shape: Shape): Vector2 {
    return {
      x: canvasPosition.x - shape.position.x,
      y: canvasPosition.y - shape.position.y
    };
  }

  /**
   * Convert shape-relative coordinates to canvas coordinates
   * Useful for rendering custom positions
   */
  static convertShapeRelativeToCanvas(shapeRelativePosition: Vector2, shape: Shape): Vector2 {
    return {
      x: shape.position.x + shapeRelativePosition.x,
      y: shape.position.y + shapeRelativePosition.y
    };
  }

  /**
   * Create a custom position configuration object
   */
  static createCustomPosition(x: number, y: number, priority: number = 0): { position: { x: number; y: number }; priority: number } {
    return {
      position: { x, y },
      priority
    };
  }

  /**
   * Validate that custom positions are within reasonable bounds for a shape
   */
  static validatePositionsForShape(
    customPositions: Array<{ position: { x: number; y: number }; priority: number }>,
    shape: Shape
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const { width = 0, height = 0, radius = 0 } = shape;
    
    // Calculate reasonable bounds (shape dimensions plus some padding)
    const maxX = Math.max(width / 2, radius) + 50;
    const maxY = Math.max(height / 2, radius) + 50;
    
    for (let i = 0; i < customPositions.length; i++) {
      const pos = customPositions[i].position;
      
      if (Math.abs(pos.x) > maxX || Math.abs(pos.y) > maxY) {
        errors.push(`Position ${i} is outside reasonable bounds for this shape`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}