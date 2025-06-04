import { BaseEditorSystem } from './BaseEditorSystem';
import { EditorState } from './EditorState';
import { FileManager } from '../systems/FileManager';
import { PropertyManager } from '../systems/PropertyManager';
import { ShapeEditorManager } from '../systems/ShapeEditorManager';
import { PhysicsSimulator } from '../systems/PhysicsSimulator';
import { DrawingToolManager } from '../systems/DrawingToolManager';
import { GridManager } from '../systems/GridManager';
import { DrawingStateManager } from '../systems/DrawingStateManager';
import { CircleTool } from '../drawing/tools/CircleTool';
import { RectangleTool } from '../drawing/tools/RectangleTool';
import { PolygonTool } from '../drawing/tools/PolygonTool';
import { CapsuleTool } from '../drawing/tools/CapsuleTool';
import { PathTool } from '../drawing/tools/PathTool';
import { EditorEventPriority } from './EditorEventBus';
import { EditorTheme } from '../utils/theme';
import { 
  EditorErrorValidationEvent, 
  EditorErrorPhysicsEvent, 
  EditorErrorFileEvent,
  EditorFileLoadCompletedEvent,
  EditorFileSaveCompletedEvent,
  EditorCanvasResizedEvent,
  EditorDrawingModeChangedEvent,
  EditorDrawingPreviewUpdatedEvent,
  EditorDrawingCompletedEvent,
  EditorDrawingCancelledEvent,
  EditorToolSelectedEvent
} from '../events/EditorEventTypes';

/**
 * Main editor orchestrator that manages all editor systems
 */
export class EditorManager extends BaseEditorSystem {
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private container: HTMLElement | null = null;
  
  // Core systems
  private editorState: EditorState;
  private fileManager: FileManager;
  private propertyManager: PropertyManager;
  private shapeEditorManager: ShapeEditorManager;
  private physicsSimulator: PhysicsSimulator;
  
  // Phase 2 systems
  private drawingToolManager: DrawingToolManager;
  private gridManager: GridManager;
  private drawingStateManager: DrawingStateManager;
  
  private animationFrameId: number | null = null;
  private lastUpdateTime = 0;
  private isRunning = false;
  private needsRender = true;
  private currentTheme: EditorTheme | null = null;

  constructor() {
    super('EditorManager');
    
    // Initialize systems
    this.editorState = new EditorState();
    this.fileManager = new FileManager();
    this.propertyManager = new PropertyManager();
    this.shapeEditorManager = new ShapeEditorManager();
    this.physicsSimulator = new PhysicsSimulator();
    
    // Initialize Phase 2 systems
    this.drawingToolManager = new DrawingToolManager();
    this.gridManager = new GridManager();
    this.drawingStateManager = new DrawingStateManager();
    
    // Initialize with default theme to ensure canvas has proper background
    this.currentTheme = null; // Will be set properly via setTheme
  }

  async initializeEditor(canvas: HTMLCanvasElement, container: HTMLElement): Promise<void> {
    this.canvas = canvas;
    this.container = container;
    this.context = canvas.getContext('2d');
    
    if (!this.context) {
      throw new Error('Failed to get 2D context from canvas');
    }

    await this.initialize();
    
    // Initialize all systems
    await this.editorState.initialize();
    await this.fileManager.initialize();
    await this.propertyManager.initialize();
    await this.shapeEditorManager.initialize();
    await this.physicsSimulator.initialize();
    
    // Initialize Phase 2 systems
    await this.drawingToolManager.initialize();
    await this.gridManager.initialize();
    await this.drawingStateManager.initialize();
    
    // Register drawing tools
    this.registerDrawingTools();

    this.setupCanvas();
    this.startRenderLoop();
    
    // Initial render
    this.needsRender = true;
  }

  protected async onInitialize(): Promise<void> {
    this.setupEventSubscriptions();
  }

