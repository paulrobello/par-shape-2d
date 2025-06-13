/**
 * Utility functions for consistent event emission patterns
 */

import { BaseEvent } from '@/shared/events';

export class EventEmissionUtils {
  /**
   * Creates an event with automatic timestamp
   */
  static createTimestampedEvent<T extends BaseEvent>(
    type: string,
    additionalData: Omit<T, 'type' | 'timestamp'> = {} as Omit<T, 'type' | 'timestamp'>
  ): T {
    return {
      type,
      timestamp: Date.now(),
      ...additionalData
    } as T;
  }

  /**
   * Emits an event with automatic timestamp and source
   */
  static emitTimestampedEvent<T extends BaseEvent>(
    emitter: { emit: (event: T) => void },
    type: string,
    source?: string,
    additionalData: Omit<T, 'type' | 'timestamp' | 'source'> = {} as Omit<T, 'type' | 'timestamp' | 'source'>
  ): void {
    const event = {
      type,
      timestamp: Date.now(),
      source,
      ...additionalData
    } as T;
    
    emitter.emit(event);
  }

  /**
   * Creates a save/restore request event
   */
  static createSaveRestoreEvent(type: 'save:requested' | 'restore:requested'): BaseEvent {
    return {
      type,
      timestamp: Date.now()
    };
  }

  /**
   * Creates a completion event with success/error handling
   */
  static createCompletionEvent(
    baseType: string,
    success: boolean,
    error?: string
  ): BaseEvent & { success: boolean; error?: string } {
    return {
      type: `${baseType}:completed`,
      timestamp: Date.now(),
      success,
      error
    };
  }

  /**
   * Creates a state changed event
   */
  static createStateChangeEvent(
    domain: string,
    hasUnsavedChanges: boolean
  ): BaseEvent & { hasUnsavedChanges: boolean } {
    return {
      type: `${domain}:state:changed`,
      timestamp: Date.now(),
      hasUnsavedChanges
    };
  }
}