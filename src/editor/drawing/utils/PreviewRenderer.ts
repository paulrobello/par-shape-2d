import type { Point } from '../../systems/GridManager';
import { GeometryRenderer } from '@/shared/rendering/core/GeometryRenderer';

export interface PreviewStyle {
  strokeColor: string;
  fillColor: string;
  lineWidth: number;
  lineDash: number[];
  opacity: number;
}

export const DEFAULT_PREVIEW_STYLE: PreviewStyle = {
  strokeColor: '#007bff',
  fillColor: 'rgba(0, 123, 255, 0.1)',
  lineWidth: 2,
  lineDash: [5, 5],
  opacity: 0.7
};

/**
 * Utility class for rendering drawing previews with consistent styling
 */
export class PreviewRenderer {
  private style: PreviewStyle;

  constructor(style: PreviewStyle = DEFAULT_PREVIEW_STYLE) {
    this.style = style;
  }

  /**
   * Apply preview styling to canvas context
   */
  public applyStyle(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.setLineDash(this.style.lineDash);
    ctx.globalAlpha = this.style.opacity;
    ctx.strokeStyle = this.style.strokeColor;
    ctx.fillStyle = this.style.fillColor;
    ctx.lineWidth = this.style.lineWidth;
  }

  /**
   * Restore canvas context after preview rendering
   */
  public restoreStyle(ctx: CanvasRenderingContext2D): void {
    ctx.restore();
  }

  /**
   * Render a preview circle
   */
  public renderCircle(
    ctx: CanvasRenderingContext2D,
    center: Point,
    radius: number,
    filled: boolean = true
  ): void {
    this.applyStyle(ctx);

    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
    
    if (filled) {
      ctx.fill();
    }
    ctx.stroke();

    this.restoreStyle(ctx);
  }

  /**
   * Render a preview rectangle
   */
  public renderRectangle(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    filled: boolean = true
  ): void {
    this.applyStyle(ctx);

    if (filled) {
      ctx.fillRect(x, y, width, height);
    }
    ctx.strokeRect(x, y, width, height);

    this.restoreStyle(ctx);
  }

  /**
   * Render a preview polygon using GeometryRenderer for consistent rounded corners
   */
  public renderPolygon(
    ctx: CanvasRenderingContext2D,
    center: Point,
    radius: number,
    sides: number,
    filled: boolean = true
  ): void {
    if (sides < 3) return;

    // Generate polygon points
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < sides; i++) {
      const angle = (2 * Math.PI * i) / sides - Math.PI / 2;
      const x = center.x + radius * Math.cos(angle);
      const y = center.y + radius * Math.sin(angle);
      points.push({ x, y });
    }

    // Use GeometryRenderer for consistent rounded corners
    GeometryRenderer.renderPolygon(ctx, {
      points,
      fillColor: filled ? this.style.fillColor : undefined,
      strokeColor: this.style.strokeColor,
      lineWidth: this.style.lineWidth,
      closed: true,
      cornerRadius: 12, // Add rounded corners for polish in editor previews (increased for visibility)
    });
  }

  /**
   * Render a preview capsule
   */
  public renderCapsule(
    ctx: CanvasRenderingContext2D,
    start: Point,
    end: Point,
    thickness: number,
    filled: boolean = true
  ): void {
    this.applyStyle(ctx);

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) {
      // Degenerate case - render as circle
      this.renderCircle(ctx, start, thickness / 2, filled);
      return;
    }

    const unitX = dx / length;
    const unitY = dy / length;
    const perpX = -unitY * (thickness / 2);
    const perpY = unitX * (thickness / 2);

    ctx.beginPath();
    
    // Start cap
    ctx.arc(start.x, start.y, thickness / 2, 0, 2 * Math.PI);
    ctx.moveTo(start.x + perpX, start.y + perpY);
    
    // Top edge
    ctx.lineTo(end.x + perpX, end.y + perpY);
    
    // End cap
    ctx.arc(end.x, end.y, thickness / 2, Math.atan2(perpY, perpX), Math.atan2(perpY, perpX) + Math.PI);
    
    // Bottom edge
    ctx.lineTo(start.x - perpX, start.y - perpY);
    
    ctx.closePath();

    if (filled) {
      ctx.fill();
    }
    ctx.stroke();

    this.restoreStyle(ctx);
  }

  /**
   * Render a preview path using GeometryRenderer for rounded corners
   */
  public renderPath(
    ctx: CanvasRenderingContext2D,
    points: Point[],
    closed: boolean = false,
    filled: boolean = true
  ): void {
    if (points.length < 2) return;

    // Use GeometryRenderer for consistent rounded corners when closed
    if (closed && points.length >= 3) {
      GeometryRenderer.renderPolygon(ctx, {
        points,
        fillColor: filled ? this.style.fillColor : undefined,
        strokeColor: this.style.strokeColor,
        lineWidth: this.style.lineWidth,
        closed: true,
        cornerRadius: 12, // Add rounded corners for closed paths (increased for visibility)
      });
    } else {
      // For open paths, use direct drawing (no corners to round)
      this.applyStyle(ctx);
      
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      
      ctx.stroke();
      this.restoreStyle(ctx);
    }
  }

  /**
   * Render a line between two points
   */
  public renderLine(
    ctx: CanvasRenderingContext2D,
    start: Point,
    end: Point,
    style?: Partial<PreviewStyle>
  ): void {
    const originalStyle = this.style;
    if (style) {
      this.style = { ...this.style, ...style };
    }

    this.applyStyle(ctx);
    
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    this.restoreStyle(ctx);
    this.style = originalStyle;
  }

  /**
   * Render a point marker
   */
  public renderPoint(
    ctx: CanvasRenderingContext2D,
    point: Point,
    radius: number = 3,
    color?: string
  ): void {
    ctx.save();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.fillStyle = color || this.style.strokeColor;
    
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.restore();
  }

  /**
   * Update preview style
   */
  public updateStyle(newStyle: Partial<PreviewStyle>): void {
    this.style = { ...this.style, ...newStyle };
  }

  /**
   * Get current style
   */
  public getStyle(): PreviewStyle {
    return { ...this.style };
  }
}