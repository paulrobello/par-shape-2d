/**
 * Event-driven PhysicsWorld implementation
 * Manages physics independently through events, removing game logic dependencies
 */

import { BaseSystem } from '../core/BaseSystem';
import { Engine, World, Bodies, Body, Events, Composite, Vertices, Sleeping, Constraint } from 'matter-js';
import { PHYSICS_CONSTANTS, GAME_CONFIG } from '@/game/utils/Constants';
import {
  PhysicsBodyAddedEvent,
  PhysicsBodyRemovedEvent,
  PhysicsBodyRemovedImmediateEvent,
  PhysicsScrewRemovedImmediateEvent,
  ConstraintAddedEvent,
  ConstraintRemovedEvent,
  GamePausedEvent,
  GameResumedEvent,
  BoundsChangedEvent
} from '../events/EventTypes';

interface PhysicsWorldState {
  engine: Engine;
  world: World;
  boundaries: Body[];
  isPaused: boolean;
  bodies: Set<string>;
  constraints: Set<string>;
}

export class PhysicsWorld extends BaseSystem {
  private state: PhysicsWorldState;

  constructor() {
    super('PhysicsWorld');
    
    const engine = Engine.create({
      gravity: GAME_CONFIG.physics.gravity,
      enableSleeping: true,
      constraintIterations: 2,
      positionIterations: 6,
      velocityIterations: 4,
    });

    this.state = {
      engine,
      world: engine.world,
      boundaries: [],
      isPaused: false,
      bodies: new Set(),
      constraints: new Set()
    };
  }

  protected async onInitialize(): Promise<void> {
    this.setupBoundaries();
    this.setupPhysicsEvents();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Game state events
    this.subscribe('game:paused', this.handleGamePaused.bind(this));
    this.subscribe('game:resumed', this.handleGameResumed.bind(this));
    this.subscribe('bounds:changed', this.handleBoundsChanged.bind(this));
    
    // Physics body events
    this.subscribe('physics:body:added', this.handleBodyAdded.bind(this));
    this.subscribe('physics:body:removed', this.handleBodyRemoved.bind(this));
    this.subscribe('physics:body:removed:immediate', this.handleBodyRemovedImmediate.bind(this));
    this.subscribe('physics:screw:removed:immediate', this.handleScrewRemovedImmediate.bind(this));
    
    // Constraint events
    this.subscribe('physics:constraint:added', this.handleConstraintAdded.bind(this));
    this.subscribe('physics:constraint:removed', this.handleConstraintRemoved.bind(this));
  }

  private setupBoundaries(): void {
    const { bounds } = PHYSICS_CONSTANTS.world;
    const thickness = 50;

    // Create invisible boundaries (non-collidable - shapes should fall through)
    this.state.boundaries = [
      // Left wall (non-collidable)
      Bodies.rectangle(
        bounds.x - thickness / 2,
        bounds.y + bounds.height / 2,
        thickness,
        bounds.height,
        { 
          isStatic: true, 
          render: { visible: false },
          collisionFilter: { group: 0, category: 0, mask: 0 }
        }
      ),
      // Right wall (non-collidable)
      Bodies.rectangle(
        bounds.x + bounds.width + thickness / 2,
        bounds.y + bounds.height / 2,
        thickness,
        bounds.height,
        { 
          isStatic: true, 
          render: { visible: false },
          collisionFilter: { group: 0, category: 0, mask: 0 }
        }
      ),
      // Bottom wall (non-collidable)
      Bodies.rectangle(
        bounds.x + bounds.width / 2,
        bounds.y + bounds.height + thickness / 2,
        bounds.width + thickness * 2,
        thickness,
        { 
          isStatic: true, 
          render: { visible: false },
          collisionFilter: { group: 0, category: 0, mask: 0 }
        }
      ),
    ];

    Composite.add(this.state.world, this.state.boundaries);
  }

