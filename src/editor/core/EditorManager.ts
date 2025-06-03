import { BaseEditorSystem } from './BaseEditorSystem';
import { EditorState } from './EditorState';
import { FileManager } from '../systems/FileManager';
import { PropertyManager } from '../systems/PropertyManager';
import { ShapeEditorManager } from '../systems/ShapeEditorManager';
import { PhysicsSimulator } from '../systems/PhysicsSimulator';
import { EditorEventPriority } from './EditorEventBus';
import { EditorTheme } from '../utils/theme';
import { 
  EditorErrorValidationEvent, 
  EditorErrorPhysicsEvent, 
  EditorErrorFileEvent,
  EditorFileLoadCompletedEvent,
  EditorFileSaveCompletedEvent,
  EditorCanvasResizedEvent
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
    
    // Render all systems
    this.shapeEditorManager.render(context);
    this.physicsSimulator.render(context);
  }

  protected onDestroy(): void {
    this.stopRenderLoop();
    
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

  async handleCanvasClick(x: number, y: number): Promise<void> {
    // Delegate to shape editor manager
    await this.shapeEditorManager.handleCanvasClick(x, y);
  }

  setTheme(theme: EditorTheme): void {
    this.currentTheme = theme;
    this.needsRender = true;
  }
}