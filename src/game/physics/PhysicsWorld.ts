import { Engine, World, Bodies, Body, Events, Composite, Vertices, Sleeping } from 'matter-js';
import { PHYSICS_CONSTANTS, GAME_CONFIG } from '@/game/utils/Constants';

export class PhysicsWorld {
  private engine: Engine;
  private world: World;
  private boundaries: Body[] = [];

  constructor() {
    this.engine = Engine.create({
      gravity: GAME_CONFIG.physics.gravity,
      enableSleeping: true,
      constraintIterations: 2,
      positionIterations: 6,
      velocityIterations: 4,
    });

    this.world = this.engine.world;
    this.setupBoundaries();
    this.setupEvents();
  }

  private setupBoundaries(): void {
    const { bounds } = PHYSICS_CONSTANTS.world;
    const thickness = 50;

    // Create invisible boundaries (non-collidable - shapes should fall through)
    this.boundaries = [
      // Left wall (non-collidable)
      Bodies.rectangle(
        bounds.x - thickness / 2,
        bounds.y + bounds.height / 2,
        thickness,
        bounds.height,
        { 
          isStatic: true, 
          render: { visible: false },
          collisionFilter: { group: 0, category: 0, mask: 0 } // No collision
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
          collisionFilter: { group: 0, category: 0, mask: 0 } // No collision
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
          collisionFilter: { group: 0, category: 0, mask: 0 } // No collision
        }
      ),
    ];

    Composite.add(this.world, this.boundaries);
  }

  private setupEvents(): void {
    Events.on(this.engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        // Handle collision events if needed
        this.onCollisionStart(pair.bodyA, pair.bodyB);
      });
    });

    Events.on(this.engine, 'beforeUpdate', () => {
      this.onBeforeUpdate();
    });

    Events.on(this.engine, 'afterUpdate', () => {
      this.onAfterUpdate();
    });
  }

  private onCollisionStart(_bodyA: Body, _bodyB: Body): void { // eslint-disable-line @typescript-eslint/no-unused-vars
    // Collision handling logic will be implemented here
    // For now, just store collision events if needed
  }

  private onBeforeUpdate(): void {
    // Pre-physics update logic
  }

  private onAfterUpdate(): void {
    // Wake up sleeping shapes that might have lost their support
    this.wakeUnsupportedSleepingShapes();
  }

  private wakeUnsupportedSleepingShapes(): void {
    const allBodies = Composite.allBodies(this.world);
    
    // Find all sleeping dynamic bodies (excluding static boundaries)
    const sleepingBodies = allBodies.filter(body => 
      !body.isStatic && 
      body.isSleeping && 
      !this.boundaries.includes(body)
    );
    
    sleepingBodies.forEach(sleepingBody => {
      // Check if this body has adequate support
      if (!this.hasAdequateSupport(sleepingBody, allBodies)) {
        // Wake up the unsupported body
        Sleeping.set(sleepingBody, false);
        // Give it a small downward velocity to start falling
        Body.setVelocity(sleepingBody, { x: 0, y: 0.1 });
      }
    });
  }

  private hasAdequateSupport(body: Body, allBodies: Body[]): boolean {
    // Simple support check: look for bodies below this one
    const bodyBottom = body.position.y + (body.bounds.max.y - body.bounds.min.y) / 2;
    const bodyLeft = body.bounds.min.x;
    const bodyRight = body.bounds.max.x;
    
    // Check for supporting bodies slightly below this body
    const supportCheckDistance = 10; // pixels below to check for support
    
    const supportingBodies = allBodies.filter(otherBody => {
      if (otherBody === body || otherBody.isStatic) return false;
      if (otherBody.isSleeping) return false; // Don't count sleeping bodies as reliable support
      
      const otherTop = otherBody.position.y - (otherBody.bounds.max.y - otherBody.bounds.min.y) / 2;
      const otherLeft = otherBody.bounds.min.x;
      const otherRight = otherBody.bounds.max.x;
      
      // Check if the other body is below and overlapping horizontally
      const isBelow = otherTop > bodyBottom && otherTop < bodyBottom + supportCheckDistance;
      const overlapsHorizontally = !(otherRight < bodyLeft || otherLeft > bodyRight);
      
      return isBelow && overlapsHorizontally;
    });
    
    return supportingBodies.length > 0;
  }

  public update(deltaTime: number = GAME_CONFIG.physics.timestep): void {
    Engine.update(this.engine, deltaTime);
  }

  public addBodies(bodies: Body[]): void {
    Composite.add(this.world, bodies);
  }

  public removeBodies(bodies: Body[]): void {
    Composite.remove(this.world, bodies);
  }

  public addConstraints(constraints: any[]): void { // eslint-disable-line @typescript-eslint/no-explicit-any
    Composite.add(this.world, constraints);
  }

  public removeConstraints(constraints: any[]): void { // eslint-disable-line @typescript-eslint/no-explicit-any
    Composite.remove(this.world, constraints);
  }

  public getAllBodies(): Body[] {
    return Composite.allBodies(this.world);
  }

  public getBodiesAtPoint(point: { x: number; y: number }): Body[] {
    return this.getAllBodies().filter((body) => {
      return Vertices.contains(body.vertices, point);
    });
  }

  public setGravity(gravity: { x: number; y: number; scale?: number }): void {
    this.engine.gravity.x = gravity.x;
    this.engine.gravity.y = gravity.y;
    if (gravity.scale !== undefined) {
      this.engine.gravity.scale = gravity.scale;
    }
  }

  public getEngine(): Engine {
    return this.engine;
  }

  public getWorld(): World {
    return this.world;
  }

  public clear(): void {
    // Remove all bodies except boundaries
    const allBodies = Composite.allBodies(this.world);
    const bodiesToRemove = allBodies.filter((body) => !this.boundaries.includes(body));
    Composite.remove(this.world, bodiesToRemove);

    // Remove all constraints
    const allConstraints = Composite.allConstraints(this.world);
    Composite.remove(this.world, allConstraints);
  }

  public dispose(): void {
    Events.off(this.engine, 'collisionStart');
    Events.off(this.engine, 'beforeUpdate');
    Events.off(this.engine, 'afterUpdate');
    this.clear();
    World.clear(this.world, false);
    Engine.clear(this.engine);
  }
}