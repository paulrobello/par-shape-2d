/**
 * Canvas context management utilities
 * Provides safe and convenient context manipulation patterns
 */

/**
 * Execute a function with automatic context save/restore
 */
export function withContext<T>(
  ctx: CanvasRenderingContext2D,
  fn: () => T
): T {
  ctx.save();
  try {
    return fn();
  } finally {
    ctx.restore();
  }
}

/**
 * Execute a function with automatic context save/restore and transform
 */
export function withTransform<T>(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rotation: number = 0,
  scaleX: number = 1,
  scaleY: number = 1,
  fn: () => T
): T {
  return withContext(ctx, () => {
    ctx.translate(x, y);
    if (rotation !== 0) {
      ctx.rotate(rotation);
    }
    if (scaleX !== 1 || scaleY !== 1) {
      ctx.scale(scaleX, scaleY);
    }
    return fn();
  });
}

/**
 * Execute a function with automatic clip path application
 */
export function withClip<T>(
  ctx: CanvasRenderingContext2D,
  clipPath: Path2D | (() => void),
  fn: () => T
): T {
  return withContext(ctx, () => {
    if (clipPath instanceof Path2D) {
      ctx.clip(clipPath);
    } else {
      ctx.beginPath();
      clipPath();
      ctx.clip();
    }
    return fn();
  });
}

/**
 * Execute a function with temporary global composite operation
 */
export function withCompositeOperation<T>(
  ctx: CanvasRenderingContext2D,
  operation: GlobalCompositeOperation,
  fn: () => T
): T {
  return withContext(ctx, () => {
    ctx.globalCompositeOperation = operation;
    return fn();
  });
}

/**
 * Execute a function with temporary global alpha
 */
export function withAlpha<T>(
  ctx: CanvasRenderingContext2D,
  alpha: number,
  fn: () => T
): T {
  return withContext(ctx, () => {
    ctx.globalAlpha = alpha;
    return fn();
  });
}

/**
 * Clear a rectangular area of the canvas
 */
export function clearRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  ctx.clearRect(x, y, width, height);
}

/**
 * Clear the entire canvas
 */
export function clearCanvas(ctx: CanvasRenderingContext2D): void {
  const canvas = ctx.canvas;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * Set up high-DPI canvas rendering
 */
export function setupHighDPI(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext('2d')!;
  const devicePixelRatio = window.devicePixelRatio || 1;
  
  // Get the display size (canvas size in CSS)
  const displayWidth = canvas.clientWidth;
  const displayHeight = canvas.clientHeight;
  
  // Set the actual size in memory (scaled to account for DPI)
  canvas.width = displayWidth * devicePixelRatio;
  canvas.height = displayHeight * devicePixelRatio;
  
  // Scale the canvas style to display at the correct size
  canvas.style.width = displayWidth + 'px';
  canvas.style.height = displayHeight + 'px';
  
  // Scale the drawing context so everything draws at the correct size
  ctx.scale(devicePixelRatio, devicePixelRatio);
  
  return devicePixelRatio;
}

/**
 * Get canvas bounds in screen coordinates
 */
export function getCanvasBounds(canvas: HTMLCanvasElement): DOMRect {
  return canvas.getBoundingClientRect();
}

/**
 * Convert mouse event coordinates to canvas coordinates
 */
export function getCanvasPosition(
  event: MouseEvent,
  canvas: HTMLCanvasElement
): { x: number; y: number } {
  const rect = getCanvasBounds(canvas);
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

/**
 * Set canvas fill and stroke styles from hex colors
 */
export function setFillAndStroke(
  ctx: CanvasRenderingContext2D,
  fillColor?: string,
  strokeColor?: string,
  lineWidth?: number
): void {
  if (fillColor) {
    ctx.fillStyle = fillColor;
  }
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
  }
  if (lineWidth !== undefined) {
    ctx.lineWidth = lineWidth;
  }
}

/**
 * Set canvas text styling
 */
export function setTextStyle(
  ctx: CanvasRenderingContext2D,
  font: string,
  fillColor?: string,
  strokeColor?: string,
  textAlign: CanvasTextAlign = 'left',
  textBaseline: CanvasTextBaseline = 'alphabetic'
): void {
  ctx.font = font;
  ctx.textAlign = textAlign;
  ctx.textBaseline = textBaseline;
  
  if (fillColor) {
    ctx.fillStyle = fillColor;
  }
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
  }
}

/**
 * Create a rounded rectangle path
 */
export function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Measure text dimensions
 */
export function measureText(
  ctx: CanvasRenderingContext2D,
  text: string,
  font?: string
): { width: number; height: number } {
  return withContext(ctx, () => {
    if (font) {
      ctx.font = font;
    }
    const metrics = ctx.measureText(text);
    return {
      width: metrics.width,
      height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
    };
  });
}