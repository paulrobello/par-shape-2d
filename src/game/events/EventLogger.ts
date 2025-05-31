/**
 * Event logging and debugging utilities
 */

import { eventBus } from './EventBus';
import { GameEvent } from './EventTypes';

export interface EventLogEntry {
  timestamp: number;
  event: GameEvent;
  handlers: number;
  duration: number;
  level: 'info' | 'warn' | 'error';
}

export class EventLogger {
  private static instance: EventLogger;
  private logs: EventLogEntry[] = [];
  private maxLogSize = 2000;
  private isLogging = false;
  private logLevel: 'none' | 'error' | 'warn' | 'info' | 'debug' = 'warn';
  private eventFilter: Set<string> = new Set();
  private sourceFilter: Set<string> = new Set();

  private constructor() {
    this.setupEventLogging();
  }

  static getInstance(): EventLogger {
    if (!EventLogger.instance) {
      EventLogger.instance = new EventLogger();
    }
    return EventLogger.instance;
  }

  /**
   * Start logging events
   */
  startLogging(level: 'none' | 'error' | 'warn' | 'info' | 'debug' = 'info'): void {
    this.isLogging = true;
    this.logLevel = level;
    console.log(`Event logging started at level: ${level}`);
  }

  /**
   * Stop logging events
   */
  stopLogging(): void {
    this.isLogging = false;
    console.log('Event logging stopped');
  }

  /**
   * Set filter for event types to log
   */
  setEventFilter(eventTypes: string[]): void {
    this.eventFilter = new Set(eventTypes);
  }

  /**
   * Set filter for event sources to log
   */
  setSourceFilter(sources: string[]): void {
    this.sourceFilter = new Set(sources);
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.eventFilter.clear();
    this.sourceFilter.clear();
  }

  /**
   * Get recent logs
   */
  getLogs(count: number = 100): EventLogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Get logs filtered by event type
   */
  getLogsByEventType(eventType: string, count: number = 100): EventLogEntry[] {
    return this.logs
      .filter(log => log.event.type === eventType)
      .slice(-count);
  }

  /**
   * Get logs filtered by source
   */
  getLogsBySource(source: string, count: number = 100): EventLogEntry[] {
    return this.logs
      .filter(log => log.event.source === source)
      .slice(-count);
  }