  private setupPhysicsEvents(): void {
    Events.on(this.state.engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        this.onCollisionStart(pair.bodyA, pair.bodyB);
      });
    });

    Events.on(this.state.engine, 'beforeUpdate', () => {
      this.onBeforeUpdate();
    });

    Events.on(this.state.engine, 'afterUpdate', () => {
      this.onAfterUpdate();
    });
  }

  // Event Handlers
  private handleGamePaused(_event: GamePausedEvent): void {
    void _event;
    this.executeIfActive(() => {
      this.pause();
    });
  }

  private handleGameResumed(_event: GameResumedEvent): void {
    void _event;
    this.executeIfActive(() => {
      this.resume();
    });
  }

  private handleBoundsChanged(event: BoundsChangedEvent): void {
    this.executeIfActive(() => {
      // Update physics world boundaries based on new canvas bounds
      this.updateBoundaries(event.width, event.height);
    });
  }

  private handleBodyAdded(event: PhysicsBodyAddedEvent): void {
    this.executeIfActive(() => {
      // Add the body to the physics world if provided
      if (event.body) {
        World.add(this.state.world, event.body);
        this.state.bodies.add(event.bodyId);
        console.log(`Physics body ${event.bodyId} added to world for shape ${event.shape?.id || 'unknown'}`);
      } else {
        // Body already added by shape creation
        this.state.bodies.add(event.bodyId);
        console.log(`Physics body ${event.bodyId} tracked for shape ${event.shape?.id || 'unknown'}`);
      }
    });
  }

  private handleBodyRemoved(event: PhysicsBodyRemovedEvent): void {
    this.executeIfActive(() => {
      // Find and remove the body from the physics world
      const allBodies = Composite.allBodies(this.state.world);
      const bodyToRemove = allBodies.find(body => body.id.toString() === event.bodyId);
      
      if (bodyToRemove) {
        Composite.remove(this.state.world, bodyToRemove);
        this.state.bodies.delete(event.bodyId);
        console.log(`Physics body ${event.bodyId} removed for shape ${event.shape?.id || 'unknown'}`);
      }
    });
  }

  private handleBodyRemovedImmediate(event: PhysicsBodyRemovedImmediateEvent): void {
    this.executeIfActive(() => {
      // Immediately remove the anchor body from the physics world to prevent rendering artifacts
      const anchorBody = event.anchorBody;
      
      // Mark as invisible and non-collidable immediately
      anchorBody.render.visible = false;
      anchorBody.collisionFilter = { group: -1, category: 0, mask: 0 };
      
      // Remove from physics world immediately
      Composite.remove(this.state.world, anchorBody);
      this.state.bodies.delete(event.bodyId);
      
      console.log(`Anchor body ${event.bodyId} immediately removed for shape ${event.shape?.id || 'unknown'}`);
    });
  }

  private handleScrewRemovedImmediate(event: PhysicsScrewRemovedImmediateEvent): void {
    this.executeIfActive(() => {
      // Immediately and atomically remove both constraint and anchor body
      
      // 1. Remove constraint first
      if (event.constraint) {
        // Mark constraint as invisible immediately
        event.constraint.render.visible = false;
        
        // Remove from physics world
        Composite.remove(this.state.world, event.constraint);
        this.state.constraints.delete(event.constraint.id?.toString() || event.screwId);
        
        console.log(`Constraint immediately removed for screw ${event.screwId}`);
      }
      
      // 2. Remove anchor body second
      if (event.anchorBody) {
        // Mark as invisible and non-collidable immediately
        event.anchorBody.render.visible = false;
        event.anchorBody.collisionFilter = { group: -1, category: 0, mask: 0 };
        
        // Remove from physics world immediately
        Composite.remove(this.state.world, event.anchorBody);
        this.state.bodies.delete(event.anchorBody.id.toString());
        
        console.log(`Anchor body immediately removed for screw ${event.screwId}`);
      }
      
      console.log(`🔧 Screw ${event.screwId} completely removed from physics world (atomic operation)`);
    });
  }

  private handleConstraintAdded(event: ConstraintAddedEvent): void {
    this.executeIfActive(() => {
      // Add the constraint to the physics world
      if (event.constraint) {
        World.add(this.state.world, event.constraint);
        this.state.constraints.add(event.constraintId);
        console.log(`Physics constraint ${event.constraintId} added to world for screw ${event.screw.id}`);
      } else {
        console.error(`No constraint provided in event for screw ${event.screw.id}`);
      }
    });
  }

  private handleConstraintRemoved(event: ConstraintRemovedEvent): void {
    this.executeIfActive(() => {
      // Find and remove the constraint from the physics world
      const allConstraints = Composite.allConstraints(this.state.world);
      const constraintToRemove = allConstraints.find(constraint => 
        constraint.id?.toString() === event.constraintId
      );
      
      if (constraintToRemove) {
        Composite.remove(this.state.world, constraintToRemove);
        this.state.constraints.delete(event.constraintId);
        console.log(`Physics constraint ${event.constraintId} removed for screw ${event.screw.id}`);
      }
    });
  }

  // Physics event handlers
  private onCollisionStart(bodyA: Body, bodyB: Body): void {
    // Emit collision event for game systems to handle
    const force = this.calculateCollisionForce(bodyA, bodyB);
    
    this.emit({
      type: 'physics:collision:detected',
      timestamp: Date.now(),
      bodyA: bodyA.id.toString(),
      bodyB: bodyB.id.toString(),
      force
    });
  }

  private onBeforeUpdate(): void {
    // Pre-physics update logic - could emit event if needed
  }

  private onAfterUpdate(): void {
    // Wake up sleeping shapes that might have lost their support
    this.wakeUnsupportedSleepingShapes();
    
    // Note: We don't emit physics:step:completed on every frame as it causes
    // event loop detection to trigger due to high frequency
  }

  private calculateCollisionForce(bodyA: Body, bodyB: Body): number {
    // Simple force calculation based on velocities
    const velA = Math.sqrt(bodyA.velocity.x ** 2 + bodyA.velocity.y ** 2);
    const velB = Math.sqrt(bodyB.velocity.x ** 2 + bodyB.velocity.y ** 2);
    return velA + velB;
  }

  private wakeUnsupportedSleepingShapes(): void {
    const allBodies = Composite.allBodies(this.state.world);
    
    const sleepingBodies = allBodies.filter(body => 
      !body.isStatic && 
      body.isSleeping && 
      !this.state.boundaries.includes(body)
    );
    
    sleepingBodies.forEach(sleepingBody => {
      if (!this.hasAdequateSupport(sleepingBody, allBodies)) {
        Sleeping.set(sleepingBody, false);
        // Give a stronger wake-up velocity
        Body.setVelocity(sleepingBody, { x: 0, y: 0.5 });
        
        // Also apply a small force to ensure continued motion
        const mass = sleepingBody.mass || 1;
        Body.applyForce(sleepingBody, sleepingBody.position, { 
          x: 0, 
          y: 0.01 * mass 
        });
      }
    });
  }

  private hasAdequateSupport(body: Body, allBodies: Body[]): boolean {
    const bodyBottom = body.position.y + (body.bounds.max.y - body.bounds.min.y) / 2;
    const bodyLeft = body.bounds.min.x;
    const bodyRight = body.bounds.max.x;
    
    const supportCheckDistance = 10;
    
    const supportingBodies = allBodies.filter(otherBody => {
      if (otherBody === body || otherBody.isStatic) return false;
      if (otherBody.isSleeping) return false;
      
      const otherTop = otherBody.position.y - (otherBody.bounds.max.y - otherBody.bounds.min.y) / 2;
      const otherLeft = otherBody.bounds.min.x;
      const otherRight = otherBody.bounds.max.x;
      
      const isBelow = otherTop > bodyBottom && otherTop < bodyBottom + supportCheckDistance;
      const overlapsHorizontally = !(otherRight < bodyLeft || otherLeft > bodyRight);
      
      return isBelow && overlapsHorizontally;
    });
    
    return supportingBodies.length > 0;
  }

  private updateBoundaries(width: number, height: number): void {
    // Remove old boundaries
    Composite.remove(this.state.world, this.state.boundaries);
    
    // Create new boundaries with updated dimensions
    const thickness = 50;
    const bounds = { x: 0, y: 0, width, height };

    this.state.boundaries = [
      Bodies.rectangle(
        bounds.x - thickness / 2,
        bounds.y + bounds.height / 2,
        thickness,
        bounds.height,
        { 
          isStatic: true, 
          render: { visible: false },
          collisionFilter: { group: 0, category: 0, mask: 0 }
        }
      ),
      Bodies.rectangle(
        bounds.x + bounds.width + thickness / 2,
        bounds.y + bounds.height / 2,
        thickness,
        bounds.height,
        { 
          isStatic: true, 
          render: { visible: false },
          collisionFilter: { group: 0, category: 0, mask: 0 }
        }
      ),
      Bodies.rectangle(
        bounds.x + bounds.width / 2,
        bounds.y + bounds.height + thickness / 2,
        bounds.width + thickness * 2,
        thickness,
        { 
          isStatic: true, 
          render: { visible: false },
          collisionFilter: { group: 0, category: 0, mask: 0 }
        }
      ),
    ];

    Composite.add(this.state.world, this.state.boundaries);
  }

  // Public API methods
  public update(deltaTime: number = GAME_CONFIG.physics.timestep): void {
    this.executeIfActive(() => {
      if (!this.state.isPaused) {
        try {
          Engine.update(this.state.engine, deltaTime);
          
          // Debug: Log physics world status periodically
          if (Date.now() % 1000 < 50) { // Every ~1 second
            const allBodies = Composite.allBodies(this.state.world);
            const dynamicBodies = allBodies.filter(b => !b.isStatic);
            console.log(`🔧 Physics Update: ${dynamicBodies.length} dynamic bodies, ${allBodies.length} total bodies, isPaused: ${this.state.isPaused}`);
          }
          
          // Emit physics step completed event
          this.emit({
            type: 'physics:step:completed',
            timestamp: Date.now(),
            deltaTime
          });
        } catch (error) {
          // Emit physics error event
          this.emit({
            type: 'physics:error',
            timestamp: Date.now(),
            error: error as Error
          });
          
          console.error('Physics step error:', error);
        }
      }
    });
  }

  public pause(): void {
    this.executeIfActive(() => {
      this.state.isPaused = true;
      console.log('Physics simulation paused');
    });
  }

  public resume(): void {
    this.executeIfActive(() => {
      this.state.isPaused = false;
      console.log('Physics simulation resumed');
    });
  }

  public isPausedState(): boolean {
    return this.state.isPaused;
  }

  public addBodies(bodies: Body[]): void {
    this.executeIfActive(() => {
      Composite.add(this.state.world, bodies);
      bodies.forEach(body => {
        this.state.bodies.add(body.id.toString());
      });
    });
  }

  public removeBodies(bodies: Body[]): void {
    this.executeIfActive(() => {
      Composite.remove(this.state.world, bodies);
      bodies.forEach(body => {
        this.state.bodies.delete(body.id.toString());
      });
    });
  }

  public addConstraints(constraints: Constraint[]): void {
    this.executeIfActive(() => {
      Composite.add(this.state.world, constraints);
      constraints.forEach(constraint => {
        if (constraint.id) {
          this.state.constraints.add(constraint.id.toString());
        }
      });
    });
  }

  public removeConstraints(constraints: Constraint[]): void {
    this.executeIfActive(() => {
      Composite.remove(this.state.world, constraints);
      constraints.forEach(constraint => {
        if (constraint.id) {
          this.state.constraints.delete(constraint.id.toString());
        }
      });
    });
  }

  public getAllBodies(): Body[] {
    return Composite.allBodies(this.state.world);
  }

  public getBodiesAtPoint(point: { x: number; y: number }): Body[] {
    return this.getAllBodies().filter((body) => {
      return Vertices.contains(body.vertices, point);
    });
  }

  public setGravity(gravity: { x: number; y: number; scale?: number }): void {
    this.executeIfActive(() => {
      this.state.engine.gravity.x = gravity.x;
      this.state.engine.gravity.y = gravity.y;
      if (gravity.scale !== undefined) {
        this.state.engine.gravity.scale = gravity.scale;
      }
    });
  }

  public getEngine(): Engine {
    return this.state.engine;
  }

  public getWorld(): World {
    return this.state.world;
  }

  public clear(): void {
    this.executeIfActive(() => {
      // Remove all bodies except boundaries
      const allBodies = Composite.allBodies(this.state.world);
      const bodiesToRemove = allBodies.filter((body) => !this.state.boundaries.includes(body));
      Composite.remove(this.state.world, bodiesToRemove);

      // Remove all constraints
      const allConstraints = Composite.allConstraints(this.state.world);
      Composite.remove(this.state.world, allConstraints);
      
      // Clear tracking sets
      this.state.bodies.clear();
      this.state.constraints.clear();
    });
  }

  // Debug methods
  public getStats(): {
    bodyCount: number;
    constraintCount: number;
    isPaused: boolean;
    trackedBodies: number;
    trackedConstraints: number;
  } {
    const allBodies = Composite.allBodies(this.state.world);
    const allConstraints = Composite.allConstraints(this.state.world);
    
    return {
      bodyCount: allBodies.length,
      constraintCount: allConstraints.length,
      isPaused: this.state.isPaused,
      trackedBodies: this.state.bodies.size,
      trackedConstraints: this.state.constraints.size
    };
  }

  protected onDestroy(): void {
    Events.off(this.state.engine, 'collisionStart');
    Events.off(this.state.engine, 'beforeUpdate');
    Events.off(this.state.engine, 'afterUpdate');
    this.clear();
    World.clear(this.state.world, false);
    Engine.clear(this.state.engine);
  }
}