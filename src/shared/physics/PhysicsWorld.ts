/**
 * PhysicsWorld - Shared physics world implementation for game and editor
 * Manages Matter.js physics simulation with event-driven architecture
 */

import { Engine, World, Body, Events, Composite, Vertices, Sleeping, Constraint } from 'matter-js';
import { Vector2 } from '@/types/game';
import { Screw } from '@/game/entities/Screw';
import { PhysicsBodyFactory } from './PhysicsBodyFactory';
import { PHYSICS_CONSTANTS, GAME_CONFIG, DEBUG_CONFIG } from '@/shared/utils/Constants';

export interface PhysicsWorldConfig {
  gravity?: { x: number; y: number; scale?: number };
  enableSleeping?: boolean;
  constraintIterations?: number;
  positionIterations?: number;
  velocityIterations?: number;
  bounds?: { x: number; y: number; width: number; height: number };
  enableBoundaries?: boolean;
}

export interface PhysicsWorldState {
  engine: Engine;
  world: World;
  boundaries: Body[];
  isPaused: boolean;
  bodies: Set<string>;
  constraints: Set<string>;
}

export interface CollisionEvent {
  bodyA: string;
  bodyB: string;
  force: number;
}

export interface PhysicsEventData {
  [key: string]: unknown;
}

export type PhysicsEventCallback = (event: PhysicsEventData) => void;

/**
 * Shared physics world implementation
 */
export class PhysicsWorld {
  private state: PhysicsWorldState;
  private config: PhysicsWorldConfig;
  private eventCallbacks: Map<string, PhysicsEventCallback[]> = new Map();

  constructor(config: PhysicsWorldConfig = {}) {
    this.config = {
      gravity: config.gravity ?? GAME_CONFIG.physics.gravity,
      enableSleeping: config.enableSleeping ?? true,
      constraintIterations: config.constraintIterations ?? 2,
      positionIterations: config.positionIterations ?? 6,
      velocityIterations: config.velocityIterations ?? 4,
      bounds: config.bounds ?? PHYSICS_CONSTANTS.world.bounds,
      enableBoundaries: config.enableBoundaries ?? true,
    };

    const engine = Engine.create({
      gravity: this.config.gravity,
      enableSleeping: this.config.enableSleeping,
      constraintIterations: this.config.constraintIterations,
      positionIterations: this.config.positionIterations,
      velocityIterations: this.config.velocityIterations,
    });

    this.state = {
      engine,
      world: engine.world,
      boundaries: [],
      isPaused: false,
      bodies: new Set(),
      constraints: new Set(),
    };

    this.initialize();
  }

  private initialize(): void {
    if (this.config.enableBoundaries) {
      this.setupBoundaries();
    }
    this.setupPhysicsEvents();
    this.ensureAllBodiesHaveCollisionFilters();
  }

  private ensureAllBodiesHaveCollisionFilters(): void {
    const allBodies = Composite.allBodies(this.state.world);
    allBodies.forEach(body => {
      if (!body.collisionFilter) {
        body.collisionFilter = {
          group: 0,
          category: 0x0001,
          mask: 0xFFFFFFFF,
        };
      } else {
        if (body.collisionFilter.group === undefined) {
          body.collisionFilter.group = 0;
        }
        if (body.collisionFilter.category === undefined) {
          body.collisionFilter.category = 0x0001;
        }
        if (body.collisionFilter.mask === undefined) {
          body.collisionFilter.mask = 0xFFFFFFFF;
        }
      }
    });
  }

