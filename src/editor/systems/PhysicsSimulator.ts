import { BaseEditorSystem } from '../core/BaseEditorSystem';
import { PhysicsWorld } from '@/game/physics/PhysicsWorld';
import { Shape } from '@/game/entities/Shape';
import { Screw } from '@/game/entities/Screw';
import { ShapeRenderer } from '@/game/rendering/ShapeRenderer';
import { ScrewRenderer } from '@/game/rendering/ScrewRenderer';
import { EditorEventPriority } from '../core/EditorEventBus';
import { Body } from 'matter-js';
import { 
  EditorPhysicsStartRequestedEvent, 
  EditorShapeUpdatedEvent, 
  EditorCanvasResizedEvent,
  EditorPhysicsSimulationShapeProvidedEvent
} from '../events/EditorEventTypes';

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
    if (!this.isSimulating) return;

    // Render simulated shapes with their updated physics positions
    const renderContext = {
      ctx: context,
      canvas: context.canvas,
      debugMode: false,
    };

    for (const { shape, screws } of this.simulatedShapes.values()) {
      // Update shape position from physics body
      if (shape.body && shape.body.position) {
        shape.position.x = shape.body.position.x;
        shape.position.y = shape.body.position.y;
      }

      // Render shape
      ShapeRenderer.renderShape(shape, renderContext);

      // Render screws
      for (const screw of screws) {
        ScrewRenderer.renderScrew(screw, renderContext);
      }
    }
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

    // Handle shape data for simulation
    this.subscribe('editor:physics:simulation:shape:provided', async (event: EditorPhysicsSimulationShapeProvidedEvent) => {
      await this.addShapeToPhysicsWorld(event.payload);
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

      // Request the current shape data from ShapeEditorManager
      await this.emit({
        type: 'editor:physics:simulation:shape:requested',
        payload: { shapeId },
      });
      
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
    this.simulatedShapes.clear();
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

  private async addShapeToPhysicsWorld(shapeData: EditorPhysicsSimulationShapeProvidedEvent['payload']): Promise<void> {
    if (!this.physicsWorld) return;

    try {
      console.log('PhysicsSimulator: Adding shape to physics world', shapeData.shapeId);
      
      // Create shape entity from data
      const shapeEntity = new Shape(
        shapeData.shape.id,
        shapeData.shape.type as 'circle' | 'rectangle',
        shapeData.shape.position,
        shapeData.shape.body as Body,
        'physics-layer',
        '#ff6b6b', // Red color for physics simulation
        '#ff6b6b',
        {
          radius: shapeData.shape.radius,
          width: shapeData.shape.width,
          height: shapeData.shape.height,
        }
      );

      // Create screw entities
      const screwEntities: Screw[] = [];
      for (const screwData of shapeData.screws) {
        const screw = new Screw(
          screwData.id,
          shapeData.shape.id,
          screwData.position,
          'brown' // Dark color for physics screws
        );
        screwEntities.push(screw);
      }

      // For the editor physics simulation, we'll just track the shapes
      // and let the physics world handle them through its internal methods
      // In a production environment, we'd use proper event emission
      
      // Store for tracking and rendering

      // Store for tracking
      this.simulatedShapes.set(shapeData.shapeId, {
        shape: shapeEntity,
        screws: screwEntities,
      });

      console.log('PhysicsSimulator: Shape added to physics world with', screwEntities.length, 'screws');
      
    } catch (error) {
      console.error('PhysicsSimulator: Error adding shape to physics world:', error);
      await this.emit({
        type: 'editor:error:physics',
        payload: {
          error: error instanceof Error ? error.message : 'Failed to add shape to physics world',
          context: 'physics world addition',
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