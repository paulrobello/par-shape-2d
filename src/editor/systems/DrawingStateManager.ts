import { BaseEditorSystem } from '../core/BaseEditorSystem';
import type {
  EditorDrawingStartedEvent,
  EditorDrawingProgressEvent,
  EditorDrawingCompletedEvent,
  EditorDrawingCancelledEvent,
  EditorDrawingStateChangedEvent,
  EditorEvent,
  EditorEventHandler,
} from '../events/EditorEventTypes';

export interface DrawingSession {
  toolName: string;
  startTime: number;
  currentState: string;
  stepCount: number;
  points: Array<{ x: number; y: number; timestamp: number }>;
  isActive: boolean;
}

export class DrawingStateManager extends BaseEditorSystem {
  private currentSession: DrawingSession | null = null;
  private sessionHistory: DrawingSession[] = [];

  constructor() {
    super('DrawingStateManager');
    this.setupEventListeners();
  }

  protected async onInitialize(): Promise<void> {
    // No initialization needed for DrawingStateManager
  }

  protected onUpdate(deltaTime: number): void {
    // No frame-based updates needed for DrawingStateManager
    void deltaTime; // Using deltaTime to avoid unused parameter warning
  }

  protected onRender(context: CanvasRenderingContext2D): void {
    // DrawingStateManager doesn't render anything
    void context; // Using context to avoid unused parameter warning
  }

  protected onDestroy(): void {
    // Cleanup is handled in the destroy() method
  }

  private setupEventListeners(): void {
    this.subscribe('editor:drawing:started', this.handleDrawingStarted.bind(this));
    this.subscribe('editor:drawing:progress', this.handleDrawingProgress.bind(this));
    this.subscribe('editor:drawing:completed', this.handleDrawingCompleted.bind(this));
    this.subscribe('editor:drawing:cancelled', this.handleDrawingCancelled.bind(this));
    this.subscribe('editor:drawing:state:changed', this.handleDrawingStateChanged.bind(this));
  }

  private handleDrawingStarted(event: EditorDrawingStartedEvent): void {
    const { toolName, startPoint } = event.payload;

    this.currentSession = {
      toolName,
      startTime: Date.now(),
      currentState: 'started',
      stepCount: 1,
      points: [{ 
        x: startPoint.x, 
        y: startPoint.y, 
        timestamp: Date.now() 
      }],
      isActive: true
    };
  }

  private handleDrawingProgress(event: EditorDrawingProgressEvent): void {
    if (!this.currentSession) return;

    const { point, step } = event.payload;

    this.currentSession.stepCount = step;
    this.currentSession.points.push({
      x: point.x,
      y: point.y,
      timestamp: Date.now()
    });
  }

  private handleDrawingCompleted(event: EditorDrawingCompletedEvent): void {
    if (!this.currentSession) return;

    this.currentSession.isActive = false;
    this.currentSession.currentState = 'completed';
    
    // Archive the session
    this.sessionHistory.push({ ...this.currentSession });
    this.currentSession = null;

    // Limit history size
    if (this.sessionHistory.length > 50) {
      this.sessionHistory = this.sessionHistory.slice(-50);
    }
    
    void event; // Using event to avoid unused parameter warning
  }

  private handleDrawingCancelled(event: EditorDrawingCancelledEvent): void {
    if (!this.currentSession) return;

    this.currentSession.isActive = false;
    this.currentSession.currentState = `cancelled_${event.payload.reason}`;
    
    // Archive the session
    this.sessionHistory.push({ ...this.currentSession });
    this.currentSession = null;
  }

  private handleDrawingStateChanged(event: EditorDrawingStateChangedEvent): void {
    if (!this.currentSession) return;

    this.currentSession.currentState = event.payload.state;
    void event; // Using event to avoid unused parameter warning
  }

