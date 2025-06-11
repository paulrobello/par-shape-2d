/**
 * ScrewPhysicsService - Handles physics constraints and body management
 * Manages creation, removal, and updates of physics constraints for screws
 */

import { Screw } from '@/game/entities/Screw';
import { Shape } from '@/game/entities/Shape';
import { EventBus } from '@/game/events/EventBus';
import { ConstraintUtils, ScrewConstraintResult } from '@/shared/physics/ConstraintUtils';
import { DEBUG_CONFIG } from '@/shared/utils/Constants';
import { Body, Sleeping } from 'matter-js';
import { ScrewColor, Container, HoldingHole } from '@/types/game';

export interface IScrewPhysicsService {
  createScrewConstraint(screw: Screw, shape: Shape): void;
  removeConstraintOnly(screwId: string): boolean;
  updateShapeConstraints(shapeId: string): void;
  updateScrewPositions(): void;
}

interface PhysicsState {
  screws: Map<string, Screw>;
  constraints: Map<string, ScrewConstraintResult>;
  screwCounter: number;
  containerColors: ScrewColor[];
  containers: Container[];
  holdingHoles: HoldingHole[];
  allShapes: Shape[];
  layerIndexLookup: Map<string, number>;
  virtualGameWidth: number;
  virtualGameHeight: number;
  visibleLayers: Set<string>;
}

export class ScrewPhysicsService implements IScrewPhysicsService {
  private state: PhysicsState;
  private eventBus: EventBus;
  private source: string;

  constructor(state: PhysicsState, eventBus: EventBus, source: string) {
    this.state = state;
    this.eventBus = eventBus;
    this.source = source;
  }

