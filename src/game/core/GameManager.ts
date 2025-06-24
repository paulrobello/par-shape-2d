/**
 * Refactored GameManager implementation using modular architecture
 * Delegates responsibilities to specialized manager modules for better maintainability
 */

import { BaseSystem } from './BaseSystem';
import { GameLoop } from './GameLoop';
import { eventBus } from '../events/EventBus';
import { DEBUG_CONFIG, UI_CONSTANTS } from '@/shared/utils/Constants';
import { DebugLogger } from '@/shared/utils/DebugLogger';
import { EventEmissionUtils } from '@/shared/utils/EventEmissionUtils';
import { Vector2, Screw } from '@/types/game';
import { 
  DebugModeToggledEvent,
  ScrewClickedEvent,
  GameOverEvent,
  LevelWinConditionMetEvent
} from '../events/EventTypes';
import { pointInRectangle } from '@/game/utils/MathUtils';
import { notifyUserClick } from '@/shared/utils/CollisionUtils';

// Import all manager modules
import {
  GameStateManager,
  GameRenderManager,
  GameUIManager,
  GameTimerManager,
  GameDebugManager,
  GameEventCoordinator,
  ManagerContext
} from './managers';

// Simplified state for the main GameManager
interface GameManagerState {
  gameLoop: GameLoop;
  systemCoordinator: import('./SystemCoordinator').SystemCoordinator | null;
}

export class GameManager extends BaseSystem {
  private state: GameManagerState;
  
  // Manager modules
  private stateManager: GameStateManager;
  private renderManager: GameRenderManager;
  private uiManager: GameUIManager;
  private timerManager: GameTimerManager;
  private debugManager: GameDebugManager;
  private eventCoordinator: GameEventCoordinator;

  // Store bound event handlers for proper cleanup
  private readonly boundEventHandlers: {
    readonly handleClick: (event: MouseEvent) => void;
    readonly handleTouchStart: (event: TouchEvent) => void;
    readonly handleTouchEnd: (event: TouchEvent) => void;
    readonly handleKeyDown: (event: KeyboardEvent) => void;
    readonly handleKeyUp: (event: KeyboardEvent) => void;
  };

  constructor() {
    super('GameManager');
    
    // Initialize all manager modules
    this.stateManager = new GameStateManager();
    this.renderManager = new GameRenderManager();
    this.uiManager = new GameUIManager();
    this.timerManager = new GameTimerManager();
    this.debugManager = new GameDebugManager();
    this.eventCoordinator = new GameEventCoordinator();

    // Bind event handlers once for proper cleanup
    this.boundEventHandlers = {
      handleClick: this.handleClick.bind(this),
      handleTouchStart: this.handleTouchStart.bind(this),
      handleTouchEnd: this.handleTouchEnd.bind(this),
      handleKeyDown: this.handleKeyDown.bind(this),
      handleKeyUp: this.handleKeyUp.bind(this)
    };

    // Set up dependencies
    this.setupManagerDependencies();

    // Initialize simplified state
    this.state = {
      gameLoop: new GameLoop(60, this.update.bind(this), this.renderFrame.bind(this)),
      systemCoordinator: null
    };
  }

  private setupManagerDependencies(): void {
    // Set up dependency injection for managers
    this.renderManager.setDependencies(
      this.stateManager,
      this.uiManager,
      this.debugManager
    );

    // Create manager context for event coordinator
    const managerContext: ManagerContext = {
      stateManager: this.stateManager,
      renderManager: this.renderManager,
      uiManager: this.uiManager,
      timerManager: this.timerManager,
      debugManager: this.debugManager,
      eventCoordinator: this.eventCoordinator
    };

    this.eventCoordinator.setManagers(managerContext);
  }

  protected async onInitialize(): Promise<void> {
    this.eventCoordinator.setupEventHandlers();
    
    // Emit initialization event for EventFlowValidator
    EventEmissionUtils.emitSystemInitialized(eventBus, 'GameManager');
  }

