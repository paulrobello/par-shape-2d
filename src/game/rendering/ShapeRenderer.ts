import { Shape } from '@/game/entities/Shape';
import { RenderContext } from '@/types/game';
import { UI_CONSTANTS } from '@/game/utils/Constants';
import { hexToRgba } from '@/game/utils/Colors';

export class ShapeRenderer {
  public static renderShape(shape: Shape, context: RenderContext): void {
    const { ctx } = context;
    
    // Save context state
    ctx.save();
    
    // Apply rotation if needed
    if (shape.rotation !== 0) {
      ctx.translate(shape.position.x, shape.position.y);
      ctx.rotate(shape.rotation);
      ctx.translate(-shape.position.x, -shape.position.y);
    }
    
    // Get the shape path
    const path = shape.getPath2D();
    
    // Draw border FIRST (before any clipping is applied)
    ctx.strokeStyle = shape.color;
    ctx.lineWidth = UI_CONSTANTS.shapes.borderWidth;
    ctx.stroke(path);
    
    // Create clipping mask if shape has holes (only affects the fill, not the border)
    if (shape.holes.length > 0) {
      // Start with the shape path
      const shapePath = shape.getPath2D();
      
      // Create compound path with holes cut out using evenodd fill rule
      const compoundPath = new Path2D();
      compoundPath.addPath(shapePath);
      
      // Add hole paths in local coordinate space (rotation is already applied to context)
      shape.holes.forEach(relativeHolePosition => {
        // Since rotation is already applied to the context, use relative position directly
        const localX = shape.position.x + relativeHolePosition.x;
        const localY = shape.position.y + relativeHolePosition.y;
        
        const holePath = new Path2D();
        holePath.arc(localX, localY, UI_CONSTANTS.screws.radius * 0.8, 0, Math.PI * 2);
        compoundPath.addPath(holePath);
      });
      
      // Clip to shape minus holes
      ctx.clip(compoundPath, 'evenodd');
    }
    
    // Fill with tinted color and transparency (this respects the clipping)
    const fillColor = hexToRgba(shape.tint, UI_CONSTANTS.shapes.alpha);
    ctx.fillStyle = fillColor;
    ctx.fill(path);
    
    // Add inner glow effect
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = hexToRgba(shape.color, 0.3);
    ctx.lineWidth = 1;
    ctx.stroke(path);
    
    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';
    
    // Restore context state (this restores clipping)
    ctx.restore();
    
    // Render hole borders after shape is drawn
    this.renderHoleBorders(shape, context);
    
    // Render debug info if enabled
    if (context.debugMode) {
      this.renderDebugInfo(shape, context);
    }
  }
  
  public static renderShapes(shapes: Shape[], context: RenderContext): void {
    // Sort shapes within the layer by Y position (back to front) for depth within layer
    const sortedShapes = [...shapes].sort((a, b) => a.position.y - b.position.y);
    
    sortedShapes.forEach(shape => {
      this.renderShape(shape, context);
    });
  }
  
  private static renderHoleBorders(shape: Shape, context: RenderContext): void {
    const { ctx } = context;
    
    if (shape.holes.length === 0) return;
    
    ctx.save();
    
    // Apply the same rotation as the shape for hole borders
    if (shape.rotation !== 0) {
      ctx.translate(shape.position.x, shape.position.y);
      ctx.rotate(shape.rotation);
      ctx.translate(-shape.position.x, -shape.position.y);
    }
    
    // Draw borders around holes
    ctx.strokeStyle = '#4A4A4A'; // Dark grey
    ctx.lineWidth = 2;
    
    shape.holes.forEach(relativeHolePosition => {
      // Use relative position directly since rotation is applied to context
      const worldX = shape.position.x + relativeHolePosition.x;
      const worldY = shape.position.y + relativeHolePosition.y;
      
      ctx.beginPath();
      ctx.arc(worldX, worldY, UI_CONSTANTS.screws.radius * 0.8, 0, Math.PI * 2);
      ctx.stroke();
    });
    
    ctx.restore();
  }
  

  private static renderDebugInfo(shape: Shape, context: RenderContext): void {
    const { ctx } = context;
    
    ctx.save();
    
    // Draw bounding box
    const bounds = shape.getBounds();
    ctx.strokeStyle = '#FF00FF';
    ctx.lineWidth = 1;
    ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
    
    // Draw center point
    ctx.fillStyle = '#FF00FF';
    ctx.beginPath();
    ctx.arc(shape.position.x, shape.position.y, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw shape ID and type
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${shape.id} (${shape.type})`, shape.position.x, shape.position.y - 20);
    
    // Enhanced physics body debug rendering for path-based shapes
    if (shape.type === 'arrow' || shape.type === 'chevron' || shape.type === 'star' || shape.type === 'horseshoe') {
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
    } else if (shape.body && shape.body.vertices) {
      // Regular physics body outline for non-path shapes
      ctx.strokeStyle = '#00FFFF';
      ctx.lineWidth = 1;
      ctx.beginPath();
      
      const vertices = shape.body.vertices;
      if (vertices.length > 0) {
        ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let i = 1; i < vertices.length; i++) {
          ctx.lineTo(vertices[i].x, vertices[i].y);
        }
        ctx.closePath();
        ctx.stroke();
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
    
    // Draw screw positions
    shape.screws.forEach((screw, index) => {
      ctx.fillStyle = '#FFFF00';
      ctx.beginPath();
      ctx.arc(screw.position.x, screw.position.y, 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw screw index
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(index.toString(), screw.position.x, screw.position.y - 8);
    });
    
    // Draw physics body info
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