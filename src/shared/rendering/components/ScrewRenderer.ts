/**
 * Consolidated screw renderer for game and editor
 * Supports both full screw rendering and simple indicators
 */

import { RenderContext } from '../core/RenderContext';
import { GeometryRenderer } from '../core/GeometryRenderer';
import { TextRenderer } from './TextRenderer';
import { withContext, withAlpha } from '../core/CanvasUtils';
import { ColorTheme, getThemeForEnvironment, hexToRgba } from '../styles/ColorTheme';
import { UI_CONSTANTS, SCREW_COLORS, DEBUG_CONFIG } from '@/shared/utils/Constants';

export interface ScrewRenderOptions {
  /** Rendering mode */
  mode: 'full' | 'indicator' | 'preview';
  
  /** Visual properties */
  scale?: number;
  alpha?: number;
  
  /** Animation state */
  shakeOffset?: { x: number; y: number };
  animationProgress?: number;
  
  /** State indicators */
  isCollected?: boolean;
  isBeingCollected?: boolean;
  isBeingTransferred?: boolean;
  isRemovable?: boolean;
  isSelected?: boolean;
  isHovered?: boolean;
  
  /** Debug information */
  showDebug?: boolean;
  constraint?: unknown; // Support any constraint type for compatibility
  targetPosition?: { x: number; y: number };
  
  /** Force rendering even if collected */
  forceRender?: boolean;
}

export interface RenderableScrew {
  id: string;
  position: { x: number; y: number };
  color: string;
  
  // State properties
  isCollected?: boolean;
  isBeingCollected?: boolean;
  isBeingTransferred?: boolean;
  isRemovable?: boolean;
  
  // Animation properties
  shakeOffset?: { x: number; y: number };
  collectionProgress?: number;
  transferProgress?: number;
  rotation?: number; // Rotation in radians
  isSpinning?: boolean;
  
  // Debug properties
  constraint?: unknown; // Support any constraint type for compatibility
  targetPosition?: { x: number; y: number };
}

/**
 * Consolidated screw renderer class
 */
export class ScrewRenderer {
  /**
   * Render a single screw with specified options
   */
  static renderScrew(
    screw: RenderableScrew,
    context: RenderContext,
    options: Partial<ScrewRenderOptions> = {}
  ): void {
    const theme = getThemeForEnvironment(context.environment, context.debugMode);
    const finalOptions: ScrewRenderOptions = {
      mode: 'full',
      scale: 1,
      alpha: 1,
      shakeOffset: { x: 0, y: 0 },
      showDebug: context.debugMode,
      forceRender: false,
      ...options,
    };

    // Skip rendering collected screws unless forced
    if (!finalOptions.forceRender && 
        screw.isCollected && 
        !screw.isBeingCollected && 
        !screw.isBeingTransferred) {
      return;
    }

    // Calculate render position with shake offset
    const shakeOffset = finalOptions.shakeOffset || screw.shakeOffset || { x: 0, y: 0 };
    const renderPosition = {
      x: screw.position.x + shakeOffset.x,
      y: screw.position.y + shakeOffset.y,
    };

    // Debug logging for shake rendering (only when there's shake offset)
    if (DEBUG_CONFIG.logScrewDebug && (shakeOffset.x !== 0 || shakeOffset.y !== 0)) {
      console.log(`🎨 Rendering screw ${screw.id} with shake offset: (${shakeOffset.x.toFixed(1)}, ${shakeOffset.y.toFixed(1)}), position: (${screw.position.x.toFixed(1)}, ${screw.position.y.toFixed(1)}) -> (${renderPosition.x.toFixed(1)}, ${renderPosition.y.toFixed(1)})`);
    }

    // Calculate alpha based on animation state
    let alpha = finalOptions.alpha!;
    if (screw.isBeingCollected && screw.collectionProgress !== undefined) {
      alpha *= 1 - screw.collectionProgress * 0.3;
    } else if (screw.isBeingTransferred && screw.transferProgress !== undefined) {
      alpha *= 1 - screw.transferProgress * 0.2;
    }

    withAlpha(context.ctx, alpha, () => {
      switch (finalOptions.mode) {
        case 'full':
          this.renderFullScrew(screw, renderPosition, context, theme, finalOptions);
          break;
        case 'indicator':
          this.renderScrewIndicator(screw, renderPosition, context, theme, finalOptions);
          break;
        case 'preview':
          this.renderScrewPreview(screw, renderPosition, context, theme, finalOptions);
          break;
      }

      // Render debug information if enabled - only in debug mode
      if (finalOptions.showDebug && context.debugMode) {
        this.renderScrewDebug(screw, context, theme);
      }
    });
  }

