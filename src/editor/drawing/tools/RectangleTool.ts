import { BaseTool, type DrawingState } from './BaseTool';
import type { Point } from '../../systems/GridManager';
import type { ShapeDefinition } from '@/types/shapes';

interface RectangleDrawingData {
  firstCorner: Point;
  secondCorner: Point;
  width: number;
  height: number;
}

/**
 * RectangleTool implements the corner → corner workflow for creating rectangles
 */
export class RectangleTool extends BaseTool {
  private drawingData: RectangleDrawingData | null = null;
  private previewCorner: Point = { x: 0, y: 0 };

  constructor() {
    super(
      {
        name: 'rectangle',
        displayName: 'Rectangle',
        cursor: 'crosshair',
        description: 'Draw rectangles by setting opposite corners'
      },
      {
        name: 'waiting_for_first_corner',
        step: 0,
        canProgress: true,
        instruction: 'Click to set the first corner'
      }
    );
  }

  protected async onInitialize(): Promise<void> {
    // No initialization needed for RectangleTool
  }

  protected onUpdate(deltaTime: number): void {
    // No frame-based updates needed for RectangleTool
    void deltaTime; // Using deltaTime to avoid unused parameter warning
  }

  protected onRender(context: CanvasRenderingContext2D): void {
    // Override render to delegate to our custom render method
    this.render(context);
  }

  protected onDestroy(): void {
    // Clean up any RectangleTool-specific resources
    this.drawingData = null;
    this.previewCorner = { x: 0, y: 0 };
  }

  protected onActivate(): void {
    this.drawingData = null;
    this.previewCorner = { x: 0, y: 0 };
    this.resetState();
  }

  protected onDeactivate(): void {
    this.drawingData = null;
    this.previewCorner = { x: 0, y: 0 };
  }

  protected onMouseUp(point: Point): void {
    // Rectangle tool completes on mouse down, not mouse up
    void point; // Using point to avoid unused parameter warning
  }

  protected onKeyDown(key: string): void {
    // Base class handles ESC cancellation
    void key; // Using key to avoid unused parameter warning
  }

  protected onDrawingStart(point: Point): void {
    // First click sets the first corner
    this.drawingData = {
      firstCorner: point,
      secondCorner: point,
      width: 0,
      height: 0
    };

    this.updateState({
      name: 'setting_second_corner',
      step: 1,
      instruction: 'Click to set the opposite corner',
      data: this.drawingData
    });
  }

  protected onDrawingProgress(point: Point): { 
    completed?: boolean; 
    newState?: Partial<DrawingState>; 
    shapeDefinition?: ShapeDefinition;
  } {
    if (!this.drawingData) {
      return {};
    }

    // Second click sets the opposite corner and completes the rectangle
    this.drawingData.secondCorner = point;
    
    const width = Math.abs(point.x - this.drawingData.firstCorner.x);
    const height = Math.abs(point.y - this.drawingData.firstCorner.y);

    // Minimum size check
    if (width < 10 || height < 10) {
      return {};
    }

    this.drawingData.width = width;
    this.drawingData.height = height;

    // Create rectangle shape definition
    const shapeDefinition: ShapeDefinition = {
      id: `rectangle_${Date.now()}`,
      name: 'New Rectangle',
      category: 'basic',
      enabled: true,
      dimensions: {
        type: 'fixed',
        width: Math.round(width),
        height: Math.round(height)
      },
      physics: {
        type: 'rectangle'
      },
      rendering: {
        type: 'primitive'
      },
      screwPlacement: {
        strategy: 'corners',
        cornerMargin: 30,
        minSeparation: 48,
        maxScrews: {
          byArea: [
            { maxArea: 2500, screwCount: 1 },
            { maxArea: 4000, screwCount: 2 },
            { maxArea: 6000, screwCount: 3 },
            { maxArea: 10000, screwCount: 4 },
            { maxArea: 15000, screwCount: 5 }
          ],
          absolute: 6
        }
      },
      visual: {
        supportsHoles: true
      },
      behavior: {
        allowSingleScrew: true,
        singleScrewDynamic: true,
        rotationalInertiaMultiplier: 3
      }
    };

    return { 
      completed: true, 
      shapeDefinition 
    };
  }

  protected generatePreview(point: Point): RectangleDrawingData | null {
    if (!this.drawingData) {
      return null;
    }

    // Update preview corner
    this.previewCorner = point;

    const width = Math.abs(point.x - this.drawingData.firstCorner.x);
    const height = Math.abs(point.y - this.drawingData.firstCorner.y);

    return {
      firstCorner: this.drawingData.firstCorner,
      secondCorner: point,
      width,
      height
    };
  }

  protected onDrawingComplete(shapeDefinition: ShapeDefinition): void {
    // Reset for next drawing
    this.drawingData = null;
    this.previewCorner = { x: 0, y: 0 };
    void shapeDefinition; // Using shapeDefinition to avoid unused parameter warning
  }

  protected onDrawingCancel(reason: string): void {
    // Reset drawing data
    this.drawingData = null;
    this.previewCorner = { x: 0, y: 0 };
    void reason; // Using reason to avoid unused parameter warning
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.isDrawing || !this.drawingData) {
      return;
    }

    ctx.save();
    
    // Set preview style
    ctx.setLineDash([5, 5]);
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = '#007bff';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(0, 123, 255, 0.1)';

    const { firstCorner } = this.drawingData;
    const corner = this.currentState.step === 1 ? this.previewCorner : this.drawingData.secondCorner;

    // Calculate rectangle bounds
    const x = Math.min(firstCorner.x, corner.x);
    const y = Math.min(firstCorner.y, corner.y);
    const width = Math.abs(corner.x - firstCorner.x);
    const height = Math.abs(corner.y - firstCorner.y);

    if (width > 0 && height > 0) {
      // Draw preview rectangle
      ctx.fillRect(x, y, width, height);
      ctx.strokeRect(x, y, width, height);
    }

    // Draw first corner point
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#007bff';
    ctx.beginPath();
    ctx.arc(firstCorner.x, firstCorner.y, 3, 0, 2 * Math.PI);
    ctx.fill();

    // Draw diagonal line during preview
    if (this.currentState.step === 1 && (width > 0 || height > 0)) {
      ctx.strokeStyle = '#007bff';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(firstCorner.x, firstCorner.y);
      ctx.lineTo(corner.x, corner.y);
      ctx.stroke();

      // Draw dimensions
      if (width > 10 && height > 10) {
        ctx.setLineDash([]);
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const dimensionText = `${Math.round(width)} × ${Math.round(height)}px`;
        const textX = x + width / 2;
        const textY = y + height / 2;
        
        // Draw background for better readability
        ctx.globalAlpha = 0.9;
        const textMetrics = ctx.measureText(dimensionText);
        const padding = 6;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fillRect(
          textX - textMetrics.width / 2 - padding,
          textY - 7 - padding,
          textMetrics.width + padding * 2,
          14 + padding * 2
        );
        
        // Draw text
        ctx.fillStyle = '#007bff';
        ctx.fillText(dimensionText, textX, textY);
      }
    }

    ctx.restore();
  }
}