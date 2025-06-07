/**
 * Event-driven GameState implementation
 * Replaces the tightly-coupled GameState with an event-based system
 */

import { BaseSystem } from './BaseSystem';
import { GameState as IGameState, Level, Container, HoldingHole, ScrewColor, Screw as ScrewInterface, FullGameSave } from '@/types/game';
import { GAME_CONFIG, UI_CONSTANTS, DEBUG_CONFIG, getTotalLayersForLevel } from '@/shared/utils/Constants';
import { 
  PrecomputedLevel, 
  ScrewProgressState
} from '../../types/precomputed';
import { ContainerStrategyManager } from '../utils/ContainerStrategyManager';
import { getRandomScrewColors, getRandomColorsFromList } from '@/game/utils/Colors';
import {
  SaveRequestedEvent,
  RestoreRequestedEvent,
  ScrewCollectedEvent,
  BoundsChangedEvent,
  LayerClearedEvent,
  HoldingHoleFilledEvent,
  ScrewTransferCompletedEvent,
  ScrewTransferFailedEvent,
  LayerShapesReadyEvent,
  NextLevelRequestedEvent,
  AllLayersClearedEvent,
  LayersUpdatedEvent,
  AllLayersScrewsReadyEvent,
  ScrewCountResponseEvent,
  ScrewsGeneratedEvent
} from '../events/EventTypes';

export class GameState extends BaseSystem {
  private state: IGameState;
  private level: Level;
  private containers: Container[] = [];
  private holdingHoles: HoldingHole[] = [];
  private hasUnsavedChanges = false;
  private containersInitialized = false;
  private virtualGameWidth = GAME_CONFIG.canvas.width;
  private virtualGameHeight = GAME_CONFIG.canvas.height;
  private isResetting = false;

  // New pre-computation and progress tracking
  private precomputedLevel: PrecomputedLevel | null = null;
  private screwProgress: ScrewProgressState = {
    removed: 0,
    total: 0,
    percentage: 0,
    balanceStatus: 'on_track'
  };
  
  // Container-based progress tracking (NEW)
  private containerProgress = {
    screwsInContainers: 0,  // Screws currently in containers (waiting to be filled)
    containersRemoved: 0,   // Full containers that have been removed
    totalScrewsToContainers: 0, // Total screws that need to go to containers for level completion
    totalScrewsCollected: 0, // Total screws collected from shapes (regardless of destination)
  };
  
  private isEmittingProgressUpdate = false;
  private containerStrategy: ContainerStrategyManager;

  constructor() {
    super('GameState');
    this.state = this.createInitialState();
    this.level = this.createInitialLevel();
    this.containerStrategy = new ContainerStrategyManager();
  }

  protected async onInitialize(): Promise<void> {
    this.setupEventHandlers();
    await this.containerStrategy.initialize();
    // Containers will be initialized when shapes are ready
    // Holding holes are initialized at game start
  }

  private setupEventHandlers(): void {
    // Game lifecycle events
    this.subscribe('screw:collected', this.handleScrewCollected.bind(this));
    this.subscribe('bounds:changed', this.handleBoundsChanged.bind(this));
    this.subscribe('save:requested', this.handleSaveRequested.bind(this));
    this.subscribe('restore:requested', this.handleRestoreRequested.bind(this));
    this.subscribe('layer:shapes:ready', this.handleLayerShapesReady.bind(this));
    this.subscribe('all_layers:screws:ready', this.handleAllLayersScrewsReady.bind(this));
    this.subscribe('screw_count:response', this.handleScrewCountResponse.bind(this));
    this.subscribe('screws:generated', this.handleScrewsGenerated.bind(this));
    
    // Container events
    this.subscribe('container:filled', this.handleContainerFilled.bind(this));
    this.subscribe('holding_hole:filled', this.handleHoldingHoleFilled.bind(this));
    
    // Transfer events
    this.subscribe('screw:transfer:completed', this.handleScrewTransferCompleted.bind(this));
    this.subscribe('screw:transfer:failed', this.handleScrewTransferFailed.bind(this));
    
    // Level management events - listen to level completion from other systems
    this.subscribe('layer:cleared', this.handleLayerCleared.bind(this));
    this.subscribe('all_layers:cleared', this.handleAllLayersCleared.bind(this));
    this.subscribe('next_level:requested', this.handleNextLevelRequested.bind(this));
    this.subscribe('layers:updated', this.handleLayersUpdated.bind(this));
    
    // Shape events
    this.subscribe('shape:destroyed', this.handleShapeDestroyed.bind(this));

    // Pre-computation events
    this.subscribe('level:precomputed', this.handleLevelPrecomputed.bind(this));
    this.subscribe('container:replacement:planned', this.handleContainerReplacementPlanned.bind(this));
  }

  private createInitialState(): IGameState {
    return {
      currentLevel: 1,
      levelScore: 0,
      totalScore: 0,
      gameStarted: false,
      gameOver: false,
      levelComplete: false,
      shapesRemovedThisLevel: 0,
    };
  }

  private createInitialLevel(): Level {
    return {
      number: 1,
      totalLayers: getTotalLayersForLevel(1),
      layersGenerated: 0,
      layers: [],
    };
  }

