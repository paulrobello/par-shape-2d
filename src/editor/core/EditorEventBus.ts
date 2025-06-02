import { EditorEvent, EditorEventType, EditorEventHandler } from '../events/EditorEventTypes';

export enum EditorEventPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3,
}

interface EditorEventSubscription {
  handler: EditorEventHandler;
  priority: EditorEventPriority;
  id: string;
}

interface EditorEventMetrics {
  emissionCount: number;
  handlerCount: number;
  lastEmission: number;
  averageHandlingTime: number;
}

/**
 * Editor-specific event bus for decoupled communication between editor systems
 */
export class EditorEventBus {
  private static instance: EditorEventBus | null = null;
  private subscriptions = new Map<EditorEventType, EditorEventSubscription[]>();
  private eventHistory: Array<{ event: EditorEvent; timestamp: number }> = [];
  private metrics = new Map<EditorEventType, EditorEventMetrics>();
  private maxHistorySize = 1000;
  private loopDetection = new Map<string, number>();
  private maxLoopsPerSource = 50;

  private constructor() {}

  static getInstance(): EditorEventBus {
    if (!EditorEventBus.instance) {
      EditorEventBus.instance = new EditorEventBus();
    }
    return EditorEventBus.instance;
  }

  /**
   * Subscribe to an event type with optional priority
   */
  subscribe<T extends EditorEvent>(
    eventType: T['type'],
    handler: EditorEventHandler<T>,
    priority: EditorEventPriority = EditorEventPriority.NORMAL
  ): string {
    const subscriptionId = `${eventType}_${Date.now()}_${Math.random()}`;
    
    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, []);
    }

    const subscription: EditorEventSubscription = {
      handler: handler as EditorEventHandler,
      priority,
      id: subscriptionId,
    };

    const subs = this.subscriptions.get(eventType)!;
    subs.push(subscription);
    
    // Sort by priority (highest first)
    subs.sort((a, b) => b.priority - a.priority);

    // Update metrics
    this.updateHandlerCount(eventType);

    return subscriptionId;
  }

  /**
   * Unsubscribe from an event
   */
  unsubscribe(subscriptionId: string): boolean {
    for (const [eventType, subs] of this.subscriptions.entries()) {
      const index = subs.findIndex(sub => sub.id === subscriptionId);
      if (index !== -1) {
        subs.splice(index, 1);
        this.updateHandlerCount(eventType);
        return true;
      }
    }
    return false;
  }

  /**
   * Emit an event to all subscribers
   */
  async emit<T extends EditorEvent>(event: T, source?: string): Promise<void> {
    const startTime = performance.now();
    
    // Loop detection
    if (source) {
      const loopKey = `${event.type}_${source}`;
      const currentLoops = this.loopDetection.get(loopKey) || 0;
      if (currentLoops >= this.maxLoopsPerSource) {
        console.warn(`Event loop detected for ${event.type} from ${source}. Stopping propagation.`);
        return;
      }
      this.loopDetection.set(loopKey, currentLoops + 1);
      
      // Reset loop count after a delay
      setTimeout(() => {
        this.loopDetection.set(loopKey, 0);
      }, 100);
    }

    // Add to history
    this.addToHistory(event);

    // Get subscribers
    const subscribers = this.subscriptions.get(event.type) || [];
    
    // Emit to all subscribers
    const promises = subscribers.map(async (subscription) => {
      try {
        await subscription.handler(event);
      } catch (error) {
        console.error(`Error in event handler for ${event.type}:`, error);
      }
    });

    await Promise.all(promises);

    // Update metrics
    const endTime = performance.now();
    this.updateMetrics(event.type, endTime - startTime);
  }

  /**
   * Get current event metrics
   */
  getMetrics(): Map<EditorEventType, EditorEventMetrics> {
    return new Map(this.metrics);
  }

  /**
   * Get recent event history
   */
  getEventHistory(count = 100): Array<{ event: EditorEvent; timestamp: number }> {
    return this.eventHistory.slice(-count);
  }

  /**
   * Clear all subscriptions and history
   */
  clear(): void {
    this.subscriptions.clear();
    this.eventHistory = [];
    this.metrics.clear();
    this.loopDetection.clear();
  }

  /**
   * Get subscription count for an event type
   */
  getSubscriptionCount(eventType: EditorEventType): number {
    return this.subscriptions.get(eventType)?.length || 0;
  }

  private addToHistory(event: EditorEvent): void {
    this.eventHistory.push({
      event,
      timestamp: Date.now(),
    });

    // Trim history if needed
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  private updateMetrics(eventType: EditorEventType, handlingTime: number): void {
    const current = this.metrics.get(eventType) || {
      emissionCount: 0,
      handlerCount: 0,
      lastEmission: 0,
      averageHandlingTime: 0,
    };

    const newEmissionCount = current.emissionCount + 1;
    const newAverageTime = (current.averageHandlingTime * current.emissionCount + handlingTime) / newEmissionCount;

    this.metrics.set(eventType, {
      ...current,
      emissionCount: newEmissionCount,
      lastEmission: Date.now(),
      averageHandlingTime: newAverageTime,
    });
  }

  private updateHandlerCount(eventType: EditorEventType): void {
    const current = this.metrics.get(eventType) || {
      emissionCount: 0,
      handlerCount: 0,
      lastEmission: 0,
      averageHandlingTime: 0,
    };

    this.metrics.set(eventType, {
      ...current,
      handlerCount: this.subscriptions.get(eventType)?.length || 0,
    });
  }
}