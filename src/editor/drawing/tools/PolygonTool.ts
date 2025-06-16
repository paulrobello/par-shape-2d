import { BaseTool, type DrawingState } from './BaseTool';
import type { Point } from '../../systems/GridManager';
import type { ShapeDefinition } from '@/types/shapes';
import { GeometryRenderer } from '@/shared/rendering/core/GeometryRenderer';

interface PolygonDrawingData {
  center: Point;
  radius: number;
  sides: number;
}

/**
 * PolygonTool implements the center → radius workflow for creating polygons
 */
export class PolygonTool extends BaseTool {
  private drawingData: PolygonDrawingData | null = null;
  private previewRadius: number = 0;
  private sides: number = 6; // Default to hexagon

  constructor() {
    super(
      {
        name: 'polygon',
        displayName: 'Polygon',
        cursor: 'crosshair',
        description: 'Draw polygons by setting center then radius'
      },
      {
        name: 'waiting_for_center',
        step: 0,
        canProgress: true,
        instruction: 'Click to set the center point (Use mouse wheel to change sides)'
      }
    );
  }

  protected async onInitialize(): Promise<void> {
    // No initialization needed for PolygonTool
  }

  protected onUpdate(deltaTime: number): void {
    // No frame-based updates needed for PolygonTool
    void deltaTime; // Using deltaTime to avoid unused parameter warning
  }

  protected onRender(context: CanvasRenderingContext2D): void {
    // Override render to delegate to our custom render method
    this.render(context);
  }

  protected onDestroy(): void {
    // Clean up any PolygonTool-specific resources
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
    // Polygon tool completes on mouse down, not mouse up
    void point; // Using point to avoid unused parameter warning
  }

  protected onKeyDown(key: string): void {
    // Base class handles ESC cancellation
    void key; // Using key to avoid unused parameter warning
  }

  protected onWheel(deltaY: number): void {
    // Change sides when mouse wheel is used during polygon creation
    if (this.isDrawing) {
      // Determine direction: negative deltaY = scroll up = increase sides
      const direction = deltaY < 0 ? 1 : -1;
      const newSides = Math.max(3, Math.min(12, this.sides + direction));
      
      if (newSides !== this.sides) {
        this.setSides(newSides);
        
        // Update drawing data with new sides count
        if (this.drawingData) {
          this.drawingData.sides = this.sides;
        }
        
        // Update instruction to show current sides count
        this.updateState({
          instruction: `Click to set the radius (${this.sides} sides) - Use mouse wheel to change sides`
        });
        
        // Force preview update with new sides count
        this.emit({
          type: 'editor:drawing:preview:updated',
          payload: {
            toolName: this.config.name,
            previewData: this.drawingData ? {
              center: this.drawingData.center,
              radius: this.previewRadius,
              sides: this.sides
            } : null
          }
        });
      }
    }
  }

  /**
   * Set the number of sides for the polygon (3-12 range)
   */
  public setSides(sides: number): void {
    this.sides = Math.max(3, Math.min(12, Math.round(sides)));
  }

  /**
   * Get the current number of sides
   */
  public getSides(): number {
    return this.sides;
  }

  protected onDrawingStart(point: Point): void {
    // First click sets the center
    this.drawingData = {
      center: point,
      radius: 0,
      sides: this.sides
    };

    this.updateState({
      name: 'setting_radius',
      step: 1,
      instruction: `Click to set the radius (${this.sides} sides)`,
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

    // Second click sets the radius and completes the polygon
    const radius = Math.sqrt(
      Math.pow(point.x - this.drawingData.center.x, 2) + 
      Math.pow(point.y - this.drawingData.center.y, 2)
    );

    // Minimum radius check
    if (radius < 10) {
      return {};
    }

    this.drawingData.radius = radius;

    // Create polygon shape definition
    const shapeDefinition: ShapeDefinition = {
      id: `polygon_${this.sides}_${Date.now()}`,
      name: `New ${this.sides}-sided Polygon`,
      category: 'polygon',
      enabled: true,
      dimensions: {
        type: 'fixed',
        radius: Math.round(radius),
        sides: this.sides
      },
      physics: {
        type: 'polygon'
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

  protected generatePreview(point: Point): PolygonDrawingData | null {
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
      radius: this.previewRadius,
      sides: this.sides
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

  /**
   * Calculate polygon vertices for given center, radius, and sides
   */
  private calculatePolygonVertices(center: Point, radius: number, sides: number): Point[] {
    const vertices: Point[] = [];
    const angleStep = (2 * Math.PI) / sides;
    
    // Start from top (rotate by -π/2 so first vertex is at top)
    const startAngle = -Math.PI / 2;
    
    for (let i = 0; i < sides; i++) {
      const angle = startAngle + (i * angleStep);
      vertices.push({
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle)
      });
    }
    
    return vertices;
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
      // Calculate polygon vertices
      const vertices = this.calculatePolygonVertices(center, radius, this.sides);
      
      // Draw preview polygon using GeometryRenderer for rounded corners
      if (vertices.length > 0) {
        GeometryRenderer.renderPolygon(ctx, {
          points: vertices,
          fillColor: ctx.fillStyle as string,
          strokeColor: ctx.strokeStyle as string,
          lineWidth: ctx.lineWidth,
          closed: true,
          cornerRadius: 8, // Add rounded corners for polygon tool preview
        });
      }
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

      // Draw radius and sides dimension
      ctx.setLineDash([]);
      ctx.fillStyle = '#007bff';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      const dimensionText = `r: ${Math.round(this.previewRadius)}px (${this.sides} sides) - Scroll to change`;
      const textX = center.x + this.previewRadius / 2;
      const textY = center.y - 5;
      
      // Draw background for better readability
      ctx.globalAlpha = 0.9;
      const textMetrics = ctx.measureText(dimensionText);
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
      ctx.fillText(dimensionText, textX, textY);
    }

    ctx.restore();
  }
}