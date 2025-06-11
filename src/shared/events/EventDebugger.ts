/**
 * Shared event debugger for comprehensive event system debugging
 * Works with both game and editor contexts
 */

import { BaseEvent, EventHistory, EventBusStats } from './BaseEventTypes';
import { SharedEventBus } from './SharedEventBus';
import { EventLogger } from './EventLogger';

export interface EventDebugInfo {
  subscriptions: Map<string, Array<{
    id: string;
    priority: number;
    once: boolean;
    source?: string;
  }>>;
  stats: EventBusStats;
  recentEvents: EventHistory[];
  frequencyStats: Map<string, {
    count: number;
    totalDuration: number;
    averageDuration: number;
    lastSeen: number;
  }>;
}

export interface EventDebuggerConfig {
  /** Maximum number of events to keep in performance testing */
  maxTestEvents?: number;
  /** Default update interval for debug panel (ms) */
  updateInterval?: number;
  /** Enable console logging during debug mode */
  enableConsoleLogging?: boolean;
}

export class EventDebugger {
  private static instances = new Map<string, EventDebugger>();
  
  private isDebugMode = false;
  private debugPanel: HTMLElement | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private config: Required<EventDebuggerConfig>;
  
  private constructor(
    private context: 'game' | 'editor',
    private eventBus: SharedEventBus<BaseEvent>,
    private eventLogger: EventLogger,
    config: EventDebuggerConfig = {}
  ) {
    this.config = {
      maxTestEvents: 1000,
      updateInterval: 1000,
      enableConsoleLogging: true,
      ...config
    };
  }

  /**
   * Get or create debugger instance for a specific context
   */
  static getInstance(
    context: 'game' | 'editor',
    eventBus: SharedEventBus<BaseEvent>,
    config?: EventDebuggerConfig
  ): EventDebugger {
    if (!EventDebugger.instances.has(context)) {
      const eventLogger = EventLogger.getInstance(context);
      EventDebugger.instances.set(context, new EventDebugger(context, eventBus, eventLogger, config));
    }
    return EventDebugger.instances.get(context)!;
  }

  /**
   * Enable debug mode with optional visual panel
   */
  enableDebugMode(showPanel: boolean = false): void {
    this.isDebugMode = true;
    this.eventLogger.startLogging('debug');
    
    if (this.config.enableConsoleLogging) {
      console.log(`[${this.context}] Event debug mode enabled`);
    }
    
    if (showPanel) {
      this.createDebugPanel();
    }

    // Set up debug logging
    this.setupDebugLogging();
  }

  /**
   * Disable debug mode
   */
  disableDebugMode(): void {
    this.isDebugMode = false;
    this.eventLogger.stopLogging();
    
    if (this.debugPanel) {
      this.destroyDebugPanel();
    }

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    if (this.config.enableConsoleLogging) {
      console.log(`[${this.context}] Event debug mode disabled`);
    }
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
    const loggerStats = this.eventLogger.getStats();
    const frequencyStats = new Map<string, {
      count: number;
      totalDuration: number;
      averageDuration: number;
      lastSeen: number;
    }>();
    
    // Convert simple counts to expected format
    loggerStats.eventCounts.forEach((count, eventType) => {
      frequencyStats.set(eventType, {
        count,
        totalDuration: count * loggerStats.averageDuration,
        averageDuration: loggerStats.averageDuration,
        lastSeen: Date.now() // Approximation
      });
    });
    
    return {
      subscriptions: this.eventBus.getSubscriptions(),
      stats: this.eventBus.getStats(),
      recentEvents: this.eventBus.getEventHistory(50),
      frequencyStats
    };
  }

  /**
   * Print event system debug info to console
   */
  printDebugInfo(): void {
    const info = this.getDebugInfo();
    
    console.group(`🔍 Event System Debug Info (${this.context})`);
    
    // Statistics
    console.group('📊 Statistics');
    console.table(info.stats);
    console.groupEnd();

    // Subscriptions by event type
    console.group('📋 Subscriptions by Event Type');
    for (const [eventType, subs] of info.subscriptions) {
      console.log(`${eventType}: ${subs.length} handlers`);
      subs.forEach(sub => {
        console.log(`  - ${sub.source || 'unknown'} (priority: ${sub.priority}${sub.once ? ', once' : ''})`);
      });
    }
    console.groupEnd();

    // Recent events
    console.group('📝 Recent Events');
    info.recentEvents.slice(-10).forEach((event, index) => {
      const timestamp = new Date(event.timestamp).toLocaleTimeString();
      console.log(`${index + 1}. [${timestamp}] ${event.event.type} - ${event.handlers} handlers, ${event.duration.toFixed(2)}ms`);
    });
    console.groupEnd();

    // Frequency stats
    console.group('🔥 Event Frequency');
    const sortedFrequency = Array.from(info.frequencyStats.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10);
    
    sortedFrequency.forEach(([eventType, stats]) => {
      console.log(`${eventType}: ${stats.count} occurrences, avg ${stats.averageDuration.toFixed(2)}ms`);
    });
    console.groupEnd();

    console.groupEnd();
  }

