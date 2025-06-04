/**
 * Screw placement strategy factory and exports
 * Central registry for all placement strategies
 */

import { ScrewPlacementStrategy, PlacementConfig } from './ScrewPlacementStrategy';
import { CornerStrategy } from './CornerStrategy';
import { PerimeterStrategy } from './PerimeterStrategy';
import { GridStrategy } from './GridStrategy';
import { CapsuleStrategy } from './CapsuleStrategy';
import { CustomStrategy } from './CustomStrategy';

// Export all strategy classes
export { BasePlacementStrategy } from './ScrewPlacementStrategy';
export type { ScrewPlacementStrategy } from './ScrewPlacementStrategy';
export { CornerStrategy } from './CornerStrategy';
export { PerimeterStrategy } from './PerimeterStrategy';
export { GridStrategy } from './GridStrategy';
export { CapsuleStrategy } from './CapsuleStrategy';
export { CustomStrategy } from './CustomStrategy';

// Export types
export type { PlacementConfig, PlacementContext, ValidationResult } from './ScrewPlacementStrategy';

/**
 * Factory for creating screw placement strategies
 */
export class ScrewPlacementStrategyFactory {
  private static strategies = new Map<string, () => ScrewPlacementStrategy>([
    ['corners', () => new CornerStrategy()],
    ['perimeter', () => new PerimeterStrategy()],
    ['grid', () => new GridStrategy()],
    ['capsule', () => new CapsuleStrategy()],
    ['custom', () => new CustomStrategy()]
  ]);

  /**
   * Create a strategy instance by type
   */
  static create(strategyType: string): ScrewPlacementStrategy {
    const factory = this.strategies.get(strategyType);
    
    if (!factory) {
      throw new Error(`Unknown screw placement strategy: ${strategyType}`);
    }
    
    return factory();
  }

  /**
   * Get all available strategy types
   */
  static getAvailableStrategies(): string[] {
    return Array.from(this.strategies.keys());
  }

  /**
   * Check if a strategy type is supported
   */
  static isSupported(strategyType: string): boolean {
    return this.strategies.has(strategyType);
  }

  /**
   * Register a new strategy (for extensibility)
   */
  static register(strategyType: string, factory: () => ScrewPlacementStrategy): void {
    this.strategies.set(strategyType, factory);
  }

  /**
   * Get default configuration for a strategy type
   */
  static getDefaultConfig(strategyType: string): Partial<PlacementConfig> {
    const strategy = this.create(strategyType);
    return strategy.getDefaultConfig();
  }

  /**
   * Validate configuration for a strategy type
   */
  static validateConfig(strategyType: string, config: PlacementConfig) {
    const strategy = this.create(strategyType);
    return strategy.validateConfig(config);
  }
}

/**
 * Convenience function to create and use a strategy in one call
 */
export function calculateScrewPositions(
  strategyType: string,
  context: import('./ScrewPlacementStrategy').PlacementContext
): import('@/types/game').Vector2[] {
  const strategy = ScrewPlacementStrategyFactory.create(strategyType);
  return strategy.calculatePositions(context);
}

/**
 * Convenience function to get positions with automatic min separation
 */
export function selectNonOverlappingPositions(
  positions: import('@/types/game').Vector2[],
  count: number,
  minSeparation: number
): import('@/types/game').Vector2[] {
  if (positions.length === 0) return [];
  if (count <= 0) return [];
  if (count === 1) return [positions[0]];
  
  const selected: import('@/types/game').Vector2[] = [positions[0]];
  
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