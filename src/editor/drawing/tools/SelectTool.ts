import { BaseTool, type DrawingState } from './BaseTool';
import type { Point } from '../../systems/GridManager';
import type { ShapeDefinition } from '@/types/shapes';

/**
 * SelectTool maintains all Phase 1 functionality for shape editing and screw manipulation
 * When this tool is active, the editor operates in "edit" mode
 */
export class SelectTool extends BaseTool {
  constructor() {
    super(
      {
        name: 'select',
        displayName: 'Select',
        cursor: 'default',
        description: 'Select and edit shapes (Phase 1 functionality)'
      },
      {
        name: 'idle',
        step: 0,
        canProgress: false,
        instruction: 'Click on screws to add/remove, or use controls to edit shape properties'
      }
    );
  }

  protected async onInitialize(): Promise<void> {
    // No initialization needed for SelectTool
  }

  protected onUpdate(deltaTime: number): void {
    // No frame-based updates needed for SelectTool
    void deltaTime; // Using deltaTime to avoid unused parameter warning
  }

  protected onRender(context: CanvasRenderingContext2D): void {
    // Override render to delegate to our custom render method
    this.render(context);
  }

  protected onDestroy(): void {
    // No cleanup needed for SelectTool
  }

  protected onActivate(): void {
    // SelectTool puts editor into edit mode
    // Phase 1 functionality (screw manipulation, property editing, physics simulation) is enabled
    this.emit({
      type: 'editor:drawing:mode:changed',
      payload: {
        mode: 'edit',
        previousMode: 'create'
      }
    });
  }

  protected onDeactivate(): void {
    // No cleanup needed for select tool
  }

  protected onMouseUp(point: Point): void {
    // SelectTool doesn't use mouse up events for its core functionality
    void point; // Using point to avoid unused parameter warning
  }

  protected onKeyDown(key: string): void {
    // SelectTool doesn't have special key handling beyond base class ESC handling
    void key; // Using key to avoid unused parameter warning
  }

  protected onDrawingStart(point: Point): void {
    // SelectTool doesn't initiate drawing operations
    // Mouse clicks are handled by EditorManager for screw manipulation
    void point; // Using point to avoid unused parameter warning
  }

  protected onDrawingProgress(point: Point): { 
    completed?: boolean; 
    newState?: Partial<DrawingState>; 
    shapeDefinition?: ShapeDefinition;
  } {
    // SelectTool doesn't have drawing progress
    void point; // Using point to avoid unused parameter warning
    return {};
  }

  protected generatePreview(point: Point): null {
    // SelectTool doesn't generate previews
    void point; // Using point to avoid unused parameter warning
    return null;
  }

  protected onDrawingComplete(shapeDefinition: ShapeDefinition): void {
    // SelectTool doesn't complete drawings
    void shapeDefinition; // Using shapeDefinition to avoid unused parameter warning
  }

  protected onDrawingCancel(reason: string): void {
    // SelectTool doesn't have drawings to cancel
    void reason; // Using reason to avoid unused parameter warning
  }

  public render(ctx: CanvasRenderingContext2D): void {
    // SelectTool doesn't render any additional graphics
    // All rendering is handled by existing Phase 1 systems
    void ctx; // Using ctx to avoid unused parameter warning
  }

  /**
   * Handle mouse down specifically for Phase 1 screw interaction
   * This overrides the base class to prevent drawing mode activation
   */
  public handleMouseDown(point: Point): void {
    // For SelectTool, mouse clicks should be passed to EditorManager
    // for screw manipulation rather than starting a drawing operation
    // The actual screw interaction is handled by ShapeEditorManager
    
    // We don't call super.handleMouseDown() to avoid triggering drawing mode
    // Instead, this tool acts as a pass-through for Phase 1 interactions
    void point; // Using point to avoid unused parameter warning
  }

  /**
   * Check if this tool should handle drawing operations
   */
  public isDrawingTool(): boolean {
    return false;
  }
}