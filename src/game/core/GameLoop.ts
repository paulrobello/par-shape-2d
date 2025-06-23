/**
 * GameLoop - Fixed timestep game loop implementation
 * 
 * Implements a fixed timestep game loop pattern that ensures consistent physics
 * simulation regardless of display refresh rate. This pattern separates game
 * logic updates (which run at a fixed rate) from rendering (which runs as fast
 * as possible).
 * 
 * Benefits of fixed timestep:
 * - Deterministic physics simulation
 * - Consistent gameplay across different devices
 * - Easier to debug and replay game states
 * - Prevents physics explosions from large delta times
 * 
 * The loop uses an accumulator pattern to handle cases where the display
 * refresh rate doesn't match the target update rate.
 * 
 * @see https://gafferongames.com/post/fix_your_timestep/
 */
export class GameLoop {
  private isRunning: boolean = false;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private targetDelta: number;
  /** Maximum allowed frame time (ms) to prevent "spiral of death" when game is paused/tabbed out */
  private maxFrameTime: number = 1000 / 30; // Cap at 30fps minimum (33.33ms max frame time)
  private updateCallback: (deltaTime: number) => void;
  private renderCallback: () => void;
  private animationFrameId: number | null = null;

  /**
   * Creates a new game loop with fixed timestep
   * @param targetFPS - Target frames per second for game logic updates (default: 60)
   * @param updateCallback - Function called for each fixed timestep update with deltaTime in milliseconds
   * @param renderCallback - Function called for each render frame (may be called more/less than update)
   */
  constructor(
    targetFPS: number = 60,
    updateCallback: (deltaTime: number) => void,
    renderCallback: () => void
  ) {
    this.targetDelta = 1000 / targetFPS; // Convert FPS to milliseconds per frame
    this.updateCallback = updateCallback;
    this.renderCallback = renderCallback;
  }

  /**
   * Starts the game loop
   * Initializes timing variables and begins the update/render cycle
   */
  public start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.loop(this.lastTime);
  }

  /**
   * Stops the game loop
   * Cancels the animation frame and halts all updates/renders
   */
  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }


  /**
   * Main game loop using fixed timestep with interpolation
   * 
   * Algorithm:
   * 1. Calculate time elapsed since last frame
   * 2. Cap frame time to prevent spiral of death
   * 3. Add frame time to accumulator
   * 4. Consume fixed chunks from accumulator for updates
   * 5. Render current state
   * 6. Schedule next frame
   * 
   * @param currentTime - Current timestamp from requestAnimationFrame
   */
  private loop = (currentTime: number): void => {
    if (!this.isRunning) return;

    // Calculate frame time since last loop iteration
    let frameTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Prevent spiral of death: if frame time is too large (e.g., after tab switch),
    // cap it to prevent physics explosion from trying to catch up
    frameTime = Math.min(frameTime, this.maxFrameTime);

    // Accumulate time for fixed timestep processing
    this.accumulator += frameTime;

    // Fixed timestep updates: consume time in fixed chunks
    // This ensures consistent physics regardless of frame rate
    while (this.accumulator >= this.targetDelta) {
      this.updateCallback(this.targetDelta);
      this.accumulator -= this.targetDelta;
    }

    // Render current state (may interpolate based on accumulator remainder)
    this.renderCallback();

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  /**
   * Changes the target FPS for game logic updates
   * @param fps - New target frames per second
   */
  public setTargetFPS(fps: number): void {
    this.targetDelta = 1000 / fps;
  }

  /**
   * Checks if the game loop is currently running
   * @returns true if the loop is active
   */
  public isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Gets the target delta time for fixed timestep updates
   * @returns Target delta time in milliseconds
   */
  public getTargetDelta(): number {
    return this.targetDelta;
  }
}