  protected onUpdate(deltaTime: number): void {
    // Update all systems
    this.editorState.update(deltaTime);
    this.fileManager.update(deltaTime);
    this.propertyManager.update(deltaTime);
    this.shapeEditorManager.update(deltaTime);
    this.physicsSimulator.update(deltaTime);
    
    // Update Phase 2 systems
    this.drawingToolManager.update(deltaTime);
    this.gridManager.update(deltaTime);
    this.drawingStateManager.update(deltaTime);
  }

  protected onRender(context: CanvasRenderingContext2D): void {
    // When using a scaled context, we need to use logical dimensions, not buffer dimensions
    const dpr = window.devicePixelRatio || 1;
    const logicalWidth = this.canvas!.width / dpr;
    const logicalHeight = this.canvas!.height / dpr;
    
    // Clear canvas using logical dimensions
    context.clearRect(0, 0, logicalWidth, logicalHeight);
    
    // Set background using theme
    const backgroundColor = this.currentTheme?.canvas.background || '#e9ecef';
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, logicalWidth, logicalHeight);
    
    // Render grid first (behind everything)
    this.gridManager.renderGrid(context, logicalWidth, logicalHeight);
    
    // Render all systems
    // During physics simulation, only render physics shapes to avoid duplication
    if (this.editorState.getState().simulationRunning) {
      this.physicsSimulator.render(context);
    } else {
      this.shapeEditorManager.render(context);
    }
    
