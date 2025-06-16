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
  shadowBlur?: number;
  shadowColor?: string;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  glowColor?: string;
  glowBlur?: number;
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
  shadowBlur?: number;
  shadowColor?: string;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  glowColor?: string;
  glowBlur?: number;
}

export interface PolygonOptions {
  points: { x: number; y: number }[];
  fillColor?: string;
  strokeColor?: string;
  lineWidth?: number;
  closed?: boolean;
  cornerRadius?: number;
  shadowBlur?: number;
  shadowColor?: string;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  glowColor?: string;
  glowBlur?: number;
}

export interface CapsuleOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor?: string;
  strokeColor?: string;
  lineWidth?: number;
  shadowBlur?: number;
  shadowColor?: string;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  glowColor?: string;
  glowBlur?: number;
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
 * Interface for shadow/glow effects
 */
interface ShadowGlowOptions {
  shadowBlur?: number;
  shadowColor?: string;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  glowColor?: string;
  glowBlur?: number;
}

/**
 * Consolidated geometry rendering class
 */
export class GeometryRenderer {
  /**
   * Apply shadow effects to context
   */
  private static applyShadow(ctx: CanvasRenderingContext2D, options: ShadowGlowOptions): void {
    if (options.shadowBlur || options.shadowColor) {
      ctx.shadowBlur = options.shadowBlur || 0;
      ctx.shadowColor = options.shadowColor || 'rgba(0,0,0,0.3)';
      ctx.shadowOffsetX = options.shadowOffsetX || 2;
      ctx.shadowOffsetY = options.shadowOffsetY || 2;
    }
  }

  /**
   * Apply glow effects by rendering multiple times with increasing blur
   */
  private static applyGlow(
    ctx: CanvasRenderingContext2D, 
    options: ShadowGlowOptions,
    renderFn: () => void
  ): void {
    if (options.glowColor && options.glowBlur) {
      // Render glow effect by drawing multiple times with increasing blur
      const glowLayers = 3;
      const maxBlur = options.glowBlur || 5;
      
      for (let i = 0; i < glowLayers; i++) {
        withContext(ctx, () => {
          ctx.shadowColor = options.glowColor!;
          ctx.shadowBlur = maxBlur * (i + 1) / glowLayers;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          ctx.globalCompositeOperation = 'screen';
          renderFn();
        });
      }
    }
  }

  /**
   * Clear shadow effects from context
   */
  private static clearShadowGlow(ctx: CanvasRenderingContext2D): void {
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }
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

    const renderCircle = () => {
      ctx.beginPath();
      ctx.arc(x, y, radius, startAngle, endAngle, counterClockwise);
      
      if (fillColor) {
        ctx.fill();
      }
      if (strokeColor) {
        ctx.stroke();
      }
    };

    withContext(ctx, () => {
      setFillAndStroke(ctx, fillColor, strokeColor, lineWidth);
      
      // Apply glow effect first (behind the shape)
      this.applyGlow(ctx, options, renderCircle);
      
      // Apply shadow effects
      this.applyShadow(ctx, options);
      
      // Render the main shape
      renderCircle();
      
      // Clear shadow effects
      this.clearShadowGlow(ctx);
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
   * Render a rectangle (with optional rounded corners and enhanced effects)
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
      cornerRadius = 4, // Default rounded corners for polish
    } = options;

    const renderRectangle = () => {
      if (cornerRadius > 0) {
        // Enhanced rounded rectangle with better curves
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
    };

    withContext(ctx, () => {
      setFillAndStroke(ctx, fillColor, strokeColor, lineWidth);
      
      // Apply glow effect first (behind the shape)
      this.applyGlow(ctx, options, renderRectangle);
      
      // Apply shadow effects
      this.applyShadow(ctx, options);
      
      // Render the main shape
      renderRectangle();
      
      // Clear shadow effects
      this.clearShadowGlow(ctx);
    });
  }

  /**
   * Create a rounded polygon path
   */
  private static createRoundedPolygonPath(
    ctx: CanvasRenderingContext2D,
    points: { x: number; y: number }[],
    cornerRadius: number,
    closed: boolean
  ): void {
    if (points.length < 2) return;
    
    if (cornerRadius <= 0) {
      // No rounding, draw regular polygon
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      if (closed) {
        ctx.closePath();
      }
      return;
    }

    // Draw rounded polygon
    ctx.beginPath();
    
    const processPoints = closed ? [...points, points[0], points[1]] : points;
    
    for (let i = 0; i < processPoints.length - 2; i++) {
      const p1 = processPoints[i];
      const p2 = processPoints[i + 1];
      const p3 = processPoints[i + 2];
      
      if (i === 0) {
        ctx.moveTo(p1.x, p1.y);
      }
      
      // Calculate vectors
      const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
      const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
      
      // Normalize vectors
      const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
      const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
      
      if (len1 > 0 && len2 > 0) {
        v1.x /= len1;
        v1.y /= len1;
        v2.x /= len2;
        v2.y /= len2;
        
        // Calculate corner points
        const radius = Math.min(cornerRadius, len1 / 2, len2 / 2);
        const cp1 = { x: p2.x + v1.x * radius, y: p2.y + v1.y * radius };
        const cp2 = { x: p2.x + v2.x * radius, y: p2.y + v2.y * radius };
        
        ctx.lineTo(cp1.x, cp1.y);
        ctx.quadraticCurveTo(p2.x, p2.y, cp2.x, cp2.y);
      } else {
        ctx.lineTo(p2.x, p2.y);
      }
    }
    
    if (closed) {
      ctx.closePath();
    }
  }

  /**
   * Render a polygon from points with enhanced effects
   */
  static renderPolygon(ctx: CanvasRenderingContext2D, options: PolygonOptions): void {
    const { 
      points, 
      fillColor, 
      strokeColor, 
      lineWidth = 1, 
      closed = true,
      cornerRadius = 0,
    } = options;

    if (points.length < 2) return;

    const renderPolygon = () => {
      this.createRoundedPolygonPath(ctx, points, cornerRadius, closed);
      
      if (fillColor && closed) {
        ctx.fill();
      }
      if (strokeColor) {
        ctx.stroke();
      }
    };

    withContext(ctx, () => {
      setFillAndStroke(ctx, fillColor, strokeColor, lineWidth);
      
      // Apply glow effect first (behind the shape)
      this.applyGlow(ctx, options, renderPolygon);
      
      // Apply shadow effects
      this.applyShadow(ctx, options);
      
      // Render the main shape
      renderPolygon();
      
      // Clear shadow effects
      this.clearShadowGlow(ctx);
    });
  }

  /**
   * Render a capsule (rounded rectangle) with enhanced effects
   */
  static renderCapsule(ctx: CanvasRenderingContext2D, options: CapsuleOptions): void {
    const { x, y, width, height, fillColor, strokeColor, lineWidth = 1 } = options;

    const renderCapsule = () => {
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
    };

    withContext(ctx, () => {
      setFillAndStroke(ctx, fillColor, strokeColor, lineWidth);
      
      // Apply glow effect first (behind the shape)
      this.applyGlow(ctx, options, renderCapsule);
      
      // Apply shadow effects
      this.applyShadow(ctx, options);
      
      // Render the main shape
      renderCapsule();
      
      // Clear shadow effects
      this.clearShadowGlow(ctx);
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