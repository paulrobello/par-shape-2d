/**
 * Utility functions for event handling and debugging
 */

import { BaseEvent, EventHistory, EventBusStats } from './BaseEventTypes';

/**
 * Simple event logger for basic debugging
 * @deprecated Use EventLogger from './EventLogger' for comprehensive logging
 */
export class SimpleEventLogger {
  private enabled: boolean = false;
  private filters: Set<string> = new Set();
  private excludes: Set<string> = new Set();

  /**
   * Enable or disable event logging
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Add event types to include in logging
   */
  includeEventTypes(...types: string[]): void {
    types.forEach(type => this.filters.add(type));
  }

  /**
   * Add event types to exclude from logging
   */
  excludeEventTypes(...types: string[]): void {
    types.forEach(type => this.excludes.add(type));
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.filters.clear();
    this.excludes.clear();
  }

  /**
   * Log an event
   */
  logEvent(event: BaseEvent, context?: string): void {
    if (!this.enabled) return;

    // Check if event should be logged
    if (this.excludes.has(event.type)) return;
    if (this.filters.size > 0 && !this.filters.has(event.type)) return;

    const timestamp = new Date(event.timestamp || Date.now()).toISOString();
    const source = event.source || 'unknown';
    const prefix = context ? `[${context}]` : '';

    console.log(
      `${prefix}[${timestamp}] ${event.type} from ${source}`,
      event
    );
  }

  /**
   * Log event statistics
   */
  logStats(stats: EventBusStats, context?: string): void {
    if (!this.enabled) return;

    const prefix = context ? `[${context}]` : '';
    console.log(`${prefix} Event Bus Statistics:`, {
      'Total Events': stats.totalEvents,
      'Total Handlers': stats.totalHandlers,
      'Avg Handlers/Event': stats.averageHandlersPerEvent.toFixed(2),
      'Avg Duration/Event': `${stats.averageDurationPerEvent.toFixed(2)}ms`,
      'Error Count': stats.errorCount,
      'Queue Size': stats.queueSize,
      'Active Subscriptions': stats.subscriptionCount
    });
  }

  /**
   * Log event history
   */
  logHistory(history: EventHistory[], context?: string): void {
    if (!this.enabled) return;

    const prefix = context ? `[${context}]` : '';
    console.log(`${prefix} Event History (last ${history.length} events):`);
    
    history.forEach((entry, index) => {
      const timestamp = new Date(entry.timestamp).toISOString();
      console.log(
        `  ${index + 1}. [${timestamp}] ${entry.event.type} - ` +
        `${entry.handlers} handlers, ${entry.duration.toFixed(2)}ms`
      );
    });
  }
}

/**
 * Event performance monitor
 */
export class EventPerformanceMonitor {
  private thresholds = new Map<string, number>();
  private metrics = new Map<string, { count: number; totalDuration: number }>();

  /**
   * Set performance threshold for an event type
   */
  setThreshold(eventType: string, maxDurationMs: number): void {
    this.thresholds.set(eventType, maxDurationMs);
  }

