/**
 * Event-driven ScrewManager implementation
 * Manages screws independently through events, removing direct dependencies
 */

import { BaseSystem } from '../core/BaseSystem';
import { Constraint, Bodies, Body, Sleeping } from 'matter-js';
import { Screw } from '@/game/entities/Screw';
import { Shape } from '@/game/entities/Shape';
import { Vector2, ScrewColor, Container, HoldingHole } from '@/types/game';
import { GAME_CONFIG, PHYSICS_CONSTANTS, UI_CONSTANTS, DEBUG_CONFIG } from '@/game/utils/Constants';
import { getRandomScrewColor } from '@/game/utils/Colors';
import { randomIntBetween } from '@/game/utils/MathUtils';
import { ShapeRegistry } from './ShapeRegistry';
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
        console.log(`${completed.length} screw animations completed`);
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
              destination: this.determineDestinationType(screw),
              points: 10 // Fixed 10 points per screw removed from shape
            });
            
            // Remove the screw from the shape's screws array now that animation is complete
            // Note: We need to clear shapeId AFTER removing from shape
            const shape = this.state.allShapes.find(s => s.id === screw.shapeId);
            if (shape) {
              shape.removeScrew(screwId);
              console.log(`Removed screw ${screwId} from shape ${shape.id} after animation`);
            }
            
            // Clear the shape reference - this screw no longer belongs to any shape
            screw.shapeId = '';
            
            // Keep all screws in state for rendering purposes
            // Mark their destination for game logic but don't delete them
            console.log(`🎯 Screw ${screwId} destination: targetType=${screw.targetType}, targetPosition=${JSON.stringify(screw.targetPosition)}`);
            
            if (screw.targetType === 'container') {
              console.log(`📦 KEEPING screw ${screwId} in state (went to container, needed for rendering) - Total screws: ${this.state.screws.size}`);
            } else if (screw.targetType === 'holding_hole') {
              console.log(`🏠 KEEPING screw ${screwId} in state (went to holding hole) - Total screws: ${this.state.screws.size}`);
            } else {
              // Fallback to position-based detection if targetType is not set
              const destinationType = this.determineDestinationType(screw);
              console.log(`⚠️ Screw ${screwId} targetType not set, using position-based detection: ${destinationType}`);
              if (destinationType === 'container') {
                console.log(`📦 KEEPING screw ${screwId} in state (went to container - fallback, needed for rendering) - Total screws: ${this.state.screws.size}`);
              } else {
                console.log(`🏠 KEEPING screw ${screwId} in state (went to holding hole - fallback) - Total screws: ${this.state.screws.size}`);
              }
            }
          }
        });
      }
      
      // Handle completed transfer animations
      if (transferCompleted.length > 0) {
        console.log(`${transferCompleted.length} screw transfer animations completed`);
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
            console.log(`🔍 Screw ${screwId} still belongs to destroyed shape ${event.shape.id} - isCollected: ${screw.isCollected}, targetType: ${screw.targetType}`);
          }
          screwsToRemove.push(screwId);
        }
      });
      
      // Remove screws and their constraints
      screwsToRemove.forEach(screwId => {
        this.removeScrewFromShape(screwId);
        this.state.screws.delete(screwId);
        console.log(`💀 DELETED screw ${screwId} due to shape destruction - Remaining: ${this.state.screws.size}`);
      });
      
      if (screwsToRemove.length > 0) {
        console.log(`Cleaned up ${screwsToRemove.length} screws from destroyed shape ${event.shape.id}`);
      }
    });
  }

  private handleBoundsChanged(event: BoundsChangedEvent): void {
    this.executeIfActive(() => {
      // Update stored virtual game dimensions for target calculations
      this.state.virtualGameWidth = event.width;
      this.state.virtualGameHeight = event.height;
      console.log(`🎯 ScrewManager: Updated virtual dimensions to ${event.width}x${event.height}`);
    });
  }

  private handleScrewClicked(event: ScrewClickedEvent): void {
    this.executeIfActive(() => {
      const screw = this.state.screws.get(event.screw.id);
      if (!screw) {
        console.log(`Screw ${event.screw.id} not found`);
        return;
      }
      
      // If screw is blocked, start shake animation
      if (!screw.isRemovable && !screw.isCollected && !screw.isBeingCollected) {
        console.log(`🔒 Screw ${event.screw.id} is blocked - starting shake animation`);
        screw.startShake();
        console.log(`📳 Shake animation started for screw ${event.screw.id} - isShaking: ${screw.isShaking}`);
        
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
        console.log(`Screw ${event.screw.id} is already collected or being collected`);
        return;
      }

      // Determine where the screw should go (container or holding hole)
      const destination = this.findScrewDestination(screw);
      if (!destination) {
        console.log(`No available destination for screw ${event.screw.id}`);
        return;
      }
      
      // Reserve the destination if it's a container
      if (destination.type === 'container' && destination.holeIndex !== undefined) {
        const container = this.state.containers.find(c => c.id === destination.id);
        if (container) {
          container.reservedHoles[destination.holeIndex] = event.screw.id;
          console.log(`Reserved container ${destination.id} hole ${destination.holeIndex} for screw ${event.screw.id}`);
        }
      } else if (destination.type === 'holding_hole') {
        const holdingHole = this.state.holdingHoles.find(h => h.id === destination.id);
        if (holdingHole) {
          // Mark holding hole as reserved
          holdingHole.reservedBy = event.screw.id;
          console.log(`Reserved holding hole ${destination.id} for screw ${event.screw.id}`);
        }
      }
      
      // Start the collection animation instead of immediately removing
      if (this.startScrewCollection(event.screw.id, destination.position, destination)) {
        console.log(`Started collection animation for screw ${event.screw.id} to ${destination.type} at (${destination.position.x.toFixed(1)}, ${destination.position.y.toFixed(1)})`);
        
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
            console.log(`🔍 handleScrewClicked: Shape ${shape.id} has ${activeCount} active screws remaining after removing ${event.screw.id}`);
            console.log(`🔍 Remaining screws: ${remainingScrews.map(s => `${s.id}(collected:${s.isCollected},collecting:${s.isBeingCollected})`).join(', ')}`);
          }
          
          if (activeCount === 0) {
            if (DEBUG_CONFIG.logPhysicsStateChanges) {
              console.log(`Last screw removed from shape ${shape.id}, letting gravity take effect naturally`);
            }
            // No manual forces - let gravity and physics handle the falling motion naturally
          } else if (activeCount === 1) {
            if (DEBUG_CONFIG.logPhysicsStateChanges) {
              console.log(`📌 Shape ${shape.id} will have 1 screw remaining - should become dynamic in removeConstraintOnly`);
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
      console.log(`ScrewManager save state: ${this.state.screws.size} screws, ${this.state.constraints.size} constraints`);
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
      console.log(`🎯 ScrewManager: Container state updated - ${event.containers.length} containers`);
      
      // Check if any screws in holding holes can now transfer to new/updated containers
      this.checkAllHoldingHolesForTransfers();
    });
  }
  
  private handleHoldingHoleStateUpdated(event: import('@/game/events/EventTypes').HoldingHoleStateUpdatedEvent): void {
    this.executeIfActive(() => {
      this.state.holdingHoles = event.holdingHoles;
      console.log(`🎯 ScrewManager: Holding hole state updated - ${event.holdingHoles.length} holes`);
    });
  }

  private handleScrewTransferStarted(event: ScrewTransferStartedEvent): void {
    this.executeIfActive(() => {
      console.log(`📨 ScrewManager: RECEIVED screw:transfer:started for screw ${event.screwId}`);
      
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

        console.log(`✅ ScrewManager: Starting transfer - screw ${screw.id} (${screw.color}) to container ${targetContainer.id} (${targetContainer.color})`);
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
        console.log(`🎯 ScrewManager: Started transfer animation for screw ${screw.id} from hole ${event.fromHoleIndex} to container ${event.toContainerIndex} hole ${event.toHoleIndex}`);
      } else {
        console.error(`❌ ScrewManager: Screw ${event.screwId} NOT FOUND in state! Available screws:`, Array.from(this.state.screws.keys()));
        console.log(`🔍 ScrewManager: Total screws in state: ${this.state.screws.size}`);
        
        // Debug: Log all screws with their states
        console.log(`🔍 ScrewManager: All screws in state with details:`);
        Array.from(this.state.screws.entries()).forEach(([id, screw]) => {
          console.log(`  - ${id}: collected=${screw.isCollected}, beingCollected=${screw.isBeingCollected}, targetType=${screw.targetType || 'none'}, position=(${screw.position.x.toFixed(1)}, ${screw.position.y.toFixed(1)})`);
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
      console.log(`🏁 ScrewManager: RECEIVED transfer completed for screw ${event.screwId}`);
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
          console.log(`🔧 Using screw's transferToHoleIndex: ${holeIndex}`);
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
            
            console.log(`📍 ScrewManager: Updated screw ${event.screwId} position to container hole (${holeX}, ${holeY})`);
          }
        }
        
        // Keep the screw in state for rendering, but mark it as fully collected/transferred
        screw.collect(); // This marks it as isCollected=true
        
        // Clear the shape reference - this screw no longer belongs to any shape
        screw.shapeId = '';
        
        console.log(`📦 ScrewManager: KEEPING screw ${event.screwId} in state after transfer to container (needed for rendering) - Total: ${this.state.screws.size}`);
      } else {
        console.log(`❌ ScrewManager: Screw ${event.screwId} not found for transfer completion`);
      }
    });
  }

  private handleScrewColorsRequested(event: ScrewColorsRequestedEvent): void {
    this.executeIfActive(() => {
      console.log(`🎨 ScrewManager: RECEIVED screw colors request for container ${event.containerIndex}`);
      
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
      
      console.log(`🎨 ScrewManager: Active screws - On shapes: ${onShapeCount}, In holding holes: ${inHoldingHoleCount}`);
      console.log(`🎨 ScrewManager: Active screw colors (by frequency):`, 
        activeScrewColors.map(color => `${color}(${colorCounts.get(color)})`).join(', '));
      
      // Call the callback with the active colors
      event.callback(activeScrewColors);
    });
  }

  private handleScrewTransferColorCheck(event: ScrewTransferColorCheckEvent): void {
    this.executeIfActive(() => {
      console.log(`🔍 ScrewManager: RECEIVED color check request for ${event.holdingHoleScrews.length} screws to container color ${event.targetColor}`);
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
            console.log(`✅ ScrewManager: Screw ${screwId} (${screw.color}) matches target color ${event.targetColor}`);
          } else if (screw) {
            console.log(`❌ ScrewManager: Screw ${screwId} (${screw.color}) does NOT match target color ${event.targetColor}`);
          } else {
            console.log(`❌ ScrewManager: Screw ${screwId} not found in state`);
          }
        }
      });
      
      console.log(`🔍 ScrewManager: Found ${validTransfers.length} valid color-matched transfers`);
      console.log(`🔍 ScrewManager: Total screws in state: ${this.state.screws.size}`);
      
      // Call the callback with the valid transfers
      event.callback(validTransfers);
    });
  }

  // Core Screw Management Methods
  public generateScrewsForShape(shape: Shape, preferredColors?: ScrewColor[]): void {
    this.executeIfActive(() => {
      if (shape.screws.length > 0) return; // Already has screws

      // Get possible positions first to determine realistic limits
      const possiblePositions = this.getShapeScrewLocations(shape);
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
      const definition = this.getShapeDefinition(shape);
      const behavior = definition?.behavior || {};
      
      // Make shape static only if it has more than one screw
      if (screwPositions.length > 1) {
        Body.setStatic(shape.body, true);
        console.log(`Placed ${screwPositions.length} screws on ${shape.type} shape (requested ${screwCount}) - shape made static`);
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
        
        console.log(`Placed ${screwPositions.length} screw on ${shape.type} shape (requested ${screwCount}) - shape kept dynamic for rotation with initial motion`);
      } else {
        // Single screw but configured to be static
        Body.setStatic(shape.body, true);
        console.log(`Placed ${screwPositions.length} screw on ${shape.type} shape (requested ${screwCount}) - shape made static per configuration`);
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

  private calculateScrewPositions(shape: Shape, count: number): Vector2[] {
    const definition = this.getShapeDefinition(shape);
    
    if (!definition) {
      // Fallback to legacy method if no definition found
      return this.calculateScrewPositionsLegacy(shape, count);
    }
    
    const placement = definition.screwPlacement;
    const screwRadius = UI_CONSTANTS.screws.radius;
    const minSeparation = placement.minSeparation || screwRadius * 4;
    
    if (count === 1 && definition.behavior.allowSingleScrew !== false) {
      // For single screw, always use center
      return [{ ...shape.position }];
    }
    
    // Get positions based on strategy
    const possiblePositions = this.getPositionsForStrategy(shape, definition);
    
    // Determine maximum screws based on configuration
    const maxPossibleScrews = this.getMaxScrewsFromDefinition(shape, definition, possiblePositions);
    const actualCount = Math.min(count, maxPossibleScrews);
    
    // Select positions without overlap
    const selectedPositions = this.selectNonOverlappingPositions(
      possiblePositions,
      actualCount,
      minSeparation
    );
    
    console.log(`Placed ${selectedPositions.length} screws on ${shape.type} shape (requested ${count}, max possible: ${maxPossibleScrews})`);
    return selectedPositions;
  }

  private calculateScrewPositionsLegacy(shape: Shape, count: number): Vector2[] {
    // Legacy implementation for backwards compatibility
    const possiblePositions = this.getShapeScrewLocations(shape);
    const screwRadius = UI_CONSTANTS.screws.radius;
    const minSeparation = screwRadius * 4;
    
    if (count === 1) {
      return [possiblePositions.center];
    }

    const maxPossibleScrews = this.getMaxScrewsForShape(shape, possiblePositions);
    const actualCount = Math.min(count, maxPossibleScrews);
    
    const allPositions = [
      ...possiblePositions.corners,
      ...possiblePositions.alternates,
      possiblePositions.center
    ];
    
    const selectedPositions = this.selectNonOverlappingPositions(allPositions, actualCount, minSeparation);
    
    console.log(`Placed ${selectedPositions.length} screws on ${shape.type} shape (requested ${count}, max possible: ${maxPossibleScrews})`);
    return selectedPositions;
  }

  private getMaxScrewsForShape(shape: Shape, positions: { corners: Vector2[], center: Vector2, alternates: Vector2[] }): number {
    const totalPositions = positions.corners.length + positions.alternates.length + 1; // +1 for center
    
    // Calculate shape-specific limits based on area and type
    const shapeArea = this.getShapeArea(shape);
    let areaBasedLimit: number;
    
    if (shapeArea < 2500) areaBasedLimit = 1;
    else if (shapeArea < 4000) areaBasedLimit = 2;
    else if (shapeArea < 6000) areaBasedLimit = 3;
    else if (shapeArea < 10000) areaBasedLimit = 4;
    else if (shapeArea < 15000) areaBasedLimit = 5;
    else areaBasedLimit = 6;
    
    // Return the minimum of available positions and area-based limit
    return Math.min(totalPositions, areaBasedLimit);
  }

  private selectNonOverlappingPositions(positions: Vector2[], count: number, minSeparation: number): Vector2[] {
    if (positions.length === 0) return [];
    if (count === 1) return [positions[positions.length - 1]]; // Use center (last position)
    
    const selected: Vector2[] = [];
    const available = [...positions];
    
    // Shuffle positions for random selection
    for (let i = available.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [available[i], available[j]] = [available[j], available[i]];
    }
    
    for (const position of available) {
      if (selected.length >= count) break;
      
      // Check if this position overlaps with any selected position
      const overlaps = selected.some(selected => {
        const distance = Math.sqrt(
          Math.pow(position.x - selected.x, 2) + 
          Math.pow(position.y - selected.y, 2)
        );
        return distance < minSeparation;
      });
      
      if (!overlaps) {
        selected.push(position);
      }
    }
    
    // If we couldn't place enough screws due to overlap, ensure we have at least the center
    if (selected.length === 0 && positions.length > 0) {
      selected.push(positions[positions.length - 1]); // Center is typically last
    }
    
    return selected;
  }

  private getShapeScrewLocations(shape: Shape): { corners: Vector2[], center: Vector2, alternates: Vector2[] } {
    const screwRadius = UI_CONSTANTS.screws.radius;
    const margin = screwRadius * 2.5; // Ensure screw doesn't touch edges
    const minSeparation = screwRadius * 4; // Minimum distance between screws
    
    let corners: Vector2[] = [];
    let alternates: Vector2[] = [];
    const center = { ...shape.position };
    
    switch (shape.type) {
      case 'rectangle':
      case 'square':
        const width = shape.width || 60;
        const height = shape.height || 60;
        const halfWidth = width / 2 - margin;
        const halfHeight = height / 2 - margin;
        
        // Check if shape is too small for corner placement
        const tooNarrow = width < minSeparation + (margin * 2);
        const tooShort = height < minSeparation + (margin * 2);
        
        if (tooNarrow && tooShort) {
          // Very small shape - only center
          corners = [];
          alternates = [];
        } else if (tooNarrow) {
          // Too narrow for side-by-side corners - use top/bottom centers
          corners = [];
          alternates = [
            { x: shape.position.x, y: shape.position.y - halfHeight }, // Top center
            { x: shape.position.x, y: shape.position.y + halfHeight }, // Bottom center
          ];
        } else if (tooShort) {
          // Too short for stacked corners - use left/right centers
          corners = [];
          alternates = [
            { x: shape.position.x - halfWidth, y: shape.position.y }, // Left center
            { x: shape.position.x + halfWidth, y: shape.position.y }, // Right center
          ];
        } else {
          // Normal size - use all corners
          corners = [
            { x: shape.position.x - halfWidth, y: shape.position.y - halfHeight }, // Top-left
            { x: shape.position.x + halfWidth, y: shape.position.y - halfHeight }, // Top-right
            { x: shape.position.x - halfWidth, y: shape.position.y + halfHeight }, // Bottom-left
            { x: shape.position.x + halfWidth, y: shape.position.y + halfHeight }, // Bottom-right
          ];
        }
        break;
        
      case 'circle':
        const radius = shape.radius || 30;
        const cornerRadius = radius - margin;
        
        if (radius < minSeparation / 2 + margin) {
          // Small circle - only center
          corners = [];
        } else {
          // Place 4 "corners" at cardinal directions
          corners = [
            { x: shape.position.x, y: shape.position.y - cornerRadius }, // Top
            { x: shape.position.x + cornerRadius, y: shape.position.y }, // Right
            { x: shape.position.x, y: shape.position.y + cornerRadius }, // Bottom
            { x: shape.position.x - cornerRadius, y: shape.position.y }, // Left
          ];
        }
        break;
        
      case 'polygon':
        const polygonRadius = shape.radius || 30;
        const polygonSides = shape.sides || 5; // Default to pentagon if not specified
        
        if (polygonRadius < minSeparation / 2 + margin) {
          // Small polygon - only center
          corners = [];
        } else {
          // Generate polygon vertices with rotation applied, matching Matter.js Bodies.polygon() orientation
          const polygonVertices: Vector2[] = [];
          for (let i = 0; i < polygonSides; i++) {
            const angle = (i * Math.PI * 2) / polygonSides + (Math.PI / polygonSides) + shape.rotation;
            polygonVertices.push({
              x: shape.position.x + Math.cos(angle) * polygonRadius,
              y: shape.position.y + Math.sin(angle) * polygonRadius,
            });
          }
          
          // Calculate positions inset from each vertex
          corners = polygonVertices.map(vertex => {
            const direction = {
              x: shape.position.x - vertex.x,
              y: shape.position.y - vertex.y
            };
            const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
            const normalized = {
              x: direction.x / length,
              y: direction.y / length
            };
            
            return {
              x: vertex.x + normalized.x * margin,
              y: vertex.y + normalized.y * margin
            };
          });
        }
        break;
        
      case 'capsule':
        const capsuleWidth = shape.width || 120;
        
        // The capsule was designed with its width to perfectly fit screws
        // Use the same formula as ShapeFactory: Width = screwCount * (screwRadius * 2) + (screwCount - 1) * spacing
        const capsuleScrewRadius = UI_CONSTANTS.screws.radius;
        const spacing = 5; // Same spacing used in dimensions calculation
        const screwDiameter = capsuleScrewRadius * 2;
        
        // Back-calculate how many screws this capsule was designed for
        // Width = n * 2r + (n-1) * s = n(2r + s) - s
        // Solving for n: n = (Width + s) / (2r + s)
        const actualScrewCount = Math.round((capsuleWidth + spacing) / (screwDiameter + spacing));
        
        // Y position should be at the vertical midpoint of the capsule
        const y = shape.position.y;
        
        corners = [];
        
        if (actualScrewCount === 1) {
          // Single screw goes in the center
          corners.push({ x: shape.position.x, y });
        } else {
          // Add 5px margin from capsule ends
          const endMargin = 5;
          const availableWidth = capsuleWidth - (2 * endMargin);
          
          // Distribute screws evenly within the available width (excluding margins)
          const leftEdge = shape.position.x - capsuleWidth / 2 + endMargin;
          
          if (actualScrewCount === 2) {
            // For 2 screws, place them near the ends but with margin
            corners.push({ x: leftEdge + capsuleScrewRadius, y });
            corners.push({ x: leftEdge + availableWidth - capsuleScrewRadius, y });
          } else {
            // For 3+ screws, distribute evenly across available width
            for (let i = 0; i < actualScrewCount; i++) {
              const t = i / (actualScrewCount - 1); // 0 to 1
              const x = leftEdge + capsuleScrewRadius + t * (availableWidth - 2 * capsuleScrewRadius);
              corners.push({ x, y });
            }
          }
        }
        
        // No alternates for capsule - screws only go on top
        alternates = [];
        break;
        
      case 'arrow':
      case 'chevron':
      case 'star':
      case 'horseshoe':
        // For vertex-based shapes, use perimeter points
        if (shape.body.vertices && shape.body.vertices.length > 0) {
          const perimeterPoints = shape.getPerimeterPoints(8); // Get 8 evenly distributed points
          
          // Filter out points that are too close to the edge
          const validPoints = perimeterPoints.filter(point => {
            // Check if the point is inside the shape with enough margin
            const distToEdge = this.getDistanceToNearestEdge(point, shape);
            return distToEdge >= margin;
          });
          
          // Use up to 4 points as corners
          corners = validPoints.slice(0, 4);
          alternates = validPoints.slice(4);
        }
        break;
        
      default:
        // Fallback to just center
        break;
    }
    
    return { corners, center, alternates };
  }

  private getDistanceToNearestEdge(point: Vector2, shape: Shape): number {
    // Simple approximation - check distance to shape center and bounds
    const bounds = shape.getBounds();
    const centerDist = Math.sqrt(
      Math.pow(point.x - shape.position.x, 2) + 
      Math.pow(point.y - shape.position.y, 2)
    );
    
    // Estimate based on bounds
    const maxDimension = Math.max(bounds.width, bounds.height);
    return (maxDimension / 2) - centerDist;
  }

  private getShapeArea(shape: Shape): number {
    switch (shape.type) {
      case 'rectangle':
        const width = shape.width || 60;
        const height = shape.height || 60;
        return width * height;
      case 'square':
        const size = shape.width || 60;
        return size * size;
      case 'circle':
        const radius = shape.radius || 30;
        return Math.PI * radius * radius;
      case 'polygon':
        const polygonRadius = shape.radius || 30;
        const polygonSides = shape.sides || 5;
        // General formula for regular polygon area: (n * r^2 * sin(2π/n)) / 2
        return (polygonSides * polygonRadius * polygonRadius * Math.sin(2 * Math.PI / polygonSides)) / 2;
      case 'capsule':
        const capsuleWidth = shape.width || 120;
        const capsuleHeight = shape.height || (UI_CONSTANTS.screws.radius * 2 + 10);
        const capsuleRadius = capsuleHeight / 2;
        // Area = rectangle area + 2 semicircles (which equal one full circle)
        const rectArea = (capsuleWidth - capsuleHeight) * capsuleHeight;
        const circleArea = Math.PI * capsuleRadius * capsuleRadius;
        return rectArea + circleArea;
      case 'arrow':
      case 'chevron':
      case 'star':
      case 'horseshoe':
        // For vertex-based shapes, calculate area from bounds
        const bounds = shape.getBounds();
        // Use 70% of bounding box area as approximation
        return bounds.width * bounds.height * 0.7;
      default:
        return 3600;
    }
  }

  private getShapeDefinition(shape: Shape): ShapeDefinition | null {
    const registry = ShapeRegistry.getInstance();
    
    // Map shape type to definition ID
    const definitionId = this.getDefinitionIdFromShape(shape);
    if (!definitionId) return null;
    
    return registry.getDefinition(definitionId) || null;
  }

  private getDefinitionIdFromShape(shape: Shape): string | null {
    if (shape.type === 'polygon' && shape.sides) {
      // Map polygon sides to specific definition IDs
      const polygonMap: Record<number, string> = {
        3: 'triangle',
        5: 'pentagon',
        6: 'hexagon',
        7: 'heptagon',
        8: 'octagon'
      };
      return polygonMap[shape.sides] || null;
    }
    
    // Direct mapping for other shapes
    return shape.type;
  }

  private getPositionsForStrategy(shape: Shape, definition: ShapeDefinition): Vector2[] {
    const strategy = definition.screwPlacement.strategy;
    
    switch (strategy) {
      case 'corners':
        return this.getCornerPositions(shape, definition);
      case 'perimeter':
        return this.getPerimeterPositions(shape, definition);
      case 'capsule':
        return this.getCapsulePositions(shape, definition);
      case 'custom':
        return this.getCustomPositions(shape, definition);
      default:
        // Fallback to legacy positions
        const legacy = this.getShapeScrewLocations(shape);
        return [...legacy.corners, ...legacy.alternates, legacy.center];
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private getCornerPositions(shape: Shape, _definition: ShapeDefinition): Vector2[] {
    const legacy = this.getShapeScrewLocations(shape);
    return [...legacy.corners, ...legacy.alternates, legacy.center];
  }

  private getPerimeterPositions(shape: Shape, definition: ShapeDefinition): Vector2[] {
    const perimeterPoints = definition.screwPlacement.perimeterPoints || 8;
    const margin = definition.screwPlacement.perimeterMargin || 30;
    
    if (shape.vertices && shape.vertices.length > 0) {
      const points = shape.getPerimeterPoints(perimeterPoints);
      
      // Filter out points too close to edge
      const validPoints = points.filter(point => {
        const distToEdge = this.getDistanceToNearestEdge(point, shape);
        return distToEdge >= margin;
      });
      
      // Add center position
      validPoints.push({ ...shape.position });
      
      return validPoints;
    }
    
    // Fallback to corners
    return this.getCornerPositions(shape, definition);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private getCapsulePositions(shape: Shape, _definition: ShapeDefinition): Vector2[] {
    const legacy = this.getShapeScrewLocations(shape);
    return [...legacy.corners, legacy.center];
  }

  private getCustomPositions(shape: Shape, definition: ShapeDefinition): Vector2[] {
    const customPositions = definition.screwPlacement.customPositions || [];
    
    return customPositions.map(pos => ({
      x: shape.position.x + pos.position.x,
      y: shape.position.y + pos.position.y
    }));
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
      const shapeArea = this.getShapeArea(shape);
      
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

  private findScrewDestination(screw: Screw): { type: 'container' | 'holding_hole'; position: Vector2; id: string; holeIndex?: number } | null {
    console.log(`🔍 Finding destination for screw ${screw.id} (color: ${screw.color})`);
    console.log(`🔍 Available containers:`, this.state.containers.map(c => ({
      id: c.id,
      color: c.color,
      isFull: c.isFull,
      holes: c.holes,
      availableSlots: c.holes ? c.holes.filter(h => h === null).length : 0
    })));
    
    // Try to find a matching color container first
    // Use the actual container state from GameState
    const matchingContainer = this.state.containers.find(container => 
      container.color === screw.color && !container.isFull
    );
    
    if (matchingContainer) {
      console.log(`🎯 Found matching container for ${screw.color} screw:`, matchingContainer.id);
      // Find the next available hole in the container (check both filled and reserved)
      let holeIndex = -1;
      
      // Ensure holes array exists and has the right length
      if (!matchingContainer.holes || matchingContainer.holes.length !== matchingContainer.maxHoles) {
        console.log(`⚠️ Container ${matchingContainer.id} has invalid holes array:`, matchingContainer.holes);
        return null;
      }
      
      for (let i = 0; i < matchingContainer.maxHoles; i++) {
        if (matchingContainer.holes[i] === null && (!matchingContainer.reservedHoles || matchingContainer.reservedHoles[i] === null)) {
          holeIndex = i;
          break;
        }
      }
      
      if (holeIndex !== -1) {
        // Calculate hole position using same logic as GameManager rendering
        const containerWidth = UI_CONSTANTS.containers.width;
        const containerHeight = UI_CONSTANTS.containers.height;
        const spacing = UI_CONSTANTS.containers.spacing;
        const startY = UI_CONSTANTS.containers.startY;
        const containerIndex = this.state.containers.findIndex(c => c.id === matchingContainer.id);
        
        // Calculate actual container position (matches GameManager.renderContainers exactly)
        const totalWidth = (this.state.containers.length * containerWidth) + ((this.state.containers.length - 1) * spacing);
        const virtualGameWidth = this.state.virtualGameWidth; // Use current virtual game width
        const startX = (virtualGameWidth - totalWidth) / 2;
        const containerX = startX + (containerIndex * (containerWidth + spacing));
        
        // Calculate hole position within container (matches GameManager logic exactly)
        const holeCount = UI_CONSTANTS.containers.hole.count;
        const holeSpacing = containerWidth / (holeCount + 1); // +1 for proper spacing
        const holeX = containerX + holeSpacing + (holeIndex * holeSpacing);
        const holeY = startY + containerHeight / 2;
        
        console.log(`🎯 SCREW DESTINATION: Container ${containerIndex} hole ${holeIndex} at (${holeX.toFixed(1)}, ${holeY.toFixed(1)}) - containerX=${containerX.toFixed(1)}, startX=${startX.toFixed(1)}, totalWidth=${totalWidth.toFixed(1)}, virtualGameWidth=${virtualGameWidth}`);
        
        return {
          type: 'container',
          position: { x: holeX, y: holeY },
          id: matchingContainer.id,
          holeIndex: holeIndex
        };
      }
    }
    
    // Fallback to holding holes
    // Use the actual holding hole state from GameState
    const availableHole = this.state.holdingHoles.find(hole => 
      hole.screwId === null && !hole.reservedBy
    );
    
    if (availableHole) {
      console.log(`🎯 SCREW DESTINATION: Holding hole ${availableHole.id} at (${availableHole.position.x.toFixed(1)}, ${availableHole.position.y.toFixed(1)})`);
      return {
        type: 'holding_hole',
        position: { ...availableHole.position },
        id: availableHole.id
      };
    }
    
    console.log(`No available destination found for screw ${screw.id} (color: ${screw.color})`);
    return null;
  }

  private getAvailableContainers(): Container[] {
    // Return the actual container state from GameState
    return this.state.containers;
  }

  private getAvailableHoldingHoles(): HoldingHole[] {
    // Return the actual holding hole state from GameState
    return this.state.holdingHoles;
  }

  private determineDestinationType(screw: Screw): 'container' | 'holding_hole' {
    // Check if screw went to a container or holding hole based on Y position
    if (screw.targetPosition) {
      const containerY = UI_CONSTANTS.containers.startY + (UI_CONSTANTS.containers.height / 2);
      const holdingY = UI_CONSTANTS.holdingHoles.startY;
      const midPoint = (containerY + holdingY) / 2;
      return screw.targetPosition.y < midPoint ? 'container' : 'holding_hole';
    }
    return 'holding_hole';
  }

  private placeScrewInDestination(screw: Screw): void {
    if (!screw.targetPosition || !screw.targetType) {
      console.error(`❌ Cannot place screw ${screw.id} - missing targetPosition or targetType`);
      return;
    }

    if (DEBUG_CONFIG.logScrewPlacement) {
      console.log(`📍 Placing screw ${screw.id} in ${screw.targetType} (targetContainerId: ${screw.targetContainerId}, targetHoleIndex: ${screw.targetHoleIndex})`);
    }

    if (screw.targetType === 'holding_hole') {
      // Find the holding hole by ID
      const holeIndex = this.state.holdingHoles.findIndex(h => h.id === screw.targetContainerId);
      const holdingHole = this.state.holdingHoles[holeIndex];
      
      if (holeIndex !== -1 && holdingHole) {
        // Clear the reservation
        if (holdingHole.reservedBy === screw.id) {
          holdingHole.reservedBy = undefined;
          console.log(`Cleared reservation for screw ${screw.id} in holding hole ${holdingHole.id}`);
        }
        
        // Emit event to place screw in holding hole
        this.emit({
          type: 'holding_hole:filled',
          timestamp: Date.now(),
          holeIndex,
          screwId: screw.id
        });
        
        if (DEBUG_CONFIG.logScrewPlacement) {
          console.log(`✅ Placed screw ${screw.id} in holding hole ${holeIndex}`);
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
          console.log(`Cleared reservation for screw ${screw.id} in container ${container.id} hole ${screw.targetHoleIndex}`);
        }
        
        // Place the screw ID in the specific hole
        container.holes[screw.targetHoleIndex] = screw.id;
        
        // Check if container is now full
        const filledCount = container.holes.filter(h => h !== null).length;
        if (filledCount === container.maxHoles) {
          // Mark container as full
          container.isFull = true;
          console.log(`Container ${container.id} is now full with ${filledCount} screws`);
          
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
          console.log(`✅ Placed screw ${screw.id} in container ${containerIndex} hole ${screw.targetHoleIndex}`);
        }
      } else {
        console.error(`❌ Failed to find container for screw ${screw.id} - containerIndex: ${containerIndex}, targetHoleIndex: ${screw.targetHoleIndex}`);
      }
    }
  }

  private findClosestHoldingHoleIndex(position: Vector2): number {
    let closestIndex = 0;
    let closestDistance = Infinity;
    
    this.state.holdingHoles.forEach((hole, index) => {
      const distance = Math.sqrt(
        Math.pow(hole.position.x - position.x, 2) + 
        Math.pow(hole.position.y - position.y, 2)
      );
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    
    return closestIndex;
  }

  private findClosestContainerIndex(position: Vector2): number {
    let closestIndex = 0;
    let closestDistance = Infinity;
    
    this.state.containers.forEach((container, index) => {
      const distance = Math.sqrt(
        Math.pow(container.position.x - position.x, 2) + 
        Math.pow(container.position.y - position.y, 2)
      );
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    
    return closestIndex;
  }

  private createScrewConstraint(screw: Screw, shape: Shape): void {
    console.log(`Creating constraint for screw ${screw.id} on shape ${shape.id}`);
    
    // For composite bodies, use the actual physics body position, not the Shape entity position
    const bodyPosition = shape.body.position;
    const offsetX = screw.position.x - bodyPosition.x;
    const offsetY = screw.position.y - bodyPosition.y;

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
    
    console.log(`Constraint created for screw ${screw.id}: offset (${offsetX.toFixed(1)}, ${offsetY.toFixed(1)})`);
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
        console.log(`Shape ${shape?.id}: Total screws=${allShapeScrews.length}, Constraining screws=${shapeScrews.length} after removing ${screwId}`);
        console.log(`  Screws: ${allShapeScrews.map(s => `${s.id}(collected:${s.isCollected},collecting:${s.isBeingCollected})`).join(', ')}`);
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
            console.log(`🔧 Calculated linear velocity from rotation: pivot=(${screw.position.x.toFixed(1)}, ${screw.position.y.toFixed(1)}), radius=(${dx.toFixed(1)}, ${dy.toFixed(1)}), velocity=(${linearVelocity.x.toFixed(2)}, ${linearVelocity.y.toFixed(2)})`);
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
        if (DEBUG_CONFIG.logPhysicsStateChanges) {
          console.log(`🔧 Preserving layer collision filter for ${shape.id}: group=${filter.group}, category=${filter.category}, mask=${filter.mask}`);
          console.log(`🔧 Shape ${shape.id} AFTER: isStatic=${shape.body.isStatic}, isSleeping=${shape.body.isSleeping}, velocity=(${shape.body.velocity.x.toFixed(2)}, ${shape.body.velocity.y.toFixed(2)}), mass=${shape.body.mass}, density=${shape.body.density}`);
          console.log(`Shape ${shape.id} now has no screws - made dynamic and given impulse to fall`);
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
          console.log(`🔧 Shape ${shape.id} has 1 screw - making dynamic for rotation. BEFORE: isStatic=${shape.body.isStatic}, isSleeping=${shape.body.isSleeping}`);
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
          console.log(`Shape ${shape.id} has only 1 screw remaining - made dynamic to allow rotation with enhanced physics`);
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
        
        console.log(`Shape ${shape.id} has only 1 screw remaining - made dynamic to allow rotation with enhanced physics`);
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
        console.log(`🔧 Preserving layer collision filter for ${shape.id}: group=${filter.group}, category=${filter.category}, mask=${filter.mask}`);
        
        console.log(`Shape ${shape.id} now has no screws - made dynamic and given impulse to fall`);
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
          console.log(`Screw ${screw.id} removability changed: ${wasRemovable} -> ${isRemovable}`);
          
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

      if (this.isScrewAreaBlocked(screw, shape, true)) {
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

      if (this.isScrewAreaBlocked(screw, shape, true)) {
        blockingShapes.push(shape);
      }
    }

    return blockingShapes;
  }

  private isScrewAreaBlocked(screw: Screw, shape: Shape, precisCheck: boolean = false): boolean {
    if (precisCheck) {
      // Use actual screw radius plus a small margin for better blocking detection
      return this.isCircleIntersectingShape(screw.position, UI_CONSTANTS.screws.radius + 1, shape);
    } else {
      return this.isPointInShapeBoundsWithMargin(screw.position, shape);
    }
  }

  private isPointInShapeBoundsWithMargin(point: Vector2, shape: Shape): boolean {
    const bounds = shape.getBounds();
    const margin = 2;
    return (
      point.x >= bounds.x + margin &&
      point.x <= bounds.x + bounds.width - margin &&
      point.y >= bounds.y + margin &&
      point.y <= bounds.y + bounds.height - margin
    );
  }

  private isCircleIntersectingShape(center: Vector2, radius: number, shape: Shape): boolean {
    switch (shape.type) {
      case 'circle':
        return this.isCircleIntersectingCircle(center, radius, shape);
      case 'rectangle':
      case 'square':
        return this.isCircleIntersectingRectangle(center, radius, shape);
      case 'polygon':
        return this.isCircleIntersectingPolygon(center, radius, shape);
      case 'capsule':
        return this.isCircleIntersectingCapsule(center, radius, shape);
      case 'arrow':
      case 'chevron':
      case 'star':
      case 'horseshoe':
        return this.isCircleIntersectingVertexShape(center, radius, shape);
      default:
        return false;
    }
  }

  private isCircleIntersectingCircle(center: Vector2, radius: number, shape: Shape): boolean {
    const shapeRadius = shape.radius || 30;
    const distance = Math.sqrt(
      Math.pow(center.x - shape.position.x, 2) + 
      Math.pow(center.y - shape.position.y, 2)
    );
    return distance < (radius + shapeRadius);
  }

  private isCircleIntersectingRectangle(center: Vector2, radius: number, shape: Shape): boolean {
    const width = shape.width || 60;
    const height = shape.height || 60;

    const cos = Math.cos(-shape.rotation);
    const sin = Math.sin(-shape.rotation);
    const dx = center.x - shape.position.x;
    const dy = center.y - shape.position.y;
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;

    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const closestX = Math.max(-halfWidth, Math.min(halfWidth, localX));
    const closestY = Math.max(-halfHeight, Math.min(halfHeight, localY));

    const distanceSquared = Math.pow(localX - closestX, 2) + Math.pow(localY - closestY, 2);
    return distanceSquared < (radius * radius);
  }

  private isCircleIntersectingPolygon(center: Vector2, radius: number, shape: Shape): boolean {
    const shapeRadius = shape.radius || 30;
    const sides = shape.sides || 5; // Default to 5 sides if not specified
    
    // Transform screw center to local coordinates (same as rectangle method)
    const cos = Math.cos(-shape.rotation);
    const sin = Math.sin(-shape.rotation);
    const dx = center.x - shape.position.x;
    const dy = center.y - shape.position.y;
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;
    
    // For precise polygon intersection, we need to check if the circle intersects with the polygon
    // Generate the polygon vertices in local space
    const vertices: Vector2[] = [];
    for (let i = 0; i < sides; i++) {
      const angle = (i * Math.PI * 2) / sides - Math.PI / 2; // Start from top
      vertices.push({
        x: Math.cos(angle) * shapeRadius,
        y: Math.sin(angle) * shapeRadius
      });
    }
    
    // Check if circle center is inside polygon
    if (this.isPointInPolygon({ x: localX, y: localY }, vertices)) {
      return true;
    }
    
    // Check if circle intersects any edge of the polygon
    for (let i = 0; i < vertices.length; i++) {
      const v1 = vertices[i];
      const v2 = vertices[(i + 1) % vertices.length];
      
      if (this.isCircleIntersectingLineSegment({ x: localX, y: localY }, radius, v1, v2)) {
        return true;
      }
    }
    
    return false;
  }
  
  private isPointInPolygon(point: Vector2, vertices: Vector2[]): boolean {
    let inside = false;
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      if (((vertices[i].y > point.y) !== (vertices[j].y > point.y)) &&
          (point.x < (vertices[j].x - vertices[i].x) * (point.y - vertices[i].y) / (vertices[j].y - vertices[i].y) + vertices[i].x)) {
        inside = !inside;
      }
    }
    return inside;
  }
  
  private isCircleIntersectingLineSegment(center: Vector2, radius: number, p1: Vector2, p2: Vector2): boolean {
    // Find the closest point on the line segment to the circle center
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const lengthSquared = dx * dx + dy * dy;
    
    if (lengthSquared === 0) {
      // Degenerate case: line segment is a point
      const distanceSquared = Math.pow(center.x - p1.x, 2) + Math.pow(center.y - p1.y, 2);
      return distanceSquared <= radius * radius;
    }
    
    // Project center onto the line
    const t = Math.max(0, Math.min(1, ((center.x - p1.x) * dx + (center.y - p1.y) * dy) / lengthSquared));
    const closestPoint = {
      x: p1.x + t * dx,
      y: p1.y + t * dy
    };
    
    // Check distance from center to closest point
    const distanceSquared = Math.pow(center.x - closestPoint.x, 2) + Math.pow(center.y - closestPoint.y, 2);
    return distanceSquared <= radius * radius;
  }

  private isCircleIntersectingCapsule(center: Vector2, radius: number, shape: Shape): boolean {
    const capsuleWidth = shape.width || 120;
    const capsuleHeight = shape.height || (UI_CONSTANTS.screws.radius * 2 + 10);
    const capsuleRadius = capsuleHeight / 2; // Radius of the semicircle ends
    
    // Transform screw center to local coordinates (same as rectangle method)
    const cos = Math.cos(-shape.rotation);
    const sin = Math.sin(-shape.rotation);
    const dx = center.x - shape.position.x;
    const dy = center.y - shape.position.y;
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;
    
    // Capsule geometry: rectangle in the middle + two circles at the ends
    const rectWidth = capsuleWidth - (2 * capsuleRadius);
    
    // Check intersection with the middle rectangle (in local coordinates)
    const halfRectWidth = rectWidth / 2;
    const halfCapsuleHeight = capsuleHeight / 2;
    const closestX = Math.max(-halfRectWidth, Math.min(halfRectWidth, localX));
    const closestY = Math.max(-halfCapsuleHeight, Math.min(halfCapsuleHeight, localY));
    
    const rectDistanceSquared = Math.pow(localX - closestX, 2) + Math.pow(localY - closestY, 2);
    if (rectDistanceSquared < (radius * radius)) {
      return true;
    }
    
    // Check intersection with left semicircle (in local coordinates)
    const leftCircleLocalX = -rectWidth / 2;
    const leftCircleLocalY = 0;
    const leftDistanceSquared = Math.pow(localX - leftCircleLocalX, 2) + Math.pow(localY - leftCircleLocalY, 2);
    if (leftDistanceSquared < Math.pow(radius + capsuleRadius, 2)) {
      return true;
    }
    
    // Check intersection with right semicircle (in local coordinates)
    const rightCircleLocalX = rectWidth / 2;
    const rightCircleLocalY = 0;
    const rightDistanceSquared = Math.pow(localX - rightCircleLocalX, 2) + Math.pow(localY - rightCircleLocalY, 2);
    if (rightDistanceSquared < Math.pow(radius + capsuleRadius, 2)) {
      return true;
    }
    
    return false;
  }

  private isCircleIntersectingVertexShape(center: Vector2, radius: number, shape: Shape): boolean {
    // For shapes defined by vertices (arrow, chevron, star, horseshoe)
    if (!shape.body.vertices || shape.body.vertices.length === 0) {
      return false;
    }
    
    const vertices = shape.body.vertices;
    
    // Transform screw center to local coordinates
    const cos = Math.cos(-shape.rotation);
    const sin = Math.sin(-shape.rotation);
    const dx = center.x - shape.position.x;
    const dy = center.y - shape.position.y;
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;
    const localCenter = { x: localX, y: localY };
    
    // Transform vertices to local coordinates relative to shape position
    const localVertices: Vector2[] = vertices.map(v => ({
      x: (v.x - shape.position.x) * cos - (v.y - shape.position.y) * sin,
      y: (v.x - shape.position.x) * sin + (v.y - shape.position.y) * cos
    }));
    
    // Check if circle center is inside the polygon
    if (this.isPointInPolygon(localCenter, localVertices)) {
      return true;
    }
    
    // Check if circle intersects any edge of the polygon
    for (let i = 0; i < localVertices.length; i++) {
      const v1 = localVertices[i];
      const v2 = localVertices[(i + 1) % localVertices.length];
      
      if (this.isCircleIntersectingLineSegment(localCenter, radius, v1, v2)) {
        return true;
      }
    }
    
    return false;
  }

  private isCircleIntersectingRectangleBounds(center: Vector2, radius: number, bounds: { x: number; y: number; width: number; height: number }): boolean {
    // Find the closest point on the rectangle to the circle center
    const closestX = Math.max(bounds.x, Math.min(center.x, bounds.x + bounds.width));
    const closestY = Math.max(bounds.y, Math.min(center.y, bounds.y + bounds.height));
    
    // Calculate distance from circle center to closest point
    const distance = Math.sqrt(
      Math.pow(center.x - closestX, 2) + 
      Math.pow(center.y - closestY, 2)
    );
    
    return distance < radius;
  }

  private isCircleIntersectingCircleGeometry(center1: Vector2, radius1: number, center2: Vector2, radius2: number): boolean {
    const distance = Math.sqrt(
      Math.pow(center1.x - center2.x, 2) + 
      Math.pow(center1.y - center2.y, 2)
    );
    return distance < (radius1 + radius2);
  }

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
            
            console.log(`Screw ${screw.id} collection completed`);
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
            
            console.log(`Screw ${screw.id} transfer animation completed`);
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
            console.log(`📳 Shake animation completed for screw ${screw.id}`);
          }
        }
      }
      // Only log when there are shaking screws to avoid spam
      if (shakingCount > 0 && Date.now() % 1000 < 50) {
        console.log(`📳 Updating ${shakingCount} shaking screws`);
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
      console.log(`Clearing all ${this.state.screws.size} screws and ${this.state.constraints.size} constraints`);
      
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
      
      console.log('All screws and holding holes cleared');
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
          console.log(`🔄 Found matching container for screw ${screw.id} (${screw.color}) - transferring from holding hole ${holeIndex} to container ${containerIndex} hole ${emptyHoleIndex}`);
          
          // Reserve the container hole immediately
          matchingContainer.reservedHoles[emptyHoleIndex] = screw.id;
          console.log(`📌 Reserved container ${containerIndex} hole ${emptyHoleIndex} for screw ${screw.id}`);
          
          // Calculate positions for animation
          const fromPosition = this.state.holdingHoles[holeIndex].position;
          const toPosition = this.calculateContainerHolePosition(containerIndex, emptyHoleIndex);
          
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

  private calculateContainerHolePosition(containerIndex: number, holeIndex: number): Vector2 {
    // Use actual UI constants to match the calculation logic in GameState and GameManager
    const containerWidth = UI_CONSTANTS.containers.width;
    const containerHeight = UI_CONSTANTS.containers.height;  
    const spacing = UI_CONSTANTS.containers.spacing;
    const startY = UI_CONSTANTS.containers.startY;
    const virtualGameWidth = this.state.virtualGameWidth; // Use current virtual game width instead of canvas width
    const totalWidth = (this.state.containers.length * containerWidth) + ((this.state.containers.length - 1) * spacing);
    const startX = (virtualGameWidth - totalWidth) / 2;
    const containerX = startX + (containerIndex * (containerWidth + spacing));
    
    // Use the same hole spacing calculation as GameManager and GameState
    const holeCount = UI_CONSTANTS.containers.hole.count;
    const holeSpacing = containerWidth / (holeCount + 1); // +1 for proper spacing
    const holeX = containerX + holeSpacing + (holeIndex * holeSpacing);
    const holeY = startY + containerHeight / 2;
    
    return { x: holeX, y: holeY };
  }

  // Serialization methods for save/load
  public toSerializable(): { animatingScrews: import('@/types/game').SerializableScrew[] } {
    const animatingScrews: import('@/types/game').SerializableScrew[] = [];

    this.state.screws.forEach(screw => {
      const shape = this.state.allShapes.find(s => s.id === screw.shapeId);
      let relativeOffset: Vector2 | undefined;
      
      if (shape) {
        relativeOffset = {
          x: screw.position.x - shape.position.x,
          y: screw.position.y - shape.position.y
        };
      }

      if (screw.isBeingCollected && relativeOffset) {
        animatingScrews.push({
          id: screw.id,
          shapeId: screw.shapeId,
          position: screw.position,
          color: screw.color,
          isRemovable: screw.isRemovable,
          isCollected: screw.isCollected,
          isBeingCollected: screw.isBeingCollected,
          relativeOffset,
          animationTarget: screw.targetPosition,
          animationProgress: screw.collectionProgress
        });
      }
    });

    return { animatingScrews };
  }

  protected onDestroy(): void {
    this.clearAllScrews();
  }
}