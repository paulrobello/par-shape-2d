import { BaseTool, type DrawingState } from './BaseTool';
import type { Point } from '../../systems/GridManager';
import type { ShapeDefinition } from '@/types/shapes';

interface CircleDrawingData {
  center: Point;
  radius: number;
}

/**
 * CircleTool implements the center → radius workflow for creating circles
 */
export class CircleTool extends BaseTool {
  private drawingData: CircleDrawingData | null = null;
  private previewRadius: number = 0;

  constructor() {
    super(
      {
        name: 'circle',
        displayName: 'Circle',
        cursor: 'crosshair',
        description: 'Draw circles by setting center then radius'
      },
      {
        name: 'waiting_for_center',
        step: 0,
        canProgress: true,
        instruction: 'Click to set the center point'
      }
    );
  }

  protected async onInitialize(): Promise<void> {
    // No initialization needed for CircleTool
  }

  protected onUpdate(deltaTime: number): void {
    // No frame-based updates needed for CircleTool
    void deltaTime; // Using deltaTime to avoid unused parameter warning
  }

  protected onRender(context: CanvasRenderingContext2D): void {
    // Override render to delegate to our custom render method
    this.render(context);
  }

  protected onDestroy(): void {
    // Clean up any CircleTool-specific resources
    this.drawingData = null;
    this.previewRadius = 0;
  }

  protected onActivate(): void {
    this.drawingData = null;
    this.previewRadius = 0;
    this.resetState();
  }

  protected onDeactivate(): void {
    this.drawingData = null;
    this.previewRadius = 0;
  }

  protected onMouseUp(point: Point): void {
    // Circle tool completes on mouse down, not mouse up
    void point; // Using point to avoid unused parameter warning
  }

  protected onKeyDown(key: string): void {
    // Base class handles ESC cancellation
    void key; // Using key to avoid unused parameter warning
  }

  protected onDrawingStart(point: Point): void {
    // First click sets the center
    this.drawingData = {
      center: point,
      radius: 0
    };

    this.updateState({
      name: 'setting_radius',
      step: 1,
      instruction: 'Click to set the radius',
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

    // Second click sets the radius and completes the circle
    const radius = Math.sqrt(
      Math.pow(point.x - this.drawingData.center.x, 2) + 
      Math.pow(point.y - this.drawingData.center.y, 2)
    );

    // Minimum radius check
    if (radius < 5) {
      return {};
    }

    this.drawingData.radius = radius;

    // Create circle shape definition
    const shapeDefinition: ShapeDefinition = {
      id: `circle_${Date.now()}`,
      name: 'New Circle',
      category: 'basic',
      enabled: true,
      dimensions: {
        type: 'fixed',
        radius: Math.round(radius)
      },
      physics: {
        type: 'circle'
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

  protected generatePreview(point: Point): CircleDrawingData | null {
    if (!this.drawingData) {
      return null;
    }

    // Calculate preview radius
    this.previewRadius = Math.sqrt(
      Math.pow(point.x - this.drawingData.center.x, 2) + 
      Math.pow(point.y - this.drawingData.center.y, 2)
    );

    return {
      center: this.drawingData.center,
      radius: this.previewRadius
    };
  }

  protected onDrawingComplete(shapeDefinition: ShapeDefinition): void {
    // Reset for next drawing
    this.drawingData = null;
    this.previewRadius = 0;
    void shapeDefinition; // Using shapeDefinition to avoid unused parameter warning
  }

  protected onDrawingCancel(reason: string): void {
    // Reset drawing data
    this.drawingData = null;
    this.previewRadius = 0;
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

    const { center } = this.drawingData;
    const radius = this.currentState.step === 1 ? this.previewRadius : this.drawingData.radius;

    if (radius > 0) {
      // Draw preview circle
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }

    // Draw center point
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#007bff';
    ctx.beginPath();
    ctx.arc(center.x, center.y, 3, 0, 2 * Math.PI);
    ctx.fill();

    // Draw radius line during preview
    if (this.currentState.step === 1 && this.previewRadius > 0) {
      ctx.strokeStyle = '#007bff';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(center.x, center.y);
      ctx.lineTo(center.x + this.previewRadius, center.y);
      ctx.stroke();

      // Draw radius dimension
      ctx.setLineDash([]);
      ctx.fillStyle = '#007bff';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      const radiusText = `r: ${Math.round(this.previewRadius)}px`;
      const textX = center.x + this.previewRadius / 2;
      const textY = center.y - 5;
      
      // Draw background for better readability
      ctx.globalAlpha = 0.9;
      const textMetrics = ctx.measureText(radiusText);
      const padding = 4;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(
        textX - textMetrics.width / 2 - padding,
        textY - 14 - padding,
        textMetrics.width + padding * 2,
        14 + padding * 2
      );
      
      // Draw text
      ctx.fillStyle = '#007bff';
      ctx.fillText(radiusText, textX, textY);
    }

    ctx.restore();
  }
}