  /**
   * Render multiple screws with proper sorting
   */
  static renderScrews(
    screws: RenderableScrew[],
    context: RenderContext,
    options: Partial<ScrewRenderOptions> = {}
  ): void {
    // Sort screws by collection state and position for proper layering
    const sortedScrews = [...screws].sort((a, b) => {
      // Collected screws go to back
      if (a.isCollected && !b.isCollected) return -1;
      if (!a.isCollected && b.isCollected) return 1;
      
      // Being collected screws go to front
      if (a.isBeingCollected && !b.isBeingCollected) return 1;
      if (!a.isBeingCollected && b.isBeingCollected) return -1;
      
      // Sort by Y position for depth
      return a.position.y - b.position.y;
    });

    sortedScrews.forEach(screw => {
      this.renderScrew(screw, context, options);
    });
  }

  /**
   * Render full screw with all details and rotation
   */
  private static renderFullScrew(
    screw: RenderableScrew,
    position: { x: number; y: number },
    context: RenderContext,
    theme: ColorTheme,
    options: ScrewRenderOptions
  ): void {
    const { ctx } = context;
    const radius = UI_CONSTANTS.screws.radius * (options.scale || 1);
    const borderWidth = UI_CONSTANTS.screws.borderWidth * (options.scale || 1);
    const rotation = screw.rotation || 0;
    
    // Get screw color
    const screwColor = SCREW_COLORS[screw.color as keyof typeof SCREW_COLORS] || screw.color;

    // Apply rotation transform if needed
    withContext(ctx, () => {
      if (rotation !== 0) {
        ctx.translate(position.x, position.y);
        ctx.rotate(rotation);
        ctx.translate(-position.x, -position.y);
      }

      // Enhanced shadow effects for spinning screws
      if (screw.isSpinning) {
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
      }

      // Draw screw body with enhanced effects
      GeometryRenderer.renderCircle(ctx, {
        x: position.x,
        y: position.y,
        radius,
        fillColor: screwColor,
        strokeColor: theme.screws.border,
        lineWidth: borderWidth,
        shadowBlur: screw.isSpinning ? 6 : 3,
        shadowColor: 'rgba(0, 0, 0, 0.2)',
        shadowOffsetX: 1,
        shadowOffsetY: 1,
        glowColor: screw.isSpinning ? screwColor : undefined,
        glowBlur: screw.isSpinning ? 4 : undefined,
      });

      // Add inner highlight that will rotate to show spinning
      const highlightX = position.x - UI_CONSTANTS.screws.highlight.offsetX * (options.scale || 1);
      const highlightY = position.y - UI_CONSTANTS.screws.highlight.offsetY * (options.scale || 1);
      const highlightRadius = radius * UI_CONSTANTS.screws.highlight.sizeRatio;

      GeometryRenderer.renderCircle(ctx, {
        x: highlightX,
        y: highlightY,
        radius: highlightRadius,
        fillColor: hexToRgba(theme.screws.highlight, 0.4),
      });

      // Draw cross symbol with rotation
      const crossSize = radius * UI_CONSTANTS.screws.cross.sizeRatio;
      this.drawCrossSymbol(ctx, position.x, position.y, crossSize, options.scale || 1, theme);
    });

    // Draw state indicators (outside rotation context to keep them stable)
    this.renderStateIndicators(screw, position, radius, context, theme, options);

    // Selection/hover effects
    if (options.isSelected) {
      this.renderSelectionEffect(ctx, position, radius, theme);
    }
    if (options.isHovered) {
      this.renderHoverEffect(ctx, position, radius, theme);
    }
  }

