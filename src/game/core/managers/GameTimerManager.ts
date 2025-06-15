/**
 * GameTimerManager - Manages all timer-related functionality including game over countdown, 
 * level complete delays, and throttling for logging
 */

import { IGameTimerManager, TimerState } from './GameManagerTypes';

export class GameTimerManager implements IGameTimerManager {
  private state: TimerState;

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): TimerState {
    return {
      gameOverCountdown: null,
      levelCompleteTimer: null,
      lastCollisionLogTime: 0
    };
  }

  getTimerState(): TimerState {
    return { ...this.state };
  }

  startGameOverCountdown(callback: () => void): void {
    // Clear any existing game over countdown
    if (this.state.gameOverCountdown) {
      clearInterval(this.state.gameOverCountdown);
    }

    console.log('🚨 Starting game over countdown (5 seconds)');
    
    let countdown = 5;
    this.state.gameOverCountdown = setInterval(() => {
      countdown--;
      console.log(`⏱️ Game over in ${countdown} seconds`);
      
      if (countdown <= 0) {
        this.clearGameOverCountdown();
        callback();
      }
    }, 1000);
  }

  startLevelCompleteTimer(callback: () => void): void {
    // Clear any existing level complete timer
    if (this.state.levelCompleteTimer) {
      clearTimeout(this.state.levelCompleteTimer);
    }

    console.log('🎯 Starting 3-second delay before showing completion screen');
    
    // Start 3-second delay before showing level complete screen
    this.state.levelCompleteTimer = setTimeout(() => {
      this.state.levelCompleteTimer = null;
      console.log('✨ Showing level complete screen after 3-second delay');
      callback();
    }, 3000);
  }

  clearAllTimers(): void {
    this.clearGameOverCountdown();
    this.clearLevelCompleteTimer();
  }

  private clearGameOverCountdown(): void {
    if (this.state.gameOverCountdown) {
      clearInterval(this.state.gameOverCountdown);
      this.state.gameOverCountdown = null;
      console.log('🔄 Game over countdown cleared');
    }
  }

  private clearLevelCompleteTimer(): void {
    if (this.state.levelCompleteTimer) {
      clearTimeout(this.state.levelCompleteTimer);
      this.state.levelCompleteTimer = null;
      console.log('🔄 Level complete timer cleared');
    }
  }

  shouldLogCollision(): boolean {
    const now = Date.now();
    return now - this.state.lastCollisionLogTime >= 100; // Max 1 log per 100ms
  }

  updateCollisionLogTime(): void {
    this.state.lastCollisionLogTime = Date.now();
  }

  // Public methods for timer state checks
  hasGameOverCountdown(): boolean {
    return this.state.gameOverCountdown !== null;
  }

  hasLevelCompleteTimer(): boolean {
    return this.state.levelCompleteTimer !== null;
  }

  // Manual timer control methods
  clearGameOverTimer(): void {
    this.clearGameOverCountdown();
  }

  clearLevelCompleteTimerManual(): void {
    this.clearLevelCompleteTimer();
  }

  // Reset all timer state
  resetTimerState(): void {
    this.clearAllTimers();
    this.state.lastCollisionLogTime = 0;
  }
}