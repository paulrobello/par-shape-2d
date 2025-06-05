/**
 * Event-driven ScrewManager implementation
 * Manages screws independently through events, removing direct dependencies
 */

import { BaseSystem } from '../core/BaseSystem';
import { Constraint, Bodies, Body, Sleeping } from 'matter-js';
import { Screw } from '@/game/entities/Screw';
import { Shape } from '@/game/entities/Shape';
import { Vector2, ScrewColor, Container, HoldingHole } from '@/types/game';
import { GAME_CONFIG, PHYSICS_CONSTANTS, UI_CONSTANTS, DEBUG_CONFIG } from '@/shared/utils/Constants';
import { getRandomScrewColor } from '@/game/utils/Colors';
import { randomIntBetween } from '@/game/utils/MathUtils';
import {
  calculateScrewPositionsLegacy,
  getShapeDefinition,
  getShapeScrewLocations,
  getMaxScrewsForShape as getMaxScrewsFromPositions,
} from '@/game/utils/ScrewPositionUtils';
import {
  ScrewPlacementStrategyFactory
} from '@/shared/strategies';
import {
  isScrewAreaBlocked
} from '@/shared/utils/CollisionUtils';
import {
  selectNonOverlappingPositions,
  calculateShapeArea
} from '@/shared/utils/GeometryUtils';
import {
  calculateContainerHolePosition,
  findScrewDestination,
  determineDestinationType
} from '@/game/utils/ScrewContainerUtils';
import { ShapeDefinition } from '@/types/shapes';
import {
  ShapeCreatedEvent,
  ShapeDestroyedEvent,
  ScrewClickedEvent,
  ContainerColorsUpdatedEvent,
  BoundsChangedEvent,
  SaveRequestedEvent,
  RestoreRequestedEvent,
  ScrewTransferStartedEvent,
  ScrewTransferCompletedEvent,
  ScrewColorsRequestedEvent,
  ScrewTransferColorCheckEvent
} from '../events/EventTypes';

interface ScrewManagerState {
  screws: Map<string, Screw>;
  constraints: Map<string, Constraint>;
  screwCounter: number;
  containerColors: ScrewColor[];
  containers: Container[]; // Actual container state from GameState
  holdingHoles: HoldingHole[]; // Actual holding hole state from GameState
  allShapes: Shape[];
  layerDepthLookup: Map<string, number>;
  virtualGameWidth: number;
  virtualGameHeight: number;
}

export class ScrewManager extends BaseSystem {
  private state: ScrewManagerState;

  constructor() {
    super('ScrewManager');
    
    this.state = {
      screws: new Map(),
      constraints: new Map(),
      screwCounter: 0,
      containerColors: [],
      containers: [],
      holdingHoles: [],
      virtualGameWidth: GAME_CONFIG.canvas.width,
      virtualGameHeight: GAME_CONFIG.canvas.height,
      allShapes: [],
      layerDepthLookup: new Map()
    };
  }

  protected async onInitialize(): Promise<void> {
    this.setupEventHandlers();
    
    // Initialize with default container colors
    this.state.containerColors = ['red', 'green', 'blue', 'yellow'];
  }

