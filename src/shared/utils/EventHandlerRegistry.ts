/**
 * EventHandlerRegistry - Simplified bulk event subscription management
 * 
 * Provides a fluent builder API for registering multiple event handlers
 * with automatic cleanup, namespace grouping, and priority support.
 * 
 * @example
 * const registry = new EventHandlerRegistry(eventBus)
 *   .withNamespace('ScrewManager')
 *   .on('screw:clicked', this.handleScrewClick)
 *   .on('screw:removed', this.handleScrewRemoved)
 *   .on('game:started', this.handleGameStart, { priority: 100 })
 *   .register();
 * 
 * // Later, clean up all handlers
 * registry.unregisterAll();
 */

import { BaseEvent } from '@/shared/events';
import { SharedEventBus } from '@/shared/events/SharedEventBus';
import { EventHandler, EventSubscriptionOptions } from '@/shared/events';
import { GameEvent } from '@/game/events/EventTypes';
import { DebugLogger } from './DebugLogger';
import { DEBUG_CONFIG } from './Constants';

/**
 * Registration entry for a single event handler
 */
interface HandlerRegistration<T extends BaseEvent = BaseEvent> {
  eventType: T['type'];
  handler: EventHandler<T>;
  options?: EventSubscriptionOptions;
  subscriptionId?: string;
}

/**
 * Registry statistics for debugging
 */
export interface RegistryStats {
  namespace: string;
  totalHandlers: number;
  activeHandlers: number;
  handlersByEvent: Map<string, number>;
}

/**
 * EventHandlerRegistry class for managing bulk event subscriptions
 */
export class EventHandlerRegistry {
  private eventBus: SharedEventBus;
  private namespace: string = 'default';
  private registrations: HandlerRegistration[] = [];
  private isRegistered = false;
  private debugMode = false;

  constructor(eventBus: SharedEventBus) {
    this.eventBus = eventBus;
  }

  /**
   * Set namespace for this registry (for debugging and grouping)
   */
  withNamespace(namespace: string): this {
    if (this.isRegistered) {
      throw new Error('Cannot change namespace after registration');
    }
    this.namespace = namespace;
    return this;
  }

  /**
   * Enable debug mode for this registry
   */
  withDebug(enabled = true): this {
    this.debugMode = enabled;
    return this;
  }

  /**
   * Register an event handler with optional priority
   * 
   * @example
   * registry.on('screw:clicked', this.handleClick)
   * registry.on('game:started', this.handleStart, { priority: 100 })
   */
  on<T extends GameEvent>(
    eventType: T['type'],
    handler: EventHandler<T>,
    options?: EventSubscriptionOptions
  ): this {
    if (this.isRegistered) {
      throw new Error('Cannot add handlers after registration. Call unregisterAll() first.');
    }

    this.registrations.push({
      eventType,
      handler: handler as EventHandler<BaseEvent>,
      options
    });

    if (this.debugMode || DEBUG_CONFIG.logEventFlow) {
      DebugLogger.logEvent(`[${this.namespace}] Queued handler for ${eventType}`);
    }

    return this;
  }

  /**
   * Register an event handler that only fires once
   */
  once<T extends GameEvent>(
    eventType: T['type'],
    handler: EventHandler<T>
  ): this {
    return this.on(eventType, handler, { once: true });
  }

  /**
   * Register handlers for multiple events with the same handler
   * 
   * @example
   * registry.onMany(['shape:created', 'shape:destroyed'], this.handleShapeChange)
   */
  onMany<T extends GameEvent>(
    eventTypes: T['type'][],
    handler: EventHandler<T>,
    options?: EventSubscriptionOptions
  ): this {
    eventTypes.forEach(eventType => {
      this.on(eventType, handler, options);
    });
    return this;
  }

  /**
   * Register a handler with a filter predicate
   * 
   * @example
   * registry.onFiltered('screw:clicked', 
   *   (event) => event.forceRemoval === true,
   *   this.handleForceRemoval
   * )
   */
  onFiltered<T extends GameEvent>(
    eventType: T['type'],
    filter: (event: T) => boolean,
    handler: EventHandler<T>,
    options?: EventSubscriptionOptions
  ): this {
    const filteredHandler: EventHandler<T> = (event) => {
      if (filter(event)) {
        handler(event);
      }
    };
    return this.on(eventType, filteredHandler, options);
  }

