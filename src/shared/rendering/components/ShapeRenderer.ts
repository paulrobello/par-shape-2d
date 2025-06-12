/**
 * Consolidated shape renderer for game and editor
 * Supports both physics-accurate rendering and preview modes
 */

import { Body } from 'matter-js';
import { RenderContext } from '../core/RenderContext';
import { GeometryRenderer } from '../core/GeometryRenderer';
import { TextRenderer } from './TextRenderer';
import { DebugRenderer } from './DebugRenderer';
import { withContext, withTransform, withClip, withCompositeOperation } from '../core/CanvasUtils';
import { ColorTheme, getThemeForEnvironment, hexToRgba } from '../styles/ColorTheme';
import { UI_CONSTANTS } from '@/shared/utils/Constants';

export interface ShapeRenderOptions {
  /** Rendering mode */
  mode: 'physics' | 'preview' | 'selection';
  
  /** Color overrides */
  fillColor?: string;
  strokeColor?: string;
  tintColor?: string;
  
  /** Style overrides */
  alpha?: number;
  lineWidth?: number;
  
  /** Feature flags */
  showHoles?: boolean;
  showDebug?: boolean;
  showTint?: boolean;
  
  /** Animation state */
  scale?: number;
  rotation?: number;
  
  /** Editor-specific */
  isSelected?: boolean;
  isHovered?: boolean;
}

export interface RenderableShape {
  // Core properties
  id: string;
  type: string;
  position: { x: number; y: number };
  rotation: number;
  
  // Visual properties
  color: string;
  tint?: string;
  
  // Geometry
  vertices?: { x: number; y: number }[];
  radius?: number;
  width?: number;
  height?: number;
  
  // Physics
  body?: Body;
  
  // Features
  holes?: { x: number; y: number }[];
  screws?: Array<{ position: { x: number; y: number }; color: string }>;
  
  // Methods
  getPath2D?: () => Path2D;
  getBounds?: () => { x: number; y: number; width: number; height: number };
}

/**
 * Consolidated shape renderer class
 */
export class ShapeRenderer {
  /**
   * Render a single shape with specified options
   */
  static renderShape(
    shape: RenderableShape,
    context: RenderContext,
    options: Partial<ShapeRenderOptions> = {}
  ): void {
    const theme = getThemeForEnvironment(context.environment, context.debugMode);
    const finalOptions: ShapeRenderOptions = {
      mode: 'physics',
      showHoles: true,
      showDebug: context.debugMode,
      showTint: true,
      alpha: theme.shapes.alpha,
      lineWidth: UI_CONSTANTS.shapes.borderWidth,
      scale: 1,
      ...options,
    };

    withContext(context.ctx, () => {
      // Always apply transformations since paths are now origin-relative
      // Even if rotation is 0 and scale is 1, we need to translate to the shape position
      withTransform(
        context.ctx,
        shape.position.x,
        shape.position.y,
        shape.rotation,
        finalOptions.scale || 1,
        finalOptions.scale || 1,
        () => this.renderShapeContent(shape, context, theme, finalOptions)
      );

      // Render debug information if enabled
      if (finalOptions.showDebug && shape.body) {
        DebugRenderer.renderBodyDebug(context.ctx, shape.body, theme);
      }
    });
  }

  /**
   * Render multiple shapes with depth sorting
   */
  static renderShapes(
    shapes: RenderableShape[],
    context: RenderContext,
    options: Partial<ShapeRenderOptions> = {}
  ): void {
    // Sort shapes by Y position for depth (back to front)
    const sortedShapes = [...shapes].sort((a, b) => a.position.y - b.position.y);

    sortedShapes.forEach(shape => {
      this.renderShape(shape, context, options);
    });
  }

  /**
   * Render shape content (called within transform context)
   */
  private static renderShapeContent(
    shape: RenderableShape,
    context: RenderContext,
    theme: ColorTheme,
    options: ShapeRenderOptions
  ): void {
    const { ctx } = context;

    // Get colors based on mode and theme
    const colors = this.getShapeColors(shape, theme, options);

    // Get shape path
    const path = this.getShapePath(shape);
    if (!path) return;

    // Render fill and stroke based on mode
    this.renderShapeGeometry(ctx, path, shape, colors, options);

    // Render holes if present
    if (options.showHoles && shape.holes && shape.holes.length > 0) {
      this.renderHoles(ctx, shape, theme);
    }

    // Render screws if present
    if (shape.screws && shape.screws.length > 0) {
      this.renderScrews(ctx, shape, theme, options);
    }

    // Add selection indicators
    if (options.isSelected) {
      this.renderSelectionIndicator(ctx, shape, theme);
    }

    // Add hover effects
    if (options.isHovered) {
      this.renderHoverEffect(ctx, shape, theme);
    }
  }

