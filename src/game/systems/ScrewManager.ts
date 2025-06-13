/**
 * Event-driven ScrewManager implementation
 * Orchestrates screw-related services through a modular architecture
 */

import { BaseSystem } from '../core/BaseSystem';
import { Screw } from '@/game/entities/Screw';
import { Shape } from '@/game/entities/Shape';
import { Vector2, ScrewColor, Container, HoldingHole } from '@/types/game';
import { GAME_CONFIG, DEBUG_CONFIG } from '@/shared/utils/Constants';
import { ScrewConstraintResult } from '@/shared/physics/ConstraintUtils';
import { eventBus } from '../events/EventBus';
// Utility imports no longer needed due to refactoring
import {
  ScrewAnimationService,
  ScrewCollisionService,
  ScrewPlacementService,
  ScrewPhysicsService,
  ScrewTransferService,
  ScrewEventHandler,
} from './screw';
import {
  ScrewTransferStartedEvent,
  ScrewTransferCompletedEvent,
} from '../events/EventTypes';

interface ScrewManagerState {
  screws: Map<string, Screw>;
  constraints: Map<string, ScrewConstraintResult>;
  screwCounter: number;
  containerColors: ScrewColor[];
  containers: Container[];
  holdingHoles: HoldingHole[];
  allShapes: Shape[];
  layerIndexLookup: Map<string, number>;
  virtualGameWidth: number;
  virtualGameHeight: number;
  visibleLayers: Set<string>;
}

export class ScrewManager extends BaseSystem {
  private state: ScrewManagerState;
  
  // Services
  private animationService: ScrewAnimationService;
  private collisionService: ScrewCollisionService;
  private placementService: ScrewPlacementService;
  private physicsService: ScrewPhysicsService;
  private transferService: ScrewTransferService;
  private eventHandler: ScrewEventHandler;
  
  // Cleanup counter for periodic tasks
  private cleanupCounter = 0;
  
  // Throttle screw removability updates
  private lastRemovabilityUpdate = 0;
  private static readonly REMOVABILITY_UPDATE_THROTTLE_MS = 100;
  
  // Throttle removability debug logging
  private lastRemovabilityDebugLog = 0;
  private static readonly REMOVABILITY_DEBUG_THROTTLE_MS = 5000; // 5 seconds

  constructor() {
    super('ScrewManager');
    
    // Initialize state
    this.state = {
      screws: new Map(),
      constraints: new Map(),
      screwCounter: 0,
      containerColors: [],
      containers: [],
      holdingHoles: [],
      allShapes: [],
      layerIndexLookup: new Map(),
      virtualGameWidth: 0,
      virtualGameHeight: 0,
      visibleLayers: new Set(),
    };

    // Initialize services
    this.animationService = new ScrewAnimationService(
      this.state.screws,
      eventBus,
      'ScrewManager'
    );

    this.collisionService = new ScrewCollisionService(this.state);

    this.placementService = new ScrewPlacementService(
      { screwCounter: this.state.screwCounter },
      eventBus,
      'ScrewManager'
    );

    this.physicsService = new ScrewPhysicsService(
      this.state, // Pass the entire state object so it maintains reference
      eventBus,
      'ScrewManager'
    );

    this.transferService = new ScrewTransferService(
      {
        screws: this.state.screws,
        containers: this.state.containers,
        holdingHoles: this.state.holdingHoles,
        virtualGameWidth: this.state.virtualGameWidth,
      },
      eventBus,
      'ScrewManager'
    );

    this.eventHandler = new ScrewEventHandler(
      this.state,
      eventBus,
      'ScrewManager',
      {
        onShapeCreated: () => this.handleShapeCreated(),
        onScrewClicked: this.handleScrewClicked.bind(this),
        onPhysicsBodyAdded: this.handlePhysicsBodyAdded.bind(this),
        onScrewDestroyed: this.handleScrewDestroyed.bind(this),
        onBoundsChanged: (width: number) => this.handleBoundsChanged(width),
        onTransferStarted: this.handleTransferStarted.bind(this),
        onTransferCompleted: this.handleTransferCompleted.bind(this),
        onCheckTransfers: this.checkAllHoldingHolesForTransfers.bind(this),
        onClearAll: this.clearAllScrews.bind(this),
        onUpdateRemovability: this.updateScrewRemovability.bind(this),
      }
    );
  }

