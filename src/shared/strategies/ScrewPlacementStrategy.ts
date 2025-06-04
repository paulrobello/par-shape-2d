/**
 * Base interfaces and types for screw placement strategies
 */

import { Vector2 } from '@/types/game';
import { Shape } from '@/game/entities/Shape';

/**
 * Result of a validation operation
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Configuration for screw placement operations
 */
export interface PlacementConfig {
  strategy: 'corners' | 'perimeter' | 'grid' | 'custom' | 'capsule';
  
  // For corners strategy
  cornerMargin?: number;
  
  // For perimeter strategy
  perimeterPoints?: number;
  perimeterMargin?: number;
  
  // For grid strategy
  gridSpacing?: number;
  
  // For custom strategy
  customPositions?: Array<{
    position: { x: number; y: number };
    priority: number;
  }>;
  
  // For capsule strategy
  capsuleEndMargin?: number;
  
  // General constraints
  minSeparation?: number;
  maxScrews?: {
    byArea?: Array<{
      maxArea: number;
      screwCount: number;
    }>;
    absolute?: number;
  };
}

/**
 * Context information for placement calculations
 */
export interface PlacementContext {
  shape: Shape;
  config: PlacementConfig;
  canvasWidth?: number;
  canvasHeight?: number;
  existingScrews?: Vector2[];
}

/**
 * Main interface for screw placement strategies
 */
export interface ScrewPlacementStrategy {
  /**
   * Get the strategy name
   */
  getName(): string;
  
  /**
   * Calculate potential screw positions for a shape
   */
  calculatePositions(context: PlacementContext): Vector2[];
  
  /**
   * Validate the configuration for this strategy
   */
  validateConfig(config: PlacementConfig): ValidationResult;
  
  /**
   * Get default configuration for this strategy
   */
  getDefaultConfig(): Partial<PlacementConfig>;
}

/**
 * Abstract base class for all placement strategies
 */
export abstract class BasePlacementStrategy implements ScrewPlacementStrategy {
  protected defaultMinSeparation: number = 20;
  
  abstract getName(): string;
  abstract calculatePositions(context: PlacementContext): Vector2[];
  abstract getDefaultConfig(): Partial<PlacementConfig>;
  
  /**
   * Validate configuration - base implementation
   */
  validateConfig(config: PlacementConfig): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };
    
    // Validate min separation
    if (config.minSeparation !== undefined && config.minSeparation < 5) {
      result.errors.push('Minimum separation must be at least 5 pixels');
      result.isValid = false;
    }
    
    return result;
  }
  
  /**
   * Apply minimum separation filtering to positions
   */
  protected applyMinSeparation(positions: Vector2[], minSeparation: number): Vector2[] {
    if (positions.length === 0) return [];
    if (positions.length === 1) return [...positions];
    
    const filtered: Vector2[] = [positions[0]]; // Always include first position
    
    for (let i = 1; i < positions.length; i++) {
      const candidate = positions[i];
      let isValid = true;
      
      for (const existing of filtered) {
        const distance = Math.sqrt(
          Math.pow(candidate.x - existing.x, 2) + Math.pow(candidate.y - existing.y, 2)
        );
        if (distance < minSeparation) {
          isValid = false;
          break;
        }
      }
      
      if (isValid) {
        filtered.push(candidate);
      }
    }
    
    return filtered;
  }
  
  /**
   * Calculate distance between two points
   */
  protected calculateDistance(a: Vector2, b: Vector2): number {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  }
  
  /**
   * Get shape area for area-based calculations
   */
  protected getShapeArea(shape: Shape): number {
    const { width = 0, height = 0, radius = 0 } = shape;
    
    if (radius > 0) {
      return Math.PI * radius * radius;
    }
    
    return width * height;
  }
  
  /**
   * Check if a point is valid (not too close to existing screws)
   */
  protected isValidPosition(position: Vector2, existingPositions: Vector2[], minSeparation: number): boolean {
    for (const existing of existingPositions) {
      if (this.calculateDistance(position, existing) < minSeparation) {
        return false;
      }
    }
    return true;
  }
}