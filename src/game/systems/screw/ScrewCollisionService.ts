/**
 * ScrewCollisionService - Handles collision detection and removability checks
 * Determines if screws are blocked by other shapes and manages removability state
 */

import { Screw } from '@/game/entities/Screw';
import { Shape } from '@/game/entities/Shape';
import { UI_CONSTANTS, DEBUG_CONFIG } from '@/shared/utils/Constants';
import { isScrewAreaBlocked } from '@/shared/utils/CollisionUtils';
import { ScrewColor, Container, HoldingHole } from '@/types/game';
import { ScrewConstraintResult } from '@/shared/physics/ConstraintUtils';

export interface IScrewCollisionService {
  checkScrewRemovability(screwId: string): boolean;
  getBlockingShapes(screw: Screw): Shape[];
  isScrewBlockedForGameplay(screwId: string): boolean;
  updateScrewRemovability(): void;
}

interface CollisionState {
  screws: Map<string, Screw>;
  allShapes: Shape[];
  layerIndexLookup: Map<string, number>;
  visibleLayers: Set<string>;
  // Additional properties from ScrewManagerState that we don't use
  screwCounter?: number;
  containerColors?: ScrewColor[];
  containers?: Container[];
  holdingHoles?: HoldingHole[];
  constraints?: Map<string, ScrewConstraintResult>;
  virtualGameWidth?: number;
  virtualGameHeight?: number;
}

export class ScrewCollisionService implements IScrewCollisionService {
  private state: CollisionState;
  
  // Debug throttling - track last logged state for each screw to avoid spam
  private lastLoggedScrewStates: Map<string, {
    isRemovable: boolean;
    blockingShapeIds: string[];
    layerVisible: boolean;
    timestamp: number;
  }> = new Map();
  
  // Track gameplay blocking debug state separately
  private lastLoggedGameplayBlocking: Map<string, { blocked: boolean; timestamp: number }> = new Map();
  
  // Track layer visibility check debug state
  private lastLoggedLayerVisibility: Map<string, { layerVisible: boolean; timestamp: number }> = new Map();
  
  // Use centralized debug throttle constants from DEBUG_CONFIG

  constructor(state: CollisionState) {
    this.state = state;
  }

