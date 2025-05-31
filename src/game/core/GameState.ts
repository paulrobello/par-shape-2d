/**
 * Event-driven GameState implementation
 * Replaces the tightly-coupled GameState with an event-based system
 */

import { BaseSystem } from './BaseSystem';
import { GameState as IGameState, Level, Container, HoldingHole, ScrewColor, Screw as ScrewInterface, FullGameSave } from '@/types/game';
import { GAME_CONFIG, UI_CONSTANTS } from '@/game/utils/Constants';
import { getRandomScrewColors, getRandomColorsFromList } from '@/game/utils/Colors';
import {
  SaveRequestedEvent,
  RestoreRequestedEvent,
  ScrewCollectedEvent,
  BoundsChangedEvent,
  LayerClearedEvent,
  HoldingHoleFilledEvent,
  ScrewTransferCompletedEvent,
  LayerShapesReadyEvent
} from '../events/EventTypes';

export class GameState extends BaseSystem {
  private state: IGameState;
  private level: Level;
  private containers: Container[] = [];
  private holdingHoles: HoldingHole[] = [];
  private hasUnsavedChanges = false;
  private containersInitialized = false;

  constructor() {
    super('GameState');
    this.state = this.createInitialState();
    this.level = this.createInitialLevel();
  }

  protected async onInitialize(): Promise<void> {
    this.setupEventHandlers();
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
    
    // Container events
    this.subscribe('container:filled', this.handleContainerFilled.bind(this));
    this.subscribe('holding_hole:filled', this.handleHoldingHoleFilled.bind(this));
    
    // Transfer events
    this.subscribe('screw:transfer:completed', this.handleScrewTransferCompleted.bind(this));
    
    // Level management events - listen to level completion from other systems
    this.subscribe('layer:cleared', this.handleLayerCleared.bind(this));
    
    // Shape events
    this.subscribe('shape:destroyed', this.handleShapeDestroyed.bind(this));
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
      totalLayers: 10,
      layersGenerated: 0,
      layers: [],
    };
  }

  // Event Handlers
  private handleScrewCollected(event: ScrewCollectedEvent): void {
    this.executeIfActive(() => {
      const { screw, destination, points } = event;
      
      // ScrewManager has already placed the screw, we just need to handle scoring
      if (destination === 'container') {
        this.addScore(points);
        console.log(`Added ${points} points for screw ${screw.id} placed in container`);
      } else if (destination === 'holding_hole') {
        this.addScore(points);
        console.log(`Added ${points} points for screw ${screw.id} placed in holding hole`);
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
          screws: [] // TODO: Fix type conflict between Screw interface and entity
        });
        
        this.markContainerForRemoval(container.id);
      }
    }
  }

  private handleScrewToHoldingHole(screw: ScrewInterface, points: number): void {
    const hole = this.findAvailableHoldingHole();
    if (!hole) return;

    if (this.addScrewToHoldingHole(hole.id, screw)) {
      this.addScore(points);
      
      // Emit holding hole state update
      this.emit({
        type: 'holding_hole:state:updated',
        timestamp: Date.now(),
        holdingHoles: this.holdingHoles
      });
      
      this.emit({
        type: 'holding_hole:filled',
        timestamp: Date.now(),
        holeIndex: this.holdingHoles.indexOf(hole),
        screwId: screw.id
      });

      if (this.isHoldingAreaFull()) {
        this.emit({
          type: 'holding_holes:full',
          timestamp: Date.now(),
          countdown: 5000 // 5 second countdown
        });
      }
    }
  }

  private handleHoldingHoleFilled(event: HoldingHoleFilledEvent): void {
    this.executeIfActive(() => {
      console.log(`📥 GameState: RECEIVED holding_hole:filled event for hole ${event.holeIndex}, screwId: ${event.screwId || 'null'}`);
      const { holeIndex, screwId } = event;
      
      if (holeIndex >= 0 && holeIndex < this.holdingHoles.length) {
        const hole = this.holdingHoles[holeIndex];
        
        if (screwId === null) {
          // Screw was transferred out of hole (hole now empty)
          hole.screwId = null;
          console.log(`🕳️ Holding hole ${holeIndex} is now empty`);
        } else {
          // Screw was placed in hole
          hole.screwId = screwId;
          console.log(`✅ GameState: Placed screw ${screwId} in holding hole ${holeIndex}`);
          console.log(`🏠 GameState: Total screws in holding holes:`, this.holdingHoles.filter(h => h.screwId !== null).length);
          
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

  private handleScrewTransferCompleted(event: ScrewTransferCompletedEvent): void {
    this.executeIfActive(() => {
      const { screwId, toContainerIndex, toHoleIndex } = event;
      
      if (toContainerIndex >= 0 && toContainerIndex < this.containers.length) {
        const container = this.containers[toContainerIndex];
        
        if (toHoleIndex >= 0 && toHoleIndex < container.maxHoles) {
          // Place the screw ID in the container hole
          container.holes[toHoleIndex] = screwId;
          console.log(`Completed transfer of screw ${screwId} to container ${container.id} hole ${toHoleIndex}`);
          
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
      // Check if all layers are cleared
      if (this.level.layersGenerated >= this.level.totalLayers) {
        this.completeLevel();
      }
    });
  }

  private handleContainerFilled(event: import('../events/EventTypes').ContainerFilledEvent): void {
    this.executeIfActive(() => {
      const container = this.containers[event.containerIndex];
      if (container && container.isFull && !container.isMarkedForRemoval) {
        console.log(`Container ${container.id} filled - marking for removal`);
        this.markContainerForRemoval(container.id);
      }
    });
  }

  private handleLayerShapesReady(event: LayerShapesReadyEvent): void {
    this.executeIfActive(() => {
      const { screwColors } = event;

      // Initialize containers only once when the first layer has shapes ready
      if (!this.containersInitialized && this.state.gameStarted) {
        console.log(`GameState: Initializing containers with screw colors:`, screwColors);
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
        shapesRemoved: this.state.shapesRemovedThisLevel
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

  public completeLevel(): void {
    this.executeIfActive(() => {
      this.state.levelComplete = true;
      this.state.totalScore += this.state.levelScore;
      
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

  public nextLevel(): void {
    this.executeIfActive(() => {
      this.state.currentLevel++;
      this.state.levelScore = 0;
      this.state.levelComplete = false;
      this.state.shapesRemovedThisLevel = 0;
      
      this.level = {
        number: this.state.currentLevel,
        totalLayers: 10,
        layersGenerated: 0,
        layers: [],
      };
      
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

  // Container Management Methods
  private initializeContainers(activeScrewColors?: ScrewColor[], virtualGameWidth?: number, virtualGameHeight?: number): void {
    void virtualGameHeight; // Currently unused
    let colors: ScrewColor[];

    if (activeScrewColors && activeScrewColors.length >= GAME_CONFIG.containers.count) {
      colors = getRandomColorsFromList(activeScrewColors, GAME_CONFIG.containers.count);
    } else {
      colors = getRandomScrewColors(GAME_CONFIG.containers.count);
    }

    const currentWidth = virtualGameWidth || GAME_CONFIG.canvas.width;

    const containerWidth = UI_CONSTANTS.containers.width;
    const containerHeight = UI_CONSTANTS.containers.height;
    const spacing = UI_CONSTANTS.containers.spacing;
    const startY = UI_CONSTANTS.containers.startY;
    const totalContainersWidth = (GAME_CONFIG.containers.count * containerWidth) + ((GAME_CONFIG.containers.count - 1) * spacing);
    const startX = (currentWidth - totalContainersWidth) / 2;

    this.containers = colors.map((color, index) => ({
      id: `container-${index}`,
      color,
      position: {
        x: startX + (index * (containerWidth + spacing)) + (containerWidth / 2),
        y: startY + (containerHeight / 2)
      },
      holes: new Array(GAME_CONFIG.containers.maxHoles).fill(null),
      reservedHoles: new Array(GAME_CONFIG.containers.maxHoles).fill(null),
      maxHoles: GAME_CONFIG.containers.maxHoles,
      isFull: false,
    }));
    
    // Emit container state update
    this.emit({
      type: 'container:state:updated',
      timestamp: Date.now(),
      containers: this.containers
    });
  }

  private initializeHoldingHoles(virtualGameWidth?: number, virtualGameHeight?: number): void {
    const currentWidth = virtualGameWidth || GAME_CONFIG.canvas.width;
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

  public findAvailableHoldingHole(): HoldingHole | null {
    return this.holdingHoles.find(hole => hole.screwId === null) || null;
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

  private addScrewToHoldingHole(holeId: string, screw: ScrewInterface): boolean {
    const hole = this.holdingHoles.find(h => h.id === holeId);
    if (!hole || hole.screwId !== null) return false;

    hole.screwId = screw.id;
    return true;
  }

  private markContainerForRemoval(containerId: string): void {
    const container = this.containers.find(c => c.id === containerId);
    if (container && container.isFull && !container.isMarkedForRemoval) {
      container.isMarkedForRemoval = true;
      container.removalTimer = 750;
      
      // Start replacement process after delay
      setTimeout(() => {
        this.replaceContainer(this.containers.indexOf(container));
      }, 750);
    }
  }

  private replaceContainer(containerIndex: number): void {
    if (containerIndex < 0 || containerIndex >= this.containers.length) return;

    const oldContainer = this.containers[containerIndex];
    const existingColors = this.containers
      .filter((_, index) => index !== containerIndex)
      .map(c => c.color);

    // Note: We can't easily get screw colors from holding holes anymore since we only store IDs
    // ScrewManager will provide all active screw colors including those in holding holes
    const holdingHoleScrewColors: ScrewColor[] = [];

    // Request active screw colors from ScrewManager to prioritize those colors
    this.emit({
      type: 'screw_colors:requested',
      timestamp: Date.now(),
      containerIndex,
      existingColors,
      callback: (activeScrewColors: ScrewColor[]) => {
        // Combine active screw colors with holding hole screw colors
        const allAvailableScrewColors = [...activeScrewColors];
        for (const color of holdingHoleScrewColors) {
          if (!allAvailableScrewColors.includes(color)) {
            allAvailableScrewColors.push(color);
          }
        }
        console.log(`🎯 Container replacement: Active screws: [${activeScrewColors.join(', ')}], Holding holes: [${holdingHoleScrewColors.join(', ')}], Combined: [${allAvailableScrewColors.join(', ')}]`);
        this.finishContainerReplacement(containerIndex, oldContainer, existingColors, allAvailableScrewColors);
      }
    });
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
      console.log(`🎯 Container replacement: Using active screw color ${newColor} (${priorityColors.length} priority colors available from ${activeScrewColors.length} active colors)`);
    } else {
      // All active colors are already in use by other containers
      // Pick a random active color (even if already in use)
      newColor = activeScrewColors[Math.floor(Math.random() * activeScrewColors.length)];
      console.log(`🎯 Container replacement: All active colors in use, using duplicate active color ${newColor} (from ${activeScrewColors.length} active colors)`);
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
    };

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
    console.log(`🔍 GameState: Checking holding holes for screws matching new container color: ${newContainerColor}`);
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
      console.log(`🔄 GameState: No screws in holding holes to transfer to new ${newContainerColor} container`);
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
          console.log(`✨ GameState: INITIATING TRANSFERS for ${validTransfers.length} screws to ${newContainerColor} container!`);
        }
        validTransfers.forEach(transfer => {
          console.log(`🚀 GameState: Requesting transfer for screw ${transfer.screwId} from hole ${transfer.holeIndex} to ${newContainerColor} container`);
          this.requestScrewTransfer(transfer.screwId, transfer.holeIndex, targetContainer);
        });
        
        if (validTransfers.length > 0) {
          console.log(`🔄 GameState: Requested ${validTransfers.length} color-matched screw transfers to new ${newContainerColor} container`);
        } else {
          console.log(`🔄 GameState: No color-matched screws found in holding holes for new ${newContainerColor} container`);
        }
      }
    });

  }

  private requestScrewTransfer(screwId: string, holeIndex: number, targetContainer: Container): void {
    // Check if there's space in the container
    const emptyHoleIndex = this.getFirstEmptyHoleIndex(targetContainer);
    if (emptyHoleIndex === -1) {
      console.log(`Container ${targetContainer.id} is full, cannot transfer screw ${screwId}`);
      return;
    }

    // Calculate positions for animation
    const holdingHole = this.holdingHoles[holeIndex];
    const fromPosition = { ...holdingHole.position };
    
    // Calculate target container hole position
    const containerWidth = UI_CONSTANTS.containers.width;
    const containerHeight = UI_CONSTANTS.containers.height;
    const spacing = UI_CONSTANTS.containers.spacing;
    const startY = UI_CONSTANTS.containers.startY;
    const currentWidth = GAME_CONFIG.canvas.width;
    const totalWidth = (this.containers.length * containerWidth) + ((this.containers.length - 1) * spacing);
    const startX = (currentWidth - totalWidth) / 2;
    const containerIndex = this.containers.indexOf(targetContainer);
    const containerX = startX + (containerIndex * (containerWidth + spacing));
    const holeSpacing = containerWidth / 4;
    const holeX = containerX + holeSpacing + (emptyHoleIndex * holeSpacing);
    const holeY = startY + containerHeight / 2;
    const toPosition = { x: holeX, y: holeY };
    
    // Start the transfer animation (ScrewManager will validate color match)
    console.log(`🚀 GameState: EMITTING screw:transfer:started for screw ${screwId} from hole ${holeIndex} to container ${containerIndex} hole ${emptyHoleIndex}`);
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

    console.log(`Started transfer animation for screw ${screwId} from holding hole ${holeIndex} to container ${targetContainer.id} hole ${emptyHoleIndex}`);

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
    const currentWidth = virtualGameWidth || GAME_CONFIG.canvas.width;

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
        totalLayersForLevel: 10,
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

      if (this.containers.length === 0) {
        this.initializeContainers();
      }
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
    });
  }

  // Getter methods for other systems
  public getState(): IGameState {
    return { ...this.state };
  }

  public getLevel(): Level {
    return { ...this.level, layers: [...this.level.layers] };
  }

  public getContainers(): Container[] {
    return this.containers.map(container => ({
      ...container,
      holes: [...container.holes],
      reservedHoles: [...container.reservedHoles],
    }));
  }

  public getHoldingHoles(): HoldingHole[] {
    return this.holdingHoles.map(hole => ({ ...hole }));
  }

  public getActiveContainerColors(): ScrewColor[] {
    return this.containers.map(container => container.color);
  }
}