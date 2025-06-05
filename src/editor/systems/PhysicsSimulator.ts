import { BaseEditorSystem } from '../core/BaseEditorSystem';
import { PhysicsWorld } from '@/shared/physics/PhysicsWorld';
import { PhysicsBodyFactory } from '@/shared/physics/PhysicsBodyFactory';
import { ConstraintUtils } from '@/shared/physics/ConstraintUtils';
import { Shape } from '@/game/entities/Shape';
import { Screw } from '@/game/entities/Screw';
import { ShapeRenderer } from '@/game/rendering/ShapeRenderer';
import { ScrewRenderer } from '@/game/rendering/ScrewRenderer';
import { EditorEventPriority } from '../core/EditorEventBus';
import { Vector2 } from '@/types/game';
import { 
  EditorPhysicsStartRequestedEvent, 
  EditorShapeUpdatedEvent, 
  EditorCanvasResizedEvent,
  EditorPhysicsSimulationShapeProvidedEvent
} from '../events/EditorEventTypes';
import { DEBUG_CONFIG } from '@/shared/utils/Constants';

/**
 * Manages physics simulation in the editor
 */
export class PhysicsSimulator extends BaseEditorSystem {
  private physicsWorld: PhysicsWorld | null = null;
  private isSimulating = false;
  private isPaused = false;
  private simulatedShapes: Map<string, { shape: Shape; screws: Screw[] }> = new Map();
  private originalShapePositions: Map<string, Vector2> = new Map();

  constructor() {
    super('PhysicsSimulator');
  }

  protected async onInitialize(): Promise<void> {
    // Initialize shared physics world for editor
    this.physicsWorld = new PhysicsWorld({
      enableBoundaries: true,
    });
    
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
      // Update shape position and rotation from physics body
      if (shape.body && shape.body.position) {
        // Use the Shape's updateFromBody method to sync with physics
        shape.updateFromBody();
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
      if (this.physicsWorld) {
        this.physicsWorld.updateBounds(event.payload.width, event.payload.height);
      }
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
      // Clear any previous simulation
      await this.resetSimulation();
      
      this.isSimulating = true;
      this.isPaused = false;

      // Ensure physics world is not paused
      if (this.physicsWorld.isPausedState()) {
        this.physicsWorld.resume();
      }

      // Request the current shape data from ShapeEditorManager
      await this.emit({
        type: 'editor:physics:simulation:shape:requested',
        payload: { shapeId },
      });
      
      if (DEBUG_CONFIG.logPhysicsDebug) {
        console.log('Physics simulation started for shape:', shapeId);
      }
      
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
    if (DEBUG_CONFIG.logPhysicsDebug) {
      console.log('Physics simulation', this.isPaused ? 'paused' : 'resumed');
    }
  }

  private async resetSimulation(): Promise<void> {
    // Restore original shape positions before clearing simulation
    for (const [shapeId, originalPosition] of this.originalShapePositions.entries()) {
      const simulatedShape = this.simulatedShapes.get(shapeId);
      if (simulatedShape) {
        // Restore the shape position in the shape entity
        simulatedShape.shape.position.x = originalPosition.x;
        simulatedShape.shape.position.y = originalPosition.y;
        
        // Update the physics body position if it exists
        if (simulatedShape.shape.body) {
          simulatedShape.shape.body.position.x = originalPosition.x;
          simulatedShape.shape.body.position.y = originalPosition.y;
        }
        
        // Emit shape preview updated event to notify editor to re-render
        await this.emit({
          type: 'editor:shape:preview:updated',
          payload: {
            shapeId: shapeId
          },
        });
      }
    }
    
    this.stopSimulation();
    
    if (this.physicsWorld) {
      // Clear all bodies from physics world
      this.physicsWorld.clear();
    }
    
    this.simulatedShapes.clear();
    this.originalShapePositions.clear();
    if (DEBUG_CONFIG.logPhysicsDebug) {
      console.log('Physics simulation reset - shapes restored to original positions');
    }
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
      if (DEBUG_CONFIG.logPhysicsDebug) {
        console.log('PhysicsSimulator: Adding shape to physics world', shapeData.shapeId);
      }
      
      // Use PhysicsBodyFactory to create the physics body
      const bodyResult = PhysicsBodyFactory.createShapeBodyFromDefinition(
        shapeData.shape.type,
        shapeData.shape.position,
        {
          radius: shapeData.shape.radius,
          width: shapeData.shape.width,
          height: shapeData.shape.height,
        }
      );
      
      const physicsBody = bodyResult.body;
      const physicsBodyParts = bodyResult.parts;

      // Create shape entity from data
      const shapeEntity = new Shape(
        shapeData.shape.id,
        shapeData.shape.type as 'circle' | 'rectangle' | 'capsule',
        shapeData.shape.position,
        physicsBody,
        'physics-layer',
        '#007bff', // Keep blue color consistent with editor
        '#007bff', // Keep blue tint consistent with editor
        shapeData.shape.id, // definitionId
        {
          radius: shapeData.shape.radius,
          width: shapeData.shape.width,
          height: shapeData.shape.height,
        },
        physicsBodyParts ? { isComposite: true, parts: physicsBodyParts } : undefined
      );
      
      // For composite bodies, sync the position after creation
      if (physicsBodyParts) {
        shapeEntity.updateFromBody();
        if (DEBUG_CONFIG.logPhysicsDebug) {
          console.log(`🔧 COMPOSITE BODY DEBUG:`);
          console.log(`  Body.isStatic: ${physicsBody.isStatic}`);
          console.log(`  Body.mass: ${physicsBody.mass.toFixed(3)}`);
          console.log(`  Body.inertia: ${physicsBody.inertia.toFixed(3)}`);
          console.log(`  Body.parts.length: ${physicsBody.parts.length}`);
        }
      }

      // Create screw entities
      const screwEntities: Screw[] = [];
      for (const screwData of shapeData.screws) {
        const screw = new Screw(
          screwData.id,
          shapeData.shape.id,
          screwData.position,
          'red' // Keep red color consistent with editor
        );
        screwEntities.push(screw);
      }

      // Add shape body to physics world using the proper game event system
      // Note: We need to emit to the game's event bus, not the editor's event bus
      // For now, we'll use the PhysicsWorld's public API directly
      
      this.physicsWorld.addBodies([physicsBody]);
      
      // Use ConstraintUtils to create constraints for all screws
      const constraintResults = ConstraintUtils.createScrewConstraints(
        physicsBody,
        screwEntities
      );
      
      // Extract constraints and anchor bodies
      const constraints = constraintResults.map(r => r.constraint);
      const anchorBodies = constraintResults.map(r => r.anchorBody);
      
      // Add anchor bodies and constraints to physics world
      if (anchorBodies.length > 0) {
        this.physicsWorld.addBodies(anchorBodies);
      }
      if (constraints.length > 0) {
        this.physicsWorld.addConstraints(constraints);
      }
      
      // Store original position before simulation
      this.originalShapePositions.set(shapeData.shapeId, {
        x: shapeData.shape.position.x,
        y: shapeData.shape.position.y
      });

      // Store for tracking and rendering
      this.simulatedShapes.set(shapeData.shapeId, {
        shape: shapeEntity,
        screws: screwEntities,
      });

      if (DEBUG_CONFIG.logPhysicsDebug) {
        console.log('PhysicsSimulator: Shape added to physics world with', screwEntities.length, 'screws and', constraints.length, 'constraints');
      }
      
    } catch (error) {
      if (DEBUG_CONFIG.logPhysicsDebug) {
        console.error('PhysicsSimulator: Error adding shape to physics world:', error);
      }
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