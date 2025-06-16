/**
 * ScrewEventHandler - Routes events to appropriate screw services
 * Central hub for all screw-related event handling
 */

import { EventBus } from '@/game/events/EventBus';
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
  LayerIndicesUpdatedEvent,
  LayerClearedEvent,
  ScrewCountRequestedEvent,
  LevelStartedEvent,
  ContainerRemovedEvent,
} from '@/game/events/EventTypes';
import { DEBUG_CONFIG } from '@/shared/utils/Constants';
import { Screw } from '@/game/entities/Screw';
import { Shape } from '@/game/entities/Shape';
import { Container, HoldingHole, ScrewColor } from '@/types/game';
// Utility imports removed - functionality moved to simpler event handling

export interface IScrewEventHandler {
  setupEventHandlers(subscribe: (event: string, handler: (data: any) => void) => void): void; // eslint-disable-line @typescript-eslint/no-explicit-any
  handleShapeCreated(event: ShapeCreatedEvent): void;
  handleShapeDestroyed(event: ShapeDestroyedEvent): void;
  handleScrewClicked(event: ScrewClickedEvent): void;
  handlePhysicsBodyAdded(event: PhysicsBodyAddedEvent): void;
  handleContainerColorsUpdated(event: ContainerColorsUpdatedEvent): void;
  handleBoundsChanged(event: BoundsChangedEvent): void;
  handleSaveRequested(event: SaveRequestedEvent): void;
  handleRestoreRequested(event: RestoreRequestedEvent): void;
  handleContainerStateUpdated(event: import('@/game/events/EventTypes').ContainerStateUpdatedEvent): void;
  handleHoldingHoleStateUpdated(event: import('@/game/events/EventTypes').HoldingHoleStateUpdatedEvent): void;
  handleScrewTransferStarted(event: ScrewTransferStartedEvent): void;
  handleScrewTransferCompleted(event: ScrewTransferCompletedEvent): void;
  handleScrewColorsRequested(event: ScrewColorsRequestedEvent): void;
  handleScrewTransferColorCheck(event: ScrewTransferColorCheckEvent): void;
  handleLayersUpdated(event: LayersUpdatedEvent): void;
  handleLayerIndicesUpdated(event: LayerIndicesUpdatedEvent): void;
  handleLayerCleared(event: LayerClearedEvent): void;
  handleScrewCountRequested(event: ScrewCountRequestedEvent): void;
  handleRemainingScrewCountsRequested(event: import('@/game/events/EventTypes').RemainingScrewCountsRequestedEvent): void;
  handleLevelStarted(event: LevelStartedEvent): void;
  handleContainerRemoved(event: ContainerRemovedEvent): void;
}

interface EventHandlerState {
  screws: Map<string, Screw>;
  allShapes: Shape[];
  containers: Container[];
  holdingHoles: HoldingHole[];
  layerIndexLookup: Map<string, number>;
  visibleLayers: Set<string>;
  virtualGameWidth: number;
  virtualGameHeight: number;
  containerColors: ScrewColor[];
}

interface EventHandlerCallbacks {
  onShapeCreated?: (shape: Shape) => void;
  onScrewClicked?: (screw: Screw, forceRemoval: boolean) => void;
  onPhysicsBodyAdded?: (shape: Shape) => void;
  onScrewDestroyed?: (screwId: string) => void;
  onBoundsChanged?: (width: number, height: number) => void;
  onTransferStarted?: (screw: Screw, event: ScrewTransferStartedEvent) => void;
  onTransferCompleted?: (screw: Screw, event: ScrewTransferCompletedEvent) => void;
  onCheckTransfers?: () => void;
  onClearAll?: () => void;
  onUpdateRemovability?: () => void;
  onContainerRemoved?: (screwIds: string[]) => void;
}

export class ScrewEventHandler implements IScrewEventHandler {
  private state: EventHandlerState;
  private eventBus: EventBus;
  private source: string;
  private callbacks: EventHandlerCallbacks;

  constructor(
    state: EventHandlerState, 
    eventBus: EventBus, 
    source: string,
    callbacks: EventHandlerCallbacks
  ) {
    this.state = state;
    this.eventBus = eventBus;
    this.source = source;
    this.callbacks = callbacks;
  }

