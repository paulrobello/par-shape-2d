/**
 * Game-specific event debugger that wraps the shared EventDebugger
 * Provides backward compatibility while using shared implementation
 */

import { eventBus } from './EventBus';
import { EventLogger } from './EventLogger';
import { EventPriority } from './EventTypes';
import { DEBUG_CONFIG } from '../utils/Constants';
import { 
  EventDebugger as SharedEventDebugger, 
  EventDebugInfo as SharedEventDebugInfo,
  createEventDebugInterface 
} from '@/shared/events/EventDebugger';

// Extend shared interface with game-specific event priority enum
export interface EventDebugInfo extends Omit<SharedEventDebugInfo, 'subscriptions'> {
  subscriptions: Map<string, Array<{
    id: string;
    priority: EventPriority;
    once: boolean;
    source?: string;
  }>>;
}

export class EventDebugger {
  static eventLogger = EventLogger.getInstance();
  private static instance: EventDebugger;
  private sharedDebugger: SharedEventDebugger;

  private constructor() {
    this.sharedDebugger = SharedEventDebugger.getInstance('game', eventBus, {
      enableConsoleLogging: DEBUG_CONFIG.logEventFlow,
      updateInterval: 1000,
      maxTestEvents: 1000
    });
  }

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
    const sharedInfo = this.sharedDebugger.getDebugInfo();
    
    // Convert priority numbers back to EventPriority enum for game compatibility
    const gameSubscriptions = new Map<string, Array<{
      id: string;
      priority: EventPriority;
      once: boolean;
      source?: string;
    }>>();

    for (const [eventType, subs] of sharedInfo.subscriptions) {
      const gameSubs = subs.map(sub => ({
        ...sub,
        priority: sub.priority as EventPriority // Cast back to enum
      }));
      gameSubscriptions.set(eventType, gameSubs);
    }

    return {
      ...sharedInfo,
      subscriptions: gameSubscriptions
    };
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
  performanceTest(iterations: number = 1000): {
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

  /**
   * Setup debug logging for all events
   */
  private setupDebugLogging(): void {
    // This is now handled by the shared debugger
    console.log('[EventDebugger] Debug logging setup delegated to shared implementation');
  }

  /**
   * Monitor event patterns for specific duration
   */
  monitorPatterns(durationMs: number = 30000): void {
    console.log(`🔍 Monitoring event patterns for ${durationMs / 1000} seconds...`);
    
    const startTime = Date.now();
    const patterns = new Map<string, number>();
    
    // Enable detailed logging temporarily
    const wasLogging = EventDebugger.eventLogger.getStats().totalEvents > 0;
    if (!wasLogging) {
      EventDebugger.eventLogger.startLogging('debug');
    }
    
    const checkPatterns = () => {
      const logs = EventDebugger.eventLogger.getLogs(100);
      const recentLogs = logs.filter(log => log.timestamp > startTime);
      
      // Analyze sequential patterns
      for (let i = 0; i < recentLogs.length - 1; i++) {
        const pattern = `${recentLogs[i].event.type} → ${recentLogs[i + 1].event.type}`;
        patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
      }
    };
    
    const interval = setInterval(checkPatterns, 1000);
    
    setTimeout(() => {
      clearInterval(interval);
      
      console.group('📊 Event Pattern Analysis');
      const sortedPatterns = Array.from(patterns.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      
      if (sortedPatterns.length > 0) {
        console.table(Object.fromEntries(sortedPatterns));
      } else {
        console.log('No significant patterns detected');
      }
      console.groupEnd();
      
      // Restore original logging state
      if (!wasLogging) {
        EventDebugger.eventLogger.stopLogging();
      }
    }, durationMs);
  }

  /**
   * Get event flow trace for specific event type
   */
  traceEventFlow(eventType: string, maxDepth: number = 5): void {
    console.log(`🔄 Tracing event flow for: ${eventType}`);
    
    const logs = EventDebugger.eventLogger.getLogs(500);
    const relevantLogs = logs.filter(log => 
      log.event.type === eventType || 
      log.event.type.includes(eventType.split(':')[0])
    );
    
    if (relevantLogs.length === 0) {
      console.warn(`No events found matching: ${eventType}`);
      return;
    }
    
    console.group(`Event Flow Trace (${relevantLogs.length} events)`);
    relevantLogs.slice(-maxDepth).forEach((log, index) => {
      const timestamp = new Date(log.timestamp).toLocaleTimeString();
      const source = log.source || 'unknown';
      console.log(`${index + 1}. [${timestamp}] ${log.event.type} from ${source} (${log.duration.toFixed(2)}ms)`);
    });
    console.groupEnd();
  }
}

// Export singleton instance for backward compatibility
export const eventDebugger = EventDebugger.getInstance();

// Create and export the debug interface for console access
export const debugInterface = createEventDebugInterface('game', eventBus);

// Make debug interface globally available in development
if (typeof window !== 'undefined' && DEBUG_CONFIG.logEventFlow) {
  (window as { gameEventDebug?: typeof debugInterface }).gameEventDebug = debugInterface;
}