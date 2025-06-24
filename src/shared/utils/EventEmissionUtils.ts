/**
 * Utility functions for consistent event emission patterns
 * 
 * This enhanced version supports all game event types with full type safety
 * using TypeScript generics and discriminated unions.
 */

import { BaseEvent } from '@/shared/events';
import { SharedEventBus } from '@/shared/events/SharedEventBus';
import { 
  GameEvent,
  SystemErrorEvent,
  PhysicsErrorEvent,
  SaveErrorEvent,
  SystemInitializedEvent,
  ScoreUpdatedEvent,
  ProgressUpdatedEvent,
  SaveRequestedEvent,
  SaveCompletedEvent,
  RestoreCompletedEvent,
  BoundsChangedEvent
} from '@/game/events/EventTypes';

/**
 * Generic event emitter interface
 */
export interface EventEmitter {
  emit(event: BaseEvent): void;
}

/**
 * Enhanced EventEmissionUtils with support for all game event types
 */
export class EventEmissionUtils {
  /**
   * Generic event creation with full type safety
   * 
   * @example
   * const event = EventEmissionUtils.createEvent('screw:clicked', {
   *   screw: myScrewInstance,
   *   position: { x: 100, y: 200 }
   * });
   */
  static createEvent<T extends GameEvent>(
    type: T['type'],
    payload?: Omit<T, 'type' | 'timestamp'>
  ): T {
    return {
      type,
      timestamp: Date.now(),
      ...(payload || {})
    } as T;
  }

  /**
   * Generic event emission with full type safety
   * 
   * @example
   * EventEmissionUtils.emit(eventBus, 'container:filled', {
   *   containerIndex: 0,
   *   color: 'red',
   *   screws: ['screw1', 'screw2']
   * });
   */
  static emit<T extends GameEvent>(
    eventBus: EventEmitter | SharedEventBus,
    type: T['type'],
    payload?: Omit<T, 'type' | 'timestamp'>
  ): void {
    const event = this.createEvent<T>(type, payload);
    eventBus.emit(event);
  }

  /**
   * Create and emit a system error event
   * 
   * @example
   * EventEmissionUtils.emitSystemError(eventBus, 'GameManager', new Error('Failed'), 'high', false);
   */
  static emitSystemError(
    eventBus: EventEmitter | SharedEventBus,
    system: string,
    error: Error,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    recoverable = true
  ): void {
    this.emit<SystemErrorEvent>(eventBus, 'system:error', {
      system,
      error,
      severity,
      recoverable
    });
  }

  /**
   * Create and emit a physics error event
   * 
   * @example
   * EventEmissionUtils.emitPhysicsError(eventBus, new Error('Constraint failed'), 'body123', 'constraint456');
   */
  static emitPhysicsError(
    eventBus: EventEmitter | SharedEventBus,
    error: Error,
    bodyId?: string,
    constraintId?: string
  ): void {
    this.emit<PhysicsErrorEvent>(eventBus, 'physics:error', {
      error,
      bodyId,
      constraintId
    });
  }

  /**
   * Create and emit a save error event
   * 
   * @example
   * EventEmissionUtils.emitSaveError(eventBus, new Error('Storage full'), 'save', false);
   */
  static emitSaveError(
    eventBus: EventEmitter | SharedEventBus,
    error: Error,
    operation: 'save' | 'restore' = 'save',
    recoverable = true
  ): void {
    this.emit<SaveErrorEvent>(eventBus, 'save:error', {
      error,
      operation,
      recoverable
    });
  }

  /**
   * Create and emit a system initialization event
   * 
   * @example
   * EventEmissionUtils.emitSystemInitialized(eventBus, 'GameManager');
   */
  static emitSystemInitialized(
    eventBus: EventEmitter | SharedEventBus,
    systemName: string
  ): void {
    this.emit<SystemInitializedEvent>(eventBus, 'system:initialized', { systemName });
  }

  /**
   * Create and emit a state update event with callback
   * 
   * @example
   * EventEmissionUtils.emitWithCallback(eventBus, 'remaining:screws:requested', 
   *   (visibleScrews, totalScrews, visibleColors) => {
   *     // Handle response
   *   }
   * );
   */
  static emitWithCallback<T extends GameEvent & { callback: (...args: unknown[]) => unknown }>(
    eventBus: EventEmitter | SharedEventBus,
    type: T['type'],
    callback: T['callback'],
    additionalPayload?: Omit<T, 'type' | 'timestamp' | 'callback'>
  ): void {
    const payload = {
      callback,
      ...(additionalPayload || {})
    } as Omit<T, 'type' | 'timestamp'>;
    
    this.emit<T>(eventBus, type, payload);
  }

  /**
   * Create and emit a score update event
   * 
   * @example
   * EventEmissionUtils.emitScoreUpdate(eventBus, 100, 1500, 'screw_collected');
   */
  static emitScoreUpdate(
    eventBus: EventEmitter | SharedEventBus,
    points: number,
    total: number,
    reason: 'screw_collected' | 'level_transition_completed' | 'bonus' | 'container_removed'
  ): void {
    this.emit<ScoreUpdatedEvent>(eventBus, 'score:updated', { points, total, reason });
  }

