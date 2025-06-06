/**
 * Event-driven GameManager implementation
 * Simplified to focus on input handling and rendering coordination
 * All business logic moved to event-driven systems
 */

import { BaseSystem } from './BaseSystem';
import { GameLoop } from './GameLoop';
import { eventBus } from '@/game/events/EventBus';
import { ScrewManager } from '@/game/systems/ScrewManager';
import { PrecomputationConfig } from '../../types/precomputed';
import { GAME_CONFIG, SCREW_COLORS, LAYOUT_CONSTANTS, UI_CONSTANTS, getTotalLayersForLevel, DEBUG_CONFIG } from '@/shared/utils/Constants';
import { DeviceDetection } from '@/game/utils/DeviceDetection';
import { Vector2, Container, HoldingHole, RenderContext, Screw } from '@/types/game';
import { Layer } from '@/game/entities/Layer';
import { ShapeRenderer } from '@/game/rendering/ShapeRenderer';
import { ScrewRenderer } from '@/game/rendering/ScrewRenderer';
import {
  GameStartedEvent,
  GameOverEvent,
  LevelCompleteEvent,
  DebugModeToggledEvent,
  DebugInfoRequestedEvent,
  LayersUpdatedEvent,
  ScoreUpdatedEvent,
  LevelScoreUpdatedEvent,
  TotalScoreUpdatedEvent,
  LevelStartedEvent,
  HoldingHoleFilledEvent,
  ContainerFilledEvent,
  CollisionDetectedEvent,
  ContainerReplacedEvent
} from '../events/EventTypes';

interface GameManagerState {
  canvas: HTMLCanvasElement | null;
  ctx: CanvasRenderingContext2D | null;
  gameLoop: GameLoop;
  debugMode: boolean;
  
  // Canvas scaling properties
  canvasScale: number;
  canvasOffset: Vector2;
  virtualGameWidth: number;
  virtualGameHeight: number;
  
  // UI state
  showMenuOverlay: boolean;
  holdingHolesFull: boolean;
  
  // Game state (simplified - only what's needed for rendering)
  gameStarted: boolean;
  gameOver: boolean;
  levelComplete: boolean;
  currentLevel: number;
  levelScore: number;
  totalScore: number;
  screwsRemovedThisLevel: number;
  
  // Rendering data
  visibleLayers: Layer[];
  containers: Container[];
  holdingHoles: HoldingHole[];
  allScrews: Screw[];
  
  // System coordinator reference for updates
  systemCoordinator: import('./SystemCoordinator').SystemCoordinator | null;
  
  // Game over countdown timer
  gameOverCountdown: NodeJS.Timeout | null;
}

export class GameManager extends BaseSystem {
  private state: GameManagerState;

  constructor() {
    super('GameManager');
    
    this.state = {
      canvas: null,
      ctx: null,
      gameLoop: new GameLoop(60, this.update.bind(this), this.renderFrame.bind(this)),
      debugMode: false,
      canvasScale: 1,
      canvasOffset: { x: 0, y: 0 },
      virtualGameWidth: GAME_CONFIG.canvas.width,
      virtualGameHeight: GAME_CONFIG.canvas.height,
      showMenuOverlay: false,
      holdingHolesFull: false,
      gameStarted: false,
      gameOver: false,
      levelComplete: false,
      currentLevel: 1,
      levelScore: 0,
      totalScore: 0,
      screwsRemovedThisLevel: 0,
      visibleLayers: [],
      containers: [],
      holdingHoles: [],
      allScrews: [],
      systemCoordinator: null,
      gameOverCountdown: null
    };
  }

  protected async onInitialize(): Promise<void> {
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Game state events
    this.subscribe('game:started', this.handleGameStarted.bind(this));
    this.subscribe('game:over', this.handleGameOver.bind(this));
    this.subscribe('level:complete', this.handleLevelComplete.bind(this));
    
    // Debug events
    this.subscribe('debug:mode:toggled', this.handleDebugModeToggled.bind(this));
    this.subscribe('debug:info:requested', this.handleDebugInfoRequested.bind(this));
    
    // Rendering data events (to keep rendering data in sync)
    this.subscribe('layers:updated', this.handleLayersUpdated.bind(this));
    this.subscribe('score:updated', this.handleScoreUpdated.bind(this));
    this.subscribe('level_score:updated', this.handleLevelScoreUpdated.bind(this));
    this.subscribe('total_score:updated', this.handleTotalScoreUpdated.bind(this));
    this.subscribe('level:started', this.handleLevelStarted.bind(this));
    this.subscribe('level:progress:updated', this.handleLevelProgressUpdated.bind(this));
    
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

  // Event Handlers
  private handleGameStarted(_event: GameStartedEvent): void {
    void _event;
    this.executeIfActive(() => {
      this.state.gameStarted = true;
      this.state.gameOver = false;
      this.state.levelComplete = false;
      
      // Clear any existing game over countdown when starting a new game
      if (this.state.gameOverCountdown) {
        clearInterval(this.state.gameOverCountdown);
        this.state.gameOverCountdown = null;
        console.log('🔄 Cleared existing game over countdown');
      }
    });
  }

  private handleGameOver(event: GameOverEvent): void {
    this.executeIfActive(() => {
      this.state.gameOver = true;
      this.state.gameStarted = false;
      this.state.totalScore = event.finalScore;
      
      // Clear countdown timer if it's running
      if (this.state.gameOverCountdown) {
        clearInterval(this.state.gameOverCountdown);
        this.state.gameOverCountdown = null;
      }
    });
  }

  private handleLevelComplete(event: LevelCompleteEvent): void {
    this.executeIfActive(() => {
      this.state.levelComplete = true;
      this.state.currentLevel = event.level;
      this.state.levelScore = event.score;
    });
  }

  private handleDebugModeToggled(event: DebugModeToggledEvent): void {
    this.executeIfActive(() => {
      // Only update if the event is from another source (not GameManager)
      if (event.source && event.source !== 'GameManager') {
        this.state.debugMode = event.enabled;
        console.log(`Debug mode ${event.enabled ? 'enabled' : 'disabled'} (from ${event.source})`);
      }
    });
  }

  private handleDebugInfoRequested(event: DebugInfoRequestedEvent): void {
    this.executeIfActive(() => {
      switch (event.infoType) {
        case 'performance':
          console.log('Performance info:', {
            canvasSize: `${this.state.canvas?.width}x${this.state.canvas?.height}`,
            virtualSize: `${this.state.virtualGameWidth}x${this.state.virtualGameHeight}`,
            scale: this.state.canvasScale,
            debugMode: this.state.debugMode
          });
          break;
        case 'state':
          console.log('Game state info:', {
            gameStarted: this.state.gameStarted,
            gameOver: this.state.gameOver,
            levelComplete: this.state.levelComplete,
            currentLevel: this.state.currentLevel,
            levelScore: this.state.levelScore,
            totalScore: this.state.totalScore
          });
          break;
        case 'save_data':
          this.emit({
            type: 'save:requested',
            timestamp: Date.now(),
            trigger: 'manual'
          });
          break;
      }
    });
  }

  private handleLayersUpdated(event: LayersUpdatedEvent): void {
    this.executeIfActive(() => {
      this.state.visibleLayers = event.visibleLayers;
    });
  }

  private handleScoreUpdated(_event: ScoreUpdatedEvent): void {
    void _event;
    // Score updates are handled by level/total score events
  }

  private handleLevelScoreUpdated(event: LevelScoreUpdatedEvent): void {
    this.executeIfActive(() => {
      this.state.levelScore = event.levelScore;
    });
  }

  private handleTotalScoreUpdated(event: TotalScoreUpdatedEvent): void {
    this.executeIfActive(() => {
      this.state.totalScore = event.totalScore;
    });
  }

  private handleLevelStarted(event: LevelStartedEvent): void {
    this.executeIfActive(() => {
      this.state.currentLevel = event.level;
      this.state.levelScore = 0;
      this.state.levelComplete = false;
      this.state.screwsRemovedThisLevel = 0;
      
      // Reset event loop detection for level initialization
      eventBus.resetLoopDetection();
      console.log('Reset event loop detection for level initialization');

      // Use normal layer generation with visibility management instead of precomputation
      // The LayerManager will handle progressive layer visibility
    });
  }

  private handleLevelProgressUpdated(event: import('../events/EventTypes').LevelProgressUpdatedEvent): void {
    this.executeIfActive(() => {
      this.state.screwsRemovedThisLevel = event.screwsRemoved;
    });
  }

  private handleHoldingHoleFilled(event: HoldingHoleFilledEvent): void {
    this.executeIfActive(() => {
      // The holding_hole:filled event is fired when a holding hole is filled or emptied
      // GameState manages the actual holding hole state, so we just log here
      if (event.screwId) {
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`🕳️ GameManager: Holding hole ${event.holeIndex} filled with screw ${event.screwId}`);
        }
      } else {
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`🕳️ GameManager: Holding hole ${event.holeIndex} is now empty`);
        }
      }
      
