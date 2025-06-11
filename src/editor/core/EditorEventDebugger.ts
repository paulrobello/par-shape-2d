/**
 * Editor-specific event debugger using shared implementation
 */

import { EditorEventBus } from './EditorEventBus';
import { 
  EventDebugger as SharedEventDebugger, 
  createEventDebugInterface,
  type EventDebugInfo 
} from '@/shared/events/EventDebugger';
import { SharedEventBus, BaseEvent } from '@/shared/events';

export class EditorEventDebugger {
  private static instance: EditorEventDebugger;
  private sharedDebugger: SharedEventDebugger;

  private constructor() {
    // Cast EditorEventBus to SharedEventBus for compatibility
    const editorBus = EditorEventBus.getInstance() as unknown as SharedEventBus<BaseEvent>;
    this.sharedDebugger = SharedEventDebugger.getInstance('editor', editorBus, {
      enableConsoleLogging: true,
      updateInterval: 1000,
      maxTestEvents: 500
    });
  }

  static getInstance(): EditorEventDebugger {
    if (!EditorEventDebugger.instance) {
      EditorEventDebugger.instance = new EditorEventDebugger();
    }
    return EditorEventDebugger.instance;
  }

  /**
   * Enable debug mode with optional visual panel
   */
  enableDebugMode(showPanel: boolean = false): void {
    this.sharedDebugger.enableDebugMode(showPanel);
  }

  /**
   * Disable debug mode
   */
  disableDebugMode(): void {
    this.sharedDebugger.disableDebugMode();
  }

  /**
   * Toggle debug mode
   */
  toggleDebugMode(): void {
    this.sharedDebugger.toggleDebugMode();
  }

  /**
   * Get comprehensive debug information
   */
  getDebugInfo(): EventDebugInfo {
    return this.sharedDebugger.getDebugInfo();
  }

  /**
   * Print event system debug info to console
   */
  printDebugInfo(): void {
    this.sharedDebugger.printDebugInfo();
  }

  /**
   * Run performance tests on the event system
   */
  performanceTest(iterations: number = 500): {
    averageEmitTime: number;
    totalTime: number;
    eventsPerSecond: number;
    memoryUsage: string;
  } {
    return this.sharedDebugger.performanceTest(iterations);
  }

  /**
   * Validate event system integrity
   */
  validateEventSystem(): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    return this.sharedDebugger.validateEventSystem();
  }
}

// Export singleton instance
export const editorEventDebugger = EditorEventDebugger.getInstance();

// Create and export the debug interface for console access
const editorBus = EditorEventBus.getInstance() as unknown as SharedEventBus<BaseEvent>;
export const editorDebugInterface = createEventDebugInterface('editor', editorBus);

// Make debug interface globally available in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as { editorEventDebug?: typeof editorDebugInterface }).editorEventDebug = editorDebugInterface;
}