  /**
   * Render simple screw indicator (for editor)
   */
  private static renderScrewIndicator(
    screw: RenderableScrew,
    position: { x: number; y: number },
    context: RenderContext,
    theme: ColorTheme,
    options: ScrewRenderOptions
  ): void {
    const { ctx } = context;
    const radius = (UI_CONSTANTS.screws.radius * 0.6) * (options.scale || 1);
    const rotation = screw.rotation || 0;
    const screwColor = SCREW_COLORS[screw.color as keyof typeof SCREW_COLORS] || screw.color;

    withContext(ctx, () => {
      if (rotation !== 0) {
        ctx.translate(position.x, position.y);
        ctx.rotate(rotation);
        ctx.translate(-position.x, -position.y);
      }

      GeometryRenderer.renderCircle(ctx, {
        x: position.x,
        y: position.y,
        radius,
        fillColor: screwColor,
        strokeColor: theme.screws.border,
        lineWidth: 1,
      });

      // Add a prominent rotation indicator for editor with proper rotation
      const notchDistance = radius * 0.8;
      const notchX = position.x + Math.cos(rotation) * notchDistance;
      const notchY = position.y + Math.sin(rotation) * notchDistance;
      GeometryRenderer.renderCircle(ctx, {
        x: notchX,
        y: notchY,
        radius: radius * 0.25, // Larger for visibility
        fillColor: theme.screws.border,
      });

      // Add a directional marker to make rotation even more visible
      const markerDistance = radius * 0.6;
      const markerX = position.x + Math.cos(rotation + Math.PI / 4) * markerDistance;
      const markerY = position.y + Math.sin(rotation + Math.PI / 4) * markerDistance;
      GeometryRenderer.renderCircle(ctx, {
        x: markerX,
        y: markerY,
        radius: radius * 0.12,
        fillColor: hexToRgba(theme.screws.cross, 0.8),
      });

      // Simple cross with rotation
      const crossSize = radius * 0.6;
      this.drawCrossSymbol(ctx, position.x, position.y, crossSize, options.scale || 1, theme);
    });
  }

  /**
   * Render screw preview (for placement) with rotation support
   */
  private static renderScrewPreview(
    screw: RenderableScrew,
    position: { x: number; y: number },
    context: RenderContext,
    theme: ColorTheme,
    options: ScrewRenderOptions
  ): void {
    const { ctx } = context;
    const radius = UI_CONSTANTS.screws.radius * (options.scale || 1);
    const rotation = screw.rotation || 0;
    const screwColor = SCREW_COLORS[screw.color as keyof typeof SCREW_COLORS] || screw.color;

    withContext(ctx, () => {
      if (rotation !== 0) {
        ctx.translate(position.x, position.y);
        ctx.rotate(rotation);
        ctx.translate(-position.x, -position.y);
      }

      // Semi-transparent preview
      GeometryRenderer.renderCircle(ctx, {
        x: position.x,
        y: position.y,
        radius,
        fillColor: hexToRgba(screwColor, 0.7),
        strokeColor: hexToRgba(theme.screws.border, 0.8),
        lineWidth: UI_CONSTANTS.screws.borderWidth * (options.scale || 1),
      });

      // Preview highlight with rotation
      const highlightX = position.x - UI_CONSTANTS.screws.highlight.offsetX * (options.scale || 1);
      const highlightY = position.y - UI_CONSTANTS.screws.highlight.offsetY * (options.scale || 1);
      const highlightRadius = radius * UI_CONSTANTS.screws.highlight.sizeRatio;

      GeometryRenderer.renderCircle(ctx, {
        x: highlightX,
        y: highlightY,
        radius: highlightRadius,
        fillColor: hexToRgba(theme.screws.highlight, 0.2),
      });

      // Add rotation indicator for preview mode
      if (rotation !== 0) {
        const indicatorDistance = radius * 0.7;
        const indicatorX = position.x + Math.cos(rotation) * indicatorDistance;
        const indicatorY = position.y + Math.sin(rotation) * indicatorDistance;
        GeometryRenderer.renderCircle(ctx, {
          x: indicatorX,
          y: indicatorY,
          radius: radius * 0.15,
          fillColor: hexToRgba(theme.screws.border, 0.6),
        });
      }

      // Preview cross with enhanced visibility
      const crossSize = radius * UI_CONSTANTS.screws.cross.sizeRatio;
      this.drawCrossSymbol(ctx, position.x, position.y, crossSize, options.scale || 1, theme);
    });
  }