      // The actual holding hole state will be updated via holding_hole:state:updated event
    });
  }

  private handleContainerFilled(event: ContainerFilledEvent): void {
    this.executeIfActive(() => {
      // The container:filled event is fired when a container becomes full
      // GameState manages the actual container state, so we just log here
      console.log(`📦 GameManager: Container ${event.containerIndex} is now full (color: ${event.color})`);
      
      // The actual container state will be updated via container:state:updated event
    });
  }

  private handleCollisionDetected(event: CollisionDetectedEvent): void {
    this.executeIfActive(() => {
      if (DEBUG_CONFIG.logPhysicsDebug) {
        console.log(`🔥 Collision detected between bodies ${event.bodyA} and ${event.bodyB} with force ${event.force.toFixed(2)}`);
      }
    });
  }

  private handleContainerReplaced(event: ContainerReplacedEvent): void {
    this.executeIfActive(() => {
      // Don't update containers here - wait for container:state:updated event from GameState
      console.log(`🔄 GameManager: Container ${event.containerIndex} replaced - color changed from ${event.oldColor} to ${event.newColor}`);
    });
  }

  private handleHoldingHolesFull(event: import('@/game/events/EventTypes').HoldingHolesFullEvent): void {
    this.executeIfActive(() => {
      console.log(`⚠️ All holding holes are full! Starting ${event.countdown / 1000}s countdown to game over...`);
      
      // Set holding holes full state for visual effects
      this.state.holdingHolesFull = true;
      
      // Start countdown timer
      let remainingTime = event.countdown;
      const countdownInterval = setInterval(() => {
        remainingTime -= 1000;
        const secondsLeft = remainingTime / 1000;
        
        if (secondsLeft > 0) {
          console.log(`⏰ Game over in ${secondsLeft} seconds...`);
        } else {
          console.log(`💀 Game Over! All holding holes were full.`);
          clearInterval(countdownInterval);
          
          // Trigger game over
          this.emit({
            type: 'game:over',
            timestamp: Date.now(),
            reason: 'holding_holes_full',
            finalScore: this.state.totalScore
          });
        }
      }, 1000);
      
      // Store the interval so we can clear it if the game state changes
      this.state.gameOverCountdown = countdownInterval;
    });
  }
  
  private handleHoldingHolesAvailable(_event: import('@/game/events/EventTypes').HoldingHolesAvailableEvent): void {
    void _event;
    this.executeIfActive(() => {
      console.log(`✅ Holding holes are now available - cancelling game over countdown`);
      
      // Clear holding holes full state
      this.state.holdingHolesFull = false;
      
      // Clear the countdown timer if it's running
      if (this.state.gameOverCountdown) {
        clearInterval(this.state.gameOverCountdown);
        this.state.gameOverCountdown = null;
        console.log(`🔄 Game over countdown cancelled - game can continue`);
      }
    });
  }
  
  private handleContainerStateUpdated(event: import('@/game/events/EventTypes').ContainerStateUpdatedEvent): void {
    this.executeIfActive(() => {
      this.state.containers = event.containers;
      console.log(`📦 GameManager: Container state updated - ${event.containers.length} containers`);
    });
  }
  
  private handleHoldingHoleStateUpdated(event: import('@/game/events/EventTypes').HoldingHoleStateUpdatedEvent): void {
    this.executeIfActive(() => {
      this.state.holdingHoles = event.holdingHoles;
      console.log(`🕳️ GameManager: Holding hole state updated - ${event.holdingHoles.length} holes`);
    });
  }

  // Public API
  public setSystemCoordinator(coordinator: import('./SystemCoordinator').SystemCoordinator): void {
    this.state.systemCoordinator = coordinator;
  }

  public initializeCanvas(canvas: HTMLCanvasElement): void {
    this.executeIfActive(() => {
      this.state.canvas = canvas;
      this.state.ctx = canvas.getContext('2d');

      if (!this.state.ctx) {
        throw new Error('Unable to get 2D rendering context');
      }

      console.log(`GameManager initialized: Canvas ${canvas.width}x${canvas.height}`);

      // Apply initial canvas scaling
      this.updateCanvasScaling();

      // Set up event listeners
      this.setupInputEventListeners();

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
    this.executeIfActive(() => {
      if (!this.state.canvas) return;

      console.log(`CANVAS UPDATE: Updating canvas size from ${this.state.canvas.width}x${this.state.canvas.height} to ${width}x${height}`);

      this.state.canvas.width = width;
      this.state.canvas.height = height;

      // Always update virtual game dimensions to match canvas for proper element positioning
      this.state.virtualGameWidth = width;
      this.state.virtualGameHeight = height;
      console.log(`Updated virtual game dimensions to ${width}x${height} to match canvas`);

      this.updateCanvasScaling();
      this.emitBoundsChanged();
    });
  }

  // Input Event Handling
  private setupInputEventListeners(): void {
    if (!this.state.canvas) return;

    // Mouse events (desktop)
    this.state.canvas.addEventListener('click', this.handleClick.bind(this));

    // Touch events (mobile)
    this.state.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.state.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });

    // Keyboard events for debug
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  private handleClick(event: MouseEvent): void {
    this.executeIfActive(() => {
      console.log('=== CLICK DETECTED ===');
      if (!this.state.canvas) return;

      const rect = this.state.canvas.getBoundingClientRect();
      const clickPoint = this.transformCanvasCoordinates(event.clientX - rect.left, event.clientY - rect.top);

      // Check for menu button clicks first
      if (this.checkMenuButtonClick(clickPoint)) {
        console.log('Menu button clicked - toggling overlay');
        this.state.showMenuOverlay = !this.state.showMenuOverlay;
        return;
      }

      // Check for menu overlay button clicks
      if (this.state.showMenuOverlay && this.checkMenuOverlayClick(clickPoint)) {
        console.log('Menu overlay button clicked');
        return;
      }

      // If menu overlay is showing but click was outside menu area, close it
      if (this.state.showMenuOverlay) {
        console.log('Click outside menu - closing overlay');
        this.state.showMenuOverlay = false;
        return;
      }

      // Check for level complete screen clicks
      if (this.state.levelComplete && this.checkLevelCompleteClick(clickPoint)) {
        console.log('Level complete screen clicked - advancing to next level');
        this.advanceToNextLevel();
        return;
      }

      // Process normal game input
      this.handleGameInput(clickPoint, 'mouse');
    });
  }

  private handleTouchStart(event: TouchEvent): void {
    this.executeIfActive(() => {
      event.preventDefault();
    });
  }

  private handleTouchEnd(event: TouchEvent): void {
    this.executeIfActive(() => {
      event.preventDefault();
      console.log('=== TOUCH END DETECTED ===');
      if (!this.state.canvas || event.changedTouches.length === 0) return;

      const rect = this.state.canvas.getBoundingClientRect();
      const touch = event.changedTouches[0];
      
      console.log(`Touch coordinates: clientX=${touch.clientX}, clientY=${touch.clientY}`);
      console.log(`Canvas bounds: left=${rect.left}, top=${rect.top}, width=${rect.width}, height=${rect.height}`);
      console.log(`Canvas internal size: ${this.state.canvas.width}x${this.state.canvas.height}`);
      console.log(`Canvas display size: ${rect.width}x${rect.height}`);
      console.log(`Canvas scale: ${this.state.canvasScale}, offset: (${this.state.canvasOffset.x}, ${this.state.canvasOffset.y})`);
      
      const touchPoint = this.transformCanvasCoordinates(touch.clientX - rect.left, touch.clientY - rect.top);
      console.log(`Transformed touch point: (${touchPoint.x.toFixed(1)}, ${touchPoint.y.toFixed(1)})`);

      // Check for menu button touches first
      if (this.checkMenuButtonClick(touchPoint)) {
        console.log('Menu button touched - toggling overlay');
        this.state.showMenuOverlay = !this.state.showMenuOverlay;
        return;
      }

      // Check for menu overlay button touches
      if (this.state.showMenuOverlay && this.checkMenuOverlayClick(touchPoint)) {
        console.log('Menu overlay button touched');
        return;
      }

      // If menu overlay is showing but touch was outside menu area, close it
      if (this.state.showMenuOverlay) {
        console.log('Touch outside menu - closing overlay');
        this.state.showMenuOverlay = false;
        return;
      }

      // Check for level complete screen touches
      if (this.state.levelComplete && this.checkLevelCompleteClick(touchPoint)) {
        console.log('Level complete screen touched - advancing to next level');
        this.advanceToNextLevel();
        return;
      }

      // Same logic as click for touch
      this.handleGameInput(touchPoint, 'touch');
    });
  }

  private handleKeyDown(event: KeyboardEvent): void {
    this.executeIfActive(() => {
      switch (event.key.toLowerCase()) {
        case 'd':
          // Toggle debug mode immediately
          this.state.debugMode = !this.state.debugMode;
          // Then emit the event for other systems
          this.emit({
            type: 'debug:mode:toggled',
            timestamp: Date.now(),
            enabled: this.state.debugMode,
            source: 'GameManager'
          });
          console.log(`Debug mode toggled via 'D' key: ${this.state.debugMode}`);
          break;
        case 'r':
          this.handleMenuAction('restart');
          break;
        case 'g':
          this.emit({
            type: 'game:over',
            timestamp: Date.now(),
            reason: 'user_triggered',
            finalScore: this.state.totalScore + this.state.levelScore
          });
          break;
        case 's':
          this.emit({
            type: 'save:requested',
            timestamp: Date.now(),
            trigger: 'manual'
          });
          break;
        case 'i':
          this.emit({
            type: 'debug:info:requested',
            timestamp: Date.now(),
            infoType: 'save_data'
          });
          break;
        case 'c':
          localStorage.removeItem('par-shape-2d-save');
          if (DEBUG_CONFIG.logLayerDebug) {
            console.log('Save data cleared');
          }
          break;
        case 'p':
        case ' ': // spacebar
          if (this.state.gameStarted && !this.state.gameOver) {
            this.emit({
              type: 'game:paused',
              timestamp: Date.now()
            });
          }
          break;
        case 'enter':
        case 'escape':
          if (this.state.gameStarted && !this.state.gameOver) {
            this.emit({
              type: 'game:resumed',
              timestamp: Date.now()
            });
          }
          break;
      }
    });
  }

  private handleGameInput(point: Vector2, inputType: 'mouse' | 'touch'): void {
    if (!this.state.gameStarted || this.state.gameOver) {
      return;
    }

    console.log(`Processing ${inputType} input at (${point.x.toFixed(1)}, ${point.y.toFixed(1)})`);

    // Find the closest screw to the click/touch point
    const screw = this.findScrewAtPoint(point, inputType);
    if (screw) {
      const screwWithId = screw as { id: string };
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`Found screw ${screwWithId.id} at distance from click`);
      }
      
      // Emit screw clicked event
      this.emit({
        type: 'screw:clicked',
        timestamp: Date.now(),
        screw: screw,
        position: point
      });
    } else {
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log('No removable screw found at input point');
      }
    }
  }

  private findScrewAtPoint(point: Vector2, inputType: 'mouse' | 'touch'): Screw | null {
    const maxDistance = inputType === 'touch' ? 30 : 15; // Touch has larger radius
    let closestScrew: Screw | null = null;
    let closestDistance = Infinity;

    // Check all screws to find the closest one within range
    this.state.allScrews.forEach(screw => {
      if (screw.isCollected || screw.isBeingCollected) {
        return; // Skip collected or animating screws
      }
      // NOTE: Now including non-removable (blocked) screws for click detection

      const dx = screw.position.x - point.x;
      const dy = screw.position.y - point.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= maxDistance && distance < closestDistance) {
        closestDistance = distance;
        closestScrew = screw;
      }
    });

    if (closestScrew) {
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`Found screw ${(closestScrew as Screw).id} at distance ${closestDistance.toFixed(1)}`);
      }
    } else {
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`No screw found within ${maxDistance}px of click point`);
      }
    }

    return closestScrew;
  }

  // Menu Handling
  private checkMenuButtonClick(point: Vector2): boolean {
    const buttonSize = 35;
    const margin = 15;
    const x = this.state.virtualGameWidth - buttonSize - margin;
    const y = margin;

    console.log(`Menu button check: point(${point.x.toFixed(1)}, ${point.y.toFixed(1)}) vs button area(${x.toFixed(1)}, ${y.toFixed(1)}, ${(x + buttonSize).toFixed(1)}, ${(y + buttonSize).toFixed(1)})`);
    console.log(`Virtual game dimensions: ${this.state.virtualGameWidth}x${this.state.virtualGameHeight}`);

    const isInButton = point.x >= x && point.x <= x + buttonSize &&
                      point.y >= y && point.y <= y + buttonSize;
    
    console.log(`Menu button clicked: ${isInButton}`);
    return isInButton;
  }

  private checkMenuOverlayClick(point: Vector2): boolean {
    const isMobileDevice = DeviceDetection.isMobileDevice();
    const panelWidth = isMobileDevice ? Math.min(this.state.virtualGameWidth * 0.85, 500) : 400;
    const panelHeight = isMobileDevice ? Math.min(this.state.virtualGameHeight * 0.7, 600) : 450;
    const panelX = (this.state.virtualGameWidth - panelWidth) / 2;
    const panelY = (this.state.virtualGameHeight - panelHeight) / 2;

    const withinPanel = point.x >= panelX && point.x <= panelX + panelWidth &&
                       point.y >= panelY && point.y <= panelY + panelHeight;

    if (withinPanel) {
      const buttonWidth = isMobileDevice ? Math.min(panelWidth * 0.85, 400) : 280;
      const buttonHeight = isMobileDevice ? 60 : 50;
      const buttonX = panelX + (panelWidth - buttonWidth) / 2;
      const buttonSpacing = isMobileDevice ? 75 : 65;
      const firstButtonY = isMobileDevice ? panelY + 100 : panelY + 90;

      const buttons = [
        { text: 'Start Game', y: firstButtonY, action: () => this.handleMenuAction('start') },
        { text: 'Restart', y: firstButtonY + buttonSpacing, action: () => this.handleMenuAction('restart') },
        { text: this.state.debugMode ? 'Debug Mode: ON' : 'Debug Mode: OFF', y: firstButtonY + (buttonSpacing * 2), action: () => this.handleMenuAction('debug') },
        { text: 'Start Fresh', y: firstButtonY + (buttonSpacing * 3), action: () => this.handleMenuAction('fresh') }
      ];

      for (const button of buttons) {
        if (point.x >= buttonX && point.x <= buttonX + buttonWidth &&
            point.y >= button.y && point.y <= button.y + buttonHeight) {
          console.log(`Menu button clicked: ${button.text}`);
          button.action();
          this.state.showMenuOverlay = false;
          return true;
        }
      }
    }

    return false;
  }

  private handleMenuAction(action: string): void {
    this.executeIfActive(() => {
      switch (action) {
        case 'start':
          if (this.state.gameOver) {
            // If game is over, restart instead
            console.log('Game is over, performing restart instead of start');
            this.handleMenuAction('restart');
          } else if (this.state.levelComplete) {
            // If level is complete, advance to next level
            this.advanceToNextLevel();
          } else {
            // Otherwise start/continue game
            this.emit({
              type: 'game:started',
              timestamp: Date.now()
            });
          }
          break;
        case 'restart':
          // Clear save data and restart
          localStorage.removeItem('par-shape-2d-save');
          
          // Clear any active game over countdown and holding holes full state
          if (this.state.gameOverCountdown) {
            clearInterval(this.state.gameOverCountdown);
            this.state.gameOverCountdown = null;
            console.log('🔄 Cleared game over countdown during restart');
          }
          this.state.holdingHolesFull = false;
          
          // Reset all game systems
          if (this.state.systemCoordinator) {
            const gameState = this.state.systemCoordinator.getSystem('GameState') as import('./GameState').GameState;
            const screwManager = this.state.systemCoordinator.getSystem('ScrewManager') as import('../systems/ScrewManager').ScrewManager;
            const layerManager = this.state.systemCoordinator.getSystem('LayerManager') as import('../systems/LayerManager').LayerManager;
            
            // Clear all screws from ScrewManager
            if (screwManager) {
              // Clear all screws and constraints
              screwManager.clearAllScrews();
            }
            
            // Clear all layers
            if (layerManager) {
              layerManager.clearAllLayers();
            }
            
            // Reset GameState to clear containers and holding holes
            if (gameState) {
              gameState.reset();
              // Start the game after reset
              setTimeout(() => {
                gameState.startGame();
              }, 100);
            }
          }
          break;
        case 'debug':
          console.log(`Debug button clicked. Current debugMode: ${this.state.debugMode}, will toggle to: ${!this.state.debugMode}`);
          // Toggle debug mode immediately in our state
          this.state.debugMode = !this.state.debugMode;
          // Then emit the event for other systems
          this.emit({
            type: 'debug:mode:toggled',
            timestamp: Date.now(),
            enabled: this.state.debugMode,
            source: 'GameManager'
          });
          console.log(`Debug mode is now: ${this.state.debugMode}`);
          break;
        case 'fresh':
          // Start completely fresh game
          localStorage.removeItem('par-shape-2d-save');
          this.emit({
            type: 'level:started',
            timestamp: Date.now(),
            level: 1
          });
          this.emit({
            type: 'game:started',
            timestamp: Date.now()
          });
          break;
      }
    });
  }

  private checkLevelCompleteClick(point: Vector2): boolean {
    void point; // Currently accepting any click on level complete screen
    // Check if click is anywhere on the level complete screen for now
    // You could make this more specific to just the button area if needed
    return true;
  }

  private advanceToNextLevel(): void {
    this.executeIfActive(() => {
      // Clear level complete state
      this.state.levelComplete = false;
      
      // Directly call nextLevel on GameState through event system
      // We'll use a dedicated event for this
      eventBus.emit({
        type: 'next_level:requested',
        timestamp: Date.now(),
        source: 'GameManager'
      });
    });
  }

  // Canvas Scaling and Transformation
  private updateCanvasScaling(): void {
    if (!this.state.canvas || !this.state.ctx) return;

    // Since virtual dimensions always match canvas dimensions, use 1:1 scaling with no offset
    const canvasWidth = this.state.canvas.width;
    const canvasHeight = this.state.canvas.height;

    // No scaling needed - virtual dimensions match canvas dimensions
    this.state.canvasScale = 1;
    this.state.canvasOffset.x = 0;
    this.state.canvasOffset.y = 0;

    // Apply identity transformation
    this.state.ctx.setTransform(1, 0, 0, 1, 0, 0);

    if (DEBUG_CONFIG.enableVerboseLogging) {
      console.log(`Canvas scaling updated: canvas=${canvasWidth}x${canvasHeight}, virtual=${this.state.virtualGameWidth}x${this.state.virtualGameHeight}, scale=1:1, no offset`);
    }
  }

  private transformCanvasCoordinates(clientX: number, clientY: number): Vector2 {
    if (!this.state.canvas) return { x: clientX, y: clientY };
    
    // Account for the difference between CSS display size and canvas internal size
    const rect = this.state.canvas.getBoundingClientRect();
    const canvasDisplayWidth = rect.width;
    const canvasDisplayHeight = rect.height;
    const canvasInternalWidth = this.state.canvas.width;
    const canvasInternalHeight = this.state.canvas.height;
    
    // Scale client coordinates to canvas internal coordinates
    // Since virtual dimensions match canvas internal dimensions, this is the final result
    const virtualX = (clientX / canvasDisplayWidth) * canvasInternalWidth;
    const virtualY = (clientY / canvasDisplayHeight) * canvasInternalHeight;

    return { x: virtualX, y: virtualY };
  }

  private emitBoundsChanged(): void {
    if (!this.state.canvas) return;

    this.emit({
      type: 'bounds:changed',
      timestamp: Date.now(),
      width: this.state.virtualGameWidth,
      height: this.state.virtualGameHeight,
      scale: this.state.canvasScale
    });
  }

  // Game Loop Methods - Override BaseSystem.update
  public update(deltaTime: number): void {
    this.executeIfActive(() => {
      if (!this.state.gameStarted || this.state.gameOver) {
        if (Date.now() % 2000 < 50) { // Log every 2 seconds
          console.log(`🎮 GameManager: NOT updating - gameStarted: ${this.state.gameStarted}, gameOver: ${this.state.gameOver}`);
        }
        return;
      }

      // Call SystemCoordinator's update method to drive physics and other systems
      if (this.state.systemCoordinator) {
        this.state.systemCoordinator.update(deltaTime);
      } else {
        console.log('⚠️ GameManager: SystemCoordinator not available');
      }
    });
  }

  // BaseSystem render method - override required
  public render(context: CanvasRenderingContext2D): void {
    void context; // We use our own context from state
    // GameManagerEventDriven doesn't use the BaseSystem render pattern
    // It renders through the GameLoop instead
  }

  // GameLoop render method
  private renderFrame(): void {
    this.executeIfActive(() => {
      if (!this.state.ctx || !this.state.canvas) return;

      // Save the current transform
      this.state.ctx.save();

      // Reset transform for clearing
      this.state.ctx.setTransform(1, 0, 0, 1, 0, 0);

      // Clear canvas
      this.state.ctx.clearRect(0, 0, this.state.canvas.width, this.state.canvas.height);

      // Set background
      this.state.ctx.fillStyle = '#2C3E50';
      this.state.ctx.fillRect(0, 0, this.state.canvas.width, this.state.canvas.height);

      // Restore the transform
      this.state.ctx.restore();

      // Reapply scaling for rendering game content
      this.updateCanvasScaling();

      if (this.state.gameOver) {
        this.renderGameOver();
        return;
      }

      if (!this.state.gameStarted) {
        this.renderStartScreen();
        return;
      }

      if (this.state.levelComplete) {
        this.renderLevelComplete();
        return;
      }

      // Render game elements
      this.renderGame();

      // Render debug info if enabled
      if (this.state.debugMode) {
        this.renderDebugInfo();
      }

      // Render pulsing red border if holding holes are full
      if (this.state.holdingHolesFull) {
        this.renderPulsingRedBorder();
      }

      // Render menu overlay on top of everything
      if (this.state.showMenuOverlay) {
        this.renderMenuOverlay();
      }
    });
  }

  // Simplified Rendering Methods
  private renderStartScreen(): void {
    if (!this.state.ctx) return;

    this.state.ctx.fillStyle = '#FFFFFF';
    this.state.ctx.font = '32px Arial';
    this.state.ctx.textAlign = 'center';
    this.state.ctx.fillText('PAR Shape 2D', this.state.virtualGameWidth / 2, this.state.virtualGameHeight / 2 - 50);
    this.state.ctx.font = '18px Arial';
    this.state.ctx.fillText('Click the menu button to start', this.state.virtualGameWidth / 2, this.state.virtualGameHeight / 2 + 50);
  }

  private renderGameOver(): void {
    if (!this.state.ctx) return;

    this.state.ctx.fillStyle = '#FF0000';
    this.state.ctx.font = '48px Arial';
    this.state.ctx.textAlign = 'center';
    this.state.ctx.fillText('Game Over', this.state.virtualGameWidth / 2, this.state.virtualGameHeight / 2 - 50);
    this.state.ctx.font = '24px Arial';
    this.state.ctx.fillText(`Final Score: ${this.state.totalScore}`, this.state.virtualGameWidth / 2, this.state.virtualGameHeight / 2 + 50);
  }

  private renderLevelComplete(): void {
    if (!this.state.ctx) return;

    // Draw semi-transparent overlay
    this.state.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.state.ctx.fillRect(0, 0, this.state.virtualGameWidth, this.state.virtualGameHeight);

    // Draw level complete text
    this.state.ctx.fillStyle = '#00FF00';
    this.state.ctx.font = '48px Arial';
    this.state.ctx.textAlign = 'center';
    this.state.ctx.fillText('Level Complete!', this.state.virtualGameWidth / 2, this.state.virtualGameHeight / 2 - 100);
    
    // Draw score
    this.state.ctx.font = '24px Arial';
    this.state.ctx.fillStyle = '#FFFFFF';
    this.state.ctx.fillText(`Level ${this.state.currentLevel} Score: ${this.state.levelScore}`, this.state.virtualGameWidth / 2, this.state.virtualGameHeight / 2 - 50);
    
    // Draw next level button
    const buttonWidth = 200;
    const buttonHeight = 60;
    const buttonX = (this.state.virtualGameWidth - buttonWidth) / 2;
    const buttonY = this.state.virtualGameHeight / 2 + 20;
    
    this.state.ctx.fillStyle = '#4CAF50';
    this.state.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
    
    this.state.ctx.fillStyle = '#FFFFFF';
    this.state.ctx.font = '24px Arial';
    this.state.ctx.textAlign = 'center';
    this.state.ctx.fillText('Next Level', this.state.virtualGameWidth / 2, buttonY + 38);
    
    // Draw click instruction
    this.state.ctx.font = '18px Arial';
    this.state.ctx.fillStyle = '#CCCCCC';
    this.state.ctx.fillText('Click to continue', this.state.virtualGameWidth / 2, buttonY + 100);
  }

  private renderGame(): void {
    if (!this.state.ctx) return;

    // Clear the canvas
    this.state.ctx.clearRect(0, 0, this.state.virtualGameWidth, this.state.virtualGameHeight);

    // Get current game data by requesting it from other systems
    this.requestCurrentGameData();

    // Render background areas
    this.renderBackground();
    
    // Render all game elements
    this.renderContainers();
    this.renderHoldingHoles();
    this.renderShapesAndScrews(); // Combined rendering with proper layering
    
    // Render UI elements on top
    this.renderHUD();
    this.renderMenuButton();
  }

  private renderHUD(): void {
    if (!this.state.ctx) return;

    // Calculate level progress percentage
    const totalLayersInLevel = getTotalLayersForLevel(this.state.currentLevel);
    const avgShapesPerLayer = (GAME_CONFIG.shapes.minPerLayer + GAME_CONFIG.shapes.maxPerLayer) / 2; // 4.5
    const totalShapesEstimate = totalLayersInLevel * avgShapesPerLayer;
    const progressPercent = Math.min(100, Math.floor((this.state.screwsRemovedThisLevel / totalShapesEstimate) * 100));

    // Render score and level info
    this.state.ctx.fillStyle = '#FFFFFF';
    this.state.ctx.font = '20px Arial';
    this.state.ctx.textAlign = 'left';
    this.state.ctx.fillText(`Level: ${this.state.currentLevel} (${progressPercent}%)`, 20, 30);
    this.state.ctx.fillText(`Level Score: ${this.state.levelScore}`, 20, 60);
    this.state.ctx.fillText(`Grand Total: ${this.state.totalScore}`, 20, 90);
  }

  private renderMenuButton(): void {
    if (!this.state.ctx) return;

    const buttonSize = 35;
    const margin = 15;
    const x = this.state.virtualGameWidth - buttonSize - margin;
    const y = margin;

    // Draw menu button
    this.state.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.state.ctx.fillRect(x, y, buttonSize, buttonSize);
    this.state.ctx.strokeStyle = '#000000';
    this.state.ctx.lineWidth = 2;
    this.state.ctx.strokeRect(x, y, buttonSize, buttonSize);

    // Draw hamburger menu icon
    this.state.ctx.fillStyle = '#000000';
    this.state.ctx.fillRect(x + 8, y + 10, buttonSize - 16, 3);
    this.state.ctx.fillRect(x + 8, y + 16, buttonSize - 16, 3);
    this.state.ctx.fillRect(x + 8, y + 22, buttonSize - 16, 3);
  }

  private renderMenuOverlay(): void {
    if (!this.state.ctx) return;

    const isMobileDevice = DeviceDetection.isMobileDevice();
    const panelWidth = isMobileDevice ? Math.min(this.state.virtualGameWidth * 0.85, 500) : 400;
    const panelHeight = isMobileDevice ? Math.min(this.state.virtualGameHeight * 0.7, 600) : 450;
    const panelX = (this.state.virtualGameWidth - panelWidth) / 2;
    const panelY = (this.state.virtualGameHeight - panelHeight) / 2;

    // Semi-transparent background
    this.state.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.state.ctx.fillRect(0, 0, this.state.virtualGameWidth, this.state.virtualGameHeight);

    // Menu panel
    this.state.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    this.state.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    this.state.ctx.strokeStyle = '#000000';
    this.state.ctx.lineWidth = 2;
    this.state.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

    // Title
    this.state.ctx.fillStyle = '#000000';
    this.state.ctx.font = isMobileDevice ? '28px Arial' : '24px Arial';
    this.state.ctx.textAlign = 'center';
    this.state.ctx.fillText('Game Menu', panelX + panelWidth / 2, panelY + 50);

    // Buttons
    const buttonWidth = isMobileDevice ? Math.min(panelWidth * 0.85, 400) : 280;
    const buttonHeight = isMobileDevice ? 60 : 50;
    const buttonX = panelX + (panelWidth - buttonWidth) / 2;
    const buttonSpacing = isMobileDevice ? 75 : 65;
    const firstButtonY = isMobileDevice ? panelY + 100 : panelY + 90;

    const buttons = [
      'Start Game',
      'Restart',
      this.state.debugMode ? 'Debug Mode: ON' : 'Debug Mode: OFF',
      'Start Fresh'
    ];
    
    buttons.forEach((text, index) => {
      if (!this.state.ctx) return;
      
      const buttonY = firstButtonY + (index * buttonSpacing);
      
      // Button background - highlight debug button when active
      const isDebugButton = index === 2;
      if (isDebugButton && this.state.debugMode) {
        this.state.ctx.fillStyle = 'rgba(50, 205, 50, 0.8)'; // Green when debug is on
      } else {
        this.state.ctx.fillStyle = 'rgba(100, 149, 237, 0.8)';
      }
      this.state.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
      this.state.ctx.strokeStyle = '#000000';
      this.state.ctx.lineWidth = 1;
      this.state.ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
      
      // Button text
      this.state.ctx.fillStyle = '#FFFFFF';
      this.state.ctx.font = isMobileDevice ? '20px Arial' : '18px Arial';
      this.state.ctx.textAlign = 'center';
      this.state.ctx.fillText(text, buttonX + buttonWidth / 2, buttonY + buttonHeight / 2 + 6);
    });
  }

  private renderDebugInfo(): void {
    if (!this.state.ctx) return;

    this.state.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.state.ctx.fillRect(10, this.state.virtualGameHeight - 135, 300, 125);

    this.state.ctx.fillStyle = '#FFFFFF';
    this.state.ctx.font = '14px Arial';
    this.state.ctx.textAlign = 'left';
    
    // Get physics stats from SystemCoordinator
    let physicsStats = '';
    if (this.state.systemCoordinator) {
      const physicsWorld = this.state.systemCoordinator.getSystem('PhysicsWorld') as import('../physics/PhysicsWorld').PhysicsWorld;
      if (physicsWorld && typeof physicsWorld.getStats === 'function') {
        const stats = physicsWorld.getStats();
        physicsStats = `Bodies: ${stats.bodyCount}, Constraints: ${stats.constraintCount}, Paused: ${stats.isPaused}`;
      }
    }

    const debugInfo = [
      `Canvas: ${this.state.canvas?.width}x${this.state.canvas?.height}`,
      `Virtual: ${this.state.virtualGameWidth}x${this.state.virtualGameHeight}`,
      `Scale: ${this.state.canvasScale.toFixed(3)}`,
      `Offset: (${this.state.canvasOffset.x.toFixed(1)}, ${this.state.canvasOffset.y.toFixed(1)})`,
      `Game State: Started=${this.state.gameStarted}, Over=${this.state.gameOver}`,
      `Level: ${this.state.currentLevel}, Score: ${this.state.levelScore}/${this.state.totalScore}`,
      physicsStats || 'Physics: N/A',
      `Debug Keys: D(debug) R(restart) G(game over) S(save) I(inspect) C(clear)`
    ];

    debugInfo.forEach((info, index) => {
      if (this.state.ctx) {
        this.state.ctx.fillText(info, 15, this.state.virtualGameHeight - 120 + (index * 15));
      }
    });
  }

  // Getters for debugging
  public getState(): GameManagerState {
    return { ...this.state };
  }

  public getDebugMode(): boolean {
    return this.state.debugMode;
  }

  private renderBackground(): void {
    if (!this.state.ctx) return;

    const ctx = this.state.ctx;
    
    // Define the shape area using layout constants
    const shapeAreaY = LAYOUT_CONSTANTS.shapeArea.startY;
    const shapeAreaHeight = this.state.virtualGameHeight - shapeAreaY;
    
    // Render darker background for shape area
    ctx.fillStyle = LAYOUT_CONSTANTS.shapeArea.backgroundColor;
    ctx.fillRect(0, shapeAreaY, this.state.virtualGameWidth, shapeAreaHeight);
    
    // Add subtle border at the top of shape area
    ctx.strokeStyle = LAYOUT_CONSTANTS.shapeArea.borderColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, shapeAreaY);
    ctx.lineTo(this.state.virtualGameWidth, shapeAreaY);
    ctx.stroke();
  }

  // New rendering methods for game objects
  private requestCurrentGameData(): void {
    // Extract screws from visible layers
    this.state.allScrews = [];
    this.state.visibleLayers.forEach(layer => {
      const shapes = layer.getAllShapes();
      shapes.forEach(shape => {
        this.state.allScrews.push(...shape.screws);
      });
    });

    // Containers and holding holes are now provided by GameState via events
    // No need to create mock data here
  }

  private renderContainers(): void {
    if (!this.state.ctx || this.state.containers.length === 0) return;

    const ctx = this.state.ctx;
    const containerWidth = UI_CONSTANTS.containers.width;
    const containerHeight = UI_CONSTANTS.containers.height;
    const spacing = UI_CONSTANTS.containers.spacing;
    const startY = UI_CONSTANTS.containers.startY;
    const borderRadius = UI_CONSTANTS.containers.borderRadius;
    
    // Center the containers horizontally
    const totalWidth = (this.state.containers.length * containerWidth) + ((this.state.containers.length - 1) * spacing);
    const startX = (this.state.virtualGameWidth - totalWidth) / 2;
    if (DEBUG_CONFIG.logContainerRendering) {
      console.log(`🎨 GameManager: virtualGameWidth=${this.state.virtualGameWidth}, totalWidth=${totalWidth}, startX=${startX}`);
    }

    this.state.containers.forEach((container, index) => {
      const x = startX + (index * (containerWidth + spacing));
      if (DEBUG_CONFIG.logContainerRendering && index === 0) {
        console.log(`🎨 GameManager: Rendering container ${index} at leftX=${x}, storedCenterX=${container.position.x}, containerWidth=${containerWidth}`);
      }
      
      // Apply container fade opacity (default to 1.0 if not set)
      ctx.save();
      ctx.globalAlpha = container.fadeOpacity !== undefined ? container.fadeOpacity : 1.0;
      
      // Draw container background (white) with rounded corners
      ctx.fillStyle = '#FFFFFF';
      this.drawRoundedRect(ctx, x, startY, containerWidth, containerHeight, borderRadius);
      ctx.fill();
      
      // Draw container border (matching container color) with rounded corners
      ctx.strokeStyle = SCREW_COLORS[container.color];
      ctx.lineWidth = 4;
      this.drawRoundedRect(ctx, x, startY, containerWidth, containerHeight, borderRadius);
      ctx.stroke();
      
      // Draw holes in the container and render any screws in them
      ctx.fillStyle = '#000';
      const holeRadius = UI_CONSTANTS.containers.hole.radius;
      const holeCount = UI_CONSTANTS.containers.hole.count;
      // Calculate hole spacing based on container width and number of holes
      const holeSpacing = containerWidth / (holeCount + 1); // +1 for proper spacing
      for (let i = 0; i < holeCount; i++) {
        const holeX = x + holeSpacing + (i * holeSpacing);
        const holeY = startY + containerHeight / 2;
        if (DEBUG_CONFIG.logContainerRendering && index === 0) { // Log all holes for first container to see the pattern
          console.log(`🎨 Rendering container ${index} hole ${i}: containerX=${x}, holeSpacing=${holeSpacing}, final holeX=${holeX}, holeY=${holeY}`);
        }
        
        // Draw hole
        ctx.beginPath();
        ctx.arc(holeX, holeY, holeRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // If this hole has a screw, render it
        if (container.holes && container.holes[i]) {
          const screwId = container.holes[i];
          if (screwId && this.state.systemCoordinator) {
            const screwManager = this.state.systemCoordinator.getSystem<ScrewManager>('ScrewManager');
            if (screwManager) {
              const screw = screwManager.getScrew(screwId);
              if (screw) {
                if (DEBUG_CONFIG.logContainerRendering && index === 0 && i === 0) { // Log first screw for debugging
                  if (DEBUG_CONFIG.logScrewDebug) {
                    console.log(`🎨 Rendering screw ${screwId} in container ${index} hole ${i}`);
                  }
                }
                const renderContext: RenderContext = { 
                  ctx: this.state.ctx!,
                  canvas: this.state.canvas!,
                  debugMode: this.state.debugMode
                };
                // Set screw position to hole position for rendering
                const originalPosition = { ...screw.position };
                screw.position.x = holeX;
                screw.position.y = holeY;
                ScrewRenderer.renderScrew(screw, renderContext, true, 0.75); // forceRender=true, scale=0.75 for container screws
                // Restore original position
                screw.position.x = originalPosition.x;
                screw.position.y = originalPosition.y;
              } else {
                console.warn(`⚠️ Screw ${screwId} not found in ScrewManager state for container ${index} hole ${i}`);
              }
            }
          }
        }
      }
      
      // Restore alpha for next container
      ctx.restore();
    });
  }

  private drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  private renderHoldingHoles(): void {
    if (!this.state.ctx || this.state.holdingHoles.length === 0) return;

    const ctx = this.state.ctx;
    const holeRadius = UI_CONSTANTS.holdingHoles.radius;
    const spacing = UI_CONSTANTS.holdingHoles.spacing;
    const startY = UI_CONSTANTS.holdingHoles.startY;
    
    // Center the holding holes horizontally
    const totalWidth = (this.state.holdingHoles.length * holeRadius * 2) + ((this.state.holdingHoles.length - 1) * spacing);
    const startX = (this.state.virtualGameWidth - totalWidth) / 2;

    this.state.holdingHoles.forEach((hole, index) => {
      const x = startX + (index * (holeRadius * 2 + spacing)) + holeRadius;
      
      // Draw light grey circle around holding hole
      ctx.fillStyle = '#CCCCCC';
      ctx.beginPath();
      ctx.arc(x, startY, holeRadius + 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw hole (same style as container holes)
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(x, startY, holeRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // If hole has a screw, render it
      if (hole.screwId && this.state.systemCoordinator) {
        const screwManager = this.state.systemCoordinator.getSystem<ScrewManager>('ScrewManager');
        if (screwManager) {
          const screw = screwManager.getScrew(hole.screwId);
          if (screw) {
            const renderContext: RenderContext = { 
              ctx: this.state.ctx!,
              canvas: this.state.canvas!,
              debugMode: this.state.debugMode
            };
            // Set screw position to hole position for rendering
            const originalPosition = { ...screw.position };
            screw.position.x = x;
            screw.position.y = startY;
            ScrewRenderer.renderScrew(screw, renderContext, true, 0.75); // forceRender=true, scale=0.75 for holding hole screws
            // Restore original position
            screw.position.x = originalPosition.x;
            screw.position.y = originalPosition.y;
          } else {
            console.warn(`⚠️ Screw ${hole.screwId} not found in ScrewManager state for holding hole ${index}`);
          }
        }
      }
    });
  }

  private renderShapesAndScrews(): void {
    if (!this.state.ctx || this.state.visibleLayers.length === 0) return;

    const renderContext: RenderContext = { 
      ctx: this.state.ctx,
      canvas: this.state.canvas!,
      debugMode: this.state.debugMode
    };
    
    // Render shapes and their screws from back layers to front layers
    for (let i = this.state.visibleLayers.length - 1; i >= 0; i--) {
      const layer = this.state.visibleLayers[i];
      const shapes = layer.getAllShapes();
      
      // Apply layer fade-in opacity
      this.state.ctx.save();
      this.state.ctx.globalAlpha = layer.getFadeOpacity();
      
      shapes.forEach(shape => {
        // First render the shape
        ShapeRenderer.renderShape(shape, renderContext);
        
        // Then render screws that belong to this shape (on top of the shape)
        shape.screws.forEach(screw => {
          if (!screw.isCollected) {
            ScrewRenderer.renderScrew(screw, renderContext);
          }
        });
      });
      
      // Restore alpha for next layer
      this.state.ctx.restore();
    }
    
    // Render any transferring screws (they are no longer attached to shapes)
    if (this.state.systemCoordinator) {
      const screwManager = this.state.systemCoordinator.getSystem<ScrewManager>('ScrewManager');
      if (screwManager && screwManager.getAnimatingScrews) {
        const animatingScrews = screwManager.getAnimatingScrews();
        animatingScrews.forEach((screw: Screw) => {
          // Only render screws that are being transferred (not being collected)
          if (screw.isBeingTransferred) {
            ScrewRenderer.renderScrew(screw, renderContext);
          }
        });
      }
    }
  }

  private renderPulsingRedBorder(): void {
    if (!this.state.ctx) return;

    const ctx = this.state.ctx;
    
    // Calculate pulsing alpha based on time
    const time = Date.now() / 1000; // Convert to seconds
    const pulseSpeed = 1; // Pulses per second (slower pulse)
    const alpha = (Math.sin(time * pulseSpeed * Math.PI * 2) + 1) * 0.3 + 0.4; // Alpha between 0.4 and 1.0
    
    // Draw red border around entire canvas
    const borderWidth = 8;
    ctx.strokeStyle = `rgba(255, 0, 0, ${alpha})`;
    ctx.lineWidth = borderWidth;
    
    // Draw border rectangle (inside canvas bounds)
    const half = borderWidth / 2;
    ctx.strokeRect(half, half, this.state.virtualGameWidth - borderWidth, this.state.virtualGameHeight - borderWidth);
  }

  /**
   * Start level pre-computation for perfect balance
   */
  private async startLevelPrecomputation(level: number): Promise<void> {
    // Create pre-computation configuration
    const config: PrecomputationConfig = {
      targetLayers: getTotalLayersForLevel(level),
      balanceRequirements: {
        strictBalance: level > 3, // Allow some tolerance for early levels
        tolerance: level <= 3 ? 2 : 0 // 2 screws tolerance for levels 1-3
      },
      performance: {
        maxComputationTime: 5000, // 5 seconds max
        enablePhysicsPreview: false
      },
      debug: {
        logProgress: DEBUG_CONFIG.enableVerboseLogging,
        validateMath: true,
        saveComputationPlan: DEBUG_CONFIG.enableVerboseLogging
      }
    };

    // Emit event to trigger pre-computation
    // This will be handled by the LevelPrecomputer system
    this.emit({
      type: 'level:precomputation:requested',
      timestamp: Date.now(),
      level,
      config
    });

    console.log(`[GameManager] Level ${level} pre-computation requested`);
  }

  protected onDestroy(): void {
    this.state.gameLoop.stop();
    
    // Clear countdown timer to prevent memory leaks
    if (this.state.gameOverCountdown) {
      clearInterval(this.state.gameOverCountdown);
      this.state.gameOverCountdown = null;
    }
    
    // Remove event listeners
    if (this.state.canvas) {
      this.state.canvas.removeEventListener('click', this.handleClick.bind(this));
      this.state.canvas.removeEventListener('touchstart', this.handleTouchStart.bind(this));
      this.state.canvas.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    }
    
    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
  }
}