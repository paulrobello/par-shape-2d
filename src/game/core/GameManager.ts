/**
 * Refactored GameManager implementation using modular architecture
 * Delegates responsibilities to specialized manager modules for better maintainability
 */

import { BaseSystem } from './BaseSystem';
import { GameLoop } from './GameLoop';
import { DEBUG_CONFIG } from '@/shared/utils/Constants';
import { Vector2, Screw } from '@/types/game';
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

  constructor() {
    super('GameManager');
    
    // Initialize all manager modules
    this.stateManager = new GameStateManager();
    this.renderManager = new GameRenderManager();
    this.uiManager = new GameUIManager();
    this.timerManager = new GameTimerManager();
    this.debugManager = new GameDebugManager();
    this.eventCoordinator = new GameEventCoordinator();

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
  }

  // Public API methods (maintaining compatibility)

  public setSystemCoordinator(coordinator: import('./SystemCoordinator').SystemCoordinator): void {
    this.state.systemCoordinator = coordinator;
    this.eventCoordinator.setSystemCoordinator(coordinator);
  }

  public initializeCanvas(canvas: HTMLCanvasElement): void {
    this.executeIfActive(() => {
      const success = this.renderManager.initializeCanvas(canvas);
      
      if (!success) {
        throw new Error('Unable to initialize canvas');
      }

      console.log(`GameManager initialized: Canvas ${canvas.width}x${canvas.height}`);

      // Set up event listeners
      this.setupInputEventListeners(canvas);

      // Emit bounds changed event
      this.emitBoundsChanged();

      // Try to restore game state
      this.emit({
        type: 'restore:requested',
        timestamp: Date.now()
      });
    });
  }

  public start(): void {
    this.executeIfActive(() => {
      this.state.gameLoop.start();
      console.log('Game loop started');
    });
  }

  public stop(): void {
    this.executeIfActive(() => {
      this.state.gameLoop.stop();
      console.log('Game loop stopped');
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
    canvas.addEventListener('click', this.handleClick.bind(this));

    // Touch events (mobile)
    canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });

    // Keyboard events for debug
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
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
          this.emit({
            type: 'debug:mode:toggled',
            timestamp: Date.now(),
            enabled: newDebugMode,
            source: 'GameManager'
          });
          break;
        case 'r':
          this.handleRestartGame();
          break;
        case 'g':
          this.handleGameOver();
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
        console.log('🎛️ Menu button clicked, toggling menu overlay');
      }
      this.toggleMenuOverlayWithPause();
      return;
    }

    // Handle level complete screen clicks
    if (gameState.levelComplete) {
      if (DEBUG_CONFIG.logSystemLifecycle) {
        console.log('🎯 Level complete screen clicked, requesting next level');
      }
      this.emit({
        type: 'next:level:requested',
        timestamp: Date.now()
      });
      return;
    }

    if (!gameState.gameStarted || gameState.gameOver) {
      return;
    }

    if (uiState.showMenuOverlay) {
      return;
    }

    // Handle screw interaction
    const screw = this.findScrewAtPoint(point, inputType);
    if (screw) {
      this.emit({
        type: 'screw:clicked',
        timestamp: Date.now(),
        screw: screw,
        position: point,
        forceRemoval: this.debugManager.isDebugBypassEnabled()
      });
    }
  }

  private findScrewAtPoint(point: Vector2, inputType: 'mouse' | 'touch'): Screw | null {
    // This method would need to access the screw data from render state
    // For now, return null - this logic would need to be adapted
    const maxDistance = inputType === 'touch' ? 30 : 15;
    const renderState = this.renderManager.getRenderState();
    
    if (DEBUG_CONFIG.logCollisionDetection) {
      console.log(`🎯 findScrewAtPoint: Searching ${renderState.allScrews.length} screws for point (${point.x.toFixed(1)}, ${point.y.toFixed(1)}), maxDistance: ${maxDistance}`);
    }
    
    // Find closest screw within maxDistance
    let closestScrew: Screw | null = null;
    let closestDistance = maxDistance;

    renderState.allScrews.forEach(screw => {
      const distance = Math.sqrt(
        Math.pow(screw.position.x - point.x, 2) + 
        Math.pow(screw.position.y - point.y, 2)
      );
      
      if (DEBUG_CONFIG.logCollisionDetection) {
        console.log(`🎯 Screw ${screw.id} at (${screw.position.x.toFixed(1)}, ${screw.position.y.toFixed(1)}), distance: ${distance.toFixed(1)}`);
      }
      
      if (distance <= closestDistance) {
        closestDistance = distance;
        closestScrew = screw;
      }
    });

    if (DEBUG_CONFIG.logCollisionDetection) {
      if (closestScrew) {
        console.log(`🎯 Found screw: ${(closestScrew as Screw).id} at distance ${closestDistance.toFixed(1)}`);
      } else {
        console.log(`🎯 Found screw: none`);
      }
    }

    return closestScrew;
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

  private getPointFromMouseEvent(event: MouseEvent): Vector2 {
    const renderState = this.renderManager.getRenderState();
    const rect = renderState.canvas?.getBoundingClientRect();
    
    if (!rect) return { x: 0, y: 0 };

    // Convert from screen coordinates to game coordinates
    const x = (event.clientX - rect.left - renderState.canvasOffset.x) / renderState.canvasScale;
    const y = (event.clientY - rect.top - renderState.canvasOffset.y) / renderState.canvasScale;
    
    return { x, y };
  }

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
    this.stateManager.resetGameState();

    // Reset all game systems by emitting game started event
    if (this.state.systemCoordinator) {
      this.emit({
        type: 'game:started',
        timestamp: Date.now()
      });
    }
  }

  private handleGameOver(): void {
    console.log('🚨 Game over triggered manually');
    this.emit({
      type: 'game:over',
      timestamp: Date.now(),
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
    this.emit({
      type: 'game:paused',
      timestamp: Date.now()
    });

    if (DEBUG_CONFIG.logSystemLifecycle) {
      console.log('🔋 Game paused: Menu overlay shown');
    }
  }

  private hideMenuOverlayWithResume(): void {
    this.uiManager.hideMenuOverlay();
    
    // Resume physics when menu is hidden
    this.emit({
      type: 'game:resumed',
      timestamp: Date.now()
    });

    if (DEBUG_CONFIG.logSystemLifecycle) {
      console.log('▶️ Game resumed: Menu overlay hidden');
    }
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
    // Bounds changed event emission removed for refactored architecture
    // Other systems can get bounds information from the RenderManager if needed
  }

  // Cleanup

  protected onDestroy(): void {
    this.timerManager.clearAllTimers();
    this.eventCoordinator.cleanup();
    this.renderManager.cleanup();
    
    // Remove event listeners
    const renderState = this.renderManager.getRenderState();
    if (renderState.canvas) {
      renderState.canvas.removeEventListener('click', this.handleClick.bind(this));
      renderState.canvas.removeEventListener('touchstart', this.handleTouchStart.bind(this));
      renderState.canvas.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    }
    
    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    window.removeEventListener('keyup', this.handleKeyUp.bind(this));
    
    this.state.gameLoop.stop();
  }
}