  /**
   * Draw simple 4-point cross symbol
   */
  private static drawCrossSymbol(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    size: number,
    scale: number,
    theme: ColorTheme
  ): void {
    const lineWidth = UI_CONSTANTS.screws.cross.lineWidth * scale;
    const halfSize = size / 2;

    withContext(ctx, () => {
      ctx.strokeStyle = theme.screws.cross;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';

      // Horizontal line
      GeometryRenderer.renderLine(ctx, {
        x1: centerX - halfSize,
        y1: centerY,
        x2: centerX + halfSize,
        y2: centerY,
        strokeColor: theme.screws.cross,
        lineWidth,
      });

      // Vertical line
      GeometryRenderer.renderLine(ctx, {
        x1: centerX,
        y1: centerY - halfSize,
        x2: centerX,
        y2: centerY + halfSize,
        strokeColor: theme.screws.cross,
        lineWidth,
      });
    });
  }

  /**
   * Render state indicators (removable, blocked, etc.)
   */
  private static renderStateIndicators(
    screw: RenderableScrew,
    position: { x: number; y: number },
    radius: number,
    context: RenderContext,
    theme: ColorTheme,
    options: ScrewRenderOptions
  ): void {
    if (!context.debugMode) return;

    const { ctx } = context;
    const scale = options.scale || 1;

    if (screw.isRemovable && !screw.isBeingCollected) {
      // Green glow for removable screws
      withContext(ctx, () => {
        ctx.shadowColor = '#27AE60';
        ctx.shadowBlur = 8;
        
        const removableRadius = radius + UI_CONSTANTS.screws.indicators.removableRadiusOffset * scale;
        GeometryRenderer.renderCircle(ctx, {
          x: position.x,
          y: position.y,
          radius: removableRadius,
          strokeColor: hexToRgba('#27AE60', 0.6),
          lineWidth: 1 * scale,
        });
      });
    } else if (!screw.isRemovable && !screw.isCollected) {
      // Red indication for blocked screws
      const blockedRadius = radius + UI_CONSTANTS.screws.indicators.blockedRadiusOffset * scale;
      
      GeometryRenderer.renderCircle(ctx, {
        x: position.x,
        y: position.y,
        radius: blockedRadius,
        fillColor: hexToRgba(theme.debug.error, 0.2),
      });

      // Blocked pattern (diagonal lines)
      const size = radius * 0.8;
      GeometryRenderer.renderLine(ctx, {
        x1: position.x - size,
        y1: position.y - size,
        x2: position.x + size,
        y2: position.y + size,
        strokeColor: hexToRgba(theme.debug.error, 0.6),
        lineWidth: 1 * scale,
      });

      GeometryRenderer.renderLine(ctx, {
        x1: position.x + size,
        y1: position.y - size,
        x2: position.x - size,
        y2: position.y + size,
        strokeColor: hexToRgba(theme.debug.error, 0.6),
        lineWidth: 1 * scale,
      });
    }
  }

  /**
   * Render selection effect
   */
  private static renderSelectionEffect(
    ctx: CanvasRenderingContext2D,
    position: { x: number; y: number },
    radius: number,
    theme: ColorTheme
  ): void {
    GeometryRenderer.renderCircle(ctx, {
      x: position.x,
      y: position.y,
      radius: radius + 3,
      strokeColor: theme.shapes.selected,
      lineWidth: 2,
    });
  }

  /**
   * Render hover effect
   */
  private static renderHoverEffect(
    ctx: CanvasRenderingContext2D,
    position: { x: number; y: number },
    radius: number,
    theme: ColorTheme
  ): void {
    GeometryRenderer.renderCircle(ctx, {
      x: position.x,
      y: position.y,
      radius: radius + 2,
      strokeColor: theme.shapes.highlight,
      lineWidth: 1,
    });
  }

