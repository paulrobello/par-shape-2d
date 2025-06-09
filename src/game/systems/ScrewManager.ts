/**
 * Event-driven ScrewManager implementation
 * Manages screws independently through events, removing direct dependencies
 */

import { BaseSystem } from '../core/BaseSystem';
import { Body, Sleeping } from 'matter-js';
import { Screw } from '@/game/entities/Screw';
import { Shape } from '@/game/entities/Shape';
import { Vector2, ScrewColor, Container, HoldingHole } from '@/types/game';
import { GAME_CONFIG, UI_CONSTANTS, DEBUG_CONFIG } from '@/shared/utils/Constants';
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
import { ConstraintUtils, ScrewConstraintResult } from '@/shared/physics/ConstraintUtils';
import {
  calculateContainerHolePosition,
  calculateHoldingHolePositions,
  findScrewDestination,
  determineDestinationType
} from '@/game/utils/ScrewContainerUtils';
import { ShapeDefinition } from '@/types/shapes';
import {
  ShapeCreatedEvent,
  ShapeDestroyedEvent,
  ScrewClickedEvent,
  PhysicsBodyAddedEvent,
  ContainerColorsUpdatedEvent,
  BoundsChangedEvent,
  SaveRequestedEvent,
  RestoreRequestedEvent,
  ScrewTransferStartedEvent,
  ScrewTransferCompletedEvent,
  ScrewColorsRequestedEvent,
  ScrewTransferColorCheckEvent,
  LayersUpdatedEvent,
  ScrewCountRequestedEvent
} from '../events/EventTypes';

