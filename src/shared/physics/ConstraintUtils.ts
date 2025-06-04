/**
 * ConstraintUtils - Shared utilities for constraint management
 * Provides helper functions for creating and managing physics constraints
 */

import { Body, Constraint, Composite, World } from 'matter-js';
import { Screw } from '@/game/entities/Screw';
import { PhysicsBodyFactory, ConstraintOptions } from './PhysicsBodyFactory';
import { DEBUG_CONFIG } from '@/shared/utils/Constants';

export interface ScrewConstraintResult {
  constraint: Constraint;
  anchorBody: Body;
}

/**
 * Utilities for managing physics constraints
 */
export class ConstraintUtils {
  /**
   * Create constraints for all screws on a shape
   */
  static createScrewConstraints(
    shapeBody: Body,
    screws: Screw[],
    options: ConstraintOptions = {}
  ): ScrewConstraintResult[] {
    const results: ScrewConstraintResult[] = [];

    for (const screw of screws) {
      const result = this.createSingleScrewConstraint(shapeBody, screw, options);
      results.push(result);
    }

    if (DEBUG_CONFIG.logPhysicsDebug) {
      console.log(`Created ${results.length} screw constraints for shape`);
    }

    return results;
  }

  /**
   * Create a single screw constraint
   */
  static createSingleScrewConstraint(
    shapeBody: Body,
    screw: Screw,
    options: ConstraintOptions = {}
  ): ScrewConstraintResult {
    if (DEBUG_CONFIG.logPhysicsDebug) {
      console.log(`Creating constraint for screw ${screw.id}`);
    }

    // Create anchor body
    const anchorBody = PhysicsBodyFactory.createScrewAnchorBody(screw);

    // Create constraint
    const constraint = PhysicsBodyFactory.createScrewConstraint(
      shapeBody,
      anchorBody,
      screw.position,
      options
    );

    return { constraint, anchorBody };
  }

  /**
   * Remove constraints and their anchor bodies from the world
   */
  static removeConstraints(
    world: World,
    constraints: ScrewConstraintResult[]
  ): void {
    const constraintBodies = constraints.map(c => c.constraint);
    const anchorBodies = constraints.map(c => c.anchorBody);

    // Remove constraints first
    if (constraintBodies.length > 0) {
      Composite.remove(world, constraintBodies);
    }

    // Then remove anchor bodies
    if (anchorBodies.length > 0) {
      Composite.remove(world, anchorBodies);
    }

    if (DEBUG_CONFIG.logPhysicsDebug) {
      console.log(`Removed ${constraints.length} constraints and anchor bodies`);
    }
  }

  /**
   * Find constraint by screw ID
   */
  static findConstraintByScrewId(
    constraints: Map<string, ScrewConstraintResult>,
    screwId: string
  ): ScrewConstraintResult | undefined {
    return constraints.get(screwId);
  }

  /**
   * Update constraint properties
   */
  static updateConstraint(
    constraint: Constraint,
    properties: Partial<{
      stiffness: number;
      damping: number;
      length: number;
    }>
  ): void {
    if (properties.stiffness !== undefined) {
      constraint.stiffness = properties.stiffness;
    }
    if (properties.damping !== undefined) {
      constraint.damping = properties.damping;
    }
    if (properties.length !== undefined) {
      constraint.length = properties.length;
    }
  }

  /**
   * Check if a body is part of any constraint
   */
  static isBodyConstrained(body: Body, world: World): boolean {
    const allConstraints = Composite.allConstraints(world);
    return allConstraints.some(
      constraint => constraint.bodyA === body || constraint.bodyB === body
    );
  }

  /**
   * Get all constraints for a specific body
   */
  static getBodyConstraints(body: Body, world: World): Constraint[] {
    const allConstraints = Composite.allConstraints(world);
    return allConstraints.filter(
      constraint => constraint.bodyA === body || constraint.bodyB === body
    );
  }

  /**
   * Calculate total constraint force on a body
   */
  static calculateTotalConstraintForce(body: Body, world: World): number {
    const constraints = this.getBodyConstraints(body, world);
    let totalForce = 0;

    for (const constraint of constraints) {
      // Simple approximation of constraint force based on stiffness and length difference
      if (constraint.bodyB && constraint.bodyA) {
        const currentLength = Math.sqrt(
          Math.pow(constraint.bodyB.position.x - constraint.bodyA.position.x, 2) +
          Math.pow(constraint.bodyB.position.y - constraint.bodyA.position.y, 2)
        );
        const lengthDiff = Math.abs(currentLength - constraint.length);
        totalForce += lengthDiff * constraint.stiffness;
      }
    }

    return totalForce;
  }
}