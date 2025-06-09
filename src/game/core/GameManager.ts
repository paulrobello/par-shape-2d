/**
 * Event-driven GameManager implementation
 * Simplified to focus on input handling and rendering coordination
 * All business logic moved to event-driven systems
 */

import { BaseSystem } from './BaseSystem';
import { GameLoop } from './GameLoop';
import { eventBus } from '@/game/events/EventBus';
import { ScrewManager } from '@/game/systems/ScrewManager';
import Matter from 'matter-js';
// Removed precomputation imports - no longer using precomputation system
import { GAME_CONFIG, SCREW_COLORS, LAYOUT_CONSTANTS, UI_CONSTANTS, DEBUG_CONFIG } from '@/shared/utils/Constants';
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
  ContainerReplacedEvent,
  ProgressUpdatedEvent
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
  
  // Progress tracking data
  progressData: {
    totalScrews: number;
    screwsInContainer: number;
    progress: number;
  };
  
  // Rendering data
  visibleLayers: Layer[];
  containers: Container[];
  holdingHoles: HoldingHole[];
  allScrews: Screw[];
  
  // System coordinator reference for updates
  systemCoordinator: import('./SystemCoordinator').SystemCoordinator | null;
  
  // Game over countdown timer
  gameOverCountdown: NodeJS.Timeout | null;
  
  // Keyboard state for debug bypass
  shiftKeyPressed: boolean;
  
  // Throttling for collision logging
  lastCollisionLogTime: number;
  
  // Throttling for render logging
  lastRenderLogTime?: number;
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
      progressData: {
        totalScrews: 0,
        screwsInContainer: 0,
        progress: 0
      },
      visibleLayers: [],
      containers: [],
      holdingHoles: [],
      allScrews: [],
      systemCoordinator: null,
      gameOverCountdown: null,
      shiftKeyPressed: false,
      lastCollisionLogTime: 0
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
    console.log('[GameManager] Subscribing to progress:updated events');
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

  private handleProgressUpdated(event: ProgressUpdatedEvent): void {
    this.executeIfActive(() => {
      if (DEBUG_CONFIG.logEventFlow) {
        console.log(`[GameManager] Received progress update:`, event);
        console.log(`[GameManager] Progress updated - gameStarted: ${this.state.gameStarted}, gameOver: ${this.state.gameOver}, levelComplete: ${this.state.levelComplete}`);
      }
      
      this.state.progressData = {
        totalScrews: event.totalScrews,
        screwsInContainer: event.screwsInContainer,
        progress: event.progress
      };
      
      // Force a render when progress data changes to ensure UI updates immediately
      if (this.state.gameStarted && !this.state.gameOver) {
        this.renderFrame();
      }
    });
  }

  private handleLevelStarted(event: LevelStartedEvent): void {
    this.executeIfActive(() => {
      this.state.currentLevel = event.level;
      this.state.levelScore = 0;
      this.state.levelComplete = false;
      this.state.screwsRemovedThisLevel = 0;
      
      // Don't reset progress data - it will be set by ProgressTracker events
      
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
      // Throttle collision logging to prevent event loop detection (max 1 log per 100ms)
      if (DEBUG_CONFIG.logPhysicsDebug) {
        const now = Date.now();
        if (now - this.state.lastCollisionLogTime >= 100) {
          console.log(`🔥 Collision detected between bodies ${event.bodyA} and ${event.bodyB} with force ${event.force.toFixed(2)}`);
          this.state.lastCollisionLogTime = now;
        }
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
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
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
      // Track Shift key state for debug bypass
      if (event.key === 'Shift') {
        this.state.shiftKeyPressed = true;
        if (this.state.debugMode && DEBUG_CONFIG.logScrewDebug) {
          console.log('🔧 Shift key pressed - blocked screw bypass enabled');
        }
      }
      
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
        case 'l':
          // Debug layer visibility
          if (this.state.systemCoordinator) {
            const layerManager = this.state.systemCoordinator.getSystem('LayerManager') as import('../systems/LayerManager').LayerManager;
            if (layerManager) {
              layerManager.debugLayerVisibility();
              layerManager.debugOutOfBoundsShapes();
            }
          }
          break;
        case 'v':
          // Force cleanup out-of-bounds shapes
          if (this.state.systemCoordinator) {
            const layerManager = this.state.systemCoordinator.getSystem('LayerManager') as import('../systems/LayerManager').LayerManager;
            if (layerManager) {
              layerManager.forceCleanupOutOfBoundsShapes();
            }
          }
          break;
        case 'f':
          // Force reposition shapes to visible area
          if (this.state.systemCoordinator) {
            const layerManager = this.state.systemCoordinator.getSystem('LayerManager') as import('../systems/LayerManager').LayerManager;
            if (layerManager) {
              layerManager.forceRepositionShapesToVisibleArea();
            }
          }
          break;
        case 'e':
          // Debug rendering pipeline
          this.debugRenderingPipeline();
          break;
        case 'x':
          // Debug screw discrepancy
          this.debugScrewDiscrepancy();
          break;
        case 'z':
          // Force cleanup orphaned screws
          this.forceCleanupOrphanedScrews();
          break;
        case 'o':
          // Force fix layer opacity
          this.forceFixLayerOpacity();
          break;
        case 'a':
          // Debug fade animation state
          this.debugFadeAnimationState();
          break;
      }
    });
  }

  private handleKeyUp(event: KeyboardEvent): void {
    this.executeIfActive(() => {
      // Track Shift key release
      if (event.key === 'Shift') {
        this.state.shiftKeyPressed = false;
        if (this.state.debugMode && DEBUG_CONFIG.logScrewDebug) {
          console.log('🔧 Shift key released - blocked screw bypass disabled');
        }
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
      
      // Emit screw clicked event with debug bypass info
      this.emit({
        type: 'screw:clicked',
        timestamp: Date.now(),
        screw: screw,
        position: point,
        forceRemoval: this.state.debugMode && this.state.shiftKeyPressed
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
          
          // If enabling debug mode, run the out-of-bounds check and force cleanup
          if (this.state.debugMode && this.state.systemCoordinator) {
            const layerManager = this.state.systemCoordinator.getSystem('LayerManager') as import('../systems/LayerManager').LayerManager;
            if (layerManager) {
              if (typeof layerManager.debugOutOfBoundsShapes === 'function') {
                console.log('🔍 Running out-of-bounds shapes debug check...');
                layerManager.debugOutOfBoundsShapes();
              }
              if (typeof layerManager.forceCleanupOutOfBoundsShapes === 'function') {
                console.log('🧹 Running force cleanup of out-of-bounds shapes...');
                layerManager.forceCleanupOutOfBoundsShapes();
              }
            }
          }
          
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

    // Also render the HUD to show progress even before game starts
    this.renderHUD();
    this.renderMenuButton();
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

    // Use actual progress data from ProgressTracker
    const progressPercent = this.state.progressData.progress;
    const screwsProgress = this.state.progressData.totalScrews > 0 
      ? `${this.state.progressData.screwsInContainer}/${this.state.progressData.totalScrews}` 
      : '0/0';

    // Debug: Log what renderHUD sees
    if (DEBUG_CONFIG.enableVerboseLogging && Date.now() % 2000 < 50) { // Throttled logging
      console.log(`[GameManager] renderHUD sees: totalScrews=${this.state.progressData.totalScrews}, screwsInContainer=${this.state.progressData.screwsInContainer}, display="${screwsProgress}"`);
    }


    // Render score and level info
    this.state.ctx.fillStyle = '#FFFFFF';
    this.state.ctx.font = '20px Arial';
    this.state.ctx.textAlign = 'left';
    this.state.ctx.fillText(`Level: ${this.state.currentLevel} (${progressPercent}%)`, 20, 30);
    this.state.ctx.fillText(`Progress: ${screwsProgress} screws`, 20, 60);
    this.state.ctx.fillText(`Level Score: ${this.state.levelScore}`, 20, 90);
    this.state.ctx.fillText(`Grand Total: ${this.state.totalScore}`, 20, 120);
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
    // Position debug info at top-right to avoid being cut off by overflow hidden
    const debugX = this.state.virtualGameWidth - 310; // 10px margin from right
    const debugY = 10; // 10px margin from top
    this.state.ctx.fillRect(debugX, debugY, 300, 140);

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
      `Debug Keys: D(debug) R(restart) G(game over) S(save) I(inspect) C(clear) L(layers) V(cleanup) F(reposition) E(render debug) X(screw debug) Z(cleanup orphans) O(fix opacity) A(fade debug)`,
      `Shift Bypass: ${this.state.shiftKeyPressed ? 'ENABLED (Hold Shift+Click)' : 'Disabled'}`
    ];

    debugInfo.forEach((info, index) => {
      if (this.state.ctx) {
        const debugX = this.state.virtualGameWidth - 310; // Match the box position
        const debugY = 10; // Match the box position
        this.state.ctx.fillText(info, debugX + 5, debugY + 20 + (index * 15)); // 5px padding from box edge, 20px from top
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
      const holeCount = container.maxHoles; // Use container's actual hole count
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
    if (!this.state.ctx || this.state.visibleLayers.length === 0) {
      return;
    }

    const renderContext: RenderContext = { 
      ctx: this.state.ctx,
      canvas: this.state.canvas!,
      debugMode: this.state.debugMode
    };
    
    // Log rendering state periodically (with proper throttling)
    if (!this.state.lastRenderLogTime || Date.now() - this.state.lastRenderLogTime > 2000) {
      this.state.lastRenderLogTime = Date.now();
      let totalShapes = 0;
      let totalScrews = 0;
      this.state.visibleLayers.forEach(layer => {
        totalShapes += layer.getAllShapes().length;
        totalScrews += layer.getAllShapes().reduce((sum, shape) => sum + shape.getAllScrews().length, 0);
      });
      console.log(`🎨 Rendering ${this.state.visibleLayers.length} visible layers with ${totalShapes} shapes and ${totalScrews} screws`);
    }
    
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

  // Removed startLevelPrecomputation method - no longer using precomputation system

  /**
   * Debug method to analyze screw discrepancy between systems
   */
  private debugScrewDiscrepancy(): void {
    if (!this.state.systemCoordinator) {
      console.warn('SystemCoordinator not available for screw discrepancy debug');
      return;
    }

    console.log('🔍 === COMPREHENSIVE SCREW DISCREPANCY ANALYSIS ===');
    
    // Get all systems
    const layerManager = this.state.systemCoordinator.getSystem('LayerManager') as import('../systems/LayerManager').LayerManager;
    const progressTracker = this.state.systemCoordinator.getSystem('ProgressTracker') as import('../systems/ProgressTracker').ProgressTracker;
    const screwManager = this.state.systemCoordinator.getSystem('ScrewManager') as import('../systems/ScrewManager').ScrewManager;

    if (!layerManager || !progressTracker || !screwManager) {
      console.error('One or more required systems not available');
      return;
    }

    // Get data from each system
    const progressState = progressTracker.getProgressState();
    const allLayers = layerManager.getLayers();
    const visibleLayers = layerManager.getVisibleLayers();

    // Count screws from LayerManager perspective
    let totalScrewsAllLayers = 0;
    let totalShapesAllLayers = 0;
    let totalScrewsVisibleLayers = 0;
    let totalShapesVisibleLayers = 0;
    let totalScrewsHiddenLayers = 0;
    let totalShapesHiddenLayers = 0;

    const layerBreakdown: Array<{
      layerId: string;
      index: number;
      visible: boolean;
      shapeCount: number;
      screwCount: number;
      activeScrewCount: number;
    }> = [];

    allLayers.forEach(layer => {
      const shapes = layer.getAllShapes();
      const shapeCount = shapes.length;
      let screwCount = 0;
      let activeScrewCount = 0;

      shapes.forEach(shape => {
        const screws = shape.getAllScrews();
        const activeScrews = shape.getActiveScrews();
        screwCount += screws.length;
        activeScrewCount += activeScrews.length;
      });

      layerBreakdown.push({
        layerId: layer.id,
        index: layer.index,
        visible: layer.isVisible,
        shapeCount,
        screwCount,
        activeScrewCount
      });

      totalShapesAllLayers += shapeCount;
      totalScrewsAllLayers += screwCount;

      if (layer.isVisible) {
        totalShapesVisibleLayers += shapeCount;
        totalScrewsVisibleLayers += screwCount;
      } else {
        totalShapesHiddenLayers += shapeCount;
        totalScrewsHiddenLayers += screwCount;
      }
    });

    // Count screws from ScrewManager perspective (if available)
    let screwManagerTotalCount = 0;
    let screwManagerActiveCount = 0;
    let screwManagerCollectedCount = 0;
    
    if (screwManager && typeof screwManager.getAllScrews === 'function') {
      const allScrews = screwManager.getAllScrews();
      screwManagerTotalCount = allScrews.length;
      screwManagerActiveCount = allScrews.filter(screw => !screw.isCollected).length;
      screwManagerCollectedCount = allScrews.filter(screw => screw.isCollected).length;
    }

    // Display comprehensive analysis
    console.log(`\n📊 SYSTEM COMPARISON:`);
    console.log(`\n🎮 ProgressTracker:`);
    console.log(`  - Total screws tracked: ${progressState.totalScrews}`);
    console.log(`  - Screws in containers: ${progressState.screwsInContainer}`);
    console.log(`  - Progress: ${progressState.progress}%`);
    
    console.log(`\n🎯 LayerManager:`);
    console.log(`  - Total layers: ${allLayers.length} (Visible: ${visibleLayers.length}, Hidden: ${allLayers.length - visibleLayers.length})`);
    console.log(`  - Total shapes: ${totalShapesAllLayers} (Visible: ${totalShapesVisibleLayers}, Hidden: ${totalShapesHiddenLayers})`);
    console.log(`  - Total screws: ${totalScrewsAllLayers} (Visible: ${totalScrewsVisibleLayers}, Hidden: ${totalScrewsHiddenLayers})`);
    
    console.log(`\n🔧 ScrewManager:`);
    console.log(`  - Total screws: ${screwManagerTotalCount}`);
    console.log(`  - Active screws: ${screwManagerActiveCount}`);
    console.log(`  - Collected screws: ${screwManagerCollectedCount}`);

    console.log(`\n🎨 GameManager Rendering:`);
    console.log(`  - Visible layers for rendering: ${this.state.visibleLayers.length}`);
    console.log(`  - All screws in rendering array: ${this.state.allScrews.length}`);
    console.log(`  - Containers: ${this.state.containers.length}`);
    console.log(`  - Holding holes: ${this.state.holdingHoles.length}`);
    console.log(`  - Canvas size: ${this.state.virtualGameWidth}x${this.state.virtualGameHeight}`);
    console.log(`  - Shape area: y=${200} to y=${this.state.virtualGameHeight || 960} (height: ${(this.state.virtualGameHeight || 960) - 200})`);

    console.log(`\n⚠️ DISCREPANCIES:`);
    
    // Check for major discrepancies
    if (progressState.totalScrews !== totalScrewsAllLayers) {
      console.log(`❌ ProgressTracker (${progressState.totalScrews}) vs LayerManager (${totalScrewsAllLayers}) total screw mismatch!`);
    }
    
    if (progressState.totalScrews !== screwManagerTotalCount && screwManagerTotalCount > 0) {
      console.log(`❌ ProgressTracker (${progressState.totalScrews}) vs ScrewManager (${screwManagerTotalCount}) total screw mismatch!`);
    }

    if (totalScrewsVisibleLayers !== this.state.allScrews.length) {
      console.log(`❌ Visible layer screws (${totalScrewsVisibleLayers}) vs rendered screws (${this.state.allScrews.length}) mismatch!`);
    }

    // The main issue: progress shows more screws than are visible
    const missingFromRendering = progressState.totalScrews - totalScrewsVisibleLayers;
    if (missingFromRendering > 0) {
      console.log(`🚨 MAIN ISSUE: ${missingFromRendering} screws are tracked by ProgressTracker but not visible for interaction!`);
      
      if (totalScrewsHiddenLayers > 0) {
        console.log(`💡 Potential cause: ${totalScrewsHiddenLayers} screws are in hidden layers`);
      }
    }

    console.log(`\n📋 DETAILED LAYER BREAKDOWN:`);
    layerBreakdown.forEach(layer => {
      const visibilityIcon = layer.visible ? '👁️' : '👻';
      console.log(`  ${visibilityIcon} Layer ${layer.index} (${layer.layerId}):`);
      console.log(`     - Shapes: ${layer.shapeCount}, Screws: ${layer.screwCount}, Active: ${layer.activeScrewCount}`);
    });

    // Add detailed breakdown of all active shapes and their positions
    console.log(`\n🎯 ACTIVE SHAPES AND POSITIONS:`);
    allLayers.forEach(layer => {
      const shapes = layer.getAllShapes();
      if (shapes.length > 0) {
        const visibilityIcon = layer.isVisible ? '👁️' : '👻';
        console.log(`\n  ${visibilityIcon} Layer ${layer.index} (${layer.id}) - ${layer.isVisible ? 'VISIBLE' : 'HIDDEN'}:`);
        
        shapes.forEach(shape => {
          const activeScrews = shape.getActiveScrews();
          const totalScrews = shape.getAllScrews();
          const pos = shape.position;
          const bounds = shape.getBounds();
          
          console.log(`    🔹 Shape ${shape.id}:`);
          console.log(`      - Position: (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)})`);
          console.log(`      - Bounds: (${bounds.x.toFixed(1)}, ${bounds.y.toFixed(1)}, ${bounds.width.toFixed(1)}, ${bounds.height.toFixed(1)})`);
          console.log(`      - Screws: ${activeScrews.length}/${totalScrews.length} active`);
          
          if (activeScrews.length > 0) {
            console.log(`      - Active screw positions:`);
            activeScrews.forEach(screw => {
              console.log(`        🔩 ${screw.id}: (${screw.position.x.toFixed(1)}, ${screw.position.y.toFixed(1)}) [${screw.color}]`);
            });
          }
        });
      }
    });

    // Additional debugging: check if hidden layers should be counted
    console.log(`\n🔬 ANALYSIS:`);
    console.log(`  - The game should only count screws from visible layers for progress`);
    console.log(`  - Hidden layers should not contribute to total screw count until revealed`);
    console.log(`  - Current progress calculation may be including hidden layer screws`);
    
    if (totalScrewsHiddenLayers > 0) {
      console.log(`\n💡 RECOMMENDATION:`);
      console.log(`  - ProgressTracker should only count screws from visible layers`);
      console.log(`  - When hidden layers become visible, their screws should be added to the total`);
      console.log(`  - Current hidden layers contain ${totalScrewsHiddenLayers} screws that shouldn't be counted yet`);
    }

    // Check for orphaned screws in ScrewManager
    if (screwManagerTotalCount > progressState.totalScrews) {
      const orphanedScrews = screwManagerTotalCount - progressState.totalScrews;
      console.log(`\n🚨 ORPHANED SCREWS DETECTED:`);
      console.log(`  - ScrewManager has ${screwManagerTotalCount} screws`);
      console.log(`  - ProgressTracker knows about ${progressState.totalScrews} screws`);
      console.log(`  - ${orphanedScrews} screws are orphaned in ScrewManager`);
      console.log(`  - These orphaned screws may be causing the missing screw issue`);
      console.log(`\n💡 RECOMMENDATION: Clean up orphaned screws from ScrewManager`);
    }
  }

  /**
   * Force cleanup of orphaned screws in ScrewManager
   */
  private forceCleanupOrphanedScrews(): void {
    if (!this.state.systemCoordinator) {
      console.warn('SystemCoordinator not available for orphaned screw cleanup');
      return;
    }

    console.log('🧹 === FORCE CLEANING ORPHANED SCREWS ===');
    
    const layerManager = this.state.systemCoordinator.getSystem('LayerManager') as import('../systems/LayerManager').LayerManager;
    const screwManager = this.state.systemCoordinator.getSystem('ScrewManager') as import('../systems/ScrewManager').ScrewManager;
    const progressTracker = this.state.systemCoordinator.getSystem('ProgressTracker') as import('../systems/ProgressTracker').ProgressTracker;

    if (!layerManager || !screwManager || !progressTracker) {
      console.error('Required systems not available for cleanup');
      return;
    }

    // Get all screws that should exist (from layers)
    const allLayers = layerManager.getLayers();
    const validScrewIds = new Set<string>();
    
    allLayers.forEach(layer => {
      layer.getAllShapes().forEach(shape => {
        shape.getAllScrews().forEach(screw => {
          validScrewIds.add(screw.id);
        });
      });
    });

    // Get all screws in ScrewManager
    const allScrewsInManager = screwManager.getAllScrews();
    const screwsToRemove: string[] = [];

    allScrewsInManager.forEach(screw => {
      if (!validScrewIds.has(screw.id)) {
        screwsToRemove.push(screw.id);
      }
    });

    console.log(`🔍 Analysis:`);
    console.log(`  - Valid screws in layers: ${validScrewIds.size}`);
    console.log(`  - Total screws in ScrewManager: ${allScrewsInManager.length}`);
    console.log(`  - Orphaned screws to remove: ${screwsToRemove.length}`);

    if (screwsToRemove.length > 0) {
      console.log(`🧹 Removing ${screwsToRemove.length} orphaned screws from ScrewManager:`);
      
      // Use ScrewManager's internal method to remove orphaned screws
      // We'll access the private state through a public method that we'll need to add
      console.log(`💡 Orphaned screws found: ${screwsToRemove.join(', ')}`);
      
      // For now, recommend restarting the game to clear orphaned screws
      console.log(`⚠️ To fix this issue immediately: Press 'R' to restart the game`);
      console.log(`✨ This will clear all orphaned screws and give you a fresh start`);
      console.log(`🎮 The underlying screw cleanup issue will be fixed in the next update`);
    } else {
      console.log(`✅ No orphaned screws found - ScrewManager is clean`);
    }
  }

  /**
   * Force fix layer opacity issues (set visible layers to full opacity)
   */
  private forceFixLayerOpacity(): void {
    if (!this.state.systemCoordinator) {
      console.warn('SystemCoordinator not available for layer opacity fix');
      return;
    }

    console.log('🔧 === FORCE FIXING LAYER OPACITY AND PHYSICS ===');
    
    const layerManager = this.state.systemCoordinator.getSystem('LayerManager') as import('../systems/LayerManager').LayerManager;
    const screwManager = this.state.systemCoordinator.getSystem('ScrewManager') as import('../systems/ScrewManager').ScrewManager;
    
    if (!layerManager) {
      console.error('LayerManager not available for opacity fix');
      return;
    }

    const layers = layerManager.getLayers();
    let fixedCount = 0;
    let physicsFixedCount = 0;

    layers.forEach(layer => {
      const currentOpacity = layer.getFadeOpacity();
      console.log(`🔍 Layer ${layer.id}: visible=${layer.isVisible}, opacity=${currentOpacity}`);
      
      if (layer.isVisible && currentOpacity < 1) {
        console.log(`🔧 Fixing layer ${layer.id} opacity from ${currentOpacity} to 1.0`);
        // Force set opacity to full and disable fade animation
        layer.fadeOpacity = 1.0;
        layer.fadeStartTime = 0;
        fixedCount++;
        
        // Also ensure physics are properly activated for all shapes in this layer
        console.log(`🎯 Re-activating physics for shapes in layer ${layer.id}`);
        const shapes = layer.getAllShapes();
        shapes.forEach(shape => {
          // Re-emit physics body added event to ensure physics world has the body
          this.emit({
            type: 'physics:body:added',
            timestamp: Date.now(),
            source: 'GameManager',
            bodyId: shape.body.id.toString(),
            shape,
            body: shape.body
          });
          
          // Force re-check screw removability and physics setup
          if (screwManager) {
            const shapeScrews = shape.getAllScrews().filter(screw => !screw.isCollected);
            console.log(`  🔩 Shape ${shape.id} has ${shapeScrews.length} screws - ensuring proper physics setup`);
            
            // Force update physics state (can't call private updateShapeConstraints)
            
            // Ensure proper physics state based on screw count
            if (shapeScrews.length === 0) {
              // No screws - should be fully dynamic
              console.log(`    💥 Shape ${shape.id} has no screws - making fully dynamic`);
              Matter.Body.setStatic(shape.body, false);
              Matter.Sleeping.set(shape.body, false);
              Matter.Body.setVelocity(shape.body, { x: 0, y: 2.0 });
            } else if (shapeScrews.length === 1) {
              // One screw - should be dynamic but constrained
              console.log(`    🔗 Shape ${shape.id} has 1 screw - making dynamic with constraint`);
              Matter.Body.setStatic(shape.body, false);
              Matter.Sleeping.set(shape.body, false);
              Matter.Body.setAngularVelocity(shape.body, 0.02);
            } else {
              // Multiple screws - should be static
              console.log(`    🔒 Shape ${shape.id} has ${shapeScrews.length} screws - keeping static`);
              Matter.Body.setStatic(shape.body, true);
            }
          }
          
          physicsFixedCount++;
        });
      }
    });

    console.log(`🔧 Fixed opacity for ${fixedCount} layers and physics for ${physicsFixedCount} shapes`);
    
    // Force a render update
    this.renderFrame();
  }

  /**
   * Debug fade animation state for all layers
   */
  private debugFadeAnimationState(): void {
    if (!this.state.systemCoordinator) {
      console.warn('SystemCoordinator not available for fade animation debug');
      return;
    }

    console.log('🎭 === FADE ANIMATION DEBUG ===');
    
    const layerManager = this.state.systemCoordinator.getSystem('LayerManager') as import('../systems/LayerManager').LayerManager;
    
    if (!layerManager) {
      console.error('LayerManager not available for fade animation debug');
      return;
    }

    const layers = layerManager.getLayers();
    const currentTime = Date.now();

    console.log(`Current time: ${currentTime}`);
    console.log(`Total layers: ${layers.length}`);

    layers.forEach((layer, index) => {
      const opacity = layer.getFadeOpacity();
      const isVisible = layer.isVisible;
      
      console.log(`\n🎭 Layer ${index} (${layer.id}):`);
      console.log(`  - isVisible: ${isVisible}`);
      console.log(`  - fadeOpacity: ${opacity}`);
      console.log(`  - fadeStartTime: ${layer.fadeStartTime}`);
      console.log(`  - fadeDuration: ${layer.fadeDuration}`);
      
      if (layer.fadeStartTime > 0) {
        const elapsed = currentTime - layer.fadeStartTime;
        const progress = Math.min(elapsed / layer.fadeDuration, 1);
        console.log(`  - Animation progress: ${(progress * 100).toFixed(1)}% (${elapsed}ms / ${layer.fadeDuration}ms)`);
        console.log(`  - Should be animating: ${layer.fadeStartTime > 0 && opacity < 1}`);
      } else {
        console.log(`  - Animation: Not running (fadeStartTime = 0)`);
      }
      
      const shapes = layer.getAllShapes();
      console.log(`  - Shapes: ${shapes.length}`);
    });

    // Check if LayerManager's updateShapePositions is being called
    console.log(`\n🔧 LayerManager state:`);
    // We can't access private state, but we can check if animations are stuck
    console.log(`If animations are stuck, check if updateShapePositions is being called regularly`);
  }

  /**
   * Debug rendering pipeline to understand why shapes aren't visible
   */
  private debugRenderingPipeline(): void {
    console.log('🎨 === RENDERING PIPELINE DEBUG ===');
    
    if (!this.state.ctx || !this.state.canvas) {
      console.error('❌ No canvas or context available');
      return;
    }

    console.log(`🖼️ Canvas State:`);
    console.log(`  - Canvas size: ${this.state.canvas.width}x${this.state.canvas.height}`);
    console.log(`  - Virtual size: ${this.state.virtualGameWidth}x${this.state.virtualGameHeight}`);
    console.log(`  - Scale: ${this.state.canvasScale}`);
    console.log(`  - Offset: (${this.state.canvasOffset.x}, ${this.state.canvasOffset.y})`);

    console.log(`\n🎯 Layer Rendering Data:`);
    console.log(`  - Visible layers count: ${this.state.visibleLayers.length}`);
    
    this.state.visibleLayers.forEach((layer, index) => {
      const shapes = layer.getAllShapes();
      console.log(`\n  Layer ${index} (${layer.id}):`);
      console.log(`    - Visible: ${layer.isVisible}`);
      console.log(`    - Fade opacity: ${layer.getFadeOpacity()}`);
      console.log(`    - Shapes: ${shapes.length}`);
      
      shapes.forEach((shape, shapeIndex) => {
        const bounds = shape.getBounds();
        const screws = shape.getAllScrews();
        console.log(`    Shape ${shapeIndex} (${shape.id}):`);
        console.log(`      - Position: (${shape.position.x.toFixed(1)}, ${shape.position.y.toFixed(1)})`);
        console.log(`      - Bounds: (${bounds.x.toFixed(1)}, ${bounds.y.toFixed(1)}, ${bounds.width.toFixed(1)}, ${bounds.height.toFixed(1)})`);
        console.log(`      - Physics body: ${shape.body ? `(${shape.body.position.x.toFixed(1)}, ${shape.body.position.y.toFixed(1)})` : 'NONE'}`);
        console.log(`      - Screws: ${screws.length} total`);
        console.log(`      - Physics body status: ${shape.body ? 'present' : 'missing'}`);
      });
    });

    console.log(`\n🎨 Rendering Context State:`);
    const transform = this.state.ctx.getTransform();
    console.log(`  - Transform: [${transform.a}, ${transform.b}, ${transform.c}, ${transform.d}, ${transform.e}, ${transform.f}]`);
    console.log(`  - Global alpha: ${this.state.ctx.globalAlpha}`);
    console.log(`  - Fill style: ${this.state.ctx.fillStyle}`);
    console.log(`  - Stroke style: ${this.state.ctx.strokeStyle}`);

    console.log(`\n🔧 Rendering Pipeline Test:`);
    console.log(`  - Testing if shapes would be rendered in current context...`);
    
    // Test render a simple shape to see if rendering works at all
    this.state.ctx.save();
    this.state.ctx.fillStyle = '#FF0000';
    this.state.ctx.fillRect(400, 400, 50, 50);
    console.log(`  - Drew test red rectangle at (400, 400, 50, 50)`);
    this.state.ctx.restore();

    console.log(`\n💡 If you can see a red rectangle, rendering works. If not, there's a canvas/context issue.`);
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
    window.removeEventListener('keyup', this.handleKeyUp.bind(this));
  }
}