    // Render drawing tool previews (on top)
    this.drawingToolManager.render(context);
  }

  protected onDestroy(): void {
    this.stopRenderLoop();
    
    // Destroy Phase 2 systems first
    this.drawingStateManager.destroy();
    this.gridManager.destroy();
    this.drawingToolManager.destroy();
    
    // Destroy all systems
    this.physicsSimulator.destroy();
    this.shapeEditorManager.destroy();
    this.propertyManager.destroy();
    this.fileManager.destroy();
    this.editorState.destroy();
  }

  private setupEventSubscriptions(): void {
    // Error handling
    this.subscribe('editor:error:validation', async (event: EditorErrorValidationEvent) => {
      console.error('Validation error:', event.payload.errors);
      this.showError(`Validation errors: ${event.payload.errors.join(', ')}`);
    }, EditorEventPriority.CRITICAL);

    this.subscribe('editor:error:physics', async (event: EditorErrorPhysicsEvent) => {
      console.error('Physics error:', event.payload.error);
      this.showError(`Physics error: ${event.payload.error}`);
    }, EditorEventPriority.CRITICAL);

    this.subscribe('editor:error:file', async (event: EditorErrorFileEvent) => {
      console.error('File error:', event.payload.error);
      this.showError(`File error: ${event.payload.error}`);
    }, EditorEventPriority.CRITICAL);

    // File operations
    this.subscribe('editor:file:load:completed', async (event: EditorFileLoadCompletedEvent) => {
      console.log('Shape loaded:', event.payload.filename);
      this.showMessage(`Shape loaded: ${event.payload.filename}`);
      this.needsRender = true;
      
      // When a file is loaded, stay with the current tool (no special mode switching needed)
    });

    this.subscribe('editor:file:save:completed', async (event: EditorFileSaveCompletedEvent) => {
      console.log('Shape saved:', event.payload.filename);
      this.showMessage(`Shape saved: ${event.payload.filename}`);
    });

    // Shape changes
    this.subscribe('editor:shape:created', async () => {
      this.needsRender = true;
    });

    this.subscribe('editor:shape:updated', async () => {
      this.needsRender = true;
    });

    this.subscribe('editor:shape:destroyed', async () => {
      this.needsRender = true;
    });

    this.subscribe('editor:physics:debug:toggled', async () => {
      this.needsRender = true;
    });

    this.subscribe('editor:shape:preview:updated', async () => {
      this.needsRender = true;
    });

    // Screw changes
    this.subscribe('editor:screw:added', async () => {
      this.needsRender = true;
    });

    this.subscribe('editor:screw:removed', async () => {
      this.needsRender = true;
    });

    this.subscribe('editor:screw:placement:updated', async () => {
      this.needsRender = true;
    });

    // Phase 2 drawing events
    this.subscribe('editor:drawing:mode:changed', async (event: EditorDrawingModeChangedEvent) => {
      this.needsRender = true;
      console.log(`Drawing mode changed: ${event.payload.mode}`);
    });

    this.subscribe('editor:drawing:preview:updated', async (event: EditorDrawingPreviewUpdatedEvent) => {
      this.needsRender = true;
      void event; // Using event to avoid unused parameter warning
    });

    this.subscribe('editor:drawing:completed', async (event: EditorDrawingCompletedEvent) => {
      // A shape was created via drawing tool, load it into the editor
      console.log('Shape created via drawing tool:', event.payload.shapeDefinition.name);
      this.showMessage(`Shape created: ${event.payload.shapeDefinition.name}`);
      
      // Load the created shape into the editor state
      await this.fileManager.loadShapeFromDefinition(event.payload.shapeDefinition);
      
      // Switch to edit mode after creating a shape
      this.drawingToolManager.selectTool('select');
      
      this.needsRender = true;
    });

    this.subscribe('editor:drawing:cancelled', async (event: EditorDrawingCancelledEvent) => {
      // Clear the preview when drawing is cancelled
      this.needsRender = true;
      void event; // Using event to avoid unused parameter warning
    });

    this.subscribe('editor:tool:selected', async (event: EditorToolSelectedEvent) => {
      this.needsRender = true;
      console.log(`Tool selected: ${event.payload.toolName}`);
      void event; // Using event to avoid unused parameter warning
    });

    // Grid events
    this.subscribe('editor:grid:toggled', async () => {
      this.needsRender = true;
    });

    this.subscribe('editor:grid:size:changed', async () => {
      this.needsRender = true;
    });

    // Canvas resize - just mark for re-render, don't resize canvas
    // (canvas is already resized by resizeCanvas function)
    this.subscribe('editor:canvas:resized', async (event: EditorCanvasResizedEvent) => {
      this.needsRender = true;
      void event; // Using event to avoid unused parameter warning
    });
  }

  private setupCanvas(): void {
    if (!this.canvas || !this.container) return;

    let resizeTimeout: number | null = null;
    
    const resizeCanvas = () => {
      if (!this.canvas || !this.container) return;
      
      const rect = this.container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      // In the new layout, the container is just the canvas area
      // Subtract padding from the container
      const containerStyle = window.getComputedStyle(this.container);
      const paddingLeft = parseFloat(containerStyle.paddingLeft) || 0;
      const paddingRight = parseFloat(containerStyle.paddingRight) || 0;
      const paddingTop = parseFloat(containerStyle.paddingTop) || 0;
      const paddingBottom = parseFloat(containerStyle.paddingBottom) || 0;
      
      const width = rect.width - paddingLeft - paddingRight;
      const height = rect.height - paddingTop - paddingBottom;
      
      // Only resize if dimensions actually changed
      const newWidth = width * dpr;
      const newHeight = height * dpr;
      
      if (this.canvas.width === newWidth && this.canvas.height === newHeight) {
        return;
      }
      
      this.canvas.width = newWidth;
      this.canvas.height = newHeight;
      this.canvas.style.width = `${width}px`;
      this.canvas.style.height = `${height}px`;
      
      if (this.context) {
        this.context.scale(dpr, dpr);
      }

      // Emit resize event with logical dimensions (not scaled by dpr)
      this.emit({
        type: 'editor:canvas:resized',
        payload: { width: width, height: height },
      });
    };
    
    const debouncedResize = () => {
      if (resizeTimeout !== null) {
        clearTimeout(resizeTimeout);
      }
      resizeTimeout = window.setTimeout(resizeCanvas, 100);
    };

    // Initial resize
    resizeCanvas();

    // Listen for container resize with debouncing
    const resizeObserver = new ResizeObserver(debouncedResize);
    resizeObserver.observe(this.container);
  }

  private startRenderLoop(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastUpdateTime = performance.now();
    
    const loop = (currentTime: number) => {
      if (!this.isRunning) return;
      
      const deltaTime = currentTime - this.lastUpdateTime;
      this.lastUpdateTime = currentTime;
      
      // Always update physics if simulation is running
      const editorState = this.editorState.getState();
      if (editorState.simulationRunning) {
        this.physicsSimulator.update(deltaTime);
        this.needsRender = true;
      }
      
      // Only render if needed
      if (this.needsRender && this.context) {
        this.render(this.context);
        this.needsRender = false;
      }
      
      this.animationFrameId = requestAnimationFrame(loop);
    };
    
    this.animationFrameId = requestAnimationFrame(loop);
  }

  private stopRenderLoop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private showError(message: string): void {
    // TODO: Implement proper error display UI
    console.error(message);
    alert(message);
  }

  private showMessage(message: string): void {
    // TODO: Implement proper message display UI
    console.log(message);
  }

  // Public API
  getCanvas(): HTMLCanvasElement | null {
    return this.canvas;
  }

  getContext(): CanvasRenderingContext2D | null {
    return this.context;
  }

  getEditorState(): EditorState {
    return this.editorState;
  }

  getFileManager(): FileManager {
    return this.fileManager;
  }

  getPropertyManager(): PropertyManager {
    return this.propertyManager;
  }

  getShapeEditorManager(): ShapeEditorManager {
    return this.shapeEditorManager;
  }

  getPhysicsSimulator(): PhysicsSimulator {
    return this.physicsSimulator;
  }

  getDrawingToolManager(): DrawingToolManager {
    return this.drawingToolManager;
  }

  getGridManager(): GridManager {
    return this.gridManager;
  }

  getDrawingStateManager(): DrawingStateManager {
    return this.drawingStateManager;
  }

  async handleCanvasClick(x: number, y: number): Promise<void> {
    // Apply grid snapping if enabled
    const point = this.gridManager.snapToGrid({ x, y });
    
    // Check current drawing mode
    const currentMode = this.drawingToolManager.getCurrentMode();
    
    if (currentMode === 'create') {
      // Phase 2: Drawing mode - delegate to drawing tool manager
      this.drawingToolManager.handleMouseDown(point);
    } else {
      // Phase 1: Edit mode - delegate to shape editor manager for screw interaction
      await this.shapeEditorManager.handleCanvasClick(point.x, point.y);
    }
  }

  handleCanvasMouseMove(x: number, y: number): void {
    // Apply grid snapping if enabled
    const point = this.gridManager.snapToGrid({ x, y });
    
    // Always update drawing tool manager for preview updates
    this.drawingToolManager.handleMouseMove(point);
  }

  handleCanvasMouseUp(x: number, y: number): void {
    // Apply grid snapping if enabled
    const point = this.gridManager.snapToGrid({ x, y });
    
    // Delegate to drawing tool manager
    this.drawingToolManager.handleMouseUp(point);
  }

  handleCanvasKeyDown(key: string): void {
    // Delegate to drawing tool manager for ESC handling and other keys
    this.drawingToolManager.handleKeyDown(key);
  }

  handleCanvasWheel(deltaY: number): void {
    // Delegate to drawing tool manager for mouse wheel events
    this.drawingToolManager.handleWheel(deltaY);
  }

  setTheme(theme: EditorTheme): void {
    this.currentTheme = theme;
    this.needsRender = true;
  }

  private registerDrawingTools(): void {
    // Register all drawing tools
    const circleTool = new CircleTool();
    const rectangleTool = new RectangleTool();
    const polygonTool = new PolygonTool();
    const capsuleTool = new CapsuleTool();
    const pathTool = new PathTool();

    this.drawingToolManager.registerTool(circleTool);
    this.drawingToolManager.registerTool(rectangleTool);
    this.drawingToolManager.registerTool(polygonTool);
    this.drawingToolManager.registerTool(capsuleTool);
    this.drawingToolManager.registerTool(pathTool);

    // Select the default tool (circle tool for create mode)
    this.drawingToolManager.selectTool('circle');
  }
}