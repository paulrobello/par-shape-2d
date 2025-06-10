/**
 * GameDebugManager - Manages debug mode, debug info, and debug-related state
 */

import { IGameDebugManager, DebugState } from './GameManagerTypes';
import { DEBUG_CONFIG } from '@/shared/utils/Constants';

export class GameDebugManager implements IGameDebugManager {
  private state: DebugState;

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): DebugState {
    return {
      debugMode: false,
      shiftKeyPressed: false
    };
  }

  getDebugState(): DebugState {
    return { ...this.state };
  }

  toggleDebugMode(): boolean {
    this.state.debugMode = !this.state.debugMode;
    console.log(`Debug mode ${this.state.debugMode ? 'enabled' : 'disabled'}`);
    return this.state.debugMode;
  }

  setShiftKeyPressed(pressed: boolean): void {
    this.state.shiftKeyPressed = pressed;
    
    if (this.state.debugMode && DEBUG_CONFIG.logScrewDebug) {
      console.log(`🔧 Shift key ${pressed ? 'pressed' : 'released'} - blocked screw bypass ${pressed ? 'enabled' : 'disabled'}`);
    }
  }

  isDebugMode(): boolean {
    return this.state.debugMode;
  }

  handleDebugInfo(infoType: string): unknown {
    switch (infoType) {
      case 'performance':
        return this.getPerformanceInfo();
      case 'state':
        return this.getStateInfo();
      case 'save_data':
        return this.handleSaveDataRequest();
      default:
        console.warn(`Unknown debug info type: ${infoType}`);
        return null;
    }
  }

  private getPerformanceInfo(): Record<string, unknown> {
    const perfInfo = {
      debugMode: this.state.debugMode,
      shiftKeyPressed: this.state.shiftKeyPressed,
      timestamp: Date.now()
    };
    
    console.log('Performance info:', perfInfo);
    return perfInfo;
  }

  private getStateInfo(): Record<string, unknown> {
    const stateInfo = {
      debugMode: this.state.debugMode,
      shiftKeyPressed: this.state.shiftKeyPressed,
      timestamp: Date.now()
    };
    
    console.log('Debug state info:', stateInfo);
    return stateInfo;
  }

  private handleSaveDataRequest(): Record<string, unknown> {
    console.log('Save data requested from debug manager');
    return {
      action: 'save_requested',
      timestamp: Date.now(),
      trigger: 'manual'
    };
  }

  // Debug mode control methods
  enableDebugMode(): void {
    if (!this.state.debugMode) {
      this.state.debugMode = true;
      console.log('Debug mode enabled');
    }
  }

  disableDebugMode(): void {
    if (this.state.debugMode) {
      this.state.debugMode = false;
      console.log('Debug mode disabled');
    }
  }

  setDebugMode(enabled: boolean, source?: string): void {
    // Only update if the event is from another source (not GameManager)
    if (source && source !== 'GameManager') {
      this.state.debugMode = enabled;
      console.log(`Debug mode ${enabled ? 'enabled' : 'disabled'} (from ${source})`);
    }
  }

  // Shift key state methods
  isShiftKeyPressed(): boolean {
    return this.state.shiftKeyPressed;
  }

  // Debug bypass functionality
  isDebugBypassEnabled(): boolean {
    return this.state.debugMode && this.state.shiftKeyPressed;
  }

  // Reset debug state
  resetDebugState(): void {
    this.state = this.createInitialState();
  }

  // Get debug info string for rendering
  getDebugInfoString(): string {
    return `Shift Bypass: ${this.state.shiftKeyPressed ? 'ENABLED (Hold Shift+Click)' : 'Disabled'}`;
  }

  // Debug logging helpers
  logShiftKeyState(pressed: boolean): void {
    if (this.state.debugMode && DEBUG_CONFIG.logScrewDebug) {
      console.log(`🔧 Shift key ${pressed ? 'pressed' : 'released'} - blocked screw bypass ${pressed ? 'enabled' : 'disabled'}`);
    }
  }

  logDebugAction(action: string, details?: unknown): void {
    if (this.state.debugMode) {
      console.log(`🐛 Debug Action: ${action}`, details || '');
    }
  }
}