  // Event Handlers
  private handleScrewCollected(event: ScrewCollectedEvent): void {
    this.executeIfActive(() => {
      if (this.isResetting) {
        // Skip screw collection handling during reset to prevent event loops
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`⚠️ Skipping screw collection for ${event.screw.id} during reset`);
        }
        return;
      }
      
      const { screw, destination, points } = event;
      
      // Award points for screw removal (regardless of destination)
      this.addScore(points);
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`Added ${points} points for removing screw ${screw.id} from shape (destination: ${destination})`);
      }

      // Track total screws collected (regardless of destination)
      this.containerProgress.totalScrewsCollected++;

      // Update container-based progress if screw goes to container
      if (destination === 'container') {
        this.containerProgress.screwsInContainers++;
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`[CONTAINER_PROGRESS] Screw ${screw.id} added to container. Progress: ${this.containerProgress.totalScrewsCollected}/${this.containerProgress.totalScrewsToContainers} total collected, ${this.containerProgress.screwsInContainers} in containers, ${this.containerProgress.containersRemoved} containers removed`);
        }
      }

      // Update screw-based progress (legacy)
      this.screwProgress.removed++;
      this.updateScrewProgress();

      // Emit container progress update event
      this.emitContainerProgressUpdate();

      // Try to transfer screws from holding holes after each collection
      // This helps ensure screws don't get stuck in holding holes
      if (this.containerProgress.totalScrewsCollected > 0 && 
          this.containerProgress.totalScrewsCollected % 3 === 0) { // Check every 3 screws
        setTimeout(() => this.tryTransferFromHoldingHoles(), 50);
      }
      
      // Check for level completion after each screw collection
      // This ensures completion happens when all screws are collected, regardless of container state
      if (this.checkContainerBasedLevelCompletion()) {
        this.handleContainerBasedLevelComplete();
      }
      
      this.markUnsavedChanges();
    });
  }

  private handleScrewToContainer(screw: ScrewInterface, points: number): void {
    const container = this.findAvailableContainer(screw.color);
    if (!container) return;

    if (this.addScrewToContainer(container.id, screw)) {
      this.addScore(points);
      
      // Emit container state update
      this.emit({
        type: 'container:state:updated',
        timestamp: Date.now(),
        containers: this.containers
      });
      
      if (container.isFull) {
        this.emit({
          type: 'container:filled',
          timestamp: Date.now(),
          containerIndex: this.containers.indexOf(container),
          color: container.color,
          screws: container.holes.filter(id => id !== null) as string[]
        });
        
        this.markContainerForRemoval(container.id);
      }
    }
  }

  private handleHoldingHoleFilled(event: HoldingHoleFilledEvent): void {
    this.executeIfActive(() => {
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`📥 GameState: RECEIVED holding_hole:filled event for hole ${event.holeIndex}, screwId: ${event.screwId || 'null'}`);
      }
      const { holeIndex, screwId } = event;
      
      if (holeIndex >= 0 && holeIndex < this.holdingHoles.length) {
        const hole = this.holdingHoles[holeIndex];
        
        const wasFullBefore = this.isHoldingAreaFull();
        
        if (screwId === null) {
          // Screw was transferred out of hole (hole now empty)
          hole.screwId = null;
          hole.screwColor = undefined; // Clear the stored color
          console.log(`🕳️ Holding hole ${holeIndex} is now empty`);
          
          // If holes were full before but not anymore, cancel the timer
          if (wasFullBefore && !this.isHoldingAreaFull()) {
            console.log(`✅ Holding holes no longer full - cancelling game over timer`);
            this.emit({
              type: 'holding_holes:available',
              timestamp: Date.now()
            });
          }
        } else {
          // Screw was placed in hole
          hole.screwId = screwId;
          hole.screwColor = event.screwColor; // Store the screw color from the event
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`✅ GameState: Placed screw ${screwId} (color: ${event.screwColor}) in holding hole ${holeIndex}`);
          }
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`🏠 GameState: Total screws in holding holes:`, this.holdingHoles.filter(h => h.screwId !== null).length);
          }
          
          if (this.isHoldingAreaFull()) {
            this.emit({
              type: 'holding_holes:full',
              timestamp: Date.now(),
              countdown: 5000 // 5 second countdown
            });
          }
        }
        
        // Emit holding hole state update
        this.emit({
          type: 'holding_hole:state:updated',
          timestamp: Date.now(),
          holdingHoles: this.holdingHoles
        });
        
        this.markUnsavedChanges();
      }
    });
  }

  private handleScrewTransferFailed(event: ScrewTransferFailedEvent): void {
    this.executeIfActive(() => {
      const { screwId, toContainerIndex, toHoleIndex, fromHoleIndex, reason } = event;
      
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`❌ GameState: Transfer failed for screw ${screwId}: ${reason}`);
      }
      
      // Clear the reservation if it was made
      if (toContainerIndex >= 0 && toContainerIndex < this.containers.length) {
        const container = this.containers[toContainerIndex];
        if (toHoleIndex >= 0 && toHoleIndex < container.maxHoles) {
          if (container.reservedHoles[toHoleIndex] === screwId) {
            container.reservedHoles[toHoleIndex] = null;
            console.log(`🧹 Cleared reservation for container ${container.id} hole ${toHoleIndex}`);
          }
        }
      }
      
      // Restore the screw to the holding hole
      if (fromHoleIndex >= 0 && fromHoleIndex < this.holdingHoles.length) {
        this.holdingHoles[fromHoleIndex].screwId = screwId;
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`↩️ Restored screw ${screwId} to holding hole ${fromHoleIndex}`);
        }
        
        this.emit({
          type: 'holding_hole:state:updated',
          timestamp: Date.now(),
          holdingHoles: this.holdingHoles
        });
      }
    });
  }

  private handleScrewTransferCompleted(event: ScrewTransferCompletedEvent): void {
    this.executeIfActive(() => {
      const { screwId, toContainerIndex, toHoleIndex } = event;
      
      if (toContainerIndex >= 0 && toContainerIndex < this.containers.length) {
        const container = this.containers[toContainerIndex];
        
        if (toHoleIndex >= 0 && toHoleIndex < container.maxHoles) {
          // Clear the reservation and place the screw in the actual hole
          container.reservedHoles[toHoleIndex] = null;
          container.holes[toHoleIndex] = screwId;
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`Completed transfer of screw ${screwId} to container ${container.id} hole ${toHoleIndex}`);
          }
          
          // Check if container is now full
          if (container.holes.filter(h => h !== null).length === container.maxHoles) {
            container.isFull = true;
            this.markContainerForRemoval(container.id);
            
            this.emit({
              type: 'container:filled',
              timestamp: Date.now(),
              containerIndex: toContainerIndex,
              color: container.color,
              screws: container.holes.filter(id => id !== null) as string[]
            });
          }
          
          // Emit container state update
          this.emit({
            type: 'container:state:updated',
            timestamp: Date.now(),
            containers: this.containers
          });
          
          this.markUnsavedChanges();
        }
      }
    });
  }

  private handleBoundsChanged(event: BoundsChangedEvent): void {
    this.executeIfActive(() => {
      // Store the current virtual game dimensions for use in calculations
      this.virtualGameWidth = event.width;
      this.virtualGameHeight = event.height;
      console.log(`GameState: Updated virtual dimensions to ${event.width}x${event.height}`);
      this.recalculatePositions(event.width, event.height);
    });
  }

  private handleSaveRequested(_event: SaveRequestedEvent): void {
    void _event;
    this.executeIfActive(() => {
      try {
        // In event-driven system, we need to collect state from other systems
        // For now, save what we have and emit request for other systems to provide their state
        this.saveCurrentState();
        
        this.emit({
          type: 'save:completed',
          timestamp: Date.now(),
          success: true
        });

        this.hasUnsavedChanges = false;
        this.emit({
          type: 'save:state:changed',
          timestamp: Date.now(),
          hasUnsavedChanges: false
        });
      } catch (error) {
        this.emit({
          type: 'save:completed',
          timestamp: Date.now(),
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  }

  private handleRestoreRequested(_event: RestoreRequestedEvent): void {
    void _event;
    this.executeIfActive(() => {
      try {
        const success = this.loadState();
        
        this.emit({
          type: 'restore:completed',
          timestamp: Date.now(),
          success
        });

        if (success) {
          this.hasUnsavedChanges = false;
          this.emit({
            type: 'save:state:changed',
            timestamp: Date.now(),
            hasUnsavedChanges: false
          });

          // Emit events to notify other systems of restored state
          if (this.state.gameStarted) {
            this.emit({
              type: 'game:started',
              timestamp: Date.now()
            });
          }

          this.emit({
            type: 'level:started',
            timestamp: Date.now(),
              level: this.state.currentLevel
            });

          this.emit({
            type: 'container:colors:updated',
            timestamp: Date.now(),
            colors: this.containers.map(c => c.color)
          });
        }
      } catch (error) {
        this.emit({
          type: 'restore:completed',
          timestamp: Date.now(),
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  }

  private handleLayerCleared(_event: LayerClearedEvent): void {
    void _event;
    this.executeIfActive(() => {
      // Level completion is now handled by LayerManager emitting level:complete event
      // when all layers are actually cleared, so we don't need to check here
      if (DEBUG_CONFIG.logLayerDebug) {
        console.log('GameState: Layer cleared event received');
      }
    });
  }

  private handleAllLayersCleared(_event: AllLayersClearedEvent): void {
    void _event;
    this.executeIfActive(() => {
      if (DEBUG_CONFIG.logLayerDebug) {
        console.log('GameState: All layers cleared - completing level');
      }
      // Mark level as complete and emit proper level:complete event
      this.state.levelComplete = true;
      this.state.totalScore += this.state.levelScore;
      
      // Emit level:complete with correct level and score data
      this.emit({
        type: 'level:complete',
        timestamp: Date.now(),
        level: this.state.currentLevel,
        score: this.state.levelScore
      });

      this.emit({
        type: 'total_score:updated',
        timestamp: Date.now(),
        totalScore: this.state.totalScore
      });
      
      this.markUnsavedChanges();
    });
  }

  private handleNextLevelRequested(_event: NextLevelRequestedEvent): void {
    void _event;
    this.executeIfActive(() => {
      console.log('GameState: Next level requested - advancing to next level');
      this.nextLevel();
    });
  }

  private handleContainerFilled(event: import('../events/EventTypes').ContainerFilledEvent): void {
    this.executeIfActive(() => {
      const container = this.containers[event.containerIndex];
      if (container && container.isFull && !container.isMarkedForRemoval) {
        console.log(`Container ${container.id} filled - marking for removal`);
        
        // Track container removal for progress
        this.containerProgress.containersRemoved++;
        this.containerProgress.screwsInContainers -= 3; // Container had 3 screws
        
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`[CONTAINER_PROGRESS] Container ${container.id} removed. Progress: ${this.containerProgress.screwsInContainers}/${this.containerProgress.totalScrewsToContainers} screws in containers, ${this.containerProgress.containersRemoved} containers removed`);
        }
        
        // Emit container progress update
        this.emitContainerProgressUpdate();
        
        // Check for level completion after container removal
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`[CONTAINER_PROGRESS] Checking level completion after container filled: totalCollected=${this.containerProgress.totalScrewsCollected}, totalToContainers=${this.containerProgress.totalScrewsToContainers}`);
        }
        if (this.checkContainerBasedLevelCompletion()) {
          this.handleContainerBasedLevelComplete();
        }
        
        this.markContainerForRemoval(container.id);
      }
    });
  }

  private handleLayerShapesReady(event: LayerShapesReadyEvent): void {
    this.executeIfActive(() => {
      const { screwColors } = event;

      // Initialize containers only once when the first layer has shapes ready
      if (!this.containersInitialized && this.state.gameStarted) {
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`GameState: Initializing containers with screw colors:`, screwColors);
        }
        this.initializeContainers(screwColors);
        this.containersInitialized = true;

        // Emit container colors updated event
        this.emit({
          type: 'container:colors:updated',
          timestamp: Date.now(),
          colors: this.containers.map(c => c.color)
        });
      }
    });
  }

  private handleAllLayersScrewsReady(event: AllLayersScrewsReadyEvent): void {
    this.executeIfActive(() => {
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`GameState: All layers screws ready. Total layers: ${event.totalLayers}, Total shapes: ${event.totalShapes}`);
      }
      
      // Get total screw count from ScrewManager via event bus
      this.emit({
        type: 'screw_count:requested',
        timestamp: Date.now(),
        source: 'GameState'
      });
    });
  }

  private handleScrewCountResponse(event: ScrewCountResponseEvent): void {
    this.executeIfActive(() => {
      if (event.requestSource === 'GameState') {
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`GameState: Received screw count response: ${event.totalScrews} total screws`);
        }
        
        // Set the total screw count for the level
        this.setTotalScrewsForLevel(event.totalScrews);
      }
    });
  }

  private handleScrewsGenerated(event: ScrewsGeneratedEvent): void {
    this.executeIfActive(() => {
      // Update total screw count incrementally as screws are generated
      // This ensures we have the correct count regardless of timing
      this.containerProgress.totalScrewsToContainers = event.totalScrewsGenerated;
      
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`[SCREW_GENERATION] ${event.screwCount} screws generated for shape ${event.shapeId}. Total screws now: ${event.totalScrewsGenerated}`);
      }
      
      this.emitContainerProgressUpdate();
    });
  }

  private handleLayersUpdated(event: LayersUpdatedEvent): void {
    this.executeIfActive(() => {
      if (this.isResetting || !this.containersInitialized) {
        // Skip during reset or before initial container setup
        return;
      }

      // Get colors from all visible screws (visible layers + holding holes)
      const visibleScrewColors = this.getVisibleScrewColors(event.visibleLayers);
      
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`GameState: Layers updated, visible screw colors:`, visibleScrewColors);
      }

      // Update available colors for future container replacements
      // This ensures that when containers are replaced, they only use colors from visible screws
      this.updateAvailableScrewColors(visibleScrewColors);
    });
  }

  private handleShapeDestroyed(_event: import('../events/EventTypes').ShapeDestroyedEvent): void {
    void _event;
    this.executeIfActive(() => {
      // Increment shapes removed counter
      this.state.shapesRemovedThisLevel = (this.state.shapesRemovedThisLevel || 0) + 1;
      console.log(`Shape destroyed - shapes removed this level: ${this.state.shapesRemovedThisLevel}`);
      
      // Emit an update event for the progress
      this.emit({
        type: 'level:progress:updated',
        timestamp: Date.now(),
        screwsRemoved: this.screwProgress.removed,
        totalScrews: this.screwProgress.total,
        percentage: this.screwProgress.percentage,
        perfectBalanceStatus: this.screwProgress.balanceStatus
      });
      
      this.markUnsavedChanges();
    });
  }

  // Public API methods (called by other systems)
  public startGame(): void {
    this.executeIfActive(() => {
      this.state.gameStarted = true;
      this.state.gameOver = false;
      this.state.levelComplete = false;
      
      // Reset container initialization flag
      this.containersInitialized = false;
      
      // Only initialize holding holes at game start
      // Containers will be created after shapes/screws are ready
      this.initializeHoldingHoles();
      
      this.emit({
        type: 'game:started',
        timestamp: Date.now()
      });
      
      this.emit({
        type: 'level:started',
        timestamp: Date.now(),
        level: this.state.currentLevel
      });
      
      this.markUnsavedChanges();
    });
  }

  public endGame(): void {
    this.executeIfActive(() => {
      const finalScore = this.state.totalScore + this.state.levelScore;
      
      this.state.gameOver = true;
      this.state.gameStarted = false;
      
      this.emit({
        type: 'game:over',
        timestamp: Date.now(),
        reason: 'holding_holes_full',
        finalScore
      });
      
      this.markUnsavedChanges();
    });
  }


  public nextLevel(): void {
    this.executeIfActive(() => {
      this.state.currentLevel++;
      this.state.levelScore = 0;
      this.state.levelComplete = false;
      this.state.shapesRemovedThisLevel = 0;
      
      this.level = {
        number: this.state.currentLevel,
        totalLayers: getTotalLayersForLevel(this.state.currentLevel),
        layersGenerated: 0,
        layers: [],
      };
      
      // Initialize container progress for new level
      this.initializeContainerProgress();
      
      // Reinitialize containers and holding holes
      this.initializeContainers();
      this.initializeHoldingHoles();
      
      this.emit({
        type: 'level:started',
        timestamp: Date.now(),
        level: this.state.currentLevel
      });

      this.emit({
        type: 'level_score:updated',
        timestamp: Date.now(),
        levelScore: 0,
        level: this.state.currentLevel
      });

      this.emit({
        type: 'container:colors:updated',
        timestamp: Date.now(),
        colors: this.containers.map(c => c.color)
      });
      
      this.markUnsavedChanges();
    });
  }

  private addScore(points: number): void {
    this.state.levelScore += points;
    
    this.emit({
      type: 'score:updated',
      timestamp: Date.now(),
      points,
      total: this.state.totalScore + this.state.levelScore,
      reason: 'screw_collected'
    });

    this.emit({
      type: 'level_score:updated',
      timestamp: Date.now(),
      levelScore: this.state.levelScore,
      level: this.state.currentLevel
    });
  }

  private markUnsavedChanges(): void {
    if (!this.hasUnsavedChanges) {
      this.hasUnsavedChanges = true;
      this.emit({
        type: 'save:state:changed',
        timestamp: Date.now(),
        hasUnsavedChanges: true
      });
    }
  }

  // Helper methods for visible screw color tracking
  private getVisibleScrewColors(visibleLayers: import('../entities/Layer').Layer[]): ScrewColor[] {
    const colors = new Set<ScrewColor>();

    // Get colors from all screws on visible layers
    visibleLayers.forEach(layer => {
      layer.getAllShapes().forEach(shape => {
        shape.getAllScrews().forEach(screw => {
          if (!screw.isCollected) {
            colors.add(screw.color);
          }
        });
      });
    });

    // For holding holes, we'll store the screw colors when they're placed
    // This avoids the complexity of requesting colors from ScrewManager
    this.holdingHoles.forEach(hole => {
      if (hole.screwColor) {
        colors.add(hole.screwColor);
      }
    });

    return Array.from(colors);
  }

  private availableScrewColors: ScrewColor[] = [];

  private updateAvailableScrewColors(colors: ScrewColor[]): void {
    this.availableScrewColors = [...colors];
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`Updated available screw colors for container replacement:`, this.availableScrewColors);
    }
  }

  // Container Management Methods
  private initializeContainers(activeScrewColors?: ScrewColor[], virtualGameWidth?: number, virtualGameHeight?: number): void {
    void virtualGameHeight; // Currently unused
    let colors: ScrewColor[];

    if (activeScrewColors && activeScrewColors.length >= GAME_CONFIG.containers.count) {
      colors = getRandomColorsFromList(activeScrewColors, GAME_CONFIG.containers.count);
    } else {
      colors = getRandomScrewColors(GAME_CONFIG.containers.count);
    }

    const currentWidth = virtualGameWidth || this.virtualGameWidth;

    const containerWidth = UI_CONSTANTS.containers.width;
    const containerHeight = UI_CONSTANTS.containers.height;
    const spacing = UI_CONSTANTS.containers.spacing;
    const startY = UI_CONSTANTS.containers.startY;
    const totalContainersWidth = (GAME_CONFIG.containers.count * containerWidth) + ((GAME_CONFIG.containers.count - 1) * spacing);
    const startX = (currentWidth - totalContainersWidth) / 2;

    this.containers = colors.map((color, index) => {
      const containerLeftX = startX + (index * (containerWidth + spacing));
      const containerCenterX = containerLeftX + (containerWidth / 2);
      console.log(`🏭 Creating container ${index}: leftX=${containerLeftX}, centerX=${containerCenterX}, width=${containerWidth}`);
      return {
        id: `container-${index}`,
        color,
        position: {
          x: containerCenterX,
          y: startY + (containerHeight / 2)
        },
        holes: new Array(GAME_CONFIG.containers.maxHoles).fill(null),
        reservedHoles: new Array(GAME_CONFIG.containers.maxHoles).fill(null),
        maxHoles: GAME_CONFIG.containers.maxHoles,
        isFull: false,
        // Fade animation properties
        fadeOpacity: 1.0,
        fadeStartTime: 0,
        fadeDuration: 500, // 0.5 seconds
        isFadingOut: false,
        isFadingIn: false,
      };
    });
    
    // Emit container state update
    this.emit({
      type: 'container:state:updated',
      timestamp: Date.now(),
      containers: this.containers
    });
  }

  private initializeHoldingHoles(virtualGameWidth?: number, virtualGameHeight?: number): void {
    const currentWidth = virtualGameWidth || this.virtualGameWidth;
    void virtualGameHeight; // Unused parameter
    
    const holeRadius = UI_CONSTANTS.holdingHoles.radius;
    const spacing = UI_CONSTANTS.holdingHoles.spacing;
    const startY = UI_CONSTANTS.holdingHoles.startY;
    const holeCount = GAME_CONFIG.holdingHoles.count;
    
    const totalWidth = (holeCount * holeRadius * 2) + ((holeCount - 1) * spacing);
    const startX = (currentWidth - totalWidth) / 2;

    this.holdingHoles = Array.from({ length: holeCount }, (_, index) => ({
      id: `holding-${index}`,
      position: { 
        x: startX + (index * (holeRadius * 2 + spacing)) + holeRadius,
        y: startY 
      },
      screwId: null,
    }));
    
    // Emit holding hole state update
    this.emit({
      type: 'holding_hole:state:updated',
      timestamp: Date.now(),
      holdingHoles: this.holdingHoles
    });
  }

  public findAvailableContainer(color: ScrewColor): Container | null {
    return this.containers.find(container => {
      if (container.color !== color || container.isFull) return false;
      return this.getAvailableHoleCount(container.id) > 0;
    }) || null;
  }

  private addScrewToContainer(containerId: string, screw: ScrewInterface): boolean {
    const container = this.containers.find(c => c.id === containerId);
    if (!container || container.isFull) return false;

    const reservedIndex = container.reservedHoles.findIndex(id => id === screw.id);

    if (reservedIndex !== -1) {
      if (container.holes[reservedIndex] !== null) {
        console.error(`Reserved hole ${reservedIndex} is already occupied!`);
        return false;
      }
      container.holes[reservedIndex] = screw.id;
      container.reservedHoles[reservedIndex] = null;
    } else {
      const emptyHoleIndex = this.getFirstEmptyHoleIndex(container);
      if (emptyHoleIndex === -1) return false;
      container.holes[emptyHoleIndex] = screw.id;
    }

    container.isFull = container.holes.every(hole => hole !== null);
    return true;
  }

  private markContainerForRemoval(containerId: string): void {
    const container = this.containers.find(c => c.id === containerId);
    if (container && container.isFull && !container.isMarkedForRemoval) {
      container.isMarkedForRemoval = true;
      container.removalTimer = 500; // Changed to match fade duration
      
      // Start fade-out animation
      container.isFadingOut = true;
      container.fadeStartTime = Date.now();
      if (DEBUG_CONFIG.logLayerDebug) {
        console.log(`🎭 Starting fade-out animation for container ${container.id} (opacity: ${container.fadeOpacity})`);
      }
      
      // Check if replacement is needed before creating new container
      setTimeout(() => {
        this.checkAndReplaceContainer(this.containers.indexOf(container));
      }, 500); // 0.5 seconds for fade-out
    }
  }

  private checkAndReplaceContainer(containerIndex: number): void {
    if (containerIndex < 0 || containerIndex >= this.containers.length) return;

    // Calculate remaining screws to be collected (from shapes only - screws not yet clicked)
    const remainingScrews = this.containerProgress.totalScrewsToContainers - this.containerProgress.totalScrewsCollected;
    
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`[CONTAINER_REPLACEMENT] Container filled. Remaining screws on shapes: ${remainingScrews}`);
    }
    
    // If no more screws to collect, just remove container without replacement
    if (remainingScrews <= 0) {
      this.containers.splice(containerIndex, 1);
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`[CONTAINER_REPLACEMENT] No more screws left - removed container without replacement`);
      }
      
      // Emit container state update
      this.emit({
        type: 'container:state:updated',
        timestamp: Date.now(),
        containers: this.containers
      });
      return;
    }

    // Get screw colors for smart replacement - combine shapes and holding holes
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`[CONTAINER_REPLACEMENT] Requesting screw colors for smart replacement...`);
    }
    
    this.emit({
      type: 'screw_colors:requested',
      timestamp: Date.now(),
      containerIndex: -1, // Special flag for getting all remaining screws
      existingColors: [],
      callback: (shapeScrewColors: ScrewColor[]) => {
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`[CONTAINER_REPLACEMENT] ✅ Received screw colors callback with ${shapeScrewColors.length} colors`);
        }
        // Add holding hole colors to get complete picture
        const holdingHoleColors = this.getHoldingHoleColors();
        const allScrewColors = [...shapeScrewColors, ...holdingHoleColors];
        
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`[CONTAINER_REPLACEMENT] Container ${containerIndex} (${this.containers[containerIndex]?.color}) being removed`);
          console.log(`[CONTAINER_REPLACEMENT] Shape screws by color:`, this.countColorArray(shapeScrewColors));
          console.log(`[CONTAINER_REPLACEMENT] Holding hole screws by color:`, this.countColorArray(holdingHoleColors));
          console.log(`[CONTAINER_REPLACEMENT] Combined total: ${allScrewColors.length} screws`);
        }
        
        this.handleSmartContainerReplacement(containerIndex, allScrewColors, remainingScrews);
      }
    });
  }

  private handleSmartContainerReplacement(containerIndex: number, allScrewColors: ScrewColor[], totalRemainingScrews: number): void {
    void totalRemainingScrews; // Used for validation but not in current logic
    // Count all remaining screws by color (from shapes AND holding holes)
    const remainingScrewsByColor = new Map<ScrewColor, number>();
    
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`[SMART_REPLACEMENT] All screw colors (shapes + holding holes):`, allScrewColors);
      console.log(`[SMART_REPLACEMENT] Total screws: ${allScrewColors.length}`);
    }
    
    // Count all screws by color
    allScrewColors.forEach(color => {
      remainingScrewsByColor.set(color, (remainingScrewsByColor.get(color) || 0) + 1);
    });
    
    // Get available space in existing containers by color (excluding the one being removed)
    const availableSpaceByColor = this.getAvailableSpaceByColor(containerIndex);
    
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`[SMART_REPLACEMENT] Remaining screws by color:`, Array.from(remainingScrewsByColor.entries()));
      console.log(`[SMART_REPLACEMENT] Available space by color:`, Array.from(availableSpaceByColor.entries()));
      
      // Show detailed container info
      console.log(`[SMART_REPLACEMENT] Current containers (excluding ${containerIndex}):`);
      this.containers.forEach((container, index) => {
        if (index !== containerIndex) {
          const available = this.getAvailableHoleCount(container.id);
          const filled = container.holes.filter(h => h !== null).length;
          console.log(`  Container ${index}: ${container.color}, ${filled}/${container.maxHoles} filled, ${available} available`);
        }
      });
    }
    
    // Find colors that need additional container space
    const colorsNeedingSpace = new Map<ScrewColor, number>();
    
    remainingScrewsByColor.forEach((screwCount, color) => {
      const availableSpace = availableSpaceByColor.get(color) || 0;
      const additionalSpaceNeeded = screwCount - availableSpace;
      
      if (additionalSpaceNeeded > 0) {
        colorsNeedingSpace.set(color, additionalSpaceNeeded);
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`[SMART_REPLACEMENT] Color ${color}: ${screwCount} screws, ${availableSpace} available space, needs ${additionalSpaceNeeded} more holes`);
        }
      } else {
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`[SMART_REPLACEMENT] Color ${color}: ${screwCount} screws, ${availableSpace} available space, NO new container needed`);
        }
      }
    });
    
    // Create containers only for colors that actually need more space
    if (colorsNeedingSpace.size > 0) {
      // For now, create one container for the color with the highest need
      // TODO: Could be enhanced to create multiple containers if needed
      const [priorityColor, spaceNeeded] = Array.from(colorsNeedingSpace.entries())
        .sort(([,a], [,b]) => b - a)[0]; // Sort by space needed, take highest
        
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`[SMART_REPLACEMENT] Creating container for ${priorityColor} (needs ${spaceNeeded} holes)`);
      }
      
      this.replaceContainerWithOptimal(containerIndex, priorityColor, remainingScrewsByColor);
    } else {
      // No colors need additional space - just remove the container
      this.containers.splice(containerIndex, 1);
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`[SMART_REPLACEMENT] No colors need additional space - removed container without replacement`);
      }
      
      // Emit container state update
      this.emit({
        type: 'container:state:updated',
        timestamp: Date.now(),
        containers: this.containers
      });
    }
  }

  /**
   * Replace container with optimally-sized container
   */
  private replaceContainerWithOptimal(containerIndex: number, color: ScrewColor, remainingScrewsByColor: Map<ScrewColor, number>): void {
    if (containerIndex < 0 || containerIndex >= this.containers.length) return;

    const oldContainer = this.containers[containerIndex];
    const optimalContainer = this.createOptimalContainer(color, remainingScrewsByColor, containerIndex);
    
    // Replace the container
    this.containers[containerIndex] = optimalContainer;
    
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`[SMART_REPLACEMENT] Replaced container ${oldContainer.id} (${oldContainer.color}, ${oldContainer.maxHoles} holes) with ${optimalContainer.id} (${optimalContainer.color}, ${optimalContainer.maxHoles} holes)`);
    }
    
    // Emit replacement event
    this.emit({
      type: 'container:replaced',
      timestamp: Date.now(),
      containerIndex,
      oldColor: oldContainer.color,
      newColor: optimalContainer.color
    });
    
    // Emit container state update
    this.emit({
      type: 'container:state:updated',
      timestamp: Date.now(),
      containers: this.containers
    });
  }

  /**
   * Find container index by color (helper method)
   */
  private findContainerIndexByColor(color: ScrewColor): number {
    return this.containers.findIndex(container => container.color === color);
  }

  private replaceContainer(containerIndex: number): void {
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`[OLD_REPLACEMENT] ⚠️ Using OLD container replacement logic for container ${containerIndex}`);
    }
    
    if (containerIndex < 0 || containerIndex >= this.containers.length) return;

    const oldContainer = this.containers[containerIndex];
    const existingColors = this.containers
      .filter((_, index) => index !== containerIndex)
      .map(c => c.color);

    // Use the tracked available screw colors from visible layers and holding holes
    const availableColors: ScrewColor[] = this.availableScrewColors.length > 0 
      ? this.availableScrewColors 
      : ['red', 'green', 'blue', 'yellow', 'purple'] as ScrewColor[]; // Fallback to all colors if none tracked yet
    
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`🎯 Container replacement: Using available colors from visible screws: [${availableColors.join(', ')}]`);
      console.log(`🎯 Existing container colors: [${existingColors.join(', ')}]`);
    }

    this.finishContainerReplacement(containerIndex, oldContainer, existingColors, availableColors);
  }

  private finishContainerReplacement(containerIndex: number, oldContainer: Container, existingColors: ScrewColor[], activeScrewColors: ScrewColor[]): void {
    // Only use colors that exist in active screws (on shapes or in holding holes)
    if (activeScrewColors.length === 0) {
      console.error(`❌ Container replacement: No active screw colors available! Cannot create container.`);
      return;
    }
    
    // Prioritize active screw colors that aren't already in use by other containers
    const priorityColors = activeScrewColors.filter(color => !existingColors.includes(color));
    
    let newColor: ScrewColor;
    if (priorityColors.length > 0) {
      // Use an active screw color that's not already in use
      newColor = priorityColors[Math.floor(Math.random() * priorityColors.length)];
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`🎯 Container replacement: Using active screw color ${newColor} (${priorityColors.length} priority colors available from ${activeScrewColors.length} active colors)`);
      }
    } else {
      // All active colors are already in use by other containers
      // Pick a random active color (even if already in use)
      newColor = activeScrewColors[Math.floor(Math.random() * activeScrewColors.length)];
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`🎯 Container replacement: All active colors in use, using duplicate active color ${newColor} (from ${activeScrewColors.length} active colors)`);
      }
    }

    const oldColor = oldContainer.color;
    this.containers[containerIndex] = {
      id: `container-${Date.now()}`,
      color: newColor,
      position: oldContainer.position,
      holes: new Array(GAME_CONFIG.containers.maxHoles).fill(null),
      reservedHoles: new Array(GAME_CONFIG.containers.maxHoles).fill(null),
      maxHoles: GAME_CONFIG.containers.maxHoles,
      isFull: false,
      // Start with fade-in animation
      fadeOpacity: 0.0,
      fadeStartTime: Date.now(),
      fadeDuration: 500, // 0.5 seconds
      isFadingOut: false,
      isFadingIn: true,
    };
    
    if (DEBUG_CONFIG.logLayerDebug) {
      console.log(`🎭 Starting fade-in animation for new container ${this.containers[containerIndex].id}`);
    }

    this.emit({
      type: 'container:replaced',
      timestamp: Date.now(),
      containerIndex,
      oldColor,
      newColor: newColor
    });

    this.emit({
      type: 'container:colors:updated',
      timestamp: Date.now(),
      colors: this.containers.map(c => c.color)
    });

    // Emit container state update so GameManager and ScrewManager get the new container
    this.emit({
      type: 'container:state:updated',
      timestamp: Date.now(),
      containers: this.containers
    });

    // Give a small delay to ensure all systems have processed the container update
    setTimeout(() => {
      // Check if any screws in holding holes can now be moved to the new container
      this.checkAndTransferHoldingScrews(newColor);
    }, 50);

    this.markUnsavedChanges();
  }

  private getFirstEmptyHoleIndex(container: Container): number {
    for (let i = 0; i < container.maxHoles; i++) {
      if (!container.holes[i] && !container.reservedHoles[i]) {
        return i;
      }
    }
    return -1;
  }

  private getAvailableHoleCount(containerId: string): number {
    const container = this.containers.find(c => c.id === containerId);
    if (!container) return 0;

    let available = 0;
    for (let i = 0; i < container.maxHoles; i++) {
      if (!container.holes[i] && !container.reservedHoles[i]) {
        available++;
      }
    }
    return available;
  }

  private isHoldingAreaFull(): boolean {
    return this.holdingHoles.every(hole => hole.screwId !== null);
  }

  private checkAndTransferHoldingScrews(newContainerColor: ScrewColor): void {
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`🔍 GameState: Checking holding holes for screws matching new container color: ${newContainerColor}`);
    }
    console.log(`🔍 GameState: Current holding holes:`, this.holdingHoles.map(h => ({ 
      id: h.id, 
      screwId: h.screwId,
      hasScrewId: !!h.screwId 
    })));
    console.log(`🔍 GameState: Container count: ${this.containers.length}`);
    console.log(`🔍 GameState: Container colors:`, this.containers.map(c => c.color));
    
    // Find the container with the new color
    const targetContainer = this.containers.find(c => c.color === newContainerColor);
    if (!targetContainer) {
      console.error(`Container with color ${newContainerColor} not found`);
      return;
    }

    // Request screw color validation from ScrewManager before attempting transfers
    const holdingHoleScrewIds = this.holdingHoles
      .map((hole, index) => ({ screwId: hole.screwId, holeIndex: index }))
      .filter(item => item.screwId !== null) as { screwId: string; holeIndex: number }[];

    if (holdingHoleScrewIds.length === 0) {
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`🔄 GameState: No screws in holding holes to transfer to new ${newContainerColor} container`);
      }
      return;
    }

    // Emit event to request color-matched transfers
    this.emit({
      type: 'screw:transfer:color_check',
      timestamp: Date.now(),
      targetContainer,
      targetColor: newContainerColor,
      holdingHoleScrews: holdingHoleScrewIds,
      callback: (validTransfers: { screwId: string; holeIndex: number }[]) => {
        console.log(`🔄 GameState: Received callback with ${validTransfers.length} valid transfers`);
        if (validTransfers.length > 0) {
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`✨ GameState: INITIATING TRANSFERS for ${validTransfers.length} screws to ${newContainerColor} container!`);
          }
        }
        validTransfers.forEach(transfer => {
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`🚀 GameState: Requesting transfer for screw ${transfer.screwId} from hole ${transfer.holeIndex} to ${newContainerColor} container`);
          }
          this.requestScrewTransfer(transfer.screwId, transfer.holeIndex, targetContainer);
        });
        
        if (validTransfers.length > 0) {
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`🔄 GameState: Requested ${validTransfers.length} color-matched screw transfers to new ${newContainerColor} container`);
          }
        } else {
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`🔄 GameState: No color-matched screws found in holding holes for new ${newContainerColor} container`);
          }
        }
      }
    });
  }

  private requestScrewTransfer(screwId: string, holeIndex: number, targetContainer: Container): void {
    // Check if there's space in the container
    const emptyHoleIndex = this.getFirstEmptyHoleIndex(targetContainer);
    if (emptyHoleIndex === -1) {
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`Container ${targetContainer.id} is full, cannot transfer screw ${screwId}`);
      }
      return;
    }

    // Reserve the hole immediately to prevent race conditions
    targetContainer.reservedHoles[emptyHoleIndex] = screwId;
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`Reserved container ${targetContainer.id} hole ${emptyHoleIndex} for screw ${screwId}`);
    }

    // Calculate positions for animation
    const holdingHole = this.holdingHoles[holeIndex];
    const fromPosition = { ...holdingHole.position };
    
    // Calculate target container hole position using stored virtual game dimensions
    const containerWidth = UI_CONSTANTS.containers.width;
    const containerHeight = UI_CONSTANTS.containers.height;
    const spacing = UI_CONSTANTS.containers.spacing;
    const startY = UI_CONSTANTS.containers.startY;
    const totalWidth = (this.containers.length * containerWidth) + ((this.containers.length - 1) * spacing);
    const startX = (this.virtualGameWidth - totalWidth) / 2;
    console.log(`🎯 GameState: Using virtual width ${this.virtualGameWidth} for transfer calculation (containerWidth: ${containerWidth}, spacing: ${spacing}, totalWidth: ${totalWidth}, startX: ${startX})`);
    const containerIndex = this.containers.indexOf(targetContainer);
    // Calculate container position using the SAME logic as GameManager rendering
    // This ensures animation targets match exactly where containers are visually rendered
    const containerX = startX + (containerIndex * (containerWidth + spacing));
    console.log(`🎯 GameState: Calculated containerX=${containerX} for container ${containerIndex} (same as GameManager logic)`);
    // Calculate hole spacing based on container width and actual number of holes in this container
    const holeCount = targetContainer.maxHoles; // Use container's actual hole count
    const holeSpacing = containerWidth / (holeCount + 1); // +1 for proper spacing
    const holeX = containerX + holeSpacing + (emptyHoleIndex * holeSpacing);
    const holeY = startY + containerHeight / 2;
    const toPosition = { x: holeX, y: holeY };
    console.log(`🎯 Hole position calculation: containerX=${containerX}, holeSpacing=${holeSpacing}, emptyHoleIndex=${emptyHoleIndex}, final holeX=${holeX}, holeY=${holeY}`);
    
    // Start the transfer animation (ScrewManager will validate color match)
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`🚀 GameState: EMITTING screw:transfer:started for screw ${screwId} from hole ${holeIndex} to container ${containerIndex} hole ${emptyHoleIndex}`);
    }
    this.emit({
      type: 'screw:transfer:started',
      timestamp: Date.now(),
      screwId,
      fromHoleIndex: holeIndex,
      toContainerIndex: containerIndex,
      toHoleIndex: emptyHoleIndex,
      fromPosition,
      toPosition
    });

    // Clear the holding hole immediately (screw is now animating)
    holdingHole.screwId = null;

    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`Started transfer animation for screw ${screwId} from holding hole ${holeIndex} to container ${targetContainer.id} hole ${emptyHoleIndex}`);
    }

    // Emit holding hole filled event (with null to indicate it's now empty)
    this.emit({
      type: 'holding_hole:filled',
      timestamp: Date.now(),
      holeIndex,
      screwId: null
    });
  }

  private recalculatePositions(virtualGameWidth?: number, virtualGameHeight?: number): void {
    void virtualGameHeight; // Currently unused
    const currentWidth = virtualGameWidth || this.virtualGameWidth;

    // Recalculate container positions
    if (this.containers.length > 0) {
      const containerWidth = UI_CONSTANTS.containers.width;
      const containerHeight = UI_CONSTANTS.containers.height;
      const spacing = UI_CONSTANTS.containers.spacing;
      const startY = UI_CONSTANTS.containers.startY;
      const totalContainersWidth = (this.containers.length * containerWidth) + ((this.containers.length - 1) * spacing);
      const startX = (currentWidth - totalContainersWidth) / 2;

      this.containers.forEach((container, index) => {
        container.position.x = startX + (index * (containerWidth + spacing)) + (containerWidth / 2);
        container.position.y = startY + (containerHeight / 2);
      });
    }

    // Recalculate holding hole positions
    if (this.holdingHoles.length > 0) {
      const holeRadius = UI_CONSTANTS.holdingHoles.radius;
      const spacing = UI_CONSTANTS.holdingHoles.spacing;
      const startY = UI_CONSTANTS.holdingHoles.startY;
      
      const totalWidth = (this.holdingHoles.length * holeRadius * 2) + ((this.holdingHoles.length - 1) * spacing);
      const startX = (currentWidth - totalWidth) / 2;

      this.holdingHoles.forEach((hole, index) => {
        hole.position.x = startX + (index * (holeRadius * 2 + spacing)) + holeRadius;
        hole.position.y = startY;
      });
    }
    
    // Emit updated states
    this.emit({
      type: 'container:state:updated',
      timestamp: Date.now(),
      containers: this.containers
    });
    
    this.emit({
      type: 'holding_hole:state:updated',
      timestamp: Date.now(),
      holdingHoles: this.holdingHoles
    });
  }

  // Save/Load Methods
  private saveCurrentState(): void {
    const saveData: FullGameSave = {
      gameState: this.state,
      level: this.level,
      containers: this.containers,
      holdingHoles: this.holdingHoles,
      layerManagerState: {
        layers: [],
        layerCounter: 0,
        depthCounter: 0,
        physicsGroupCounter: 0,
        colorCounter: 0,
        totalLayersForLevel: getTotalLayersForLevel(1),
        layersGeneratedThisLevel: 0,
      },
      screwManagerState: {
        animatingScrews: [],
      },
    };
    localStorage.setItem('par-shape-2d-save', JSON.stringify(saveData));
  }

  private loadState(): boolean {
    try {
      const savedData = localStorage.getItem('par-shape-2d-save');
      if (!savedData) return false;

      const data = JSON.parse(savedData);

      if (data.gameState) {
        this.state = data.gameState || this.createInitialState();
        this.level = data.level || this.createInitialLevel();
        this.containers = data.containers || [];
        this.holdingHoles = data.holdingHoles || [];
      } else {
        // Old format compatibility
        this.state = data.state || this.createInitialState();
        this.level = data.level || this.createInitialLevel();
        this.containers = data.containers || [];
        this.holdingHoles = data.holdingHoles || [];
      }

      // Ensure all loaded containers have fade properties
      this.containers.forEach(container => {
        if (container.fadeOpacity === undefined) {
          container.fadeOpacity = 1.0;
          container.fadeStartTime = 0;
          container.fadeDuration = 500;
          container.isFadingOut = false;
          container.isFadingIn = false;
        }
      });

      if (this.containers.length === 0) {
        this.initializeContainers();
      }
      
      // Double-check that all containers have fade properties after initialization
      this.containers.forEach(container => {
        if (container.fadeOpacity === undefined) {
          container.fadeOpacity = 1.0;
          container.fadeStartTime = 0;
          container.fadeDuration = 500;
          container.isFadingOut = false;
          container.isFadingIn = false;
          if (DEBUG_CONFIG.logLayerDebug) {
            console.log(`🎭 Added missing fade properties to container ${container.id}`);
          }
        }
      });
      if (this.holdingHoles.length === 0) {
        this.initializeHoldingHoles();
      }

      this.recalculatePositions();
      return true;
    } catch (error) {
      console.error('Failed to load game state:', error);
      return false;
    }
  }

  public hasGameInProgress(): boolean {
    const savedData = localStorage.getItem('par-shape-2d-save');
    if (!savedData) return false;

    try {
      const data = JSON.parse(savedData);
      const state = data.gameState || data.state;
      return state && state.gameStarted && !state.gameOver && !state.levelComplete;
    } catch (error) {
      console.error('Failed to check saved game:', error);
      return false;
    }
  }

  public reset(): void {
    this.executeIfActive(() => {
      console.log('🔄 GameState: Starting reset operation');
      this.isResetting = true;
      
      // Reset screw progress to prevent stale data
      this.screwProgress = {
        removed: 0,
        total: 0,
        percentage: 0,
        balanceStatus: 'on_track'
      };
      this.precomputedLevel = null;
      
      this.state = this.createInitialState();
      this.level = this.createInitialLevel();
      this.initializeContainers();
      this.initializeHoldingHoles();
      localStorage.removeItem('par-shape-2d-save');
      
      this.hasUnsavedChanges = false;
      this.emit({
        type: 'save:state:changed',
        timestamp: Date.now(),
        hasUnsavedChanges: false
      });
      
      this.isResetting = false;
      console.log('✅ GameState: Reset operation completed');
    });
  }

  // Getter methods for other systems
  public getState(): IGameState {
    return { ...this.state };
  }

  public getLevel(): Level {
    return { ...this.level, layers: [...this.level.layers] };
  }

  // Override BaseSystem update method to handle container animations
  public update(deltaTime: number): void {
    void deltaTime; // GameState doesn't need frame timing
    this.executeIfActive(() => {
      // Update container fade animations
      this.updateContainerAnimations();
    });
  }

  private updateContainerAnimations(): void {
    const currentTime = Date.now();
    
    this.containers.forEach(container => {
      if (container.isFadingOut || container.isFadingIn) {
        const elapsed = currentTime - container.fadeStartTime;
        const progress = Math.min(elapsed / container.fadeDuration, 1);
        
        if (container.isFadingOut) {
          // Fade from 1 to 0
          container.fadeOpacity = 1 - progress;
          
          if (progress >= 1) {
            container.isFadingOut = false;
            container.fadeOpacity = 0;
            if (DEBUG_CONFIG.logLayerDebug) {
              console.log(`🎭 Fade-out completed for container ${container.id}`);
            }
          }
        } else if (container.isFadingIn) {
          // Fade from 0 to 1
          container.fadeOpacity = progress;
          
          // Debug logging for fade-in
          if (elapsed % 100 < 16) { // Log roughly every 100ms
            if (DEBUG_CONFIG.logLayerDebug) {
              console.log(`🎭 Fade-in progress for container ${container.id}: ${(progress * 100).toFixed(1)}% (opacity: ${container.fadeOpacity.toFixed(2)})`);
            }
          }
          
          if (progress >= 1) {
            container.isFadingIn = false;
            container.fadeOpacity = 1;
            console.log(`🎭 Fade-in completed for container ${container.id}`);
          }
        }
      }
    });
  }

  // New event handlers for pre-computation and perfect balance

  private handleLevelPrecomputed(event: import('../events/EventTypes').LevelPrecomputedEvent): void {
    this.executeIfActive(() => {
      this.precomputedLevel = event.levelData;
      
      // Initialize screw progress tracking
      this.screwProgress = {
        removed: 0,
        total: this.precomputedLevel.totalScrews,
        percentage: 0,
        balanceStatus: 'on_track'
      };

      // Set up container strategy
      this.containerStrategy.setPlan(this.precomputedLevel.containerReplacementPlan);
      this.containerStrategy.updateContainerState(this.containers, this.holdingHoles);

      console.log(`[GameState] Level pre-computed: ${this.precomputedLevel.totalScrews} total screws, ${this.precomputedLevel.layers.length} layers`);
    });
  }

  private handleContainerReplacementPlanned(event: import('../events/EventTypes').ContainerReplacementPlannedEvent): void {
    this.executeIfActive(() => {
      console.log(`[GameState] Executing container replacement at screw count ${event.atScrewCount} with colors:`, event.newColors);
      
      // Execute the container replacement strategy
      this.executeContainerReplacement({ newColors: event.newColors });
    });
  }

  /**
   * Update screw-based progress tracking
   */
  private updateScrewProgress(): void {
    if (!this.precomputedLevel || this.isResetting) {
      // Skip progress updates when no precomputed level exists or during reset
      return;
    }

    this.screwProgress.percentage = (this.screwProgress.removed / this.screwProgress.total) * 100;
    
    // Update container strategy with progress
    this.containerStrategy.onScrewCollected(this.screwProgress.removed);
    
    // Emit progress update event
    this.emit({
      type: 'screw:progress:updated',
      timestamp: Date.now(),
      removed: this.screwProgress.removed,
      total: this.screwProgress.total,
      percentage: this.screwProgress.percentage
    });

    // Update level progress event with new screw-based data
    this.emit({
      type: 'level:progress:updated',
      timestamp: Date.now(),
      screwsRemoved: this.screwProgress.removed,
      totalScrews: this.screwProgress.total,
      percentage: this.screwProgress.percentage,
      perfectBalanceStatus: this.screwProgress.balanceStatus
    });
  }

  /**
   * Execute container replacement based on strategy
   */
  private executeContainerReplacement(replacement: { newColors: string[] }): void {
    // Generate new containers with specified colors
    const newContainers = this.generateContainersWithColors(replacement.newColors);
    
    // Start fade-out for current containers
    this.containers.forEach(container => {
      const screwCount = container.holes.filter(hole => hole !== null).length;
      if (screwCount === 0) {
        // Start fade-out animation (already implemented)
        container.isMarkedForRemoval = true;
        container.isFadingOut = true;
        container.fadeStartTime = Date.now();
      }
    });

    // Schedule fade-in for new containers
    setTimeout(() => {
      // Replace empty containers with new ones
      this.containers = this.containers.filter(c => {
        const screwCount = c.holes.filter(hole => hole !== null).length;
        return screwCount > 0 || !c.isMarkedForRemoval;
      }).concat(newContainers);
      
      newContainers.forEach(container => {
        // Container fade-in animation is already implemented in generateContainersWithColors
        console.log(`New container added: ${container.color}`);
      });

      this.containerStrategy.updateContainerState(this.containers, this.holdingHoles);
      
      this.emit({
        type: 'container:replacement:executed',
        timestamp: Date.now(),
        containerId: 'multiple',
        newColors: replacement.newColors
      });

    }, 500); // Wait for fade-out to complete
  }

  /**
   * Generate containers with specific colors
   */
  private generateContainersWithColors(colors: string[]): Container[] {
    const containers: Container[] = [];
    
    colors.forEach((color, index) => {
      containers.push({
        id: `container_${Date.now()}_${index}`,
        color: color as ScrewColor,
        holes: [null, null, null], // 3 empty holes
        reservedHoles: [null, null, null],
        maxHoles: 3,
        isFull: false,
        position: { x: index * 100, y: 50 }, // Placeholder position
        isMarkedForRemoval: false,
        fadeOpacity: 0,
        fadeStartTime: 0,
        fadeDuration: 500,
        isFadingOut: false,
        isFadingIn: true
      });
    });

    return containers;
  }

  /**
   * Check if level is complete based on screws (not layers)
   */
  private checkScrewBasedLevelCompletion(): boolean {
    if (!this.precomputedLevel) return false;
    
    return this.screwProgress.removed >= this.screwProgress.total;
  }

  /**
   * Get screw progress state for external access
   */
  public getScrewProgress(): ScrewProgressState {
    return { ...this.screwProgress };
  }

  /**
   * Get pre-computed level data
   */
  public getPrecomputedLevel(): PrecomputedLevel | null {
    return this.precomputedLevel;
  }

  /**
   * Handle level completion based on screws (not layers)
   */
  private handleScrewBasedLevelComplete(): void {
    if (!this.precomputedLevel) return;

    // Check if perfect balance is achieved
    const perfectBalance = this.isPerfectBalanceAchieved();
    const finalStats = this.containerStrategy.generatePerfectBalanceStats();

    // Update state
    this.state.levelComplete = true;

    // Emit perfect balance achievement if applicable
    if (perfectBalance) {
      this.emit({
        type: 'perfect:balance:achieved',
        timestamp: Date.now(),
        finalStats
      });
    }

    // Emit level complete with enhanced data
    this.emit({
      type: 'level:complete',
      timestamp: Date.now(),
      level: this.state.currentLevel,
      score: this.state.levelScore
    });

    console.log(`[GameState] Level ${this.state.currentLevel} completed with screw-based system. Perfect balance: ${perfectBalance}`);
  }

  /**
   * Check if perfect balance is achieved
   */
  public isPerfectBalanceAchieved(): boolean {
    if (!this.precomputedLevel) return false;
    
    const stats = this.containerStrategy.generatePerfectBalanceStats();
    return stats.performance.finalBalanceAchieved;
  }

  // =============================================================================
  // CONTAINER-BASED PROGRESS TRACKING (NEW SYSTEM)
  // =============================================================================

  /**
   * Initialize container progress tracking for a new level
   */
  private initializeContainerProgress(): void {
    // Calculate total screws that need to be removed to containers
    // This will be updated when layers are ready and we know the total screw count
    this.containerProgress = {
      screwsInContainers: 0,
      containersRemoved: 0,
      totalScrewsToContainers: 0,
      totalScrewsCollected: 0
    };
    
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`[CONTAINER_PROGRESS] Initialized container progress tracking`);
    }
  }

  /**
   * Update the total screws count when layer data is available
   */
  public setTotalScrewsForLevel(totalScrews: number): void {
    this.containerProgress.totalScrewsToContainers = totalScrews;
    
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`[CONTAINER_PROGRESS] Set total screws for level: ${totalScrews}`);
    }
    
    this.emitContainerProgressUpdate();
  }

  /**
   * Emit container progress update event
   */
  private emitContainerProgressUpdate(): void {
    // Prevent event loops by guarding against duplicate emissions
    if (this.isEmittingProgressUpdate) {
      return;
    }

    this.isEmittingProgressUpdate = true;

    // Defer emission to next tick to break synchronous event chains
    setTimeout(() => {
      // Calculate progress based on screws actually in containers, not just collected from shapes
      const screwsInContainers = this.containers.reduce((total, container) => {
        return total + container.holes.filter(hole => hole !== null).length;
      }, 0);
      
      const percentage = this.containerProgress.totalScrewsToContainers > 0 
        ? screwsInContainers / this.containerProgress.totalScrewsToContainers * 100
        : 0;

      this.emit({
        type: 'container:progress:updated',
        timestamp: Date.now(),
        screwsInContainers: screwsInContainers,
        containersRemoved: this.containerProgress.containersRemoved,
        totalScrewsToContainers: this.containerProgress.totalScrewsToContainers,
        totalScrewsCollected: this.containerProgress.totalScrewsCollected,
        percentage
      });

      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`[CONTAINER_PROGRESS] Progress update: ${screwsInContainers}/${this.containerProgress.totalScrewsToContainers} screws in containers (${percentage.toFixed(1)}% complete)`);
        console.log(`[CONTAINER_PROGRESS] Note: ${this.containerProgress.totalScrewsCollected} screws collected from shapes, but progress based on container placement`);
      }

      this.isEmittingProgressUpdate = false;
    }, 0);
  }

  /**
   * Count remaining screws by color (in shapes and holding holes)
   * This is used for smart container replacement
   */
  private getRemainingScewsByColor(): Map<ScrewColor, number> {
    const screwCounts = new Map<ScrewColor, number>();
    
    // Count screws in holding holes
    this.holdingHoles.forEach(hole => {
      if (hole.screwId && hole.screwColor) {
        screwCounts.set(hole.screwColor, (screwCounts.get(hole.screwColor) || 0) + 1);
      }
    });
    
    // Request screw colors from visible layers (screws still on shapes)
    // This will be handled asynchronously via event system
    this.emit({
      type: 'screw_colors:requested', 
      timestamp: Date.now(),
      containerIndex: -1, // Special flag for "get all remaining screws"
      existingColors: [],
      callback: (activeScrewColors: ScrewColor[]) => {
        activeScrewColors.forEach(color => {
          screwCounts.set(color, (screwCounts.get(color) || 0) + 1);
        });
      }
    });
    
    return screwCounts;
  }

  /**
   * Get screw colors from holding holes
   */
  private getHoldingHoleColors(): ScrewColor[] {
    const colors: ScrewColor[] = [];
    
    this.holdingHoles.forEach(hole => {
      if (hole.screwColor) {
        colors.push(hole.screwColor);
      }
    });
    
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`[SCREW_COLORS] Holding hole colors:`, colors);
    }
    
    return colors;
  }

  /**
   * Helper to count colors in an array for debugging
   */
  private countColorArray(colors: ScrewColor[]): Record<string, number> {
    const counts: Record<string, number> = {};
    colors.forEach(color => {
      counts[color] = (counts[color] || 0) + 1;
    });
    return counts;
  }

  /**
   * Get available space in existing containers by color
   */
  private getAvailableSpaceByColor(excludeContainerIndex?: number): Map<ScrewColor, number> {
    const spaceByColor = new Map<ScrewColor, number>();
    
    this.containers.forEach((container, index) => {
      // Skip the container being removed
      if (excludeContainerIndex !== undefined && index === excludeContainerIndex) {
        return;
      }
      
      const availableSpace = this.getAvailableHoleCount(container.id);
      const currentSpace = spaceByColor.get(container.color) || 0;
      spaceByColor.set(container.color, currentSpace + availableSpace);
    });
    
    return spaceByColor;
  }

  /**
   * Create container with optimal hole count based on remaining screws
   * Only creates holes for screws that don't already have space in existing containers
   */
  private createOptimalContainer(color: ScrewColor, remainingScrews: Map<ScrewColor, number>, excludeContainerIndex?: number): Container {
    const totalScrewsOfThisColor = remainingScrews.get(color) || 0;
    
    // Calculate how much space already exists for this color (excluding container being removed)
    const existingSpace = this.getAvailableSpaceByColor(excludeContainerIndex).get(color) || 0;
    
    // Only create holes for screws that don't have existing space
    const additionalHolesNeeded = Math.max(0, totalScrewsOfThisColor - existingSpace);
    
    // Cap at 1-3 holes per container as specified
    const optimalHoles = Math.min(3, Math.max(1, additionalHolesNeeded));
    
    const container: Container = {
      id: `container_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      color,
      position: { x: 0, y: 0 }, // Will be set during rendering
      holes: Array(optimalHoles).fill(null),
      reservedHoles: Array(optimalHoles).fill(null),
      maxHoles: optimalHoles,
      isFull: false,
      fadeOpacity: 0,
      fadeStartTime: Date.now(),
      fadeDuration: 500,
      isFadingOut: false,
      isFadingIn: true
    };
    
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`[SMART_CONTAINER] Created container for ${color}:`);
      console.log(`  - Total screws of this color: ${totalScrewsOfThisColor}`);
      console.log(`  - Existing space for this color: ${existingSpace}`);
      console.log(`  - Additional holes needed: ${additionalHolesNeeded}`);
      console.log(`  - Container holes created: ${optimalHoles}`);
    }
    
    return container;
  }

  /**
   * Check if level is complete based on container progress
   * Level completes when ALL screws are in containers (no screws on shapes or in holding holes)
   */
  private checkContainerBasedLevelCompletion(): boolean {
    // Count screws currently in containers
    const screwsInContainers = this.containers.reduce((total, container) => {
      return total + container.holes.filter(hole => hole !== null).length;
    }, 0);
    
    // Count screws in holding holes
    const screwsInHoldingHoles = this.holdingHoles.filter(hole => hole.screwId !== null).length;
    
    // Level is complete ONLY when ALL screws are in containers (none in holding holes, none on shapes)
    const totalScrewsProcessed = screwsInContainers;
    const isComplete = totalScrewsProcessed === this.containerProgress.totalScrewsToContainers && screwsInHoldingHoles === 0;
    
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`[LEVEL_COMPLETION] Level completion check:`);
      console.log(`  - Total screws in level: ${this.containerProgress.totalScrewsToContainers}`);
      console.log(`  - Screws collected from shapes: ${this.containerProgress.totalScrewsCollected}`);
      console.log(`  - Screws in containers: ${screwsInContainers}`);
      console.log(`  - Screws in holding holes: ${screwsInHoldingHoles}`);
      console.log(`  - Level complete: ${isComplete ? 'YES - all screws in containers' : 'NO - screws still need processing'}`);
    }
    
    return isComplete;
  }

  /**
   * Try to automatically transfer screws from holding holes to available containers
   * This helps ensure all screws get properly processed for level completion
   */
  private tryTransferFromHoldingHoles(): void {
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`[AUTO_TRANSFER] Attempting to transfer screws from holding holes to containers`);
    }
    
    // Check each holding hole for screws that can be transferred
    this.holdingHoles.forEach((hole, holeIndex) => {
      if (!hole.screwId || !hole.screwColor) {
        return; // Skip empty holes
      }
      
      // Find a container that matches this screw's color and has space
      const targetContainer = this.containers.find(container => {
        return container.color === hole.screwColor && 
               !container.isFull && 
               this.getAvailableHoleCount(container.id) > 0;
      });
      
      if (targetContainer) {
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`[AUTO_TRANSFER] Found matching container for ${hole.screwColor} screw ${hole.screwId} in hole ${holeIndex}`);
        }
        
        // Request the transfer
        this.requestScrewTransfer(hole.screwId, holeIndex, targetContainer);
      } else {
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`[AUTO_TRANSFER] No available container found for ${hole.screwColor} screw ${hole.screwId}`);
        }
      }
    });
  }

  /**
   * Handle level completion based on container progress
   */
  private handleContainerBasedLevelComplete(): void {
    if (this.state.levelComplete) {
      return; // Already handled
    }

    // Try to transfer any remaining screws from holding holes first
    this.tryTransferFromHoldingHoles();
    
    // Re-check completion after attempted transfers
    setTimeout(() => {
      if (this.checkContainerBasedLevelCompletion()) {
        this.state.levelComplete = true;
        this.state.totalScore += this.state.levelScore;
        
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`[CONTAINER_PROGRESS] Level ${this.state.currentLevel} completed via container system!`);
        }
        
        // Emit level complete event
        this.emit({
          type: 'level:complete',
          timestamp: Date.now(),
          level: this.state.currentLevel,
          score: this.state.levelScore
        });

        this.emit({
          type: 'total_score:updated',
          timestamp: Date.now(),
          totalScore: this.state.totalScore
        });
        
        this.markUnsavedChanges();
      } else {
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`[CONTAINER_PROGRESS] Level completion check failed after auto-transfer attempt`);
        }
      }
    }, 100); // Small delay to allow transfers to complete
  }

  /**
   * Get container progress state for external access
   */
  public getContainerProgress() {
    return { ...this.containerProgress };
  }
}