  // Public API methods (maintaining compatibility)

  public setSystemCoordinator(coordinator: import('./SystemCoordinator').SystemCoordinator): void {
    this.state.systemCoordinator = coordinator;
    this.eventCoordinator.setSystemCoordinator(coordinator);
    this.renderManager.setSystemCoordinator(coordinator);
  }

  public initializeCanvas(canvas: HTMLCanvasElement): void {
    this.executeIfActive(() => {
      const success = this.renderManager.initializeCanvas(canvas);
      
      if (!success) {
        throw new Error('Unable to initialize canvas');
      }

      DebugLogger.logInfo(`GameManager initialized: Canvas ${canvas.width}x${canvas.height}`);

      // Set up event listeners
      this.setupInputEventListeners(canvas);

      // Emit bounds changed event
      this.emitBoundsChanged();

      // Try to restore game state
      EventEmissionUtils.emit(eventBus, 'restore:requested');
    });
  }

  public start(): void {
    this.executeIfActive(() => {
      this.state.gameLoop.start();
      DebugLogger.logInfo('Game loop started');
    });
  }

  public stop(): void {
    this.executeIfActive(() => {
      this.state.gameLoop.stop();
      DebugLogger.logInfo('Game loop stopped');
    });
  }

  public updateCanvasSize(width: number, height: number): void {
    void width;
    void height;
    this.executeIfActive(() => {
      this.renderManager.updateCanvasSize();
      this.emitBoundsChanged();
    });
  }

  // BaseSystem render method - override required
  public render(context: CanvasRenderingContext2D): void {
    void context; // We use our own context from render manager
    // GameManager doesn't use the BaseSystem render pattern
    // It renders through the GameLoop instead
  }

  // GameLoop methods

  public update(deltaTime: number): void {
    // Update all systems through SystemCoordinator
    this.executeIfActive(() => {
      if (this.state.systemCoordinator) {
        this.state.systemCoordinator.update(deltaTime);
      }
    });
  }

  // GameLoop render method
  private renderFrame(): void {
    this.executeIfActive(() => {
      this.renderManager.render();
    });
  }

  // Input event handling

  private setupInputEventListeners(canvas: HTMLCanvasElement): void {
    // Mouse events (desktop)
    canvas.addEventListener('click', this.boundEventHandlers.handleClick);

    // Touch events (mobile)
    canvas.addEventListener('touchstart', this.boundEventHandlers.handleTouchStart, { passive: false });
    canvas.addEventListener('touchend', this.boundEventHandlers.handleTouchEnd, { passive: false });

    // Keyboard events for debug
    window.addEventListener('keydown', this.boundEventHandlers.handleKeyDown);
    window.addEventListener('keyup', this.boundEventHandlers.handleKeyUp);
  }

