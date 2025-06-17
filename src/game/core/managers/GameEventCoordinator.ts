/**
 * GameEventCoordinator - Manages event subscription setup and routing events to appropriate managers
 */

import { IGameEventCoordinator, ManagerContext } from './GameManagerTypes';
import { DEBUG_CONFIG } from '@/shared/utils/Constants';
import { eventBus } from '@/game/events/EventBus';

// Import event types
import {
  GameStartedEvent,
  GameOverEvent,
  LevelTransitionCompletedEvent,
  LevelWinConditionMetEvent,
  NextLevelRequestedEvent,
  DebugModeToggledEvent,
  DebugInfoRequestedEvent,
  LevelScoreUpdatedEvent,
  TotalScoreUpdatedEvent,
  LevelStartedEvent,
  HoldingHoleFilledEvent,
  ContainerFilledEvent,
  CollisionDetectedEvent,
  ContainerReplacedEvent,
  ProgressUpdatedEvent
} from '../../events/EventTypes';

export class GameEventCoordinator implements IGameEventCoordinator {
  private managers: ManagerContext | null = null;
  private eventSubscriptions: Map<string, string> = new Map(); // Map event type to subscription ID
  private systemCoordinator: import('../SystemCoordinator').SystemCoordinator | null = null;

  constructor() {
    // Don't extend BaseSystem to avoid initialization issues
  }

  setManagers(managers: ManagerContext): void {
    this.managers = managers;
  }

  setSystemCoordinator(coordinator: import('../SystemCoordinator').SystemCoordinator): void {
    this.systemCoordinator = coordinator;
  }

  setupEventHandlers(): void {
    if (!this.managers) {
      console.error('GameEventCoordinator: Managers not set before setting up event handlers');
      return;
    }

    // Game state events
    this.subscribe('game:started', this.handleGameStarted.bind(this));
    this.subscribe('game:over', this.handleGameOver.bind(this));
    this.subscribe('level:transition:completed', this.handleLevelTransitionCompleted.bind(this));
    this.subscribe('level:win:condition:met', this.handleLevelWinConditionMet.bind(this));
    this.subscribe('next:level:requested', this.handleNextLevelRequested.bind(this));
    
    // Debug events
    this.subscribe('debug:mode:toggled', this.handleDebugModeToggled.bind(this));
    this.subscribe('debug:info:requested', this.handleDebugInfoRequested.bind(this));
    
    // Rendering data events (to keep rendering data in sync)
    this.subscribe('layers:updated', this.handleLayersUpdated.bind(this));
    this.subscribe('layer:indices:updated', this.handleLayerIndicesUpdated.bind(this));
    this.subscribe('screw:collected', this.handleScrewCollected.bind(this));
    this.subscribe('screw:animation:started', this.handleScrewAnimationStarted.bind(this));
    this.subscribe('screw:shake:updated', this.handleScrewShakeUpdated.bind(this));
    this.subscribe('screw:transfer:started', this.handleScrewTransferStarted.bind(this));
    this.subscribe('screw:transfer:completed', this.handleScrewTransferCompleted.bind(this));
    this.subscribe('score:updated', this.handleScoreUpdated.bind(this));
    this.subscribe('level:score:updated', this.handleLevelScoreUpdated.bind(this));
    this.subscribe('total:score:updated', this.handleTotalScoreUpdated.bind(this));
    this.subscribe('level:started', this.handleLevelStarted.bind(this));
    this.subscribe('level:progress:updated', this.handleLevelProgressUpdated.bind(this));
    if (DEBUG_CONFIG.logEventFlow) {
      console.log('[GameEventCoordinator] Subscribing to progress:updated events');
    }
    this.subscribe('progress:updated', this.handleProgressUpdated.bind(this));
    
    // Container/holding hole events (to update rendering data)
    this.subscribe('holding_hole:filled', this.handleHoldingHoleFilled.bind(this));
    this.subscribe('container:filled', this.handleContainerFilled.bind(this));
    this.subscribe('holding_holes:full', this.handleHoldingHolesFull.bind(this));
    this.subscribe('holding_holes:available', this.handleHoldingHolesAvailable.bind(this));
    
    // Physics events for debug monitoring
    this.subscribe('physics:collision:detected', this.handleCollisionDetected.bind(this));
    this.subscribe('container:replaced', this.handleContainerReplaced.bind(this));
    
    // Container and holding hole state updates
    this.subscribe('container:state:updated', this.handleContainerStateUpdated.bind(this));
    this.subscribe('holding_hole:state:updated', this.handleHoldingHoleStateUpdated.bind(this));
  }

