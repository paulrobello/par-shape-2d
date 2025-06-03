import { BaseTool, type DrawingState } from './BaseTool';
import type { Point } from '../../systems/GridManager';
import type { ShapeDefinition } from '@/types/shapes';

interface PathDrawingData {
  points: Point[];
  currentPreviewPoint: Point;
  isComplete: boolean;
}

/**
 * PathTool implements multi-point workflow for creating path-based shapes:
 * 1. Click to add points to the path
 * 2. Click on the first point to close the path and complete the shape
 * 3. ESC to cancel at any time
 */
export class PathTool extends BaseTool {
  private drawingData: PathDrawingData | null = null;
  private readonly CLOSE_THRESHOLD = 15; // Pixels to detect clicking on first point
  private readonly MIN_POINTS = 3; // Minimum points to create a valid path

  constructor() {
    super(
      {
        name: 'path',
        displayName: 'Path',
        cursor: 'crosshair',
        description: 'Draw custom paths by clicking points, close by clicking the first point'
      },
      {
        name: 'waiting_for_first_point',
        step: 0,
        canProgress: true,
        instruction: 'Click to start drawing the path'
      }
    );
  }

  protected async onInitialize(): Promise<void> {
    // No initialization needed for PathTool
  }

  protected onUpdate(deltaTime: number): void {
    // No frame-based updates needed for PathTool
    void deltaTime; // Using deltaTime to avoid unused parameter warning
  }

  protected onRender(context: CanvasRenderingContext2D): void {
    // Override render to delegate to our custom render method
    this.render(context);
  }

  protected onDestroy(): void {
    // Clean up any PathTool-specific resources
    this.drawingData = null;
  }

  protected onActivate(): void {
    this.drawingData = null;
    this.resetState();
  }

  protected onDeactivate(): void {
    this.drawingData = null;
  }

  protected onMouseUp(point: Point): void {
    // Path tool completes on mouse down, not mouse up
    void point; // Using point to avoid unused parameter warning
  }

  protected onKeyDown(key: string): void {
    // Base class handles ESC cancellation
    void key; // Using key to avoid unused parameter warning
  }

  protected onWheel(deltaY: number): void {
    // PathTool doesn't use mouse wheel
    void deltaY; // Using deltaY to avoid unused parameter warning
  }

  protected onDrawingStart(point: Point): void {
    // First click starts the path
    this.drawingData = {
      points: [point],
      currentPreviewPoint: point,
      isComplete: false
    };

    this.updateState({
      name: 'adding_points',
      step: 1,
      instruction: 'Click to add points, click first point to close the path',
      data: this.drawingData
    });
  }

