/**
 * Central event bus for decoupled system communication
 */

import { GameEvent, EventHandler, EventPriority, EventSubscriptionOptions } from './EventTypes';

interface EventSubscription {
  handler: EventHandler;
  priority: EventPriority;
  once: boolean;
  source?: string;
  id: string;
}

interface EventHistory {
  event: GameEvent;
  handlers: number;
  duration: number;
}

export class EventBus {
  private static instance: EventBus;
  
  private subscriptions = new Map<string, EventSubscription[]>();
  private eventHistory: EventHistory[] = [];
  private eventQueue: GameEvent[] = [];
  private processingQueue = false;
  private maxHistorySize = 1000;
  private loopDetection = new Map<string, number>();
  private maxLoopCount = 50;
  
  // Performance tracking
  private stats = {
    totalEvents: 0,
    totalHandlers: 0,
    totalDuration: 0,
    errorCount: 0
  };

  private constructor() {}

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Subscribe to an event type with optional filtering and priority
   */
  subscribe<T extends GameEvent>(
    eventType: T['type'],
    handler: EventHandler<T>,
    options: EventSubscriptionOptions = {}
  ): string {
    const subscription: EventSubscription = {
      handler: handler as EventHandler,
      priority: options.priority ?? EventPriority.NORMAL,
      once: options.once ?? false,
      source: options.source,
      id: `${eventType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, []);
    }

    const subscriptionList = this.subscriptions.get(eventType)!;
    
    // Insert subscription in priority order (high to low)
    let insertIndex = subscriptionList.length;
    for (let i = 0; i < subscriptionList.length; i++) {
      if (subscriptionList[i].priority < subscription.priority) {
        insertIndex = i;
        break;
      }
    }
    
    subscriptionList.splice(insertIndex, 0, subscription);
    return subscription.id;
  }

  /**
   * Unsubscribe from an event using subscription ID
   */
  unsubscribe(subscriptionId: string): boolean {
    for (const [eventType, subscriptions] of this.subscriptions) {
      const index = subscriptions.findIndex(sub => sub.id === subscriptionId);
      if (index !== -1) {
        subscriptions.splice(index, 1);
        if (subscriptions.length === 0) {
          this.subscriptions.delete(eventType);
        }
        return true;
      }
    }
    return false;
  }

  /**
   * Unsubscribe all handlers for a specific source
   */
  unsubscribeSource(source: string): number {
    let removedCount = 0;
    
    for (const [eventType, subscriptions] of this.subscriptions) {
      const originalLength = subscriptions.length;
      const filteredSubscriptions = subscriptions.filter(sub => sub.source !== source);
      this.subscriptions.set(eventType, filteredSubscriptions);
      removedCount += originalLength - filteredSubscriptions.length;
      
      if (filteredSubscriptions.length === 0) {
        this.subscriptions.delete(eventType);
      }
    }
    
    return removedCount;
  }

  /**
   * Reset loop detection counters
   */
  resetLoopDetection(): void {
    this.loopDetection.clear();
  }

  /**
   * Emit an event synchronously
   */
  emit(event: GameEvent): void {
    // Add timestamp and source if not present
    if (!event.timestamp) {
      event.timestamp = Date.now();
    }

    // Loop detection
    const loopKey = `${event.type}_${event.source || 'unknown'}`;
    const loopCount = this.loopDetection.get(loopKey) || 0;
    
    if (loopCount >= this.maxLoopCount) {
      console.error(`Event loop detected for ${event.type} from ${event.source || 'unknown'}`);
      return;
    }
    
    this.loopDetection.set(loopKey, loopCount + 1);

    try {
      this.processEvent(event);
    } finally {
      // Reset loop detection after a short delay
      setTimeout(() => {
        this.loopDetection.set(loopKey, 0);
      }, 0);
    }
  }

  /**
   * Emit an event asynchronously (queued)
   */
  emitAsync(event: GameEvent): void {
    if (!event.timestamp) {
      event.timestamp = Date.now();
    }
    
    this.eventQueue.push(event);
    this.processQueue();
  }

  /**
   * Process a single event
   */
  private processEvent(event: GameEvent): void {
    const startTime = performance.now();
    const subscriptions = this.subscriptions.get(event.type) || [];
    let handlerCount = 0;
    let errorCount = 0;

    // Create a copy to avoid modification during iteration
    const subscriptionsCopy = [...subscriptions];

    for (const subscription of subscriptionsCopy) {
      try {
        handlerCount++;
        const result = subscription.handler(event);
        
        // Handle async handlers
        if (result instanceof Promise) {
          result.catch(error => {
            console.error(`Async event handler error for ${event.type}:`, error);
            this.stats.errorCount++;
          });
        }

        // Remove one-time subscriptions
        if (subscription.once) {
          this.unsubscribe(subscription.id);
        }
      } catch (error) {
        console.error(`Event handler error for ${event.type}:`, error);
        errorCount++;
      }
    }

    // Update statistics
    const duration = performance.now() - startTime;
    this.stats.totalEvents++;
    this.stats.totalHandlers += handlerCount;
    this.stats.totalDuration += duration;
    this.stats.errorCount += errorCount;

    // Add to history
    this.addToHistory({
      event,
      handlers: handlerCount,
      duration
    });
  }

  /**
   * Process the event queue asynchronously
   */
  private async processQueue(): Promise<void> {
    if (this.processingQueue || this.eventQueue.length === 0) {
      return;
    }

    this.processingQueue = true;

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()!;
      this.processEvent(event);
      
      // Yield to other tasks periodically
      if (this.eventQueue.length > 0 && this.eventQueue.length % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    this.processingQueue = false;
  }

  /**
   * Add event to history for debugging
   */
  private addToHistory(entry: EventHistory): void {
    this.eventHistory.push(entry);
    
    // Trim history if too large
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.splice(0, this.eventHistory.length - this.maxHistorySize);
    }
  }

  /**
   * Get event statistics
   */
  getStats(): {
    totalEvents: number;
    totalHandlers: number;
    averageHandlersPerEvent: number;
    averageDurationPerEvent: number;
    errorCount: number;
    queueSize: number;
    subscriptionCount: number;
  } {
    return {
      totalEvents: this.stats.totalEvents,
      totalHandlers: this.stats.totalHandlers,
      averageHandlersPerEvent: this.stats.totalEvents > 0 ? this.stats.totalHandlers / this.stats.totalEvents : 0,
      averageDurationPerEvent: this.stats.totalEvents > 0 ? this.stats.totalDuration / this.stats.totalEvents : 0,
      errorCount: this.stats.errorCount,
      queueSize: this.eventQueue.length,
      subscriptionCount: Array.from(this.subscriptions.values()).reduce((sum, subs) => sum + subs.length, 0)
    };
  }

  /**
   * Get recent event history
   */
  getEventHistory(count: number = 50): EventHistory[] {
    return this.eventHistory.slice(-count);
  }

  /**
   * Get all subscriptions for debugging
   */
  getSubscriptions(): Map<string, Array<{
    id: string;
    priority: EventPriority;
    once: boolean;
    source?: string;
  }>> {
    const result = new Map();
    
    for (const [eventType, subscriptions] of this.subscriptions) {
      result.set(eventType, subscriptions.map(sub => ({
        id: sub.id,
        priority: sub.priority,
        once: sub.once,
        source: sub.source
      })));
    }
    
    return result;
  }

  /**
   * Clear all subscriptions and reset state
   */
  clear(): void {
    this.subscriptions.clear();
    this.eventHistory.length = 0;
    this.eventQueue.length = 0;
    this.loopDetection.clear();
    this.stats = {
      totalEvents: 0,
      totalHandlers: 0,
      totalDuration: 0,
      errorCount: 0
    };
  }

  /**
   * Wait for a specific event to be emitted
   */
  waitFor<T extends GameEvent>(
    eventType: T['type'],
    timeout: number = 5000,
    filter?: (event: T) => boolean
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const cleanup = {
        subscriptionId: '',
        timeoutId: null as NodeJS.Timeout | null
      };

      const cleanupFn = () => {
        if (cleanup.subscriptionId) {
          this.unsubscribe(cleanup.subscriptionId);
        }
        if (cleanup.timeoutId) {
          clearTimeout(cleanup.timeoutId);
        }
      };

      cleanup.subscriptionId = this.subscribe(eventType, (event: T) => {
        if (!filter || filter(event)) {
          cleanupFn();
          resolve(event);
        }
      }, { once: true });

      cleanup.timeoutId = setTimeout(() => {
        cleanupFn();
        reject(new Error(`Timeout waiting for event: ${eventType}`));
      }, timeout);
    });
  }
}

// Export singleton instance
export const eventBus = EventBus.getInstance();