  /**
   * Get logs within time range
   */
  getLogsByTimeRange(startTime: number, endTime: number): EventLogEntry[] {
    return this.logs.filter(log => 
      log.timestamp >= startTime && log.timestamp <= endTime
    );
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs.length = 0;
    console.log('Event logs cleared');
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Get event frequency statistics
   */
  getEventFrequencyStats(): Map<string, {
    count: number;
    totalDuration: number;
    averageDuration: number;
    lastSeen: number;
  }> {
    const stats = new Map();

    for (const log of this.logs) {
      const eventType = log.event.type;
      const existing = stats.get(eventType) || {
        count: 0,
        totalDuration: 0,
        averageDuration: 0,
        lastSeen: 0
      };

      existing.count++;
      existing.totalDuration += log.duration;
      existing.averageDuration = existing.totalDuration / existing.count;
      existing.lastSeen = Math.max(existing.lastSeen, log.timestamp);

      stats.set(eventType, existing);
    }

    return stats;
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    totalEvents: number;
    slowestEvent: EventLogEntry | null;
    averageHandlersPerEvent: number;
    mostFrequentEvent: { type: string; count: number } | null;
    errorCount: number;
  } {
    if (this.logs.length === 0) {
      return {
        totalEvents: 0,
        slowestEvent: null,
        averageHandlersPerEvent: 0,
        mostFrequentEvent: null,
        errorCount: 0
      };
    }

    const slowestEvent = this.logs.reduce((slowest, current) => 
      current.duration > slowest.duration ? current : slowest
    );

    const totalHandlers = this.logs.reduce((sum, log) => sum + log.handlers, 0);
    const averageHandlersPerEvent = totalHandlers / this.logs.length;

    const eventCounts = new Map<string, number>();
    let errorCount = 0;

    for (const log of this.logs) {
      const count = eventCounts.get(log.event.type) || 0;
      eventCounts.set(log.event.type, count + 1);
      
      if (log.level === 'error') {
        errorCount++;
      }
    }

    let mostFrequentEvent: { type: string; count: number } | null = null;
    for (const [type, count] of eventCounts) {
      if (!mostFrequentEvent || count > mostFrequentEvent.count) {
        mostFrequentEvent = { type, count };
      }
    }

    return {
      totalEvents: this.logs.length,
      slowestEvent,
      averageHandlersPerEvent,
      mostFrequentEvent,
      errorCount
    };
  }

  /**
   * Print event summary to console
   */
  printSummary(): void {
    const summary = this.getPerformanceSummary();
    const stats = eventBus.getStats();

    console.group('Event System Summary');
    console.log('='.repeat(50));
    console.log(`Total Events Logged: ${summary.totalEvents}`);
    console.log(`Total Events Processed: ${stats.totalEvents}`);
    console.log(`Average Handlers per Event: ${summary.averageHandlersPerEvent.toFixed(2)}`);
    console.log(`Error Count: ${summary.errorCount}`);
    
    if (summary.slowestEvent) {
      console.log(`Slowest Event: ${summary.slowestEvent.event.type} (${summary.slowestEvent.duration.toFixed(2)}ms)`);
    }
    
    if (summary.mostFrequentEvent) {
      console.log(`Most Frequent Event: ${summary.mostFrequentEvent.type} (${summary.mostFrequentEvent.count} times)`);
    }

    console.log(`Current Queue Size: ${stats.queueSize}`);
    console.log(`Active Subscriptions: ${stats.subscriptionCount}`);
    console.groupEnd();
  }

  /**
   * Print event flow for debugging
   */
  printEventFlow(eventTypes?: string[], count: number = 20): void {
    let logsToShow = this.logs.slice(-count);
    
    if (eventTypes && eventTypes.length > 0) {
      logsToShow = logsToShow.filter(log => eventTypes.includes(log.event.type));
    }

    console.group(`Event Flow (last ${logsToShow.length} events)`);
    
    for (const log of logsToShow) {
      const time = new Date(log.timestamp).toLocaleTimeString();
      const source = log.event.source || 'unknown';
      const duration = log.duration.toFixed(2);
      
      console.log(`${time} [${source}] ${log.event.type} (${log.handlers} handlers, ${duration}ms)`);
    }
    
    console.groupEnd();
  }

  /**
   * Setup event logging system
   */
  private setupEventLogging(): void {
    // Subscribe to all events for logging
    const originalEmit = eventBus.emit.bind(eventBus);
    
    eventBus.emit = (event: GameEvent) => {
      const startTime = performance.now();
      
      // Call original emit
      originalEmit(event);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Log if logging is enabled and passes filters
      if (this.shouldLogEvent(event)) {
        this.addLogEntry(event, 0, duration, 'info'); // Handler count will be updated by history
      }
    };

    // Get handler count from event bus history
    setInterval(() => {
      if (this.isLogging) {
        const history = eventBus.getEventHistory(10);
        
        // Update recent log entries with actual handler counts
        for (const historyEntry of history) {
          const recentLog = this.logs
            .slice(-50)
            .find(log => 
              log.event.type === historyEntry.event.type &&
              Math.abs(log.timestamp - historyEntry.event.timestamp) < 100
            );
          
          if (recentLog) {
            recentLog.handlers = historyEntry.handlers;
            recentLog.duration = historyEntry.duration;
          }
        }
      }
    }, 1000);
  }

  /**
   * Check if event should be logged based on filters and level
   */
  private shouldLogEvent(event: GameEvent): boolean {
    if (!this.isLogging || this.logLevel === 'none') {
      return false;
    }

    // Check event type filter
    if (this.eventFilter.size > 0 && !this.eventFilter.has(event.type)) {
      return false;
    }

    // Check source filter
    if (this.sourceFilter.size > 0 && event.source && !this.sourceFilter.has(event.source)) {
      return false;
    }

    return true;
  }

  /**
   * Add entry to log
   */
  private addLogEntry(
    event: GameEvent,
    handlers: number,
    duration: number,
    level: 'info' | 'warn' | 'error'
  ): void {
    const logEntry: EventLogEntry = {
      timestamp: event.timestamp || Date.now(),
      event: { ...event }, // Create copy to avoid mutations
      handlers,
      duration,
      level
    };

    this.logs.push(logEntry);

    // Trim logs if too large
    if (this.logs.length > this.maxLogSize) {
      this.logs.splice(0, this.logs.length - this.maxLogSize);
    }

    // Console output based on log level
    if (this.logLevel === 'debug' || 
        (this.logLevel === 'info' && level !== 'error') ||
        (this.logLevel === 'warn' && level === 'warn') ||
        (this.logLevel === 'error' && level === 'error')) {
      
      const source = event.source || 'unknown';
      const message = `[${source}] ${event.type}`;
      
      switch (level) {
        case 'error':
          console.error(message, event);
          break;
        case 'warn':
          console.warn(message, event);
          break;
        default:
          console.log(message, event);
      }
    }
  }
}

// Export singleton instance
export const eventLogger = EventLogger.getInstance();