  protected async onInitialize(): Promise<void> {
    this.setupEventHandlers();

    // Initialize bounds from game config
    this.state.virtualGameWidth = GAME_CONFIG.canvas.width;
    this.state.virtualGameHeight = GAME_CONFIG.canvas.height;
    
    // Debug: Check container colors on initialization
    if (DEBUG_CONFIG.logProgressTracking) {
      console.log(`🔧 ScrewManager initialized with container colors:`, this.state.containerColors);
    }
  }

  public update(deltaTime: number): void {
    this.executeIfActive(() => {
      
      // Cleanup counter for periodic tasks
      this.cleanupCounter++;
      if (this.cleanupCounter >= 1800) { // ~30 seconds at 60 FPS
        this.cleanupThrottlingStates();
        this.cleanupCounter = 0;
      }

      // Validate and cleanup reservations periodically
      if (this.cleanupCounter % 180 === 0) { // ~3 seconds at 60 FPS
        this.validateAndCleanupReservations();
      }

      // Update collection animations
      const { completed, screws: collectedScrews } = this.animationService.updateCollectionAnimations(deltaTime);
      if (completed.length > 0) {
        for (let i = 0; i < completed.length; i++) {
          const screwId = completed[i];
          const screw = collectedScrews[i];
          if (screw) {
            // Mark as collected FIRST before physics updates
            screw.collect();
            
            // Find associated shape for logging (constraint already removed when collection started)
            const shape = this.state.allShapes.find(s => s.id === screw.shapeId);
            if (shape) {
              const remainingScrews = shape.getAllScrews().filter(s => !s.isCollected);
              if (DEBUG_CONFIG.logScrewDebug) {
                console.log(`🔧 Collection animation complete for screw ${screwId} from shape ${shape.id}. Remaining active screws: ${remainingScrews.length}`);
              }
              
              // Note: Physics constraint was already removed when collection started for immediate falling
              
              this.emit({
                type: 'screw:collected',
                timestamp: Date.now(),
                source: 'ScrewManager',
                screw,
                destination: screw.targetType === 'container' ? 'container' : 'holding_hole',
                points: 10
              });
            } else {
              console.warn(`⚠️ Could not find shape for collected screw ${screwId}`);
            }

            // Update transfer service state before placement to ensure fresh container/holding hole data
            const transferState = this.transferService as unknown as { state: { virtualGameWidth: number; containers: Container[]; holdingHoles: HoldingHole[] } };
            transferState.state.virtualGameWidth = this.state.virtualGameWidth;
            transferState.state.containers = this.state.containers;
            transferState.state.holdingHoles = this.state.holdingHoles;
            
            // Place in destination
            this.transferService.placeScrewInDestination(screw);
          }
        }
      }

      // Update transfer animations
      const { completed: transferCompleted } = this.animationService.updateTransferAnimations(deltaTime);
      if (transferCompleted.length > 0) {
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`Transfer animations completed: ${transferCompleted.join(', ')}`);
        }
      }

      // Update shake animations
      this.animationService.updateShakeAnimations(deltaTime);

      // Note: Screw position synchronization is handled by LayerManager.updateShapePositions()
      // which calls screw.updateFromAnchorBody() for each screw every frame

      // Update screw removability with throttling
      const now = Date.now();
      if (now - this.lastRemovabilityUpdate > ScrewManager.REMOVABILITY_UPDATE_THROTTLE_MS) {
        this.updateScrewRemovability();
        this.lastRemovabilityUpdate = now;
      }
    });
  }

  private setupEventHandlers(): void {
    this.eventHandler.setupEventHandlers(this.subscribe.bind(this));
  }

  // Core Screw Management Methods
  public generateScrewsForShape(shape: Shape, preferredColors?: ScrewColor[]): void {
    this.executeIfActive(() => {
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`🎯 ScrewManager.generateScrewsForShape called for shape ${shape.id}, preferredColors:`, preferredColors);
        console.log(`🎯 Shape ${shape.id} current state:`, {
          screwsLength: shape.screws.length,
          screwIds: shape.screws.map(s => s.id),
          shapePosition: { x: shape.position.x, y: shape.position.y },
          shapeType: shape.type
        });
      }
      
      const screws = this.placementService.generateScrewsForShape(shape, preferredColors);
      
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`🔧 PlacementService generated ${screws.length} screws for shape ${shape.id}:`, screws.map(s => ({ id: s.id, color: s.color, position: s.position })));
      }
      
      // Update counter state
      const placementState = this.placementService as unknown as { state: { screwCounter: number } };
      this.state.screwCounter = placementState.state.screwCounter;
      
      // Add screws to state and create constraints
      screws.forEach(screw => {
        this.state.screws.set(screw.id, screw);
        this.physicsService.createScrewConstraint(screw, shape);
        
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`🔧 Added screw ${screw.id} to ScrewManager state and created constraint`);
        }
      });
      
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`🎯 After screw generation, shape ${shape.id} now reports ${shape.screws.length} screws, ScrewManager has ${screws.length} screws for this shape`);
      }
      
      // Emit shape:screws:ready event to notify LayerManager that this shape's screws are ready
      if (DEBUG_CONFIG.logProgressTracking) {
        console.log(`🚀 ScrewManager: Emitting shape:screws:ready for shape ${shape.id} with ${screws.length} screws`);
      }
      this.emit({
        type: 'shape:screws:ready',
        timestamp: Date.now(),
        source: 'ScrewManager',
        shape,
        screws
      });
    });
  }

  // Removability and collision detection delegation
  private checkScrewRemovability(screwId: string): boolean {
    return this.collisionService.checkScrewRemovability(screwId);
  }

  private getBlockingShapes(screw: Screw): Shape[] {
    return this.collisionService.getBlockingShapes(screw);
  }

  private isScrewBlockedForGameplay(screwId: string): boolean {
    return this.collisionService.isScrewBlockedForGameplay(screwId);
  }

  public updateScrewRemovability(): void {
    this.executeIfActive(() => {
      // Throttled debug logging for removability updates
      if (DEBUG_CONFIG.logScrewRemovabilityUpdates) {
        const now = Date.now();
        if (now - this.lastRemovabilityDebugLog > ScrewManager.REMOVABILITY_DEBUG_THROTTLE_MS) {
          console.log(`🔄 ScrewManager: updateScrewRemovability called, visibleLayers:`, {
            visibleLayersSize: this.state.visibleLayers.size,
            visibleLayers: Array.from(this.state.visibleLayers),
            stateReference: this.state.visibleLayers
          });
          this.lastRemovabilityDebugLog = now;
        }
      }
      this.collisionService.updateScrewRemovability();
    });
  }

  // Physics delegation
  public removeScrewFromShape(screwId: string): boolean {
    return this.executeIfActive(() => {
      const screw = this.state.screws.get(screwId);
      if (!screw) return false;

      // Remove constraint
      const removed = this.physicsService.removeConstraintOnly(screwId);
      
      if (removed) {
        // Update shape constraints if needed
        this.physicsService.updateShapeConstraints(screw.shapeId);
        
        // Remove from shape's screw list
        const shape = this.state.allShapes.find(s => s.id === screw.shapeId);
        if (shape) {
          shape.removeScrew(screwId);
        }
      }

      return removed;
    }) || false;
  }

  public updateScrewPositions(): void {
    this.executeIfActive(() => {
      this.physicsService.updateScrewPositions();
    });
  }

  // Transfer and collection delegation
  private findScrewDestination(screw: Screw): { type: 'container' | 'holding_hole'; position: Vector2; id: string; holeIndex?: number } | null {
    // Update transfer service state with current values
    const transferState = this.transferService as unknown as { state: { virtualGameWidth: number; containers: Container[]; holdingHoles: HoldingHole[] } };
    transferState.state.virtualGameWidth = this.state.virtualGameWidth;
    transferState.state.containers = this.state.containers;
    transferState.state.holdingHoles = this.state.holdingHoles;
    
    return this.transferService.findScrewDestination(screw);
  }

  public startScrewCollection(screwId: string, targetPosition: Vector2, destinationInfo?: { type: 'container' | 'holding_hole'; id: string; holeIndex?: number }, forceRemoval = false): boolean {
    return this.executeIfActive(() => {
      // Attempt to start collection first (this sets isBeingCollected atomically)
      const success = this.transferService.startScrewCollection(screwId, targetPosition, destinationInfo, forceRemoval);
      
      if (success) {
        // Only remove physics constraint if collection state was successfully set
        this.physicsService.removeConstraintOnly(screwId);
        
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`🔧 Physics constraint removed atomically for screw ${screwId} (collection confirmed)`);
        }
      }
      
      return success;
    }) || false;
  }

  private checkAllHoldingHolesForTransfers(): void {
    this.executeIfActive(() => {
      // Update transfer service state
      const transferState = this.transferService as unknown as { state: { virtualGameWidth: number; containers: Container[]; holdingHoles: HoldingHole[] } };
      transferState.state.containers = this.state.containers;
      transferState.state.holdingHoles = this.state.holdingHoles;
      transferState.state.virtualGameWidth = this.state.virtualGameWidth;
      
      this.transferService.checkAllHoldingHolesForTransfers();
    });
  }

  // Public accessors
  public getAllScrews(): Screw[] {
    return Array.from(this.state.screws.values());
  }

  public getAnimatingScrews(): Screw[] {
    return this.animationService.getAnimatingScrews();
  }

  public getScrewsForShape(shapeId: string): Screw[] {
    return Array.from(this.state.screws.values()).filter(
      screw => screw.shapeId === shapeId
    );
  }

  public getScrew(screwId: string): Screw | null {
    return this.state.screws.get(screwId) || null;
  }

  public getRemainingScrewCountsByColor(): Map<string, number> {
    const counts = new Map<string, number>();
    
    // Initialize with container colors
    for (const color of this.state.containerColors) {
      counts.set(color, 0);
    }
    
    // Create map of screws already in containers by color (only exclude screws in same-color containers)
    const screwsInContainersByColor = new Map<string, Set<string>>();
    for (const container of this.state.containers) {
      if (!screwsInContainersByColor.has(container.color)) {
        screwsInContainersByColor.set(container.color, new Set());
      }
      const colorSet = screwsInContainersByColor.get(container.color)!;
      
      for (const screwId of container.holes) {
        if (screwId) {
          colorSet.add(screwId);
        }
      }
    }
    
    // Count screws in shapes that need container space
    for (const screw of this.state.screws.values()) {
      if (!screw.isCollected && !screw.isBeingCollected) {
        const currentCount = counts.get(screw.color) || 0;
        counts.set(screw.color, currentCount + 1);
      }
    }
    
    // Also count screws that are currently being transferred from holding holes to containers
    // These screws still need container space and should be included in sizing calculations
    for (const screw of this.state.screws.values()) {
      if (screw.isBeingTransferred && !screw.isCollected) {
        const currentCount = counts.get(screw.color) || 0;
        counts.set(screw.color, currentCount + 1);
      }
    }
    
    // Count screws in holding holes - these also need container space eventually
    // But exclude ones already in same-color containers
    for (const hole of this.state.holdingHoles) {
      if (hole.screwId) {
        const screw = this.state.screws.get(hole.screwId);
        if (screw) {
          const sameColorContainerScrews = screwsInContainersByColor.get(screw.color) || new Set();
          // Only count if not already in a same-color container
          if (!sameColorContainerScrews.has(hole.screwId)) {
            const currentCount = counts.get(screw.color) || 0;
            counts.set(screw.color, currentCount + 1);
          }
        }
      }
    }
    
    return counts;
  }

  public cleanupStaleReservations(): void {
    this.validateAndCleanupReservations();
  }

  public clearAllScrews(): void {
    this.executeIfActive(() => {
      // Remove all constraints
      for (const screwId of this.state.screws.keys()) {
        this.physicsService.removeConstraintOnly(screwId);
      }
      
      // Clear all screws
      this.state.screws.clear();
      this.state.constraints.clear();
      this.state.allShapes.length = 0; // Clear array without replacing reference
      this.state.screwCounter = 0;
      
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log('All screws cleared');
      }
    });
  }

  // Event handler callbacks
  private handleShapeCreated(): void {
    // Shape added to allShapes by event handler
  }

  private handlePhysicsBodyAdded(shape: Shape): void {
    if (DEBUG_CONFIG.logProgressTracking) {
      console.log(`🔧 ScrewManager.handlePhysicsBodyAdded called for shape ${shape.id}, current screws on shape: ${shape.screws.length}`);
    }
    
    // Check if shape already has screws
    if (shape.screws && shape.screws.length > 0) {
      if (DEBUG_CONFIG.logProgressTracking) {
        console.log(`⏭️ Shape ${shape.id} already has ${shape.screws.length} screws, skipping generation in ScrewManager`);
      }
      return;
    }
    
    if (DEBUG_CONFIG.logProgressTracking) {
      console.log(`🎨 Container colors available for screw generation:`, this.state.containerColors);
    }
    
    this.generateScrewsForShape(shape, this.state.containerColors);
    
    if (DEBUG_CONFIG.logProgressTracking) {
      console.log(`🔧 After generateScrewsForShape, shape ${shape.id} now has ${shape.screws.length} screws`);
    }
  }

  private handleScrewClicked(screw: Screw, forceRemoval: boolean): void {
    // Check if screw is blocked
    const isBlockedForGameplay = this.isScrewBlockedForGameplay(screw.id);

    if (isBlockedForGameplay && !screw.isCollected && !screw.isBeingCollected && !forceRemoval) {
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`👆 Screw ${screw.id} is blocked - starting shake animation`);
      }
      
      // Trigger shake animation
      screw.startShake();
      
      // Vibrate if available
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(200);
      }
      
      this.emit({
        type: 'screw:blocked:clicked',
        timestamp: Date.now(),
        source: 'ScrewManager',
        screw,
        position: screw.position
      });
      
      return;
    }

    // Skip if already collected or being collected
    if (screw.isCollected || screw.isBeingCollected) {
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`⏭️ Screw ${screw.id} already collected (${screw.isCollected}) or being collected (${screw.isBeingCollected}) - skipping duplicate event`);
      }
      return;
    }

    // Find destination
    const destination = this.findScrewDestination(screw);
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`🎯 Looking for destination for screw ${screw.id} (color: ${screw.color}):`, destination);
    }
    if (!destination) {
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`❌ No destination found for screw ${screw.id} (color: ${screw.color})`);
      }
      if (forceRemoval) {
        console.warn(`Force removal requested but no destination for screw ${screw.id}`);
      }
      return;
    }

    // Handle reservation for destination
    if (destination.type === 'container' && destination.holeIndex !== undefined) {
      const container = this.state.containers.find(c => c.id === destination.id);
      if (container) {
        container.reservedHoles[destination.holeIndex] = screw.id;
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`Reserved container ${destination.id} hole ${destination.holeIndex} for screw ${screw.id}`);
        }
      }
    } else if (destination.type === 'holding_hole') {
      const holdingHole = this.state.holdingHoles.find(h => h.id === destination.id);
      if (holdingHole) {
        holdingHole.reservedBy = screw.id;
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`Reserved holding hole ${destination.id} for screw ${screw.id}`);
        }
      }
    }

    // Start collection (this will also handle physics constraint removal atomically)
    if (this.startScrewCollection(screw.id, destination.position, destination, forceRemoval)) {
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`✅ Started collection for screw ${screw.id} to ${destination.type}`);
      }

      // Find associated shape and update active screw count
      const shape = this.state.allShapes.find(s => s.id === screw.shapeId);
      if (shape) {
        // Now the screw should be marked as isBeingCollected, so count correctly
        const activeScrews = this.getScrewsForShape(screw.shapeId).filter(
          s => !s.isCollected && !s.isBeingCollected
        );
        const activeCount = activeScrews.length; // No need to subtract 1 now

        if (DEBUG_CONFIG.logPhysicsStateChanges && DEBUG_CONFIG.logScrewDebug) {
          console.log(`Shape ${shape.id} active screws after collection started: ${activeCount} (screw ${screw.id} now isBeingCollected=${screw.isBeingCollected})`);
        }

        if (activeCount === 0) {
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`Shape ${shape.id} will start falling immediately - no more active screws`);
          }
        }
      }
    } else {
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`❌ Failed to start collection for screw ${screw.id}`);
      }
    }
  }

  private handleScrewDestroyed(screwId: string): void {
    this.physicsService.removeConstraintOnly(screwId);
  }

  private handleBoundsChanged(width: number): void {
    // State updated by event handler
    // Update transfer service state
    const transferState = this.transferService as unknown as { state: { virtualGameWidth: number } };
    transferState.state.virtualGameWidth = width;
  }

  private handleTransferStarted(screw: Screw, event: ScrewTransferStartedEvent): void {
    // Start the transfer animation
    screw.startTransfer(
      event.fromPosition,
      event.toPosition,
      event.fromHoleIndex,
      event.toContainerIndex,
      event.toHoleIndex
    );
  }

  private handleTransferCompleted(screw: Screw, event: ScrewTransferCompletedEvent): void {
    // Place screw in final container position
    if (event.toContainerIndex >= 0 && event.toHoleIndex >= 0) {
      const container = this.state.containers[event.toContainerIndex];
      if (container) {
        // Clear reservation
        if (container.reservedHoles[event.toHoleIndex] === screw.id) {
          container.reservedHoles[event.toHoleIndex] = null;
        }
        
        // Place screw
        container.holes[event.toHoleIndex] = screw.id;
        
        // Check if container is full
        const filledCount = container.holes.filter(h => h !== null).length;
        if (filledCount === container.maxHoles) {
          container.isFull = true;
          
          this.emit({
            type: 'container:filled',
            timestamp: Date.now(),
            source: 'ScrewManager',
            containerIndex: event.toContainerIndex,
            color: container.color,
            screws: container.holes.filter(id => id !== null) as string[]
          });
        }
        
        // Update container state
        this.emit({
          type: 'container:state:updated',
          timestamp: Date.now(),
          source: 'ScrewManager',
          containers: this.state.containers
        });
      }
    }
    
    // Mark screw as collected
    screw.collect();
    
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`Transfer completed for screw ${screw.id}`);
    }
  }

  // Utility methods
  private cleanupThrottlingStates(): void {
    this.collisionService.cleanupThrottlingStates();
  }

  private validateAndCleanupReservations(): void {
    // Clean up container reservations
    for (const container of this.state.containers) {
      for (let i = 0; i < container.reservedHoles.length; i++) {
        const reservedScrewId = container.reservedHoles[i];
        if (reservedScrewId) {
          const screw = this.state.screws.get(reservedScrewId);
          if (!screw || (!screw.isBeingCollected && !screw.isBeingTransferred && !screw.isShaking)) {
            if (DEBUG_CONFIG.logScrewDebug) {
              console.log(`🧹 Cleaning stale reservation for screw ${reservedScrewId} in container ${container.id} hole ${i}`);
            }
            container.reservedHoles[i] = null;
          }
        }
      }
    }
    
    // Clean up holding hole reservations
    for (const hole of this.state.holdingHoles) {
      if (hole.reservedBy) {
        const screw = this.state.screws.get(hole.reservedBy);
        if (!screw || (!screw.isBeingCollected && !screw.isBeingTransferred && !screw.isShaking)) {
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`🧹 Cleaning stale reservation for screw ${hole.reservedBy} in holding hole ${hole.id}`);
          }
          hole.reservedBy = undefined;
        }
      }
    }
  }

  protected onDestroy(): void {
    this.clearAllScrews();
    super.onDestroy();
  }
}