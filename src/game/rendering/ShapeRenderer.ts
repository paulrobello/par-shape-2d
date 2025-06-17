import { Shape } from '@/game/entities/Shape';
import { RenderContext } from '@/types/game';
import { ShapeRegistry } from '@/game/systems/ShapeRegistry';
import { DEBUG_CONFIG } from '@/shared/utils/Constants';
import { 
  ShapeRenderer as SharedShapeRenderer, 
  RenderableShape, 
  ShapeRenderOptions 
} from '@/shared/rendering/components/ShapeRenderer';
import { RenderContext as SharedRenderContext } from '@/shared/rendering/core/RenderContext';

/**
 * Game-specific shape renderer that extends shared functionality
 * Adds game-specific debug rendering for physics bodies and shape systems
 */
export class ShapeRenderer {
  /**
   * Convert game Shape to RenderableShape interface
   */
  private static shapeToRenderable(shape: Shape): RenderableShape {
    return {
      id: shape.id,
      type: shape.type,
      position: shape.position,
      rotation: shape.rotation,
      color: shape.color,
      tint: shape.tint,
      vertices: shape.vertices,
      body: shape.body,
      holes: shape.holes,
      screws: shape.screws.map(screw => ({
        position: screw.position,
        color: screw.color
      })),
      getPath2D: () => shape.getPath2D(),
      getBounds: () => shape.getBounds()
    };
  }

  /**
   * Convert game RenderContext to shared RenderContext
   */
  private static toSharedContext(context: RenderContext): SharedRenderContext {
    return {
      ctx: context.ctx,
      canvas: context.canvas,
      viewport: {
        x: 0,
        y: 0,
        width: context.canvas.width,
        height: context.canvas.height,
        scale: 1
      },
      timestamp: performance.now(),
      debugMode: context.debugMode,
      environment: 'game',
      deltaTime: 0
    };
  }

  /**
   * Render a single shape using shared renderer with game-specific options
   */
  public static renderShape(shape: Shape, context: RenderContext): void {
    const renderable = this.shapeToRenderable(shape);
    const sharedContext = this.toSharedContext(context);
    
    // Debug logging to trace shape rendering
    if (DEBUG_CONFIG.logShapeDebug) {
      console.log(`🎨 Game rendering shape: ${shape.type} (id: ${shape.id})`);
    }
    
    const options: Partial<ShapeRenderOptions> = {
      mode: 'physics',
      showHoles: true,
      showTint: true,
      showDebug: context.debugMode
    };

    // Use shared renderer for main rendering
    SharedShapeRenderer.renderShape(renderable, sharedContext, options);

    // Add game-specific debug info if enabled
    if (context.debugMode) {
      this.renderGameDebugInfo(shape, context);
    }
  }

  /**
   * Render multiple shapes with depth sorting
   */
  public static renderShapes(shapes: Shape[], context: RenderContext): void {
    // Sort shapes within the layer by Y position (back to front) for depth within layer
    const sortedShapes = [...shapes].sort((a, b) => a.position.y - b.position.y);
    
    sortedShapes.forEach(shape => {
      this.renderShape(shape, context);
    });
  }

  /**
   * Render game-specific debug information
   * This extends the basic debug rendering with game engine specifics
   */
  private static renderGameDebugInfo(shape: Shape, context: RenderContext): void {
    const { ctx } = context;
    
    ctx.save();
    
    // Enhanced physics body debug rendering for path-based shapes
    const shapeRegistry = ShapeRegistry.getInstance();
    const definition = shapeRegistry.getDefinition(shape.definitionId);
    const isPathBasedShape = definition?.category === 'path' || 
                           definition?.physics.type === 'fromVertices' ||
                           definition?.rendering.type === 'path';
    
    if (isPathBasedShape) {
      // For path-based shapes using fromVertices, the body might have multiple parts
      if (shape.body.parts && shape.body.parts.length > 1) {
        // Draw each decomposed part with different colors
        shape.body.parts.forEach((part, partIndex) => {
          if (part.vertices && part.id !== shape.body.id) { // Skip the parent body
            // Use different colors for each part
            const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
            ctx.strokeStyle = colors[partIndex % colors.length];
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 3]); // Dashed line for decomposed parts
            
            ctx.beginPath();
            const vertices = part.vertices;
            if (vertices.length > 0) {
              ctx.moveTo(vertices[0].x, vertices[0].y);
              for (let i = 1; i < vertices.length; i++) {
                ctx.lineTo(vertices[i].x, vertices[i].y);
              }
              ctx.closePath();
              ctx.stroke();
              
              // Label each part
              const centerX = vertices.reduce((sum, v) => sum + v.x, 0) / vertices.length;
              const centerY = vertices.reduce((sum, v) => sum + v.y, 0) / vertices.length;
              ctx.fillStyle = ctx.strokeStyle;
              ctx.font = '10px Arial';
              ctx.fillText(`P${partIndex}`, centerX, centerY);
            }
          }
        });
        ctx.setLineDash([]); // Reset line dash
      }
    }
    
    // Draw composite parts if present (for capsules)
    if (shape.isComposite && shape.parts) {
      shape.parts.forEach((part, partIndex) => {
        if (part.vertices) {
          ctx.strokeStyle = partIndex === 0 ? '#FF0000' : '#00FF00'; // Different colors for parts
          ctx.lineWidth = 1;
          ctx.beginPath();
          
          const vertices = part.vertices;
          if (vertices.length > 0) {
            ctx.moveTo(vertices[0].x, vertices[0].y);
            for (let i = 1; i < vertices.length; i++) {
              ctx.lineTo(vertices[i].x, vertices[i].y);
            }
            ctx.closePath();
            ctx.stroke();
          }
        }
      });
    }
    
    // Draw rendering vertices vs physics vertices comparison for path shapes
    if ((shape.type === 'arrow' || shape.type === 'chevron' || shape.type === 'star' || shape.type === 'horseshoe') && shape.vertices) {
      // Draw the original rendering vertices in white dots
      ctx.save();
      ctx.translate(shape.position.x, shape.position.y);
      ctx.rotate(shape.rotation);
      
      shape.vertices.forEach((v, i) => {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(v.x, v.y, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Label vertex
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '8px Arial';
        ctx.fillText(`V${i}`, v.x + 5, v.y - 5);
      });
      
      ctx.restore();
    }
    
    // Draw additional physics body info
    if (shape.body) {
      ctx.fillStyle = '#00FFFF';
      ctx.font = '10px Arial';
      ctx.textAlign = 'left';
      const infoY = shape.position.y + 40;
      ctx.fillText(`Static: ${shape.body.isStatic}`, shape.position.x - 40, infoY);
      ctx.fillText(`Parts: ${shape.body.parts ? shape.body.parts.length : 0}`, shape.position.x - 40, infoY + 12);
    }
    
    ctx.restore();
  }
}