  /**
   * Check if a screw can be removed based on visual occlusion
   */
  public checkScrewRemovability(screwId: string): boolean {
    const screw = this.state.screws.get(screwId);
    if (!screw || screw.isCollected) {
      return false;
    }

    const screwShape = this.state.allShapes.find(shape => shape.id === screw.shapeId);
    if (!screwShape) {
      return false;
    }

    // Check if the screw's own layer is visible
    const layerVisible = this.state.visibleLayers.has(screwShape.layerId);
    
    // Throttled debug logging for layer visibility
    if (DEBUG_CONFIG.logScrewLayerVisibility) {
      const now = Date.now();
      const lastLog = this.lastLoggedLayerVisibility.get(screwId);
      const shouldLog = !lastLog || 
                       lastLog.layerVisible !== layerVisible || 
                       (now - lastLog.timestamp) > DEBUG_CONFIG.layerVisibilityThrottleMs;
      
      if (shouldLog) {
        console.log(`🔍 Layer visibility check for screw ${screwId}:`, {
          screwLayerId: screwShape.layerId,
          layerVisible,
          visibleLayers: Array.from(this.state.visibleLayers),
          visibleLayersSize: this.state.visibleLayers.size
        });
        
        this.lastLoggedLayerVisibility.set(screwId, {
          layerVisible,
          timestamp: now
        });
      }
    }
    
    if (!layerVisible) {
      return false;
    }

    const screwLayerIndex = this.state.layerIndexLookup.get(screwShape.layerId) ?? -1;
    
    // Debug logging for missing layer index
    if (screwLayerIndex === -1) {
      console.warn(`⚠️ ScrewCollisionService: Could not find index for layer ${screwShape.layerId} in layerIndexLookup. Current lookup:`, 
        Array.from(this.state.layerIndexLookup.entries()));
    }
    
    const blockingShapeIds: string[] = [];
    
    for (const shape of this.state.allShapes) {
      if (shape.id === screw.shapeId) continue;

      // CRITICAL FIX: Only check shapes from visible layers
      if (!this.state.visibleLayers.has(shape.layerId)) {
        continue; // Skip shapes from invisible layers - they cannot block screws
      }

      // Only check shapes that are in front of the screw's layer
      const shapeLayerIndex = this.state.layerIndexLookup.get(shape.layerId) ?? -1;
      
      // Skip if shape is in the same layer as the screw
      if (shape.layerId === screwShape.layerId) {
        continue;
      }
      
      // Skip if shape is not in front of the screw
      // UPDATED: Lower index = front (initial layers), higher index = back (newer layers)  
      // Shape blocks screw only if shape is in front (shape index < screw index)
      if (shapeLayerIndex > screwLayerIndex) {
        continue; // Skip shapes behind the screw
      }

      const isBlocked = isScrewAreaBlocked(screw.position, UI_CONSTANTS.screws.radius, shape, true);
      
      if (isBlocked) {
        blockingShapeIds.push(shape.id);
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get all shapes blocking a screw
   */
  public getBlockingShapes(screw: Screw): Shape[] {
    const screwShape = this.state.allShapes.find(shape => shape.id === screw.shapeId);
    if (!screwShape) return [];

    const screwLayerIndex = this.state.layerIndexLookup.get(screwShape.layerId) ?? -1;
    
    // Debug logging for missing layer index
    if (screwLayerIndex === -1) {
      console.warn(`⚠️ ScrewCollisionService.getBlockingShapes: Could not find index for layer ${screwShape.layerId} in layerIndexLookup`);
    }
    
    const blockingShapes: Shape[] = [];

    for (const shape of this.state.allShapes) {
      if (shape.id === screw.shapeId) continue;

      // CRITICAL FIX: Only check shapes from visible layers
      if (!this.state.visibleLayers.has(shape.layerId)) {
        continue; // Skip shapes from invisible layers - they cannot block screws
      }

      // Only check shapes that are in front of the screw's layer
      const shapeLayerIndex = this.state.layerIndexLookup.get(shape.layerId) ?? -1;
      
      // Skip if shape is in the same layer as the screw
      if (shape.layerId === screwShape.layerId) {
        continue;
      }
      
      // Skip if shape is not in front of the screw
      // UPDATED: Lower index = front (initial layers), higher index = back (newer layers)  
      // Shape blocks screw only if shape is in front (shape index < screw index)
      if (shapeLayerIndex > screwLayerIndex) {
        continue; // Skip shapes behind the screw
      }

      if (isScrewAreaBlocked(screw.position, UI_CONSTANTS.screws.radius, shape, true)) {
        blockingShapes.push(shape);
      }
    }

    return blockingShapes;
  }

  /**
   * Check if a screw is blocked for gameplay purposes (broader check for shake animation)
   * This uses a less strict bounds-based check to ensure screws that should logically
   * be considered "blocked" will trigger shake animations even if they're not precisely
   * visually occluded.
   */
  public isScrewBlockedForGameplay(screwId: string): boolean {
    const screw = this.state.screws.get(screwId);
    if (!screw || screw.isCollected) {
      return false;
    }

    const screwShape = this.state.allShapes.find(shape => shape.id === screw.shapeId);
    if (!screwShape) {
      return false;
    }

    // If the screw's own layer is not visible, consider it blocked
    if (!this.state.visibleLayers.has(screwShape.layerId)) {
      return true;
    }

    const screwLayerIndex = this.state.layerIndexLookup.get(screwShape.layerId) ?? -1;
    
    for (const shape of this.state.allShapes) {
      if (shape.id === screw.shapeId) continue;

      // Only check shapes from visible layers
      if (!this.state.visibleLayers.has(shape.layerId)) {
        continue;
      }

      // Only check shapes that are in front of the screw's layer
      const shapeLayerIndex = this.state.layerIndexLookup.get(shape.layerId) ?? -1;
      
      // Skip if shape is in the same layer as the screw
      if (shape.layerId === screwShape.layerId) {
        continue;
      }
      
      // Skip if shape is not in front of the screw
      if (shapeLayerIndex < screwLayerIndex) {
        continue;
      }

      // Use broader bounds-based check for gameplay blocking (less strict than visual occlusion)
      const isBlocked = isScrewAreaBlocked(screw.position, UI_CONSTANTS.screws.radius, shape, false);
      
      if (isBlocked) {
        // Only log if this is a state change for gameplay blocking
        if (DEBUG_CONFIG.logScrewDebug) {
          const lastState = this.lastLoggedGameplayBlocking.get(screwId);
          if (!lastState || !lastState.blocked) {
            console.log(`[GAMEPLAY_BLOCKING] Screw ${screwId} blocked for gameplay by shape ${shape.id}`);
            this.lastLoggedGameplayBlocking.set(screwId, { blocked: true, timestamp: Date.now() });
          }
        }
        return true;
      }
    }

    // If we reach here, the screw is not blocked for gameplay
    if (DEBUG_CONFIG.logScrewDebug) {
      const lastState = this.lastLoggedGameplayBlocking.get(screwId);
      if (lastState && lastState.blocked) {
        console.log(`[GAMEPLAY_BLOCKING] Screw ${screwId} no longer blocked for gameplay`);
        this.lastLoggedGameplayBlocking.set(screwId, { blocked: false, timestamp: Date.now() });
      }
    }

    return false;
  }

  /**
   * Update removability state for all screws
   */
  public updateScrewRemovability(): void {
    for (const screw of this.state.screws.values()) {
      if (!screw.isCollected) {
        const wasRemovable = screw.isRemovable;
        const isRemovable = this.checkScrewRemovability(screw.id);
        screw.setRemovable(isRemovable);
        
        // Debug logging with throttling
        if (DEBUG_CONFIG.logScrewDebug && wasRemovable !== isRemovable) {
          const now = Date.now();
          const lastLog = this.lastLoggedScrewStates.get(screw.id);
          
          if (!lastLog || (now - lastLog.timestamp) > DEBUG_CONFIG.debugThrottleMs) {
            const screwShape = this.state.allShapes.find(shape => shape.id === screw.shapeId);
            const layerVisible = screwShape ? this.state.visibleLayers.has(screwShape.layerId) : false;
            const blockingShapes = this.getBlockingShapes(screw);
            const blockingShapeIds = blockingShapes.map(s => s.id);
            
            console.log(`[REMOVABILITY] Screw ${screw.id}: ${wasRemovable} -> ${isRemovable}`, {
              layerVisible,
              blockingShapes: blockingShapeIds
            });
            
            this.lastLoggedScrewStates.set(screw.id, {
              isRemovable,
              blockingShapeIds,
              layerVisible,
              timestamp: now
            });
          }
        }
      }
    }
  }

  /**
   * Clean up old throttling states to prevent memory leaks
   */
  public cleanupThrottlingStates(): void {
    const now = Date.now();
    const maxAge = 30000; // 30 seconds

    // Clean up screw state logs
    for (const [screwId, state] of this.lastLoggedScrewStates) {
      if (now - state.timestamp > maxAge) {
        this.lastLoggedScrewStates.delete(screwId);
      }
    }

    // Clean up gameplay blocking logs
    for (const [screwId, state] of this.lastLoggedGameplayBlocking) {
      if (now - state.timestamp > maxAge) {
        this.lastLoggedGameplayBlocking.delete(screwId);
      }
    }

    // Clean up layer visibility logs
    for (const [screwId, state] of this.lastLoggedLayerVisibility) {
      if (now - state.timestamp > maxAge) {
        this.lastLoggedLayerVisibility.delete(screwId);
      }
    }
  }
}