/**
 * GameUIManager - Manages UI state including menu overlay and holding holes status
 */

import { IGameUIManager, UIState } from './GameManagerTypes';

export class GameUIManager implements IGameUIManager {
  private state: UIState;

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): UIState {
    return {
      showMenuOverlay: false,
      holdingHolesFull: false
    };
  }

  getUIState(): UIState {
    return { ...this.state };
  }

  updateUIState(updates: Partial<UIState>): void {
    this.state = { ...this.state, ...updates };
  }

  toggleMenuOverlay(): void {
    this.state.showMenuOverlay = !this.state.showMenuOverlay;
  }

  setHoldingHolesFull(full: boolean): void {
    this.state.holdingHolesFull = full;
  }

  // Menu overlay methods
  showMenuOverlay(): void {
    this.state.showMenuOverlay = true;
  }

  hideMenuOverlay(): void {
    this.state.showMenuOverlay = false;
  }

  isMenuOverlayVisible(): boolean {
    return this.state.showMenuOverlay;
  }

  // Holding holes status methods
  areHoldingHolesFull(): boolean {
    return this.state.holdingHolesFull;
  }

  // Reset UI state
  resetUIState(): void {
    this.state = this.createInitialState();
  }
}