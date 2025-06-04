/**
 * PhysicsWorldAdapter - Adapts the shared PhysicsWorld to work with the game's event system
 * This adapter bridges the shared physics implementation with game-specific events
 */

import { BaseSystem } from '../core/BaseSystem';
import { PhysicsWorld as SharedPhysicsWorld } from '@/shared/physics/PhysicsWorld';
import { Body, Constraint } from 'matter-js';
import { DEBUG_CONFIG } from '@/shared/utils/Constants';
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

/**
 * Adapter class that wraps the shared PhysicsWorld for game use
 */
export class PhysicsWorld extends BaseSystem {
  private sharedPhysicsWorld: SharedPhysicsWorld;

  constructor() {
    super('PhysicsWorld');
    
    // Create shared physics world with game configuration
    this.sharedPhysicsWorld = new SharedPhysicsWorld({
      enableBoundaries: true,
    });
  }

  protected async onInitialize(): Promise<void> {
    this.setupEventHandlers();
    this.setupPhysicsWorldEvents();
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

  private setupPhysicsWorldEvents(): void {
    // Bridge shared physics world events to game events
    this.sharedPhysicsWorld.on('collision', (event) => {
      this.emit({
        type: 'physics:collision:detected',
        timestamp: Date.now(),
        bodyA: String(event.bodyA || ''),
        bodyB: String(event.bodyB || ''),
        force: Number(event.force || 0),
      });
    });

    this.sharedPhysicsWorld.on('stepCompleted', (event) => {
      this.emit({
        type: 'physics:step:completed',
        timestamp: Date.now(),
        deltaTime: Number(event.deltaTime || 0),
      });
    });

    this.sharedPhysicsWorld.on('error', (event) => {
      this.emit({
        type: 'physics:error',
        timestamp: Date.now(),
        error: event.error as Error,
      });
    });
  }

  // Event Handlers
  private handleGamePaused(event: GamePausedEvent): void {
    void event; // Mark as used
    this.executeIfActive(() => {
      this.pause();
    });
  }

  private handleGameResumed(event: GameResumedEvent): void {
    void event; // Mark as used
    this.executeIfActive(() => {
      this.resume();
    });
  }

  private handleBoundsChanged(event: BoundsChangedEvent): void {
    this.executeIfActive(() => {
      this.sharedPhysicsWorld.updateBounds(event.width, event.height);
    });
  }

  private handleBodyAdded(event: PhysicsBodyAddedEvent): void {
    this.executeIfActive(() => {
      if (event.body) {
        this.sharedPhysicsWorld.addBodies([event.body]);
        if (DEBUG_CONFIG.logPhysicsDebug) {
          console.log(`Physics body ${event.bodyId} added to world for shape ${event.shape?.id || 'unknown'}`);
        }
      }
    });
  }

  private handleBodyRemoved(event: PhysicsBodyRemovedEvent): void {
    this.executeIfActive(() => {
      const allBodies = this.sharedPhysicsWorld.getAllBodies();
      const bodyToRemove = allBodies.find(body => body.id.toString() === event.bodyId);
      
      if (bodyToRemove) {
        this.sharedPhysicsWorld.removeBodies([bodyToRemove]);
        if (DEBUG_CONFIG.logPhysicsDebug) {
          console.log(`Physics body ${event.bodyId} removed for shape ${event.shape?.id || 'unknown'}`);
        }
      }
    });
  }

  private handleBodyRemovedImmediate(event: PhysicsBodyRemovedImmediateEvent): void {
    this.executeIfActive(() => {
      const anchorBody = event.anchorBody;
      
      // Mark as invisible and non-collidable immediately
      if (anchorBody.render) {
        anchorBody.render.visible = false;
      }
      anchorBody.collisionFilter = { 
        group: -1, 
        category: 0, 
        mask: 0 
      };
      
      // Remove from physics world immediately
      this.sharedPhysicsWorld.removeBodies([anchorBody]);
      
      if (DEBUG_CONFIG.logPhysicsDebug) {
        console.log(`Anchor body ${event.bodyId} immediately removed for shape ${event.shape?.id || 'unknown'}`);
      }
    });
  }

  private handleScrewRemovedImmediate(event: PhysicsScrewRemovedImmediateEvent): void {
    this.executeIfActive(() => {
      // Remove constraint first
      if (event.constraint) {
        if (event.constraint.render) {
          event.constraint.render.visible = false;
        }
        this.sharedPhysicsWorld.removeConstraints([event.constraint]);
        
        if (DEBUG_CONFIG.logPhysicsDebug) {
          console.log(`Constraint immediately removed for screw ${event.screwId}`);
        }
      }
      
      // Remove anchor body second
      if (event.anchorBody) {
        if (event.anchorBody.render) {
          event.anchorBody.render.visible = false;
        }
        event.anchorBody.collisionFilter = { 
          group: -1, 
          category: 0, 
          mask: 0 
        };
        this.sharedPhysicsWorld.removeBodies([event.anchorBody]);
        
        if (DEBUG_CONFIG.logPhysicsDebug) {
          console.log(`Anchor body immediately removed for screw ${event.screwId}`);
        }
      }
      
      if (DEBUG_CONFIG.logPhysicsDebug) {
        console.log(`🔧 Screw ${event.screwId} completely removed from physics world (atomic operation)`);
      }
    });
  }

  private handleConstraintAdded(event: ConstraintAddedEvent): void {
    this.executeIfActive(() => {
      if (event.constraint) {
        this.sharedPhysicsWorld.addConstraints([event.constraint]);
        if (DEBUG_CONFIG.logPhysicsDebug) {
          console.log(`Physics constraint ${event.constraintId} added to world for screw ${event.screw.id}`);
        }
      } else {
        console.error(`No constraint provided in event for screw ${event.screw.id}`);
      }
    });
  }

  private handleConstraintRemoved(event: ConstraintRemovedEvent): void {
    this.executeIfActive(() => {
      const allConstraints = this.sharedPhysicsWorld.getWorld().constraints || [];
      const constraintToRemove = allConstraints.find(constraint => 
        constraint.id?.toString() === event.constraintId
      );
      
      if (constraintToRemove) {
        this.sharedPhysicsWorld.removeConstraints([constraintToRemove]);
        if (DEBUG_CONFIG.logPhysicsDebug) {
          console.log(`Physics constraint ${event.constraintId} removed for screw ${event.screw.id}`);
        }
      }
    });
  }

  // Public API methods (delegate to shared implementation)
  public update(deltaTime?: number): void {
    this.executeIfActive(() => {
      this.sharedPhysicsWorld.update(deltaTime);
    });
  }

  public pause(): void {
    this.executeIfActive(() => {
      this.sharedPhysicsWorld.pause();
    });
  }

  public resume(): void {
    this.executeIfActive(() => {
      this.sharedPhysicsWorld.resume();
    });
  }

  public isPausedState(): boolean {
    return this.sharedPhysicsWorld.isPausedState();
  }

  public addBodies(bodies: Body[]): void {
    this.executeIfActive(() => {
      this.sharedPhysicsWorld.addBodies(bodies);
    });
  }

  public removeBodies(bodies: Body[]): void {
    this.executeIfActive(() => {
      this.sharedPhysicsWorld.removeBodies(bodies);
    });
  }

  public addConstraints(constraints: Constraint[]): void {
    this.executeIfActive(() => {
      this.sharedPhysicsWorld.addConstraints(constraints);
    });
  }

  public removeConstraints(constraints: Constraint[]): void {
    this.executeIfActive(() => {
      this.sharedPhysicsWorld.removeConstraints(constraints);
    });
  }

  public getAllBodies(): Body[] {
    return this.sharedPhysicsWorld.getAllBodies();
  }

  public getBodiesAtPoint(point: { x: number; y: number }): Body[] {
    return this.sharedPhysicsWorld.getBodiesAtPoint(point);
  }

  public setGravity(gravity: { x: number; y: number; scale?: number }): void {
    this.executeIfActive(() => {
      this.sharedPhysicsWorld.setGravity(gravity);
    });
  }

  public getEngine() {
    return this.sharedPhysicsWorld.getEngine();
  }

  public getWorld() {
    return this.sharedPhysicsWorld.getWorld();
  }

  public clear(): void {
    this.executeIfActive(() => {
      this.sharedPhysicsWorld.clear();
    });
  }

  public getStats() {
    return this.sharedPhysicsWorld.getStats();
  }

  protected onDestroy(): void {
    this.sharedPhysicsWorld.destroy();
  }
}