  /**
   * Record event performance
   */
  recordEvent(event: BaseEvent, duration: number): void {
    const current = this.metrics.get(event.type) || { count: 0, totalDuration: 0 };
    this.metrics.set(event.type, {
      count: current.count + 1,
      totalDuration: current.totalDuration + duration
    });

    // Check threshold
    const threshold = this.thresholds.get(event.type);
    if (threshold && duration > threshold) {
      console.warn(
        `Performance warning: ${event.type} took ${duration.toFixed(2)}ms ` +
        `(threshold: ${threshold}ms)`
      );
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics(): Map<string, { count: number; avgDuration: number }> {
    const result = new Map();
    
    for (const [eventType, data] of this.metrics) {
      result.set(eventType, {
        count: data.count,
        avgDuration: data.totalDuration / data.count
      });
    }
    
    return result;
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics.clear();
  }
}

/**
 * Event validation utilities
 */
export class EventValidator {
  /**
   * Validate event has required base properties
   */
  static isValidEvent(event: unknown): event is BaseEvent {
    if (!event || typeof event !== 'object') return false;
    
    const e = event as Record<string, unknown>;
    return (
      typeof e.type === 'string' &&
      typeof e.timestamp === 'number'
    );
  }

  /**
   * Validate event type matches expected
   */
  static hasEventType<T extends BaseEvent>(
    event: BaseEvent,
    type: T['type']
  ): event is T {
    return event.type === type;
  }

  /**
   * Create a type guard for specific event types
   */
  static createTypeGuard<T extends BaseEvent>(type: T['type']) {
    return (event: BaseEvent): event is T => event.type === type;
  }
}

/**
 * Event flow analyzer for debugging event chains
 */
export class EventFlowAnalyzer {
  private flows = new Map<string, string[]>();
  private currentFlow: string[] = [];
  private flowStartTime: number = 0;

  /**
   * Start tracking a new flow
   */
  startFlow(): void {
    this.currentFlow = [];
    this.flowStartTime = Date.now();
  }

  /**
   * Add event to current flow
   */
  addEvent(event: BaseEvent): void {
    this.currentFlow.push(event.type);
  }

  /**
   * End current flow and save it
   */
  endFlow(name: string): void {
    if (this.currentFlow.length > 0) {
      const duration = Date.now() - this.flowStartTime;
      const flowKey = `${name}_${duration}ms`;
      this.flows.set(flowKey, [...this.currentFlow]);
    }
    this.currentFlow = [];
  }

  /**
   * Get all recorded flows
   */
  getFlows(): Map<string, string[]> {
    return new Map(this.flows);
  }

  /**
   * Find common event patterns
   */
  findPatterns(minOccurrences: number = 2): Map<string, number> {
    const patterns = new Map<string, number>();
    
    // Extract all subsequences from flows
    for (const flow of this.flows.values()) {
      for (let i = 0; i < flow.length - 1; i++) {
        for (let j = i + 2; j <= flow.length && j <= i + 5; j++) {
          const pattern = flow.slice(i, j).join(' -> ');
          patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
        }
      }
    }

    // Filter by minimum occurrences
    const result = new Map();
    for (const [pattern, count] of patterns) {
      if (count >= minOccurrences) {
        result.set(pattern, count);
      }
    }
    
    return result;
  }

  /**
   * Clear all recorded flows
   */
  clear(): void {
    this.flows.clear();
    this.currentFlow = [];
  }
}

/**
 * Create a debounced event handler
 */
export function debounceEventHandler<T extends BaseEvent>(
  handler: (event: T) => void,
  delayMs: number
): (event: T) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (event: T) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      handler(event);
      timeoutId = null;
    }, delayMs);
  };
}

/**
 * Create a throttled event handler
 */
export function throttleEventHandler<T extends BaseEvent>(
  handler: (event: T) => void,
  limitMs: number
): (event: T) => void {
  let lastCall = 0;
  
  return (event: T) => {
    const now = Date.now();
    if (now - lastCall >= limitMs) {
      lastCall = now;
      handler(event);
    }
  };
}

/**
 * Create a batched event handler
 */
export function batchEventHandler<T extends BaseEvent>(
  handler: (events: T[]) => void,
  batchSize: number,
  maxWaitMs: number = 100
): (event: T) => void {
  let batch: T[] = [];
  let timeoutId: NodeJS.Timeout | null = null;
  
  const flush = () => {
    if (batch.length > 0) {
      handler([...batch]);
      batch = [];
    }
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
  
  return (event: T) => {
    batch.push(event);
    
    if (batch.length >= batchSize) {
      flush();
    } else if (!timeoutId) {
      timeoutId = setTimeout(flush, maxWaitMs);
    }
  };
}

/**
 * Create an event filter
 */
export function createEventFilter<T extends BaseEvent>(
  predicate: (event: T) => boolean
): (handler: (event: T) => void) => (event: T) => void {
  return (handler: (event: T) => void) => {
    return (event: T) => {
      if (predicate(event)) {
        handler(event);
      }
    };
  };
}

/**
 * Create an event transformer
 */
export function createEventTransformer<TIn extends BaseEvent, TOut extends BaseEvent>(
  transform: (event: TIn) => TOut | null
): (handler: (event: TOut) => void) => (event: TIn) => void {
  return (handler: (event: TOut) => void) => {
    return (event: TIn) => {
      const transformed = transform(event);
      if (transformed) {
        handler(transformed);
      }
    };
  };
}