  /**
   * Run performance tests on the event system
   */
  performanceTest(iterations: number = 1000): {
    averageEmitTime: number;
    totalTime: number;
    eventsPerSecond: number;
    memoryUsage: string;
  } {
    const testEvent: BaseEvent = {
      type: 'debug:performance:test',
      timestamp: Date.now(),
      source: `${this.context}_debugger`
    };

    // Warm up
    for (let i = 0; i < 10; i++) {
      this.eventBus.emit(testEvent);
    }

    // Actual test
    const startTime = performance.now();
    const startMemory = (performance as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize || 0;

    for (let i = 0; i < iterations; i++) {
      this.eventBus.emit({
        ...testEvent,
        timestamp: Date.now()
      } as BaseEvent);
    }

    const endTime = performance.now();
    const endMemory = (performance as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize || 0;
    const totalTime = endTime - startTime;
    const averageEmitTime = totalTime / iterations;
    const eventsPerSecond = 1000 / averageEmitTime;
    const memoryDelta = endMemory - startMemory;

    const results = {
      averageEmitTime,
      totalTime,
      eventsPerSecond,
      memoryUsage: `${(memoryDelta / 1024 / 1024).toFixed(2)} MB`
    };

    if (this.config.enableConsoleLogging) {
      console.group(`⚡ Performance Test Results (${this.context})`);
      console.table(results);
      console.groupEnd();
    }

    return results;
  }

  /**
   * Validate event system integrity
   */
  validateEventSystem(): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    const info = this.getDebugInfo();

    // Check for excessive subscription counts
    for (const [eventType, subs] of info.subscriptions) {
      if (subs.length > 20) {
        issues.push(`High subscription count for ${eventType}: ${subs.length} handlers`);
        recommendations.push(`Consider consolidating handlers for ${eventType} events`);
      }
    }

    // Check for performance issues
    if (info.stats.averageDurationPerEvent > 10) {
      issues.push(`High average event duration: ${info.stats.averageDurationPerEvent.toFixed(2)}ms`);
      recommendations.push('Optimize event handlers to reduce processing time');
    }

    // Check for error rates
    const errorRate = info.stats.errorCount / info.stats.totalEvents;
    if (errorRate > 0.01) {
      issues.push(`High error rate: ${(errorRate * 100).toFixed(2)}%`);
      recommendations.push('Review error logs and fix event handler issues');
    }

    // Check for memory leaks (large event history)
    if (info.recentEvents.length > 500) {
      recommendations.push('Consider reducing event history size to prevent memory issues');
    }

    const isValid = issues.length === 0;

    if (this.config.enableConsoleLogging) {
      console.group(`✅ Event System Validation (${this.context})`);
      console.log(`Status: ${isValid ? '✅ Valid' : '❌ Issues Found'}`);
      
      if (issues.length > 0) {
        console.group('🚨 Issues');
        issues.forEach(issue => console.warn(issue));
        console.groupEnd();
      }

      if (recommendations.length > 0) {
        console.group('💡 Recommendations');
        recommendations.forEach(rec => console.info(rec));
        console.groupEnd();
      }
      
      console.groupEnd();
    }

    return { isValid, issues, recommendations };
  }

  /**
   * Setup debug logging for all events
   */
  private setupDebugLogging(): void {
    // The event logging is now handled automatically by SharedEventBus
    // This method can be used for additional debug-specific logging
    if (this.config.enableConsoleLogging) {
      console.log(`[${this.context}] Debug logging setup complete`);
    }
  }

  /**
   * Create visual debug panel in the DOM
   */
  private createDebugPanel(): void {
    if (typeof window === 'undefined') return; // Server-side safety

    // Remove existing panel
    this.destroyDebugPanel();

    // Create panel
    this.debugPanel = document.createElement('div');
    this.debugPanel.id = `event-debug-panel-${this.context}`;
    this.debugPanel.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 400px;
      max-height: 500px;
      background: rgba(0, 0, 0, 0.9);
      color: #00ff00;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      padding: 10px;
      border: 1px solid #00ff00;
      border-radius: 5px;
      z-index: 10000;
      overflow-y: auto;
      backdrop-filter: blur(5px);
    `;

    // Add header
    const header = document.createElement('div');
    header.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 10px; color: #ffff00;">
        🔍 Event Debugger (${this.context.toUpperCase()})
        <button id="close-debug-${this.context}" style="float: right; background: #ff0000; color: white; border: none; padding: 2px 6px; border-radius: 3px; cursor: pointer;">×</button>
      </div>
    `;
    this.debugPanel.appendChild(header);

    // Add content area
    const content = document.createElement('div');
    content.id = `debug-content-${this.context}`;
    this.debugPanel.appendChild(content);

    // Add to DOM
    document.body.appendChild(this.debugPanel);

    // Setup close button
    const closeBtn = document.getElementById(`close-debug-${this.context}`);
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.disableDebugMode());
    }

