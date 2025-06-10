/**
 * Shared types and interfaces for GameManager module system
 */

import { GameLoop } from '../GameLoop';
import { Vector2, Container, HoldingHole, Screw } from '@/types/game';
import { Layer } from '@/game/entities/Layer';
import { SystemCoordinator } from '../SystemCoordinator';

// State interfaces for each manager module

export interface RenderState {
  canvas: HTMLCanvasElement | null;
  ctx: CanvasRenderingContext2D | null;
  canvasScale: number;
  canvasOffset: Vector2;
  virtualGameWidth: number;
  virtualGameHeight: number;
  visibleLayers: Layer[];
  containers: Container[];
  holdingHoles: HoldingHole[];
  allScrews: Screw[];
  lastRenderLogTime?: number;
}

export interface GameState {
  gameStarted: boolean;
  gameOver: boolean;
  levelComplete: boolean;
  levelWon: boolean;
  currentLevel: number;
  levelScore: number;
  totalScore: number;
  screwsRemovedThisLevel: number;
  progressData: {
    totalScrews: number;
    screwsInContainer: number;
    progress: number;
  };
}

export interface UIState {
  showMenuOverlay: boolean;
  holdingHolesFull: boolean;
}

export interface TimerState {
  gameOverCountdown: NodeJS.Timeout | null;
  levelCompleteTimer: NodeJS.Timeout | null;
  lastCollisionLogTime: number;
}

export interface DebugState {
  debugMode: boolean;
  shiftKeyPressed: boolean;
}

export interface SystemState {
  gameLoop: GameLoop;
  systemCoordinator: SystemCoordinator | null;
}

// Manager interfaces

export interface IGameStateManager {
  getGameState(): GameState;
  updateGameState(updates: Partial<GameState>): void;
  resetGameState(): void;
  isGameActive(): boolean;
  getCurrentLevel(): number;
  getScore(): { level: number; total: number };
  getProgress(): { totalScrews: number; screwsInContainer: number; progress: number };
  startGame(): void;
  endGame(): void;
  startLevel(level: number): void;
  completeLevel(level: number, score: number): void;
  showLevelComplete(): void;
  updateLevelScore(score: number): void;
  updateTotalScore(score: number): void;
  updateProgress(totalScrews: number, screwsInContainer: number, progress: number): void;
}

export interface IGameRenderManager {
  getRenderState(): RenderState;
  initializeCanvas(canvas: HTMLCanvasElement): boolean;
  updateCanvasSize(): void;
  updateRenderData(data: Partial<Pick<RenderState, 'visibleLayers' | 'containers' | 'holdingHoles' | 'allScrews'>>): void;
  render(): void;
  cleanup(): void;
}

export interface IGameUIManager {
  getUIState(): UIState;
  updateUIState(updates: Partial<UIState>): void;
  toggleMenuOverlay(): void;
  setHoldingHolesFull(full: boolean): void;
}

export interface IGameTimerManager {
  getTimerState(): TimerState;
  startGameOverCountdown(callback: () => void): void;
  startLevelCompleteTimer(callback: () => void): void;
  clearAllTimers(): void;
  shouldLogCollision(): boolean;
  updateCollisionLogTime(): void;
  clearLevelCompleteTimerManual(): void;
}

export interface IGameDebugManager {
  getDebugState(): DebugState;
  toggleDebugMode(): boolean;
  setShiftKeyPressed(pressed: boolean): void;
  isDebugMode(): boolean;
  handleDebugInfo(infoType: string): unknown;
  setDebugMode(enabled: boolean, source?: string): void;
}

export interface IGameEventCoordinator {
  setupEventHandlers(): void;
  routeEvent(eventType: string, data: unknown): void;
  cleanup(): void;
  setSystemCoordinator(coordinator: import('../SystemCoordinator').SystemCoordinator): void;
}

// Combined manager context for dependency injection
export interface ManagerContext {
  stateManager: IGameStateManager;
  renderManager: IGameRenderManager;
  uiManager: IGameUIManager;
  timerManager: IGameTimerManager;
  debugManager: IGameDebugManager;
  eventCoordinator: IGameEventCoordinator;
}