  protected onDrawingProgress(point: Point): { 
    completed?: boolean; 
    newState?: Partial<DrawingState>; 
    shapeDefinition?: ShapeDefinition;
  } {
    if (!this.drawingData || this.drawingData.isComplete) {
      return {};
    }

    // Check if clicking on the first point to close the path
    const firstPoint = this.drawingData.points[0];
    const distanceToFirst = Math.sqrt(
      Math.pow(point.x - firstPoint.x, 2) + 
      Math.pow(point.y - firstPoint.y, 2)
    );

    if (distanceToFirst <= this.CLOSE_THRESHOLD && this.drawingData.points.length >= this.MIN_POINTS) {
      // Close the path and complete the shape
      this.drawingData.isComplete = true;

      // Create path shape definition
      const pathString = this.pointsToPathString(this.drawingData.points);
      
      const shapeDefinition: ShapeDefinition = {
        id: `path_${Date.now()}`,
        name: 'New Path Shape',
        category: 'path',
        enabled: true,
        dimensions: {
          type: 'fixed',
          path: pathString,
          scale: { min: 1.0, max: 1.0 }
        },
        physics: {
          type: 'fromVertices',
          decomposition: true
        },
        rendering: {
          type: 'path',
          preserveOriginalVertices: true
        },
        screwPlacement: {
          strategy: 'perimeter',
          perimeterPoints: Math.min(8, this.drawingData.points.length),
          perimeterMargin: 20,
          minSeparation: 48,
          maxScrews: {
            absolute: Math.min(6, Math.max(3, Math.floor(this.drawingData.points.length / 2)))
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
    } else {
      // Add a new point to the path
      this.drawingData.points.push(point);
      
      return {
        newState: {
          step: this.drawingData.points.length,
          instruction: `${this.drawingData.points.length} points. Click first point to close the path`,
          data: this.drawingData
        }
      };
    }
  }

  protected generatePreview(point: Point): PathDrawingData | null {
    if (!this.drawingData) {
      return null;
    }

    // Update preview point
    this.drawingData.currentPreviewPoint = point;

    return {
      points: [...this.drawingData.points],
      currentPreviewPoint: point,
      isComplete: this.drawingData.isComplete
    };
  }

  /**
   * Convert points array to path string format used by the shape system
   */
  private pointsToPathString(points: Point[]): string {
    if (points.length === 0) return '';
    
    // Calculate bounds to normalize coordinates
    const bounds = this.calculateBounds(points);
    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;
    const scale = 100; // Normalize to 100-unit scale
    
    // Convert to normalized coordinates
    const normalizedPoints = points.map(point => ({
      x: ((point.x - bounds.minX) / width) * scale,
      y: ((point.y - bounds.minY) / height) * scale
    }));
    
    // Create path string (space-separated x y coordinates)
    return normalizedPoints.map(p => `${Math.round(p.x)} ${Math.round(p.y)}`).join(' ');
  }

  /**
   * Calculate bounding box of points
   */
  private calculateBounds(points: Point[]): { minX: number; maxX: number; minY: number; maxY: number } {
    if (points.length === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    let minX = points[0].x;
    let maxX = points[0].x;
    let minY = points[0].y;
    let maxY = points[0].y;

    for (const point of points) {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    }

    return { minX, maxX, minY, maxY };
  }

  /**
   * Check if point is close to the first point for closing detection
   */
  private isCloseToFirstPoint(point: Point): boolean {
    if (!this.drawingData || this.drawingData.points.length === 0) {
      return false;
    }

    const firstPoint = this.drawingData.points[0];
    const distance = Math.sqrt(
      Math.pow(point.x - firstPoint.x, 2) + 
      Math.pow(point.y - firstPoint.y, 2)
    );

    return distance <= this.CLOSE_THRESHOLD;
  }

  protected onDrawingComplete(shapeDefinition: ShapeDefinition): void {
    // Reset for next drawing
    this.drawingData = null;
    void shapeDefinition; // Using shapeDefinition to avoid unused parameter warning
  }

  protected onDrawingCancel(reason: string): void {
    // Reset drawing data
    this.drawingData = null;
    void reason; // Using reason to avoid unused parameter warning
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.isDrawing || !this.drawingData) {
      return;
    }

    const { points, currentPreviewPoint } = this.drawingData;

    ctx.save();
    
    // Set preview style
    ctx.setLineDash([5, 5]);
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = '#007bff';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(0, 123, 255, 0.1)';

    // Draw the existing path
    if (points.length > 0) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      
      // Draw preview line to current mouse position (if not complete)
      if (!this.drawingData.isComplete && points.length > 0) {
        ctx.lineTo(currentPreviewPoint.x, currentPreviewPoint.y);
        
        // If close to first point and have enough points, show closing preview
        if (this.isCloseToFirstPoint(currentPreviewPoint) && points.length >= this.MIN_POINTS) {
          ctx.lineTo(points[0].x, points[0].y);
          ctx.closePath();
          ctx.fill(); // Fill the closed path preview
        }
      }
      
      ctx.stroke();
    }

    // Draw points
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      
      // First point is larger and different color if it can close the path
      if (i === 0) {
        const canClose = points.length >= this.MIN_POINTS && 
                        this.isCloseToFirstPoint(currentPreviewPoint);
        
        ctx.fillStyle = canClose ? '#ff6b6b' : '#007bff';
        ctx.beginPath();
        ctx.arc(point.x, point.y, canClose ? 6 : 4, 0, 2 * Math.PI);
        ctx.fill();
        
        // Add closing hint
        if (canClose) {
          ctx.strokeStyle = '#ff6b6b';
          ctx.lineWidth = 2;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.arc(point.x, point.y, 12, 0, 2 * Math.PI);
          ctx.stroke();
        }
      } else {
        // Regular points
        ctx.fillStyle = '#007bff';
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // Draw current mouse position indicator
    if (!this.drawingData.isComplete) {
      ctx.fillStyle = 'rgba(0, 123, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(currentPreviewPoint.x, currentPreviewPoint.y, 2, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Draw point count and instruction
    if (points.length > 0) {
      ctx.setLineDash([]);
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      
      const instructionText = points.length >= this.MIN_POINTS 
        ? `${points.length} points. Click first point to close path`
        : `${points.length} points. Need ${this.MIN_POINTS - points.length} more to close`;
      
      // Draw background for better readability
      ctx.globalAlpha = 0.9;
      const textMetrics = ctx.measureText(instructionText);
      const padding = 6;
      const textX = 10;
      const textY = 10;
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.fillRect(
        textX - padding,
        textY - padding,
        textMetrics.width + padding * 2,
        16 + padding * 2
      );
      
      // Draw text
      ctx.fillStyle = '#007bff';
      ctx.fillText(instructionText, textX, textY);
    }

    ctx.restore();
  }
}