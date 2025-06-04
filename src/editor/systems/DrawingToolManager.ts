import { BaseEditorSystem } from '../core/BaseEditorSystem';
import { BaseTool } from '../drawing/tools/BaseTool';
import type { Point } from './GridManager';
import type {
  EditorToolSelectedEvent,
  EditorEvent,
  EditorEventHandler,
} from '../events/EditorEventTypes';

export type DrawingMode = 'edit' | 'create';

export class DrawingToolManager extends BaseEditorSystem {
  private tools: Map<string, BaseTool> = new Map();
  private activeTool: BaseTool | null = null;
  private currentMode: DrawingMode = 'edit';
  private isSimulationRunning = false;

  constructor() {
    super('DrawingToolManager');
    this.setupEventListeners();
  }

  protected async onInitialize(): Promise<void> {
    // No initialization needed for DrawingToolManager
  }

  protected onUpdate(deltaTime: number): void {
    // No frame-based updates needed for DrawingToolManager
    void deltaTime; // Using deltaTime to avoid unused parameter warning
  }

  protected onRender(context: CanvasRenderingContext2D): void {
    // Delegate to render method
    this.render(context);
  }

  protected onDestroy(): void {
    // Cleanup is handled in the destroy() method
  }

  private setupEventListeners(): void {
    this.subscribe('editor:tool:selected', this.handleToolSelected.bind(this));
    
    // Listen for simulation state changes
    this.subscribe('editor:physics:start:requested', () => {
      this.isSimulationRunning = true;
    });
    
    this.subscribe('editor:physics:pause:requested', () => {
      // Keep simulation running state when paused, tools should remain disabled
    });
    
    this.subscribe('editor:physics:reset:requested', () => {
      this.isSimulationRunning = false;
    });
  }

  private handleToolSelected(event: EditorToolSelectedEvent): void {
    // This is handled internally when tools are selected via selectTool method
    // This subscription is mainly for external event monitoring
    void event; // Using event to avoid unused parameter warning
  }

  /**
   * Register a drawing tool
   */
  public registerTool(tool: BaseTool): void {
    const toolName = tool.getConfig().name;
    
    if (this.tools.has(toolName)) {
      throw new Error(`Tool '${toolName}' is already registered`);
    }

    this.tools.set(toolName, tool);
  }

  /**
   * Unregister a drawing tool
   */
  public unregisterTool(toolName: string): void {
    const tool = this.tools.get(toolName);
    if (tool) {
      if (this.activeTool === tool) {
        this.activeTool.deactivate();
        this.activeTool = null;
      }
      
      tool.destroy();
      this.tools.delete(toolName);
    }
  }

  /**
   * Select and activate a tool
   */
  public selectTool(toolName: string): boolean {
    if (this.isSimulationRunning) {
      console.warn(`Tool selection disabled during physics simulation`);
      return false;
    }
    
    const tool = this.tools.get(toolName);
    if (!tool) {
      console.warn(`Tool '${toolName}' not found`);
      return false;
    }

    const previousTool = this.activeTool;
    const previousToolName = previousTool?.getConfig().name;

    // Deactivate current tool
    if (this.activeTool) {
      this.activeTool.deactivate();
    }

    // Activate new tool
    this.activeTool = tool;
    this.activeTool.activate();

    // Update drawing mode based on tool type
    const newMode: DrawingMode = toolName === 'select' ? 'edit' : 'create';
    this.setDrawingMode(newMode);

    // Emit tool selection event
    this.emit({
      type: 'editor:tool:selected',
      payload: {
        toolName: toolName,
        previousTool: previousToolName
      }
    });

    return true;
  }

  /**
   * Get the currently active tool
   */
  public getActiveTool(): BaseTool | null {
    return this.activeTool;
  }

  /**
   * Get the name of the currently active tool
   */
  public getActiveToolName(): string | null {
    return this.activeTool?.getConfig().name || null;
  }

  /**
   * Get all registered tools
   */
  public getTools(): BaseTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get a specific tool by name
   */
  public getTool(toolName: string): BaseTool | null {
    return this.tools.get(toolName) || null;
  }

  /**
   * Get current drawing mode
   */
  public getCurrentMode(): DrawingMode {
    return this.currentMode;
  }

  /**
   * Set drawing mode and emit event if changed
   */
  private setDrawingMode(mode: DrawingMode): void {
    if (this.currentMode !== mode) {
      const previousMode = this.currentMode;
      this.currentMode = mode;

      this.emit({
        type: 'editor:drawing:mode:changed',
        payload: {
          mode: mode,
          previousMode: previousMode
        }
      });
    }
  }

  /**
   * Handle mouse down event for the active tool
   */
  public handleMouseDown(point: Point): void {
    if (this.isSimulationRunning) {
      return; // Disable tool interaction during simulation
    }
    
    if (this.activeTool) {
      this.activeTool.handleMouseDown(point);
    }
  }

  /**
   * Handle mouse move event for the active tool
   */
  public handleMouseMove(point: Point): void {
    if (this.isSimulationRunning) {
      return; // Disable tool interaction during simulation
    }
    
    if (this.activeTool) {
      this.activeTool.handleMouseMove(point);
    }
  }

  /**
   * Handle mouse up event for the active tool
   */
  public handleMouseUp(point: Point): void {
    if (this.isSimulationRunning) {
      return; // Disable tool interaction during simulation
    }
    
    if (this.activeTool) {
      this.activeTool.handleMouseUp(point);
    }
  }

  /**
   * Handle key down event for the active tool
   */
  public handleKeyDown(key: string): void {
    if (this.isSimulationRunning) {
      return; // Disable tool interaction during simulation
    }
    
    if (this.activeTool) {
      this.activeTool.handleKeyDown(key);
    }
  }

  /**
   * Handle mouse wheel event for the active tool
   */
  public handleWheel(deltaY: number): void {
    if (this.isSimulationRunning) {
      return; // Disable tool interaction during simulation
    }
    
    if (this.activeTool) {
      this.activeTool.handleWheel(deltaY);
    }
  }

  /**
   * Render the active tool's preview
   */
  public render(ctx: CanvasRenderingContext2D): void {
    if (this.activeTool) {
      this.activeTool.render(ctx);
    }
  }

  /**
   * Check if any tool is currently drawing
   */
  public isDrawing(): boolean {
    return this.activeTool?.isCurrentlyDrawing() || false;
  }

  /**
   * Check if we're in creation mode (not edit mode)
   */
  public isCreationMode(): boolean {
    return this.currentMode === 'create';
  }

  /**
   * Cancel current drawing operation if active
   */
  public cancelDrawing(): void {
    if (this.activeTool && this.activeTool.isCurrentlyDrawing()) {
      this.activeTool.handleKeyDown('Escape');
    }
  }

  /**
   * Get tool configurations for UI rendering
   */
  public getToolConfigs(): Array<{ name: string; displayName: string; cursor: string; icon?: string; description?: string }> {
    return Array.from(this.tools.values()).map(tool => tool.getConfig());
  }

  /**
   * Check if drawing tools are disabled due to simulation running
   */
  public isToolsDisabled(): boolean {
    return this.isSimulationRunning;
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
    // Deactivate current tool
    if (this.activeTool) {
      this.activeTool.deactivate();
      this.activeTool = null;
    }

    // Destroy all tools
    for (const tool of this.tools.values()) {
      tool.destroy();
    }
    this.tools.clear();

    super.destroy();
  }
}