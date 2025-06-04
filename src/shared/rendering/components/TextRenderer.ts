/**
 * Text rendering utilities with background and styling support
 * Consolidates text rendering patterns from game and editor
 */

import { withContext, setTextStyle, measureText } from '../core/CanvasUtils';
import { GeometryRenderer } from '../core/GeometryRenderer';

export interface TextOptions {
  x: number;
  y: number;
  text: string;
  font?: string;
  fillColor?: string;
  strokeColor?: string;
  textAlign?: CanvasTextAlign;
  textBaseline?: CanvasTextBaseline;
  maxWidth?: number;
}

export interface TextWithBackgroundOptions extends TextOptions {
  backgroundColor?: string;
  backgroundBorderColor?: string;
  backgroundBorderWidth?: number;
  padding?: number;
  backgroundCornerRadius?: number;
  backgroundAlpha?: number;
}

export interface MultilineTextOptions extends TextOptions {
  lineHeight?: number;
  maxLines?: number;
  wordWrap?: boolean;
}

export interface LabelOptions extends TextWithBackgroundOptions {
  anchor?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  offset?: { x: number; y: number };
  arrow?: boolean;
  arrowSize?: number;
}

/**
 * Text rendering utilities class
 */
export class TextRenderer {
  /**
   * Render simple text
   */
  static renderText(ctx: CanvasRenderingContext2D, options: TextOptions): void {
    const {
      x,
      y,
      text,
      font = '12px Arial',
      fillColor = '#000000',
      strokeColor,
      textAlign = 'left',
      textBaseline = 'alphabetic',
      maxWidth,
    } = options;

    withContext(ctx, () => {
      setTextStyle(ctx, font, fillColor, strokeColor, textAlign, textBaseline);
      
      if (fillColor) {
        ctx.fillText(text, x, y, maxWidth);
      }
      if (strokeColor) {
        ctx.strokeText(text, x, y, maxWidth);
      }
    });
  }

  /**
   * Render text with background rectangle
   */
  static renderTextWithBackground(ctx: CanvasRenderingContext2D, options: TextWithBackgroundOptions): void {
    const {
      x,
      y,
      text,
      font = '12px Arial',
      fillColor = '#000000',
      strokeColor,
      textAlign = 'left',
      textBaseline = 'alphabetic',
      backgroundColor = 'rgba(255, 255, 255, 0.8)',
      backgroundBorderColor,
      backgroundBorderWidth = 1,
      padding = 4,
      backgroundCornerRadius = 0,
      backgroundAlpha = 1,
    } = options;

    withContext(ctx, () => {
      // Measure text first
      setTextStyle(ctx, font, fillColor, strokeColor, textAlign, textBaseline);
      const metrics = measureText(ctx, text, font);
      
      // Calculate background rectangle position
      let bgX = x - padding;
      let bgY = y - padding;
      const bgWidth = metrics.width + (padding * 2);
      const bgHeight = metrics.height + (padding * 2);
      
      // Adjust position based on text alignment
      switch (textAlign) {
        case 'center':
          bgX = x - metrics.width / 2 - padding;
          break;
        case 'right':
          bgX = x - metrics.width - padding;
          break;
      }
      
      switch (textBaseline) {
        case 'top':
          bgY = y - padding;
          break;
        case 'middle':
          bgY = y - metrics.height / 2 - padding;
          break;
        case 'bottom':
          bgY = y - metrics.height - padding;
          break;
        case 'alphabetic':
          bgY = y - metrics.height + padding; // Approximate baseline adjustment
          break;
      }
      
      // Render background
      ctx.globalAlpha = backgroundAlpha;
      GeometryRenderer.renderRectangle(ctx, {
        x: bgX,
        y: bgY,
        width: bgWidth,
        height: bgHeight,
        fillColor: backgroundColor,
        strokeColor: backgroundBorderColor,
        lineWidth: backgroundBorderWidth,
        cornerRadius: backgroundCornerRadius,
      });
      ctx.globalAlpha = 1;
      
      // Render text
      setTextStyle(ctx, font, fillColor, strokeColor, textAlign, textBaseline);
      if (fillColor) {
        ctx.fillText(text, x, y);
      }
      if (strokeColor) {
        ctx.strokeText(text, x, y);
      }
    });
  }

