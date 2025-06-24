/**
 * GameDebugManager - Manages debug mode, debug info, and debug-related state
 * 
 * Now uses StateManager<T> for:
 * - Automatic state validation
 * - State change subscriptions for debug logging
 * - History tracking to see debug state changes
 * - Immutable state updates
 */

import { IGameDebugManager, DebugState } from './GameManagerTypes';
import { DEBUG_CONFIG } from '@/shared/utils/Constants';
import { StateManager } from '@/shared/utils/StateManager';

export class GameDebugManager implements IGameDebugManager {
  private stateManager: StateManager<DebugState>;

  constructor() {
    // Initialize StateManager with debug state
    this.stateManager = new StateManager<DebugState>(this.createInitialState(), {
      debugNamespace: 'GameDebugManager',
      enableHistory: true, // Always track debug state changes
      maxHistorySize: 30 // Keep last 30 debug state changes
    });

    // Subscribe to debug mode changes
    this.stateManager.subscribe('debugMode', (enabled, wasEnabled) => {
      console.log(`Debug mode ${enabled ? 'enabled' : 'disabled'} (was ${wasEnabled ? 'enabled' : 'disabled'})`);
      
      // Log state history when debug mode is enabled
      if (enabled && !wasEnabled) {
        const history = this.stateManager.getHistory();
        console.log(`Debug state history (last ${history.length} changes):`, history);
      }
    });

    // Subscribe to shift key changes
    this.stateManager.subscribe('shiftKeyPressed', (pressed) => {
      if (this.stateManager.get('debugMode') && DEBUG_CONFIG.logScrewDebug) {
        console.log(`🔧 Shift key ${pressed ? 'pressed' : 'released'} - blocked screw bypass ${pressed ? 'enabled' : 'disabled'}`);
      }
    });
  }

  private createInitialState(): DebugState {
    return {
      debugMode: false,
      shiftKeyPressed: false
    };
  }

  getDebugState(): DebugState {
    return this.stateManager.getState() as DebugState;
  }

  toggleDebugMode(): boolean {
    const currentMode = this.stateManager.get('debugMode');
    this.stateManager.set('debugMode', !currentMode);
    return !currentMode;
  }

  setShiftKeyPressed(pressed: boolean): void {
    this.stateManager.set('shiftKeyPressed', pressed);
  }

  isDebugMode(): boolean {
    return this.stateManager.get('debugMode');
  }

  handleDebugInfo(infoType: string): unknown {
    switch (infoType) {
      case 'performance':
        return this.getPerformanceInfo();
      case 'state':
        return this.getStateInfo();
      case 'save_data':
        return this.handleSaveDataRequest();
      case 'history':
        return this.getDebugHistory();
      default:
        console.warn(`Unknown debug info type: ${infoType}`);
        return null;
    }
  }

  private getPerformanceInfo(): Record<string, unknown> {
    const state = this.stateManager.getState();
    const perfInfo = {
      debugMode: state.debugMode,
      shiftKeyPressed: state.shiftKeyPressed,
      timestamp: Date.now(),
      // Add StateManager debug info
      stateManagerInfo: this.stateManager.getDebugInfo()
    };
    
    console.log('Performance info:', perfInfo);
    return perfInfo;
  }

  private getStateInfo(): Record<string, unknown> {
    const state = this.stateManager.getState();
    const stateInfo = {
      debugMode: state.debugMode,
      shiftKeyPressed: state.shiftKeyPressed,
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

  private getDebugHistory(): ReadonlyArray<{ state: Readonly<DebugState>; timestamp: number }> {
    return this.stateManager.getHistory() as ReadonlyArray<{ state: Readonly<DebugState>; timestamp: number }>;
  }

  // Debug mode control methods
  enableDebugMode(): void {
    this.stateManager.set('debugMode', true);
  }

  disableDebugMode(): void {
    this.stateManager.set('debugMode', false);
  }

  setDebugMode(enabled: boolean, source?: string): void {
    // Only update if the event is from another source (not GameManager)
    if (source && source !== 'GameManager') {
      this.stateManager.set('debugMode', enabled);
      console.log(`Debug mode ${enabled ? 'enabled' : 'disabled'} (from ${source})`);
    }
  }

  // Shift key state methods
  isShiftKeyPressed(): boolean {
    return this.stateManager.get('shiftKeyPressed');
  }

  // Debug bypass functionality
  isDebugBypassEnabled(): boolean {
    const state = this.stateManager.getState();
    return state.debugMode && state.shiftKeyPressed;
  }

  // Reset debug state
  resetDebugState(): void {
    this.stateManager.reset();
  }

  // Get debug info string for rendering
  getDebugInfoString(): string {
    const shiftPressed = this.stateManager.get('shiftKeyPressed');
    return `Shift Bypass: ${shiftPressed ? 'ENABLED (Hold Shift+Click)' : 'Disabled'}`;
  }

  // Debug logging helpers
  logShiftKeyState(pressed: boolean): void {
    if (this.stateManager.get('debugMode') && DEBUG_CONFIG.logScrewDebug) {
      console.log(`🔧 Shift key ${pressed ? 'pressed' : 'released'} - blocked screw bypass ${pressed ? 'enabled' : 'disabled'}`);
    }
  }

  logDebugAction(action: string, details?: unknown): void {
    if (this.stateManager.get('debugMode')) {
      console.log(`🐛 Debug Action: ${action}`, details || '');
      
      // Also log to state history as a comment
      console.log(`📋 State at time of action:`, this.stateManager.getState());
    }
  }

  // Advanced debug features using StateManager
  undoLastDebugStateChange(): boolean {
    if (this.stateManager.canUndo()) {
      console.log('↩️ Undoing last debug state change');
      return this.stateManager.undo();
    }
    console.log('⚠️ No debug state changes to undo');
    return false;
  }

  redoDebugStateChange(): boolean {
    if (this.stateManager.canRedo()) {
      console.log('↪️ Redoing debug state change');
      return this.stateManager.redo();
    }
    console.log('⚠️ No debug state changes to redo');
    return false;
  }

  getDebugStateStats(): {
    totalChanges: number;
    canUndo: boolean;
    canRedo: boolean;
    currentState: DebugState;
  } {
    const history = this.stateManager.getHistory();
    return {
      totalChanges: history.length,
      canUndo: this.stateManager.canUndo(),
      canRedo: this.stateManager.canRedo(),
      currentState: this.stateManager.getState() as DebugState
    };
  }
}