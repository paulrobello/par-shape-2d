/**
 * Base class for all game systems that use the event bus
 */

import { eventBus } from '../events/EventBus';
import { GameEvent } from '../events/EventTypes';
import { EventHandler, EventSubscriptionOptions } from '@/shared/events';
import { DEBUG_CONFIG } from '@/shared/utils/Constants';

export abstract class BaseSystem {
  protected systemName: string;
  private subscriptionIds: string[] = [];
  private isInitialized = false;
  private isDestroyed = false;

  constructor(systemName: string) {
    this.systemName = systemName;
  }

  /**
   * Initialize the system - called once when system is created
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn(`System ${this.systemName} is already initialized`);
      return;
    }

    try {
      await this.onInitialize();
      this.isInitialized = true;
      if (DEBUG_CONFIG.logSystemLifecycle) {
        console.log(`System ${this.systemName} initialized successfully`);
      }
    } catch (error) {
      console.error(`Failed to initialize system ${this.systemName}:`, error);
      throw error;
    }
  }

  /**
   * Destroy the system and clean up resources
   */
  destroy(): void {
    if (this.isDestroyed) {
      console.warn(`System ${this.systemName} is already destroyed`);
      return;
    }

    try {
      this.onDestroy();
      this.unsubscribeAll();
      this.isDestroyed = true;
      if (DEBUG_CONFIG.logSystemLifecycle) {
        console.log(`System ${this.systemName} destroyed successfully`);
      }
    } catch (error) {
      console.error(`Error destroying system ${this.systemName}:`, error);
    }
  }

  /**
   * Check if system is initialized
   */
  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Check if system is destroyed
   */
  getIsDestroyed(): boolean {
    return this.isDestroyed;
  }

  /**
   * Subscribe to an event with automatic cleanup
   */
  protected subscribe<T extends GameEvent>(
    eventType: T['type'],
    handler: EventHandler<T>,
    options: EventSubscriptionOptions = {}
  ): string {
    if (this.isDestroyed) {
      throw new Error(`Cannot subscribe to events on destroyed system: ${this.systemName}`);
    }

    // Add system source to options
    const subscriptionOptions: EventSubscriptionOptions = {
      ...options,
      source: options.source || this.systemName
    };

    const subscriptionId = eventBus.subscribe(eventType, handler, subscriptionOptions);
    this.subscriptionIds.push(subscriptionId);
    
    return subscriptionId;
  }

  /**
   * Unsubscribe from a specific event
   */
  protected unsubscribe(subscriptionId: string): boolean {
    const index = this.subscriptionIds.indexOf(subscriptionId);
    if (index !== -1) {
      this.subscriptionIds.splice(index, 1);
      return eventBus.unsubscribe(subscriptionId);
    }
    return false;
  }

  /**
   * Unsubscribe from all events
   */
  protected unsubscribeAll(): void {
    this.subscriptionIds.forEach(id => eventBus.unsubscribe(id));
    this.subscriptionIds.length = 0;
  }

  /**
   * Emit an event
   */
  protected emit(event: GameEvent): void {
    // Add system source if not already present
    if (!event.source) {
      event.source = this.systemName;
    }
    
    eventBus.emit(event);
  }

  /**
   * Emit an event asynchronously
   */
  protected emitAsync(event: GameEvent): void {
    // Add system source if not already present
    if (!event.source) {
      event.source = this.systemName;
    }
    
    eventBus.emitAsync(event);
  }

  /**
   * Wait for a specific event
   */
  protected waitFor<T extends GameEvent>(
    eventType: T['type'],
    timeout: number = 5000,
    filter?: (event: T) => boolean
  ): Promise<T> {
    return eventBus.waitFor(eventType, timeout, filter);
  }

  /**
   * Get system status for debugging
   */
  getSystemInfo(): {
    name: string;
    initialized: boolean;
    destroyed: boolean;
    subscriptionCount: number;
  } {
    return {
      name: this.systemName,
      initialized: this.isInitialized,
      destroyed: this.isDestroyed,
      subscriptionCount: this.subscriptionIds.length
    };
  }

  /**
   * Template method - override in derived classes
   */
  protected abstract onInitialize(): Promise<void> | void;

  /**
   * Template method - override in derived classes for cleanup
   */
  protected onDestroy(): void {
    // Default implementation - override if needed
  }

  /**
   * Update method - called each frame for systems that need updates
   * Override in derived classes if needed
   */
  update(deltaTime: number): void {
    // Default implementation - override if needed
    void deltaTime;
  }

  /**
   * Render method - called each frame for systems that need rendering
   * Override in derived classes if needed
   */
  render(context: CanvasRenderingContext2D): void {
    // Default implementation - override if needed
    void context;
  }

  /**
   * Helper method to safely execute code only if system is active
   */
  protected executeIfActive<T>(fn: () => T): T | undefined {
    if (this.isDestroyed) {
      console.warn(`Attempted to execute code on destroyed system: ${this.systemName}`);
      return undefined;
    }
    
    if (!this.isInitialized) {
      console.warn(`Attempted to execute code on uninitialized system: ${this.systemName}`);
      return undefined;
    }
    
    return fn();
  }

  /**
   * Helper method to safely execute async code only if system is active
   */
  protected async executeIfActiveAsync<T>(fn: () => Promise<T>): Promise<T | undefined> {
    if (this.isDestroyed) {
      console.warn(`Attempted to execute async code on destroyed system: ${this.systemName}`);
      return undefined;
    }
    
    if (!this.isInitialized) {
      console.warn(`Attempted to execute async code on uninitialized system: ${this.systemName}`);
      return undefined;
    }
    
    return await fn();
  }
}