  // Override BaseSystem update method to handle screw animations
  public update(deltaTime: number): void {
    this.executeIfActive(() => {
      // Update screw positions based on their constraints
      this.updateScrewPositions();
      
      // Update collection animations
      const { completed } = this.updateCollectionAnimations(deltaTime);
      
      // Update transfer animations  
      const { completed: transferCompleted } = this.updateTransferAnimations(deltaTime);
      
      // Update shake animations
      this.updateShakeAnimations(deltaTime);
      
      // Handle completed collection animations
      if (completed.length > 0) {
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`${completed.length} screw animations completed`);
        }
        completed.forEach(screwId => {
          const screw = this.state.screws.get(screwId);
          if (screw) {
            // Place screw in its destination (container or holding hole)
            this.placeScrewInDestination(screw);
            
            // Now mark the screw as collected so it stops rendering from allScrews
            screw.collect();
            
            // Emit screw collected event
            this.emit({
              type: 'screw:collected',
              timestamp: Date.now(),
              screw,
              destination: determineDestinationType(screw, this.state.containers, this.state.holdingHoles, this.state.virtualGameWidth, this.state.virtualGameHeight),
              points: 10 // Fixed 10 points per screw removed from shape
            });
            
            // Remove the screw from the shape's screws array now that animation is complete
            // Note: We need to clear shapeId AFTER removing from shape
            const shape = this.state.allShapes.find(s => s.id === screw.shapeId);
            if (shape) {
              shape.removeScrew(screwId);
              if (DEBUG_CONFIG.logScrewDebug) {
                console.log(`Removed screw ${screwId} from shape ${shape.id} after animation`);
              }
            }
            
            // Clear the shape reference - this screw no longer belongs to any shape
            screw.shapeId = '';
            
            // Keep all screws in state for rendering purposes
            // Mark their destination for game logic but don't delete them
            if (DEBUG_CONFIG.logScrewDebug) {
              console.log(`🎯 Screw ${screwId} destination: targetType=${screw.targetType}, targetPosition=${JSON.stringify(screw.targetPosition)}`);
            }
            
            if (screw.targetType === 'container') {
              if (DEBUG_CONFIG.logScrewDebug) {
                console.log(`📦 KEEPING screw ${screwId} in state (went to container, needed for rendering) - Total screws: ${this.state.screws.size}`);
              }
            } else if (screw.targetType === 'holding_hole') {
              if (DEBUG_CONFIG.logScrewDebug) {
                console.log(`🏠 KEEPING screw ${screwId} in state (went to holding hole) - Total screws: ${this.state.screws.size}`);
              }
            } else {
              // Fallback to position-based detection if targetType is not set
              const destinationType = determineDestinationType(screw, this.state.containers, this.state.holdingHoles, this.state.virtualGameWidth, this.state.virtualGameHeight);
              if (DEBUG_CONFIG.logScrewDebug) {
                console.log(`⚠️ Screw ${screwId} targetType not set, using position-based detection: ${destinationType}`);
              }
              if (destinationType === 'container') {
                if (DEBUG_CONFIG.logScrewDebug) {
                  console.log(`📦 KEEPING screw ${screwId} in state (went to container - fallback, needed for rendering) - Total screws: ${this.state.screws.size}`);
                }
              } else {
                if (DEBUG_CONFIG.logScrewDebug) {
                  console.log(`🏠 KEEPING screw ${screwId} in state (went to holding hole - fallback) - Total screws: ${this.state.screws.size}`);
                }
              }
            }
          }
        });
      }
      
      // Handle completed transfer animations
      if (transferCompleted.length > 0) {
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`${transferCompleted.length} screw transfer animations completed`);
        }
        // Transfer completion events are emitted by updateTransferAnimations
        // The actual placing in containers is handled by GameState's transfer completion handler
      }
      
      // Update screw removability based on current state
      this.updateScrewRemovability();
    });
  }

  private setupEventHandlers(): void {
    // Shape events
    this.subscribe('shape:created', this.handleShapeCreated.bind(this));
    this.subscribe('shape:destroyed', this.handleShapeDestroyed.bind(this));
    
    // Screw interaction events
    this.subscribe('screw:clicked', this.handleScrewClicked.bind(this));
    
    // Container events
    this.subscribe('container:colors:updated', this.handleContainerColorsUpdated.bind(this));
    
    // Bounds change events
    this.subscribe('bounds:changed', this.handleBoundsChanged.bind(this));
    
    // Save/restore events
    this.subscribe('save:requested', this.handleSaveRequested.bind(this));
    this.subscribe('restore:requested', this.handleRestoreRequested.bind(this));
    
    // Container and holding hole state updates
    this.subscribe('container:state:updated', this.handleContainerStateUpdated.bind(this));
    this.subscribe('holding_hole:state:updated', this.handleHoldingHoleStateUpdated.bind(this));
    
    // Transfer animation events
    this.subscribe('screw:transfer:started', this.handleScrewTransferStarted.bind(this));
    this.subscribe('screw:transfer:completed', this.handleScrewTransferCompleted.bind(this));
    
    // Screw color requests
    this.subscribe('screw_colors:requested', this.handleScrewColorsRequested.bind(this));
    this.subscribe('screw:transfer:color_check', this.handleScrewTransferColorCheck.bind(this));
  }

  // Event Handlers
  private handleShapeCreated(event: ShapeCreatedEvent): void {
    this.executeIfActive(() => {
      // Add shape to our tracking
      this.state.allShapes.push(event.shape);
      this.state.layerDepthLookup.set(event.shape.layerId, event.layer.depthIndex);
      
      // Generate screws for the new shape
      this.generateScrewsForShape(event.shape, this.state.containerColors);
    });
  }

  private handleShapeDestroyed(event: ShapeDestroyedEvent): void {
    this.executeIfActive(() => {
      // Remove shape from tracking
      const shapeIndex = this.state.allShapes.findIndex(s => s.id === event.shape.id);
      if (shapeIndex !== -1) {
        this.state.allShapes.splice(shapeIndex, 1);
      }
      this.state.layerDepthLookup.delete(event.shape.id);
      
      // Clean up any screws that still belong to this shape
      // (Collected screws will have empty shapeId, so they won't be affected)
      const screwsToRemove: string[] = [];
      this.state.screws.forEach((screw, screwId) => {
        if (screw.shapeId === event.shape.id) {
          // Only screws still attached to the shape will match this condition
          if (DEBUG_CONFIG.logShapeDestruction) {
            if (DEBUG_CONFIG.logScrewDebug) {
              console.log(`🔍 Screw ${screwId} still belongs to destroyed shape ${event.shape.id} - isCollected: ${screw.isCollected}, targetType: ${screw.targetType}`);
            }
          }
          screwsToRemove.push(screwId);
        }
      });
      
      // Remove screws and their constraints
      screwsToRemove.forEach(screwId => {
        this.removeScrewFromShape(screwId);
        this.state.screws.delete(screwId);
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`💀 DELETED screw ${screwId} due to shape destruction - Remaining: ${this.state.screws.size}`);
        }
      });
      
      if (screwsToRemove.length > 0) {
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`Cleaned up ${screwsToRemove.length} screws from destroyed shape ${event.shape.id}`);
        }
      }
    });
  }

  private handleBoundsChanged(event: BoundsChangedEvent): void {
    this.executeIfActive(() => {
      // Update stored virtual game dimensions for target calculations
      this.state.virtualGameWidth = event.width;
      this.state.virtualGameHeight = event.height;
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`🎯 ScrewManager: Updated virtual dimensions to ${event.width}x${event.height}`);
      }
    });
  }

  private handleScrewClicked(event: ScrewClickedEvent): void {
    this.executeIfActive(() => {
      const screw = this.state.screws.get(event.screw.id);
      if (!screw) {
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`Screw ${event.screw.id} not found`);
        }
        return;
      }
      
      // If screw is blocked, start shake animation
      if (!screw.isRemovable && !screw.isCollected && !screw.isBeingCollected) {
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`🔒 Screw ${event.screw.id} is blocked - starting shake animation`);
        }
        screw.startShake();
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`📳 Shake animation started for screw ${event.screw.id} - isShaking: ${screw.isShaking}`);
        }
        
        // Add haptic feedback for mobile if available
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(50); // Short vibration for blocked screw feedback
        }
        
        // Emit blocked click event
        this.emit({
          type: 'screw:blocked:clicked',
          timestamp: Date.now(),
          screw,
          position: event.position
        });
        return;
      }
      
      // Continue with normal click handling for removable screws
      if (screw.isCollected || screw.isBeingCollected) {
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`Screw ${event.screw.id} is already collected or being collected`);
        }
        return;
      }

      // Determine where the screw should go (container or holding hole)
      const destination = this.findScrewDestination(screw);
      if (!destination) {
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`No available destination for screw ${event.screw.id}`);
        }
        return;
      }
      
      // Reserve the destination if it's a container
      if (destination.type === 'container' && destination.holeIndex !== undefined) {
        const container = this.state.containers.find(c => c.id === destination.id);
        if (container) {
          container.reservedHoles[destination.holeIndex] = event.screw.id;
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`Reserved container ${destination.id} hole ${destination.holeIndex} for screw ${event.screw.id}`);
          }
        }
      } else if (destination.type === 'holding_hole') {
        const holdingHole = this.state.holdingHoles.find(h => h.id === destination.id);
        if (holdingHole) {
          // Mark holding hole as reserved
          holdingHole.reservedBy = event.screw.id;
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`Reserved holding hole ${destination.id} for screw ${event.screw.id}`);
          }
        }
      }
      
      // Start the collection animation instead of immediately removing
      if (this.startScrewCollection(event.screw.id, destination.position, destination)) {
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`Started collection animation for screw ${event.screw.id} to ${destination.type} at (${destination.position.x.toFixed(1)}, ${destination.position.y.toFixed(1)})`);
        }
        
        // Add hole to shape immediately when screw is clicked (using original position)
        const shape = this.state.allShapes.find(s => s.id === screw.shapeId);
        if (shape) {
          // Use the current screw position (original position before animation starts)
          const dx = screw.position.x - shape.position.x;
          const dy = screw.position.y - shape.position.y;
          
          // Apply inverse rotation to get local coordinates
          const cos = Math.cos(-shape.rotation);
          const sin = Math.sin(-shape.rotation);
          const localX = dx * cos - dy * sin;
          const localY = dx * sin + dy * cos;
          
          shape.holes.push({ x: localX, y: localY });
        }
        
        // IMPORTANT: Remove the constraint AFTER marking screw as being collected
        // This ensures the count is correct when checking for single-screw shapes
        this.removeConstraintOnly(event.screw.id);
        
        // Check if this was the last active screw on the shape
        if (shape) {
          const remainingScrews = shape.getActiveScrews();
          // Check if this screw being collected leaves no active screws
          const activeCount = remainingScrews.filter(s => s.id !== event.screw.id && !s.isBeingCollected).length;
          
          if (DEBUG_CONFIG.logPhysicsStateChanges) {
            if (DEBUG_CONFIG.logScrewDebug) {
              console.log(`🔍 handleScrewClicked: Shape ${shape.id} has ${activeCount} active screws remaining after removing ${event.screw.id}`);
            }
            if (DEBUG_CONFIG.logScrewDebug) {
              console.log(`🔍 Remaining screws: ${remainingScrews.map(s => `${s.id}(collected:${s.isCollected},collecting:${s.isBeingCollected})`).join(', ')}`);
            }
          }
          
          if (activeCount === 0) {
            if (DEBUG_CONFIG.logPhysicsStateChanges) {
              if (DEBUG_CONFIG.logScrewDebug) {
                console.log(`Last screw removed from shape ${shape.id}, letting gravity take effect naturally`);
              }
            }
            // No manual forces - let gravity and physics handle the falling motion naturally
          } else if (activeCount === 1) {
            if (DEBUG_CONFIG.logPhysicsStateChanges) {
              if (DEBUG_CONFIG.logScrewDebug) {
                console.log(`📌 Shape ${shape.id} will have 1 screw remaining - should become dynamic in removeConstraintOnly`);
              }
            }
          }
          
          // Emit screw removed event for physics
          this.emit({
            type: 'screw:removed',
            timestamp: Date.now(),
            screw,
            shape
          });
        }
      }
    });
  }

  private handleContainerColorsUpdated(event: ContainerColorsUpdatedEvent): void {
    this.executeIfActive(() => {
      this.state.containerColors = [...event.colors];
    });
  }

  private handleSaveRequested(_event: SaveRequestedEvent): void {
    void _event;
    this.executeIfActive(() => {
      if (DEBUG_CONFIG.logPhysicsDebug) {
        console.log(`ScrewManager save state: ${this.state.screws.size} screws, ${this.state.constraints.size} constraints`);
      }
    });
  }

  private handleRestoreRequested(_event: RestoreRequestedEvent): void {
    void _event;
    this.executeIfActive(() => {
      // Restoration coordination
    });
  }
  
  private handleContainerStateUpdated(event: import('@/game/events/EventTypes').ContainerStateUpdatedEvent): void {
    this.executeIfActive(() => {
      this.state.containers = event.containers;
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`🎯 ScrewManager: Container state updated - ${event.containers.length} containers`);
      }
      
      // Check if any screws in holding holes can now transfer to new/updated containers
      this.checkAllHoldingHolesForTransfers();
    });
  }
  
  private handleHoldingHoleStateUpdated(event: import('@/game/events/EventTypes').HoldingHoleStateUpdatedEvent): void {
    this.executeIfActive(() => {
      this.state.holdingHoles = event.holdingHoles;
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`🎯 ScrewManager: Holding hole state updated - ${event.holdingHoles.length} holes`);
      }
    });
  }

  private handleScrewTransferStarted(event: ScrewTransferStartedEvent): void {
    this.executeIfActive(() => {
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`📨 ScrewManager: RECEIVED screw:transfer:started for screw ${event.screwId}`);
      }
      
      const screw = this.state.screws.get(event.screwId);
      if (screw) {
        // Find the target container (color validation already done in handleScrewTransferColorCheck)
        const targetContainer = this.state.containers.find(c => this.state.containers.indexOf(c) === event.toContainerIndex);
        if (!targetContainer) {
          console.error(`❌ ScrewManager: Target container ${event.toContainerIndex} not found`);
          
          // Emit transfer failed event
          this.emit({
            type: 'screw:transfer:failed',
            timestamp: Date.now(),
            screwId: event.screwId,
            fromHoleIndex: event.fromHoleIndex,
            toContainerIndex: event.toContainerIndex,
            toHoleIndex: event.toHoleIndex,
            reason: 'Target container not found'
          });
          return;
        }

        if (DEBUG_CONFIG.logScrewDebug) {

          console.log(`✅ ScrewManager: Starting transfer - screw ${screw.id} (${screw.color}) to container ${targetContainer.id} (${targetContainer.color})`);

        }
        console.log(`🔍 ScrewManager: State screw object properties:`, {
          id: screw.id,
          shapeId: screw.shapeId,
          isCollected: screw.isCollected,
          isBeingCollected: screw.isBeingCollected,
          isBeingTransferred: screw.isBeingTransferred,
          targetType: screw.targetType || 'not set',
          position: screw.position
        });
        // Ensure all indices are passed correctly
        console.log(`🔢 Transfer indices - fromHole: ${event.fromHoleIndex}, toContainer: ${event.toContainerIndex}, toHole: ${event.toHoleIndex}`);
        screw.startTransfer(event.fromPosition, event.toPosition, event.fromHoleIndex, event.toContainerIndex, event.toHoleIndex);
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`🎯 ScrewManager: Started transfer animation for screw ${screw.id} from hole ${event.fromHoleIndex} to container ${event.toContainerIndex} hole ${event.toHoleIndex}`);
        }
      } else {
        console.error(`❌ ScrewManager: Screw ${event.screwId} NOT FOUND in state! Available screws:`, Array.from(this.state.screws.keys()));
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`🔍 ScrewManager: Total screws in state: ${this.state.screws.size}`);
        }
        
        // Debug: Log all screws with their states
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`🔍 ScrewManager: All screws in state with details:`);
        }
        Array.from(this.state.screws.entries()).forEach(([id, screw]) => {
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`  - ${id}: collected=${screw.isCollected}, beingCollected=${screw.isBeingCollected}, targetType=${screw.targetType || 'none'}, position=(${screw.position.x.toFixed(1)}, ${screw.position.y.toFixed(1)})`);
          }
        });
        
        // Emit transfer failed event
        this.emit({
          type: 'screw:transfer:failed',
          timestamp: Date.now(),
          screwId: event.screwId,
          fromHoleIndex: event.fromHoleIndex,
          toContainerIndex: event.toContainerIndex,
          toHoleIndex: event.toHoleIndex,
          reason: 'Screw not found in ScrewManager state'
        });
      }
    });
  }

  private handleScrewTransferCompleted(event: ScrewTransferCompletedEvent): void {
    this.executeIfActive(() => {
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`🏁 ScrewManager: RECEIVED transfer completed for screw ${event.screwId}`);
      }
      console.log(`🏁 Transfer details: fromHole=${event.fromHoleIndex}, toContainer=${event.toContainerIndex}, toHole=${event.toHoleIndex}`);
      
      const screw = this.state.screws.get(event.screwId);
      if (screw) {
        // Update the screw's position to the final container hole position
        console.log(`🏁 Checking position update: containerIndex=${event.toContainerIndex}, containers.length=${this.state.containers.length}, holeIndex=${event.toHoleIndex}`);
        
        // If we have valid container index but invalid hole index, try to use the screw's transfer properties
        const containerIndex = event.toContainerIndex;
        let holeIndex = event.toHoleIndex;
        
        if (containerIndex >= 0 && holeIndex < 0 && screw.transferToHoleIndex !== undefined && screw.transferToHoleIndex >= 0) {
          holeIndex = screw.transferToHoleIndex;
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`🔧 Using screw's transferToHoleIndex: ${holeIndex}`);
          }
        }
        
        if (containerIndex >= 0 && containerIndex < this.state.containers.length && holeIndex >= 0) {
          const container = this.state.containers[containerIndex];
          console.log(`🏁 Found container:`, container ? { id: container.id, color: container.color } : 'null');
          
          if (container) {
            // Calculate the exact hole position (same logic as GameManager rendering)
            const containerWidth = UI_CONSTANTS.containers.width;
            const containerHeight = UI_CONSTANTS.containers.height;
            const spacing = UI_CONSTANTS.containers.spacing;
            const startY = UI_CONSTANTS.containers.startY;
            const totalWidth = (this.state.containers.length * containerWidth) + ((this.state.containers.length - 1) * spacing);
            const startX = (GAME_CONFIG.canvas.width - totalWidth) / 2;
            const containerX = startX + (containerIndex * (containerWidth + spacing));
            const holeSpacing = containerWidth / 4;
            const holeX = containerX + holeSpacing + (holeIndex * holeSpacing);
            const holeY = startY + containerHeight / 2;
            
            // Update screw position to the container hole
            screw.position.x = holeX;
            screw.position.y = holeY;
            screw.targetPosition = { x: holeX, y: holeY };
            screw.targetType = 'container';
            screw.targetContainerId = container.id;
            screw.targetHoleIndex = holeIndex;
            
            if (DEBUG_CONFIG.logScrewDebug) {
            
              console.log(`📍 ScrewManager: Updated screw ${event.screwId} position to container hole (${holeX}, ${holeY})`);
            
            }
          }
        }
        
        // Keep the screw in state for rendering, but mark it as fully collected/transferred
        screw.collect(); // This marks it as isCollected=true
        
        // Clear the shape reference - this screw no longer belongs to any shape
        screw.shapeId = '';
        
        if (DEBUG_CONFIG.logScrewDebug) {
        
          console.log(`📦 ScrewManager: KEEPING screw ${event.screwId} in state after transfer to container (needed for rendering) - Total: ${this.state.screws.size}`);
        
        }
      } else {
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`❌ ScrewManager: Screw ${event.screwId} not found for transfer completion`);
        }
      }
    });
  }

  private handleScrewColorsRequested(event: ScrewColorsRequestedEvent): void {
    this.executeIfActive(() => {
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`🎨 ScrewManager: RECEIVED screw colors request for container ${event.containerIndex}`);
      }
      
      // Get all active screw colors (screws on shapes or in holding holes, not in containers)
      const activeScrewColors: ScrewColor[] = [];
      const colorCounts: Map<ScrewColor, number> = new Map();
      
      // Count colors of all active screws (on shapes or in holding holes)
      for (const screw of this.state.screws.values()) {
        // Include screws that are:
        // 1. Not collected (still on shapes)
        // 2. Collected but in holding holes (targetType === 'holding_hole')
        // Exclude screws in containers (targetType === 'container')
        const isInHoldingHole = screw.isCollected && screw.targetType === 'holding_hole';
        const isOnShape = !screw.isCollected;
        
        if (isOnShape || isInHoldingHole) {
          const currentCount = colorCounts.get(screw.color) || 0;
          colorCounts.set(screw.color, currentCount + 1);
          if (!activeScrewColors.includes(screw.color)) {
            activeScrewColors.push(screw.color);
          }
        }
      }
      
      // Sort colors by frequency (most common first) to prioritize colors with more screws
      activeScrewColors.sort((a, b) => {
        const countA = colorCounts.get(a) || 0;
        const countB = colorCounts.get(b) || 0;
        return countB - countA;
      });
      
      // Log detailed breakdown
      let onShapeCount = 0;
      let inHoldingHoleCount = 0;
      for (const screw of this.state.screws.values()) {
        if (!screw.isCollected) onShapeCount++;
        else if (screw.targetType === 'holding_hole') inHoldingHoleCount++;
      }
      
      if (DEBUG_CONFIG.logScrewDebug) {
      
        console.log(`🎨 ScrewManager: Active screws - On shapes: ${onShapeCount}, In holding holes: ${inHoldingHoleCount}`);
      
      }
      console.log(`🎨 ScrewManager: Active screw colors (by frequency):`, 
        activeScrewColors.map(color => `${color}(${colorCounts.get(color)})`).join(', '));
      
      // Call the callback with the active colors
      event.callback(activeScrewColors);
    });
  }

  private handleScrewTransferColorCheck(event: ScrewTransferColorCheckEvent): void {
    this.executeIfActive(() => {
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`🔍 ScrewManager: RECEIVED color check request for ${event.holdingHoleScrews.length} screws to container color ${event.targetColor}`);
      }
      console.log(`🔍 ScrewManager: Container details:`, {
        id: event.targetContainer.id,
        color: event.targetContainer.color,
        holes: event.targetContainer.holes,
        isFull: event.targetContainer.isFull
      });
      
      const validTransfers: { screwId: string; holeIndex: number }[] = [];
      
      // Check each screw in holding holes for color match
      event.holdingHoleScrews.forEach(({ screwId, holeIndex }) => {
        if (screwId) {
          const screw = this.state.screws.get(screwId);
          if (screw && screw.color === event.targetColor) {
            validTransfers.push({ screwId, holeIndex });
            if (DEBUG_CONFIG.logScrewDebug) {
              console.log(`✅ ScrewManager: Screw ${screwId} (${screw.color}) matches target color ${event.targetColor}`);
            }
          } else if (screw) {
            if (DEBUG_CONFIG.logScrewDebug) {
              console.log(`❌ ScrewManager: Screw ${screwId} (${screw.color}) does NOT match target color ${event.targetColor}`);
            }
          } else {
            if (DEBUG_CONFIG.logScrewDebug) {
              console.log(`❌ ScrewManager: Screw ${screwId} not found in state`);
            }
          }
        }
      });
      
      if (DEBUG_CONFIG.logScrewDebug) {
      
        console.log(`🔍 ScrewManager: Found ${validTransfers.length} valid color-matched transfers`);
      
      }
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`🔍 ScrewManager: Total screws in state: ${this.state.screws.size}`);
      }
      
      // Call the callback with the valid transfers
      event.callback(validTransfers);
    });
  }

  // Core Screw Management Methods
  public generateScrewsForShape(shape: Shape, preferredColors?: ScrewColor[]): void {
    this.executeIfActive(() => {
      if (shape.screws.length > 0) return; // Already has screws

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

      screwPositions.forEach((position) => {
        const screw = this.createScrew(shape.id, position, preferredColors);
        shape.addScrew(screw);
        this.state.screws.set(screw.id, screw);

        // Create constraint and emit events
        this.createScrewConstraint(screw, shape);
      });

      // Apply physics configuration based on shape definition
      const definition = getShapeDefinition(shape);
      const behavior = definition?.behavior || {};
      
      // Make shape static only if it has more than one screw
      if (screwPositions.length > 1) {
        Body.setStatic(shape.body, true);
        if (DEBUG_CONFIG.logShapeDebug) {
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`Placed ${screwPositions.length} screws on ${shape.type} shape (requested ${screwCount}) - shape made static`);
          }
        }
      } else if (behavior.singleScrewDynamic !== false) {
        // Single screw - keep shape dynamic so it can rotate/swing around the screw
        Body.setStatic(shape.body, false);
        
        // Ensure the shape can rotate by setting up angular properties
        const inertiaMultiplier = behavior.rotationalInertiaMultiplier || 3;
        shape.body.inertia = shape.body.mass * inertiaMultiplier;
        
        // Wake up the body and give it a small initial perturbation to start physics
        Sleeping.set(shape.body, false);
        
        // Give a very small initial angular velocity to start the swing motion
        Body.setAngularVelocity(shape.body, (Math.random() - 0.5) * 0.02);
        
        // Apply a tiny random force to ensure physics activation
        Body.applyForce(shape.body, shape.body.position, {
          x: (Math.random() - 0.5) * 0.001,
          y: (Math.random() - 0.5) * 0.001
        });
        
        if (DEBUG_CONFIG.logShapeDebug) {
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`Placed ${screwPositions.length} screw on ${shape.type} shape (requested ${screwCount}) - shape kept dynamic for rotation with initial motion`);
          }
        }
      } else {
        // Single screw but configured to be static
        Body.setStatic(shape.body, true);
        if (DEBUG_CONFIG.logShapeDebug) {
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`Placed ${screwPositions.length} screw on ${shape.type} shape (requested ${screwCount}) - shape made static per configuration`);
          }
        }
      }

      // Emit event that shape's screws are ready
      this.emit({
        type: 'shape:screws:ready',
        timestamp: Date.now(),
        shape,
        screws: shape.getAllScrews()
      });
    });
  }

  // Calculate screw positions using shared strategy system or legacy fallback
  private calculateScrewPositions(shape: Shape, count: number): Vector2[] {
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


  private getMaxScrewsForShape(shape: Shape, positions: { corners: Vector2[], center: Vector2, alternates: Vector2[] }): number {
    return getMaxScrewsFromPositions(shape, positions);
  }

  // Use utility functions for shape definition handling

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

  private createScrew(shapeId: string, position: Vector2, preferredColors?: ScrewColor[]): Screw {
    const id = `screw-${++this.state.screwCounter}`;
    const color = getRandomScrewColor(preferredColors);
    return new Screw(id, shapeId, position, color);
  }

  // Find screw destination with debug logging and state management
  private findScrewDestination(screw: Screw): { type: 'container' | 'holding_hole'; position: Vector2; id: string; holeIndex?: number } | null {
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`🔍 Finding destination for screw ${screw.id} (color: ${screw.color})`);
    }
    
    const destination = findScrewDestination(
      screw,
      this.state.containers,
      this.state.holdingHoles,
      this.state.virtualGameWidth
    );
    
    if (!destination) {
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`No available destination found for screw ${screw.id} (color: ${screw.color})`);
      }
    }
    
    return destination;
  }

  private placeScrewInDestination(screw: Screw): void {
    if (!screw.targetPosition || !screw.targetType) {
      console.error(`❌ Cannot place screw ${screw.id} - missing targetPosition or targetType`);
      return;
    }

    if (DEBUG_CONFIG.logScrewPlacement) {
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`📍 Placing screw ${screw.id} in ${screw.targetType} (targetContainerId: ${screw.targetContainerId}, targetHoleIndex: ${screw.targetHoleIndex})`);
      }
    }

    if (screw.targetType === 'holding_hole') {
      // Find the holding hole by ID
      const holeIndex = this.state.holdingHoles.findIndex(h => h.id === screw.targetContainerId);
      const holdingHole = this.state.holdingHoles[holeIndex];
      
      if (holeIndex !== -1 && holdingHole) {
        // Clear the reservation
        if (holdingHole.reservedBy === screw.id) {
          holdingHole.reservedBy = undefined;
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`Cleared reservation for screw ${screw.id} in holding hole ${holdingHole.id}`);
          }
        }
        
        // Emit event to place screw in holding hole
        this.emit({
          type: 'holding_hole:filled',
          timestamp: Date.now(),
          holeIndex,
          screwId: screw.id
        });
        
        if (DEBUG_CONFIG.logScrewPlacement) {
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`✅ Placed screw ${screw.id} in holding hole ${holeIndex}`);
          }
        }
        
        // Check if there's now a matching container available and transfer immediately
        this.checkAndTransferFromHoldingHole(screw, holeIndex);
      } else {
        console.error(`❌ Failed to find holding hole for screw ${screw.id} - holeIndex: ${holeIndex}`);
      }
    } else if (screw.targetType === 'container' && screw.targetHoleIndex !== undefined) {
      // Find the container by ID
      const container = this.state.containers.find(c => c.id === screw.targetContainerId);
      const containerIndex = container ? this.state.containers.indexOf(container) : -1;
      
      if (container && containerIndex !== -1) {
        // Clear the reservation
        if (container.reservedHoles[screw.targetHoleIndex] === screw.id) {
          container.reservedHoles[screw.targetHoleIndex] = null;
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`Cleared reservation for screw ${screw.id} in container ${container.id} hole ${screw.targetHoleIndex}`);
          }
        }
        
        // Place the screw ID in the specific hole
        container.holes[screw.targetHoleIndex] = screw.id;
        
        // Check if container is now full
        const filledCount = container.holes.filter(h => h !== null).length;
        if (filledCount === container.maxHoles) {
          // Mark container as full
          container.isFull = true;
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`Container ${container.id} is now full with ${filledCount} screws`);
          }
          
          // Emit container filled event
          this.emit({
            type: 'container:filled',
            timestamp: Date.now(),
            containerIndex,
            color: screw.color,
            screws: [...container.holes].filter(s => s !== null) as string[]
          });
        }
        
        if (DEBUG_CONFIG.logScrewPlacement) {
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`✅ Placed screw ${screw.id} in container ${containerIndex} hole ${screw.targetHoleIndex}`);
          }
        }
      } else {
        console.error(`❌ Failed to find container for screw ${screw.id} - containerIndex: ${containerIndex}, targetHoleIndex: ${screw.targetHoleIndex}`);
      }
    }
  }

  private createScrewConstraint(screw: Screw, shape: Shape): void {
    if (DEBUG_CONFIG.logPhysicsDebug) {
      console.log(`Creating constraint for screw ${screw.id} on shape ${shape.id}`);
    }
    
    // For composite bodies, use the actual physics body position, not the Shape entity position
    const bodyPosition = shape.body.position;
    const offsetX = screw.position.x - bodyPosition.x;
    const offsetY = screw.position.y - bodyPosition.y;
    
    // Debug logging for composite bodies
    if (shape.isComposite) {
      if (DEBUG_CONFIG.logPhysicsDebug) {
        console.log(`🔧 COMPOSITE CONSTRAINT DEBUG:`);
        console.log(`  Shape.position: (${shape.position.x.toFixed(1)}, ${shape.position.y.toFixed(1)})`);
        console.log(`  Body.position: (${bodyPosition.x.toFixed(1)}, ${bodyPosition.y.toFixed(1)})`);
        console.log(`  Screw.position: (${screw.position.x.toFixed(1)}, ${screw.position.y.toFixed(1)})`);
        console.log(`  Calculated offset: (${offsetX.toFixed(1)}, ${offsetY.toFixed(1)})`);
      }
    }

    const screwAnchor = Bodies.circle(screw.position.x, screw.position.y, 1, {
      isStatic: true,
      render: { visible: false },
      collisionFilter: { group: -1, category: 0, mask: 0 },
    });

    // Emit physics body added event with unique source to avoid loop detection
    this.emit({
      type: 'physics:body:added',
      timestamp: Date.now(),
      source: `ScrewManager-${screw.id}`,
      bodyId: screwAnchor.id.toString(),
      shape,
      body: screwAnchor
    });

    const constraint = Constraint.create({
      bodyA: shape.body,
      bodyB: screwAnchor,
      pointA: { x: offsetX, y: offsetY },
      pointB: { x: 0, y: 0 },
      length: 0,
      stiffness: PHYSICS_CONSTANTS.constraint.stiffness,
      damping: PHYSICS_CONSTANTS.constraint.damping,
      render: { visible: false },
    });

    screw.setConstraint(constraint);
    this.state.constraints.set(screw.id, constraint);

    // Store anchor body reference
    screw.anchorBody = screwAnchor;

    // Emit constraint added event
    this.emit({
      type: 'physics:constraint:added',
      timestamp: Date.now(),
      source: `ScrewManager-${screw.id}`,
      constraintId: constraint.id?.toString() || screw.id,
      screw,
      constraint
    });
    
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`Constraint created for screw ${screw.id}: offset (${offsetX.toFixed(1)}, ${offsetY.toFixed(1)})`);
    }
  }

  private removeConstraintOnly(screwId: string): boolean {
    return this.executeIfActive(() => {
      const screw = this.state.screws.get(screwId);
      if (!screw) return false;

      // Check if constraint already removed to prevent loops
      const constraint = this.state.constraints.get(screwId);
      const anchorBody = screw.anchorBody;
      
      // If no constraint or anchor body exists, already removed
      if (!constraint && !anchorBody) return false;
      
      if (constraint || anchorBody) {
        // Emit a single atomic removal event for both constraint and anchor body
        this.emit({
          type: 'physics:screw:removed:immediate',
          timestamp: Date.now(),
          screwId: screwId,
          constraint: constraint,
          anchorBody: anchorBody,
          shape: this.state.allShapes.find(s => s.id === screw.shapeId)!
        });
        
        // Clear references immediately
        this.state.constraints.delete(screwId);
        screw.anchorBody = undefined;
        screw.removeConstraint();
      }

      // Check remaining screws for this shape after this one is removed
      const shape = this.state.allShapes.find(s => s.id === screw.shapeId);
      const allShapeScrews = this.getScrewsForShape(screw.shapeId);
      // Count screws that are still constraining the shape (not collected, not being collected, and not the one being removed)
      const shapeScrews = allShapeScrews.filter(s => 
        !s.isCollected && !s.isBeingCollected && s.id !== screwId
      );
      
      if (DEBUG_CONFIG.logPhysicsStateChanges) {
        if (DEBUG_CONFIG.logShapeDebug) {
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`Shape ${shape?.id}: Total screws=${allShapeScrews.length}, Constraining screws=${shapeScrews.length} after removing ${screwId}`);
          }
        }
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`  Screws: ${allShapeScrews.map(s => `${s.id}(collected:${s.isCollected},collecting:${s.isBeingCollected})`).join(', ')}`);
        }
      }
      
      if (shapeScrews.length === 0 && shape) {
        // No screws left - make shape fully dynamic
        
        // IMPORTANT: Capture velocities BEFORE changing static state
        // Matter.js might reset velocities when changing from static to dynamic
        const capturedVelocity = { ...shape.body.velocity };
        const capturedAngularVelocity = shape.body.angularVelocity;
        
        if (DEBUG_CONFIG.logPhysicsStateChanges) {
          console.log(`🔧 Shape ${shape.id} BEFORE: isStatic=${shape.body.isStatic}, isSleeping=${shape.body.isSleeping}, velocity=(${capturedVelocity.x.toFixed(2)}, ${capturedVelocity.y.toFixed(2)}), angularVel=${capturedAngularVelocity.toFixed(3)}, position=(${shape.body.position.x.toFixed(1)}, ${shape.body.position.y.toFixed(1)})`);
        }
        
        Body.setStatic(shape.body, false);
        Sleeping.set(shape.body, false);
        
        // Use captured angular velocity
        const currentAngularVelocity = capturedAngularVelocity;
        
        // Calculate linear velocity from the pivot point (last screw position)
        // When swinging on a single screw, the center of mass moves with angular velocity
        let linearVelocity = shape.body.velocity;
        
        if (Math.abs(currentAngularVelocity) > 0.01 && screw.position) {
          // Calculate the radius from pivot to center of mass
          const dx = shape.body.position.x - screw.position.x;
          const dy = shape.body.position.y - screw.position.y;
          
          // Linear velocity from rotation: v = ω × r
          // For 2D: vx = -ω * dy, vy = ω * dx
          const rotationalVelocityX = -currentAngularVelocity * dy;
          const rotationalVelocityY = currentAngularVelocity * dx;
          
          linearVelocity = {
            x: rotationalVelocityX,
            y: rotationalVelocityY
          };
          
          if (DEBUG_CONFIG.logPhysicsStateChanges) {
            if (DEBUG_CONFIG.logScrewDebug) {
              console.log(`🔧 Calculated linear velocity from rotation: pivot=(${screw.position.x.toFixed(1)}, ${screw.position.y.toFixed(1)}), radius=(${dx.toFixed(1)}, ${dy.toFixed(1)}), velocity=(${linearVelocity.x.toFixed(2)}, ${linearVelocity.y.toFixed(2)})`);
            }
          }
        }
        
        if (DEBUG_CONFIG.logPhysicsStateChanges) {
          console.log(`🔧 Preserving momentum - velocity: (${linearVelocity.x.toFixed(2)}, ${linearVelocity.y.toFixed(2)}), angular: ${currentAngularVelocity.toFixed(3)}`);
        }
        
        // Set the calculated velocity
        Body.setVelocity(shape.body, linearVelocity);
        
        // Ensure minimum downward velocity for falling (but don't amplify upward velocity)
        if (shape.body.velocity.y < 0.5) {
          Body.setVelocity(shape.body, { 
            x: shape.body.velocity.x, 
            y: 0.5  // Small downward velocity to ensure falling
          });
        }
        
        // Preserve angular velocity
        Body.setAngularVelocity(shape.body, currentAngularVelocity);
        
        // Ensure the shape has adequate mass for falling
        let mass = shape.body.mass || 1;
        if (mass < 10) {
          // If mass is too low, temporarily increase density to ensure falling
          Body.setDensity(shape.body, 0.02);
          mass = shape.body.mass;
          console.log(`🔧 Increased density for shape ${shape.id}: new mass=${mass}`);
        }
        
        // Let gravity handle the falling motion naturally - no manual forces needed
        
        // Preserve layer-based collision filtering - shapes should only interact within their layer
        // Don't modify collision filters to maintain proper layer separation
        const filter = shape.body.collisionFilter;
        if (DEBUG_CONFIG.logLayerDebug) {
          console.log(`🔧 Preserving layer collision filter for ${shape.id}: group=${filter.group}, category=${filter.category}, mask=${filter.mask}`);
          console.log(`🔧 Shape ${shape.id} AFTER: isStatic=${shape.body.isStatic}, isSleeping=${shape.body.isSleeping}, velocity=(${shape.body.velocity.x.toFixed(2)}, ${shape.body.velocity.y.toFixed(2)}), mass=${shape.body.mass}, density=${shape.body.density}`);
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`Shape ${shape.id} now has no screws - made dynamic and given impulse to fall`);
          }
        }
        
        // Ensure the shape entity updates its position from the physics body
        shape.updateFromBody();
        
        // Add multiple delayed checks to track falling motion
        if (DEBUG_CONFIG.logPhysicsStateChanges) {
          [100, 500, 1000].forEach(delay => {
            setTimeout(() => {
              shape.updateFromBody(); // Update shape position from physics body
              console.log(`🔧 Shape ${shape.id} UPDATE (after ${delay}ms): position=(${shape.body.position.x.toFixed(1)}, ${shape.body.position.y.toFixed(1)}), velocity=(${shape.body.velocity.x.toFixed(2)}, ${shape.body.velocity.y.toFixed(2)}), isSleeping=${shape.body.isSleeping}`);
            }, delay);
          });
        }
      } else if (shapeScrews.length === 1 && shape) {
        // Only one screw left - make shape dynamic so it can swing/rotate
        if (DEBUG_CONFIG.logPhysicsStateChanges) {
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`🔧 Shape ${shape.id} has 1 screw - making dynamic for rotation. BEFORE: isStatic=${shape.body.isStatic}, isSleeping=${shape.body.isSleeping}`);
          }
        }
        
        const wasStatic = shape.body.isStatic;
        Body.setStatic(shape.body, false);
        Sleeping.set(shape.body, false);
        
        // Enhance rotational physics for single screw pivoting
        const oldInertia = shape.body.inertia;
        shape.body.inertia = shape.body.mass * 3; // Increase rotational inertia for better swinging
        
        // Give a small initial angular velocity to start the swing
        Body.setAngularVelocity(shape.body, 0.02);
        
        // Apply a small horizontal perturbation force to ensure physics activation
        // Avoid any upward force that could cause jumping
        Body.applyForce(shape.body, shape.body.position, {
          x: (Math.random() - 0.5) * 0.001,
          y: 0  // No vertical force to prevent jumping
        });
        
        if (DEBUG_CONFIG.logPhysicsStateChanges) {
          console.log(`🔧 Shape ${shape.id} AFTER: isStatic=${shape.body.isStatic} (was ${wasStatic}), isSleeping=${shape.body.isSleeping}, inertia=${shape.body.inertia} (was ${oldInertia})`);
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`Shape ${shape.id} has only 1 screw remaining - made dynamic to allow rotation with enhanced physics`);
          }
        }
        
        // Verify the change took effect
        if (shape.body.isStatic) {
          console.error(`❌ ERROR: Shape ${shape.id} is still static after calling Body.setStatic(false)!`);
        }
        
        // Add delayed checks to see if shape gets reset to static
        if (DEBUG_CONFIG.logPhysicsStateChanges) {
          [50, 100, 200, 500].forEach(delay => {
            setTimeout(() => {
              if (shape.body.isStatic) {
                console.error(`❌ ERROR: Shape ${shape.id} became static again after ${delay}ms!`);
              } else {
                console.log(`✅ Shape ${shape.id} is still dynamic after ${delay}ms`);
              }
            }, delay);
          });
        }
        
        this.updateShapeConstraints(screw.shapeId);
      }

      return true;
    }) || false;
  }

  public removeScrewFromShape(screwId: string): boolean {
    return this.executeIfActive(() => {
      const screw = this.state.screws.get(screwId);
      if (!screw || !screw.isRemovable || screw.isCollected) {
        return false;
      }

      // Find the shape this screw belongs to and add hole
      const shape = this.state.allShapes.find(s => s.id === screw.shapeId);
      if (shape) {
        // Use the current screw position (since this is called during shape destruction, not after animation)
        const screwPos = screw.position;
        
        // Convert world position to local coordinates (accounting for shape rotation)
        const dx = screwPos.x - shape.position.x;
        const dy = screwPos.y - shape.position.y;
        
        // Apply inverse rotation to get local coordinates
        const cos = Math.cos(-shape.rotation);
        const sin = Math.sin(-shape.rotation);
        const localX = dx * cos - dy * sin;
        const localY = dx * sin + dy * cos;
        
        shape.holes.push({ x: localX, y: localY });
      }

      // Remove constraint from physics world (only if not already removed)
      const constraint = this.state.constraints.get(screwId);
      if (constraint) {
        this.emit({
          type: 'physics:constraint:removed',
          timestamp: Date.now(),
          constraintId: constraint.id?.toString() || screwId,
          screw
        });
        this.state.constraints.delete(screwId);
      }

      // Remove anchor body if it exists (only if not already removed)
      const anchorBody = screw.anchorBody;
      if (anchorBody) {
        // Immediately remove anchor body from physics world to prevent rendering artifacts
        this.emit({
          type: 'physics:body:removed:immediate',
          timestamp: Date.now(),
          bodyId: anchorBody.id.toString(),
          anchorBody: anchorBody, // Pass the actual body for immediate removal
          shape: shape!
        });
        
        // Clear the reference to prevent any further updates
        screw.anchorBody = undefined;
      }

      // Mark screw as collected
      screw.collect();

      // Check remaining screws for this shape
      const shapeScrews = this.getScrewsForShape(screw.shapeId).filter(s => !s.isCollected && !s.isBeingCollected);
      if (shapeScrews.length === 1 && shape) {
        // Only one screw left - make shape dynamic so it can swing/rotate
        Body.setStatic(shape.body, false);
        Sleeping.set(shape.body, false);
        
        // Enhance rotational physics for single screw pivoting
        shape.body.inertia = shape.body.mass * 2; // Increase rotational inertia
        Body.setAngularVelocity(shape.body, 0.02); // Give a small initial angular velocity
        
        if (DEBUG_CONFIG.logScrewDebug) {
        
          console.log(`Shape ${shape.id} has only 1 screw remaining - made dynamic to allow rotation with enhanced physics`);
        
        }
        this.updateShapeConstraints(screw.shapeId);
      } else if (shapeScrews.length === 0 && shape) {
        // No screws left - make shape fully dynamic
        Body.setStatic(shape.body, false);
        Sleeping.set(shape.body, false);

        // Give the shape a strong initial velocity to ensure it falls
        Body.setVelocity(shape.body, { x: 0, y: 2.0 });
        
        // Ensure the shape has adequate mass for falling
        let mass = shape.body.mass || 1;
        if (mass < 10) {
          // If mass is too low, temporarily increase density to ensure falling
          Body.setDensity(shape.body, 0.02);
          mass = shape.body.mass;
          console.log(`🔧 Increased density for shape ${shape.id}: new mass=${mass}`);
        }
        
        // Let gravity handle the falling motion naturally - no manual forces needed
        
        // Preserve layer-based collision filtering - shapes should only interact within their layer
        // Don't modify collision filters to maintain proper layer separation
        const filter = shape.body.collisionFilter;
        if (DEBUG_CONFIG.logLayerDebug) {
          console.log(`🔧 Preserving layer collision filter for ${shape.id}: group=${filter.group}, category=${filter.category}, mask=${filter.mask}`);
        }
        
        if (DEBUG_CONFIG.logScrewDebug) {
        
          console.log(`Shape ${shape.id} now has no screws - made dynamic and given impulse to fall`);
        
        }
      }

      return true;
    }) || false;
  }

  private updateShapeConstraints(shapeId: string): void {
    this.executeIfActive(() => {
      const shapeScrews = this.getScrewsForShape(shapeId).filter(s => !s.isCollected && !s.isBeingCollected);

      if (shapeScrews.length === 1) {
        const remainingScrew = shapeScrews[0];
        const oldConstraint = this.state.constraints.get(remainingScrew.id);

        if (oldConstraint && oldConstraint.bodyA) {
          // Emit constraint removed event
          this.emit({
            type: 'physics:constraint:removed',
            timestamp: Date.now(),
            constraintId: oldConstraint.id?.toString() || remainingScrew.id,
            screw: remainingScrew
          });
          this.state.constraints.delete(remainingScrew.id);

          // Remove old anchor body
          const oldAnchorBody = remainingScrew.anchorBody;
          if (oldAnchorBody) {
            // Immediately remove anchor body from physics world to prevent rendering artifacts
            this.emit({
              type: 'physics:body:removed:immediate',
              timestamp: Date.now(),
              bodyId: oldAnchorBody.id.toString(),
              anchorBody: oldAnchorBody, // Pass the actual body for immediate removal
              shape: this.state.allShapes.find(s => s.id === shapeId)!
            });
          }

          const shapeBody = oldConstraint.bodyA;
          const screwLocalPosition = {
            x: remainingScrew.position.x - shapeBody.position.x,
            y: remainingScrew.position.y - shapeBody.position.y
          };

          const newAnchor = Bodies.circle(remainingScrew.position.x, remainingScrew.position.y, 1, {
            isStatic: true,
            render: { visible: false },
            collisionFilter: { group: -1, category: 0, mask: 0 },
          });

          // Emit physics body added event with unique source to avoid loop detection
          this.emit({
            type: 'physics:body:added',
            timestamp: Date.now(),
            source: `ScrewManager-${remainingScrew.id}-recreate`,
            bodyId: newAnchor.id.toString(),
            shape: this.state.allShapes.find(s => s.id === shapeId)!,
            body: newAnchor
          });

          const newConstraint = Constraint.create({
            bodyA: oldConstraint.bodyA,
            bodyB: newAnchor,
            pointA: screwLocalPosition,
            pointB: { x: 0, y: 0 },
            length: 0,
            stiffness: PHYSICS_CONSTANTS.constraint.stiffness,
            damping: PHYSICS_CONSTANTS.constraint.damping,
            render: { visible: false },
          });

          remainingScrew.setConstraint(newConstraint);
          this.state.constraints.set(remainingScrew.id, newConstraint);
          remainingScrew.anchorBody = newAnchor;
          
          // Emit constraint added event
          this.emit({
            type: 'physics:constraint:added',
            timestamp: Date.now(),
            constraintId: newConstraint.id?.toString() || remainingScrew.id,
            screw: remainingScrew,
            constraint: newConstraint
          });
        }
      }
    });
  }

  public updateScrewPositions(): void {
    this.executeIfActive(() => {
      for (const screw of this.state.screws.values()) {
        if (screw.isCollected || screw.isBeingCollected) continue;

        const anchorBody = screw.anchorBody;
        if (anchorBody) {
          screw.position.x = anchorBody.position.x;
          screw.position.y = anchorBody.position.y;
        } else {
          const constraint = screw.constraint;
          if (constraint && constraint.bodyA) {
            const shape = constraint.bodyA;
            const offsetX = constraint.pointA?.x || 0;
            const offsetY = constraint.pointA?.y || 0;

            const cos = Math.cos(shape.angle);
            const sin = Math.sin(shape.angle);

            screw.position.x = shape.position.x + (offsetX * cos - offsetY * sin);
            screw.position.y = shape.position.y + (offsetX * sin + offsetY * cos);
          }
        }
      }
    });
  }

  public updateScrewRemovability(): void {
    this.executeIfActive(() => {
      // let removableCount = 0;
      // let totalCount = 0;

      for (const screw of this.state.screws.values()) {
        if (screw.isCollected) continue;

        // totalCount++;
        const wasRemovable = screw.isRemovable;
        const isRemovable = this.checkScrewRemovability(screw.id);
        screw.setRemovable(isRemovable);

        // if (isRemovable) removableCount++;

        if (wasRemovable !== isRemovable) {
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`Screw ${screw.id} removability changed: ${wasRemovable} -> ${isRemovable}`);
          }
          
          if (isRemovable) {
            this.emit({
              type: 'screw:unblocked',
              timestamp: Date.now(),
              screw
            });
          } else {
            const blockingShapes = this.getBlockingShapes(screw);
            this.emit({
              type: 'screw:blocked',
              timestamp: Date.now(),
              screw,
              blockingShapes
            });
          }
        }
      }

      // console.log(`Screw removability: ${removableCount}/${totalCount} screws are removable`);
    });
  }

  private checkScrewRemovability(screwId: string): boolean {
    const screw = this.state.screws.get(screwId);
    if (!screw || screw.isCollected) {
      return false;
    }

    const screwShape = this.state.allShapes.find(shape => shape.id === screw.shapeId);
    if (!screwShape) {
      return false;
    }

    const screwLayerDepth = this.state.layerDepthLookup.get(screwShape.layerId) || -1;

    for (const shape of this.state.allShapes) {
      if (shape.id === screw.shapeId) continue;

      // Only check shapes that are in front of the screw's layer
      const shapeLayerDepth = this.state.layerDepthLookup.get(shape.layerId) || -1;
      
      // Skip if shape is in the same layer as the screw
      if (shape.layerId === screwShape.layerId) {
        continue;
      }
      
      // Skip if shape is not in front of the screw
      // Higher depth = front (rendered last), lower depth = back (rendered first)
      // Shape blocks screw only if shape is in front (shape depth > screw depth)
      if (shapeLayerDepth < screwLayerDepth) {
        continue; // Skip shapes behind the screw
      }

      if (isScrewAreaBlocked(screw.position, UI_CONSTANTS.screws.radius, shape, true)) {
        return false;
      }
    }
    return true;
  }

  private getBlockingShapes(screw: Screw): Shape[] {
    const screwShape = this.state.allShapes.find(shape => shape.id === screw.shapeId);
    if (!screwShape) return [];

    const screwLayerDepth = this.state.layerDepthLookup.get(screwShape.layerId) || -1;
    const blockingShapes: Shape[] = [];

    for (const shape of this.state.allShapes) {
      if (shape.id === screw.shapeId) continue;

      // Only check shapes that are in front of the screw's layer
      const shapeLayerDepth = this.state.layerDepthLookup.get(shape.layerId) || -1;
      
      // Skip if shape is in the same layer as the screw
      if (shape.layerId === screwShape.layerId) {
        continue;
      }
      
      // Skip if shape is not in front of the screw
      // Higher depth = front (rendered last), lower depth = back (rendered first)
      // Shape blocks screw only if shape is in front (shape depth > screw depth)
      if (shapeLayerDepth < screwLayerDepth) {
        continue; // Skip shapes behind the screw
      }

      if (isScrewAreaBlocked(screw.position, UI_CONSTANTS.screws.radius, shape, true)) {
        blockingShapes.push(shape);
      }
    }

    return blockingShapes;
  }

  // All collision detection methods moved to shared utilities

  public startScrewCollection(screwId: string, targetPosition: Vector2, destinationInfo?: { type: 'container' | 'holding_hole'; id: string; holeIndex?: number }): boolean {
    return this.executeIfActive(() => {
      const screw = this.state.screws.get(screwId);
      if (!screw || !screw.isRemovable || screw.isCollected || screw.isBeingCollected) {
        return false;
      }

      screw.startCollection(targetPosition);
      
      // Store destination info on the screw
      if (destinationInfo) {
        screw.targetContainerId = destinationInfo.id;
        screw.targetType = destinationInfo.type;
        screw.targetHoleIndex = destinationInfo.holeIndex;
      }
      
      this.emit({
        type: 'screw:animation:started',
        timestamp: Date.now(),
        screw,
        targetPosition
      });
      
      return true;
    }) || false;
  }

  public updateCollectionAnimations(deltaTime: number): { completed: string[]; collected: Screw[] } {
    const completedScrews: string[] = [];
    const collectedScrews: Screw[] = [];

    this.executeIfActive(() => {
      for (const screw of this.state.screws.values()) {
        if (screw.isBeingCollected) {
          const isComplete = screw.updateCollectionAnimation(deltaTime);
          if (isComplete) {
            completedScrews.push(screw.id);
            collectedScrews.push(screw);
            
            this.emit({
              type: 'screw:animation:completed',
              timestamp: Date.now(),
              screw
            });
            
            if (DEBUG_CONFIG.logScrewDebug) {
              console.log(`Screw ${screw.id} collection completed`);
            }
          }
        }
      }
    });

    return { completed: completedScrews, collected: collectedScrews };
  }

  public updateTransferAnimations(deltaTime: number): { completed: string[]; transferred: Screw[] } {
    const completedTransfers: string[] = [];
    const transferredScrews: Screw[] = [];

    this.executeIfActive(() => {
      for (const screw of this.state.screws.values()) {
        if (screw.isBeingTransferred) {
          const isComplete = screw.updateTransferAnimation(deltaTime);
          if (isComplete) {
            completedTransfers.push(screw.id);
            transferredScrews.push(screw);
            
            // Log the transfer properties before emitting
            console.log(`📊 Transfer properties for ${screw.id}:`, {
              fromHoleIndex: screw.transferFromHoleIndex,
              toContainerIndex: screw.transferToContainerIndex,
              toHoleIndex: screw.transferToHoleIndex
            });
            
            this.emit({
              type: 'screw:transfer:completed',
              timestamp: Date.now(),
              screwId: screw.id,
              fromHoleIndex: screw.transferFromHoleIndex ?? -1,
              toContainerIndex: screw.transferToContainerIndex ?? -1,
              toHoleIndex: screw.transferToHoleIndex ?? -1
            });
            
            if (DEBUG_CONFIG.logScrewDebug) {
              console.log(`Screw ${screw.id} transfer animation completed`);
            }
          }
        }
      }
    });

    return { completed: completedTransfers, transferred: transferredScrews };
  }

  public updateShakeAnimations(deltaTime: number): void {
    this.executeIfActive(() => {
      let shakingCount = 0;
      for (const screw of this.state.screws.values()) {
        if (screw.isShaking) {
          shakingCount++;
          const wasComplete = screw.updateShakeAnimation(deltaTime);
          if (wasComplete) {
            if (DEBUG_CONFIG.logScrewDebug) {
              console.log(`📳 Shake animation completed for screw ${screw.id}`);
            }
          }
        }
      }
      // Only log when there are shaking screws to avoid spam
      if (shakingCount > 0 && Date.now() % 1000 < 50) {
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`📳 Updating ${shakingCount} shaking screws`);
        }
      }
    });
  }

  public getAllScrews(): Screw[] {
    return Array.from(this.state.screws.values());
  }

  public getAnimatingScrews(): Screw[] {
    return Array.from(this.state.screws.values()).filter(
      screw => (screw.isBeingCollected && !screw.isCollected) || screw.isBeingTransferred
    );
  }

  public getScrewsForShape(shapeId: string): Screw[] {
    return Array.from(this.state.screws.values()).filter(
      screw => screw.shapeId === shapeId
    );
  }

  public getScrew(screwId: string): Screw | null {
    return this.state.screws.get(screwId) || null;
  }

  // Method to clear all screws (used for restart)
  public clearAllScrews(): void {
    this.executeIfActive(() => {
      if (DEBUG_CONFIG.logPhysicsDebug) {
        console.log(`Clearing all ${this.state.screws.size} screws and ${this.state.constraints.size} constraints`);
      }
      
      // Remove all constraints from physics
      this.state.constraints.forEach((constraint, screwId) => {
        this.emit({
          type: 'physics:constraint:removed',
          timestamp: Date.now(),
          constraintId: constraint.id?.toString() || screwId,
          screw: this.state.screws.get(screwId)!
        });
      });
      
      // Remove all anchor bodies
      this.state.screws.forEach(screw => {
        if (screw.anchorBody) {
          this.emit({
            type: 'physics:body:removed:immediate',
            timestamp: Date.now(),
            bodyId: screw.anchorBody.id.toString(),
            anchorBody: screw.anchorBody,
            shape: this.state.allShapes.find(s => s.id === screw.shapeId)!
          });
        }
      });
      
      // Clear all holding holes
      this.state.holdingHoles.forEach((hole, index) => {
        if (hole.screwId) {
          hole.screwId = null;
          this.emit({
            type: 'holding_hole:filled',
            timestamp: Date.now(),
            holeIndex: index,
            screwId: null
          });
        }
      });
      
      // Clear all collections
      this.state.screws.clear();
      this.state.constraints.clear();
      this.state.screwCounter = 0;
      
      if (DEBUG_CONFIG.logLayerDebug) {
        console.log('All screws and holding holes cleared');
      }
    });
  }

  private checkAllHoldingHolesForTransfers(): void {
    this.executeIfActive(() => {
      console.log(`🔍 Checking all holding holes for possible transfers...`);
      
      // Check each holding hole that has a screw
      this.state.holdingHoles.forEach((hole, holeIndex) => {
        if (hole.screwId) {
          // Find the screw object
          const screw = this.state.screws.get(hole.screwId);
          if (screw && !screw.isBeingTransferred && !screw.isBeingCollected) {
            // Check if this screw can transfer to a matching container
            this.checkAndTransferFromHoldingHole(screw, holeIndex);
          }
        }
      });
    });
  }

  private checkAndTransferFromHoldingHole(screw: Screw, holeIndex: number): void {
    this.executeIfActive(() => {
      // Find a matching container with available space
      const matchingContainer = this.state.containers.find(container => 
        container.color === screw.color && 
        !container.isFull &&
        container.holes.some((hole, idx) => hole === null && container.reservedHoles[idx] === null) // Has at least one truly empty hole
      );
      
      if (matchingContainer) {
        const containerIndex = this.state.containers.indexOf(matchingContainer);
        // Find first hole that is both empty AND not reserved
        const emptyHoleIndex = matchingContainer.holes.findIndex((hole, idx) => 
          hole === null && matchingContainer.reservedHoles[idx] === null
        );
        
        if (emptyHoleIndex !== -1) {
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`🔄 Found matching container for screw ${screw.id} (${screw.color}) - transferring from holding hole ${holeIndex} to container ${containerIndex} hole ${emptyHoleIndex}`);
          }
          
          // Reserve the container hole immediately
          matchingContainer.reservedHoles[emptyHoleIndex] = screw.id;
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`📌 Reserved container ${containerIndex} hole ${emptyHoleIndex} for screw ${screw.id}`);
          }
          
          // Calculate positions for animation
          const fromPosition = this.state.holdingHoles[holeIndex].position;
          const toPosition = calculateContainerHolePosition(containerIndex, emptyHoleIndex, this.state.virtualGameWidth);
          
          // Start transfer animation
          this.emit({
            type: 'screw:transfer:started',
            timestamp: Date.now(),
            screwId: screw.id,
            fromHoleIndex: holeIndex,
            toContainerIndex: containerIndex,
            toHoleIndex: emptyHoleIndex,
            fromPosition,
            toPosition
          });
          
          // Clear the holding hole immediately (screw is now animating)
          this.emit({
            type: 'holding_hole:filled',
            timestamp: Date.now(),
            holeIndex,
            screwId: null
          });
        }
      }
    });
  }
  
  protected onDestroy(): void {
    this.clearAllScrews();
  }
}