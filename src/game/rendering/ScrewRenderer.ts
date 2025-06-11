import { RenderContext, Screw } from '@/types/game';
import { SCREW_COLORS, UI_CONSTANTS, DEBUG_CONFIG } from '@/shared/utils/Constants';
import { hexToRgba } from '@/shared/rendering/styles/ColorTheme';

export class ScrewRenderer {
  public static renderScrew(screw: Screw, context: RenderContext, forceRender: boolean = false, scale: number = 1): void {
    const { ctx } = context;
    
    // Skip rendering collected screws unless forced (e.g., when rendering in containers/holes)
    // Always render screws that are being collected or transferred
    if (!forceRender && screw.isCollected && !screw.isBeingCollected && !screw.isBeingTransferred) {
      return; // Don't render collected screws
    }

    ctx.save();

    const { position, color } = screw;
    const radius = UI_CONSTANTS.screws.radius * scale;
    const borderWidth = UI_CONSTANTS.screws.borderWidth * scale;
    
    // Apply shake offset to position
    const renderPosition = {
      x: position.x + screw.shakeOffset.x,
      y: position.y + screw.shakeOffset.y
    };
    
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
    ctx.arc(renderPosition.x, renderPosition.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Add inner highlight
    ctx.fillStyle = hexToRgba('#FFFFFF', 0.3);
    ctx.beginPath();
    const highlightX = renderPosition.x - UI_CONSTANTS.screws.highlight.offsetX * scale;
    const highlightY = renderPosition.y - UI_CONSTANTS.screws.highlight.offsetY * scale;
    const highlightRadius = radius * UI_CONSTANTS.screws.highlight.sizeRatio;
    ctx.arc(highlightX, highlightY, highlightRadius, 0, Math.PI * 2);
    ctx.fill();

    // Draw cross/plus symbol
    const crossSize = radius * UI_CONSTANTS.screws.cross.sizeRatio;
    this.drawCrossSymbol(ctx, renderPosition.x, renderPosition.y, crossSize, scale);

    // Draw removal indication (only in debug mode)
    if (context.debugMode) {
      if (screw.isRemovable && !screw.isBeingCollected) {
        this.drawRemovableIndicator(ctx, renderPosition.x, renderPosition.y, radius, scale);
      } else if (!screw.isRemovable && !screw.isCollected) {
        this.drawBlockedIndicator(ctx, renderPosition.x, renderPosition.y, radius, scale);
      }
    }

    // Debug info - only render if both debug mode is enabled AND physics debug is enabled
    if (context.debugMode && DEBUG_CONFIG.logPhysicsDebug) {
      this.renderDebugInfo(screw, context);
    }

    ctx.restore();
  }

  private static drawCrossSymbol(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    size: number,
    scale: number = 1
  ): void {
    ctx.strokeStyle = '#2C3E50';
    ctx.lineWidth = UI_CONSTANTS.screws.cross.lineWidth * scale;
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
    radius: number,
    scale: number = 1
  ): void {
    // Subtle green glow for removable screws
    ctx.shadowColor = '#27AE60';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    ctx.strokeStyle = hexToRgba('#27AE60', 0.6);
    ctx.lineWidth = 1 * scale;
    ctx.beginPath();
    const removableRadius = radius + UI_CONSTANTS.screws.indicators.removableRadiusOffset * scale;
    ctx.arc(centerX, centerY, removableRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }

  private static drawBlockedIndicator(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    scale: number = 1
  ): void {
    // Red tint for blocked screws
    ctx.fillStyle = hexToRgba('#E74C3C', 0.2);
    ctx.beginPath();
    const blockedRadius = radius + UI_CONSTANTS.screws.indicators.blockedRadiusOffset * scale;
    ctx.arc(centerX, centerY, blockedRadius, 0, Math.PI * 2);
    ctx.fill();

    // Blocked pattern (diagonal lines)
    ctx.strokeStyle = hexToRgba('#E74C3C', 0.6);
    ctx.lineWidth = 1 * scale;
    
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
    context: RenderContext,
    scale: number = 1
  ): void {
    const { ctx } = context;
    
    ctx.save();
    
    // Draw screw body
    const scaledRadius = radius * scale;
    ctx.fillStyle = color;
    ctx.strokeStyle = '#2C3E50'; // Dark border
    ctx.lineWidth = UI_CONSTANTS.screws.borderWidth * scale;
    
    ctx.beginPath();
    ctx.arc(position.x, position.y, scaledRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Add inner highlight (same as main screw rendering)
    ctx.fillStyle = hexToRgba('#FFFFFF', 0.3);
    ctx.beginPath();
    const previewHighlightX = position.x - UI_CONSTANTS.screws.highlight.offsetX * scale;
    const previewHighlightY = position.y - UI_CONSTANTS.screws.highlight.offsetY * scale;
    const previewHighlightRadius = scaledRadius * UI_CONSTANTS.screws.highlight.sizeRatio;
    ctx.arc(previewHighlightX, previewHighlightY, previewHighlightRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw cross symbol
    const previewCrossSize = scaledRadius * UI_CONSTANTS.screws.cross.sizeRatio;
    this.drawCrossSymbol(ctx, position.x, position.y, previewCrossSize, scale);
    
    ctx.restore();
  }

  /**
   * Render a collected screw at a specific location with proper scaling
   * This method is specifically for rendering screws in containers and holding holes
   */
  public static renderCollectedScrew(
    screw: Screw,
    position: { x: number; y: number },
    context: RenderContext,
    scale: number = 0.6
  ): void {
    // Create a temporary screw object with the destination position
    const collectedScrew = {
      ...screw,
      position,
      shakeOffset: { x: 0, y: 0 }, // No shake for collected screws
      isCollected: true,
      // Ensure these animation properties are reset
      isBeingCollected: false,
      isBeingTransferred: false,
      collectionProgress: 0,
      transferProgress: 0
    };
    
    // Force render the screw at the destination with the specified scale
    // Pass scale parameter properly to ensure cross symbol and highlight are visible
    this.renderScrew(collectedScrew, context, true, scale);
  }
}