/**
 * Geometry rendering utilities
 * Consolidated primitive shape rendering for game and editor
 */

import { withContext, setFillAndStroke } from './CanvasUtils';

export interface CircleOptions {
  x: number;
  y: number;
  radius: number;
  fillColor?: string;
  strokeColor?: string;
  lineWidth?: number;
  startAngle?: number;
  endAngle?: number;
  counterClockwise?: boolean;
}

export interface RectangleOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor?: string;
  strokeColor?: string;
  lineWidth?: number;
  cornerRadius?: number;
}

export interface PolygonOptions {
  points: { x: number; y: number }[];
  fillColor?: string;
  strokeColor?: string;
  lineWidth?: number;
  closed?: boolean;
}

export interface CapsuleOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor?: string;
  strokeColor?: string;
  lineWidth?: number;
}

export interface PathOptions {
  path: Path2D | { x: number; y: number }[];
  fillColor?: string;
  strokeColor?: string;
  lineWidth?: number;
  closed?: boolean;
}

export interface LineOptions {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  strokeColor?: string;
  lineWidth?: number;
  lineDash?: number[];
}

export interface PointOptions {
  x: number;
  y: number;
  radius?: number;
  fillColor?: string;
  strokeColor?: string;
  lineWidth?: number;
  style?: 'circle' | 'cross' | 'dot';
}

export interface TwoLayerHoleOptions {
  x: number;
  y: number;
  outerRadius: number;
  innerRadius: number;
  outerFillColor?: string;
  outerStrokeColor?: string;
  outerLineWidth?: number;
  innerFillColor?: string;
  innerStrokeColor?: string;
  innerLineWidth?: number;
}

/**
 * Consolidated geometry rendering class
 */
export class GeometryRenderer {
  /**
   * Render a circle
   */
  static renderCircle(ctx: CanvasRenderingContext2D, options: CircleOptions): void {
    const {
      x,
      y,
      radius,
      fillColor,
      strokeColor,
      lineWidth = 1,
      startAngle = 0,
      endAngle = Math.PI * 2,
      counterClockwise = false,
    } = options;

    withContext(ctx, () => {
      setFillAndStroke(ctx, fillColor, strokeColor, lineWidth);
      
      ctx.beginPath();
      ctx.arc(x, y, radius, startAngle, endAngle, counterClockwise);
      
      if (fillColor) {
        ctx.fill();
      }
      if (strokeColor) {
        ctx.stroke();
      }
    });
  }

  /**
   * Render a two-layer hole (outer border + inner hole)
   * Used for container holes and holding holes
   */
  static renderTwoLayerHole(ctx: CanvasRenderingContext2D, options: TwoLayerHoleOptions): void {
    const {
      x,
      y,
      outerRadius,
      innerRadius,
      outerFillColor = '#1A1A1A',
      outerStrokeColor = '#5F6368',
      outerLineWidth = 2,
      innerFillColor = '#0A0A0A',
      innerStrokeColor = '#3C3C3C',
      innerLineWidth = 1
    } = options;

    // Render outer hole border
    this.renderCircle(ctx, {
      x,
      y,
      radius: outerRadius,
      fillColor: outerFillColor,
      strokeColor: outerStrokeColor,
      lineWidth: outerLineWidth
    });

    // Render inner hole
    this.renderCircle(ctx, {
      x,
      y,
      radius: innerRadius,
      fillColor: innerFillColor,
      strokeColor: innerStrokeColor,
      lineWidth: innerLineWidth
    });
  }