interface ScrewManagerState {
  screws: Map<string, Screw>;
  constraints: Map<string, ScrewConstraintResult>;
  screwCounter: number;
  containerColors: ScrewColor[];
  containers: Container[]; // Actual container state from GameState
  holdingHoles: HoldingHole[]; // Actual holding hole state from GameState
  allShapes: Shape[];
  layerIndexLookup: Map<string, number>;
  virtualGameWidth: number;
  virtualGameHeight: number;
  visibleLayers: Set<string>; // Track which layers are currently visible
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
      layerIndexLookup: new Map(),
      visibleLayers: new Set()
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
            if (DEBUG_CONFIG.logScrewDebug) {
              console.log(`🎯 Emitting screw:collected event for ${screwId}: targetType=${screw.targetType}, targetContainerId=${screw.targetContainerId}`);
            }
            this.emit({
              type: 'screw:collected',
              timestamp: Date.now(),
              source: 'ScrewManager',
              screw,
              destination: screw.targetType || 'holding_hole', // Use the screw's target type, fallback to holding_hole
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
    
    // Physics events - listen for when bodies are actually added to world
    this.subscribe('physics:body:added', this.handlePhysicsBodyAdded.bind(this));
    
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
    
    // Layer visibility events
    this.subscribe('layers:updated', this.handleLayersUpdated.bind(this));
    
    // Screw count requests
    this.subscribe('screw_count:requested', this.handleScrewCountRequested.bind(this));
    this.subscribe('remaining_screws:requested', this.handleRemainingScrewCountsRequested.bind(this));
  }

  // Event Handlers
  private handleShapeCreated(event: ShapeCreatedEvent): void {
    this.executeIfActive(() => {
      // Add shape to our tracking
      this.state.allShapes.push(event.shape);
      this.state.layerIndexLookup.set(event.shape.layerId, event.layer.index);
      
      // DON'T generate screws here - wait for physics:body:added event
      // when the body is actually added to the physics world
    });
  }
  
  private handlePhysicsBodyAdded(event: PhysicsBodyAddedEvent): void {
    this.executeIfActive(() => {
      // Only handle shape bodies, not screw anchor bodies
      if (event.shape && event.source !== 'ScrewManager' && !event.source?.startsWith('ScrewManager-')) {
        const shape = event.shape;
        
        // Check if this shape already has screws (to avoid duplicates)
        if (shape.screws && shape.screws.length > 0) {
          return;
        }
        
        // CRITICAL: For composite bodies, sync position AFTER body is added to world
        // Matter.js may further adjust position when added to world
        if (shape.isComposite && shape.body) {
          const beforePosition = { x: shape.position.x, y: shape.position.y };
          shape.updateFromBody();
          
          if (DEBUG_CONFIG.logPhysicsDebug) {
            console.log(`🔧 Composite shape ${shape.id} post-world-add position sync:`);
            console.log(`  Before: (${beforePosition.x.toFixed(1)}, ${beforePosition.y.toFixed(1)})`);
            console.log(`  After sync: (${shape.position.x.toFixed(1)}, ${shape.position.y.toFixed(1)})`);
            console.log(`  Body: (${shape.body.position.x.toFixed(1)}, ${shape.body.position.y.toFixed(1)})`);
          }
        }
        
        // Now generate screws with correct position
        this.generateScrewsForShape(shape, this.state.containerColors);
      }
    });
  }

  private handleShapeDestroyed(event: ShapeDestroyedEvent): void {
    this.executeIfActive(() => {
      // Remove shape from tracking
      const shapeIndex = this.state.allShapes.findIndex(s => s.id === event.shape.id);
      if (shapeIndex !== -1) {
        this.state.allShapes.splice(shapeIndex, 1);
      }
      this.state.layerIndexLookup.delete(event.shape.layerId);
      
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
      
      if (DEBUG_CONFIG.logScrewDebug) {
        const isBlockedForGameplay = this.isScrewBlockedForGameplay(screw.id);
        console.log(`[SCREW_CLICK] Screw ${event.screw.id} clicked:`, {
          isRemovable: screw.isRemovable,
          isBlockedForGameplay,
          isCollected: screw.isCollected,
          isBeingCollected: screw.isBeingCollected,
          screwPosition: screw.position,
          clickPosition: event.position
        });
        
        // Also check blocking shapes when clicked
        const blockingShapes = this.getBlockingShapes(screw);
        if (blockingShapes.length > 0) {
          console.log(`[SCREW_CLICK] Blocking shapes found:`, blockingShapes.map(shape => ({
            id: shape.id,
            type: shape.type,
            layerId: shape.layerId,
            position: shape.body.position,
            bounds: shape.body.bounds
          })));
        }
      }
      
      // Check if force removal is enabled (Shift+click in debug mode)
      const forceRemoval = event.forceRemoval || false;
      
      // Check if screw is blocked for gameplay purposes (broader check for shake animation)
      const isBlockedForGameplay = this.isScrewBlockedForGameplay(screw.id);
      
      // If screw is blocked for gameplay and not force removal, start shake animation
      if (isBlockedForGameplay && !screw.isCollected && !screw.isBeingCollected && !forceRemoval) {
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
          source: 'ScrewManager',
          screw,
          position: event.position
        });
        return;
      }
      
      // Log force removal if enabled
      if (forceRemoval) {
        console.log(`🚀 Force removal enabled! Bypassing blocked check for screw ${event.screw.id}`);
      }
      
      // Continue with normal click handling for removable screws or force removal
      if (screw.isCollected || screw.isBeingCollected) {
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`Screw ${event.screw.id} is already collected or being collected`);
        }
        return;
      }

