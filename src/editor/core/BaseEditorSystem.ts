import { EditorEventBus, EditorEventPriority } from './EditorEventBus';
import { EditorEvent, EditorEventHandler } from '../events/EditorEventTypes';

/**
 * Abstract base class for all editor systems, providing event-aware functionality
 */
export abstract class BaseEditorSystem {
  protected eventBus: EditorEventBus;
  protected subscriptions: string[] = [];
  protected isActive = false;
  protected systemName: string;

  constructor(systemName: string) {
    this.systemName = systemName;
    this.eventBus = EditorEventBus.getInstance();
  }

  /**
   * Initialize the system
   */
  async initialize(): Promise<void> {
    this.isActive = true;
    await this.onInitialize();
  }

  /**
   * Update the system (called each frame if needed)
   */
  update(deltaTime: number): void {
    if (!this.isActive) return;
    this.onUpdate(deltaTime);
  }

  /**
   * Render the system (if applicable)
   */
  render(context: CanvasRenderingContext2D): void {
    if (!this.isActive) return;
    this.onRender(context);
  }

  /**
   * Destroy the system and clean up resources
   */
  destroy(): void {
    this.isActive = false;
    this.cleanup();
    this.onDestroy();
  }

  /**
   * Subscribe to an event with automatic cleanup
   */
  protected subscribe<T extends EditorEvent>(
    eventType: T['type'],
    handler: EditorEventHandler<T>,
    priority: EditorEventPriority = EditorEventPriority.NORMAL
  ): void {
    const subscriptionId = this.eventBus.subscribe(eventType, handler, priority);
    this.subscriptions.push(subscriptionId);
  }

  /**
   * Emit an event
   */
  protected emit<T extends EditorEvent>(event: T): Promise<void> {
    return this.eventBus.emit(event, this.systemName);
  }

  /**
   * Get system information for debugging
   */
  getSystemInfo(): object {
    return {
      name: this.systemName,
      isActive: this.isActive,
      subscriptionCount: this.subscriptions.length,
    };
  }

  /**
   * Clean up all subscriptions
   */
  private cleanup(): void {
    this.subscriptions.forEach(subscriptionId => {
      this.eventBus.unsubscribe(subscriptionId);
    });
    this.subscriptions = [];
  }

  // Abstract methods to be implemented by derived classes
  protected abstract onInitialize(): Promise<void>;
  protected abstract onUpdate(deltaTime: number): void;
  protected abstract onRender(context: CanvasRenderingContext2D): void;
  protected abstract onDestroy(): void;
}