  /**
   * Create and emit a progress update event
   * 
   * @example
   * EventEmissionUtils.emitProgressUpdate(eventBus, 50, 15, 30);
   */
  static emitProgressUpdate(
    eventBus: EventEmitter | SharedEventBus,
    totalScrews: number,
    screwsInContainer: number,
    progress: number
  ): void {
    this.emit<ProgressUpdatedEvent>(eventBus, 'progress:updated', {
      totalScrews,
      screwsInContainer,
      progress
    });
  }

  /**
   * Batch emit multiple events efficiently
   * 
   * @example
   * EventEmissionUtils.batchEmit(eventBus, [
   *   { type: 'screw:removed', payload: { screw, shape } },
   *   { type: 'screw:animation:started', payload: { screw, targetPosition } }
   * ]);
   */
  static batchEmit(
    eventBus: EventEmitter | SharedEventBus,
    events: Array<{ type: GameEvent['type']; payload?: Record<string, unknown> }>
  ): void {
    for (const { type, payload } of events) {
      this.emit(eventBus, type, payload);
    }
  }

  /**
   * Create a delayed event emission
   * 
   * @example
   * await EventEmissionUtils.emitDelayed(eventBus, 'container:all_removed', 500);
   */
  static emitDelayed(
    eventBus: EventEmitter | SharedEventBus,
    type: GameEvent['type'],
    delayMs: number,
    payload?: Record<string, unknown>
  ): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.emit(eventBus, type, payload);
        resolve();
      }, delayMs);
    });
  }

  /**
   * Create an event emitter helper for a specific system
   * 
   * @example
   * const emitter = EventEmissionUtils.createSystemEmitter(eventBus, 'ScrewManager');
   * emitter('screw:clicked', { screw, position });
   */
  static createSystemEmitter(
    eventBus: EventEmitter | SharedEventBus,
    systemName: string
  ): <T extends GameEvent>(type: T['type'], payload?: Omit<T, 'type' | 'timestamp'>) => void {
    return <T extends GameEvent>(type: T['type'], payload?: Omit<T, 'type' | 'timestamp'>) => {
      const enhancedPayload = {
        ...payload,
        source: systemName
      } as Omit<T, 'type' | 'timestamp'>;
      this.emit<T>(eventBus, type, enhancedPayload);
    };
  }

  /**
   * Create and emit a save request event
   * 
   * @example
   * EventEmissionUtils.emitSaveRequest(eventBus, 'manual');
   */
  static emitSaveRequest(
    eventBus: EventEmitter | SharedEventBus,
    trigger: 'auto' | 'manual' | 'level_change' | 'game_over'
  ): void {
    this.emit<SaveRequestedEvent>(eventBus, 'save:requested', { trigger });
  }

  /**
   * Create and emit a save completed event
   * 
   * @example
   * EventEmissionUtils.emitSaveCompleted(eventBus, true);
   * EventEmissionUtils.emitSaveCompleted(eventBus, false, 'Storage full');
   */
  static emitSaveCompleted(
    eventBus: EventEmitter | SharedEventBus,
    success: boolean,
    error?: string
  ): void {
    this.emit<SaveCompletedEvent>(eventBus, 'save:completed', { success, error });
  }

  /**
   * Create and emit a restore completed event
   * 
   * @example
   * EventEmissionUtils.emitRestoreCompleted(eventBus, true);
   */
  static emitRestoreCompleted(
    eventBus: EventEmitter | SharedEventBus,
    success: boolean,
    error?: string
  ): void {
    this.emit<RestoreCompletedEvent>(eventBus, 'restore:completed', { success, error });
  }

  /**
   * Create and emit a bounds changed event
   * 
   * @example
   * EventEmissionUtils.emitBoundsChanged(eventBus, 800, 600, 1.5, 200);
   */
  static emitBoundsChanged(
    eventBus: EventEmitter | SharedEventBus,
    width: number,
    height: number,
    scale: number,
    shapeAreaStartY?: number
  ): void {
    this.emit<BoundsChangedEvent>(eventBus, 'bounds:changed', { width, height, scale, shapeAreaStartY });
  }
}

/**
 * Type-safe event builder for complex events
 * 
 * @example
 * const builder = new EventBuilder<ScrewClickedEvent>('screw:clicked')
 *   .withPayload({ screw: myScrewInstance })
 *   .withPayload({ position: { x: 100, y: 200 } })
 *   .build();
 */
export class EventBuilder<T extends GameEvent> {
  private event: Partial<T>;

  constructor(type: T['type']) {
    this.event = {
      type,
      timestamp: Date.now()
    } as Partial<T>;
  }

  withPayload(payload: Partial<Omit<T, 'type' | 'timestamp'>>): this {
    Object.assign(this.event, payload);
    return this;
  }

  build(): T {
    return this.event as T;
  }

  emit(eventBus: EventEmitter | SharedEventBus): void {
    eventBus.emit(this.build());
  }
}