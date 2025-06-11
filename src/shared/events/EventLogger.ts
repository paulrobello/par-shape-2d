/**
 * Comprehensive event logging and debugging utilities
 * Consolidated from game implementation for use across both game and editor
 */

import { BaseEvent } from './BaseEventTypes';
import { SharedEventBus } from './SharedEventBus';

export interface EventLogEntry {
  timestamp: number;
  event: BaseEvent;
  handlers: number;
  duration: number;
  level: 'info' | 'warn' | 'error';
  source?: string;
}

export interface EventLogStats {
  totalEvents: number;
  eventCounts: Map<string, number>;
  sourceCounts: Map<string, number>;
  averageDuration: number;
  errorCount: number;
}

export type LogLevel = 'none' | 'error' | 'warn' | 'info' | 'debug';

export class EventLogger {
  private static instances = new Map<string, EventLogger>();
  private logs: EventLogEntry[] = [];
  private maxLogSize = 2000;
  private isLogging = false;
  private logLevel: LogLevel = 'warn';
  private eventFilter: Set<string> = new Set();
  private sourceFilter: Set<string> = new Set();
  private eventBus: SharedEventBus | null = null;
  private performanceThresholds = new Map<string, number>();

  private constructor(private context: string) {}

  /**
   * Get logger instance for a specific context
   */
  static getInstance(context: 'game' | 'editor' = 'game'): EventLogger {
    if (!EventLogger.instances.has(context)) {
      EventLogger.instances.set(context, new EventLogger(context));
    }
    return EventLogger.instances.get(context)!;
  }

  /**
   * Set the event bus to monitor
   */
  setEventBus(eventBus: SharedEventBus): void {
    this.eventBus = eventBus;
  }

  /**
   * Start logging events
   */
  startLogging(level: LogLevel = 'info'): void {
    this.isLogging = true;
    this.logLevel = level;
    console.log(`[${this.context}] Event logging started at level: ${level}`);
  }