  /**
   * Get the current drawing session
   */
  public getCurrentSession(): DrawingSession | null {
    return this.currentSession ? { ...this.currentSession } : null;
  }

  /**
   * Check if there's an active drawing session
   */
  public hasActiveSession(): boolean {
    return this.currentSession?.isActive || false;
  }

  /**
   * Get the current tool being used for drawing
   */
  public getCurrentTool(): string | null {
    return this.currentSession?.toolName || null;
  }

  /**
   * Get the current drawing state
   */
  public getCurrentState(): string | null {
    return this.currentSession?.currentState || null;
  }

  /**
   * Get the number of steps in current drawing
   */
  public getCurrentStepCount(): number {
    return this.currentSession?.stepCount || 0;
  }

  /**
   * Get drawing session history
   */
  public getSessionHistory(limit?: number): DrawingSession[] {
    const history = [...this.sessionHistory];
    return limit ? history.slice(-limit) : history;
  }

  /**
   * Get statistics about drawing sessions
   */
  public getSessionStats(): {
    totalSessions: number;
    completedSessions: number;
    cancelledSessions: number;
    toolUsage: Record<string, number>;
    averageSteps: number;
  } {
    const total = this.sessionHistory.length;
    const completed = this.sessionHistory.filter(s => s.currentState === 'completed').length;
    const cancelled = this.sessionHistory.filter(s => s.currentState.startsWith('cancelled')).length;
    
    const toolUsage: Record<string, number> = {};
    let totalSteps = 0;

    for (const session of this.sessionHistory) {
      toolUsage[session.toolName] = (toolUsage[session.toolName] || 0) + 1;
      totalSteps += session.stepCount;
    }

    return {
      totalSessions: total,
      completedSessions: completed,
      cancelledSessions: cancelled,
      toolUsage,
      averageSteps: total > 0 ? totalSteps / total : 0
    };
  }

  /**
   * Clear session history
   */
  public clearHistory(): void {
    this.sessionHistory = [];
  }

  /**
   * Force end current session (emergency cleanup)
   */
  public forceEndSession(reason: string = 'forced'): void {
    if (this.currentSession) {
      this.currentSession.isActive = false;
      this.currentSession.currentState = `cancelled_${reason}`;
      
      this.sessionHistory.push({ ...this.currentSession });
      this.currentSession = null;
    }
  }

  /**
   * Get user instruction for current drawing state
   */
  public getCurrentInstruction(): string {
    if (!this.currentSession) {
      return 'Select a tool to start drawing';
    }

    const { toolName, stepCount } = this.currentSession;

    // Tool-specific instructions based on state
    switch (toolName) {
      case 'circle':
      case 'polygon':
        if (stepCount === 1) return 'Click to set the center point';
        if (stepCount === 2) return 'Click to set the radius';
        break;
        
      case 'rectangle':
      case 'square':
        if (stepCount === 1) return 'Click to set the first corner';
        if (stepCount === 2) return 'Click to set the opposite corner';
        break;
        
      case 'capsule':
        if (stepCount === 1) return 'Click to set the first end point';
        if (stepCount === 2) return 'Click to set the second end point';
        if (stepCount === 3) return 'Click to set the thickness';
        break;
        
      case 'path':
        if (stepCount === 1) return 'Click to start the path';
        return 'Click to add points, click on start point to close';
        
      default:
        return `Drawing with ${toolName}...`;
    }

    return 'Continue drawing...';
  }

  /**
   * Subscribe to events externally (for UI components)
   */
  public subscribeToEvent<T extends EditorEvent>(
    eventType: T['type'], 
    handler: EditorEventHandler<T>
  ): () => void {
    const subscriptionId = this.eventBus.subscribe(eventType, handler);
    return () => this.eventBus.unsubscribe(subscriptionId);
  }

  public destroy(): void {
    this.forceEndSession('system_shutdown');
    this.currentSession = null;
    this.sessionHistory = [];
    super.destroy();
  }
}