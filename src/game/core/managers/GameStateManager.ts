/**
 * GameStateManager - Manages all game state including levels, scores, and progress
 * 
 * Now uses StateManager<T> for:
 * - Automatic state validation
 * - State change subscriptions
 * - History tracking for debug
 * - Immutable state updates
 * - State transition enforcement
 * 
 * Note: When using state transitions, ensure all possible state changes have
 * corresponding transition rules defined, otherwise updates will be rejected.
 */

import { IGameStateManager, GameState } from './GameManagerTypes';
import { DEBUG_CONFIG } from '@/shared/utils/Constants';
import { StateManager } from '@/shared/utils/StateManager';

export class GameStateManager implements IGameStateManager {
  private stateManager: StateManager<GameState>;

  constructor() {
    // Initialize StateManager with game state
    this.stateManager = new StateManager<GameState>(this.createInitialState(), {
      debugNamespace: 'GameStateManager',
      enableHistory: DEBUG_CONFIG.logEventFlow, // Enable history in debug mode
      maxHistorySize: 20 // Keep last 20 state changes
    });

    // Add state validators
    this.setupValidators();
    
    // Add state transitions
    this.setupTransitions();
    
    // Subscribe to state changes for logging
    if (DEBUG_CONFIG.logEventFlow) {
      this.stateManager.subscribeAll((changes, state) => {
        console.log('[GameStateManager] State changes:', changes);
        console.log('[GameStateManager] New state:', state);
      });
    }
  }

  private createInitialState(): GameState {
    return {
      gameStarted: false,
      gameOver: false,
      levelComplete: false,
      levelWon: false,
      currentLevel: 1,
      levelScore: 0,
      totalScore: 0,
      screwsRemovedThisLevel: 0,
      progressData: {
        totalScrews: 0,
        screwsInContainer: 0,
        progress: 0
      }
    };
  }

  private setupValidators(): void {
    // Level must be positive
    this.stateManager.addValidator('currentLevel', (level) => 
      level >= 1 || 'Level must be at least 1'
    );

    // Scores must be non-negative
    this.stateManager.addValidator('levelScore', (score) => 
      score >= 0 || 'Level score cannot be negative'
    );
    
    this.stateManager.addValidator('totalScore', (score) => 
      score >= 0 || 'Total score cannot be negative'
    );

    // Progress must be 0-100
    this.stateManager.addValidator('progressData', (data) => {
      if (data.progress < 0 || data.progress > 100) {
        return 'Progress must be between 0 and 100';
      }
      if (data.totalScrews < 0) {
        return 'Total screws cannot be negative';
      }
      if (data.screwsInContainer < 0) {
        return 'Screws in container cannot be negative';
      }
      return true;
    });

    // Screws removed cannot be negative
    this.stateManager.addValidator('screwsRemovedThisLevel', (count) =>
      count >= 0 || 'Screws removed count cannot be negative'
    );
  }

  private setupTransitions(): void {
    // Game can only start if not already started
    this.stateManager.addTransition({
      from: { gameStarted: false },
      to: { gameStarted: true },
      name: 'Start Game'
    });

    // Game can only end if started
    this.stateManager.addTransition({
      from: { gameStarted: true },
      to: { gameOver: true },
      name: 'End Game'
    });

    // Level can only be won if game is active
    this.stateManager.addTransition({
      from: { gameStarted: true, gameOver: false },
      to: { levelWon: true },
      name: 'Win Level'
    });
    
    // Allow progressData updates when game is active
    // This is needed because StateManager requires ALL updates to match a transition
    // when transitions are defined
    this.stateManager.addTransition({
      from: { gameStarted: true, gameOver: false },
      to: { gameStarted: true, gameOver: false },
      name: 'Update Progress',
      // Allow any progressData changes
      condition: () => true
    });
  }

  getGameState(): GameState {
    return this.stateManager.getState() as GameState;
  }

  updateGameState(updates: Partial<GameState>): void {
    const success = this.stateManager.update(updates);
    
    if (!success && DEBUG_CONFIG.logEventFlow) {
      console.warn('[GameStateManager] State update rejected:', updates);
    }
  }

