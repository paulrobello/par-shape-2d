/**
 * Game-specific event logger that wraps the shared EventLogger
 * Provides backward compatibility while using shared implementation
 */

import { EventLogger as SharedEventLogger, EventLogEntry, LogLevel } from '@/shared/events/EventLogger';
import { eventBus } from './EventBus';
import { GameEvent } from './EventTypes';
import { DEBUG_CONFIG } from '@/shared/utils/Constants';

export type { EventLogEntry };

export class EventLogger {
  private static instance: EventLogger;
  private sharedLogger: SharedEventLogger;

  private constructor() {
    this.sharedLogger = SharedEventLogger.getInstance('game');
    this.sharedLogger.setEventBus(eventBus);
    this.setupEventLogging();
  }

  static getInstance(): EventLogger {
    if (!EventLogger.instance) {
      EventLogger.instance = new EventLogger();
    }
    return EventLogger.instance;
  }

  /**
   * Setup event logging integration with game event bus
   */
  private setupEventLogging(): void {
    // The SharedEventBus already logs events internally when they are emitted
    // We just need to ensure debug logging is enabled
    if (DEBUG_CONFIG.logEventFlow) {
      // Enable event history tracking in the event bus
      const history = eventBus.getEventHistory(1);
      if (history.length === 0) {
        console.log('[EventLogger] Event history tracking enabled');
      }
    }
  }
  
  /**
   * Log a specific event manually
   */
  logEvent(event: GameEvent, handlers: number = 0, duration: number = 0): void {
    if (this.sharedLogger) {
      this.sharedLogger.logEvent(event, handlers, duration);
    }
  }

  /**
   * Start logging events
   */
  startLogging(level: LogLevel = 'info'): void {
    this.sharedLogger.startLogging(level);
  }

  /**
   * Stop logging events
   */
  stopLogging(): void {
    this.sharedLogger.stopLogging();
  }

  /**
   * Set filter for event types to log
   */
  setEventFilter(eventTypes: string[]): void {
    this.sharedLogger.setEventFilter(eventTypes);
  }

  /**
   * Set filter for event sources to log
   */
  setSourceFilter(sources: string[]): void {
    this.sharedLogger.setSourceFilter(sources);
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.sharedLogger.clearFilters();
  }

  /**
   * Get recent logs
   */
  getLogs(count: number = 100): EventLogEntry[] {
    return this.sharedLogger.getLogs(count);
  }

  /**
   * Get logs filtered by event type
   */
  getLogsByEventType(eventType: string, count: number = 100): EventLogEntry[] {
    return this.sharedLogger.getLogsByEventType(eventType, count);
  }

  /**
   * Get logs filtered by source
   */
  getLogsBySource(source: string, count: number = 100): EventLogEntry[] {
    return this.sharedLogger.getLogsBySource(source, count);
  }

  /**
   * Get logs filtered by level
   */
  getLogsByLevel(level: 'info' | 'warn' | 'error', count: number = 100): EventLogEntry[] {
    return this.sharedLogger.getLogsByLevel(level, count);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.sharedLogger.clearLogs();
  }

  /**
   * Get log statistics
   */
  getStats(): ReturnType<SharedEventLogger['getStats']> {
    return this.sharedLogger.getStats();
  }

  /**
   * Export logs to JSON
   */
  exportLogs(): string {
    return this.sharedLogger.exportLogs();
  }

  /**
   * Import logs from JSON
   */
  importLogs(json: string): void {
    this.sharedLogger.importLogs(json);
  }

  /**
   * Get a summary of event activity
   */
  getSummary(): string {
    return this.sharedLogger.getSummary();
  }

  /**
   * Print summary to console
   */
  printSummary(): void {
    console.log(this.getSummary());
  }

  /**
   * Get frequent event patterns
   */
  getEventPatterns(minCount: number = 5): Map<string, number> {
    const logs = this.getLogs(1000);
    const patterns = new Map<string, number>();
    
    // Look for sequential patterns
    for (let i = 0; i < logs.length - 1; i++) {
      const pattern = `${logs[i].event.type} -> ${logs[i + 1].event.type}`;
      patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
    }
    
    // Filter by minimum count
    const result = new Map<string, number>();
    for (const [pattern, count] of patterns) {
      if (count >= minCount) {
        result.set(pattern, count);
      }
    }
    
    return result;
  }

  /**
   * Analyze performance issues
   */
  getPerformanceIssues(thresholdMs: number = 16): EventLogEntry[] {
    return this.getLogs(500).filter(log => log.duration > thresholdMs);
  }

  /**
   * Get error summary
   */
  getErrorSummary(): Map<string, number> {
    const errors = this.getLogsByLevel('error', 500);
    const summary = new Map<string, number>();
    
    for (const log of errors) {
      const key = `${log.event.type}:${log.source || 'unknown'}`;
      summary.set(key, (summary.get(key) || 0) + 1);
    }
    
    return summary;
  }
}