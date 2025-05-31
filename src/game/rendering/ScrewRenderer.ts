import { RenderContext, Screw } from '@/types/game';
import { SCREW_COLORS, UI_CONSTANTS } from '@/game/utils/Constants';
import { hexToRgba } from '@/game/utils/Colors';

export class ScrewRenderer {
  public static renderScrew(screw: Screw, context: RenderContext, forceRender: boolean = false): void {
    const { ctx } = context;
    
    // Skip rendering collected screws unless forced (e.g., when rendering in containers/holes)
    // Always render screws that are being collected or transferred
    if (!forceRender && screw.isCollected && !screw.isBeingCollected && !screw.isBeingTransferred) {
      return; // Don't render collected screws
    }

    ctx.save();

    const { position, color } = screw;
    const radius = UI_CONSTANTS.screws.radius;
    const borderWidth = UI_CONSTANTS.screws.borderWidth;
    
    // Apply transparency for animations
    let alpha = 1;
    if (screw.isBeingCollected) {
      alpha = 1 - screw.collectionProgress * 0.3; // Slight fade during collection
    } else if (screw.isBeingTransferred) {
      alpha = 1 - screw.transferProgress * 0.2; // Slight fade during transfer (less than collection)
    }
    
    // Apply alpha if not fully opaque
    if (alpha < 1) {
      ctx.globalAlpha = alpha;
    }

    // Draw screw body
    const screwColor = SCREW_COLORS[color];
    ctx.fillStyle = screwColor;
    ctx.strokeStyle = '#2C3E50'; // Dark border
    ctx.lineWidth = borderWidth;

    ctx.beginPath();
    ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Add inner highlight
    ctx.fillStyle = hexToRgba('#FFFFFF', 0.3);
    ctx.beginPath();
    ctx.arc(position.x - 2, position.y - 2, radius * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Draw cross/plus symbol
    this.drawCrossSymbol(ctx, position.x, position.y, radius * 0.6);

    // Draw removal indication (only in debug mode)
    if (context.debugMode) {
      if (screw.isRemovable && !screw.isBeingCollected) {
        this.drawRemovableIndicator(ctx, position.x, position.y, radius);
      } else if (!screw.isRemovable && !screw.isCollected) {
        this.drawBlockedIndicator(ctx, position.x, position.y, radius);
      }
    }

    // Debug info
    if (context.debugMode) {
      this.renderDebugInfo(screw, context);
    }

    ctx.restore();
  }

  private static drawCrossSymbol(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    size: number
  ): void {
    ctx.strokeStyle = '#2C3E50';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    const halfSize = size / 2;

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(centerX - halfSize, centerY);
    ctx.lineTo(centerX + halfSize, centerY);
    ctx.stroke();

    // Vertical line
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - halfSize);
    ctx.lineTo(centerX, centerY + halfSize);
    ctx.stroke();
  }

  private static drawRemovableIndicator(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number
  ): void {
    // Subtle green glow for removable screws
    ctx.shadowColor = '#27AE60';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    ctx.strokeStyle = hexToRgba('#27AE60', 0.6);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 3, 0, Math.PI * 2);
    ctx.stroke();

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }

  private static drawBlockedIndicator(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number
  ): void {
    // Red tint for blocked screws
    ctx.fillStyle = hexToRgba('#E74C3C', 0.2);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 2, 0, Math.PI * 2);
    ctx.fill();

    // Blocked pattern (diagonal lines)
    ctx.strokeStyle = hexToRgba('#E74C3C', 0.6);
    ctx.lineWidth = 1;
    
    const size = radius * 0.8;
    ctx.beginPath();
    ctx.moveTo(centerX - size, centerY - size);
    ctx.lineTo(centerX + size, centerY + size);
    ctx.moveTo(centerX + size, centerY - size);
    ctx.lineTo(centerX - size, centerY + size);
    ctx.stroke();
  }

  public static renderScrews(screws: Screw[], context: RenderContext): void {
    // Sort screws by collection state and Y position for proper layering
    const sortedScrews = [...screws].sort((a, b) => {
      // Collected screws go to back
      if (a.isCollected && !b.isCollected) return -1;
      if (!a.isCollected && b.isCollected) return 1;
      
      // Being collected screws go to front
      if (a.isBeingCollected && !b.isBeingCollected) return 1;
      if (!a.isBeingCollected && b.isBeingCollected) return -1;
      
      // Sort by Y position
      return a.position.y - b.position.y;
    });

    sortedScrews.forEach(screw => {
      this.renderScrew(screw, context);
    });
  }

  private static renderDebugInfo(screw: Screw, context: RenderContext): void {
    const { ctx } = context;
    
    ctx.save();
    
    // Draw screw ID
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(screw.id, screw.position.x, screw.position.y - 20);
    
    // Draw color name
    ctx.fillText(screw.color, screw.position.x, screw.position.y + 25);
    
    // Draw state
    let state = 'active';
    if (screw.isCollected) state = 'collected';
    else if (screw.isBeingCollected) state = 'collecting';
    else if (!screw.isRemovable) state = 'blocked';
    
    ctx.fillText(state, screw.position.x, screw.position.y + 35);
    
    // Draw constraint line to shape if exists
    if (screw.constraint && screw.constraint.bodyA) {
      const shape = screw.constraint.bodyA;
      ctx.strokeStyle = '#FFFF00';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(screw.position.x, screw.position.y);
      ctx.lineTo(shape.position.x, shape.position.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // Draw collection target if animating
    if (screw.isBeingCollected && screw.targetPosition) {
      ctx.strokeStyle = '#00FFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(screw.targetPosition.x, screw.targetPosition.y, 5, 0, Math.PI * 2);
      ctx.stroke();
      
      // Draw animation path
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(screw.position.x, screw.position.y);
      ctx.lineTo(screw.targetPosition.x, screw.targetPosition.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    ctx.restore();
  }

  public static renderScrewPreview(
    position: { x: number; y: number },
    color: string,
    radius: number,
    context: RenderContext
  ): void {
    const { ctx } = context;
    
    ctx.save();
    
    // Draw screw body
    ctx.fillStyle = color;
    ctx.strokeStyle = '#2C3E50'; // Dark border
    ctx.lineWidth = UI_CONSTANTS.screws.borderWidth;
    
    ctx.beginPath();
    ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Add inner highlight (same as main screw rendering)
    ctx.fillStyle = hexToRgba('#FFFFFF', 0.3);
    ctx.beginPath();
    ctx.arc(position.x - 2, position.y - 2, radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw cross symbol
    this.drawCrossSymbol(ctx, position.x, position.y, radius * 0.6);
    
    ctx.restore();
  }
}