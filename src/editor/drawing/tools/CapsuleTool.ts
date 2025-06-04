import { BaseTool, type DrawingState } from './BaseTool';
import type { Point } from '../../systems/GridManager';
import type { ShapeDefinition } from '@/types/shapes';

interface CapsuleDrawingData {
  firstEnd: Point;
  secondEnd: Point;
  thickness: number;
  length: number;
}

/**
 * CapsuleTool implements the three-step workflow for creating capsules:
 * 1. Click to set first end
 * 2. Click to set second end (determines length and orientation)
 * 3. Click to set thickness (determines height/radius of rounded ends)
 */
export class CapsuleTool extends BaseTool {
  private drawingData: CapsuleDrawingData | null = null;
  private previewPoint: Point = { x: 0, y: 0 };

  constructor() {
    super(
      {
        name: 'capsule',
        displayName: 'Capsule',
        cursor: 'crosshair',
        description: 'Draw capsules with three clicks: end → end → thickness'
      },
      {
        name: 'waiting_for_first_end',
        step: 0,
        canProgress: true,
        instruction: 'Click to set the first end point'
      }
    );
  }

  protected async onInitialize(): Promise<void> {
    // No initialization needed for CapsuleTool
  }

  protected onUpdate(deltaTime: number): void {
    // No frame-based updates needed for CapsuleTool
    void deltaTime; // Using deltaTime to avoid unused parameter warning
  }

  protected onRender(context: CanvasRenderingContext2D): void {
    // Override render to delegate to our custom render method
    this.render(context);
  }

  protected onDestroy(): void {
    // Clean up any CapsuleTool-specific resources
    this.drawingData = null;
    this.previewPoint = { x: 0, y: 0 };
  }

  protected onActivate(): void {
    this.drawingData = null;
    this.previewPoint = { x: 0, y: 0 };
    this.resetState();
  }

  protected onDeactivate(): void {
    this.drawingData = null;
    this.previewPoint = { x: 0, y: 0 };
  }

  protected onMouseUp(point: Point): void {
    // Capsule tool completes on mouse down, not mouse up
    void point; // Using point to avoid unused parameter warning
  }

  protected onKeyDown(key: string): void {
    // Base class handles ESC cancellation
    void key; // Using key to avoid unused parameter warning
  }

  protected onWheel(deltaY: number): void {
    // CapsuleTool doesn't use mouse wheel
    void deltaY; // Using deltaY to avoid unused parameter warning
  }