  /**
   * Create a physics constraint for a screw
   */
  public createScrewConstraint(screw: Screw, shape: Shape): void {
    const positionMismatch = Math.abs(shape.position.x - shape.body.position.x) > 0.1 || Math.abs(shape.position.y - shape.body.position.y) > 0.1;
    
    if (DEBUG_CONFIG.logPhysicsDebug) {
      console.log(`🔧 Creating constraint for screw ${screw.id} on shape ${shape.id}`);
      console.log(`🔧 Constraint creation for ${shape.isComposite ? 'composite' : 'regular'} body:`);
      console.log(`  Shape.position: (${shape.position.x.toFixed(1)}, ${shape.position.y.toFixed(1)})`);
      console.log(`  Body.position: (${shape.body.position.x.toFixed(1)}, ${shape.body.position.y.toFixed(1)})`);
      console.log(`  Screw.position: (${screw.position.x.toFixed(1)}, ${screw.position.y.toFixed(1)})`);
      if (positionMismatch) {
        console.error(`❌ POSITION MISMATCH DETECTED for shape ${shape.id}: shape.position ≠ body.position`);
      }
    }
    
    // Use shared utilities to create constraint
    const constraintResult = ConstraintUtils.createSingleScrewConstraint(
      shape.body,
      screw
    );

    // Store the constraint and anchor body
    screw.setConstraint(constraintResult.constraint);
    screw.anchorBody = constraintResult.anchorBody;
    this.state.constraints.set(screw.id, constraintResult);

    // Emit physics body added event with unique source to avoid loop detection
    this.eventBus.emit({
      type: 'physics:body:added',
      timestamp: Date.now(),
      source: `${this.source}-${screw.id}`,
      bodyId: constraintResult.anchorBody.id.toString(),
      shape,
      body: constraintResult.anchorBody
    });

    // Emit constraint added event
    this.eventBus.emit({
      type: 'physics:constraint:added',
      timestamp: Date.now(),
      source: `${this.source}-${screw.id}`,
      constraintId: constraintResult.constraint.id?.toString() || screw.id,
      screw,
      constraint: constraintResult.constraint
    });
    
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`Constraint created for screw ${screw.id} on ${shape.isComposite ? 'composite' : 'regular'} body`);
    }
  }

  /**
   * Remove constraint and anchor body for a screw
   */
  public removeConstraintOnly(screwId: string): boolean {
    const screw = this.state.screws.get(screwId);
    if (!screw) return false;

    // Check if constraint already removed to prevent loops
    const constraintResult = this.state.constraints.get(screwId);
    const anchorBody = screw.anchorBody;
    
    // If no constraint or anchor body exists, already removed
    if (!constraintResult && !anchorBody) return false;
    
    if (constraintResult || anchorBody) {
      // Emit a single atomic removal event for both constraint and anchor body
      this.eventBus.emit({
        type: 'physics:screw:removed:immediate',
        timestamp: Date.now(),
        source: this.source,
        screwId: screwId,
        constraint: constraintResult?.constraint,
        anchorBody: constraintResult?.anchorBody || anchorBody,
        shape: this.state.allShapes.find(s => s.id === screw.shapeId)!
      });
      
      // Clear references immediately
      this.state.constraints.delete(screwId);
      screw.anchorBody = undefined;
      screw.removeConstraint();
    }

    // Check remaining screws for this shape after this one is removed
    const shape = this.state.allShapes.find(s => s.id === screw.shapeId);
    
    // Enhanced debugging for shape lookup issues
    if (!shape) {
      console.error(`⚠️ ScrewPhysicsService: Could not find shape ${screw.shapeId} for screw ${screwId}`);
      console.error(`Available shapes (${this.state.allShapes.length}):`, this.state.allShapes.map(s => s.id));
      console.error(`Screw details:`, { id: screw.id, shapeId: screw.shapeId, isCollected: screw.isCollected, isBeingCollected: screw.isBeingCollected });
      
      // Try to find if shape exists in any other collection or if there's an ID mismatch
      console.error(`State allShapes count: ${this.state.allShapes.length}`);
      console.error(`Looking for shape with ID: "${screw.shapeId}"`);
      console.error(`Available shape IDs: [${this.state.allShapes.map(s => `"${s.id}"`).join(', ')}]`);
      
      return false; // Early return if shape not found
    }
    
    const allShapeScrews = this.getScrewsForShape(screw.shapeId);
    // Count screws that are still constraining the shape
    const shapeScrews = allShapeScrews.filter(s => 
      !s.isCollected && !s.isBeingCollected && s.id !== screwId
    );
    
    if (DEBUG_CONFIG.logPhysicsStateChanges) {
      if (DEBUG_CONFIG.logShapeDebug && DEBUG_CONFIG.logScrewDebug) {
        console.log(`Shape ${shape.id}: Total screws=${allShapeScrews.length}, Constraining screws=${shapeScrews.length} after removing ${screwId}`);
      }
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`  Screws: ${allShapeScrews.map(s => `${s.id}(collected:${s.isCollected},collecting:${s.isBeingCollected})`).join(', ')}`);
      }
    }
    
    if (shapeScrews.length === 0) {
      // No screws left - make shape fully dynamic
      if (DEBUG_CONFIG.logPhysicsStateChanges && DEBUG_CONFIG.logScrewDebug) {
        console.log(`🔧 Shape ${shape.id} has no screws left - making fully dynamic`);
      }
      this.makeShapeDynamic(shape, screw);
    } else if (shapeScrews.length === 1) {
      // One screw left - make shape dynamic but keep it anchored
      if (DEBUG_CONFIG.logPhysicsStateChanges && DEBUG_CONFIG.logScrewDebug) {
        console.log(`🔧 Shape ${shape.id} has 1 screw left - making partially dynamic and updating constraints`);
      }
      this.makeShapePartiallyDynamic(shape);
      // Update constraints for the remaining single screw
      this.updateShapeConstraints(screw.shapeId);
    } else {
      // Multiple screws still attached - shape remains static
      if (DEBUG_CONFIG.logPhysicsStateChanges && DEBUG_CONFIG.logScrewDebug) {
        console.log(`🔧 Shape ${shape.id} still has ${shapeScrews.length} screws - remaining static`);
      }
    }

    return true;
  }

  /**
   * Update constraints when shape has only one screw remaining
   */
  public updateShapeConstraints(shapeId: string): void {
    const shapeScrews = this.getScrewsForShape(shapeId).filter(s => !s.isCollected && !s.isBeingCollected);

    if (shapeScrews.length === 1) {
      const remainingScrew = shapeScrews[0];
      const oldConstraint = this.state.constraints.get(remainingScrew.id);

      if (oldConstraint && oldConstraint.constraint) {
        // Emit constraint removed event
        this.eventBus.emit({
          type: 'physics:constraint:removed',
          timestamp: Date.now(),
          source: this.source,
          constraintId: oldConstraint.constraint.id?.toString() || remainingScrew.id,
          screw: remainingScrew
        });
        this.state.constraints.delete(remainingScrew.id);

        // Remove old anchor body
        const oldAnchorBody = remainingScrew.anchorBody;
        if (oldAnchorBody) {
          // Immediately remove anchor body from physics world
          this.eventBus.emit({
            type: 'physics:body:removed:immediate',
            timestamp: Date.now(),
            source: this.source,
            bodyId: oldAnchorBody.id.toString(),
            anchorBody: oldAnchorBody,
            shape: this.state.allShapes.find(s => s.id === shapeId)!
          });
        }

        const shapeBody = oldConstraint.constraint.bodyA;
        const shape = this.state.allShapes.find(s => s.id === shapeId);
        
        if (shapeBody && shape) {
          // CRITICAL: Ensure the shape position is synchronized for ALL shapes, not just composite
          shape.updateFromBody();
          if (DEBUG_CONFIG.logPhysicsDebug) {
            console.log(`🔧 Shape constraint recreation (${shape.isComposite ? 'composite' : 'regular'}):`);
            console.log(`  Shape.position: (${shape.position.x.toFixed(1)}, ${shape.position.y.toFixed(1)})`);
            console.log(`  Body.position: (${shapeBody.position.x.toFixed(1)}, ${shapeBody.position.y.toFixed(1)})`);
            console.log(`  Screw.position: (${remainingScrew.position.x.toFixed(1)}, ${remainingScrew.position.y.toFixed(1)})`);
          }
          
          // Use shared utilities to recreate constraint
          const newConstraintResult = ConstraintUtils.createSingleScrewConstraint(
            shapeBody,
            remainingScrew
          );
          
          if (DEBUG_CONFIG.logPhysicsDebug) {
            console.log(`🔧 Recreated constraint for composite body`);
          }
          
          // Update screw references
          remainingScrew.setConstraint(newConstraintResult.constraint);
          remainingScrew.anchorBody = newConstraintResult.anchorBody;
          this.state.constraints.set(remainingScrew.id, newConstraintResult);
          
          // Emit physics body added event
          this.eventBus.emit({
            type: 'physics:body:added',
            timestamp: Date.now(),
            source: `${this.source}-${remainingScrew.id}-recreate`,
            bodyId: newConstraintResult.anchorBody.id.toString(),
            shape: this.state.allShapes.find(s => s.id === shapeId)!,
            body: newConstraintResult.anchorBody
          });
          
          // Emit constraint added event
          this.eventBus.emit({
            type: 'physics:constraint:added',
            timestamp: Date.now(),
            source: `${this.source}-${remainingScrew.id}-recreate`,
            constraintId: newConstraintResult.constraint.id?.toString() || remainingScrew.id,
            screw: remainingScrew,
            constraint: newConstraintResult.constraint
          });
        }
      }
    }
  }

  /**
   * Update screw positions based on their constraints
   */
  public updateScrewPositions(): void {
    for (const screw of this.state.screws.values()) {
      if (screw.isCollected || screw.isBeingCollected) continue;

      const anchorBody = screw.anchorBody;
      if (anchorBody) {
        // Use anchor body position directly - this is the most reliable method
        screw.position.x = anchorBody.position.x;
        screw.position.y = anchorBody.position.y;
      } else {
        const constraint = screw.constraint;
        if (constraint && constraint.bodyA) {
          const shapeBody = constraint.bodyA;
          const offsetX = constraint.pointA?.x || 0;
          const offsetY = constraint.pointA?.y || 0;

          // Transform local constraint coordinates to world coordinates
          const cos = Math.cos(shapeBody.angle);
          const sin = Math.sin(shapeBody.angle);

          // Apply rotation to the local offset and add to body position
          screw.position.x = shapeBody.position.x + (offsetX * cos - offsetY * sin);
          screw.position.y = shapeBody.position.y + (offsetX * sin + offsetY * cos);
          
          if (DEBUG_CONFIG.logPhysicsDebug) {
            console.log(`🔄 Updated screw ${screw.id} position: body=(${shapeBody.position.x.toFixed(1)}, ${shapeBody.position.y.toFixed(1)}), angle=${(shapeBody.angle * 180 / Math.PI).toFixed(1)}°, offset=(${offsetX.toFixed(1)}, ${offsetY.toFixed(1)}), final=(${screw.position.x.toFixed(1)}, ${screw.position.y.toFixed(1)})`);
          }
        }
      }
    }
    
    // Debug logging for single-screw composite bodies
    if (DEBUG_CONFIG.logPhysicsDebug) {
      for (const shape of this.state.allShapes) {
        const shapeScrews = this.getScrewsForShape(shape.id).filter(s => !s.isCollected && !s.isBeingCollected);
        if (shapeScrews.length === 1 && shape.isComposite && shape.body && !shape.body.isStatic) {
          const screw = shapeScrews[0];
          const constraint = this.state.constraints.get(screw.id);
          if (constraint) {
            const distance = Math.sqrt(
              Math.pow(screw.position.x - shape.body.position.x, 2) +
              Math.pow(screw.position.y - shape.body.position.y, 2)
            );
            console.log(`🔄 Composite ${shape.id}: body=(${shape.body.position.x.toFixed(1)}, ${shape.body.position.y.toFixed(1)}), angle=${(shape.body.angle * 180 / Math.PI).toFixed(1)}°, screw=(${screw.position.x.toFixed(1)}, ${screw.position.y.toFixed(1)}), distance=${distance.toFixed(1)}`);
          }
        }
      }
    }
  }

  private getScrewsForShape(shapeId: string): Screw[] {
    return Array.from(this.state.screws.values()).filter(
      screw => screw.shapeId === shapeId
    );
  }

  private makeShapeDynamic(shape: Shape, lastScrew: Screw): void {
    // IMPORTANT: Capture velocities BEFORE changing static state
    const capturedVelocity = { ...shape.body.velocity };
    const capturedAngularVelocity = shape.body.angularVelocity;
    
    if (DEBUG_CONFIG.logPhysicsStateChanges) {
      console.log(`🔧 Shape ${shape.id} BEFORE: isStatic=${shape.body.isStatic}, isSleeping=${shape.body.isSleeping}, velocity=(${capturedVelocity.x.toFixed(2)}, ${capturedVelocity.y.toFixed(2)}), angularVel=${capturedAngularVelocity.toFixed(3)}, position=(${shape.body.position.x.toFixed(1)}, ${shape.body.position.y.toFixed(1)})`);
      if (shape.isComposite) {
        console.log(`🔧 COMPOSITE BODY - parts: ${shape.body.parts.length}, type: ${shape.body.type}`);
      }
    }
    
    Body.setStatic(shape.body, false);
    Sleeping.set(shape.body, false);
    
    // CRITICAL: Synchronize shape position with physics body after state change
    if (DEBUG_CONFIG.logPhysicsStateChanges) {
      console.log(`🔧 Shape ${shape.id} BEFORE updateFromBody: shape.position=(${shape.position.x.toFixed(1)}, ${shape.position.y.toFixed(1)}), body.position=(${shape.body.position.x.toFixed(1)}, ${shape.body.position.y.toFixed(1)})`);
    }
    shape.updateFromBody();
    if (DEBUG_CONFIG.logPhysicsStateChanges) {
      console.log(`🔧 Shape ${shape.id} AFTER updateFromBody: shape.position=(${shape.position.x.toFixed(1)}, ${shape.position.y.toFixed(1)}), body.position=(${shape.body.position.x.toFixed(1)}, ${shape.body.position.y.toFixed(1)})`);
    }
    
    if (DEBUG_CONFIG.logPhysicsStateChanges && shape.isComposite) {
      console.log(`🔧 Shape ${shape.id} AFTER setStatic(false): position=(${shape.body.position.x.toFixed(1)}, ${shape.body.position.y.toFixed(1)})`);
    }
    
    // Calculate linear velocity from the pivot point (last screw position)
    let linearVelocity = shape.body.velocity;
    
    if (Math.abs(capturedAngularVelocity) > 0.01 && lastScrew.position) {
      // Calculate the radius from pivot to center of mass
      const dx = shape.body.position.x - lastScrew.position.x;
      const dy = shape.body.position.y - lastScrew.position.y;
      
      // Linear velocity from rotation: v = ω × r
      const rotationalVelocityX = -capturedAngularVelocity * dy;
      const rotationalVelocityY = capturedAngularVelocity * dx;
      
      linearVelocity = {
        x: rotationalVelocityX,
        y: rotationalVelocityY
      };
      
      if (DEBUG_CONFIG.logPhysicsStateChanges && DEBUG_CONFIG.logScrewDebug) {
        console.log(`🔧 Calculated linear velocity from rotation: pivot=(${lastScrew.position.x.toFixed(1)}, ${lastScrew.position.y.toFixed(1)}), radius=(${dx.toFixed(1)}, ${dy.toFixed(1)}), velocity=(${linearVelocity.x.toFixed(2)}, ${linearVelocity.y.toFixed(2)})`);
      }
    }
    
    // Apply preserved velocities
    Body.setVelocity(shape.body, linearVelocity);
    Body.setAngularVelocity(shape.body, capturedAngularVelocity);
    
    // Shape physics state changed - now fully dynamic
    if (DEBUG_CONFIG.logPhysicsDebug) {
      console.log(`Shape ${shape.id} made fully dynamic - no screws left`);
    }
  }

  private makeShapePartiallyDynamic(shape: Shape): void {
    if (DEBUG_CONFIG.logPhysicsStateChanges && DEBUG_CONFIG.logScrewDebug) {
      console.log(`🔧 Shape ${shape.id} BEFORE makePartiallyDynamic: isStatic=${shape.body.isStatic}, isSleeping=${shape.body.isSleeping}, velocity=(${shape.body.velocity.x.toFixed(3)}, ${shape.body.velocity.y.toFixed(3)}), angularVel=${shape.body.angularVelocity.toFixed(3)}`);
    }
    
    if (shape.body.isStatic) {
      Body.setStatic(shape.body, false);
      Sleeping.set(shape.body, false);
      
      // CRITICAL: Synchronize shape position with physics body after state change
      shape.updateFromBody();
      
      // Small nudge to ensure physics activation (not too large to avoid continuous rotation)
      const nudgeDirection = Math.random() > 0.5 ? 1 : -1;
      const nudgeAmount = 0.005; // Reduced from 0.02 to prevent excessive rotation
      Body.setAngularVelocity(shape.body, nudgeDirection * nudgeAmount);
      
      if (DEBUG_CONFIG.logPhysicsStateChanges && DEBUG_CONFIG.logScrewDebug) {
        console.log(`🔧 Shape ${shape.id} AFTER makePartiallyDynamic: isStatic=${shape.body.isStatic}, isSleeping=${shape.body.isSleeping}, velocity=(${shape.body.velocity.x.toFixed(3)}, ${shape.body.velocity.y.toFixed(3)}), angularVel=${shape.body.angularVelocity.toFixed(3)}`);
      }
    } else {
      if (DEBUG_CONFIG.logPhysicsStateChanges && DEBUG_CONFIG.logScrewDebug) {
        console.log(`🔧 Shape ${shape.id} was already dynamic - no change needed`);
      }
    }
  }
}