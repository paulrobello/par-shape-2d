/**
 * ScrewPlacementService - Handles screw creation and placement on shapes
 * Manages screw generation, positioning strategies, and placement logic
 */

import { Screw } from '@/game/entities/Screw';
import { Shape } from '@/game/entities/Shape';
import { Vector2, ScrewColor } from '@/types/game';
import { GAME_CONFIG, DEBUG_CONFIG } from '@/shared/utils/Constants';
import { getRandomScrewColor } from '@/game/utils/Colors';
import { randomIntBetween } from '@/game/utils/MathUtils';
import {
  calculateScrewPositionsLegacy,
  getShapeDefinition,
  getShapeScrewLocations,
  getMaxScrewsForShape as getMaxScrewsFromPositions,
} from '@/game/utils/ScrewPositionUtils';
import { ScrewPlacementStrategyFactory } from '@/shared/strategies';
import { selectNonOverlappingPositions, calculateShapeArea } from '@/shared/utils/GeometryUtils';
import { ShapeDefinition } from '@/types/shapes';
import { EventBus } from '@/game/events/EventBus';
import { Body, Sleeping } from 'matter-js';

export interface IScrewPlacementService {
  generateScrewsForShape(shape: Shape, preferredColors?: ScrewColor[]): Screw[];
  calculateScrewPositions(shape: Shape, count: number): Vector2[];
  createScrew(shapeId: string, position: Vector2, preferredColors?: ScrewColor[]): Screw;
}

interface PlacementState {
  screwCounter: number;
}

export class ScrewPlacementService implements IScrewPlacementService {
  private state: PlacementState;
  private eventBus: EventBus;
  private source: string;

  constructor(state: PlacementState, eventBus: EventBus, source: string) {
    this.state = state;
    this.eventBus = eventBus;
    this.source = source;
  }

