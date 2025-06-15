/**
 * Save/Load management system
 * Handles game state persistence and restoration
 */

import { BaseSystem } from '../BaseSystem';
import { GameState as IGameState, Level, Container, HoldingHole, FullGameSave } from '@/types/game';
import { GAME_CONFIG, DEBUG_CONFIG, getTotalLayersForLevel } from '@/shared/utils/Constants';
import {
  SaveRequestedEvent,
  RestoreRequestedEvent
} from '../../events/EventTypes';

export class SaveLoadManager extends BaseSystem {
  private isSaving = false;

  constructor() {
    super('SaveLoadManager');
  }

  protected async onInitialize(): Promise<void> {
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Save/restore events
    this.subscribe('save:requested', this.handleSaveRequested.bind(this));
    this.subscribe('restore:requested', this.handleRestoreRequested.bind(this));
  }

  private handleSaveRequested(event: SaveRequestedEvent): void {
    void event;
    this.executeIfActive(() => {
      // Prevent concurrent save operations
      if (this.isSaving) {
        if (DEBUG_CONFIG.logScrewDebug) {
          console.warn('SaveLoadManager: Save already in progress, ignoring request');
        }
        return;
      }

      try {
        this.isSaving = true;
        // Request current state from other managers
        this.requestCurrentStateAndSave();
      } catch (error) {
        this.isSaving = false;
        this.emit({
          type: 'save:completed',
          timestamp: Date.now(),
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  }

  private handleRestoreRequested(event: RestoreRequestedEvent): void {
    void event;
    this.executeIfActive(() => {
      try {
        const success = this.loadState();
        
        this.emit({
          type: 'restore:completed',
          timestamp: Date.now(),
          success
        });

        if (success) {
          this.emit({
            type: 'save:state:changed',
            timestamp: Date.now(),
            hasUnsavedChanges: false
          });

          // Emit events to notify other systems of restored state
          this.emitRestoreEvents();
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

  private requestCurrentStateAndSave(): void {
    // Request state from GameState core
    this.emit({
      type: 'game:state:request',
      timestamp: Date.now(),
      callback: (gameState: IGameState, level: Level) => {
        // Request container state
        this.emit({
          type: 'container:state:request',
          timestamp: Date.now(),
          callback: (containers: Container[]) => {
            // Request holding hole state
            this.emit({
              type: 'holding:hole:state:request',
              timestamp: Date.now(),
              callback: (holdingHoles: HoldingHole[]) => {
                // Now save with all collected state
                this.saveCurrentState(gameState, level, containers, holdingHoles);
              }
            });
          }
        });
      }
    });
  }

  private saveCurrentState(gameState: IGameState, level: Level, containers: Container[], holdingHoles: HoldingHole[]): void {
    try {
      const saveData: FullGameSave = {
        gameState,
        level,
        containers,
        holdingHoles,
        layerManagerState: {
          layers: [],
          layerCounter: 0,
          depthCounter: 0,
          physicsGroupCounter: 0,
          colorCounter: 0,
          totalLayersForLevel: getTotalLayersForLevel(gameState.currentLevel),
          layersGeneratedThisLevel: 0,
        },
        screwManagerState: {
          animatingScrews: [],
        },
      };
      
      localStorage.setItem('par-shape-2d-save', JSON.stringify(saveData));
      
      // Save completed successfully
      this.emit({
        type: 'save:completed',
        timestamp: Date.now(),
        success: true
      });

      this.emit({
        type: 'save:state:changed',
        timestamp: Date.now(),
        hasUnsavedChanges: false
      });
      
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log('SaveLoadManager: Game state saved successfully');
      }
    } catch (error) {
      this.emit({
        type: 'save:completed',
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      this.isSaving = false;
    }
  }

  private loadState(): boolean {
    try {
      const savedData = localStorage.getItem('par-shape-2d-save');
      if (!savedData) return false;

      const data = JSON.parse(savedData);

      // Validate save data structure
      if (!this.validateSaveData(data)) {
        console.error('SaveLoadManager: Invalid save data structure');
        return false;
      }

      // Emit restore events for each manager
      this.emitGameStateRestore(data);
      this.emitContainerStateRestore(data);
      this.emitHoldingHoleStateRestore(data);

      if (DEBUG_CONFIG.logScrewDebug) {
        console.log('SaveLoadManager: Game state loaded and restored successfully');
      }

      return true;
    } catch (error) {
      console.error('SaveLoadManager: Failed to load game state:', error);
      return false;
    }
  }

  private validateSaveData(data: unknown): boolean {
    // Check for required properties
    if (!data || typeof data !== 'object') return false;
    
    const dataObj = data as Record<string, unknown>;
    
    // Support both old and new save formats
    const gameState = dataObj.gameState || dataObj.state;
    const level = dataObj.level;
    const containers = dataObj.containers;
    const holdingHoles = dataObj.holdingHoles;

    return !!(gameState && level && containers && holdingHoles);
  }

  private emitGameStateRestore(data: { gameState?: IGameState; state?: IGameState; level?: Level }): void {
    const gameState = data.gameState || data.state;
    const level = data.level;

    if (!gameState || !level) {
      console.error('SaveLoadManager: Cannot restore - missing gameState or level');
      return;
    }

    this.emit({
      type: 'game:state:restore',
      timestamp: Date.now(),
      gameState,
      level
    });
  }

  private emitContainerStateRestore(data: { containers?: Container[] }): void {
    let containers = data.containers || [];

    // Ensure all loaded containers have fade properties and reservedHoles
    containers = containers.map((container: Container) => {
      if (container.fadeOpacity === undefined) {
        container.fadeOpacity = 1.0;
        container.fadeStartTime = 0;
        container.fadeDuration = 1000;
        container.isFadingOut = false;
        container.isFadingIn = false;
      }
      
      // Ensure reservedHoles array exists and is properly sized
      if (!container.reservedHoles || !Array.isArray(container.reservedHoles)) {
        container.reservedHoles = new Array(container.maxHoles || GAME_CONFIG.containers.maxHoles).fill(null);
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`🔧 Added missing reservedHoles array to container ${container.id}`);
        }
      } else if (container.reservedHoles.length !== (container.maxHoles || GAME_CONFIG.containers.maxHoles)) {
        // Fix mismatched array size
        const targetSize = container.maxHoles || GAME_CONFIG.containers.maxHoles;
        container.reservedHoles = container.reservedHoles.slice(0, targetSize);
        while (container.reservedHoles.length < targetSize) {
          container.reservedHoles.push(null);
        }
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`🔧 Fixed reservedHoles array size for container ${container.id} to ${targetSize}`);
        }
      }

      return container;
    });

    this.emit({
      type: 'container:state:restore',
      timestamp: Date.now(),
      containers
    });
  }

  private emitHoldingHoleStateRestore(data: { holdingHoles?: HoldingHole[] }): void {
    const holdingHoles = data.holdingHoles || [];

    this.emit({
      type: 'holding:hole:state:restore',
      timestamp: Date.now(),
      holdingHoles
    });
  }

  private emitRestoreEvents(): void {
    // These will be handled by the individual managers after they restore their state
    this.emit({
      type: 'game:restored',
      timestamp: Date.now()
    });
  }

  public hasGameInProgress(): boolean {
    const savedData = localStorage.getItem('par-shape-2d-save');
    if (!savedData) return false;

    try {
      const data = JSON.parse(savedData);
      const state = data.gameState || data.state;
      return state && state.gameStarted && !state.gameOver && !state.levelComplete;
    } catch (error) {
      console.error('SaveLoadManager: Failed to check saved game:', error);
      return false;
    }
  }

  public clearSavedGame(): void {
    localStorage.removeItem('par-shape-2d-save');
    
    this.emit({
      type: 'save:state:changed',
      timestamp: Date.now(),
      hasUnsavedChanges: false
    });
    
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log('SaveLoadManager: Saved game cleared');
    }
  }

  public getSaveDataSize(): number {
    const savedData = localStorage.getItem('par-shape-2d-save');
    return savedData ? new Blob([savedData]).size : 0;
  }

  public exportSaveData(): string | null {
    const savedData = localStorage.getItem('par-shape-2d-save');
    return savedData;
  }

  public importSaveData(saveData: string): boolean {
    try {
      // Validate the imported data
      const data = JSON.parse(saveData);
      if (!this.validateSaveData(data)) {
        return false;
      }

      // Store the imported data
      localStorage.setItem('par-shape-2d-save', saveData);
      
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log('SaveLoadManager: Save data imported successfully');
      }
      
      return true;
    } catch (error) {
      console.error('SaveLoadManager: Failed to import save data:', error);
      return false;
    }
  }
}