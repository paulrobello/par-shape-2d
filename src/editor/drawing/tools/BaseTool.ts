import { BaseEditorSystem } from '../../core/BaseEditorSystem';
import type { Point } from '../../systems/GridManager';
import type { ShapeDefinition } from '@/types/shapes';

export interface DrawingState {
  name: string;
  step: number;
  canProgress: boolean;
  instruction: string;
  data?: unknown;
}

export interface ToolConfiguration {
  name: string;
  displayName: string;
  cursor: string;
  icon?: string;
  description?: string;
}

export abstract class BaseTool extends BaseEditorSystem {
  protected currentState: DrawingState;
  protected isActive: boolean = false;
  protected isDrawing: boolean = false;

  constructor(
    public readonly config: ToolConfiguration,
    protected initialState: DrawingState
  ) {
    super(config.name);
    this.currentState = { ...initialState };
  }

  /**
   * Get tool configuration
   */
  public getConfig(): ToolConfiguration {
    return { ...this.config };
  }

  /**
   * Get current drawing state
   */
  public getState(): DrawingState {
    return { ...this.currentState };
  }

  /**
   * Check if tool is currently active
   */
  public isToolActive(): boolean {
    return this.isActive;
  }

  /**
   * Check if tool is currently drawing
   */
  public isCurrentlyDrawing(): boolean {
    return this.isDrawing;
  }

  /**
   * Activate the tool
   */
  public activate(): void {
    if (this.isActive) return;
    
    this.isActive = true;
    this.isDrawing = false;
    this.resetState();
    this.onActivate();
    
    this.emit({
      type: 'editor:tool:selected',
      payload: {
        toolName: this.config.name,
        previousTool: undefined
      }
    });
  }

  /**
   * Deactivate the tool
   */
  public deactivate(): void {
    if (!this.isActive) return;

    if (this.isDrawing) {
      this.cancelDrawing('tool_change');
    }

    this.isActive = false;
    this.onDeactivate();
  }

  /**
   * Handle mouse down event
   */
  public handleMouseDown(point: Point): void {
    if (!this.isActive) return;

    if (!this.isDrawing) {
      this.startDrawing(point);
    } else {
      this.progressDrawing(point);
    }
  }

  /**
   * Handle mouse move event
   */
  public handleMouseMove(point: Point): void {
    if (!this.isActive) return;

    if (this.isDrawing) {
      this.updatePreview(point);
    }
  }

  /**
   * Handle mouse up event
   */
  public handleMouseUp(point: Point): void {
    if (!this.isActive || !this.isDrawing) return;
    
    // Most tools handle completion on mouse down, but some may need mouse up
    this.onMouseUp(point);
  }

  /**
   * Handle key down event
   */
  public handleKeyDown(key: string): void {
    if (!this.isActive) return;

    if (key === 'Escape' && this.isDrawing) {
      this.cancelDrawing('escape');
    }

    this.onKeyDown(key);
  }

  /**
   * Handle mouse wheel event
   */
  public handleWheel(deltaY: number): void {
    if (!this.isActive) return;

    this.onWheel(deltaY);
  }

  /**
   * Start a new drawing operation
   */
  protected startDrawing(point: Point): void {
    this.isDrawing = true;
    this.resetState();
    
    this.emit({
      type: 'editor:drawing:started',
      payload: {
        toolName: this.config.name,
        startPoint: point
      }
    });

    this.onDrawingStart(point);
  }

  /**
   * Progress the drawing operation
   */
  protected progressDrawing(point: Point): void {
    if (!this.isDrawing) return;

    const result = this.onDrawingProgress(point);
    
    this.emit({
      type: 'editor:drawing:progress',
      payload: {
        toolName: this.config.name,
        step: this.currentState.step,
        point: point,
        data: this.currentState.data
      }
    });

    if (result?.completed && result.shapeDefinition) {
      this.completeDrawing(result.shapeDefinition);
    } else if (result?.newState) {
      this.updateState(result.newState);
    }
  }

  /**
   * Update preview during drawing
   */
  protected updatePreview(point: Point): void {
    if (!this.isDrawing) return;

    const previewData = this.generatePreview(point);
    
    this.emit({
      type: 'editor:drawing:preview:updated',
      payload: {
        toolName: this.config.name,
        previewData: previewData
      }
    });
  }

  /**
   * Complete the drawing operation
   */
  protected completeDrawing(shapeDefinition: ShapeDefinition): void {
    if (!this.isDrawing) return;

    this.isDrawing = false;
    this.resetState();

    this.emit({
      type: 'editor:drawing:completed',
      payload: {
        toolName: this.config.name,
        shapeDefinition: shapeDefinition
      }
    });

    this.onDrawingComplete(shapeDefinition);
  }

  /**
   * Cancel the current drawing operation
   */
  protected cancelDrawing(reason: 'escape' | 'tool_change' | 'user_action'): void {
    if (!this.isDrawing) return;

    this.isDrawing = false;
    this.resetState();

    this.emit({
      type: 'editor:drawing:cancelled',
      payload: {
        toolName: this.config.name,
        reason: reason
      }
    });

    this.onDrawingCancel(reason);
  }

  /**
   * Update the current drawing state
   */
  protected updateState(newState: Partial<DrawingState>): void {
    const previousState = this.currentState.name;
    this.currentState = { ...this.currentState, ...newState };

    this.emit({
      type: 'editor:drawing:state:changed',
      payload: {
        toolName: this.config.name,
        state: this.currentState.name,
        previousState: previousState
      }
    });
  }

  /**
   * Reset state to initial values
   */
  protected resetState(): void {
    this.currentState = { ...this.initialState };
  }

  /**
   * Render the tool's preview or visual feedback
   */
  public abstract render(ctx: CanvasRenderingContext2D): void;

  // Abstract methods for subclasses to implement
  protected abstract onActivate(): void;
  protected abstract onDeactivate(): void;
  protected abstract onMouseUp(point: Point): void;
  protected abstract onKeyDown(key: string): void;
  protected abstract onWheel(deltaY: number): void;
  protected abstract onDrawingStart(point: Point): void;
  protected abstract onDrawingProgress(point: Point): { 
    completed?: boolean; 
    newState?: Partial<DrawingState>; 
    shapeDefinition?: ShapeDefinition;
  };
  protected abstract generatePreview(point: Point): unknown;
  protected abstract onDrawingComplete(shapeDefinition: ShapeDefinition): void;
  protected abstract onDrawingCancel(reason: string): void;
}