  /**
   * Stop logging events
   */
  stopLogging(): void {
    this.isLogging = false;
    console.log(`[${this.context}] Event logging stopped`);
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
   * Set performance threshold for an event type
   */
  setPerformanceThreshold(eventType: string, maxDurationMs: number): void {
    this.performanceThresholds.set(eventType, maxDurationMs);
  }

  /**
   * Log an event
   */
  logEvent(event: BaseEvent, handlers: number = 0, duration: number = 0): void {
    if (!this.isLogging) return;

    // Check filters
    if (this.eventFilter.size > 0 && !this.eventFilter.has(event.type)) return;
    if (this.sourceFilter.size > 0 && event.source && !this.sourceFilter.has(event.source)) return;

    // Determine log level
    let level: 'info' | 'warn' | 'error' = 'info';
    const threshold = this.performanceThresholds.get(event.type);
    
    if (threshold && duration > threshold) {
      level = 'warn';
    }
    
    if ('error' in event && event.error || ('hasError' in event && (event as { hasError: boolean }).hasError)) {
      level = 'error';
    }

    // Check if we should log based on level
    if (!this.shouldLog(level)) return;

    const entry: EventLogEntry = {
      timestamp: event.timestamp || Date.now(),
      event,
      handlers,
      duration,
      level,
      source: event.source
    };

    this.logs.push(entry);

    // Maintain max log size
    if (this.logs.length > this.maxLogSize) {
      this.logs.shift();
    }

    // Console output if appropriate
    if (this.logLevel === 'debug' || level === 'error') {
      this.consoleLog(entry);
    }
  }

  /**
   * Check if should log based on level
   */
  private shouldLog(level: 'info' | 'warn' | 'error'): boolean {
    const levels: LogLevel[] = ['none', 'error', 'warn', 'info', 'debug'];
    const eventLevelIndex = levels.indexOf(level);
    const currentLevelIndex = levels.indexOf(this.logLevel);
    return currentLevelIndex >= eventLevelIndex;
  }

  /**
   * Output to console
   */
  private consoleLog(entry: EventLogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString();
    const source = entry.source || 'unknown';
    const message = `[${this.context}][${timestamp}] ${entry.event.type} from ${source} (${entry.handlers} handlers, ${entry.duration.toFixed(2)}ms)`;

    switch (entry.level) {
      case 'error':
        console.error(message, entry.event);
        break;
      case 'warn':
        console.warn(message, entry.event);
        break;
      default:
        console.log(message, entry.event);
    }
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
      .filter(log => log.source === source)
      .slice(-count);
  }

  /**
   * Get logs filtered by level
   */
  getLogsByLevel(level: 'info' | 'warn' | 'error', count: number = 100): EventLogEntry[] {
    return this.logs
      .filter(log => log.level === level)
      .slice(-count);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Get log statistics
   */
  getStats(): EventLogStats {
    const eventCounts = new Map<string, number>();
    const sourceCounts = new Map<string, number>();
    let totalDuration = 0;
    let errorCount = 0;

    for (const log of this.logs) {
      // Count by event type
      const eventCount = eventCounts.get(log.event.type) || 0;
      eventCounts.set(log.event.type, eventCount + 1);

      // Count by source
      if (log.source) {
        const sourceCount = sourceCounts.get(log.source) || 0;
        sourceCounts.set(log.source, sourceCount + 1);
      }

      // Track duration
      totalDuration += log.duration;

      // Count errors
      if (log.level === 'error') {
        errorCount++;
      }
    }

    return {
      totalEvents: this.logs.length,
      eventCounts,
      sourceCounts,
      averageDuration: this.logs.length > 0 ? totalDuration / this.logs.length : 0,
      errorCount
    };
  }

  /**
   * Export logs to JSON
   */
  exportLogs(): string {
    const stats = this.getStats();
    return JSON.stringify({
      context: this.context,
      timestamp: new Date().toISOString(),
      stats: {
        totalEvents: stats.totalEvents,
        eventCounts: Array.from(stats.eventCounts.entries()),
        sourceCounts: Array.from(stats.sourceCounts.entries()),
        averageDuration: stats.averageDuration,
        errorCount: stats.errorCount
      },
      logs: this.logs.map(log => ({
        timestamp: log.timestamp,
        type: log.event.type,
        source: log.source,
        handlers: log.handlers,
        duration: log.duration,
        level: log.level,
        data: log.event
      }))
    }, null, 2);
  }

  /**
   * Import logs from JSON
   */
  importLogs(json: string): void {
    try {
      const data = JSON.parse(json);
      if (data.logs && Array.isArray(data.logs)) {
        this.logs = data.logs.map((log: {
          timestamp: number;
          data: BaseEvent;
          handlers?: number;
          duration?: number;
          level?: 'info' | 'warn' | 'error';
          source?: string;
        }) => ({
          timestamp: log.timestamp,
          event: log.data,
          handlers: log.handlers || 0,
          duration: log.duration || 0,
          level: log.level || 'info',
          source: log.source
        }));
      }
    } catch (error) {
      console.error(`[${this.context}] Failed to import logs:`, error);
    }
  }

  /**
   * Get a summary of event activity
   */
  getSummary(): string {
    const stats = this.getStats();
    const lines: string[] = [
      `=== Event Log Summary (${this.context}) ===`,
      `Total Events: ${stats.totalEvents}`,
      `Error Count: ${stats.errorCount}`,
      `Average Duration: ${stats.averageDuration.toFixed(2)}ms`,
      '',
      'Top Event Types:'
    ];

    // Sort event counts
    const sortedEvents = Array.from(stats.eventCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    sortedEvents.forEach(([type, count]) => {
      lines.push(`  ${type}: ${count}`);
    });

    if (stats.sourceCounts.size > 0) {
      lines.push('', 'Top Sources:');
      const sortedSources = Array.from(stats.sourceCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      sortedSources.forEach(([source, count]) => {
        lines.push(`  ${source}: ${count}`);
      });
    }

    return lines.join('\n');
  }
}