    // Start updating
    this.startPanelUpdates();
  }

  /**
   * Update debug panel content
   */
  private updateDebugPanel(): void {
    if (!this.debugPanel) return;

    const content = document.getElementById(`debug-content-${this.context}`);
    if (!content) return;

    const info = this.getDebugInfo();
    const stats = info.stats;

    content.innerHTML = `
      <div style="margin-bottom: 8px;">
        <strong>Events:</strong> ${stats.totalEvents} | 
        <strong>Handlers:</strong> ${stats.totalHandlers} | 
        <strong>Errors:</strong> ${stats.errorCount}
      </div>
      
      <div style="margin-bottom: 8px;">
        <strong>Avg Duration:</strong> ${stats.averageDurationPerEvent.toFixed(2)}ms | 
        <strong>Queue:</strong> ${stats.queueSize}
      </div>
      
      <div style="margin-bottom: 10px; font-weight: bold; color: #ffff00;">Recent Events:</div>
      ${info.recentEvents.slice(-5).map(event => `
        <div style="margin-bottom: 2px; font-size: 11px;">
          ${event.event.type} (${event.duration.toFixed(1)}ms)
        </div>
      `).join('')}
      
      <div style="margin-top: 10px; font-weight: bold; color: #ffff00;">Top Events:</div>
      ${Array.from(info.frequencyStats.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5)
        .map(([type, stats]) => `
          <div style="margin-bottom: 2px; font-size: 11px;">
            ${type}: ${stats.count}x
          </div>
        `).join('')}
    `;
  }

  /**
   * Start panel update intervals
   */
  private startPanelUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(() => {
      this.updateDebugPanel();
    }, this.config.updateInterval);

    // Initial update
    this.updateDebugPanel();
  }

  /**
   * Destroy debug panel
   */
  private destroyDebugPanel(): void {
    if (this.debugPanel && this.debugPanel.parentNode) {
      this.debugPanel.parentNode.removeChild(this.debugPanel);
    }
    this.debugPanel = null;

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

/**
 * Create a debug interface for easy access
 */
export function createEventDebugInterface(
  context: 'game' | 'editor',
  eventBus: SharedEventBus<BaseEvent>
): {
  enable: (showPanel?: boolean) => void;
  disable: () => void;
  toggle: () => void;
  info: () => EventDebugInfo;
  print: () => void;
  test: (iterations?: number) => ReturnType<EventDebugger['performanceTest']>;
  validate: () => ReturnType<EventDebugger['validateEventSystem']>;
  logger: EventLogger;
  bus: SharedEventBus<BaseEvent>;
  clear: () => void;
  getInstanceInfo: () => EventDebugInfo;
} {
  const eventDebugger = EventDebugger.getInstance(context, eventBus);
  const logger = EventLogger.getInstance(context);

  return {
    enable: (showPanel?: boolean) => eventDebugger.enableDebugMode(showPanel),
    disable: () => eventDebugger.disableDebugMode(),
    toggle: () => eventDebugger.toggleDebugMode(),
    info: () => eventDebugger.getDebugInfo(),
    print: () => eventDebugger.printDebugInfo(),
    test: (iterations?: number) => eventDebugger.performanceTest(iterations),
    validate: () => eventDebugger.validateEventSystem(),
    logger: logger,
    bus: eventBus,
    clear: () => console.clear(),
    getInstanceInfo: () => eventDebugger.getDebugInfo()
  };
}