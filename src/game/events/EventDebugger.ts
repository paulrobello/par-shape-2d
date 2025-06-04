/**
 * Debug utilities and visualization for the event system
 */

import { eventBus } from './EventBus';
import { eventLogger } from './EventLogger';
import { GameEvent, EventPriority } from './EventTypes';
import { DEBUG_CONFIG } from '../utils/Constants';

export interface EventDebugInfo {
  subscriptions: Map<string, Array<{
    id: string;
    priority: EventPriority;
    once: boolean;
    source?: string;
  }>>;
  stats: {
    totalEvents: number;
    totalHandlers: number;
    averageHandlersPerEvent: number;
    averageDurationPerEvent: number;
    errorCount: number;
    queueSize: number;
    subscriptionCount: number;
  };
  recentEvents: Array<{
    event: GameEvent;
    handlers: number;
    duration: number;
  }>;
  frequencyStats: Map<string, {
    count: number;
    totalDuration: number;
    averageDuration: number;
    lastSeen: number;
  }>;
}

export class EventDebugger {
  private static instance: EventDebugger;
  private isDebugMode = false;
  private debugPanel: HTMLElement | null = null;
  private updateInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): EventDebugger {
    if (!EventDebugger.instance) {
      EventDebugger.instance = new EventDebugger();
    }
    return EventDebugger.instance;
  }

  /**
   * Enable debug mode with optional visual panel
   */
  enableDebugMode(showPanel: boolean = false): void {
    this.isDebugMode = true;
    eventLogger.startLogging('debug');
    
    console.log('Event debug mode enabled');
    
    if (showPanel) {
      this.createDebugPanel();
    }

    // Log all events in debug mode
    this.setupDebugLogging();
  }

  /**
   * Disable debug mode
   */
  disableDebugMode(): void {
    this.isDebugMode = false;
    eventLogger.stopLogging();
    
    if (this.debugPanel) {
      this.destroyDebugPanel();
    }

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    console.log('Event debug mode disabled');
  }

  /**
   * Toggle debug mode
   */
  toggleDebugMode(): void {
    if (this.isDebugMode) {
      this.disableDebugMode();
    } else {
      this.enableDebugMode(true);
    }
  }

  /**
   * Get comprehensive debug information
   */
  getDebugInfo(): EventDebugInfo {
    return {
      subscriptions: eventBus.getSubscriptions(),
      stats: eventBus.getStats(),
      recentEvents: eventBus.getEventHistory(50),
      frequencyStats: eventLogger.getEventFrequencyStats()
    };
  }

  /**
   * Print event system debug info to console
   */
  printDebugInfo(): void {
    const info = this.getDebugInfo();
    
    console.group('🔍 Event System Debug Info');
    
    // Statistics
    console.group('📊 Statistics');
    console.table(info.stats);
    console.groupEnd();

    // Subscriptions by event type
    console.group('📋 Subscriptions by Event Type');
    for (const [eventType, subs] of info.subscriptions) {
      console.log(`${eventType}: ${subs.length} handlers`);
      subs.forEach(sub => {
        const priority = EventPriority[sub.priority];
        console.log(`  - ${sub.source || 'unknown'} (${priority}${sub.once ? ', once' : ''})`);
      });
    }
    console.groupEnd();

    // Frequency statistics
    console.group('📈 Event Frequency');
    const sortedFrequency = Array.from(info.frequencyStats.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10);
    
    console.table(Object.fromEntries(sortedFrequency));
    console.groupEnd();

    console.groupEnd();
  }

  /**
   * Visualize event flow in real-time
   */
  startEventFlowVisualization(): void {
    console.log('Starting event flow visualization...');
    
    let eventCount = 0;
    const startTime = Date.now();

    // Note: Using type assertion for debug flow - this is a debug-only feature
    const subscriptionId = eventBus.subscribe('debug:flow:all' as GameEvent['type'], (event: GameEvent) => {
      eventCount++;
      const elapsed = Date.now() - startTime;
      const source = event.source || 'unknown';
      
      console.log(
        `%c${eventCount}. [${elapsed}ms] ${event.type}`,
        'color: #007acc; font-weight: bold',
        `from ${source}`
      );
    });

    // Auto-stop after 30 seconds
    setTimeout(() => {
      eventBus.unsubscribe(subscriptionId);
      if (DEBUG_CONFIG.logEventFlow) {
        console.log('Event flow visualization stopped');
      }
    }, 30000);
  }

  /**
   * Test event system performance
   */
  async performanceTest(iterations: number = 1000): Promise<{
    totalTime: number;
    averageTime: number;
    eventsPerSecond: number;
  }> {
    console.log(`Starting event system performance test (${iterations} iterations)...`);
    
    const testEvents: GameEvent[] = [];
    for (let i = 0; i < iterations; i++) {
      testEvents.push({
        type: 'debug:performance:test',
        timestamp: Date.now(),
        source: 'performance-test',
        iteration: i
      });
    }

    // Add test handler
    let handlerCallCount = 0;
    const subscriptionId = eventBus.subscribe('debug:performance:test', () => {
      handlerCallCount++;
    });

    const startTime = performance.now();
    
    // Emit all test events
    for (const event of testEvents) {
      eventBus.emit(event);
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    // Cleanup
    eventBus.unsubscribe(subscriptionId);

    const results = {
      totalTime,
      averageTime: totalTime / iterations,
      eventsPerSecond: iterations / (totalTime / 1000)
    };

    console.log('Performance test results:', results);
    console.log(`Handler calls: ${handlerCallCount}/${iterations}`);

    return results;
  }

  /**
   * Validate event system integrity
   */
  validateEventSystem(): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    const info = this.getDebugInfo();

    // Check for memory leaks
    if (info.stats.subscriptionCount > 1000) {
      issues.push('High subscription count - possible memory leak');
    }

    if (info.stats.queueSize > 100) {
      issues.push('Large event queue - possible processing bottleneck');
    }

    if (info.stats.errorCount > 0) {
      issues.push(`${info.stats.errorCount} event handler errors detected`);
    }

    // Check for performance issues
    if (info.stats.averageDurationPerEvent > 10) {
      issues.push('High average event processing time');
    }

    // Check for circular dependencies
    const recentEvents = info.recentEvents.slice(-100);
    const eventTypeSequence = recentEvents.map(e => e.event.type);
    const repeatingPatterns = this.findRepeatingPatterns(eventTypeSequence);
    
    if (repeatingPatterns.length > 0) {
      issues.push('Potential circular event dependencies detected');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Create visual debug panel
   */
  private createDebugPanel(): void {
    if (this.debugPanel) {
      return;
    }

    this.debugPanel = document.createElement('div');
    this.debugPanel.id = 'event-debug-panel';
    this.debugPanel.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 400px;
      max-height: 80vh;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      font-family: monospace;
      font-size: 12px;
      padding: 15px;
      border-radius: 5px;
      z-index: 10000;
      overflow-y: auto;
      border: 1px solid #333;
    `;

    document.body.appendChild(this.debugPanel);

    // Update panel periodically
    this.updateInterval = setInterval(() => {
      this.updateDebugPanel();
    }, 1000);
  }

  /**
   * Update debug panel content
   */
  private updateDebugPanel(): void {
    if (!this.debugPanel) {
      return;
    }

    const info = this.getDebugInfo();
    const recentEvents = eventLogger.getLogs(10);

    this.debugPanel.innerHTML = `
      <h3 style="margin: 0 0 10px 0; color: #007acc;">🔍 Event System Debug</h3>
      
      <div style="margin-bottom: 15px;">
        <strong>📊 Statistics</strong><br>
        Events: ${info.stats.totalEvents} | Handlers: ${info.stats.totalHandlers}<br>
        Queue: ${info.stats.queueSize} | Subscriptions: ${info.stats.subscriptionCount}<br>
        Errors: ${info.stats.errorCount} | Avg Duration: ${info.stats.averageDurationPerEvent.toFixed(2)}ms
      </div>

      <div style="margin-bottom: 15px;">
        <strong>📋 Active Subscriptions</strong><br>
        ${Array.from(info.subscriptions.entries())
          .map(([type, subs]) => `${type}: ${subs.length}`)
          .slice(0, 5)
          .join('<br>')}
        ${info.subscriptions.size > 5 ? `<br>...and ${info.subscriptions.size - 5} more` : ''}
      </div>

      <div>
        <strong>📝 Recent Events</strong><br>
        ${recentEvents
          .slice(-10)
          .reverse()
          .map(log => {
            const time = new Date(log.timestamp).toLocaleTimeString();
            return `${time} ${log.event.type}`;
          })
          .join('<br>')}
      </div>
    `;
  }

  /**
   * Destroy debug panel
   */
  private destroyDebugPanel(): void {
    if (this.debugPanel) {
      document.body.removeChild(this.debugPanel);
      this.debugPanel = null;
    }

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Setup debug logging
   */
  private setupDebugLogging(): void {
    if (!this.isDebugMode) {
      return;
    }

    // Log subscription changes
    const originalSubscribe = eventBus.subscribe.bind(eventBus);
    const originalUnsubscribe = eventBus.unsubscribe.bind(eventBus);

    eventBus.subscribe = (...args) => {
      const result = originalSubscribe(...args);
      console.log(`➕ Subscription added: ${args[0]} (${args[2]?.source || 'unknown'})`);
      return result;
    };

    eventBus.unsubscribe = (subscriptionId: string) => {
      const result = originalUnsubscribe(subscriptionId);
      console.log(`➖ Subscription removed: ${subscriptionId}`);
      return result;
    };
  }

  /**
   * Find repeating patterns in event sequence
   */
  private findRepeatingPatterns(sequence: string[]): string[][] {
    const patterns: string[][] = [];
    const minPatternLength = 2;
    const maxPatternLength = 5;

    for (let length = minPatternLength; length <= maxPatternLength; length++) {
      for (let i = 0; i <= sequence.length - length * 2; i++) {
        const pattern = sequence.slice(i, i + length);
        const nextPattern = sequence.slice(i + length, i + length * 2);
        
        if (JSON.stringify(pattern) === JSON.stringify(nextPattern)) {
          patterns.push(pattern);
        }
      }
    }

    return patterns;
  }
}

// Export singleton instance
export const eventDebugger = EventDebugger.getInstance();

// Add global debug functions for console access
interface EventDebugGlobal {
  enable: () => void;
  disable: () => void;
  toggle: () => void;
  info: () => void;
  flow: () => void;
  test: (iterations?: number) => Promise<{ totalTime: number; averageTime: number; eventsPerSecond: number; }>;
  validate: () => { isValid: boolean; issues: string[] };
  logger: typeof eventLogger;
  bus: typeof eventBus;
  clear: () => void;
  getInstanceInfo: () => unknown;
}

if (typeof window !== 'undefined') {
  (window as { __eventDebug?: EventDebugGlobal }).__eventDebug = {
    enable: () => eventDebugger.enableDebugMode(true),
    disable: () => eventDebugger.disableDebugMode(),
    toggle: () => eventDebugger.toggleDebugMode(),
    info: () => eventDebugger.printDebugInfo(),
    flow: () => eventDebugger.startEventFlowVisualization(),
    test: (iterations?: number) => eventDebugger.performanceTest(iterations),
    validate: () => eventDebugger.validateEventSystem(),
    logger: eventLogger,
    bus: eventBus,
    clear: () => console.clear(),
    getInstanceInfo: () => eventDebugger.getDebugInfo()
  };
}