  private setupBoundaries(): void {
    const bounds = this.config.bounds!;
    const thickness = 50;

    // Create invisible boundaries (non-collidable - shapes should fall through)
    this.state.boundaries = [
      // Left wall
      PhysicsBodyFactory.createBoundaryWall(
        bounds.x - thickness / 2,
        bounds.y + bounds.height / 2,
        thickness,
        bounds.height
      ),
      // Right wall
      PhysicsBodyFactory.createBoundaryWall(
        bounds.x + bounds.width + thickness / 2,
        bounds.y + bounds.height / 2,
        thickness,
        bounds.height
      ),
      // Bottom wall
      PhysicsBodyFactory.createBoundaryWall(
        bounds.x + bounds.width / 2,
        bounds.y + bounds.height + thickness / 2,
        bounds.width + thickness * 2,
        thickness
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

  // Event handling
  private onCollisionStart(bodyA: Body, bodyB: Body): void {
    const force = this.calculateCollisionForce(bodyA, bodyB);
    
    this.emit('collision', {
      bodyA: bodyA.id.toString(),
      bodyB: bodyB.id.toString(),
      force,
    });
  }

  private onBeforeUpdate(): void {
    this.emit('beforeUpdate', {});
  }

  private onAfterUpdate(): void {
    // Wake up sleeping shapes that might have lost their support
    this.wakeUnsupportedSleepingShapes();
    this.emit('afterUpdate', {});
  }

  private calculateCollisionForce(bodyA: Body, bodyB: Body): number {
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
        Body.setVelocity(sleepingBody, { x: 0, y: 0.5 });
        
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

  // Event system
  on(event: string, callback: PhysicsEventCallback): void {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, []);
    }
    this.eventCallbacks.get(event)!.push(callback);
  }

  off(event: string, callback: PhysicsEventCallback): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: PhysicsEventData): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // Public API methods
  public update(deltaTime: number = GAME_CONFIG.physics.timestep): void {
    if (!this.state.isPaused) {
      try {
        Engine.update(this.state.engine, deltaTime);
        
        if (DEBUG_CONFIG.logPhysicsUpdates && Date.now() % 1000 < 50) {
          const allBodies = Composite.allBodies(this.state.world);
          const dynamicBodies = allBodies.filter(b => !b.isStatic);
          console.log(`🔧 Physics Update: ${dynamicBodies.length} dynamic bodies, ${allBodies.length} total bodies, isPaused: ${this.state.isPaused}`);
        }
        
        this.emit('stepCompleted', { deltaTime });
      } catch (error) {
        this.emit('error', { error });
        console.error('Physics step error:', error);
      }
    }
  }

  public pause(): void {
    this.state.isPaused = true;
    if (DEBUG_CONFIG.logPhysicsDebug) {
      console.log('Physics simulation paused');
    }
  }

  public resume(): void {
    this.state.isPaused = false;
    if (DEBUG_CONFIG.logPhysicsDebug) {
      console.log('Physics simulation resumed');
    }
  }

  public isPausedState(): boolean {
    return this.state.isPaused;
  }

  public addBodies(bodies: Body[]): void {
    // Ensure all bodies have proper collision filters
    bodies.forEach(body => {
      if (!body.collisionFilter) {
        body.collisionFilter = {
          group: 0,
          category: 0x0001,
          mask: 0xFFFFFFFF,
        };
      } else {
        // Ensure all required properties exist
        if (body.collisionFilter.group === undefined) {
          body.collisionFilter.group = 0;
        }
        if (body.collisionFilter.category === undefined) {
          body.collisionFilter.category = 0x0001;
        }
        if (body.collisionFilter.mask === undefined) {
          body.collisionFilter.mask = 0xFFFFFFFF;
        }
      }
    });

    Composite.add(this.state.world, bodies);
    bodies.forEach(body => {
      this.state.bodies.add(body.id.toString());
    });
  }

  public removeBodies(bodies: Body[]): void {
    Composite.remove(this.state.world, bodies);
    bodies.forEach(body => {
      this.state.bodies.delete(body.id.toString());
    });
  }

  public addConstraints(constraints: Constraint[]): void {
    Composite.add(this.state.world, constraints);
    constraints.forEach(constraint => {
      if (constraint.id) {
        this.state.constraints.add(constraint.id.toString());
      }
    });
  }

  public removeConstraints(constraints: Constraint[]): void {
    Composite.remove(this.state.world, constraints);
    constraints.forEach(constraint => {
      if (constraint.id) {
        this.state.constraints.delete(constraint.id.toString());
      }
    });
  }

  public getAllBodies(): Body[] {
    return Composite.allBodies(this.state.world);
  }

  public getBodiesAtPoint(point: Vector2): Body[] {
    return this.getAllBodies().filter((body) => {
      return Vertices.contains(body.vertices, point);
    });
  }

  public setGravity(gravity: { x: number; y: number; scale?: number }): void {
    this.state.engine.gravity.x = gravity.x;
    this.state.engine.gravity.y = gravity.y;
    if (gravity.scale !== undefined) {
      this.state.engine.gravity.scale = gravity.scale;
    }
  }

  public updateBounds(width: number, height: number): void {
    if (!this.config.enableBoundaries) return;

    // Remove old boundaries
    Composite.remove(this.state.world, this.state.boundaries);
    
    // Update config
    this.config.bounds = { x: 0, y: 0, width, height };
    
    // Create new boundaries
    this.setupBoundaries();
  }

  public getEngine(): Engine {
    return this.state.engine;
  }

  public getWorld(): World {
    return this.state.world;
  }

  public clear(): void {
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
  }

  // Editor-specific methods
  public createSimulationBodies(shape: { 
    id: string; 
    type: string; 
    position: Vector2;
    radius?: number;
    width?: number;
    height?: number;
  }, screws: Array<{
    id: string;
    position: Vector2;
  }>): {
    shapeBody: Body;
    constraints: Constraint[];
    anchorBodies: Body[];
  } {
    // Create shape body
    const bodyResult = PhysicsBodyFactory.createShapeBodyFromDefinition(
      shape.type,
      shape.position,
      {
        radius: shape.radius,
        width: shape.width,
        height: shape.height,
      }
    );

    // Create constraints for screws
    const constraints: Constraint[] = [];
    const anchorBodies: Body[] = [];

    for (const screw of screws) {
      const anchorBody = PhysicsBodyFactory.createScrewAnchorBody({
        id: screw.id,
        shapeId: shape.id,
        position: screw.position,
        color: 'red',
      } as Screw);
      
      const constraint = PhysicsBodyFactory.createScrewConstraint(
        bodyResult.body,
        anchorBody,
        screw.position
      );

      anchorBodies.push(anchorBody);
      constraints.push(constraint);
    }

    return {
      shapeBody: bodyResult.body,
      constraints,
      anchorBodies,
    };
  }

  public resetSimulation(): void {
    this.clear();
    this.state.isPaused = false;
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
      trackedConstraints: this.state.constraints.size,
    };
  }

  public destroy(): void {
    Events.off(this.state.engine, 'collisionStart');
    Events.off(this.state.engine, 'beforeUpdate');
    Events.off(this.state.engine, 'afterUpdate');
    this.clear();
    World.clear(this.state.world, false);
    Engine.clear(this.state.engine);
    this.eventCallbacks.clear();
  }
}