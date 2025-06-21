/**
 * GameStateManager - Manages all game state including levels, scores, and progress
 */

import { IGameStateManager, GameState } from './GameManagerTypes';
import { DEBUG_CONFIG } from '@/shared/utils/Constants';

export class GameStateManager implements IGameStateManager {
  private state: GameState;

  constructor() {
    this.state = this.createInitialState();
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

  getGameState(): GameState {
    return { ...this.state };
  }

  updateGameState(updates: Partial<GameState>): void {
    this.state = { ...this.state, ...updates };
    
    if (DEBUG_CONFIG.logEventFlow) {
      console.log('[GameStateManager] State updated:', updates);
    }
  }

  resetGameState(preserveLevelAndScore = false): void {
    if (preserveLevelAndScore) {
      const currentLevel = this.state.currentLevel;
      const totalScore = this.state.totalScore;
      this.state = this.createInitialState();
      this.state.currentLevel = currentLevel;
      this.state.totalScore = totalScore;
      if (DEBUG_CONFIG.logEventFlow) {
        console.log(`[GameStateManager] State reset preserving level ${currentLevel} and total score ${totalScore}`);
      }
    } else {
      this.state = this.createInitialState();
      if (DEBUG_CONFIG.logEventFlow) {
        console.log('[GameStateManager] State reset to initial values');
      }
    }
  }

  isGameActive(): boolean {
    return this.state.gameStarted && !this.state.gameOver && !this.state.levelComplete;
  }

  getCurrentLevel(): number {
    return this.state.currentLevel;
  }

  getScore(): { level: number; total: number } {
    return {
      level: this.state.levelScore,
      total: this.state.totalScore
    };
  }

  getProgress(): { totalScrews: number; screwsInContainer: number; progress: number } {
    return { ...this.state.progressData };
  }

  // Game lifecycle methods
  startGame(): void {
    this.updateGameState({
      gameStarted: true,
      gameOver: false,
      levelComplete: false,
      levelWon: false
    });
  }

  endGame(): void {
    this.updateGameState({
      gameOver: true,
      gameStarted: false
    });
  }

  startLevel(level: number): void {
    // Preserve existing progressData.totalScrews if it's been set, only reset counters
    const currentProgressData = this.state.progressData;
    this.updateGameState({
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
    this.updateGameState({
      currentLevel: level,
      levelScore: score,
      levelWon: true
    });
  }

  showLevelComplete(): void {
    this.updateGameState({
      levelComplete: true,
      levelWon: false
    });
  }

  hideLevelComplete(): void {
    this.updateGameState({
      levelComplete: false,
      levelWon: false
    });
  }

  updateLevelScore(score: number): void {
    this.updateGameState({
      levelScore: score
    });
  }

  updateTotalScore(score: number): void {
    this.updateGameState({
      totalScore: score
    });
  }

  updateProgress(totalScrews: number, screwsInContainer: number, progress: number): void {
    this.updateGameState({
      progressData: {
        totalScrews,
        screwsInContainer,
        progress
      }
    });

    if (DEBUG_CONFIG.logEventFlow) {
      console.log(`[GameStateManager] Progress updated - gameStarted: ${this.state.gameStarted}, gameOver: ${this.state.gameOver}, levelComplete: ${this.state.levelComplete}`);
    }
  }

  incrementScrewsRemoved(): void {
    this.updateGameState({
      screwsRemovedThisLevel: this.state.screwsRemovedThisLevel + 1
    });
  }

  getScrewsRemovedThisLevel(): number {
    return this.state.screwsRemovedThisLevel;
  }

  // Helper methods for common state checks
  canProcessEvents(): boolean {
    return this.isGameActive();
  }

  isLevelWon(): boolean {
    return this.state.levelWon;
  }

  isLevelComplete(): boolean {
    return this.state.levelComplete;
  }

  isGameOver(): boolean {
    return this.state.gameOver;
  }

  hasGameStarted(): boolean {
    return this.state.gameStarted;
  }
}