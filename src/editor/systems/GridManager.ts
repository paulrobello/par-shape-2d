import { BaseEditorSystem } from '../core/BaseEditorSystem';
import type {
  EditorGridToggledEvent,
  EditorGridSizeChangedEvent,
  EditorGridSnapToggledEvent,
  EditorEvent,
  EditorEventHandler,
} from '../events/EditorEventTypes';

export interface Point {
  x: number;
  y: number;
}

export interface GridSettings {
  enabled: boolean;
  size: number;
  snapEnabled: boolean;
  dotOpacity: number;
  dotSize: number;
}

export class GridManager extends BaseEditorSystem {
  private settings: GridSettings = {
    enabled: false,
    size: 20,
    snapEnabled: false,
    dotOpacity: 0.3,
    dotSize: 1
  };

  constructor() {
    super('GridManager');
    this.setupEventListeners();
  }

  protected async onInitialize(): Promise<void> {
    // No initialization needed for GridManager
  }

  protected onUpdate(deltaTime: number): void {
    // No frame-based updates needed for GridManager
    void deltaTime; // Using deltaTime to avoid unused parameter warning
  }

  protected onRender(context: CanvasRenderingContext2D): void {
    // GridManager doesn't have its own render method that takes width/height
    // Rendering is done through the renderGrid method called by EditorManager
    void context; // Using context to avoid unused parameter warning
  }

  protected onDestroy(): void {
    // Cleanup is handled in the destroy() method
  }

  private setupEventListeners(): void {
    this.subscribe('editor:grid:toggled', this.handleGridToggled.bind(this));
    this.subscribe('editor:grid:size:changed', this.handleGridSizeChanged.bind(this));
    this.subscribe('editor:grid:snap:toggled', this.handleGridSnapToggled.bind(this));
  }

  private handleGridToggled(event: EditorGridToggledEvent): void {
    this.settings.enabled = event.payload.enabled;
  }

  private handleGridSizeChanged(event: EditorGridSizeChangedEvent): void {
    this.settings.size = event.payload.size;
  }

  private handleGridSnapToggled(event: EditorGridSnapToggledEvent): void {
    this.settings.snapEnabled = event.payload.enabled;
  }

  /**
   * Snap a point to the nearest grid intersection if snapping is enabled
   */
  public snapToGrid(point: Point): Point {
    if (!this.settings.snapEnabled || !this.settings.enabled) {
      return point;
    }

    const snapped = {
      x: Math.round(point.x / this.settings.size) * this.settings.size,
      y: Math.round(point.y / this.settings.size) * this.settings.size
    };

    // Emit snap event if coordinates actually changed
    if (snapped.x !== point.x || snapped.y !== point.y) {
      this.emit({
        type: 'editor:grid:coordinate:snapped',
        payload: {
          original: point,
          snapped: snapped
        }
      });
    }

    return snapped;
  }

  /**
   * Render the grid dots on the canvas
   */
  public renderGrid(
    ctx: CanvasRenderingContext2D, 
    canvasWidth: number, 
    canvasHeight: number
  ): void {
    if (!this.settings.enabled) {
      return;
    }

    ctx.save();
    
    // Set dot appearance
    ctx.fillStyle = `rgba(0, 0, 0, ${this.settings.dotOpacity})`;
    
    const gridSize = this.settings.size;
    const dotRadius = this.settings.dotSize / 2;

    // Calculate grid bounds to only render visible dots
    const startX = Math.floor(-gridSize) + (gridSize - ((-gridSize) % gridSize));
    const startY = Math.floor(-gridSize) + (gridSize - ((-gridSize) % gridSize));
    const endX = canvasWidth + gridSize;
    const endY = canvasHeight + gridSize;

    // Render dots at grid intersections
    for (let x = startX; x <= endX; x += gridSize) {
      for (let y = startY; y <= endY; y += gridSize) {
        if (x >= 0 && x <= canvasWidth && y >= 0 && y <= canvasHeight) {
          ctx.beginPath();
          ctx.arc(x, y, dotRadius, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    }

    ctx.restore();
  }

  /**
   * Get current grid settings
   */
  public getSettings(): Readonly<GridSettings> {
    return { ...this.settings };
  }

  /**
   * Update grid settings (used by UI components)
   */
  public updateSettings(newSettings: Partial<GridSettings>): void {
    const oldSettings = { ...this.settings };
    this.settings = { ...this.settings, ...newSettings };

    // Emit appropriate events for changed settings
    if (oldSettings.enabled !== this.settings.enabled) {
      this.emit({
        type: 'editor:grid:toggled',
        payload: {
          enabled: this.settings.enabled
        }
      });
    }

    if (oldSettings.size !== this.settings.size) {
      this.emit({
        type: 'editor:grid:size:changed',
        payload: {
          size: this.settings.size,
          previousSize: oldSettings.size
        }
      });
    }

    if (oldSettings.snapEnabled !== this.settings.snapEnabled) {
      this.emit({
        type: 'editor:grid:snap:toggled',
        payload: {
          enabled: this.settings.snapEnabled
        }
      });
    }
  }

  /**
   * Get the closest grid point to a given point
   */
  public getClosestGridPoint(point: Point): Point {
    if (!this.settings.enabled) {
      return point;
    }

    return {
      x: Math.round(point.x / this.settings.size) * this.settings.size,
      y: Math.round(point.y / this.settings.size) * this.settings.size
    };
  }

  /**
   * Check if a point is close to a grid intersection
   */
  public isNearGridPoint(point: Point, tolerance: number = 5): boolean {
    if (!this.settings.enabled) {
      return false;
    }

    const closest = this.getClosestGridPoint(point);
    const distance = Math.sqrt(
      Math.pow(point.x - closest.x, 2) + Math.pow(point.y - closest.y, 2)
    );

    return distance <= tolerance;
  }

  /**
   * Get all grid points within a rectangular area
   */
  public getGridPointsInArea(
    x: number, 
    y: number, 
    width: number, 
    height: number
  ): Point[] {
    if (!this.settings.enabled) {
      return [];
    }

    const points: Point[] = [];
    const gridSize = this.settings.size;

    const startX = Math.floor(x / gridSize) * gridSize;
    const startY = Math.floor(y / gridSize) * gridSize;
    const endX = x + width;
    const endY = y + height;

    for (let gx = startX; gx <= endX; gx += gridSize) {
      for (let gy = startY; gy <= endY; gy += gridSize) {
        if (gx >= x && gx <= endX && gy >= y && gy <= endY) {
          points.push({ x: gx, y: gy });
        }
      }
    }

    return points;
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
    // Clean up any resources if needed
    super.destroy();
  }
}