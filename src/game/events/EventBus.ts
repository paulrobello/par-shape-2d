/**
 * Game-specific event bus extending shared implementation
 */

import { GameEvent } from './EventTypes';
import { SharedEventBus } from '@/shared/events';

export class EventBus extends SharedEventBus<GameEvent> {
  private static instance: EventBus;

  private constructor() {
    super({
      maxHistorySize: 1000,
      maxLoopCount: 50,
      enableDebugLogging: false,
      namespace: 'game'
    });
  }

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  // All methods are inherited from SharedEventBus
  // No need to re-implement them
}

// Export singleton instance
export const eventBus = EventBus.getInstance();