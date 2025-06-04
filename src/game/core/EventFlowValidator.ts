/**
 * Event Flow Validator - validates that event-driven systems can communicate properly
 * Used for testing and debugging the event-driven architecture
 */

import { eventBus } from '../events/EventBus';
import { GameEvent } from '../events/EventTypes';
import { DEBUG_CONFIG } from '../utils/Constants';

export class EventFlowValidator {
  private eventLog: GameEvent[] = [];
  private subscriptionId: string | null = null;

  /**
   * Start monitoring all events
   */
  startMonitoring(): void {
    if (this.subscriptionId) {
      console.warn('EventFlowValidator is already monitoring');
      return;
    }

    // We'll subscribe to specific event types instead of trying to catch all events

    // Actually, let's subscribe to specific event types to monitor the flow
    this.subscribeToEventType('game:started');
    this.subscribeToEventType('game:over');
    this.subscribeToEventType('level:started');
    this.subscribeToEventType('level:complete');
    this.subscribeToEventType('screw:clicked');
    this.subscribeToEventType('screw:removed');
    this.subscribeToEventType('screw:collected');
    this.subscribeToEventType('shape:created');
    this.subscribeToEventType('layer:created');
    this.subscribeToEventType('physics:body:added');
    this.subscribeToEventType('physics:constraint:added');
    this.subscribeToEventType('save:requested');
    this.subscribeToEventType('restore:requested');
    this.subscribeToEventType('debug:mode:toggled');
    this.subscribeToEventType('system:ready');

    if (DEBUG_CONFIG.logEventFlow) {
      console.log('✅ EventFlowValidator started monitoring events');
    }
  }

  /**
   * Subscribe to a specific event type for monitoring
   */
  private subscribeToEventType(eventType: string): void {
    eventBus.subscribe(
      eventType as GameEvent['type'],
      (event: GameEvent) => {
        this.logEvent(event);
      },
      { priority: 3 }
    );
  }

  /**
   * Log an event with detailed information
   */
  private logEvent(event: GameEvent): void {
    this.eventLog.push(event);
    
    // Create a detailed log entry
    const logEntry = {
      type: event.type,
      timestamp: new Date(event.timestamp).toISOString(),
      source: event.source || 'unknown',
      priority: event.priority || 'normal',
      data: this.extractEventData(event)
    };

    if (DEBUG_CONFIG.logEventFlow) {
      console.log(`📡 [EventFlow] ${event.type}`, logEntry);
    }
  }

  /**
   * Extract relevant data from events for logging
   */
  private extractEventData(event: GameEvent): Record<string, unknown> {
    const commonFields = ['type', 'timestamp', 'source', 'priority'];
    const eventData: Record<string, unknown> = {};

    Object.keys(event).forEach(key => {
      if (!commonFields.includes(key)) {
        eventData[key] = (event as unknown as Record<string, unknown>)[key];
      }
    });

    return eventData;
  }

  /**
   * Stop monitoring events
   */
  stopMonitoring(): void {
    if (this.subscriptionId) {
      eventBus.unsubscribe(this.subscriptionId);
      this.subscriptionId = null;
      if (DEBUG_CONFIG.logEventFlow) {
        console.log('✅ EventFlowValidator stopped monitoring events');
      }
    }
  }

  /**
   * Get the event log
   */
  getEventLog(): GameEvent[] {
    return [...this.eventLog];
  }

  /**
   * Get event statistics
   */
  getEventStats(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySources: Record<string, number>;
    recentEvents: GameEvent[];
  } {
    const eventsByType: Record<string, number> = {};
    const eventsBySource: Record<string, number> = {};

    this.eventLog.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      const source = event.source || 'unknown';
      eventsBySource[source] = (eventsBySource[source] || 0) + 1;
    });

    return {
      totalEvents: this.eventLog.length,
      eventsByType,
      eventsBySources: eventsBySource,
      recentEvents: this.eventLog.slice(-10) // Last 10 events
    };
  }

  /**
   * Validate that critical events are being emitted
   */
  validateEventFlow(): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check if system:ready event was emitted
    const systemReadyEvents = this.eventLog.filter(e => e.type === 'system:ready');
    if (systemReadyEvents.length === 0) {
      issues.push('system:ready event was never emitted - systems may not be initializing properly');
      recommendations.push('Check SystemCoordinator initialization sequence');
    } else if (systemReadyEvents.length > 1) {
      issues.push('Multiple system:ready events detected - possible duplicate initialization');
      recommendations.push('Ensure SystemCoordinator is only initialized once');
    }

    // Check for event sources
    const stats = this.getEventStats();
    const expectedSources = ['GameManager', 'GameState', 'LayerManager', 'ScrewManager', 'PhysicsWorld'];
    const actualSources = Object.keys(stats.eventsBySources);
    
    expectedSources.forEach(source => {
      if (!actualSources.includes(source)) {
        issues.push(`No events detected from ${source} - system may not be active`);
        recommendations.push(`Check ${source} initialization and event emission`);
      }
    });

    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    };
  }

  /**
   * Test event emission by sending a test event
   */
  testEventEmission(): boolean {
    try {
      eventBus.emit({
        type: 'debug:info:requested',
        timestamp: Date.now(),
        infoType: 'performance',
        source: 'EventFlowValidator'
      });
      
      if (DEBUG_CONFIG.logEventFlow) {
        console.log('✅ Test event emitted successfully');
      }
      return true;
    } catch (error) {
      console.error('❌ Failed to emit test event:', error);
      return false;
    }
  }

  /**
   * Clear the event log
   */
  clearLog(): void {
    this.eventLog = [];
    if (DEBUG_CONFIG.logEventFlow) {
      console.log('✅ Event log cleared');
    }
  }
}

// Create a global instance for easy access
export const eventFlowValidator = new EventFlowValidator();