  protected onDrawingStart(point: Point): void {
    // First click sets the first end
    this.drawingData = {
      firstEnd: point,
      secondEnd: point,
      thickness: 0,
      length: 0
    };

    this.updateState({
      name: 'setting_second_end',
      step: 1,
      instruction: 'Click to set the second end point',
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

    if (this.currentState.step === 1) {
      // Second click sets the second end
      const length = Math.sqrt(
        Math.pow(point.x - this.drawingData.firstEnd.x, 2) + 
        Math.pow(point.y - this.drawingData.firstEnd.y, 2)
      );

      // Minimum length check
      if (length < 20) {
        return {};
      }

      this.drawingData.secondEnd = point;
      this.drawingData.length = length;

      return {
        newState: {
          name: 'setting_thickness',
          step: 2,
          instruction: 'Click to set the thickness',
          data: this.drawingData
        }
      };
    } else if (this.currentState.step === 2) {
      // Third click sets the thickness and completes the capsule
      const thickness = this.calculateThickness(point);

      // Minimum thickness check
      if (thickness < 10) {
        return {};
      }

      this.drawingData.thickness = thickness;

      // Create capsule shape definition using composite rendering like the game
      const shapeDefinition: ShapeDefinition = {
        id: `capsule_${Date.now()}`,
        name: 'New Capsule',
        category: 'composite',
        enabled: true,
        dimensions: {
          type: 'fixed',
          width: Math.round(this.drawingData.length),
          height: Math.round(thickness)
        },
        physics: {
          type: 'composite',
          composite: {
            parts: [
              {
                type: 'rectangle',
                position: { x: 0, y: 0 },
                dimensions: { width: 'auto', height: 'auto' }
              },
              {
                type: 'circle',
                position: { x: 'left', y: 0 },
                dimensions: { radius: 'auto' }
              },
              {
                type: 'circle',
                position: { x: 'right', y: 0 },
                dimensions: { radius: 'auto' }
              }
            ]
          }
        },
        rendering: {
          type: 'composite',
          compositeParts: [
            {
              type: 'rectangle',
              position: { x: 0, y: 0 },
              dimensions: { width: 'auto', height: 'auto' }
            },
            {
              type: 'arc',
              position: { x: 'left', y: 0 },
              dimensions: { radius: 'auto', startAngle: 1.5708, endAngle: 4.71239 }
            },
            {
              type: 'arc',
              position: { x: 'right', y: 0 },
              dimensions: { radius: 'auto', startAngle: -1.5708, endAngle: 1.5708 }
            }
          ]
        },
        screwPlacement: {
          strategy: 'capsule',
          capsuleEndMargin: 5,
          minSeparation: 48,
          maxScrews: {
            absolute: 8
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

    return {};
  }

  protected generatePreview(point: Point): CapsuleDrawingData | null {
    if (!this.drawingData) {
      return null;
    }

    // Update preview point
    this.previewPoint = point;

    if (this.currentState.step === 1) {
      // Preview second end
      const length = Math.sqrt(
        Math.pow(point.x - this.drawingData.firstEnd.x, 2) + 
        Math.pow(point.y - this.drawingData.firstEnd.y, 2)
      );

      return {
        firstEnd: this.drawingData.firstEnd,
        secondEnd: point,
        thickness: 0,
        length
      };
    } else if (this.currentState.step === 2) {
      // Preview thickness
      const thickness = this.calculateThickness(point);

      return {
        firstEnd: this.drawingData.firstEnd,
        secondEnd: this.drawingData.secondEnd,
        thickness,
        length: this.drawingData.length
      };
    }

    return null;
  }

  /**
   * Calculate thickness based on distance from the capsule center line
   */
  private calculateThickness(point: Point): number {
    if (!this.drawingData) return 0;

    const { firstEnd, secondEnd } = this.drawingData;
    
    // Calculate the perpendicular distance from point to the line between ends
    const lineLength = Math.sqrt(
      Math.pow(secondEnd.x - firstEnd.x, 2) + 
      Math.pow(secondEnd.y - firstEnd.y, 2)
    );

    if (lineLength === 0) return 0;

    // Vector from first end to second end
    const lineVector = {
      x: (secondEnd.x - firstEnd.x) / lineLength,
      y: (secondEnd.y - firstEnd.y) / lineLength
    };

    // Vector from first end to the point
    const pointVector = {
      x: point.x - firstEnd.x,
      y: point.y - firstEnd.y
    };

    // Calculate the perpendicular distance (cross product magnitude)
    const perpDistance = Math.abs(
      pointVector.x * lineVector.y - pointVector.y * lineVector.x
    );

    // Thickness is twice the perpendicular distance (radius to full diameter)
    return perpDistance * 2;
  }

  /**
   * Calculate the perpendicular points for thickness visualization
   */
  private calculatePerpendicularPoints(thickness: number): { top: Point; bottom: Point } | null {
    if (!this.drawingData) return null;

    const { firstEnd, secondEnd } = this.drawingData;
    const lineLength = this.drawingData.length;

    if (lineLength === 0) return null;

    // Normalized perpendicular vector
    const perpVector = {
      x: -(secondEnd.y - firstEnd.y) / lineLength,
      y: (secondEnd.x - firstEnd.x) / lineLength
    };

    const radius = thickness / 2;
    const centerX = (firstEnd.x + secondEnd.x) / 2;
    const centerY = (firstEnd.y + secondEnd.y) / 2;

    return {
      top: {
        x: centerX + perpVector.x * radius,
        y: centerY + perpVector.y * radius
      },
      bottom: {
        x: centerX - perpVector.x * radius,
        y: centerY - perpVector.y * radius
      }
    };
  }


  protected onDrawingComplete(shapeDefinition: ShapeDefinition): void {
    // Reset for next drawing
    this.drawingData = null;
    this.previewPoint = { x: 0, y: 0 };
    void shapeDefinition; // Using shapeDefinition to avoid unused parameter warning
  }

  protected onDrawingCancel(reason: string): void {
    // Reset drawing data
    this.drawingData = null;
    this.previewPoint = { x: 0, y: 0 };
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

    const { firstEnd } = this.drawingData;

    if (this.currentState.step === 1) {
      // Step 1: Show line from first end to current mouse position
      const secondEnd = this.previewPoint;
      const length = Math.sqrt(
        Math.pow(secondEnd.x - firstEnd.x, 2) + 
        Math.pow(secondEnd.y - firstEnd.y, 2)
      );

      if (length > 0) {
        // Draw preview line
        ctx.beginPath();
        ctx.moveTo(firstEnd.x, firstEnd.y);
        ctx.lineTo(secondEnd.x, secondEnd.y);
        ctx.stroke();

        // Draw length dimension
        if (length > 20) {
          ctx.setLineDash([]);
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          
          const dimensionText = `length: ${Math.round(length)}px`;
          const textX = (firstEnd.x + secondEnd.x) / 2;
          const textY = (firstEnd.y + secondEnd.y) / 2 - 10;
          
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
      }
    } else if (this.currentState.step === 2) {
      // Step 2: Show capsule preview with thickness
      const { secondEnd } = this.drawingData;
      const thickness = this.calculateThickness(this.previewPoint);

      if (thickness > 0) {
        const perpPoints = this.calculatePerpendicularPoints(thickness);
        
        if (perpPoints) {
          const radius = thickness / 2;
          
          // Note: Perpendicular vectors are calculated in the new approach below

          // Draw capsule outline using a different approach
          ctx.beginPath();
          
          // Calculate unit vector along the line
          const dx = secondEnd.x - firstEnd.x;
          const dy = secondEnd.y - firstEnd.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          const unitX = dx / len;
          const unitY = dy / len;
          
          // Calculate perpendicular unit vector (rotated 90 degrees counter-clockwise)
          const perpX = -unitY;
          const perpY = unitX;
          
          // Calculate the four corner points we need
          const p1 = { x: firstEnd.x + perpX * radius, y: firstEnd.y + perpY * radius };      // top-left
          const p2 = { x: secondEnd.x + perpX * radius, y: secondEnd.y + perpY * radius };    // top-right
          const p4 = { x: firstEnd.x - perpX * radius, y: firstEnd.y - perpY * radius };      // bottom-left
          
          // Start at top-left
          ctx.moveTo(p1.x, p1.y);
          
          // Top line
          ctx.lineTo(p2.x, p2.y);
          
          // Draw the capsule using a manual approach with multiple arc segments
          // Right end - draw semicircle in segments to ensure it goes outward
          const segments = 10;
          for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI; // 0 to PI
            const x = secondEnd.x + Math.cos(Math.atan2(perpY, perpX) - angle) * radius;
            const y = secondEnd.y + Math.sin(Math.atan2(perpY, perpX) - angle) * radius;
            if (i === 0) {
              // Already at p2, just continue
            } else {
              ctx.lineTo(x, y);
            }
          }
          
          // Bottom line
          ctx.lineTo(p4.x, p4.y);
          
          // Left end - draw semicircle in segments
          for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI; // 0 to PI
            const x = firstEnd.x + Math.cos(Math.atan2(-perpY, -perpX) - angle) * radius;
            const y = firstEnd.y + Math.sin(Math.atan2(-perpY, -perpX) - angle) * radius;
            if (i === 0) {
              // Already at p4, just continue
            } else {
              ctx.lineTo(x, y);
            }
          }
          
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Draw thickness dimension
          if (thickness > 10) {
            ctx.setLineDash([]);
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const dimensionText = `thickness: ${Math.round(thickness)}px`;
            const textX = (firstEnd.x + secondEnd.x) / 2;
            const textY = (firstEnd.y + secondEnd.y) / 2;
            
            // Draw background for better readability
            ctx.globalAlpha = 0.9;
            const textMetrics = ctx.measureText(dimensionText);
            const padding = 4;
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
      }
    }

    // Draw end points
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#007bff';
    
    // First end point
    ctx.beginPath();
    ctx.arc(firstEnd.x, firstEnd.y, 3, 0, 2 * Math.PI);
    ctx.fill();

    // Second end point (if set)
    if (this.currentState.step >= 2 && this.drawingData.secondEnd) {
      ctx.beginPath();
      ctx.arc(this.drawingData.secondEnd.x, this.drawingData.secondEnd.y, 3, 0, 2 * Math.PI);
      ctx.fill();
    }

    ctx.restore();
  }
}