  /**
   * Render multiline text
   */
  static renderMultilineText(ctx: CanvasRenderingContext2D, options: MultilineTextOptions): void {
    const {
      x,
      y,
      text,
      font = '12px Arial',
      fillColor = '#000000',
      strokeColor,
      textAlign = 'left',
      textBaseline = 'alphabetic',
      lineHeight,
      maxLines,
      wordWrap = false,
      maxWidth,
    } = options;

    withContext(ctx, () => {
      setTextStyle(ctx, font, fillColor, strokeColor, textAlign, textBaseline);
      
      // Calculate line height if not provided
      const actualLineHeight = lineHeight || measureText(ctx, 'Mg', font).height * 1.2;
      
      let lines: string[];
      
      if (wordWrap && maxWidth) {
        // Word wrap text
        lines = this.wrapText(ctx, text, maxWidth);
      } else {
        // Split on newlines only
        lines = text.split('\n');
      }
      
      // Limit lines if specified
      if (maxLines && lines.length > maxLines) {
        lines = lines.slice(0, maxLines);
        if (lines.length > 0) {
          lines[lines.length - 1] += '...';
        }
      }
      
      // Render each line
      for (let i = 0; i < lines.length; i++) {
        const lineY = y + (i * actualLineHeight);
        
        if (fillColor) {
          ctx.fillText(lines[i], x, lineY, maxWidth);
        }
        if (strokeColor) {
          ctx.strokeText(lines[i], x, lineY, maxWidth);
        }
      }
    });
  }

  /**
   * Render a label with arrow pointing to a target
   */
  static renderLabel(ctx: CanvasRenderingContext2D, targetX: number, targetY: number, options: LabelOptions): void {
    const {
      text,
      anchor = 'top',
      offset = { x: 0, y: 0 },
      arrow = false,
      arrowSize = 8,
      ...textOptions
    } = options;

    withContext(ctx, () => {
      // Calculate label position based on anchor
      let labelX = targetX + offset.x;
      let labelY = targetY + offset.y;
      
      // Calculate metrics for positioning (currently not used for anchor positioning)
      // const metrics = measureText(ctx, text, textOptions.font);
      
      switch (anchor) {
        case 'top':
          labelY = targetY - 20 + offset.y;
          textOptions.textAlign = 'center';
          textOptions.textBaseline = 'bottom';
          break;
        case 'bottom':
          labelY = targetY + 20 + offset.y;
          textOptions.textAlign = 'center';
          textOptions.textBaseline = 'top';
          break;
        case 'left':
          labelX = targetX - 20 + offset.x;
          textOptions.textAlign = 'right';
          textOptions.textBaseline = 'middle';
          break;
        case 'right':
          labelX = targetX + 20 + offset.x;
          textOptions.textAlign = 'left';
          textOptions.textBaseline = 'middle';
          break;
        case 'center':
          textOptions.textAlign = 'center';
          textOptions.textBaseline = 'middle';
          break;
      }
      
      // Render arrow if requested
      if (arrow && anchor !== 'center') {
        const arrowColor = textOptions.strokeColor || textOptions.fillColor || '#000000';
        this.renderArrow(ctx, targetX, targetY, labelX, labelY, arrowSize, arrowColor);
      }
      
      // Render label
      this.renderTextWithBackground(ctx, {
        ...textOptions,
        x: labelX,
        y: labelY,
        text,
      });
    });
  }

  /**
   * Render debug information overlay
   */
  static renderDebugInfo(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    info: Record<string, unknown>,
    options: Partial<TextWithBackgroundOptions> = {}
  ): void {
    const lines = Object.entries(info).map(([key, value]) => `${key}: ${value}`);
    const text = lines.join('\n');
    
    this.renderMultilineText(ctx, {
      x,
      y,
      text,
      font: '10px monospace',
      fillColor: '#ffffff',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      padding: 4,
      lineHeight: 12,
      ...options,
    });
  }

  /**
   * Render dimension annotation
   */
  static renderDimension(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    value: string,
    options: Partial<TextWithBackgroundOptions> = {}
  ): void {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    
    // Draw dimension line
    withContext(ctx, () => {
      ctx.strokeStyle = options.strokeColor || '#666666';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });
    
    // Draw dimension text
    this.renderTextWithBackground(ctx, {
      x: midX,
      y: midY,
      text: value,
      font: '10px Arial',
      fillColor: '#333333',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      textAlign: 'center',
      textBaseline: 'middle',
      padding: 2,
      backgroundCornerRadius: 2,
      ...options,
    });
  }

  /**
   * Helper: Wrap text to fit within max width
   */
  private static wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine !== '') {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }

  /**
   * Helper: Render arrow pointing from one point to another
   */
  private static renderArrow(
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    size: number,
    color: string
  ): void {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const arrowX = fromX + Math.cos(angle) * 10;
    const arrowY = fromY + Math.sin(angle) * 10;
    
    withContext(ctx, () => {
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 1;
      
      // Arrow line
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(arrowX, arrowY);
      ctx.stroke();
      
      // Arrow head
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(
        arrowX - size * Math.cos(angle - Math.PI / 6),
        arrowY - size * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        arrowX - size * Math.cos(angle + Math.PI / 6),
        arrowY - size * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();
    });
  }
}