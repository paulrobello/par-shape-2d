/**
 * Core Game State Management
 * Handles only essential game state, scoring, and level management
 */

import { BaseSystem } from './BaseSystem';
import { GameState as IGameState, Level } from '@/types/game';
import { DEBUG_CONFIG, getTotalLayersForLevel } from '@/shared/utils/Constants';
import {
  ScrewCollectedEvent,
  BoundsChangedEvent,
  LayerClearedEvent,
  AllLayersClearedEvent,
  NextLevelRequestedEvent,
  LevelCompletedEvent,
  LayersUpdatedEvent,
  ShapeDestroyedEvent,
  GameStateRequestEvent,
  GameStateRestoreEvent
} from '../events/EventTypes';

export class GameStateCore extends BaseSystem {
  private state: IGameState;
  private level: Level;
  private hasUnsavedChanges = false;
  private isResetting = false;

  constructor() {
    super('GameStateCore');
    this.state = this.createInitialState();
    this.level = this.createInitialLevel();
  }

  protected async onInitialize(): Promise<void> {
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Game lifecycle events
    this.subscribe('screw:collected', this.handleScrewCollected.bind(this));
    this.subscribe('container:filled', this.handleContainerFilled.bind(this));
    this.subscribe('bounds:changed', this.handleBoundsChanged.bind(this));
    
    // Level management events
    this.subscribe('layer:cleared', this.handleLayerCleared.bind(this));
    this.subscribe('all:layers:cleared', this.handleAllLayersCleared.bind(this));
    this.subscribe('next:level:requested', this.handleNextLevelRequested.bind(this));
    this.subscribe('level:completed', this.handleLevelCompletedByProgress.bind(this));
    this.subscribe('layers:updated', this.handleLayersUpdated.bind(this));
    
    // Shape events
    this.subscribe('shape:destroyed', this.handleShapeDestroyed.bind(this));

    // Save/load coordination events
    this.subscribe('game:state:request', this.handleGameStateRequest.bind(this));
    this.subscribe('game:state:restore', this.handleGameStateRestore.bind(this));
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
          if (DEBUG_CONFIG.logSystemLifecycle) {
            console.log(`⚠️ Skipping screw collection for ${event.screw.id} during reset`);
          }
        }
        return;
      }
      
      // Don't award points immediately - points are now awarded when containers are removed
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`Screw ${event.screw.id} collected to ${event.destination}, but points will be awarded when container is removed`);
      }
      
      this.markUnsavedChanges();
    });
  }

  private handleContainerFilled(event: import('../events/EventTypes').ContainerFilledEvent): void {
    this.executeIfActive(() => {
      if (this.isResetting) {
        // Skip container filled handling during reset to prevent event loops
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`⚠️ Skipping container filled scoring during reset`);
        }
        return;
      }
      
      // Award points for each screw in the filled container (10 points per screw)
      const screwCount = event.screws.length;
      const pointsPerScrew = 10;
      const totalPoints = screwCount * pointsPerScrew;
      
      this.addScoreForContainerRemoval(totalPoints, screwCount);
      
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`Container filled and removed: awarded ${totalPoints} points for ${screwCount} screws`);
      }
      
      this.markUnsavedChanges();
    });
  }

  private handleBoundsChanged(event: BoundsChangedEvent): void {
    this.executeIfActive(() => {
      if (DEBUG_CONFIG.logBoundsOperations) {
        console.log(`GameStateCore: Bounds changed to ${event.width}x${event.height}`);
      }
      // Core state doesn't need to handle bounds directly
      // Container and HoldingHole managers handle their own positioning
    });
  }

  private handleLayerCleared(event: LayerClearedEvent): void {
    void event;
    this.executeIfActive(() => {
      // Level completion is now handled by ProgressTracker
      if (DEBUG_CONFIG.logLayerDebug) {
        if (DEBUG_CONFIG.logLayerOperations) {
          console.log('GameStateCore: Layer cleared event received');
        }
      }
    });
  }

  private handleAllLayersCleared(event: AllLayersClearedEvent): void {
    void event;
    this.executeIfActive(() => {
      if (DEBUG_CONFIG.logLayerDebug) {
        if (DEBUG_CONFIG.logLayerOperations) {
          console.log('GameStateCore: All layers cleared - completing level');
        }
      }
      // Mark level as complete and emit proper level:complete event
      // NOTE: Score is NOT added here to prevent duplication - ProgressTracker handles scoring
      this.state.levelComplete = true;
      
      // Emit level:complete with correct level and score data
      this.emit({
        type: 'level:complete',
        timestamp: Date.now(),
        level: this.state.currentLevel,
        score: this.state.levelScore
      });

      // Don't emit total:score:updated here since score wasn't changed
      // ProgressTracker's completion handler will update the total score
      
      this.markUnsavedChanges();
    });
  }

  private handleNextLevelRequested(event: NextLevelRequestedEvent): void {
    void event;
    this.executeIfActive(() => {
      if (DEBUG_CONFIG.logEventFlow) {
        console.log('GameStateCore: Next level requested - advancing to next level');
      }
      this.nextLevel();
    });
  }

  private handleLevelCompletedByProgress(event: LevelCompletedEvent): void {
    this.executeIfActive(() => {
      if (DEBUG_CONFIG.logProgressTracking) {
        console.log(`[GameStateCore] ProgressTracker reported level completion`);
        console.log(`[GameStateCore] Progress details: ${event.totalScrews} screws, ${event.finalProgress}% complete`);
      }
      
      // No auto-progression - GameManager now handles the 3-second delay and user confirmation
      // Just emit the level:complete event for GameManager to handle
      this.state.levelComplete = true;
      this.state.totalScore += this.state.levelScore;
      
      this.emit({
        type: 'level:complete',
        timestamp: Date.now(),
        level: this.state.currentLevel,
        score: this.state.levelScore
      });

      this.emit({
        type: 'total:score:updated',
        timestamp: Date.now(),
        totalScore: this.state.totalScore
      });
      
      this.markUnsavedChanges();
    });
  }

  private handleLayersUpdated(event: LayersUpdatedEvent): void {
    this.executeIfActive(() => {
      if (this.isResetting) {
        // Skip during reset
        return;
      }

      if (DEBUG_CONFIG.logScrewDebug) {
        if (DEBUG_CONFIG.logLayerOperations) {
          console.log(`GameStateCore: Layers updated - ${event.visibleLayers.length} visible layers`);
        }
      }
    });
  }

  private handleShapeDestroyed(event: ShapeDestroyedEvent): void {
    void event;
    this.executeIfActive(() => {
      // Increment shapes removed counter
      this.state.shapesRemovedThisLevel = (this.state.shapesRemovedThisLevel || 0) + 1;
      if (DEBUG_CONFIG.logShapeDestruction) {
        console.log(`Shape destroyed - shapes removed this level: ${this.state.shapesRemovedThisLevel}`);
      }
      
      this.markUnsavedChanges();
    });
  }

  private handleGameStateRequest(event: GameStateRequestEvent): void {
    this.executeIfActive(() => {
      if (event.callback) {
        event.callback(this.state, this.level);
      }
    });
  }

  private handleGameStateRestore(event: GameStateRestoreEvent): void {
    this.executeIfActive(() => {
      this.state = event.gameState || this.createInitialState();
      this.level = event.level || this.createInitialLevel();
      
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
      
      if (DEBUG_CONFIG.logScrewDebug) {
        if (DEBUG_CONFIG.logSystemLifecycle) {
          console.log('GameStateCore: State restored from save data');
        }
      }
    });
  }

  // Public API methods (called by other systems)
  public startGame(): void {
    this.executeIfActive(() => {
      this.state.gameStarted = true;
      this.state.gameOver = false;
      this.state.levelComplete = false;
      
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
      
      this.emit({
        type: 'level:started',
        timestamp: Date.now(),
        level: this.state.currentLevel
      });

      this.emit({
        type: 'level:score:updated',
        timestamp: Date.now(),
        levelScore: 0,
        level: this.state.currentLevel
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
      type: 'level:score:updated',
      timestamp: Date.now(),
      levelScore: this.state.levelScore,
      level: this.state.currentLevel
    });
  }

  private addScoreForContainerRemoval(points: number, screwCount: number): void {
    this.state.levelScore += points;
    
    this.emit({
      type: 'score:updated',
      timestamp: Date.now(),
      points,
      total: this.state.totalScore + this.state.levelScore,
      reason: 'container_removed'
    });

    this.emit({
      type: 'level:score:updated',
      timestamp: Date.now(),
      levelScore: this.state.levelScore,
      level: this.state.currentLevel
    });
    
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`Awarded ${points} points for container removal with ${screwCount} screws. New level score: ${this.state.levelScore}`);
    }
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

  public reset(): void {
    this.executeIfActive(() => {
      if (DEBUG_CONFIG.logSystemLifecycle) {
        console.log('🔄 GameStateCore: Starting reset operation');
      }
      this.isResetting = true;
      
      this.state = this.createInitialState();
      this.level = this.createInitialLevel();
      
      this.hasUnsavedChanges = false;
      this.emit({
        type: 'save:state:changed',
        timestamp: Date.now(),
        hasUnsavedChanges: false
      });
      
      this.isResetting = false;
      if (DEBUG_CONFIG.logSystemLifecycle) {
        console.log('✅ GameStateCore: Reset operation completed');
      }
    });
  }

  // Getter methods for other systems
  public getState(): IGameState {
    return { ...this.state };
  }

  public getLevel(): Level {
    return { ...this.level, layers: [...this.level.layers] };
  }

  public hasUnsavedData(): boolean {
    return this.hasUnsavedChanges;
  }

  public clearUnsavedChanges(): void {
    this.hasUnsavedChanges = false;
    this.emit({
      type: 'save:state:changed',
      timestamp: Date.now(),
      hasUnsavedChanges: false
    });
  }
}