  /**
   * Setup all event subscriptions
   */
  public setupEventHandlers(subscribe: (event: string, handler: (data: any) => void) => void): void { // eslint-disable-line @typescript-eslint/no-explicit-any
    // Shape events
    subscribe('shape:created', this.handleShapeCreated.bind(this));
    subscribe('shape:destroyed', this.handleShapeDestroyed.bind(this));
    
    // Physics events
    subscribe('physics:body:added', this.handlePhysicsBodyAdded.bind(this));
    
    // Screw interaction events
    console.log(`🔧 ScrewEventHandler: Setting up screw:clicked subscription`);
    subscribe('screw:clicked', this.handleScrewClicked.bind(this));
    
    // Container events
    subscribe('container:colors:updated', this.handleContainerColorsUpdated.bind(this));
    subscribe('container:removed', this.handleContainerRemoved.bind(this));
    
    // Bounds change events
    subscribe('bounds:changed', this.handleBoundsChanged.bind(this));
    
    // Save/restore events
    subscribe('save:requested', () => this.handleSaveRequested());
    subscribe('restore:requested', () => this.handleRestoreRequested());
    
    // Container and holding hole state updates
    subscribe('container:state:updated', this.handleContainerStateUpdated.bind(this));
    subscribe('holding_hole:state:updated', this.handleHoldingHoleStateUpdated.bind(this));
    
    // Transfer animation events
    subscribe('screw:transfer:started', this.handleScrewTransferStarted.bind(this));
    subscribe('screw:transfer:completed', this.handleScrewTransferCompleted.bind(this));
    
    // Screw color requests
    subscribe('screw:colors:requested', this.handleScrewColorsRequested.bind(this));
    subscribe('screw:transfer:color_check', this.handleScrewTransferColorCheck.bind(this));
    
    // Layer visibility events
    subscribe('layers:updated', this.handleLayersUpdated.bind(this));
    subscribe('layer:indices:updated', this.handleLayerIndicesUpdated.bind(this));
    subscribe('layer:cleared', this.handleLayerCleared.bind(this));
    
    // Screw count requests
    subscribe('screw:count:requested', this.handleScrewCountRequested.bind(this));
    subscribe('remaining:screws:requested', this.handleRemainingScrewCountsRequested.bind(this));
    
    // Level lifecycle events
    subscribe('level:started', this.handleLevelStarted.bind(this));
  }

