/**
 * Main GameState coordinator
 * Orchestrates between GameStateCore, ContainerManager, HoldingHoleManager, and SaveLoadManager
 */

import { BaseSystem } from './BaseSystem';
import { GameState as IGameState, Level, Container, HoldingHole, ScrewColor } from '@/types/game';
import { DEBUG_CONFIG } from '@/shared/utils/Constants';
import { GameStateCore } from './GameStateCore';
import { ContainerManager } from './managers/ContainerManager';
import { HoldingHoleManager } from './managers/HoldingHoleManager';
import { SaveLoadManager } from './managers/SaveLoadManager';
import {
  ScrewTransferStartedEvent,
  LayerShapesReadyEvent,
  ScrewTransferRequestEvent,
  ContainerStateRequestEvent,
  HoldingHoleStateRequestEvent
} from '../events/EventTypes';

export class GameState extends BaseSystem {
  // Note: Progress tracking is now handled by ProgressTracker.ts
  // GameState only manages container/holding hole state

  private gameStateCore: GameStateCore;
  private containerManager: ContainerManager;
  private holdingHoleManager: HoldingHoleManager;
  private saveLoadManager: SaveLoadManager;

  constructor() {
    super('GameState');
    
    // Initialize sub-managers
    this.gameStateCore = new GameStateCore();
    this.containerManager = new ContainerManager();
    this.holdingHoleManager = new HoldingHoleManager();
    this.saveLoadManager = new SaveLoadManager();
  }

  protected async onInitialize(): Promise<void> {
    // Initialize all sub-managers
    await this.gameStateCore.initialize();
    await this.containerManager.initialize();
    await this.holdingHoleManager.initialize();
    await this.saveLoadManager.initialize();
    
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Handle coordination between managers
    this.subscribe('layer:shapes:ready', this.handleLayerShapesReady.bind(this));
    this.subscribe('screw:transfer:request', this.handleScrewTransferRequest.bind(this));
    
    // Handle state requests from SaveLoadManager
    this.subscribe('container_state:request', this.handleContainerStateRequest.bind(this));
    this.subscribe('holding_hole_state:request', this.handleHoldingHoleStateRequest.bind(this));
    
    // Handle state restoration
    this.subscribe('container_state:restore', this.handleContainerStateRestore.bind(this));
    this.subscribe('holding_hole_state:restore', this.handleHoldingHoleStateRestore.bind(this));
  }

