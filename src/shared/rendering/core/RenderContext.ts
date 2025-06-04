/**
 * Enhanced render context for shared rendering utilities
 * Provides standardized rendering environment across game and editor
 */

export interface ViewportInfo {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

export interface RenderContext {
  /** Canvas rendering context */
  ctx: CanvasRenderingContext2D;
  
  /** Canvas element */
  canvas: HTMLCanvasElement;
  
  /** Current viewport information */
  viewport: ViewportInfo;
  
  /** Current render timestamp */
  timestamp: number;
  
  /** Debug rendering enabled */
  debugMode: boolean;
  
  /** Environment type */
  environment: 'game' | 'editor';
  
  /** Frame delta time (for animations) */
  deltaTime?: number;
}

/**
 * Create a standard render context from canvas
 */
export function createRenderContext(
  canvas: HTMLCanvasElement,
  environment: 'game' | 'editor',
  options: Partial<{
    debugMode: boolean;
    scale: number;
    deltaTime: number;
  }> = {}
): RenderContext {
  const ctx = canvas.getContext('2d')!;
  const { debugMode = false, scale = 1, deltaTime = 0 } = options;
  
  return {
    ctx,
    canvas,
    viewport: {
      x: 0,
      y: 0,
      width: canvas.width,
      height: canvas.height,
      scale,
    },
    timestamp: performance.now(),
    debugMode,
    environment,
    deltaTime,
  };
}

/**
 * Check if a point is within the current viewport
 */
export function isInViewport(
  x: number,
  y: number,
  viewport: ViewportInfo,
  margin: number = 0
): boolean {
  return (
    x >= viewport.x - margin &&
    x <= viewport.x + viewport.width + margin &&
    y >= viewport.y - margin &&
    y <= viewport.y + viewport.height + margin
  );
}

/**
 * Check if a rectangle is within the current viewport
 */
export function isRectInViewport(
  x: number,
  y: number,
  width: number,
  height: number,
  viewport: ViewportInfo,
  margin: number = 0
): boolean {
  return (
    x + width >= viewport.x - margin &&
    x <= viewport.x + viewport.width + margin &&
    y + height >= viewport.y - margin &&
    y <= viewport.y + viewport.height + margin
  );
}

/**
 * Transform screen coordinates to world coordinates
 */
export function screenToWorld(
  screenX: number,
  screenY: number,
  viewport: ViewportInfo
): { x: number; y: number } {
  return {
    x: (screenX / viewport.scale) + viewport.x,
    y: (screenY / viewport.scale) + viewport.y,
  };
}

/**
 * Transform world coordinates to screen coordinates
 */
export function worldToScreen(
  worldX: number,
  worldY: number,
  viewport: ViewportInfo
): { x: number; y: number } {
  return {
    x: (worldX - viewport.x) * viewport.scale,
    y: (worldY - viewport.y) * viewport.scale,
  };
}