  private handleClick(event: MouseEvent): void {
    this.executeIfActive(() => {
      const point = this.getPointFromMouseEvent(event);
      this.handleGameInput(point, 'mouse');
    });
  }

  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();
  }

  private handleTouchEnd(event: TouchEvent): void {
    this.executeIfActive(() => {
      event.preventDefault();
      const point = this.getPointFromTouchEvent(event);
      this.handleGameInput(point, 'touch');
    });
  }

  private handleKeyDown(event: KeyboardEvent): void {
    this.executeIfActive(() => {
      // Track Shift key state for debug bypass
      if (event.key === 'Shift') {
        this.debugManager.setShiftKeyPressed(true);
      }
      
      switch (event.key.toLowerCase()) {
        case 'd':
          // Toggle debug mode
          const newDebugMode = this.debugManager.toggleDebugMode();
          // Emit the event for other systems
          EventEmissionUtils.emit<DebugModeToggledEvent>(eventBus, 'debug:mode:toggled', {
            enabled: newDebugMode
          });
          break;
        case 'r':
          this.handleRestartGame();
          break;
        case 'g':
          this.handleGameOver();
          break;
        case 'c':
          // Debug: trigger level complete sequence (only in debug mode)
          if (this.debugManager.isDebugMode()) {
            this.handleDebugLevelComplete();
          }
          break;
        case ' ':
          this.handleSpaceKey();
          break;
        case 'escape':
          this.hideMenuOverlayWithResume();
          break;
      }
    });
  }

  private handleKeyUp(event: KeyboardEvent): void {
    this.executeIfActive(() => {
      // Track Shift key release
      if (event.key === 'Shift') {
        this.debugManager.setShiftKeyPressed(false);
      }
    });
  }

  private handleGameInput(point: Vector2, inputType: 'mouse' | 'touch'): void {
    // Notify collision system of user interaction for debug logging
    notifyUserClick();
    
    const gameState = this.stateManager.getGameState();
    const uiState = this.uiManager.getUIState();

    // Check for menu button clicks when menu button is visible (start screen and during game)
    const isMenuButtonVisible = !gameState.gameOver && !gameState.levelComplete;
    if (isMenuButtonVisible && this.isMenuButtonClicked(point)) {
      if (DEBUG_CONFIG.logSystemLifecycle) {
        DebugLogger.logGame('Menu button clicked, toggling menu overlay');
      }
      this.toggleMenuOverlayWithPause();
      return;
    }

    // Handle level complete screen clicks
    if (gameState.levelComplete) {
      if (DEBUG_CONFIG.logSystemLifecycle) {
        DebugLogger.logGame('Level complete screen clicked, requesting next level');
      }
      EventEmissionUtils.emit(eventBus, 'next:level:requested');
      return;
    }

    // Handle game over restart click
    if (gameState.gameOver) {
      if (DEBUG_CONFIG.logSystemLifecycle) {
        DebugLogger.logGame('Game over restart clicked');
      }
      this.handleRestartGame();
      return;
    }

    if (!gameState.gameStarted) {
      return;
    }

    if (uiState.showMenuOverlay) {
      // Allow click/touch on overlay to resume game (mobile-friendly)
      if (DEBUG_CONFIG.logSystemLifecycle) {
        DebugLogger.logGame('Menu overlay clicked, resuming game');
      }
      this.hideMenuOverlayWithResume();
      return;
    }

    // Handle screw interaction
    const screw = this.findScrewAtPoint(point, inputType);
    if (screw) {
      EventEmissionUtils.emit<ScrewClickedEvent>(eventBus, 'screw:clicked', {
        screw: screw,
        position: point,
        forceRemoval: this.debugManager.isDebugBypassEnabled()
      });
    }
  }

  /**
   * Finds the best screw within interaction radius using proximity-based collision detection.
   * Selects closest screw, with slight preference for non-blocked screws when distances are similar.
   * 
   * Algorithm:
   * 1. Retrieves all screws from current render state
   * 2. Calculates Euclidean distance from point to each screw center
   * 3. Tracks both closest screw overall and closest non-blocked screw
   * 4. Applies intelligent selection with distance threshold
   * 5. Handles edge cases (no screws, all outside range)
   * 
   * Selection Priority:
   * 1. Closest screw gets selected (blocked or not) for consistent interaction
   * 2. Non-blocked screw preferred only if within 5px of blocked screw distance
   * 3. Ensures blocked screws maintain full interaction radius for shake feedback
   * 
   * Performance: O(n) where n = total screws in visible layers
   * 
   * Touch vs Mouse Interaction:
   * - Touch: 30px radius for comfortable finger interaction
   * - Mouse: 15px radius for precise cursor targeting
   * 
   * @param point - Interaction point in game coordinates (not screen coordinates)
   * @param inputType - Input method determines interaction radius
   * @returns Best screw within range or null if none found
   */
  private findScrewAtPoint(point: Vector2, inputType: 'mouse' | 'touch'): Screw | null {
    const maxDistance = inputType === 'touch' ? UI_CONSTANTS.input.touchRadius : UI_CONSTANTS.input.mouseRadius;
    const renderState = this.renderManager.getRenderState();
    const screwManager = this.state.systemCoordinator?.getScrewManager();
    
    if (DEBUG_CONFIG.logCollisionDetection) {
      DebugLogger.logCollision(`findScrewAtPoint: Searching ${renderState.allScrews.length} screws for point (${point.x.toFixed(1)}, ${point.y.toFixed(1)}), maxDistance: ${maxDistance}`);
    }
    
    // Find closest screw (any) and closest non-blocked screw within maxDistance
    let closestScrew: Screw | null = null;
    let closestDistance: number = maxDistance;
    let closestNonBlockedScrew: Screw | null = null;
    let closestNonBlockedDistance: number = maxDistance;

    renderState.allScrews.forEach(screw => {
      const distance = Math.sqrt(
        Math.pow(screw.position.x - point.x, 2) + 
        Math.pow(screw.position.y - point.y, 2)
      );
      
      if (distance <= maxDistance) {
        // Check if this screw is blocked (only if screwManager is available)
        const isBlocked = screwManager?.isScrewBlocked?.(screw.id) ?? false;
        
        if (DEBUG_CONFIG.logCollisionDetection) {
          DebugLogger.logCollision(`Screw ${screw.id} at (${screw.position.x.toFixed(1)}, ${screw.position.y.toFixed(1)}), distance: ${distance.toFixed(1)}, blocked: ${isBlocked}`);
        }
        
        // Track closest screw overall
        if (distance <= closestDistance) {
          closestDistance = distance;
          closestScrew = screw;
        }
        
        // Track closest non-blocked screw
        if (!isBlocked && distance <= closestNonBlockedDistance) {
          closestNonBlockedDistance = distance;
          closestNonBlockedScrew = screw;
        }
      }
    });

    // Select the closest screw, but prefer non-blocked if distances are similar
    // This ensures blocked screws can still be selected with full radius for shake feedback
    let selectedScrew: Screw | null = null;
    let selectedDistance: number = maxDistance;
    let wasBlocked = false;
    
    // If we have both blocked and non-blocked options, use a small threshold to decide
    if (closestScrew !== null && closestNonBlockedScrew !== null) {
      // Only prefer non-blocked screw if it's reasonably close to the blocked one
      const distanceThreshold = 5; // pixels - small threshold for preferring non-blocked
      if (closestNonBlockedDistance <= closestDistance + distanceThreshold) {
        selectedScrew = closestNonBlockedScrew;
        selectedDistance = closestNonBlockedDistance;
      } else {
        selectedScrew = closestScrew;
        selectedDistance = closestDistance;
        wasBlocked = true;
      }
    } else {
      // Simple case: only one type available
      selectedScrew = closestScrew || closestNonBlockedScrew;
      selectedDistance = closestScrew ? closestDistance : closestNonBlockedDistance;
      wasBlocked = closestScrew !== null && closestNonBlockedScrew === null;
    }

    if (DEBUG_CONFIG.logCollisionDetection) {
      if (selectedScrew !== null) {
        const screwType = wasBlocked ? 'blocked' : 'non-blocked';
        const selectionReason = closestScrew !== null && closestNonBlockedScrew !== null
          ? `(selected ${screwType} - closest overall: ${closestDistance.toFixed(1)}px, closest non-blocked: ${closestNonBlockedDistance.toFixed(1)}px)`
          : `(only ${screwType} screws in range)`;
        DebugLogger.logCollision(`Found screw: ${(selectedScrew as Screw).id} at distance ${selectedDistance.toFixed(1)} ${selectionReason}`);
      } else {
        console.log(`🎯 Found screw: none`);
      }
    }

    return selectedScrew;
  }

  private isMenuButtonClicked(point: Vector2): boolean {
    // Menu button coordinates match those in GameRenderManager.renderMenuButton()
    const renderState = this.renderManager.getRenderState();
    const buttonX = renderState.virtualGameWidth - 50;
    const buttonY = 15;
    const buttonSize = 30;
    
    const buttonRect = { 
      x: buttonX, 
      y: buttonY, 
      width: buttonSize, 
      height: buttonSize 
    };
    
    const isClicked = pointInRectangle(point, buttonRect);
    
    if (DEBUG_CONFIG.logSystemLifecycle && isClicked) {
      console.log('🎯 Menu button hit test passed:', { 
        clickPoint: point, 
        buttonRect: buttonRect 
      });
    }
    
    return isClicked;
  }

  /**
   * Converts mouse event screen coordinates to normalized game world coordinates.
   * 
   * Coordinate Transformation Pipeline:
   * 1. Extract screen coordinates from mouse event (clientX, clientY)
   * 2. Subtract canvas bounding rect offset (handles viewport positioning)
   * 3. Subtract canvas rendering offset (handles canvas centering)
   * 4. Divide by canvas scale factor (handles responsive scaling/zoom)
   * 
   * Result: Normalized game coordinates independent of screen size and canvas scaling
   * 
   * @param event - Mouse event containing screen coordinates
   * @returns Normalized game coordinates for collision detection and interaction
   */
  private getPointFromMouseEvent(event: MouseEvent): Vector2 {
    const renderState = this.renderManager.getRenderState();
    const rect = renderState.canvas?.getBoundingClientRect();
    
    if (!rect) return { x: 0, y: 0 };

    // Convert from screen coordinates to game coordinates
    const x = (event.clientX - rect.left - renderState.canvasOffset.x) / renderState.canvasScale;
    const y = (event.clientY - rect.top - renderState.canvasOffset.y) / renderState.canvasScale;
    
    return { x, y };
  }

  /**
   * Converts touch event screen coordinates to normalized game world coordinates.
   * 
   * Touch-Specific Handling:
   * 1. Uses changedTouches[0] to get primary touch point
   * 2. Applies same coordinate transformation as mouse events
   * 3. Handles multi-touch by using first touch point only
   * 4. Guards against touch events with no touch data
   * 
   * Mobile Considerations:
   * - Touch coordinates include viewport scaling effects
   * - Handles device pixel ratio and zoom levels automatically
   * - Compatible with preventDefault() touch behavior prevention
   * 
   * @param event - Touch event containing screen coordinates
   * @returns Normalized game coordinates for mobile interaction
   */
  private getPointFromTouchEvent(event: TouchEvent): Vector2 {
    const renderState = this.renderManager.getRenderState();
    const rect = renderState.canvas?.getBoundingClientRect();
    
    if (!rect || event.changedTouches.length === 0) return { x: 0, y: 0 };

    const touch = event.changedTouches[0];
    
    // Convert from screen coordinates to game coordinates
    const x = (touch.clientX - rect.left - renderState.canvasOffset.x) / renderState.canvasScale;
    const y = (touch.clientY - rect.top - renderState.canvasOffset.y) / renderState.canvasScale;
    
    return { x, y };
  }

  // Game control handlers

  private handleRestartGame(): void {
    console.log('🔄 Restart requested');
    this.timerManager.clearAllTimers();
    this.uiManager.resetUIState();
    this.stateManager.resetGameState(true); // Preserve level and total score

    // Reset all game systems by emitting game started event
    if (this.state.systemCoordinator) {
      EventEmissionUtils.emit(eventBus, 'game:started');
    }
  }

  private handleGameOver(): void {
    console.log('🚨 Game over triggered manually');
    EventEmissionUtils.emit<GameOverEvent>(eventBus, 'game:over', {
      finalScore: this.stateManager.getScore().total,
      reason: 'user_triggered'
    });
  }

  private handleSpaceKey(): void {
    const uiState = this.uiManager.getUIState();
    
    if (uiState.showMenuOverlay) {
      this.hideMenuOverlayWithResume();
    } else {
      this.showMenuOverlayWithPause();
    }
  }

  private toggleMenuOverlayWithPause(): void {
    const uiState = this.uiManager.getUIState();
    
    if (uiState.showMenuOverlay) {
      this.hideMenuOverlayWithResume();
    } else {
      this.showMenuOverlayWithPause();
    }
  }

  private showMenuOverlayWithPause(): void {
    this.uiManager.showMenuOverlay();
    
    // Pause physics when menu is shown
    EventEmissionUtils.emit(eventBus, 'game:paused');

    if (DEBUG_CONFIG.logSystemLifecycle) {
      console.log('🔋 Game paused: Menu overlay shown');
    }
  }

  private hideMenuOverlayWithResume(): void {
    this.uiManager.hideMenuOverlay();
    
    // Resume physics when menu is hidden
    EventEmissionUtils.emit(eventBus, 'game:resumed');

    if (DEBUG_CONFIG.logSystemLifecycle) {
      console.log('▶️ Game resumed: Menu overlay hidden');
    }
  }

  private handleDebugLevelComplete(): void {
    if (DEBUG_CONFIG.logLevelCompletionEffects) {
      console.log('🎆 Debug: Triggering level complete sequence');
    }

    // Get the GameState system and trigger the burst effect manually
    if (this.state.systemCoordinator) {
      const gameState = this.state.systemCoordinator.getSystem<import('./GameState').GameState>('GameState');
      if (gameState) {
        const containerManager = gameState.getContainerManager();
        if (containerManager) {
          containerManager.triggerDebugBurstEffect();
        }
      }
    }

    // Emit level win condition met event to trigger level completion
    EventEmissionUtils.emit<LevelWinConditionMetEvent>(eventBus, 'level:win:condition:met', {
      totalScrews: 100, // Dummy values for debug
      finalProgress: 100
    });
  }

  // Backward compatibility methods

  public getState(): { 
    progressData: { totalScrews: number; screwsInContainer: number; progress: number };
    gameOver: boolean;
    gameStarted: boolean;
    levelComplete: boolean;
  } {
    const gameState = this.stateManager.getGameState();
    return {
      progressData: gameState.progressData,
      gameOver: gameState.gameOver,
      gameStarted: gameState.gameStarted,
      levelComplete: gameState.levelComplete
    };
  }

  public getDebugMode(): boolean {
    return this.debugManager.isDebugMode();
  }

  // Utility methods

  private emitBoundsChanged(): void {
    const renderState = this.renderManager.getRenderState();
    if (renderState.canvas) {
      EventEmissionUtils.emitBoundsChanged(
        eventBus,
        renderState.canvas.width,
        renderState.canvas.height,
        renderState.canvasScale || 1,
        this.renderManager.getShapeAreaStartY()
      );
      
      if (DEBUG_CONFIG.logBoundsOperations) {
        console.log(`🔄 Bounds changed event emitted: ${renderState.canvas.width}x${renderState.canvas.height} (scale: ${renderState.canvasScale || 1})`);
      }
    }
  }

  // Cleanup

  protected onDestroy(): void {
    // Stop the game loop first to prevent further updates
    this.state.gameLoop.stop();
    
    this.timerManager.clearAllTimers();
    this.eventCoordinator.cleanup();
    this.renderManager.cleanup();
    
    // Remove event listeners using the same bound functions that were added
    const renderState = this.renderManager.getRenderState();
    if (renderState.canvas) {
      renderState.canvas.removeEventListener('click', this.boundEventHandlers.handleClick);
      renderState.canvas.removeEventListener('touchstart', this.boundEventHandlers.handleTouchStart);
      renderState.canvas.removeEventListener('touchend', this.boundEventHandlers.handleTouchEnd);
    }
    
    window.removeEventListener('keydown', this.boundEventHandlers.handleKeyDown);
    window.removeEventListener('keyup', this.boundEventHandlers.handleKeyUp);
  }
}