  /**
   * Render debug information for screw
   */
  private static renderScrewDebug(
    screw: RenderableScrew,
    context: RenderContext,
    theme: ColorTheme
  ): void {
    const debugInfo = {
      id: screw.id,
      color: screw.color,
      state: this.getScrewState(screw),
    };

    TextRenderer.renderDebugInfo(
      context.ctx,
      screw.position.x + 15,
      screw.position.y - 15,
      debugInfo,
      {
        fillColor: theme.debug.text,
        backgroundColor: theme.debug.background,
      }
    );

    // Draw constraint line if exists
    if (screw.constraint && 
        typeof screw.constraint === 'object' && 
        screw.constraint !== null &&
        'bodyA' in screw.constraint) {
      const constraint = screw.constraint as { bodyA?: { position: { x: number; y: number } } };
      const shape = constraint.bodyA;
      if (shape && shape.position) {
        GeometryRenderer.renderLine(context.ctx, {
          x1: screw.position.x,
          y1: screw.position.y,
          x2: shape.position.x,
          y2: shape.position.y,
          strokeColor: theme.debug.warning,
          lineWidth: 1,
          lineDash: [2, 2],
        });
      }
    }

    // Draw collection target if animating
    if (screw.isBeingCollected && screw.targetPosition) {
      GeometryRenderer.renderCircle(context.ctx, {
        x: screw.targetPosition.x,
        y: screw.targetPosition.y,
        radius: 5,
        strokeColor: theme.debug.bounds,
        lineWidth: 2,
      });

      // Animation path
      GeometryRenderer.renderLine(context.ctx, {
        x1: screw.position.x,
        y1: screw.position.y,
        x2: screw.targetPosition.x,
        y2: screw.targetPosition.y,
        strokeColor: theme.debug.bounds,
        lineWidth: 1,
        lineDash: [4, 4],
      });
    }
  }

  /**
   * Get human-readable screw state
   */
  private static getScrewState(screw: RenderableScrew): string {
    if (screw.isCollected) return 'collected';
    if (screw.isBeingCollected) return 'collecting';
    if (screw.isBeingTransferred) return 'transferring';
    if (!screw.isRemovable) return 'blocked';
    return 'active';
  }

  /**
   * Render simple point for screw placement
   */
  static renderScrewPoint(
    position: { x: number; y: number },
    color: string,
    context: RenderContext,
    options: { radius?: number; style?: 'circle' | 'cross' | 'dot' } = {}
  ): void {
    const theme = getThemeForEnvironment(context.environment);
    const { radius = 3, style = 'circle' } = options;

    GeometryRenderer.renderPoint(context.ctx, {
      x: position.x,
      y: position.y,
      radius,
      fillColor: color,
      strokeColor: theme.screws.border,
      lineWidth: 1,
      style,
    });
  }

  /**
   * Render screw placement preview
   */
  static renderPlacementPreview(
    position: { x: number; y: number },
    color: string,
    context: RenderContext,
    options: Partial<ScrewRenderOptions> = {}
  ): void {
    const screwColor = SCREW_COLORS[color as keyof typeof SCREW_COLORS] || color;
    
    const dummyScrew: RenderableScrew = {
      id: 'preview',
      position,
      color: screwColor,
    };

    this.renderScrew(dummyScrew, context, {
      mode: 'preview',
      ...options,
    });
  }

  /**
   * Render a collected screw at a specific location with proper scaling
   * This method is specifically for rendering screws in containers and holding holes
   */
  static renderCollectedScrew(
    screw: RenderableScrew,
    position: { x: number; y: number },
    context: RenderContext,
    scale: number = 0.6
  ): void {
    // Create a temporary screw object with the destination position
    const collectedScrew: RenderableScrew = {
      ...screw,
      position,
      shakeOffset: { x: 0, y: 0 }, // No shake for collected screws
      isCollected: true,
      // Ensure these animation properties are reset
      isBeingCollected: false,
      isBeingTransferred: false,
      collectionProgress: 0,
      transferProgress: 0,
      // Keep rotation for collected screws to show final rotation state
      rotation: screw.rotation || 0,
      isSpinning: false // But not spinning anymore
    };
    
    // Force render the screw at the destination with the specified scale
    this.renderScrew(collectedScrew, context, {
      mode: 'full',
      scale,
      forceRender: true
    });
  }
}