  /**
   * Get appropriate colors for the shape based on mode and theme
   */
  private static getShapeColors(
    shape: RenderableShape,
    theme: ColorTheme,
    options: ShapeRenderOptions
  ): { fill: string; stroke: string } {
    const shapeTheme = theme.shapes;

    switch (options.mode) {
      case 'preview':
        return {
          fill: options.fillColor || shapeTheme.preview,
          stroke: options.strokeColor || shapeTheme.stroke,
        };

      case 'selection':
        return {
          fill: options.fillColor || shapeTheme.selected,
          stroke: options.strokeColor || shapeTheme.highlight,
        };

      case 'physics':
      default:
        let fillColor = shapeTheme.fill;
        
        // Apply tinting if enabled
        if (options.showTint && (options.tintColor || shape.tint)) {
          const tint = options.tintColor || shape.tint!;
          fillColor = hexToRgba(tint, options.alpha || shapeTheme.alpha);
        }

        return {
          fill: options.fillColor || fillColor,
          stroke: options.strokeColor || shape.color || shapeTheme.stroke,
        };
    }
  }

  /**
   * Get Path2D for the shape (using origin-relative coordinates for transform compatibility)
   */
  private static getShapePath(shape: RenderableShape): Path2D | null {
    // Use custom getPath2D if available
    if (shape.getPath2D) {
      return shape.getPath2D();
    }

    // Generate path based on shape type and properties
    // IMPORTANT: Use origin-relative coordinates (0,0) since transforms will be applied
    const path = new Path2D();
    
    // Debug logging (removed to avoid TypeScript error)

    switch (shape.type) {
      case 'circle':
        if (shape.radius) {
          // Circle centered at origin (0,0) - transform will position it correctly
          path.arc(0, 0, shape.radius, 0, Math.PI * 2);
        }
        break;

      case 'rectangle':
      case 'square':
        if (shape.width && shape.height) {
          // Rectangle centered at origin (0,0) - transform will position it correctly
          const x = -shape.width / 2;
          const y = -shape.height / 2;
          path.rect(x, y, shape.width, shape.height);
        }
        break;

      case 'polygon':
      case 'triangle':
      case 'pentagon':
      case 'hexagon':
      case 'heptagon':
      case 'octagon':
        if (shape.vertices && shape.vertices.length > 0) {
          // Convert vertices to origin-relative coordinates
          // Vertices are in world coordinates, so subtract shape position to make them relative
          const relativeVertices = shape.vertices.map(v => ({
            x: v.x - shape.position.x,
            y: v.y - shape.position.y
          }));
          
          path.moveTo(relativeVertices[0].x, relativeVertices[0].y);
          for (let i = 1; i < relativeVertices.length; i++) {
            path.lineTo(relativeVertices[i].x, relativeVertices[i].y);
          }
          path.closePath();
        }
        break;

      case 'capsule':
        if (shape.width && shape.height) {
          // Capsule centered at origin (0,0) - transform will position it correctly
          this.addCapsuleToPath(path, 0, 0, shape.width, shape.height);
        }
        break;

      default:
        // For custom shapes with vertices
        if (shape.vertices && shape.vertices.length > 0) {
          // Convert vertices to origin-relative coordinates
          // Vertices are in world coordinates, so subtract shape position to make them relative
          const relativeVertices = shape.vertices.map(v => ({
            x: v.x - shape.position.x,
            y: v.y - shape.position.y
          }));
          
          path.moveTo(relativeVertices[0].x, relativeVertices[0].y);
          for (let i = 1; i < relativeVertices.length; i++) {
            path.lineTo(relativeVertices[i].x, relativeVertices[i].y);
          }
          path.closePath();
        }
        break;
    }

    return path;
  }