  private subscribe(eventType: string, handler: (event: unknown) => void): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subscriptionId = eventBus.subscribe(eventType as any, handler as any);
    this.eventSubscriptions.set(eventType, subscriptionId);
  }

  private emit(event: unknown): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    eventBus.emit(event as any);
  }

  routeEvent(eventType: string, data: unknown): void {
    // This method can be used for programmatic event routing if needed
    if (DEBUG_CONFIG.logEventFlow) {
      console.log(`[GameEventCoordinator] Routing event: ${eventType}`, data);
    }
  }

  // Event Handlers
  private handleGameStarted(event: unknown): void {
    const gameStartedEvent = event as GameStartedEvent;
    void gameStartedEvent;
    if (!this.managers) return;
    
    this.managers.stateManager.startGame();
    this.managers.timerManager.clearAllTimers();
    
    if (DEBUG_CONFIG.logEventFlow) {
      if (DEBUG_CONFIG.logEventFlow) {
        console.log('[GameEventCoordinator] Game started event handled');
      }
    }
  }

  private handleGameOver(event: unknown): void {
    const gameOverEvent = event as GameOverEvent;
    if (!this.managers) return;
    
    this.managers.stateManager.endGame();
    this.managers.timerManager.clearAllTimers();
    
    if (DEBUG_CONFIG.logEventFlow) {
      if (DEBUG_CONFIG.logEventFlow) {
        console.log('[GameEventCoordinator] Game over event handled:', gameOverEvent);
      }
    }
  }

  private handleLevelTransitionCompleted(event: unknown): void {
    const levelTransitionCompletedEvent = event as LevelTransitionCompletedEvent;
    if (!this.managers) return;
    
    if (DEBUG_CONFIG.logEventFlow) {
      console.log(`🎯 Level ${levelTransitionCompletedEvent.level} won! Starting 3-second delay before showing completion screen`);
    }
    this.managers.stateManager.completeLevel(levelTransitionCompletedEvent.level, levelTransitionCompletedEvent.score);
    
    // Start 3-second delay before showing level complete screen
    this.managers.timerManager.startLevelCompleteTimer(() => {
      this.managers!.stateManager.showLevelComplete();
      if (DEBUG_CONFIG.logEventFlow) {
        console.log(`✨ Showing level complete screen after 3-second delay`);
      }
    });
  }

  private handleLevelWinConditionMet(event: unknown): void {
    const levelWinConditionMetEvent = event as LevelWinConditionMetEvent;
    if (!this.managers) return;
    
    if (DEBUG_CONFIG.logEventFlow) {
      console.log(`🎯 Level win condition met! Total screws: ${levelWinConditionMetEvent.totalScrews}, Final progress: ${levelWinConditionMetEvent.finalProgress}% - Starting 3-second delay`);
    }
    this.managers.stateManager.updateGameState({ levelWon: true });
    
    // Start 3-second delay before showing level complete screen
    this.managers.timerManager.startLevelCompleteTimer(() => {
      this.managers!.stateManager.showLevelComplete();
      if (DEBUG_CONFIG.logEventFlow) {
        console.log(`✨ Showing level complete screen after 3-second delay`);
      }
    });
  }

  private handleNextLevelRequested(event: unknown): void {
    const nextLevelEvent = event as NextLevelRequestedEvent;
    void nextLevelEvent; // Acknowledge event parameter
    if (!this.managers || !this.systemCoordinator) return;
    
    if (DEBUG_CONFIG.logEventFlow) {
      console.log('🚀 Next level requested, progressing to next level');
    }
    
    // Clear level complete state and timers
    this.managers.timerManager.clearLevelCompleteTimerManual();
    this.managers.stateManager.hideLevelComplete();
    
    // Get the GameState system and call nextLevel
    const gameState = this.systemCoordinator.getSystem('GameState');
    if (gameState && 'nextLevel' in gameState && typeof gameState.nextLevel === 'function') {
      gameState.nextLevel();
      
      if (DEBUG_CONFIG.logEventFlow) {
        console.log('✅ Next level progression completed');
      }
    } else {
      console.error('GameState system not found or nextLevel method not available');
    }
  }

  private handleDebugModeToggled(event: unknown): void {
    const debugEvent = event as DebugModeToggledEvent;
    if (!this.managers) return;
    
    // Only update if the event is from another source (not GameManager)
    this.managers.debugManager.setDebugMode(debugEvent.enabled, debugEvent.source);
  }

  private handleDebugInfoRequested(event: unknown): void {
    const debugInfoEvent = event as DebugInfoRequestedEvent;
    if (!this.managers) return;
    
    const result = this.managers.debugManager.handleDebugInfo(debugInfoEvent.infoType);
    
    if (debugInfoEvent.infoType === 'save_data' && result) {
      this.emit({
        type: 'save:requested',
        timestamp: Date.now(),
        trigger: 'manual'
      });
    }
  }

  private handleLayersUpdated(event: unknown): void {
    void event; // LayersUpdatedEvent - unused but required for signature
    if (!this.managers || !this.systemCoordinator) return;
    
    // Get current visible layers and all screws
    const layerManager = this.systemCoordinator.getLayerManager();
    const screwManager = this.systemCoordinator.getScrewManager();
    
    if (layerManager && screwManager) {
      const visibleLayers = layerManager.getVisibleLayers();
      const allScrews = screwManager.getAllScrews();
      
      this.managers.renderManager.updateRenderData({
        visibleLayers: visibleLayers,
        allScrews: allScrews
      });
    }
  }

  private handleScrewCollected(event: unknown): void {
    void event; // ScrewCollectedEvent - unused but required for signature
    if (!this.managers || !this.systemCoordinator) return;
    
    // When a screw is collected, update the allScrews array for rendering
    const screwManager = this.systemCoordinator.getScrewManager();
    
    if (screwManager) {
      const allScrews = screwManager.getAllScrews();
      this.managers.renderManager.updateRenderData({
        allScrews: allScrews
      });
    }
  }

  private handleLayerIndicesUpdated(event: unknown): void {
    void event; // LayerIndicesUpdatedEvent - unused but required for signature
    if (!this.managers || !this.systemCoordinator) return;
    
    // When layer indices are updated, refresh the visible layers and screws
    const layerManager = this.systemCoordinator.getLayerManager();
    const screwManager = this.systemCoordinator.getScrewManager();
    
    if (layerManager && screwManager) {
      const visibleLayers = layerManager.getVisibleLayers();
      const allScrews = screwManager.getAllScrews();
      
      this.managers.renderManager.updateRenderData({
        visibleLayers: visibleLayers,
        allScrews: allScrews
      });
    }
  }

  private handleScrewAnimationStarted(event: unknown): void {
    void event; // ScrewAnimationStartedEvent - unused but required for signature
    if (!this.managers || !this.systemCoordinator) return;
    
    // When a screw animation starts, update the allScrews array for rendering
    const screwManager = this.systemCoordinator.getScrewManager();
    
    if (screwManager) {
      const allScrews = screwManager.getAllScrews();
      this.managers.renderManager.updateRenderData({
        allScrews: allScrews
      });
      
      if (DEBUG_CONFIG.logScrewDebug) {
        const animatingScrews = allScrews.filter(s => s.isBeingCollected);
        console.log(`🎬 [GameEventCoordinator] Animation started - updated render data with ${allScrews.length} screws (${animatingScrews.length} animating)`);
      }
    }
  }

  private handleScrewShakeUpdated(event: unknown): void {
    void event; // ScrewShakeUpdatedEvent type - unused but required for signature
    if (!this.managers || !this.systemCoordinator) return;
    
    // When screws are shaking, update the allScrews array for rendering to get updated shakeOffset values
    const screwManager = this.systemCoordinator.getScrewManager();
    
    if (screwManager) {
      const allScrews = screwManager.getAllScrews();
      this.managers.renderManager.updateRenderData({
        allScrews: allScrews
      });
      
      if (DEBUG_CONFIG.logScrewDebug) {
        const shakingScrews = allScrews.filter(s => s.isShaking);
        console.log(`📳 [GameEventCoordinator] Shake updated - updated render data with ${allScrews.length} screws (${shakingScrews.length} shaking)`);
      }
    }
  }

  private handleScrewTransferStarted(event: unknown): void {
    void event; // ScrewTransferStartedEvent - unused but required for signature
    if (!this.managers || !this.systemCoordinator) return;
    
    // When a screw transfer starts, update the allScrews array for rendering
    const screwManager = this.systemCoordinator.getScrewManager();
    
    if (screwManager) {
      const allScrews = screwManager.getAllScrews();
      this.managers.renderManager.updateRenderData({
        allScrews: allScrews
      });
      
      if (DEBUG_CONFIG.logScrewDebug) {
        const transferringScrews = allScrews.filter(s => s.isBeingTransferred);
        console.log(`🔄 [GameEventCoordinator] Transfer started - updated render data with ${allScrews.length} screws (${transferringScrews.length} transferring)`);
      }
    }
  }

  private handleScrewTransferCompleted(event: unknown): void {
    void event; // ScrewTransferCompletedEvent - unused but required for signature
    if (!this.managers || !this.systemCoordinator) return;
    
    // When a screw transfer completes, update the allScrews array for rendering
    const screwManager = this.systemCoordinator.getScrewManager();
    
    if (screwManager) {
      const allScrews = screwManager.getAllScrews();
      this.managers.renderManager.updateRenderData({
        allScrews: allScrews
      });
      
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`✅ [GameEventCoordinator] Transfer completed - updated render data with ${allScrews.length} screws`);
      }
    }
  }

  private handleScoreUpdated(event: unknown): void {
    void event;
    // Score updates are handled by level/total score events
  }

  private handleLevelScoreUpdated(event: unknown): void {
    const scoreEvent = event as LevelScoreUpdatedEvent;
    if (!this.managers) return;
    
    this.managers.stateManager.updateLevelScore(scoreEvent.levelScore);
  }

  private handleTotalScoreUpdated(event: unknown): void {
    const scoreEvent = event as TotalScoreUpdatedEvent;
    if (!this.managers) return;
    
    this.managers.stateManager.updateTotalScore(scoreEvent.totalScore);
  }

  private handleLevelStarted(event: unknown): void {
    const levelEvent = event as LevelStartedEvent;
    if (!this.managers) return;
    
    this.managers.stateManager.startLevel(levelEvent.level);
  }

  private handleLevelProgressUpdated(event: unknown): void {
    if (!this.managers) return;
    
    // Handle level progress updates if needed
    if (DEBUG_CONFIG.logEventFlow) {
      if (DEBUG_CONFIG.logProgressTracking) {
        console.log('[GameEventCoordinator] Level progress updated:', event);
      }
    }
  }

  private handleProgressUpdated(event: unknown): void {
    const progressEvent = event as ProgressUpdatedEvent;
    if (!this.managers) return;
    
    if (DEBUG_CONFIG.logProgressTracking) {
      console.log(`[GameEventCoordinator] Received progress:updated event:`, progressEvent);
    }
    
    this.managers.stateManager.updateProgress(
      progressEvent.totalScrews,
      progressEvent.screwsInContainer,
      progressEvent.progress
    );
    
    if (DEBUG_CONFIG.logProgressTracking) {
      console.log(`[GameEventCoordinator] Updated state manager with progress data`);
    }
    
    // Force a render when progress data changes to ensure UI updates immediately
    const gameState = this.managers.stateManager.getGameState();
    if (DEBUG_CONFIG.logProgressTracking) {
      console.log(`[GameEventCoordinator] Current game state after progress update:`, gameState);
    }
    
    if (gameState.gameStarted && !gameState.gameOver) {
      this.managers.renderManager.render();
      if (DEBUG_CONFIG.logProgressTracking) {
        console.log(`[GameEventCoordinator] Triggered render after progress update`);
      }
    }
  }

  private handleHoldingHoleFilled(event: unknown): void {
    const holeEvent = event as HoldingHoleFilledEvent;
    if (!this.managers) return;
    
    if (DEBUG_CONFIG.logEventFlow) {
      if (DEBUG_CONFIG.logEventFlow) {
        console.log(`[GameEventCoordinator] Holding hole filled:`, holeEvent);
      }
    }
  }

  private handleContainerFilled(event: unknown): void {
    const containerEvent = event as ContainerFilledEvent;
    if (!this.managers) return;
    
    if (DEBUG_CONFIG.logEventFlow) {
      if (DEBUG_CONFIG.logEventFlow) {
        console.log(`[GameEventCoordinator] Container filled:`, containerEvent);
      }
    }
  }

  private handleHoldingHolesFull(): void {
    if (!this.managers) return;
    
    this.managers.uiManager.setHoldingHolesFull(true);
    
    // Start 5-second countdown to game over
    this.managers.timerManager.startGameOverCountdown(() => {
      if (DEBUG_CONFIG.logEventFlow) {
        console.log('⏰ 5-second countdown complete - triggering game over');
      }
      
      // Emit game:over event directly - this will trigger the proper game over flow
      this.emit({
        type: 'game:over',
        timestamp: Date.now(),
        finalScore: this.managers!.stateManager.getScore().total,
        reason: 'holding_holes_full'
      });
    });
    
    if (DEBUG_CONFIG.logEventFlow) {
      console.log('🔴 All holding holes are full! Starting 5-second countdown to game over');
    }
  }

  private handleHoldingHolesAvailable(): void {
    if (!this.managers) return;
    
    this.managers.uiManager.setHoldingHolesFull(false);
    
    // Clear the game over countdown timer since holding holes are now available
    this.managers.timerManager.clearGameOverTimer();
    if (DEBUG_CONFIG.logEventFlow) {
      console.log(`🔄 Game over countdown cleared - holding holes now available`);
    }
    
    // Also clear level complete timer if it's running (shouldn't normally happen but safety first)
    this.managers.timerManager.clearLevelCompleteTimerManual();
    if (DEBUG_CONFIG.logEventFlow) {
      console.log(`🔄 Level complete timer cleared during holding holes available`);
    }
  }

  private handleCollisionDetected(event: unknown): void {
    const collisionEvent = event as CollisionDetectedEvent;
    if (!this.managers) return;
    
    // Throttle collision logging to prevent event loop detection
    if (DEBUG_CONFIG.logPhysicsDebug && this.managers.timerManager.shouldLogCollision()) {
      if (DEBUG_CONFIG.logPhysicsDebug) {
        console.log(`🔥 Collision detected between bodies ${collisionEvent.bodyA} and ${collisionEvent.bodyB} with force ${collisionEvent.force.toFixed(2)}`);
      }
      this.managers.timerManager.updateCollisionLogTime();
    }
  }

  private handleContainerReplaced(event: unknown): void {
    const replacedEvent = event as ContainerReplacedEvent;
    if (!this.managers) return;
    
    if (DEBUG_CONFIG.logEventFlow) {
      if (DEBUG_CONFIG.logEventFlow) {
        console.log(`[GameEventCoordinator] Container replaced:`, replacedEvent);
      }
    }
  }

  private handleContainerStateUpdated(event: unknown): void {
    if (!this.managers) return;
    
    if (event && typeof event === 'object' && 'containers' in event) {
      const containerEvent = event as { containers: unknown[] };
      this.managers.renderManager.updateRenderData({
        containers: containerEvent.containers as never
      });
      if (DEBUG_CONFIG.logEventFlow) {
        console.log(`📦 GameEventCoordinator: Container state updated - ${containerEvent.containers.length} containers`);
      }
    }
  }

  private handleHoldingHoleStateUpdated(event: unknown): void {
    if (!this.managers) return;
    
    if (event && typeof event === 'object' && 'holdingHoles' in event) {
      const holeEvent = event as { holdingHoles: unknown[] };
      this.managers.renderManager.updateRenderData({
        holdingHoles: holeEvent.holdingHoles as never
      });
      if (DEBUG_CONFIG.logEventFlow) {
        console.log(`🕳️ GameEventCoordinator: Holding hole state updated - ${holeEvent.holdingHoles.length} holes`);
      }
    }
  }

  cleanup(): void {
    // Unsubscribe from all events
    this.eventSubscriptions.forEach((subscriptionId) => {
      eventBus.unsubscribe(subscriptionId);
    });
    this.eventSubscriptions.clear();
    this.managers = null;
  }
}