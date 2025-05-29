export class GameLoop {
  private isRunning: boolean = false;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private targetDelta: number;
  private maxFrameTime: number = 1000 / 30; // 30fps minimum
  private updateCallback: (deltaTime: number) => void;
  private renderCallback: () => void;
  private animationFrameId: number | null = null;

  constructor(
    targetFPS: number = 60,
    updateCallback: (deltaTime: number) => void,
    renderCallback: () => void
  ) {
    this.targetDelta = 1000 / targetFPS;
    this.updateCallback = updateCallback;
    this.renderCallback = renderCallback;
  }

  public start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.loop(this.lastTime);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }


  private loop = (currentTime: number): void => {
    if (!this.isRunning) return;

    // Calculate frame time
    let frameTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Prevent spiral of death
    frameTime = Math.min(frameTime, this.maxFrameTime);

    // Accumulate time
    this.accumulator += frameTime;

    // Fixed timestep updates
    while (this.accumulator >= this.targetDelta) {
      this.updateCallback(this.targetDelta);
      this.accumulator -= this.targetDelta;
    }

    // Render
    this.renderCallback();

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  public setTargetFPS(fps: number): void {
    this.targetDelta = 1000 / fps;
  }

  public isActive(): boolean {
    return this.isRunning;
  }

  public getTargetDelta(): number {
    return this.targetDelta;
  }
}