  /**
   * Add capsule geometry to path
   */
  private static addCapsuleToPath(
    path: Path2D,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    const radius = Math.min(width, height) / 2;
    
    if (width > height) {
      // Horizontal capsule
      const leftX = x - width / 2 + radius;
      const rightX = x + width / 2 - radius;
      const centerY = y;
      
      path.arc(leftX, centerY, radius, Math.PI / 2, -Math.PI / 2, false);
      path.lineTo(rightX, y - radius);
      path.arc(rightX, centerY, radius, -Math.PI / 2, Math.PI / 2, false);
      path.lineTo(leftX, y + radius);
    } else {
      // Vertical capsule
      const centerX = x;
      const topY = y - height / 2 + radius;
      const bottomY = y + height / 2 - radius;
      
      path.arc(centerX, topY, radius, Math.PI, 0, false);
      path.lineTo(x + radius, bottomY);
      path.arc(centerX, bottomY, radius, 0, Math.PI, false);
      path.lineTo(x - radius, topY);
    }
  }

  /**
   * Render shape geometry with proper clipping for holes
   */
  private static renderShapeGeometry(
    ctx: CanvasRenderingContext2D,
    path: Path2D,
    shape: RenderableShape,
    colors: { fill: string; stroke: string },
    options: ShapeRenderOptions
  ): void {
    // Draw stroke first (before clipping)
    if (colors.stroke) {
      ctx.strokeStyle = colors.stroke;
      ctx.lineWidth = options.lineWidth || UI_CONSTANTS.shapes.borderWidth;
      ctx.stroke(path);
    }

    // Apply hole clipping if needed
    if (options.showHoles && shape.holes && shape.holes.length > 0) {
      withClip(ctx, () => {
        // Create compound path with holes
        const compoundPath = new Path2D();
        compoundPath.addPath(path);

        // Add hole paths
        shape.holes!.forEach(hole => {
          const localX = shape.position.x + hole.x;
          const localY = shape.position.y + hole.y;
          const holePath = new Path2D();
          holePath.arc(localX, localY, UI_CONSTANTS.screws.radius * 0.8, 0, Math.PI * 2);
          compoundPath.addPath(holePath);
        });

        return compoundPath;
      }, () => {
        // Fill with clipping applied
        if (colors.fill && colors.fill !== 'transparent') {
          ctx.fillStyle = colors.fill;
          ctx.fill(path);
        }
      });
    } else {
      // Fill without clipping
      if (colors.fill && colors.fill !== 'transparent') {
        ctx.fillStyle = colors.fill;
        ctx.fill(path);
      }
    }

    // Add glow effect for physics mode
    if (options.mode === 'physics' && colors.stroke) {
      withCompositeOperation(ctx, 'lighter', () => {
        ctx.strokeStyle = hexToRgba(colors.stroke, 0.3);
        ctx.lineWidth = 1;
        ctx.stroke(path);
      });
    }
  }

  /**
   * Render holes as borders
   */
  private static renderHoles(
    ctx: CanvasRenderingContext2D,
    shape: RenderableShape,
    theme: ColorTheme
  ): void {
    if (!shape.holes) return;

    const holeColor = theme.debug.bounds;
    const holeRadius = UI_CONSTANTS.screws.radius * 0.8;

    shape.holes.forEach(hole => {
      const worldX = shape.position.x + hole.x;
      const worldY = shape.position.y + hole.y;

      GeometryRenderer.renderCircle(ctx, {
        x: worldX,
        y: worldY,
        radius: holeRadius,
        strokeColor: holeColor,
        lineWidth: 2,
      });
    });
  }

  /**
   * Render screw positions
   */
  private static renderScrews(
    ctx: CanvasRenderingContext2D,
    shape: RenderableShape,
    theme: ColorTheme,
    options: ShapeRenderOptions
  ): void {
    if (!shape.screws) return;

    shape.screws.forEach((screw, index) => {
      // Only show screw anchor points in debug mode
      if (options.showDebug) {
        GeometryRenderer.renderPoint(ctx, {
          x: screw.position.x,
          y: screw.position.y,
          radius: 2,
          fillColor: screw.color,
          style: 'circle',
        });

        // Show screw index
        TextRenderer.renderText(ctx, {
          x: screw.position.x,
          y: screw.position.y - 8,
          text: index.toString(),
          font: '10px Arial',
          fillColor: theme.debug.text,
          textAlign: 'center',
        });
      }
    });
  }

