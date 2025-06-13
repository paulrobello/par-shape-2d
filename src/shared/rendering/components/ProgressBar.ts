/**
 * Animated Progress Bar Component
 * Reusable progress bar with rounded ends, gradient fill, drop shadow, and smooth animations
 * 
 * @example
 * // Create a progress bar
 * const progressBar = new ProgressBar({
 *   x: 50,
 *   y: 100,
 *   width: 300,
 *   height: 20,
 *   animationDuration: 500,
 *   easing: 'ease-out'
 * });
 * 
 * // In your render loop:
 * progressBar.setProgress(75); // Animate to 75%
 * progressBar.update(); // Update animation state
 * progressBar.render(ctx); // Render to canvas
 */

export interface ProgressBarOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  backgroundColor?: string;
  borderColor?: string;
  progressColors?: {
    start: string;
    end: string;
  };
  completionColors?: {
    start: string;
    end: string;
  };
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  animationDuration?: number; // Animation duration in milliseconds
  easing?: 'linear' | 'ease-out' | 'ease-in' | 'ease-in-out';
}

export interface ProgressBarState {
  currentProgress: number;
  targetProgress: number;
  animationStartTime: number;
  animationDuration: number;
  isAnimating: boolean;
}

export class ProgressBar {
  private options: Required<ProgressBarOptions>;
  private state: ProgressBarState;

  constructor(options: ProgressBarOptions) {
    // Set default options
    this.options = {
      x: options.x,
      y: options.y,
      width: options.width,
      height: options.height,
      backgroundColor: options.backgroundColor || '#1A1A1A',
      borderColor: options.borderColor || '#4A4A4A',
      progressColors: options.progressColors || {
        start: '#5DADE2', // Light blue
        end: '#3498DB'    // Darker blue
      },
      completionColors: options.completionColors || {
        start: '#2ECC71', // Bright green
        end: '#27AE60'    // Darker green
      },
      shadowColor: options.shadowColor || 'rgba(0, 0, 0, 0.3)',
      shadowBlur: options.shadowBlur || 4,
      shadowOffsetX: options.shadowOffsetX || 0,
      shadowOffsetY: options.shadowOffsetY || 2,
      animationDuration: options.animationDuration || 500,
      easing: options.easing || 'ease-out'
    };

    // Initialize state
    this.state = {
      currentProgress: 0,
      targetProgress: 0,
      animationStartTime: 0,
      animationDuration: this.options.animationDuration,
      isAnimating: false
    };
  }

  /**
   * Update the progress value with animation
   */
  setProgress(progress: number): void {
    const clampedProgress = Math.max(0, Math.min(100, progress));
    
    if (clampedProgress !== this.state.targetProgress) {
      this.state.targetProgress = clampedProgress;
      this.state.animationStartTime = Date.now();
      this.state.animationDuration = this.options.animationDuration;
      this.state.isAnimating = true;
    }
  }

  /**
   * Set progress immediately without animation
   */
  setProgressImmediate(progress: number): void {
    const clampedProgress = Math.max(0, Math.min(100, progress));
    this.state.currentProgress = clampedProgress;
    this.state.targetProgress = clampedProgress;
    this.state.isAnimating = false;
  }

  /**
   * Update animation state (call this in your render loop)
   */
  update(): void {
    if (!this.state.isAnimating) return;

    const currentTime = Date.now();
    const elapsed = currentTime - this.state.animationStartTime;
    const normalizedTime = Math.min(elapsed / this.state.animationDuration, 1);

    // Apply easing function
    const easedTime = this.applyEasing(normalizedTime);

    // Calculate current progress
    const startProgress = this.state.currentProgress;
    const progressDiff = this.state.targetProgress - startProgress;
    this.state.currentProgress = startProgress + (progressDiff * easedTime);

    // Stop animation if complete
    if (normalizedTime >= 1) {
      this.state.currentProgress = this.state.targetProgress;
      this.state.isAnimating = false;
    }
  }

  /**
   * Apply easing function to normalized time
   */
  private applyEasing(t: number): number {
    switch (this.options.easing) {
      case 'linear':
        return t;
      case 'ease-out':
        return 1 - Math.pow(1 - t, 3);
      case 'ease-in':
        return Math.pow(t, 3);
      case 'ease-in-out':
        return t < 0.5 ? 4 * Math.pow(t, 3) : 1 - Math.pow(-2 * t + 2, 3) / 2;
      default:
        return t;
    }
  }

  /**
   * Render the progress bar
   */
  render(ctx: CanvasRenderingContext2D): void {
    const { x, y, width, height } = this.options;
    const borderRadius = height / 2; // Fully rounded ends

    // Save context state
    ctx.save();

    // Render drop shadow
    ctx.shadowColor = this.options.shadowColor;
    ctx.shadowBlur = this.options.shadowBlur;
    ctx.shadowOffsetX = this.options.shadowOffsetX;
    ctx.shadowOffsetY = this.options.shadowOffsetY;

    // Render progress bar background with rounded corners
    ctx.fillStyle = this.options.backgroundColor;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, borderRadius);
    ctx.fill();

    // Clear shadow for the rest of the rendering
    ctx.shadowColor = 'transparent';

    // Render progress bar border with rounded corners
    ctx.strokeStyle = this.options.borderColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, borderRadius);
    ctx.stroke();

    // Render progress bar fill with gradient
    if (this.state.currentProgress > 0) {
      const fillWidth = Math.max(4, (width - 4) * this.state.currentProgress / 100);
      const fillHeight = height - 4;
      const fillX = x + 2;
      const fillY = y + 2;

      // Create gradient for progress fill
      const gradient = ctx.createLinearGradient(fillX, fillY, fillX, fillY + fillHeight);
      const colors = this.state.currentProgress >= 100 
        ? this.options.completionColors 
        : this.options.progressColors;
      
      gradient.addColorStop(0, colors.start);
      gradient.addColorStop(1, colors.end);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(fillX, fillY, fillWidth, fillHeight, borderRadius - 2);
      ctx.fill();
    }

    // Restore context state
    ctx.restore();
  }

  /**
   * Get current progress value
   */
  getCurrentProgress(): number {
    return this.state.currentProgress;
  }

  /**
   * Get target progress value
   */
  getTargetProgress(): number {
    return this.state.targetProgress;
  }

  /**
   * Check if currently animating
   */
  isAnimating(): boolean {
    return this.state.isAnimating;
  }

  /**
   * Update position
   */
  setPosition(x: number, y: number): void {
    this.options.x = x;
    this.options.y = y;
  }

  /**
   * Update size
   */
  setSize(width: number, height: number): void {
    this.options.width = width;
    this.options.height = height;
  }

  /**
   * Update colors
   */
  setColors(
    progressColors?: { start: string; end: string },
    completionColors?: { start: string; end: string }
  ): void {
    if (progressColors) {
      this.options.progressColors = progressColors;
    }
    if (completionColors) {
      this.options.completionColors = completionColors;
    }
  }
}