  /**
   * Register a debounced event handler
   * 
   * @example
   * registry.onDebounced('progress:updated', 500, this.handleProgress)
   */
  onDebounced<T extends GameEvent>(
    eventType: T['type'],
    delayMs: number,
    handler: EventHandler<T>,
    options?: EventSubscriptionOptions
  ): this {
    let timeoutId: NodeJS.Timeout | null = null;
    
    const debouncedHandler: EventHandler<T> = (event) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        handler(event);
        timeoutId = null;
      }, delayMs);
    };

    return this.on(eventType, debouncedHandler, options);
  }

  /**
   * Register a throttled event handler
   * 
   * @example
   * registry.onThrottled('physics:step:completed', 100, this.handlePhysicsStep)
   */
  onThrottled<T extends GameEvent>(
    eventType: T['type'],
    limitMs: number,
    handler: EventHandler<T>,
    options?: EventSubscriptionOptions
  ): this {
    let lastCall = 0;
    
    const throttledHandler: EventHandler<T> = (event) => {
      const now = Date.now();
      if (now - lastCall >= limitMs) {
        lastCall = now;
        handler(event);
      }
    };

    return this.on(eventType, throttledHandler, options);
  }

  /**
   * Register all queued handlers with the event bus
   */
  register(): this {
    if (this.isRegistered) {
      throw new Error('Registry is already registered');
    }

    if (this.registrations.length === 0) {
      console.warn(`[${this.namespace}] No handlers to register`);
      return this;
    }

    // Register all handlers
    this.registrations.forEach(registration => {
      const subscriptionId = this.eventBus.subscribe(
        registration.eventType,
        registration.handler,
        registration.options
      );
      registration.subscriptionId = subscriptionId;
    });

    this.isRegistered = true;

    if (this.debugMode || DEBUG_CONFIG.logEventFlow) {
      const stats = this.getStats();
      DebugLogger.logEvent(
        `[${this.namespace}] Registered ${stats.totalHandlers} handlers for ${stats.handlersByEvent.size} event types`
      );
    }

    return this;
  }

  /**
   * Unregister a specific event type
   */
  unregister(eventType: string): boolean {
    if (!this.isRegistered) {
      return false;
    }

    let unregisteredCount = 0;
    this.registrations = this.registrations.filter(reg => {
      if (reg.eventType === eventType && reg.subscriptionId) {
        this.eventBus.unsubscribe(reg.subscriptionId);
        unregisteredCount++;
        return false;
      }
      return true;
    });

    if (this.debugMode || DEBUG_CONFIG.logEventFlow) {
      DebugLogger.logEvent(
        `[${this.namespace}] Unregistered ${unregisteredCount} handlers for ${eventType}`
      );
    }

    return unregisteredCount > 0;
  }

  /**
   * Unregister all handlers
   */
  unregisterAll(): void {
    if (!this.isRegistered) {
      return;
    }

    let unregisteredCount = 0;
    this.registrations.forEach(registration => {
      if (registration.subscriptionId) {
        this.eventBus.unsubscribe(registration.subscriptionId);
        unregisteredCount++;
      }
    });

    this.registrations = [];
    this.isRegistered = false;

    if (this.debugMode || DEBUG_CONFIG.logEventFlow) {
      DebugLogger.logEvent(
        `[${this.namespace}] Unregistered all ${unregisteredCount} handlers`
      );
    }
  }

  /**
   * Get statistics about this registry
   */
  getStats(): RegistryStats {
    const handlersByEvent = new Map<string, number>();
    
    this.registrations.forEach(reg => {
      const count = handlersByEvent.get(reg.eventType) || 0;
      handlersByEvent.set(reg.eventType, count + 1);
    });

    return {
      namespace: this.namespace,
      totalHandlers: this.registrations.length,
      activeHandlers: this.registrations.filter(r => r.subscriptionId).length,
      handlersByEvent
    };
  }

  /**
   * Check if registry is currently registered
   */
  isActive(): boolean {
    return this.isRegistered;
  }

  /**
   * Get list of all registered event types
   */
  getEventTypes(): string[] {
    return [...new Set(this.registrations.map(r => r.eventType))];
  }

  /**
   * Create a sub-registry that inherits namespace and debug settings
   * Useful for organizing handlers into logical groups
   * 
   * @example
   * const mainRegistry = new EventHandlerRegistry(eventBus)
   *   .withNamespace('GameManager');
   * 
   * const inputRegistry = mainRegistry.createSubRegistry('Input')
   *   .on('screw:clicked', this.handleClick)
   *   .register();
   * 
   * const stateRegistry = mainRegistry.createSubRegistry('State')
   *   .on('game:started', this.handleStart)
   *   .register();
   */
  createSubRegistry(subNamespace: string): EventHandlerRegistry {
    const subRegistry = new EventHandlerRegistry(this.eventBus)
      .withNamespace(`${this.namespace}.${subNamespace}`);
    
    if (this.debugMode) {
      subRegistry.withDebug();
    }
    
    return subRegistry;
  }
}

/**
 * Global registry manager for debugging and inspection
 */
export class RegistryManager {
  private static registries = new Map<string, EventHandlerRegistry>();

  /**
   * Track a registry for global debugging
   */
  static track(registry: EventHandlerRegistry): void {
    const stats = registry.getStats();
    this.registries.set(stats.namespace, registry);
  }

  /**
   * Get all tracked registries
   */
  static getAll(): Map<string, EventHandlerRegistry> {
    return new Map(this.registries);
  }

  /**
   * Get combined stats for all registries
   */
  static getAllStats(): RegistryStats[] {
    return Array.from(this.registries.values()).map(r => r.getStats());
  }

  /**
   * Clear all tracked registries
   */
  static clear(): void {
    this.registries.clear();
  }

  /**
   * Log debug information about all registries
   */
  static logDebugInfo(): void {
    const allStats = this.getAllStats();
    console.group('🔍 EventHandlerRegistry Debug Info');
    
    allStats.forEach(stats => {
      console.group(`📦 ${stats.namespace}`);
      console.log(`Total handlers: ${stats.totalHandlers}`);
      console.log(`Active handlers: ${stats.activeHandlers}`);
      console.log('Handlers by event:');
      stats.handlersByEvent.forEach((count, eventType) => {
        console.log(`  ${eventType}: ${count}`);
      });
      console.groupEnd();
    });
    
    console.groupEnd();
  }
}