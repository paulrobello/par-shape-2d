/**
 * PhysicsBodyFactory - Consolidated physics body creation for game and editor
 * Provides a single source of truth for creating Matter.js bodies
 */

import { Bodies, Body, Constraint, IBodyDefinition } from 'matter-js';
import { Vector2 } from '@/types/game';
import { Shape } from '@/game/entities/Shape';
import { Screw } from '@/game/entities/Screw';
import { PHYSICS_CONSTANTS, DEBUG_CONFIG } from '@/shared/utils/Constants';

export interface BodyOptions {
  isStatic?: boolean;
  density?: number;
  friction?: number;
  frictionAir?: number;
  restitution?: number;
  isSensor?: boolean;
  collisionFilter?: {
    group?: number;
    category?: number;
    mask?: number;
  };
  render?: {
    visible?: boolean;
    fillStyle?: string;
    strokeStyle?: string;
    lineWidth?: number;
  };
}

export interface ConstraintOptions {
  stiffness?: number;
  damping?: number;
  length?: number;
  render?: {
    visible?: boolean;
    strokeStyle?: string;
    lineWidth?: number;
  };
}

export interface ShapeBodyResult {
  body: Body;
  parts?: Body[];
}

/**
 * Factory for creating physics bodies with consistent properties
 */
export class PhysicsBodyFactory {
  /**
   * Create a physics body for a shape entity
   */
  static createShapeBody(shape: Shape, options: BodyOptions = {}): ShapeBodyResult {
    const defaultOptions: IBodyDefinition = {
      isStatic: options.isStatic ?? false,
      density: options.density ?? PHYSICS_CONSTANTS.shape.density,
      friction: options.friction ?? PHYSICS_CONSTANTS.shape.friction,
      frictionAir: options.frictionAir ?? PHYSICS_CONSTANTS.shape.frictionAir,
      restitution: options.restitution ?? PHYSICS_CONSTANTS.shape.restitution,
      render: options.render ?? {
        visible: true,
        fillStyle: '#007bff',
        strokeStyle: '#0056b3',
        lineWidth: 1,
      },
      collisionFilter: options.collisionFilter ?? {
        group: 0,
        category: 0x0001,
        mask: 0xFFFFFFFF,
      },
    };

    switch (shape.type) {
      case 'circle':
        return {
          body: Bodies.circle(
            shape.position.x,
            shape.position.y,
            shape.radius || 50,
            defaultOptions
          ),
        };

      case 'rectangle':
        return {
          body: Bodies.rectangle(
            shape.position.x,
            shape.position.y,
            shape.width || 100,
            shape.height || 100,
            defaultOptions
          ),
        };

      case 'capsule':
        return this.createCapsuleBody(shape, defaultOptions);

      default:
        // Default to rectangle for unknown types
        return {
          body: Bodies.rectangle(
            shape.position.x,
            shape.position.y,
            shape.width || 100,
            shape.height || 100,
            defaultOptions
          ),
        };
    }
  }

  /**
   * Create a capsule body (composite of rectangle + 2 circles)
   */
  private static createCapsuleBody(shape: Shape, options: IBodyDefinition): ShapeBodyResult {
    const width = shape.width || 120;
    const height = shape.height || 50;
    const radius = height / 2;
    const rectWidth = width - height;

    // Create the three parts
    const rectangle = Bodies.rectangle(
      shape.position.x,
      shape.position.y,
      rectWidth,
      height,
      options
    );

    const leftCircle = Bodies.circle(
      shape.position.x - rectWidth / 2,
      shape.position.y,
      radius,
      options
    );

    const rightCircle = Bodies.circle(
      shape.position.x + rectWidth / 2,
      shape.position.y,
      radius,
      options
    );

    // Create composite body
    const compositeBody = Body.create({
      parts: [rectangle, leftCircle, rightCircle],
      isStatic: options.isStatic,
      density: options.density,
      friction: options.friction,
      frictionAir: options.frictionAir,
      restitution: options.restitution,
      render: options.render,
      collisionFilter: options.collisionFilter,
    });

    Body.setPosition(compositeBody, shape.position);

    return {
      body: compositeBody,
      parts: [rectangle, leftCircle, rightCircle],
    };
  }

  /**
   * Create a physics body from a shape definition (for editor use)
   */
  static createShapeBodyFromDefinition(
    type: string,
    position: Vector2,
    dimensions: { radius?: number; width?: number; height?: number },
    options: BodyOptions = {}
  ): ShapeBodyResult {
    const defaultOptions: IBodyDefinition = {
      isStatic: options.isStatic ?? false,
      density: options.density ?? PHYSICS_CONSTANTS.shape.density,
      friction: options.friction ?? PHYSICS_CONSTANTS.shape.friction,
      frictionAir: options.frictionAir ?? PHYSICS_CONSTANTS.shape.frictionAir,
      restitution: options.restitution ?? PHYSICS_CONSTANTS.shape.restitution,
      render: options.render ?? {
        visible: true,
        fillStyle: '#007bff',
        strokeStyle: '#0056b3',
        lineWidth: 1,
      },
      collisionFilter: options.collisionFilter ?? {
        group: 0,
        category: 0x0001,
        mask: 0xFFFFFFFF,
      },
    };

    switch (type) {
      case 'circle':
        return {
          body: Bodies.circle(
            position.x,
            position.y,
            dimensions.radius || 50,
            defaultOptions
          ),
        };

      case 'rectangle':
        return {
          body: Bodies.rectangle(
            position.x,
            position.y,
            dimensions.width || 100,
            dimensions.height || 100,
            defaultOptions
          ),
        };

      case 'capsule': {
        const width = dimensions.width || 120;
        const height = dimensions.height || 50;
        const radius = height / 2;
        const rectWidth = width - height;

        const rectangle = Bodies.rectangle(
          position.x,
          position.y,
          rectWidth,
          height,
          defaultOptions
        );

        const leftCircle = Bodies.circle(
          position.x - rectWidth / 2,
          position.y,
          radius,
          defaultOptions
        );

        const rightCircle = Bodies.circle(
          position.x + rectWidth / 2,
          position.y,
          radius,
          defaultOptions
        );

        const compositeBody = Body.create({
          parts: [rectangle, leftCircle, rightCircle],
          ...defaultOptions,
        });

        Body.setPosition(compositeBody, position);

        return {
          body: compositeBody,
          parts: [rectangle, leftCircle, rightCircle],
        };
      }

      default:
        return {
          body: Bodies.rectangle(
            position.x,
            position.y,
            dimensions.width || 100,
            dimensions.height || 100,
            defaultOptions
          ),
        };
    }
  }