      // Determine where the screw should go (container or holding hole)
      const destination = this.findScrewDestination(screw);
      if (!destination) {
        if (forceRemoval) {
          console.log(`🚀 Force removal: No destination available for screw ${event.screw.id}, ignoring click`);
        } else if (DEBUG_CONFIG.logScrewDebug) {
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
      if (this.startScrewCollection(event.screw.id, destination.position, destination, forceRemoval)) {
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
            source: 'ScrewManager',
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
            source: 'ScrewManager',
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
          source: 'ScrewManager',
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
      // Return an array where each screw is represented individually
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
          // Add this screw's color to the array (each screw represented individually)
          activeScrewColors.push(screw.color);
        }
      }
      
      // Sort the array so most common colors come first
      // This helps prioritize colors with more screws for container replacement
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
      console.log(`🎨 ScrewManager: Active screw colors - Total: ${activeScrewColors.length} screws`);
      console.log(`🎨 ScrewManager: By color count:`, 
        Array.from(colorCounts.entries()).map(([color, count]) => `${color}(${count})`).join(', '));
      
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

  private handleLayersUpdated(event: LayersUpdatedEvent): void {
    this.executeIfActive(() => {
      // Update visible layers tracking
      this.state.visibleLayers.clear();
      event.visibleLayers.forEach(layer => {
        this.state.visibleLayers.add(layer.id);
      });
      
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`🔍 ScrewManager: Updated visible layers: [${Array.from(this.state.visibleLayers).join(', ')}]`);
      }
      
      // Re-evaluate screw removability since layer visibility changed
      this.updateScrewRemovability();
    });
  }

  private handleScrewCountRequested(event: ScrewCountRequestedEvent): void {
    this.executeIfActive(() => {
      // Count only active screws (not collected and not being collected)
      // This ensures level completion only counts screws that actually need to be collected
      const activeScrews = this.getAllScrews().filter(screw => !screw.isCollected && !screw.isBeingCollected);
      const totalScrews = activeScrews.length;
      
      if (DEBUG_CONFIG.logScrewDebug) {
        const allScrews = this.getAllScrews().length;
        console.log(`ScrewManager: Responding to screw count request from ${event.source}. Active screws: ${totalScrews} (out of ${allScrews} total)`);
      }
      
      // Respond with screw count
      this.emit({
        type: 'screw_count:response',
        timestamp: Date.now(),
        totalScrews,
        requestSource: event.source
      });
    });
  }

  private handleRemainingScrewCountsRequested(event: import('../events/EventTypes').RemainingScrewCountsRequestedEvent): void {
    this.executeIfActive(() => {
      const screwsByColor = this.getRemainingScrewCountsByColor();
      
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`ScrewManager: Responding to remaining screws request. Counts by color:`, 
          Array.from(screwsByColor.entries()));
      }
      
      // Call the callback with the screw counts
      event.callback(screwsByColor);
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

      // Emit screw generation event with actual count for proper tracking
      this.emit({
        type: 'screws:generated',
        timestamp: Date.now(),
        shapeId: shape.id,
        screwCount: screwPositions.length,
        totalScrewsGenerated: this.getAllScrews().length
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
        
        // Keep natural inertia for realistic physics
        // Don't modify the inertia as it can cause strange rotation behavior
        
        // Wake up the body
        Sleeping.set(shape.body, false);
        
        // For composite bodies (like capsules), ensure they are properly positioned
        if (shape.isComposite && shape.body.parts && shape.body.parts.length > 1) {
          // The composite body's position might have shifted to center of mass
          // Update the shape's position to match the body's actual position
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
        // This helps when the screw is perfectly centered on the x-axis
        const nudgeDirection = Math.random() > 0.5 ? 1 : -1;
        const nudgeAmount = 0.001; // Very small nudge
        Body.setAngularVelocity(shape.body, nudgeDirection * nudgeAmount);
        
        // Also apply a tiny force to break perfect equilibrium
        const nudgeForce = 0.0001;
        Body.applyForce(shape.body, shape.body.position, {
          x: nudgeDirection * nudgeForce,
          y: 0
        });
        
        if (DEBUG_CONFIG.logShapeDebug) {
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`Placed ${screwPositions.length} screw on ${shape.type} shape (requested ${screwCount}) - shape kept dynamic for natural rotation`);
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
        source: 'ScrewManager',
        shape,
        screws: shape.getAllScrews()
      });
    });
  }

  // Calculate screw positions using shared strategy system or legacy fallback
  private calculateScrewPositions(shape: Shape, count: number): Vector2[] {
    // For composite bodies, ensure we're using the correct position
    // The body position might have shifted to center of mass after creation
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
          source: 'ScrewManager',
          holeIndex,
          screwId: screw.id,
          screwColor: screw.color
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
            source: 'ScrewManager',
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
        
        // Container was removed (probably because it was full) - redirect to holding hole
        console.log(`🔄 Container no longer exists - redirecting screw ${screw.id} to holding hole`);
        
        // Find an available holding hole
        const holdingHoleIndex = this.state.holdingHoles.findIndex(h => !h.screwId && !h.reservedBy);
        if (holdingHoleIndex !== -1) {
          const holdingHole = this.state.holdingHoles[holdingHoleIndex];
          
          // Reserve the holding hole
          holdingHole.reservedBy = screw.id;
          
          // Update screw's target
          screw.targetType = 'holding_hole';
          screw.targetContainerId = holdingHole.id;
          screw.targetHoleIndex = undefined;
          
          // Calculate holding hole position
          const holdingPositions = calculateHoldingHolePositions(this.state.virtualGameWidth);
          screw.targetPosition = holdingPositions[holdingHoleIndex];
          
          // Place in holding hole
          this.emit({
            type: 'holding_hole:filled',
            timestamp: Date.now(),
            source: 'ScrewManager',
            holeIndex: holdingHoleIndex,
            screwId: screw.id,
            screwColor: screw.color
          });
          
          console.log(`✅ Redirected screw ${screw.id} to holding hole ${holdingHoleIndex}`);
          
          // Clear the reservation after placing
          holdingHole.reservedBy = undefined;
          
          // Check if there's now a matching container available
          this.checkAndTransferFromHoldingHole(screw, holdingHoleIndex);
        } else {
          console.error(`❌ No holding holes available for screw ${screw.id} - this should not happen!`);
        }
      }
    }
  }

  private createScrewConstraint(screw: Screw, shape: Shape): void {
    if (DEBUG_CONFIG.logPhysicsDebug) {
      console.log(`Creating constraint for screw ${screw.id} on shape ${shape.id}`);
      console.log(`🔧 Constraint creation for ${shape.isComposite ? 'composite' : 'regular'} body:`);
      console.log(`  Shape.position: (${shape.position.x.toFixed(1)}, ${shape.position.y.toFixed(1)})`);
      console.log(`  Body.position: (${shape.body.position.x.toFixed(1)}, ${shape.body.position.y.toFixed(1)})`);
      console.log(`  Screw.position: (${screw.position.x.toFixed(1)}, ${screw.position.y.toFixed(1)})`);
    }
    
    // Use shared utilities to create constraint
    const constraintResult = ConstraintUtils.createSingleScrewConstraint(
      shape.body,
      screw
    );

    // Store the constraint and anchor body
    screw.setConstraint(constraintResult.constraint);
    screw.anchorBody = constraintResult.anchorBody;
    this.state.constraints.set(screw.id, constraintResult);

    // Emit physics body added event with unique source to avoid loop detection
    this.emit({
      type: 'physics:body:added',
      timestamp: Date.now(),
      source: `ScrewManager-${screw.id}`,
      bodyId: constraintResult.anchorBody.id.toString(),
      shape,
      body: constraintResult.anchorBody
    });

    // Emit constraint added event
    this.emit({
      type: 'physics:constraint:added',
      timestamp: Date.now(),
      source: `ScrewManager-${screw.id}`,
      constraintId: constraintResult.constraint.id?.toString() || screw.id,
      screw,
      constraint: constraintResult.constraint
    });
    
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`Constraint created for screw ${screw.id} on ${shape.isComposite ? 'composite' : 'regular'} body`);
    }
  }

  private removeConstraintOnly(screwId: string): boolean {
    return this.executeIfActive(() => {
      const screw = this.state.screws.get(screwId);
      if (!screw) return false;

      // Check if constraint already removed to prevent loops
      const constraintResult = this.state.constraints.get(screwId);
      const anchorBody = screw.anchorBody;
      
      // If no constraint or anchor body exists, already removed
      if (!constraintResult && !anchorBody) return false;
      
      if (constraintResult || anchorBody) {
        // Emit a single atomic removal event for both constraint and anchor body
        this.emit({
          type: 'physics:screw:removed:immediate',
          timestamp: Date.now(),
          source: 'ScrewManager',
          screwId: screwId,
          constraint: constraintResult?.constraint,
          anchorBody: constraintResult?.anchorBody || anchorBody,
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
          if (shape.isComposite) {
            console.log(`🔧 COMPOSITE BODY - parts: ${shape.body.parts.length}, type: ${shape.body.type}`);
          }
        }
        
        Body.setStatic(shape.body, false);
        Sleeping.set(shape.body, false);
        
        if (DEBUG_CONFIG.logPhysicsStateChanges && shape.isComposite) {
          console.log(`🔧 Shape ${shape.id} AFTER setStatic(false): position=(${shape.body.position.x.toFixed(1)}, ${shape.body.position.y.toFixed(1)})`);
        }
        
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
            console.log(`🔧 Shape ${shape.id} has 1 screw - making dynamic for rotation. BEFORE: isStatic=${shape.body.isStatic}, isSleeping=${shape.body.isSleeping}, position=(${shape.body.position.x.toFixed(1)}, ${shape.body.position.y.toFixed(1)})`);
          }
          if (shape.isComposite) {
            console.log(`🔧 COMPOSITE BODY - parts: ${shape.body.parts.length}, type: ${shape.body.type}`);
          }
        }
        
        const wasStatic = shape.body.isStatic;
        const positionBefore = { x: shape.body.position.x, y: shape.body.position.y };
        
        Body.setStatic(shape.body, false);
        Sleeping.set(shape.body, false);
        
        if (DEBUG_CONFIG.logPhysicsStateChanges && shape.isComposite) {
          console.log(`🔧 Shape ${shape.id} AFTER setStatic(false): position=(${shape.body.position.x.toFixed(1)}, ${shape.body.position.y.toFixed(1)})`);
          const posDiff = Math.sqrt(
            Math.pow(shape.body.position.x - positionBefore.x, 2) + 
            Math.pow(shape.body.position.y - positionBefore.y, 2)
          );
          if (posDiff > 0.1) {
            console.log(`⚠️ POSITION SHIFTED by ${posDiff.toFixed(1)} units when becoming dynamic!`);
          }
        }
        
        // Keep natural inertia for faster swinging
        // Don't modify inertia - let Matter.js calculate it naturally
        
        // For composite bodies, use a gentler initial angular velocity to prevent oscillation
        const initialAngularVelocity = shape.isComposite ? 0.01 : 0.02;
        Body.setAngularVelocity(shape.body, initialAngularVelocity);
        
        // Apply a small horizontal perturbation force to ensure physics activation
        // For composite bodies, use an even smaller force to prevent instability
        const forceMagnitude = shape.isComposite ? 0.0005 : 0.001;
        Body.applyForce(shape.body, shape.body.position, {
          x: (Math.random() - 0.5) * forceMagnitude,
          y: 0  // No vertical force to prevent jumping
        });
        
        if (DEBUG_CONFIG.logPhysicsStateChanges) {
          console.log(`🔧 Shape ${shape.id} AFTER: isStatic=${shape.body.isStatic} (was ${wasStatic}), isSleeping=${shape.body.isSleeping}, inertia=${shape.body.inertia}`);
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`Shape ${shape.id} has only 1 screw remaining - made dynamic to allow rotation with natural physics`);
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
      const constraintResult = this.state.constraints.get(screwId);
      if (constraintResult) {
        this.emit({
          type: 'physics:constraint:removed',
          timestamp: Date.now(),
          source: 'ScrewManager',
          constraintId: constraintResult.constraint.id?.toString() || screwId,
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
          source: 'ScrewManager',
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
        
        // Keep the shape's natural inertia for realistic rotation
        // Don't modify it too much as it can cause strange behavior
        
        // Don't add any initial angular velocity - let physics handle it naturally
        Body.setAngularVelocity(shape.body, 0);
        
        // Add moderate angular damping to prevent wild spinning
        shape.body.frictionAir = 0.01; // Moderate air friction for rotation damping
        
        if (DEBUG_CONFIG.logScrewDebug) {
        
          console.log(`Shape ${shape.id} has only 1 screw remaining - made dynamic with controlled rotation`);
        
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

        if (oldConstraint && oldConstraint.constraint) {
          // Emit constraint removed event
          this.emit({
            type: 'physics:constraint:removed',
            timestamp: Date.now(),
            source: 'ScrewManager',
            constraintId: oldConstraint.constraint.id?.toString() || remainingScrew.id,
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
              source: 'ScrewManager',
              bodyId: oldAnchorBody.id.toString(),
              anchorBody: oldAnchorBody, // Pass the actual body for immediate removal
              shape: this.state.allShapes.find(s => s.id === shapeId)!
            });
          }

          const shapeBody = oldConstraint.constraint.bodyA;
          const shape = this.state.allShapes.find(s => s.id === shapeId);
          
          if (shapeBody && shape) {
            // For composite bodies, ensure the shape position is synchronized with the body
            if (shape.isComposite) {
              shape.updateFromBody();
              if (DEBUG_CONFIG.logPhysicsDebug) {
                console.log(`🔧 Composite body constraint recreation:`);
                console.log(`  Shape.position: (${shape.position.x.toFixed(1)}, ${shape.position.y.toFixed(1)})`);
                console.log(`  Body.position: (${shapeBody.position.x.toFixed(1)}, ${shapeBody.position.y.toFixed(1)})`);
                console.log(`  Screw.position: (${remainingScrew.position.x.toFixed(1)}, ${remainingScrew.position.y.toFixed(1)})`);
              }
            }
            
            // Use shared utilities to recreate constraint
            const newConstraintResult = ConstraintUtils.createSingleScrewConstraint(
              shapeBody,
              remainingScrew
            );
            
            if (DEBUG_CONFIG.logPhysicsDebug) {
              console.log(`🔧 Recreated constraint for composite body`);
            }
            
            // Update screw references
            remainingScrew.setConstraint(newConstraintResult.constraint);
            remainingScrew.anchorBody = newConstraintResult.anchorBody;
            this.state.constraints.set(remainingScrew.id, newConstraintResult);
            
            // Emit physics body added event with unique source to avoid loop detection
            this.emit({
              type: 'physics:body:added',
              timestamp: Date.now(),
              source: `ScrewManager-${remainingScrew.id}-recreate`,
              bodyId: newConstraintResult.anchorBody.id.toString(),
              shape: this.state.allShapes.find(s => s.id === shapeId)!,
              body: newConstraintResult.anchorBody
            });
            
            // Emit constraint added event
            this.emit({
              type: 'physics:constraint:added',
              timestamp: Date.now(),
              source: `ScrewManager-${remainingScrew.id}-recreate`,
              constraintId: newConstraintResult.constraint.id?.toString() || remainingScrew.id,
              screw: remainingScrew,
              constraint: newConstraintResult.constraint
            });
          }
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
      
      // Debug logging for single-screw composite bodies
      if (DEBUG_CONFIG.logPhysicsDebug) {
        for (const shape of this.state.allShapes) {
          const shapeScrews = this.getScrewsForShape(shape.id).filter(s => !s.isCollected && !s.isBeingCollected);
          if (shapeScrews.length === 1 && shape.isComposite && shape.body && !shape.body.isStatic) {
            const screw = shapeScrews[0];
            const constraint = this.state.constraints.get(screw.id);
            if (constraint) {
              const distance = Math.sqrt(
                Math.pow(screw.position.x - shape.body.position.x, 2) +
                Math.pow(screw.position.y - shape.body.position.y, 2)
              );
              console.log(`🔄 Composite ${shape.id}: body=(${shape.body.position.x.toFixed(1)}, ${shape.body.position.y.toFixed(1)}), angle=${(shape.body.angle * 180 / Math.PI).toFixed(1)}°, screw=(${screw.position.x.toFixed(1)}, ${screw.position.y.toFixed(1)}), distance=${distance.toFixed(1)}`);
            }
          }
        }
      }
    });
  }

  public updateScrewRemovability(): void {
    this.executeIfActive(() => {
      let removableCount = 0;
      let totalCount = 0;
      
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`[SCREW_REMOVABILITY] Updating removability for all screws...`);
        console.log(`[SCREW_REMOVABILITY] Layer index lookup:`, Array.from(this.state.layerIndexLookup.entries()));
        console.log(`[SCREW_REMOVABILITY] Visible layers:`, Array.from(this.state.visibleLayers));
      }

      for (const screw of this.state.screws.values()) {
        if (screw.isCollected) continue;

        totalCount++;
        const wasRemovable = screw.isRemovable;
        const isRemovable = this.checkScrewRemovability(screw.id);
        screw.setRemovable(isRemovable);

        if (isRemovable) removableCount++;

        if (wasRemovable !== isRemovable) {
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`[SCREW_REMOVABILITY] Screw ${screw.id} removability changed: ${wasRemovable} -> ${isRemovable}`);
          }
          
          if (isRemovable) {
            this.emit({
              type: 'screw:unblocked',
              timestamp: Date.now(),
              source: 'ScrewManager',
              screw
            });
          } else {
            const blockingShapes = this.getBlockingShapes(screw);
            if (DEBUG_CONFIG.logScrewDebug) {
              console.log(`[SCREW_REMOVABILITY] Screw ${screw.id} blocked by ${blockingShapes.length} shapes:`, 
                blockingShapes.map(s => ({ id: s.id, type: s.type, layerId: s.layerId }))
              );
            }
            this.emit({
              type: 'screw:blocked',
              timestamp: Date.now(),
              source: 'ScrewManager',
              screw,
              blockingShapes
            });
          }
        }
      }

      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`[SCREW_REMOVABILITY] Update complete: ${removableCount}/${totalCount} screws are removable`);
      }
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

    // If the screw's own layer is not visible, the screw should not be removable
    if (!this.state.visibleLayers.has(screwShape.layerId)) {
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`[SCREW_BLOCKING] Screw ${screwId} not removable - layer ${screwShape.layerId} not visible`);
      }
      return false;
    }

    const screwLayerIndex = this.state.layerIndexLookup.get(screwShape.layerId) ?? -1;
    
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`[SCREW_BLOCKING] Checking removability for screw ${screwId}:`, {
        screwPosition: screw.position,
        screwRadius: UI_CONSTANTS.screws.radius,
        screwLayerId: screwShape.layerId,
        screwLayerIndex,
        visibleLayers: Array.from(this.state.visibleLayers)
      });
    }

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
      // Lower index = front (earlier layers), higher index = back (later layers)  
      // Shape blocks screw only if shape is in front (shape index < screw index)
      if (shapeLayerIndex >= screwLayerIndex) {
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`[SCREW_BLOCKING] Skipping shape ${shape.id} (layerIndex: ${shapeLayerIndex}) - not in front of screw ${screwId} (layerIndex: ${screwLayerIndex})`);
        }
        continue; // Skip shapes behind or on same layer as the screw
      }
      
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`[SCREW_BLOCKING] Checking if shape ${shape.id} (layerIndex: ${shapeLayerIndex}) blocks screw ${screwId} (layerIndex: ${screwLayerIndex})`);
      }

      const isBlocked = isScrewAreaBlocked(screw.position, UI_CONSTANTS.screws.radius, shape, true);
      
      if (DEBUG_CONFIG.logScrewDebug && isBlocked) {
        console.log(`[SCREW_BLOCKING] Screw ${screwId} BLOCKED by shape:`, {
          blockingShapeId: shape.id,
          blockingShapeType: shape.type,
          blockingShapeLayerId: shape.layerId,
          blockingShapeLayerIndex: shapeLayerIndex,
          blockingShapePosition: shape.body.position,
          blockingShapeBounds: shape.body.bounds,
          screwLayerIndex,
          indexComparison: `${shapeLayerIndex} < ${screwLayerIndex} (front blocks back)`
        });
      }
      
      if (isBlocked) {
        return false;
      }
    }
    
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`[SCREW_BLOCKING] Screw ${screwId} is REMOVABLE - no blocking shapes found`);
    }
    
    return true;
  }

  private getBlockingShapes(screw: Screw): Shape[] {
    const screwShape = this.state.allShapes.find(shape => shape.id === screw.shapeId);
    if (!screwShape) return [];

    const screwLayerIndex = this.state.layerIndexLookup.get(screwShape.layerId) ?? -1;
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
      // Lower index = front (earlier layers), higher index = back (later layers)  
      // Shape blocks screw only if shape is in front (shape index < screw index)
      if (shapeLayerIndex >= screwLayerIndex) {
        continue; // Skip shapes behind or on same layer as the screw
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
  private isScrewBlockedForGameplay(screwId: string): boolean {
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
      if (shapeLayerIndex >= screwLayerIndex) {
        continue;
      }

      // Use broader bounds-based check for gameplay blocking (less strict than visual occlusion)
      const isBlocked = isScrewAreaBlocked(screw.position, UI_CONSTANTS.screws.radius, shape, false);
      
      if (isBlocked) {
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`[GAMEPLAY_BLOCKING] Screw ${screwId} blocked for gameplay by shape ${shape.id}`);
        }
        return true;
      }
    }

    return false;
  }

  // All collision detection methods moved to shared utilities

  public startScrewCollection(screwId: string, targetPosition: Vector2, destinationInfo?: { type: 'container' | 'holding_hole'; id: string; holeIndex?: number }, forceRemoval = false): boolean {
    return this.executeIfActive(() => {
      const screw = this.state.screws.get(screwId);
      if (!screw || (!screw.isRemovable && !forceRemoval) || screw.isCollected || screw.isBeingCollected) {
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
        source: 'ScrewManager',
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
              source: 'ScrewManager',
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
              source: 'ScrewManager',
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

  /**
   * Gets the count of remaining screws by color.
   * Includes screws still in shapes (not collected) and screws in holding holes.
   * @returns Map of color to screw count
   */
  public getRemainingScrewCountsByColor(): Map<string, number> {
    const counts = new Map<string, number>();
    
    // Count screws still in shapes (not collected)
    for (const screw of this.state.screws.values()) {
      if (!screw.isCollected && !screw.isBeingCollected) {
        const count = counts.get(screw.color) || 0;
        counts.set(screw.color, count + 1);
      }
    }
    
    // Count screws in holding holes
    for (const holdingHole of this.state.holdingHoles) {
      if (holdingHole.screwId) {
        const screw = this.state.screws.get(holdingHole.screwId);
        if (screw && !screw.isBeingTransferred) {
          const count = counts.get(screw.color) || 0;
          counts.set(screw.color, count + 1);
        }
      }
    }
    
    return counts;
  }

  // Method to clear all screws (used for restart)
  public clearAllScrews(): void {
    this.executeIfActive(() => {
      if (DEBUG_CONFIG.logPhysicsDebug) {
        console.log(`Clearing all ${this.state.screws.size} screws and ${this.state.constraints.size} constraints`);
      }
      
      // Remove all constraints from physics
      this.state.constraints.forEach((constraintResult, screwId) => {
        this.emit({
          type: 'physics:constraint:removed',
          timestamp: Date.now(),
          source: 'ScrewManager',
          constraintId: constraintResult.constraint.id?.toString() || screwId,
          screw: this.state.screws.get(screwId)!
        });
      });
      
      // Remove all anchor bodies
      this.state.screws.forEach(screw => {
        if (screw.anchorBody) {
          this.emit({
            type: 'physics:body:removed:immediate',
            timestamp: Date.now(),
            source: 'ScrewManager',
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
            source: 'ScrewManager',
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
          const toPosition = calculateContainerHolePosition(containerIndex, emptyHoleIndex, this.state.virtualGameWidth, this.state.containers);
          
          // Start transfer animation
          this.emit({
            type: 'screw:transfer:started',
            timestamp: Date.now(),
            source: 'ScrewManager',
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
            source: 'ScrewManager',
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