  private handleLayerShapesReady(event: LayerShapesReadyEvent): void {
    this.executeIfActive(() => {
      const { screwColors } = event;

      // Initialize containers with screw colors when first layer is ready
      this.containerManager.initializeContainers(screwColors);
      
      // Emit container colors updated event after initialization
      this.emit({
        type: 'container:colors:updated',
        timestamp: Date.now(),
        colors: this.containerManager.getContainers().map(c => c.color)
      });
      
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`GameState: Containers initialized with colors from layer shapes`);
      }
    });
  }

  private handleScrewTransferRequest(event: ScrewTransferRequestEvent): void {
    this.executeIfActive(() => {
      const { screwId, screwColor, fromHoleIndex } = event;
      
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`🎯 GameState: Received transfer request for screw ${screwId} (${screwColor}) from hole ${fromHoleIndex}`);
      }
      
      // Get current container state for debugging
      const allContainers = this.containerManager.getContainers();
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`🏭 GameState: Available containers:`, allContainers.map(c => ({
          id: c.id,
          color: c.color,
          isFull: c.isFull,
          holes: c.holes,
          reservedHoles: c.reservedHoles,
          availableHoles: c.holes.filter((h, i) => h === null && c.reservedHoles[i] === null).length
        })));
      }
      
      // Find an available container for this screw color
      const targetContainer = this.containerManager.findAvailableContainer(screwColor);
      
      if (targetContainer) {
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`✅ GameState: Found container ${targetContainer.id} for ${screwColor} screw ${screwId}, initiating transfer`);
        }
        
        this.requestScrewTransfer(screwId, fromHoleIndex, targetContainer);
      } else {
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`❌ GameState: No available container for ${screwColor} screw ${screwId}`);
          const matchingContainers = allContainers.filter(c => c.color === screwColor);
          console.log(`🔍 Matching color containers:`, matchingContainers.map(c => ({
            id: c.id,
            isFull: c.isFull,
            availableHoles: c.holes.filter((h, i) => h === null && c.reservedHoles[i] === null).length
          })));
        }
      }
    });
  }

  private handleContainerStateRequest(event: ContainerStateRequestEvent): void {
    this.executeIfActive(() => {
      if (event.callback) {
        const containers = this.containerManager.getContainers();
        event.callback(containers);
      }
    });
  }

  private handleHoldingHoleStateRequest(event: HoldingHoleStateRequestEvent): void {
    this.executeIfActive(() => {
      if (event.callback) {
        const holdingHoles = this.holdingHoleManager.getHoldingHoles();
        event.callback(holdingHoles);
      }
    });
  }

  private handleContainerStateRestore(): void {
    this.executeIfActive(() => {
      // The ContainerManager will handle its own restoration via events
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log('GameState: Container state restoration handled by ContainerManager');
      }
    });
  }

  private handleHoldingHoleStateRestore(): void {
    this.executeIfActive(() => {
      // The HoldingHoleManager will handle its own restoration via events
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log('GameState: Holding hole state restoration handled by HoldingHoleManager');
      }
    });
  }

  private requestScrewTransfer(screwId: string, holeIndex: number, targetContainer: Container): void {
    // This method coordinates the transfer between HoldingHoleManager and ContainerManager
    const holdingHoles = this.holdingHoleManager.getHoldingHoles();
    const containers = this.containerManager.getContainers();
    
    // Find container index
    const containerIndex = containers.findIndex(c => c.id === targetContainer.id);
    if (containerIndex === -1) {
      console.error(`Container ${targetContainer.id} not found`);
      this.emitTransferFailure(screwId, -1, -1, `Container ${targetContainer.id} not found`, holeIndex);
      return;
    }

    // Find first hole that is both empty AND not reserved
    const emptyHoleIndex = targetContainer.holes.findIndex((hole, idx) => 
      hole === null && targetContainer.reservedHoles[idx] === null
    );
    if (emptyHoleIndex === -1) {
      if (DEBUG_CONFIG.logScrewDebug) {
        console.error(`No available hole found in container ${targetContainer.id} - holes:`, targetContainer.holes, 'reserved:', targetContainer.reservedHoles);
      }
      this.emitTransferFailure(screwId, containerIndex, -1, `No available holes in container ${targetContainer.id}`, holeIndex);
      return;
    }

    // Validate holding hole still contains the screw
    if (holeIndex < 0 || holeIndex >= holdingHoles.length || holdingHoles[holeIndex].screwId !== screwId) {
      if (DEBUG_CONFIG.logScrewDebug) {
        console.error(`Holding hole ${holeIndex} no longer contains screw ${screwId}`);
      }
      this.emitTransferFailure(screwId, containerIndex, emptyHoleIndex, `Holding hole ${holeIndex} no longer contains screw`, holeIndex);
      return;
    }

    // Reserve the hole immediately to prevent conflicts
    targetContainer.reservedHoles[emptyHoleIndex] = screwId;
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`🔒 GameState: Reserved container ${containerIndex} hole ${emptyHoleIndex} for screw ${screwId}`);
    }

    // Calculate positions for animation
    const holdingHole = holdingHoles[holeIndex];
    const fromPosition = { ...holdingHole.position };
    
    // Calculate target position (simplified - ContainerManager has the full logic)
    const toPosition = { 
      x: targetContainer.position.x, 
      y: targetContainer.position.y 
    };
    
    // Start the transfer animation
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`🚀 GameState: Starting transfer of screw ${screwId} from hole ${holeIndex} to container ${containerIndex}, hole ${emptyHoleIndex}`);
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
    } as ScrewTransferStartedEvent);
  }

  private emitTransferFailure(screwId: string, containerIndex: number, holeIndex: number, reason: string, fromHoleIndex = -1): void {
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`❌ GameState: Emitting transfer failure for screw ${screwId}: ${reason}`);
    }
    
    this.emit({
      type: 'screw:transfer:failed',
      timestamp: Date.now(),
      screwId,
      fromHoleIndex,
      toContainerIndex: containerIndex,
      toHoleIndex: holeIndex,
      reason
    });
  }

  // Note: Progress tracking is handled by ProgressTracker.ts
  // Just try to transfer screws from holding holes periodically
  private tryTransferFromHoldingHoles(): void {
    this.holdingHoleManager.tryTransferFromHoldingHoles();
  }

  // Public API methods (called by other systems)
  public startGame(): void {
    this.executeIfActive(() => {
      this.gameStateCore.startGame();
      
      // Initialize holding holes at game start
      this.holdingHoleManager.initializeHoldingHoles();
      
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log('GameState: Game started, managers initialized');
      }
    });
  }

  public endGame(): void {
    this.executeIfActive(() => {
      this.gameStateCore.endGame();
    });
  }

  public nextLevel(): void {
    this.executeIfActive(() => {
      this.gameStateCore.nextLevel();
      
      // Reinitialize containers and holding holes for new level
      this.containerManager.initializeContainers();
      this.holdingHoleManager.initializeHoldingHoles();
    });
  }

  public reset(): void {
    this.executeIfActive(() => {
      console.log('🔄 GameState: Starting coordinated reset operation');
      
      this.gameStateCore.reset();
      this.containerManager.initializeContainers();
      this.holdingHoleManager.initializeHoldingHoles();
      this.saveLoadManager.clearSavedGame();
      
      console.log('✅ GameState: Coordinated reset operation completed');
    });
  }

  // Getter methods for other systems
  public getState(): IGameState {
    return this.gameStateCore.getState();
  }

  public getLevel(): Level {
    return this.gameStateCore.getLevel();
  }

  public getContainers(): Container[] {
    return this.containerManager.getContainers();
  }

  public getHoldingHoles(): HoldingHole[] {
    return this.holdingHoleManager.getHoldingHoles();
  }

  public findAvailableContainer(color: ScrewColor): Container | null {
    return this.containerManager.findAvailableContainer(color);
  }

  public hasGameInProgress(): boolean {
    return this.saveLoadManager.hasGameInProgress();
  }

  // Delegate update method to container manager for animations
  public update(deltaTime: number): void {
    void deltaTime; // GameState doesn't need frame timing
    this.executeIfActive(() => {
      // Update container animations
      this.containerManager.updateContainerAnimations();
    });
  }

  /**
   * Gets the count of available container holes by color.
   * Used for smart container replacement logic.
   */
  public getAvailableHolesByColor(): Map<string, number> {
    return this.containerManager.getAvailableHolesByColor();
  }

  protected onDestroy(): void {
    // Clean up sub-managers
    this.gameStateCore.destroy();
    this.containerManager.destroy();
    this.holdingHoleManager.destroy();
    this.saveLoadManager.destroy();
  }
}