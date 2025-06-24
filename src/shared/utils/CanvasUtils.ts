/**
 * CanvasUtils - Common canvas operations and drawing utilities
 * 
 * Provides reusable patterns for:
 * - Context state management
 * - Common drawing operations
 * - Transform utilities
 * - Path building helpers
 * - Image and pattern management
 * - Performance optimizations
 */

import { Vector2 } from '@/types/game';

/**
 * Drawing style options
 */
export interface DrawStyle {
  fillStyle?: string | CanvasGradient | CanvasPattern;
  strokeStyle?: string | CanvasGradient | CanvasPattern;
  lineWidth?: number;
  lineCap?: CanvasLineCap;
  lineJoin?: CanvasLineJoin;
  globalAlpha?: number;
  globalCompositeOperation?: GlobalCompositeOperation;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
}

/**
 * Text drawing options
 */
export interface TextStyle extends DrawStyle {
  font?: string;
  textAlign?: CanvasTextAlign;
  textBaseline?: CanvasTextBaseline;
  maxWidth?: number;
}

/**
 * Rounded rectangle options
 */
export interface RoundedRectOptions {
  topLeft?: number;
  topRight?: number;
  bottomLeft?: number;
  bottomRight?: number;
}

export class CanvasUtils {
  /**
   * Execute a drawing operation with saved/restored context state
   * 
   * @example
   * CanvasUtils.withContext(ctx, (ctx) => {
   *   ctx.translate(100, 100);
   *   ctx.rotate(Math.PI / 4);
   *   ctx.fillRect(-50, -50, 100, 100);
   * }); // Context state automatically restored
   */
  static withContext(
    ctx: CanvasRenderingContext2D,
    operation: (ctx: CanvasRenderingContext2D) => void
  ): void {
    ctx.save();
    try {
      operation(ctx);
    } finally {
      ctx.restore();
    }
  }

  /**
   * Apply drawing styles to context
   * 
   * @example
   * CanvasUtils.applyStyle(ctx, {
   *   fillStyle: '#ff0000',
   *   strokeStyle: '#000000',
   *   lineWidth: 2,
   *   globalAlpha: 0.8
   * });
   */
  static applyStyle(ctx: CanvasRenderingContext2D, style: DrawStyle): void {
    if (style.fillStyle !== undefined) ctx.fillStyle = style.fillStyle;
    if (style.strokeStyle !== undefined) ctx.strokeStyle = style.strokeStyle;
    if (style.lineWidth !== undefined) ctx.lineWidth = style.lineWidth;
    if (style.lineCap !== undefined) ctx.lineCap = style.lineCap;
    if (style.lineJoin !== undefined) ctx.lineJoin = style.lineJoin;
    if (style.globalAlpha !== undefined) ctx.globalAlpha = style.globalAlpha;
    if (style.globalCompositeOperation !== undefined) {
      ctx.globalCompositeOperation = style.globalCompositeOperation;
    }
    if (style.shadowColor !== undefined) ctx.shadowColor = style.shadowColor;
    if (style.shadowBlur !== undefined) ctx.shadowBlur = style.shadowBlur;
    if (style.shadowOffsetX !== undefined) ctx.shadowOffsetX = style.shadowOffsetX;
    if (style.shadowOffsetY !== undefined) ctx.shadowOffsetY = style.shadowOffsetY;
  }