  /**
   * Render selection indicator
   */
  private static renderSelectionIndicator(
    ctx: CanvasRenderingContext2D,
    shape: RenderableShape,
    theme: ColorTheme
  ): void {
    const bounds = shape.getBounds?.() || {
      x: shape.position.x - 10,
      y: shape.position.y - 10,
      width: 20,
      height: 20,
    };

    GeometryRenderer.renderRectangle(ctx, {
      x: bounds.x - 5,
      y: bounds.y - 5,
      width: bounds.width + 10,
      height: bounds.height + 10,
      strokeColor: theme.shapes.selected,
      lineWidth: 2,
    });

    // Selection handles
    const handleSize = 6;
    const handles = [
      { x: bounds.x, y: bounds.y },
      { x: bounds.x + bounds.width, y: bounds.y },
      { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
      { x: bounds.x, y: bounds.y + bounds.height },
    ];

    handles.forEach(handle => {
      GeometryRenderer.renderRectangle(ctx, {
        x: handle.x - handleSize / 2,
        y: handle.y - handleSize / 2,
        width: handleSize,
        height: handleSize,
        fillColor: theme.shapes.selected,
        strokeColor: theme.ui.background,
        lineWidth: 1,
      });
    });
  }

  /**
   * Render hover effect
   */
  private static renderHoverEffect(
    ctx: CanvasRenderingContext2D,
    shape: RenderableShape,
    theme: ColorTheme
  ): void {
    const path = this.getShapePath(shape);
    if (!path) return;

    withContext(ctx, () => {
      ctx.strokeStyle = theme.shapes.highlight;
      ctx.lineWidth = 3;
      ctx.stroke(path);
    });
  }

  /**
   * Render shape preview for editor tools
   */
  static renderPreview(
    ctx: CanvasRenderingContext2D,
    shapeType: string,
    position: { x: number; y: number },
    dimensions: { width?: number; height?: number; radius?: number; points?: { x: number; y: number }[] },
    theme: ColorTheme,
    options: Partial<ShapeRenderOptions> = {}
  ): void {
    const finalOptions: ShapeRenderOptions = {
      mode: 'preview',
      alpha: 0.5,
      lineWidth: 2,
      ...options,
    };
    // Silence unused variable warning - options is used via spread operator
    void finalOptions;

    const colors = {
      fill: theme.shapes.preview,
      stroke: theme.shapes.stroke,
    };

    switch (shapeType) {
      case 'circle':
        if (dimensions.radius) {
          GeometryRenderer.renderCircle(ctx, {
            x: position.x,
            y: position.y,
            radius: dimensions.radius,
            fillColor: hexToRgba(colors.fill, finalOptions.alpha!),
            strokeColor: colors.stroke,
            lineWidth: finalOptions.lineWidth,
          });
        }
        break;

      case 'rectangle':
        if (dimensions.width && dimensions.height) {
          GeometryRenderer.renderRectangle(ctx, {
            x: position.x - dimensions.width / 2,
            y: position.y - dimensions.height / 2,
            width: dimensions.width,
            height: dimensions.height,
            fillColor: hexToRgba(colors.fill, finalOptions.alpha!),
            strokeColor: colors.stroke,
            lineWidth: finalOptions.lineWidth,
          });
        }
        break;

      case 'polygon':
        if (dimensions.points && dimensions.points.length > 0) {
          GeometryRenderer.renderPolygon(ctx, {
            points: dimensions.points.map(p => ({ x: position.x + p.x, y: position.y + p.y })),
            fillColor: hexToRgba(colors.fill, finalOptions.alpha!),
            strokeColor: colors.stroke,
            lineWidth: finalOptions.lineWidth,
            closed: true,
          });
        }
        break;

      case 'capsule':
        if (dimensions.width && dimensions.height) {
          GeometryRenderer.renderCapsule(ctx, {
            x: position.x - dimensions.width / 2,
            y: position.y - dimensions.height / 2,
            width: dimensions.width,
            height: dimensions.height,
            fillColor: hexToRgba(colors.fill, finalOptions.alpha!),
            strokeColor: colors.stroke,
            lineWidth: finalOptions.lineWidth,
          });
        }
        break;
    }
  }
}