  /**
   * Create an anchor body for a screw
   */
  static createScrewAnchorBody(screw: Screw, options: BodyOptions = {}): Body {
    return Bodies.circle(screw.position.x, screw.position.y, 1, {
      isStatic: true,
      isSensor: true,
      render: options.render ?? { 
        visible: false,
        fillStyle: 'transparent',
        strokeStyle: 'transparent',
        lineWidth: 0,
      },
      collisionFilter: options.collisionFilter ?? { group: -1, category: 0, mask: 0 },
    });
  }

  /**
   * Create a constraint between a shape body and screw anchor
   */
  static createScrewConstraint(
    shapeBody: Body,
    screwAnchor: Body,
    screwPosition: Vector2,
    options: ConstraintOptions = {}
  ): Constraint {
    // For composite bodies, we need to ensure we're using the actual center of mass
    // Matter.js composite bodies have their position at the calculated center of mass
    const bodyPosition = shapeBody.position;
    
    // Calculate offset from physics body center to screw position in world coordinates
    const worldOffsetX = screwPosition.x - bodyPosition.x;
    const worldOffsetY = screwPosition.y - bodyPosition.y;
    
    // Convert world offset to body's local coordinates
    // This accounts for the body's current rotation
    const angle = shapeBody.angle;
    const cos = Math.cos(-angle);
    const sin = Math.sin(-angle);
    
    // Rotate the offset by the negative angle to get local coordinates
    const localOffsetX = worldOffsetX * cos - worldOffsetY * sin;
    const localOffsetY = worldOffsetX * sin + worldOffsetY * cos;
    
    if (DEBUG_CONFIG.logPhysicsDebug) {
      console.log(`🔧 PhysicsBodyFactory.createScrewConstraint:`);
      console.log(`  Body position: (${bodyPosition.x.toFixed(1)}, ${bodyPosition.y.toFixed(1)})`);
      console.log(`  Body angle: ${(angle * 180 / Math.PI).toFixed(1)}°`);
      console.log(`  Screw position: (${screwPosition.x.toFixed(1)}, ${screwPosition.y.toFixed(1)})`);
      console.log(`  World offset: (${worldOffsetX.toFixed(1)}, ${worldOffsetY.toFixed(1)})`);
      console.log(`  Local offset: (${localOffsetX.toFixed(1)}, ${localOffsetY.toFixed(1)})`);
      console.log(`  Body isStatic: ${shapeBody.isStatic}`);
      console.log(`  Body type: ${shapeBody.type}`);
      if (shapeBody.parts && shapeBody.parts.length > 1) {
        console.log(`  Composite body with ${shapeBody.parts.length} parts`);
        // Log center of mass info
        const mass = shapeBody.mass;
        const inertia = shapeBody.inertia;
        console.log(`  Body mass: ${mass.toFixed(2)}, inertia: ${inertia.toFixed(2)}`);
      }
    }

    // For dynamic composite bodies, we need to ensure the constraint stiffness is appropriate
    // to prevent oscillation/orbiting behavior
    const constraintStiffness = (shapeBody.parts && shapeBody.parts.length > 1 && !shapeBody.isStatic) 
      ? 0.9  // Slightly lower stiffness for composite bodies to reduce oscillation
      : (options.stiffness ?? PHYSICS_CONSTANTS.constraint.stiffness);
    
    // Use standard damping for good movement speed
    const constraintDamping = options.damping ?? PHYSICS_CONSTANTS.constraint.damping;

    return Constraint.create({
      bodyA: shapeBody,
      bodyB: screwAnchor,
      pointA: { x: localOffsetX, y: localOffsetY },
      pointB: { x: 0, y: 0 },
      length: options.length ?? 0,
      stiffness: constraintStiffness,
      damping: constraintDamping,
      render: options.render ?? { 
        visible: false,
        strokeStyle: 'transparent',
        lineWidth: 0,
      },
    });
  }

  /**
   * Create a boundary wall (for physics world boundaries)
   */
  static createBoundaryWall(
    x: number,
    y: number,
    width: number,
    height: number,
    options: BodyOptions = {}
  ): Body {
    return Bodies.rectangle(x, y, width, height, {
      isStatic: true,
      render: options.render ?? { 
        visible: false,
        fillStyle: 'transparent',
        strokeStyle: 'transparent',
        lineWidth: 0,
      },
      collisionFilter: options.collisionFilter ?? { group: 0, category: 0, mask: 0 },
    });
  }
}