  public handleShapeCreated(event: ShapeCreatedEvent): void {
    if (event.source === this.source) return;

    this.state.allShapes.push(event.shape);
    
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`ScrewEventHandler: Shape created - ${event.shape.id}, now tracking ${this.state.allShapes.length} shapes`);
    }

    this.callbacks.onShapeCreated?.(event.shape);
  }

  public handlePhysicsBodyAdded(event: PhysicsBodyAddedEvent): void {
    // Debug logging to trace event filtering
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`🔍 ScrewEventHandler.handlePhysicsBodyAdded:`, {
        hasShape: !!event.shape,
        eventSource: event.source,
        thisSource: this.source,
        sourceNotEqual: event.source !== this.source,
        sourceNotStartsWith: !event.source?.startsWith(this.source + '-'),
        willProcess: !!(event.shape && event.source !== this.source && !event.source?.startsWith(this.source + '-')),
        shapeId: event.shape?.id,
        shapeScrewCount: event.shape?.screws?.length || 0
      });
    }

    // Ignore events from our own source to prevent loops
    if (event.shape && event.source !== this.source && !event.source?.startsWith(this.source + '-')) {
      const shape = event.shape;
      
      if (shape.screws && shape.screws.length > 0) {
        // Shape already has screws from saved state, don't generate new ones
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`⏭️ Shape ${shape.id} already has ${shape.screws.length} screws, skipping generation`);
        }
        return;
      }
      
      if (shape.isComposite && shape.body) {
        // For composite bodies, ensure position is synced before generating screws
        shape.updateFromBody();
        if (DEBUG_CONFIG.logPhysicsDebug) {
          console.log(`🔧 Composite body added - syncing position before screw generation`);
        }
      }
      
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`✅ Calling onPhysicsBodyAdded callback for shape ${shape.id}`);
      }
      
      this.callbacks.onPhysicsBodyAdded?.(shape);
    } else {
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`❌ Event filtered out - not calling onPhysicsBodyAdded callback`);
      }
    }
  }

  public handleShapeDestroyed(event: ShapeDestroyedEvent): void {
    const shapeIndex = this.state.allShapes.findIndex(s => s.id === event.shape.id);
    
    if (shapeIndex !== -1) {
      this.state.allShapes.splice(shapeIndex, 1);
    }

    // Remove all screws associated with this shape
    const screwsToRemove: string[] = [];
    
    for (const [screwId, screw] of this.state.screws) {
      if (screw.shapeId === event.shape.id) {
        screwsToRemove.push(screwId);
        if (DEBUG_CONFIG.logShapeDestruction && DEBUG_CONFIG.logScrewDebug) {
          console.log(`Marking screw ${screwId} for removal due to shape destruction`);
        }
      }
    }

    // Remove only screws that are still owned by this shape
    for (const screwId of screwsToRemove) {
      const screw = this.state.screws.get(screwId);
      
      if (screw && screw.canBeDeletedBy(event.shape.id)) {
        // Shape still owns this screw, safe to delete
        this.callbacks.onScrewDestroyed?.(screwId);
        this.state.screws.delete(screwId);
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`Removed screw ${screwId} from shape ${event.shape.id} (shape was owner)`);
        }
      } else if (screw) {
        // Screw is owned by someone else (container or holding hole), preserve it
        if (DEBUG_CONFIG.logScrewDebug) {
          const ownerInfo = screw.getOwnerInfo();
          console.log(`Preserving screw ${screwId} from shape ${event.shape.id} - owned by ${ownerInfo.ownerType} ${ownerInfo.owner}`);
        }
      }
    }

    if (screwsToRemove.length > 0 && DEBUG_CONFIG.logScrewDebug) {
      console.log(`Removed ${screwsToRemove.length} screws from destroyed shape ${event.shape.id}`);
    }
  }

  public handleBoundsChanged(event: BoundsChangedEvent): void {
    const { width, height } = event;
    this.state.virtualGameWidth = width;
    this.state.virtualGameHeight = height;
    
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`ScrewEventHandler: Bounds changed to ${width}x${height}`);
    }

    this.callbacks.onBoundsChanged?.(width, height);
  }

  public handleScrewClicked(event: ScrewClickedEvent): void {
    console.log(`🎯 ScrewEventHandler.handleScrewClicked received event for screw ${event.screw.id}`);

    const screw = this.state.screws.get(event.screw.id);
    console.log(`🔍 Looking for screw ${event.screw.id} in ScrewManager state. Found: ${!!screw}`);
    console.log(`🔍 Available screws in state:`, Array.from(this.state.screws.keys()));
    if (!screw) {
      console.warn(`❌ Screw ${event.screw.id} not found in ScrewManager state. Available screws:`, Array.from(this.state.screws.keys()));
      return;
    }

    // Validate screw state to prevent race conditions
    if (screw.isCollected || screw.isBeingCollected) {
      console.log(`⚠️ Ignoring click on screw ${screw.id} - already processed (collected: ${screw.isCollected}, beingCollected: ${screw.isBeingCollected})`);
      return;
    }

    console.log(`👆 Screw clicked: ${screw.id} (removable: ${screw.isRemovable}, collected: ${screw.isCollected}, beingCollected: ${screw.isBeingCollected})`);
    console.log(`🎯 Calling onScrewClicked callback...`);

    const forceRemoval = event.forceRemoval === true;
    this.callbacks.onScrewClicked?.(screw, forceRemoval);
    
    console.log(`✅ onScrewClicked callback completed for screw ${screw.id}`);
  }

  public handleContainerColorsUpdated(event: ContainerColorsUpdatedEvent): void {
    this.state.containerColors = event.colors;
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log('Container colors updated:', event.colors);
    }
  }

  public handleSaveRequested(): void {
    // Currently no state saving needed for screws
    if (DEBUG_CONFIG.logPhysicsDebug) {
      console.log('ScrewEventHandler: Save requested - no state to save');
    }
  }

  public handleRestoreRequested(): void {
    // Currently no state restoration needed for screws
    // Screws are recreated when shapes are restored
  }

  public handleContainerStateUpdated(event: import('@/game/events/EventTypes').ContainerStateUpdatedEvent): void {
    // Update local container state when container state changes
    this.state.containers = event.containers;
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`🏭 ScrewEventHandler: Container state updated - now have ${event.containers.length} containers`);
      console.log(`🏭 Container details:`, event.containers.map(c => ({ id: c.id, color: c.color, isFull: c.isFull })));
    }
    this.callbacks.onCheckTransfers?.();
  }

  public handleHoldingHoleStateUpdated(event: import('@/game/events/EventTypes').HoldingHoleStateUpdatedEvent): void {
    // Update local holding hole state when holding hole state changes
    this.state.holdingHoles = event.holdingHoles;
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`🕳️ ScrewEventHandler: Holding hole state updated - now have ${event.holdingHoles.length} holding holes`);
      console.log(`🕳️ Holding hole details:`, event.holdingHoles.map(h => ({ id: h.id, screwId: h.screwId, position: h.position })));
    }
  }

  public handleScrewTransferStarted(event: ScrewTransferStartedEvent): void {
    const screw = this.state.screws.get(event.screwId);
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`🚀 Transfer started for screw ${event.screwId}`);
    }
    
    if (screw) {
      this.callbacks.onTransferStarted?.(screw, event);
    }
  }

  public handleScrewTransferCompleted(event: ScrewTransferCompletedEvent): void {
    const screw = this.state.screws.get(event.screwId);
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`✅ Transfer completed for screw ${event.screwId}`);
    }
    
    if (screw) {
      this.callbacks.onTransferCompleted?.(screw, event);
    }
  }

  public handleScrewColorsRequested(event: ScrewColorsRequestedEvent): void {
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`🎨 Screw colors requested`);
    }

    const colorCounts = new Map<ScrewColor, number>();

    for (const screw of this.state.screws.values()) {
      const count = colorCounts.get(screw.color) || 0;
      colorCounts.set(screw.color, count + 1);
    }

    // Call the callback with the active screw colors
    if (event.callback) {
      const activeScrewColors = Array.from(colorCounts.keys());
      event.callback(activeScrewColors);
    }
  }

  public handleScrewTransferColorCheck(event: ScrewTransferColorCheckEvent): void {
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`🔄 Transfer color check requested for ${event.targetColor}`);
    }
    
    // Find valid transfers that match the target color
    const validTransfers: { screwId: string; holeIndex: number }[] = [];
    
    for (const transferInfo of event.holdingHoleScrews) {
      const screw = this.state.screws.get(transferInfo.screwId);
      if (screw && screw.color === event.targetColor) {
        validTransfers.push(transferInfo);
      }
    }
    
    // Call the callback with valid transfers
    if (event.callback) {
      event.callback(validTransfers);
    }
  }

  public handleLayersUpdated(event: LayersUpdatedEvent): void {
    // Update visible layers set
    this.state.visibleLayers.clear();
    event.visibleLayers.forEach(layer => {
      this.state.visibleLayers.add(layer.id);
    });
    
    if (DEBUG_CONFIG.logLayerDebug) {
      console.log(`ScrewEventHandler: Visible layers updated: ${Array.from(this.state.visibleLayers).join(', ')}`);
    }
    
    // DEBUG: Log detailed state for debugging
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`🔍 ScrewEventHandler: After updating visibleLayers:`, {
        visibleLayersSize: this.state.visibleLayers.size,
        visibleLayersArray: Array.from(this.state.visibleLayers),
        eventVisibleLayers: event.visibleLayers.map(l => l.id),
        stateReference: this.state.visibleLayers
      });
    }
    
    // Update screw removability based on new layer visibility
    this.callbacks.onUpdateRemovability?.();
  }

  public handleLayerIndicesUpdated(event: LayerIndicesUpdatedEvent): void {
    // Update the layer index lookup
    this.state.layerIndexLookup.clear();
    for (const layerInfo of event.layers) {
      this.state.layerIndexLookup.set(layerInfo.layerId, layerInfo.newIndex);
    }
    
    if (DEBUG_CONFIG.logLayerDebug) {
      console.log(`ScrewEventHandler: Layer indices updated:`, Array.from(this.state.layerIndexLookup.entries()));
    }
    
    // Update screw removability based on new layer ordering
    this.callbacks.onUpdateRemovability?.();
  }

  public handleLayerCleared(event: LayerClearedEvent): void {
    if (DEBUG_CONFIG.logLayerDebug) {
      console.log(`ScrewEventHandler: Layer ${event.layer.id} cleared - removing associated screws`);
    }
    
    // Find and remove all screws from shapes in the cleared layer
    const screwsToRemove: string[] = [];
    
    for (const shape of this.state.allShapes) {
      if (shape.layerId === event.layer.id) {
        for (const screw of shape.screws) {
          screwsToRemove.push(screw.id);
        }
      }
    }
    
    // Remove only screws that are still owned by shapes on this layer
    for (const screwId of screwsToRemove) {
      const screw = this.state.screws.get(screwId);
      
      // Find the shape that originally owned this screw to check if it can delete it
      const originalShape = this.state.allShapes.find(shape => 
        shape.layerId === event.layer.id && shape.screws.some(s => s.id === screwId)
      );
      
      if (screw && originalShape && screw.canBeDeletedBy(originalShape.id)) {
        // Shape still owns this screw, safe to delete
        this.callbacks.onScrewDestroyed?.(screwId);
        this.state.screws.delete(screwId);
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`Removed screw ${screwId} from layer ${event.layer.id} (shape was owner)`);
        }
      } else if (screw) {
        // Screw is owned by someone else (container or holding hole), preserve it
        if (DEBUG_CONFIG.logScrewDebug) {
          const ownerInfo = screw.getOwnerInfo();
          console.log(`Preserving screw ${screwId} from layer ${event.layer.id} - owned by ${ownerInfo.ownerType} ${ownerInfo.owner}`);
        }
      }
    }
    
    // Also remove shapes from the cleared layer
    this.state.allShapes = this.state.allShapes.filter(shape => shape.layerId !== event.layer.id);
  }

  public handleScrewCountRequested(event: ScrewCountRequestedEvent): void {
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`Screw count requested by ${event.source}`);
    }
    
    // Count total screws
    const totalScrews = this.state.screws.size;
    
    this.eventBus.emit({
      type: 'screw:count:response',
      timestamp: Date.now(),
      source: this.source,
      totalScrews,
      requestSource: event.source
    });
  }

  public handleRemainingScrewCountsRequested(event: import('@/game/events/EventTypes').RemainingScrewCountsRequestedEvent): void {
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log('🔧 Remaining screw counts requested - analyzing all screws...');
    }
    
    // Count screws by color that need container space (shapes + holding holes, excluding same-color containers)
    const screwsByColor = new Map<string, number>();
    
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
    
    // Count screws that need container space - ONLY screws currently on shapes
    // Screws in holding holes are counted separately below
    // Only count screws that are actually accessible to the player (in visible layers)
    let totalCountedScrews = 0;
    const screwDetailsByColor = new Map<string, Array<{id: string, isRemovable: boolean, ownerType: string, isCollected: boolean, isBeingCollected: boolean, isBeingTransferred: boolean}>>();
    
    for (const screw of this.state.screws.values()) {
      // Count ALL screws that are on shapes (not in containers or holding holes)
      // Containers should be sized for all screws that will eventually need collection,
      // not just currently removable ones (removability depends on layer blocking)
      if (!screw.isCollected && screw.ownerType === 'shape') {
        const count = screwsByColor.get(screw.color) || 0;
        screwsByColor.set(screw.color, count + 1);
        totalCountedScrews++;
        
        // Track details for debugging
        if (!screwDetailsByColor.has(screw.color)) {
          screwDetailsByColor.set(screw.color, []);
        }
        screwDetailsByColor.get(screw.color)!.push({
          id: screw.id,
          isRemovable: screw.isRemovable,
          ownerType: screw.ownerType,
          isCollected: screw.isCollected,
          isBeingCollected: screw.isBeingCollected,
          isBeingTransferred: screw.isBeingTransferred
        });
      }
    }
    
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`📊 Screw analysis details:`, {
        totalCountedScrews,
        screwDetailsByColor: Object.fromEntries(screwDetailsByColor)
      });
      
      // Additional debug: analyze what's being excluded
      const allScrews = Array.from(this.state.screws.values());
      const excludedScrews = allScrews.filter(s => s.isCollected || s.ownerType !== 'shape');
      console.log(`🚫 Excluded screws (${excludedScrews.length} total):`, {
        collected: excludedScrews.filter(s => s.isCollected).length,
        notOnShapes: excludedScrews.filter(s => !s.isCollected && s.ownerType !== 'shape').length,
        excludedDetails: excludedScrews.reduce((acc, s) => {
          acc[s.color] = (acc[s.color] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      });
    }
    
    // Count screws in holding holes - these need container space eventually
    // But exclude ones already in same-color containers
    for (const hole of this.state.holdingHoles) {
      if (hole.screwId) {
        const screw = this.state.screws.get(hole.screwId);
        if (screw) {
          const sameColorContainerScrews = screwsInContainersByColor.get(screw.color) || new Set();
          // Only count if not already in a same-color container
          if (!sameColorContainerScrews.has(hole.screwId)) {
            const count = screwsByColor.get(screw.color) || 0;
            screwsByColor.set(screw.color, count + 1);
          }
        }
      }
    }

    if (DEBUG_CONFIG.logScrewDebug) {
      // Additional debugging to track screw distribution
      const totalScrews = this.state.screws.size;
      const collectedScrews = Array.from(this.state.screws.values()).filter(s => s.isCollected).length;
      const beingCollectedScrews = Array.from(this.state.screws.values()).filter(s => s.isBeingCollected).length;
      const screwsOnShapes = Array.from(this.state.screws.values()).filter(s => !s.isCollected && s.ownerType === 'shape').length;
      const screwsNotOnShapes = Array.from(this.state.screws.values()).filter(s => !s.isCollected && !s.isBeingCollected && s.ownerType !== 'shape').length;
      
      const totalInContainers = Array.from(screwsInContainersByColor.values()).reduce((sum, set) => sum + set.size, 0);
      console.log('🔧 Remaining screw count analysis:');
      console.log('  - Total screws:', totalScrews);
      console.log('  - Collected screws:', collectedScrews);
      console.log('  - Being collected screws:', beingCollectedScrews);
      console.log('  - Screws on shapes needing container space (counted):', screwsOnShapes);
      console.log('  - Screws not on shapes (in containers/holes, excluded):', screwsNotOnShapes);
      console.log('  - Screws already in containers by color:', Array.from(screwsInContainersByColor.entries()).map(([color, set]) => `${color}: ${set.size}`));
      console.log('  - Total screws in containers:', totalInContainers);
      console.log('  - Screws needing container space by color:', Array.from(screwsByColor.entries()));
    }

    // Use the callback
    if (event.callback) {
      event.callback(screwsByColor);
    }
  }

  public handleLevelStarted(event: LevelStartedEvent): void {
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`ScrewEventHandler: Level ${event.level} started - clearing all screws`);
    }
    
    // Clear all screws for the new level
    this.callbacks.onClearAll?.();
    
    // Clear the layer index lookup to ensure fresh state
    this.state.layerIndexLookup.clear();
    
    // Clear visible layers
    this.state.visibleLayers.clear();
  }

  public handleContainerRemoved(event: ContainerRemovedEvent): void {
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`ScrewEventHandler: Container removed with ${event.screwIds.length} screws:`, event.screwIds);
    }
    
    // Notify ScrewManager to mark these screws as truly collected
    this.callbacks.onContainerRemoved?.(event.screwIds);
  }
}