  /**
   * Draw a rounded rectangle
   * 
   * @example
   * CanvasUtils.drawRoundedRect(ctx, 10, 10, 100, 50, 10);
   * ctx.fill();
   * 
   * // Different corner radii
   * CanvasUtils.drawRoundedRect(ctx, 10, 10, 100, 50, {
   *   topLeft: 10,
   *   topRight: 5,
   *   bottomLeft: 0,
   *   bottomRight: 15
   * });
   */
  static drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number | RoundedRectOptions
  ): void {
    const radii = typeof radius === 'number' 
      ? { topLeft: radius, topRight: radius, bottomLeft: radius, bottomRight: radius }
      : { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0, ...radius };

    ctx.beginPath();
    ctx.moveTo(x + radii.topLeft, y);
    ctx.lineTo(x + width - radii.topRight, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radii.topRight);
    ctx.lineTo(x + width, y + height - radii.bottomRight);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radii.bottomRight, y + height);
    ctx.lineTo(x + radii.bottomLeft, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radii.bottomLeft);
    ctx.lineTo(x, y + radii.topLeft);
    ctx.quadraticCurveTo(x, y, x + radii.topLeft, y);
    ctx.closePath();
  }

  /**
   * Draw a circle
   * 
   * @example
   * CanvasUtils.drawCircle(ctx, 50, 50, 20);
   * ctx.fill();
   */
  static drawCircle(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number
  ): void {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.closePath();
  }

  /**
   * Draw a polygon from points
   * 
   * @example
   * const points = [
   *   { x: 0, y: 0 },
   *   { x: 100, y: 0 },
   *   { x: 50, y: 100 }
   * ];
   * CanvasUtils.drawPolygon(ctx, points);
   * ctx.stroke();
   */
  static drawPolygon(
    ctx: CanvasRenderingContext2D,
    points: Vector2[],
    close = true
  ): void {
    if (points.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    
    if (close) {
      ctx.closePath();
    }
  }

  /**
   * Draw a line between two points
   * 
   * @example
   * CanvasUtils.drawLine(ctx, { x: 0, y: 0 }, { x: 100, y: 100 }, {
   *   strokeStyle: '#ff0000',
   *   lineWidth: 2
   * });
   */
  static drawLine(
    ctx: CanvasRenderingContext2D,
    from: Vector2,
    to: Vector2,
    style?: DrawStyle
  ): void {
    this.withContext(ctx, (ctx) => {
      if (style) this.applyStyle(ctx, style);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    });
  }

  /**
   * Draw an arrow
   * 
   * @example
   * CanvasUtils.drawArrow(ctx, { x: 0, y: 0 }, { x: 100, y: 0 }, {
   *   headLength: 15,
   *   headAngle: Math.PI / 6
   * });
   */
  static drawArrow(
    ctx: CanvasRenderingContext2D,
    from: Vector2,
    to: Vector2,
    options: {
      headLength?: number;
      headAngle?: number;
      style?: DrawStyle;
    } = {}
  ): void {
    const { headLength = 10, headAngle = Math.PI / 6, style } = options;
    
    this.withContext(ctx, (ctx) => {
      if (style) this.applyStyle(ctx, style);
      
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const angle = Math.atan2(dy, dx);
      
      // Draw line
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      
      // Draw arrowhead
      ctx.beginPath();
      ctx.moveTo(to.x, to.y);
      ctx.lineTo(
        to.x - headLength * Math.cos(angle - headAngle),
        to.y - headLength * Math.sin(angle - headAngle)
      );
      ctx.moveTo(to.x, to.y);
      ctx.lineTo(
        to.x - headLength * Math.cos(angle + headAngle),
        to.y - headLength * Math.sin(angle + headAngle)
      );
      ctx.stroke();
    });
  }

  /**
   * Draw text with style
   * 
   * @example
   * CanvasUtils.drawText(ctx, 'Hello World', 100, 100, {
   *   font: '20px Arial',
   *   fillStyle: '#000000',
   *   textAlign: 'center',
   *   textBaseline: 'middle'
   * });
   */
  static drawText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    style?: TextStyle
  ): void {
    this.withContext(ctx, (ctx) => {
      if (style) {
        this.applyStyle(ctx, style);
        if (style.font) ctx.font = style.font;
        if (style.textAlign) ctx.textAlign = style.textAlign;
        if (style.textBaseline) ctx.textBaseline = style.textBaseline;
      }
      
      if (style?.strokeStyle) {
        if (style.maxWidth !== undefined) {
          ctx.strokeText(text, x, y, style.maxWidth);
        } else {
          ctx.strokeText(text, x, y);
        }
      }
      
      if (style?.fillStyle || !style?.strokeStyle) {
        if (style?.maxWidth !== undefined) {
          ctx.fillText(text, x, y, style.maxWidth);
        } else {
          ctx.fillText(text, x, y);
        }
      }
    });
  }

  /**
   * Create a linear gradient
   * 
   * @example
   * const gradient = CanvasUtils.createLinearGradient(ctx, 0, 0, 100, 100, [
   *   { offset: 0, color: '#ff0000' },
   *   { offset: 0.5, color: '#00ff00' },
   *   { offset: 1, color: '#0000ff' }
   * ]);
   * ctx.fillStyle = gradient;
   */
  static createLinearGradient(
    ctx: CanvasRenderingContext2D,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    stops: Array<{ offset: number; color: string }>
  ): CanvasGradient {
    const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
    for (const stop of stops) {
      gradient.addColorStop(stop.offset, stop.color);
    }
    return gradient;
  }

  /**
   * Create a radial gradient
   * 
   * @example
   * const gradient = CanvasUtils.createRadialGradient(ctx, 50, 50, 0, 50, 50, 50, [
   *   { offset: 0, color: '#ffffff' },
   *   { offset: 1, color: '#000000' }
   * ]);
   */
  static createRadialGradient(
    ctx: CanvasRenderingContext2D,
    x0: number,
    y0: number,
    r0: number,
    x1: number,
    y1: number,
    r1: number,
    stops: Array<{ offset: number; color: string }>
  ): CanvasGradient {
    const gradient = ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
    for (const stop of stops) {
      gradient.addColorStop(stop.offset, stop.color);
    }
    return gradient;
  }

  /**
   * Clear a rectangular area
   * 
   * @example
   * CanvasUtils.clear(ctx, 0, 0, canvas.width, canvas.height);
   */
  static clear(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    ctx.clearRect(x, y, width, height);
  }

  /**
   * Clear entire canvas
   * 
   * @example
   * CanvasUtils.clearCanvas(ctx, canvas.width, canvas.height);
   */
  static clearCanvas(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    ctx.clearRect(0, 0, width, height);
  }

  /**
   * Apply transform to context
   * 
   * @example
   * CanvasUtils.transform(ctx, {
   *   translate: { x: 100, y: 100 },
   *   rotate: Math.PI / 4,
   *   scale: { x: 2, y: 2 }
   * });
   */
  static transform(
    ctx: CanvasRenderingContext2D,
    options: {
      translate?: Vector2;
      rotate?: number;
      scale?: Vector2 | number;
      skew?: { x: number; y: number };
    }
  ): void {
    if (options.translate) {
      ctx.translate(options.translate.x, options.translate.y);
    }
    
    if (options.rotate !== undefined) {
      ctx.rotate(options.rotate);
    }
    
    if (options.scale !== undefined) {
      if (typeof options.scale === 'number') {
        ctx.scale(options.scale, options.scale);
      } else {
        ctx.scale(options.scale.x, options.scale.y);
      }
    }
    
    if (options.skew) {
      ctx.transform(1, options.skew.y, options.skew.x, 1, 0, 0);
    }
  }

  /**
   * Draw image with optional clipping
   * 
   * @example
   * CanvasUtils.drawImage(ctx, image, {
   *   x: 100,
   *   y: 100,
   *   width: 200,
   *   height: 200,
   *   sourceRect: { x: 0, y: 0, width: 50, height: 50 }
   * });
   */
  static drawImage(
    ctx: CanvasRenderingContext2D,
    image: CanvasImageSource,
    options: {
      x: number;
      y: number;
      width?: number;
      height?: number;
      sourceRect?: { x: number; y: number; width: number; height: number };
      alpha?: number;
    }
  ): void {
    this.withContext(ctx, (ctx) => {
      if (options.alpha !== undefined) {
        ctx.globalAlpha = options.alpha;
      }
      
      if (options.sourceRect) {
        const { x: sx, y: sy, width: sw, height: sh } = options.sourceRect;
        ctx.drawImage(
          image,
          sx, sy, sw, sh,
          options.x, options.y,
          options.width || sw,
          options.height || sh
        );
      } else if (options.width !== undefined && options.height !== undefined) {
        ctx.drawImage(image, options.x, options.y, options.width, options.height);
      } else {
        ctx.drawImage(image, options.x, options.y);
      }
    });
  }

  /**
   * Create and manage offscreen canvas for performance
   * 
   * @example
   * const offscreen = CanvasUtils.createOffscreenCanvas(200, 200);
   * // Draw to offscreen.ctx
   * CanvasUtils.drawCircle(offscreen.ctx, 100, 100, 50);
   * offscreen.ctx.fill();
   * // Draw offscreen to main canvas
   * ctx.drawImage(offscreen.canvas, 0, 0);
   */
  static createOffscreenCanvas(
    width: number,
    height: number
  ): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    return { canvas, ctx };
  }

  /**
   * Measure text dimensions
   * 
   * @example
   * const metrics = CanvasUtils.measureText(ctx, 'Hello World', '20px Arial');
   * console.log(metrics.width, metrics.height);
   */
  static measureText(
    ctx: CanvasRenderingContext2D,
    text: string,
    font?: string
  ): { width: number; height: number } {
    const savedFont = ctx.font;
    if (font) ctx.font = font;
    
    const metrics = ctx.measureText(text);
    const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
    
    if (font) ctx.font = savedFont;
    
    return { width: metrics.width, height };
  }

  /**
   * Create a pattern from an image
   * 
   * @example
   * const pattern = await CanvasUtils.createPattern(ctx, 'texture.png', 'repeat');
   * ctx.fillStyle = pattern;
   */
  static async createPattern(
    ctx: CanvasRenderingContext2D,
    source: string | CanvasImageSource,
    repetition: 'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat' = 'repeat'
  ): Promise<CanvasPattern | null> {
    let image: CanvasImageSource;
    
    if (typeof source === 'string') {
      image = new Image();
      await new Promise<void>((resolve, reject) => {
        (image as HTMLImageElement).onload = () => resolve();
        (image as HTMLImageElement).onerror = reject;
        (image as HTMLImageElement).src = source;
      });
    } else {
      image = source;
    }
    
    return ctx.createPattern(image, repetition);
  }
}