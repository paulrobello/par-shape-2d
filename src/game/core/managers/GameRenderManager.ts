/**
 * GameRenderManager - Manages all rendering operations including canvas, scaling, and drawing
 */

import { IGameRenderManager, RenderState, IGameStateManager, IGameUIManager, IGameDebugManager } from './GameManagerTypes';
import { GAME_CONFIG, UI_CONSTANTS, SCREW_COLORS, DEBUG_CONFIG } from '@/shared/utils/Constants';
import { ShapeRenderer } from '@/game/rendering/ShapeRenderer';
import { ScrewRenderer } from '@/game/rendering/ScrewRenderer';
import { createRenderContext } from '@/shared/rendering/core/RenderContext';
import { GeometryRenderer } from '@/shared/rendering/core/GeometryRenderer';

export class GameRenderManager implements IGameRenderManager {
  private state: RenderState;
  
  // Dependencies
  private gameStateManager: IGameStateManager | null = null;
  private uiManager: IGameUIManager | null = null;
  private debugManager: IGameDebugManager | null = null;

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): RenderState {
    return {
      canvas: null,
      ctx: null,
      canvasScale: 1,
      canvasOffset: { x: 0, y: 0 },
      virtualGameWidth: GAME_CONFIG.canvas.width,
      virtualGameHeight: GAME_CONFIG.canvas.height,
      visibleLayers: [],
      containers: [],
      holdingHoles: [],
      allScrews: [],
      lastRenderLogTime: undefined
    };
  }

  // Dependency injection
  setDependencies(
    gameStateManager: IGameStateManager,
    uiManager: IGameUIManager,
    debugManager: IGameDebugManager
  ): void {
    this.gameStateManager = gameStateManager;
    this.uiManager = uiManager;
    this.debugManager = debugManager;
  }

  getRenderState(): RenderState {
    return { ...this.state };
  }

  initializeCanvas(canvas: HTMLCanvasElement): boolean {
    this.state.canvas = canvas;
    this.state.ctx = canvas.getContext('2d');

    if (!this.state.ctx) {
      console.error('Unable to get 2D rendering context');
      return false;
    }

    if (DEBUG_CONFIG.logSystemLifecycle) {
      console.log(`GameRenderManager initialized: Canvas ${canvas.width}x${canvas.height}`);
    }

    // Apply initial canvas scaling
    this.updateCanvasScaling();

    return true;
  }

  updateCanvasSize(): void {
    if (!this.state.canvas) return;
    this.updateCanvasScaling();
  }

  private updateCanvasScaling(): void {
    if (!this.state.canvas || !this.state.ctx) return;

    const canvasWidth = this.state.canvas.width;
    const canvasHeight = this.state.canvas.height;

    // Calculate scale to fit virtual game dimensions within canvas
    const scaleX = canvasWidth / this.state.virtualGameWidth;
    const scaleY = canvasHeight / this.state.virtualGameHeight;
    this.state.canvasScale = Math.min(scaleX, scaleY);

    // Calculate offset to center the game
    this.state.canvasOffset = {
      x: (canvasWidth - this.state.virtualGameWidth * this.state.canvasScale) / 2,
      y: (canvasHeight - this.state.virtualGameHeight * this.state.canvasScale) / 2
    };

    // Apply the transform
    this.state.ctx.setTransform(
      this.state.canvasScale, 0, 0, this.state.canvasScale,
      this.state.canvasOffset.x, this.state.canvasOffset.y
    );
  }

  updateRenderData(data: Partial<Pick<RenderState, 'visibleLayers' | 'containers' | 'holdingHoles' | 'allScrews'>>): void {
    this.state = { ...this.state, ...data };
  }

  render(): void {
    if (!this.state.ctx || !this.state.canvas || !this.gameStateManager || !this.uiManager || !this.debugManager) return;

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

    const gameState = this.gameStateManager.getGameState();
    const uiState = this.uiManager.getUIState();
    const debugState = this.debugManager.getDebugState();

    if (gameState.gameOver) {
      this.renderGameOver();
      return;
    }

    if (!gameState.gameStarted) {
      this.renderStartScreen();
      return;
    }

    if (gameState.levelComplete) {
      this.renderLevelComplete();
      return;
    }

    // Render game elements
    this.renderGame();

    // Render debug info if enabled
    if (debugState.debugMode) {
      this.renderDebugInfo();
    }

    // Render pulsing red border if holding holes are full
    if (uiState.holdingHolesFull) {
      this.renderPulsingRedBorder();
    }

    // Render menu overlay on top of everything
    if (uiState.showMenuOverlay) {
      this.renderMenuOverlay();
    }
  }

  private renderStartScreen(): void {
    if (!this.state.ctx || !this.gameStateManager) return;

    this.state.ctx.fillStyle = '#FFFFFF';
    this.state.ctx.font = '32px Arial';
    this.state.ctx.textAlign = 'center';
    this.state.ctx.fillText('Click to Start', this.state.virtualGameWidth / 2, this.state.virtualGameHeight / 2);

    // Also render the HUD to show progress even before game starts
    this.renderHUD();
    this.renderMenuButton();
  }

  private renderGameOver(): void {
    if (!this.state.ctx || !this.gameStateManager) return;

    const gameState = this.gameStateManager.getGameState();

    this.state.ctx.fillStyle = '#FF0000';
    this.state.ctx.font = '48px Arial';
    this.state.ctx.textAlign = 'center';
    this.state.ctx.fillText('Game Over', this.state.virtualGameWidth / 2, this.state.virtualGameHeight / 2 - 50);
    this.state.ctx.font = '24px Arial';
    this.state.ctx.fillText(`Final Score: ${gameState.totalScore}`, this.state.virtualGameWidth / 2, this.state.virtualGameHeight / 2);
    this.state.ctx.fillText('Click to Restart', this.state.virtualGameWidth / 2, this.state.virtualGameHeight / 2 + 50);
  }

  private renderLevelComplete(): void {
    if (!this.state.ctx || !this.gameStateManager) return;

    const gameState = this.gameStateManager.getGameState();

    this.state.ctx.fillStyle = '#00FF00';
    this.state.ctx.font = '48px Arial';
    this.state.ctx.textAlign = 'center';
    this.state.ctx.fillText('Level Complete!', this.state.virtualGameWidth / 2, this.state.virtualGameHeight / 2 - 100);
    this.state.ctx.font = '32px Arial';
    this.state.ctx.fillText(`Level ${gameState.currentLevel}`, this.state.virtualGameWidth / 2, this.state.virtualGameHeight / 2 - 50);
    this.state.ctx.font = '24px Arial';
    this.state.ctx.fillText(`Score: ${gameState.levelScore}`, this.state.virtualGameWidth / 2, this.state.virtualGameHeight / 2);
    this.state.ctx.fillText(`Total: ${gameState.totalScore}`, this.state.virtualGameWidth / 2, this.state.virtualGameHeight / 2 + 30);
    this.state.ctx.fillText('Click to Continue', this.state.virtualGameWidth / 2, this.state.virtualGameHeight / 2 + 80);
  }

  private renderGame(): void {
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

  private renderBackground(): void {
    if (!this.state.ctx) return;

    // Render HUD area background - extend to top of canvas
    this.state.ctx.fillStyle = '#2C3E50';
    this.state.ctx.fillRect(
      0, 
      0, // Start from very top of canvas
      this.state.virtualGameWidth, 
      200 // Extended HUD area to bottom of containers
    );

    // Render holding hole area background
    this.state.ctx.fillStyle = '#2C3E50';
    this.state.ctx.fillRect(
      0, 
      this.state.virtualGameHeight - 100, // Holding hole area Y
      this.state.virtualGameWidth, 
      100 // Holding hole area height
    );
  }

  private renderContainers(): void {
    if (!this.state.ctx) return;

    this.state.containers.forEach(container => {
      // Use proper constants
      const containerWidth = UI_CONSTANTS.containers.width;
      const containerHeight = UI_CONSTANTS.containers.height;
      const holeRadius = UI_CONSTANTS.containers.hole.radius;
      const holeCount = container.maxHoles;
      
      // Apply fade opacity for container animations
      this.state.ctx!.save();
      this.state.ctx!.globalAlpha = container.fadeOpacity;
      
      // Render container background with colored border
      // Convert container center position to top-left corner for rectangle rendering
      const colorValue = SCREW_COLORS[container.color as keyof typeof SCREW_COLORS];
      const containerLeft = container.position.x - containerWidth / 2;
      const containerTop = container.position.y - containerHeight / 2;
      
      GeometryRenderer.renderRectangle(this.state.ctx!, {
        x: containerLeft,
        y: containerTop,
        width: containerWidth,
        height: containerHeight,
        fillColor: '#E5E5E5', // Light grey background
        strokeColor: colorValue, // Container color as border
        lineWidth: 3,
        cornerRadius: UI_CONSTANTS.containers.borderRadius
      });

      // Render individual holes
      const holeSpacing = (containerWidth - 8) / (holeCount + 1);
      for (let i = 0; i < holeCount; i++) {
        const holeX = containerLeft + 4 + holeSpacing * (i + 1);
        const holeY = containerTop + containerHeight / 2 + 5;
        const screwId = container.holes[i];
        const isOccupied = screwId !== null;
        
        // Render hole
        GeometryRenderer.renderCircle(this.state.ctx!, {
          x: holeX,
          y: holeY,
          radius: holeRadius,
          fillColor: isOccupied ? '#2C3E50' : '#1A1A1A',
          strokeColor: '#5F6368',
          lineWidth: 1
        });
        
        // If hole has a screw, render it using ScrewRenderer with smaller scale
        if (isOccupied && screwId) {
          const screw = this.state.allScrews.find(s => s.id === screwId);
          if (screw) {
            // Create a render context for this screw
            const screwRenderContext = {
              canvas: this.state.canvas!,
              ctx: this.state.ctx!,
              debugMode: false,
              scale: this.state.canvasScale
            };
            
            // Render collected screw at smaller scale (about 60% of normal size to fit in container hole)
            ScrewRenderer.renderCollectedScrew(screw, { x: holeX, y: holeY }, screwRenderContext, 0.6);
          }
        }
      }
      
      // Restore canvas state after applying fade opacity
      this.state.ctx!.restore();
    });
  }

  private renderHoldingHoles(): void {
    if (!this.state.ctx) return;

    this.state.holdingHoles.forEach(hole => {
      // Use proper constants
      const radius = UI_CONSTANTS.holdingHoles.radius;
      const innerRadius = UI_CONSTANTS.holdingHoles.innerRadius;
      const isFilled = hole.screwId !== null;
      
      // Render outer hole border
      GeometryRenderer.renderCircle(this.state.ctx!, {
        x: hole.position.x,
        y: hole.position.y,
        radius: radius,
        fillColor: '#1A1A1A',
        strokeColor: '#5F6368',
        lineWidth: 2
      });
      
      // Render inner hole
      GeometryRenderer.renderCircle(this.state.ctx!, {
        x: hole.position.x,
        y: hole.position.y,
        radius: innerRadius,
        fillColor: isFilled ? '#2C3E50' : '#0A0A0A',
        strokeColor: isFilled ? '#E74C3C' : '#3C3C3C',
        lineWidth: 1
      });

      // If filled, render the actual screw using ScrewRenderer
      if (isFilled && hole.screwId) {
        const screw = this.state.allScrews.find(s => s.id === hole.screwId);
        if (screw) {
          // Create a render context for this screw
          const screwRenderContext = {
            canvas: this.state.canvas!,
            ctx: this.state.ctx!,
            debugMode: false,
            scale: this.state.canvasScale
          };
          
          // Render collected screw at smaller scale (about 62.5% of normal size to fit in holding hole)
          ScrewRenderer.renderCollectedScrew(screw, hole.position, screwRenderContext, 0.625);
        }
      }
    });
  }

  private renderShapesAndScrews(): void {
    if (!this.state.ctx || !this.state.canvas || !this.debugManager) return;

    const renderContext = createRenderContext(this.state.canvas, 'game', {
      debugMode: this.debugManager.isDebugMode(),
      scale: this.state.canvasScale
    });

    // Render shapes and their screws together in proper layer order (back to front)
    this.state.visibleLayers.forEach(layer => {
      const shapes = layer.getAllShapes();
      shapes.forEach(shape => {
        // First render the shape
        ShapeRenderer.renderShape(shape, renderContext);
        
        // Then immediately render all screws for this shape
        const shapeScrews = shape.getAllScrews();
        shapeScrews.forEach(screw => {
          ScrewRenderer.renderScrew(screw, renderContext);
        });
      });
    });
  }

  private renderHUD(): void {
    if (!this.state.ctx || !this.gameStateManager) return;

    const gameState = this.gameStateManager.getGameState();
    
    // Use actual progress data from ProgressTracker
    const progressPercent = gameState.progressData.progress;
    const screwsProgress = gameState.progressData.totalScrews > 0 
      ? `${gameState.progressData.screwsInContainer}/${gameState.progressData.totalScrews}` 
      : '0/0';
    
    // Debug: Log progress data occasionally to diagnose the issue
    if (DEBUG_CONFIG.logProgressTracking && Date.now() % 3000 < 16) { // Log roughly every 3 seconds (only during frame renders)
      console.log(`[GameRenderManager] Current progress data:`, {
        totalScrews: gameState.progressData.totalScrews,
        screwsInContainer: gameState.progressData.screwsInContainer,
        progress: gameState.progressData.progress,
        displayText: screwsProgress
      });
    }

    // Render progress bar with proper positioning
    const progressBarX = 20;
    const progressBarY = 15;
    const progressBarWidth = 200;
    const progressBarHeight = 16;

    // Render progress bar background with border
    this.state.ctx.fillStyle = 'rgba(44, 62, 80, 0.9)';
    this.state.ctx.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);
    
    // Render progress bar border
    this.state.ctx.strokeStyle = '#BDC3C7';
    this.state.ctx.lineWidth = 1;
    this.state.ctx.strokeRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);

    // Render progress bar fill
    if (progressPercent > 0) {
      const fillWidth = Math.max(2, (progressBarWidth - 2) * progressPercent / 100);
      this.state.ctx.fillStyle = progressPercent >= 100 ? '#27AE60' : '#3498DB';
      this.state.ctx.fillRect(progressBarX + 1, progressBarY + 1, fillWidth, progressBarHeight - 2);
    }

    // Render progress text
    this.state.ctx.fillStyle = '#FFFFFF';
    this.state.ctx.font = '14px Arial';
    this.state.ctx.textAlign = 'left';
    this.state.ctx.fillText(`Screws: ${screwsProgress} (${progressPercent.toFixed(1)}%)`, progressBarX, progressBarY + progressBarHeight + 18);

    // Render level and score with better spacing
    this.state.ctx.fillText(`Level: ${gameState.currentLevel}`, progressBarX, progressBarY + progressBarHeight + 36);
    this.state.ctx.fillText(`Score: ${gameState.levelScore}`, progressBarX, progressBarY + progressBarHeight + 54);
    this.state.ctx.fillText(`Total: ${gameState.totalScore}`, progressBarX, progressBarY + progressBarHeight + 72);
  }

  private renderMenuButton(): void {
    if (!this.state.ctx) return;

    const buttonX = this.state.virtualGameWidth - 50;
    const buttonY = 15;
    const buttonSize = 30;

    // Render button background
    this.state.ctx.fillStyle = 'rgba(52, 73, 94, 0.8)';
    this.state.ctx.fillRect(buttonX, buttonY, buttonSize, buttonSize);

    // Render button border
    this.state.ctx.strokeStyle = '#BDC3C7';
    this.state.ctx.lineWidth = 2;
    this.state.ctx.strokeRect(buttonX, buttonY, buttonSize, buttonSize);

    // Render menu icon (three horizontal lines)
    this.state.ctx.strokeStyle = '#FFFFFF';
    this.state.ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const lineY = buttonY + 8 + i * 6;
      this.state.ctx.beginPath();
      this.state.ctx.moveTo(buttonX + 6, lineY);
      this.state.ctx.lineTo(buttonX + buttonSize - 6, lineY);
      this.state.ctx.stroke();
    }
  }

  private renderDebugInfo(): void {
    if (!this.state.ctx || !this.gameStateManager) return;

    const gameState = this.gameStateManager.getGameState();

    // Render debug panel background
    this.state.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.state.ctx.fillRect(this.state.virtualGameWidth - 250, 100, 240, 200);

    // Render debug info text
    this.state.ctx.fillStyle = '#FFFFFF';
    this.state.ctx.font = '12px monospace';
    this.state.ctx.textAlign = 'left';

    let debugY = 120;
    const debugLines = [
      `Game Started: ${gameState.gameStarted}`,
      `Game Over: ${gameState.gameOver}`,
      `Level Complete: ${gameState.levelComplete}`,
      `Current Level: ${gameState.currentLevel}`,
      `Level Score: ${gameState.levelScore}`,
      `Total Score: ${gameState.totalScore}`,
      `Visible Layers: ${this.state.visibleLayers.length}`,
      `Total Screws: ${this.state.allScrews.length}`,
      `Progress: ${gameState.progressData.progress.toFixed(1)}%`
    ];

    debugLines.forEach(line => {
      this.state.ctx!.fillText(line, this.state.virtualGameWidth - 240, debugY);
      debugY += 15;
    });
  }

  private renderPulsingRedBorder(): void {
    if (!this.state.ctx) return;

    // Create pulsing effect
    const time = Date.now() * 0.005;
    const alpha = (Math.sin(time) + 1) / 2 * 0.5 + 0.2;

    this.state.ctx.strokeStyle = `rgba(231, 76, 60, ${alpha})`;
    this.state.ctx.lineWidth = 8;
    this.state.ctx.strokeRect(4, 4, this.state.virtualGameWidth - 8, this.state.virtualGameHeight - 8);
  }

  private renderMenuOverlay(): void {
    if (!this.state.ctx) return;

    // Semi-transparent overlay
    this.state.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.state.ctx.fillRect(0, 0, this.state.virtualGameWidth, this.state.virtualGameHeight);

    // Menu content
    this.state.ctx.fillStyle = '#FFFFFF';
    this.state.ctx.font = '32px Arial';
    this.state.ctx.textAlign = 'center';
    this.state.ctx.fillText('Game Paused', this.state.virtualGameWidth / 2, this.state.virtualGameHeight / 2 - 100);

    this.state.ctx.font = '24px Arial';
    this.state.ctx.fillText('Press SPACE to Resume', this.state.virtualGameWidth / 2, this.state.virtualGameHeight / 2 - 50);
    this.state.ctx.fillText('Press R to Restart', this.state.virtualGameWidth / 2, this.state.virtualGameHeight / 2);
    this.state.ctx.fillText('Press ESC to Close Menu', this.state.virtualGameWidth / 2, this.state.virtualGameHeight / 2 + 50);
  }

  cleanup(): void {
    this.state.canvas = null;
    this.state.ctx = null;
    this.state.visibleLayers = [];
    this.state.containers = [];
    this.state.holdingHoles = [];
    this.state.allScrews = [];
  }
}