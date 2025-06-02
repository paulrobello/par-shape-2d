import { BaseEditorSystem } from '../core/BaseEditorSystem';
import { PhysicsWorld } from '@/game/physics/PhysicsWorld';
import { Shape } from '@/game/entities/Shape';
import { Screw } from '@/game/entities/Screw';
import { EditorEventPriority } from '../core/EditorEventBus';
import { EditorPhysicsStartRequestedEvent, EditorShapeUpdatedEvent, EditorCanvasResizedEvent } from '../events/EditorEventTypes';

/**
 * Manages physics simulation in the editor
 */
export class PhysicsSimulator extends BaseEditorSystem {
  private physicsWorld: PhysicsWorld | null = null;
  private isSimulating = false;
  private isPaused = false;
  private simulatedShapes: Map<string, { shape: Shape; screws: Screw[] }> = new Map();

  constructor() {
    super('PhysicsSimulator');
  }

  protected async onInitialize(): Promise<void> {
    // Initialize physics world
    this.physicsWorld = new PhysicsWorld();
    await this.physicsWorld.initialize();
    
    this.setupEventSubscriptions();
  }

  protected onUpdate(deltaTime: number): void {
    if (this.isSimulating && !this.isPaused && this.physicsWorld) {
      this.physicsWorld.update(deltaTime);
      
      // Emit physics step completion
      this.emit({
        type: 'editor:physics:step:completed',
        payload: { timestamp: Date.now() },
      });
    }
  }

  protected onRender(context: CanvasRenderingContext2D): void {
    // PhysicsSimulator doesn't directly render - shapes render themselves with updated positions
    void context;
  }

  protected onDestroy(): void {
    this.stopSimulation();
    if (this.physicsWorld) {
      this.physicsWorld.destroy();
      this.physicsWorld = null;
    }
  }

  private setupEventSubscriptions(): void {
    // Simulation control
    this.subscribe('editor:physics:start:requested', async (event: EditorPhysicsStartRequestedEvent) => {
      await this.startSimulation(event.payload.shapeId);
    }, EditorEventPriority.HIGH);

    this.subscribe('editor:physics:pause:requested', async () => {
      this.pauseSimulation();
    });

    this.subscribe('editor:physics:reset:requested', async () => {
      await this.resetSimulation();
    });

    // Handle shape updates during simulation
    this.subscribe('editor:shape:updated', async (event: EditorShapeUpdatedEvent) => {
      if (this.isSimulating) {
        // Re-add the shape to physics world with new properties
        await this.addShapeToSimulation(event.payload.shapeDefinition as unknown as Record<string, unknown>, event.payload.shapeId);
      }
    });

    // Handle canvas resize
    this.subscribe('editor:canvas:resized', async (event: EditorCanvasResizedEvent) => {
      // Note: PhysicsWorld doesn't expose a public setBounds method
      // For the editor, we'll let the physics world handle boundaries internally
      console.log('Canvas resized to:', event.payload.width, 'x', event.payload.height);
    });
  }

  private async startSimulation(shapeId: string): Promise<void> {
    if (!this.physicsWorld) {
      await this.emit({
        type: 'editor:error:physics',
        payload: {
          error: 'Physics world not initialized',
          context: 'simulation start',
        },
      });
      return;
    }

    try {
      this.isSimulating = true;
      this.isPaused = false;

      // Get current shape from shape editor manager
      // This would need to be coordinated through events in a real implementation
      
      console.log('Physics simulation started for shape:', shapeId);
      
    } catch (error) {
      await this.emit({
        type: 'editor:error:physics',
        payload: {
          error: error instanceof Error ? error.message : 'Unknown physics error',
          context: 'simulation start',
        },
      });
    }
  }

  private pauseSimulation(): void {
    this.isPaused = !this.isPaused;
    console.log('Physics simulation', this.isPaused ? 'paused' : 'resumed');
  }

  private async resetSimulation(): Promise<void> {
    this.stopSimulation();
    
    if (this.physicsWorld) {
      // Clear all bodies from physics world
      this.physicsWorld.clear();
    }
    
    this.simulatedShapes.clear();
    console.log('Physics simulation reset');
  }

  private stopSimulation(): void {
    this.isSimulating = false;
    this.isPaused = false;
  }

  private async addShapeToSimulation(shapeDefinition: Record<string, unknown>, shapeId: string): Promise<void> {
    if (!this.physicsWorld) return;

    try {
      // This would create physics bodies for the shape and screws
      // and add them to the physics world
      console.log('Adding shape to simulation:', shapeId);
      
    } catch (error) {
      await this.emit({
        type: 'editor:error:physics',
        payload: {
          error: error instanceof Error ? error.message : 'Failed to add shape to simulation',
          context: 'shape addition',
        },
      });
    }
  }

  // Public API
  isRunning(): boolean {
    return this.isSimulating;
  }

  isPausedState(): boolean {
    return this.isPaused;
  }

  getPhysicsWorld(): PhysicsWorld | null {
    return this.physicsWorld;
  }
}