  resetGameState(preserveLevelAndScore = false): void {
    if (preserveLevelAndScore) {
      const currentLevel = this.stateManager.get('currentLevel');
      const totalScore = this.stateManager.get('totalScore');
      
      this.stateManager.reset();
      this.stateManager.update({
        currentLevel,
        totalScore
      });
      
      if (DEBUG_CONFIG.logEventFlow) {
        console.log(`[GameStateManager] State reset preserving level ${currentLevel} and total score ${totalScore}`);
      }
    } else {
      this.stateManager.reset();
      if (DEBUG_CONFIG.logEventFlow) {
        console.log('[GameStateManager] State reset to initial values');
      }
    }
  }

  isGameActive(): boolean {
    const state = this.stateManager.getState();
    return state.gameStarted && !state.gameOver && !state.levelComplete;
  }

  getCurrentLevel(): number {
    return this.stateManager.get('currentLevel');
  }

  getScore(): { level: number; total: number } {
    return {
      level: this.stateManager.get('levelScore'),
      total: this.stateManager.get('totalScore')
    };
  }

  getProgress(): { totalScrews: number; screwsInContainer: number; progress: number } {
    return { ...this.stateManager.get('progressData') };
  }

  // Game lifecycle methods
  startGame(): void {
    this.stateManager.update({
      gameStarted: true,
      gameOver: false,
      levelComplete: false,
      levelWon: false
    });
  }

  endGame(): void {
    this.stateManager.update({
      gameOver: true,
      gameStarted: false
    });
  }

  startLevel(level: number): void {
    // Preserve existing progressData.totalScrews if it's been set, only reset counters
    const currentProgressData = this.stateManager.get('progressData');
    this.stateManager.update({
      currentLevel: level,
      levelScore: 0,
      screwsRemovedThisLevel: 0,
      levelComplete: false,
      levelWon: false,
      progressData: {
        totalScrews: currentProgressData.totalScrews, // Preserve existing total if already set
        screwsInContainer: 0, // Reset collection counter
        progress: 0 // Reset progress percentage
      }
    });
  }

  completeLevel(level: number, score: number): void {
    this.stateManager.update({
      currentLevel: level,
      levelScore: score,
      levelWon: true
    });
  }

  showLevelComplete(): void {
    this.stateManager.update({
      levelComplete: true,
      levelWon: false
    });
  }

  hideLevelComplete(): void {
    this.stateManager.update({
      levelComplete: false,
      levelWon: false
    });
  }

  updateLevelScore(score: number): void {
    this.stateManager.set('levelScore', score);
  }

  updateTotalScore(score: number): void {
    this.stateManager.set('totalScore', score);
  }

  updateProgress(totalScrews: number, screwsInContainer: number, progress: number): void {
    this.stateManager.update({
      progressData: {
        totalScrews,
        screwsInContainer,
        progress
      }
    });

    if (DEBUG_CONFIG.logEventFlow) {
      const state = this.stateManager.getState();
      console.log(`[GameStateManager] Progress updated - gameStarted: ${state.gameStarted}, gameOver: ${state.gameOver}, levelComplete: ${state.levelComplete}`);
    }
  }

  incrementScrewsRemoved(): void {
    const current = this.stateManager.get('screwsRemovedThisLevel');
    this.stateManager.set('screwsRemovedThisLevel', current + 1);
  }

  getScrewsRemovedThisLevel(): number {
    return this.stateManager.get('screwsRemovedThisLevel');
  }

  // Helper methods for common state checks
  canProcessEvents(): boolean {
    return this.isGameActive();
  }

  isLevelWon(): boolean {
    return this.stateManager.get('levelWon');
  }

  isLevelComplete(): boolean {
    return this.stateManager.get('levelComplete');
  }

  isGameOver(): boolean {
    return this.stateManager.get('gameOver');
  }

  hasGameStarted(): boolean {
    return this.stateManager.get('gameStarted');
  }

  // Debug methods
  getStateHistory(): ReadonlyArray<{ state: Readonly<GameState>; timestamp: number }> | null {
    if (!DEBUG_CONFIG.logEventFlow) return null;
    return this.stateManager.getHistory() as ReadonlyArray<{ state: Readonly<GameState>; timestamp: number }>;
  }

  getDebugInfo(): Record<string, unknown> {
    return this.stateManager.getDebugInfo();
  }
}