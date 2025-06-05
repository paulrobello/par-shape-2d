import { EditorEvent } from '../events/EditorEventTypes';
import { SharedEventBus, EventPriority, EventHandler, EventSubscriptionOptions } from '@/shared/events';

// Re-export EventPriority for backward compatibility
export { EventPriority as EditorEventPriority } from '@/shared/events';

/**
 * Editor-specific event bus extending shared implementation
 */
export class EditorEventBus extends SharedEventBus<EditorEvent> {
  private static instance: EditorEventBus | null = null;

  private constructor() {
    super({
      maxHistorySize: 1000,
      maxLoopCount: 50,
      enableDebugLogging: false,
      namespace: 'editor'
    });
  }

  static getInstance(): EditorEventBus {
    if (!EditorEventBus.instance) {
      EditorEventBus.instance = new EditorEventBus();
    }
    return EditorEventBus.instance;
  }

  /**
   * Override subscribe to support editor's priority parameter order
   */
  subscribe<T extends EditorEvent>(
    eventType: T['type'],
    handler: EventHandler<T>,
    options?: EventSubscriptionOptions
  ): string {
    return super.subscribe(eventType, handler, options);
  }

  /**
   * Convenience method for subscribe with priority parameter
   */
  subscribeWithPriority<T extends EditorEvent>(
    eventType: T['type'],
    handler: (event: T) => void | Promise<void>,
    priority: EventPriority = EventPriority.NORMAL
  ): string {
    return super.subscribe(eventType, handler, { priority });
  }

  /**
   * Emit with source parameter for backward compatibility
   */
  async emit<T extends EditorEvent>(event: T, source?: string): Promise<void> {
    if (source && !event.source) {
      event.source = source;
    }
    // Call parent emit synchronously
    super.emit(event);
  }

  // All other methods are inherited from SharedEventBus
}