  /**
   * Generate and place screws on a shape
   */
  public generateScrewsForShape(shape: Shape, preferredColors?: ScrewColor[]): Screw[] {
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`🎯 ScrewPlacementService.generateScrewsForShape called for shape ${shape.id}, current screws: ${shape.screws.length}`);
    }
    
    if (shape.screws.length > 0) {
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`⏭️ Shape ${shape.id} already has ${shape.screws.length} screws, returning empty array`);
      }
      return []; // Already has screws
    }

    // Get possible positions first to determine realistic limits
    const possiblePositions = getShapeScrewLocations(shape);
    const maxPossibleScrews = this.getMaxScrewsForShape(shape, possiblePositions);
    
    // Randomize screw count within realistic bounds
    const screwCount = randomIntBetween(
      Math.min(GAME_CONFIG.shapes.minScrews, maxPossibleScrews),
      Math.min(GAME_CONFIG.shapes.maxScrews, maxPossibleScrews)
    );

    const screwPositions = this.calculateScrewPositions(shape, screwCount);

    if (screwPositions.length === 0) {
      console.error(`No screws placed for ${shape.type} shape! Force placing one at center.`);
      screwPositions.push({ ...shape.position });
    }

    const screws: Screw[] = [];
    screwPositions.forEach((position) => {
      const screw = this.createScrew(shape.id, position, preferredColors);
      // CRITICAL: Set local offset for direct positioning
      screw.setLocalOffset(shape.body);
      shape.addScrew(screw);
      screws.push(screw);
    });

    // Apply physics configuration based on shape definition
    const definition = getShapeDefinition(shape);
    const behavior = definition?.behavior || {};
    
    // Make shape static only if it has more than one screw
    if (screwPositions.length > 1) {
      Body.setStatic(shape.body, true);
      if (DEBUG_CONFIG.logShapeDebug && DEBUG_CONFIG.logScrewDebug) {
        console.log(`Placed ${screwPositions.length} screws on ${shape.type} shape (requested ${screwCount}) - shape made static`);
      }
    } else if (behavior.singleScrewDynamic !== false) {
      // Single screw - keep shape dynamic so it can rotate/swing around the screw
      Body.setStatic(shape.body, false);
      
      // Wake up the body
      Sleeping.set(shape.body, false);
      
      // For composite bodies (like capsules), ensure they are properly positioned
      if (shape.isComposite && shape.body.parts && shape.body.parts.length > 1) {
        shape.updateFromBody();
        
        if (DEBUG_CONFIG.logPhysicsDebug) {
          console.log(`🔧 Composite body (${shape.type}) with single screw:`);
          console.log(`  Shape.position: (${shape.position.x.toFixed(1)}, ${shape.position.y.toFixed(1)})`);
          console.log(`  Body.position: (${shape.body.position.x.toFixed(1)}, ${shape.body.position.y.toFixed(1)})`);
          console.log(`  Body.mass: ${shape.body.mass.toFixed(3)}`);
          console.log(`  Body.inertia: ${shape.body.inertia.toFixed(3)}`);
        }
      }
      
      // Add a very small rotational nudge to get things moving
      const nudgeDirection = Math.random() > 0.5 ? 1 : -1;
      const nudgeAmount = 0.001;
      Body.setAngularVelocity(shape.body, nudgeDirection * nudgeAmount);
      
      // Also apply a tiny force to break perfect equilibrium
      const nudgeForce = 0.0001;
      Body.applyForce(shape.body, shape.body.position, {
        x: nudgeDirection * nudgeForce,
        y: 0
      });
      
      if (DEBUG_CONFIG.logShapeDebug && DEBUG_CONFIG.logScrewDebug) {
        console.log(`Placed ${screwPositions.length} screw on ${shape.type} shape (requested ${screwCount}) - shape kept dynamic for natural rotation`);
      }
    } else {
      // Single screw but configured to be static
      Body.setStatic(shape.body, true);
      if (DEBUG_CONFIG.logShapeDebug && DEBUG_CONFIG.logScrewDebug) {
        console.log(`Placed ${screwPositions.length} screw on ${shape.type} shape (requested ${screwCount}) - shape made static per configuration`);
      }
    }

    // Emit screw generation event
    this.eventBus.emit({
      type: 'screws:generated',
      timestamp: Date.now(),
      shapeId: shape.id,
      screwCount: screwPositions.length,
      totalScrewsGenerated: screws.length
    });

    // Emit event that shape's screws are ready
    this.eventBus.emit({
      type: 'shape:screws:ready',
      timestamp: Date.now(),
      source: this.source,
      shape,
      screws: shape.getAllScrews()
    });

    return screws;
  }

  /**
   * Calculate screw positions using shared strategy system or legacy fallback
   */
  public calculateScrewPositions(shape: Shape, count: number): Vector2[] {
    // For composite bodies, ensure we're using the correct position
    if (shape.isComposite && shape.body) {
      shape.updateFromBody();
      if (DEBUG_CONFIG.logPhysicsDebug) {
        console.log(`🔧 Updated composite shape position before screw calculation: (${shape.position.x.toFixed(1)}, ${shape.position.y.toFixed(1)})`);
      }
    }
    
    // Get shape definition to determine strategy
    const definition = getShapeDefinition(shape);
    
    if (!definition) {
      if (DEBUG_CONFIG.logShapeDebug) {
        console.warn(`No definition found for shape ${shape.id}, using legacy placement`);
      }
      return calculateScrewPositionsLegacy(shape, count);
    }
    
    // Use shared strategy system
    const strategy = ScrewPlacementStrategyFactory.create(definition.screwPlacement.strategy);
    const context = {
      shape,
      config: definition.screwPlacement
    };
    
    const positions = strategy.calculatePositions(context);
    const maxScrews = this.getMaxScrewsFromDefinition(shape, definition, positions);
    const actualCount = Math.min(count, maxScrews);
    
    const minSeparation = definition.screwPlacement?.minSeparation || 48;
    return selectNonOverlappingPositions(positions, actualCount, minSeparation);
  }

  /**
   * Create a new screw instance
   */
  public createScrew(shapeId: string, position: Vector2, preferredColors?: ScrewColor[]): Screw {
    const id = `screw-${++this.state.screwCounter}`;
    const color = getRandomScrewColor(preferredColors);
    return new Screw(id, shapeId, position, color);
  }

  private getMaxScrewsForShape(shape: Shape, positions: { corners: Vector2[], center: Vector2, alternates: Vector2[] }): number {
    return getMaxScrewsFromPositions(shape, positions);
  }

  private getMaxScrewsFromDefinition(
    shape: Shape,
    definition: ShapeDefinition,
    possiblePositions: Vector2[]
  ): number {
    const totalPositions = possiblePositions.length;
    const placement = definition.screwPlacement;
    
    // Check absolute max first
    let maxScrews = placement.maxScrews?.absolute || 6;
    
    // Check area-based limits
    if (placement.maxScrews?.byArea) {
      const shapeArea = calculateShapeArea(shape);
      
      for (const limit of placement.maxScrews.byArea) {
        if (shapeArea <= limit.maxArea) {
          maxScrews = Math.min(maxScrews, limit.screwCount);
          break;
        }
      }
    }
    
    return Math.min(totalPositions, maxScrews);
  }
}