  /**
   * Render a rectangle (with optional rounded corners)
   */
  static renderRectangle(ctx: CanvasRenderingContext2D, options: RectangleOptions): void {
    const {
      x,
      y,
      width,
      height,
      fillColor,
      strokeColor,
      lineWidth = 1,
      cornerRadius = 0,
    } = options;

    withContext(ctx, () => {
      setFillAndStroke(ctx, fillColor, strokeColor, lineWidth);
      
      if (cornerRadius > 0) {
        // Rounded rectangle
        const r = Math.min(cornerRadius, width / 2, height / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + width - r, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + r);
        ctx.lineTo(x + width, y + height - r);
        ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
        ctx.lineTo(x + r, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
      } else {
        // Regular rectangle
        ctx.beginPath();
        ctx.rect(x, y, width, height);
      }
      
      if (fillColor) {
        ctx.fill();
      }
      if (strokeColor) {
        ctx.stroke();
      }
    });
  }

  /**
   * Render a polygon from points
   */
  static renderPolygon(ctx: CanvasRenderingContext2D, options: PolygonOptions): void {
    const { points, fillColor, strokeColor, lineWidth = 1, closed = true } = options;

    if (points.length < 2) return;

    withContext(ctx, () => {
      setFillAndStroke(ctx, fillColor, strokeColor, lineWidth);
      
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      
      if (closed) {
        ctx.closePath();
      }
      
      if (fillColor && closed) {
        ctx.fill();
      }
      if (strokeColor) {
        ctx.stroke();
      }
    });
  }

  /**
   * Render a capsule (rounded rectangle)
   */
  static renderCapsule(ctx: CanvasRenderingContext2D, options: CapsuleOptions): void {
    const { x, y, width, height, fillColor, strokeColor, lineWidth = 1 } = options;

    withContext(ctx, () => {
      setFillAndStroke(ctx, fillColor, strokeColor, lineWidth);
      
      const radius = Math.min(width, height) / 2;
      
      ctx.beginPath();
      
      if (width > height) {
        // Horizontal capsule
        const centerY = y + height / 2;
        const leftX = x + radius;
        const rightX = x + width - radius;
        
        // Left semicircle
        ctx.arc(leftX, centerY, radius, Math.PI / 2, -Math.PI / 2, false);
        // Top line
        ctx.lineTo(rightX, y);
        // Right semicircle
        ctx.arc(rightX, centerY, radius, -Math.PI / 2, Math.PI / 2, false);
        // Bottom line
        ctx.lineTo(leftX, y + height);
      } else {
        // Vertical capsule
        const centerX = x + width / 2;
        const topY = y + radius;
        const bottomY = y + height - radius;
        
        // Top semicircle
        ctx.arc(centerX, topY, radius, Math.PI, 0, false);
        // Right line
        ctx.lineTo(x + width, bottomY);
        // Bottom semicircle
        ctx.arc(centerX, bottomY, radius, 0, Math.PI, false);
        // Left line
        ctx.lineTo(x, topY);
      }
      
      ctx.closePath();
      
      if (fillColor) {
        ctx.fill();
      }
      if (strokeColor) {
        ctx.stroke();
      }
    });
  }

  /**
   * Render a path (Path2D or point array)
   */
  static renderPath(ctx: CanvasRenderingContext2D, options: PathOptions): void {
    const { path, fillColor, strokeColor, lineWidth = 1, closed = false } = options;

    withContext(ctx, () => {
      setFillAndStroke(ctx, fillColor, strokeColor, lineWidth);
      
      if (path instanceof Path2D) {
        // Use Path2D directly
        if (fillColor) {
          ctx.fill(path);
        }
        if (strokeColor) {
          ctx.stroke(path);
        }
      } else if (Array.isArray(path) && path.length > 0) {
        // Convert point array to path
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        
        for (let i = 1; i < path.length; i++) {
          ctx.lineTo(path[i].x, path[i].y);
        }
        
        if (closed) {
          ctx.closePath();
        }
        
        if (fillColor && closed) {
          ctx.fill();
        }
        if (strokeColor) {
          ctx.stroke();
        }
      }
    });
  }

  /**
   * Render a line
   */
  static renderLine(ctx: CanvasRenderingContext2D, options: LineOptions): void {
    const { x1, y1, x2, y2, strokeColor, lineWidth = 1, lineDash } = options;

    withContext(ctx, () => {
      setFillAndStroke(ctx, undefined, strokeColor, lineWidth);
      
      if (lineDash) {
        ctx.setLineDash(lineDash);
      }
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });
  }

  /**
   * Render a point (circle, cross, or dot)
   */
  static renderPoint(ctx: CanvasRenderingContext2D, options: PointOptions): void {
    const {
      x,
      y,
      radius = 3,
      fillColor,
      strokeColor,
      lineWidth = 1,
      style = 'circle',
    } = options;

    withContext(ctx, () => {
      setFillAndStroke(ctx, fillColor, strokeColor, lineWidth);
      
      switch (style) {
        case 'circle':
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          if (fillColor) ctx.fill();
          if (strokeColor) ctx.stroke();
          break;
          
        case 'cross':
          ctx.beginPath();
          ctx.moveTo(x - radius, y);
          ctx.lineTo(x + radius, y);
          ctx.moveTo(x, y - radius);
          ctx.lineTo(x, y + radius);
          if (strokeColor) ctx.stroke();
          break;
          
        case 'dot':
          ctx.beginPath();
          ctx.arc(x, y, Math.max(1, radius / 2), 0, Math.PI * 2);
          if (fillColor) ctx.fill();
          if (strokeColor) ctx.stroke();
          break;
      }
    });
  }

  /**
   * Render multiple circles (optimized batch rendering)
   */
  static renderCircles(ctx: CanvasRenderingContext2D, circles: CircleOptions[]): void {
    if (circles.length === 0) return;

    // Group by style for better performance
    const styleGroups = new Map<string, CircleOptions[]>();
    
    for (const circle of circles) {
      const styleKey = `${circle.fillColor || 'none'}-${circle.strokeColor || 'none'}-${circle.lineWidth || 1}`;
      if (!styleGroups.has(styleKey)) {
        styleGroups.set(styleKey, []);
      }
      styleGroups.get(styleKey)!.push(circle);
    }

    // Render each style group
    for (const [, group] of styleGroups) {
      const firstCircle = group[0];
      withContext(ctx, () => {
        setFillAndStroke(ctx, firstCircle.fillColor, firstCircle.strokeColor, firstCircle.lineWidth);
        
        for (const circle of group) {
          ctx.beginPath();
          ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
          if (firstCircle.fillColor) ctx.fill();
          if (firstCircle.strokeColor) ctx.stroke();
        }
      });
    }
  }

  /**
   * Render multiple lines (optimized batch rendering)
   */
  static renderLines(ctx: CanvasRenderingContext2D, lines: LineOptions[]): void {
    if (lines.length === 0) return;

    // Group by style for better performance
    const styleGroups = new Map<string, LineOptions[]>();
    
    for (const line of lines) {
      const styleKey = `${line.strokeColor || 'none'}-${line.lineWidth || 1}`;
      if (!styleGroups.has(styleKey)) {
        styleGroups.set(styleKey, []);
      }
      styleGroups.get(styleKey)!.push(line);
    }

    // Render each style group
    for (const [, group] of styleGroups) {
      const firstLine = group[0];
      withContext(ctx, () => {
        setFillAndStroke(ctx, undefined, firstLine.strokeColor, firstLine.lineWidth);
        
        ctx.beginPath();
        for (const line of group) {
          ctx.moveTo(line.x1, line.y1);
          ctx.lineTo(line.x2, line.y2);
        }
        ctx.stroke();
      });
    }
  }
}