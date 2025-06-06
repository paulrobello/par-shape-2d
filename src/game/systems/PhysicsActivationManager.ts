/**
 * Physics Activation Manager
 * Manages selective physics activation for visible layers while keeping others dormant
 */

import { BaseSystem } from '../core/BaseSystem';
import { 
  PrecomputedLayer, 
  PrecomputedShape
} from '../../types/precomputed';
import { Body, Constraint } from 'matter-js';
import { PhysicsBodyFactory } from '../../shared/physics/PhysicsBodyFactory';
import { ConstraintUtils } from '../../shared/physics/ConstraintUtils';
import { Shape } from '../entities/Shape';
import { Screw } from '../entities/Screw';
import { ShapeType, ScrewColor } from '../../types/game';
import { PHYSICS_CONSTANTS } from '../../shared/utils/Constants';
import { ShapeDefinition } from '../../types/shapes';

/**
 * Manages physics activation and deactivation for performance optimization
 */
export class PhysicsActivationManager extends BaseSystem {
  private activeLayerIndices = new Set<number>();
  private dormantLayers = new Map<number, PrecomputedLayer>();
  private activeBodies = new Map<string, Body>();
  private activeConstraints = new Map<string, Constraint>();
  private activeShapes = new Map<string, Shape>();
  private activeScrews = new Map<string, Screw>();
  
  constructor() {
    super('PhysicsActivationManager');
    this.setupEventHandlers();
  }

  async onInitialize(): Promise<void> {
    this.emit({
      type: 'system:ready',
      timestamp: Date.now()
    });
  }


  /**
   * Set up event handlers for physics activation requests
   */
  private setupEventHandlers(): void {
    this.subscribe('physics:activation:requested', (event: import('../events/EventTypes').PhysicsActivationRequestedEvent) => {
      this.activateLayerPhysics(event.layerIndex);
    });

    this.subscribe('layer:visibility:changed', (event: import('../events/EventTypes').LayerVisibilityChangedEvent) => {
      if (event.visible) {
        this.activateLayerPhysics(event.layer.index);
      } else {
        this.deactivateLayerPhysics(event.layer.index);
      }
    });

    this.subscribe('level:precomputed', (event: import('../events/EventTypes').LevelPrecomputedEvent) => {
      this.setDormantLayers(event.levelData.layers);
    });
  }

  /**
   * Set dormant layers from pre-computed level data
   */
  setDormantLayers(layers: PrecomputedLayer[]): void {
    this.dormantLayers.clear();
    this.activeLayerIndices.clear();
    this.activeBodies.clear();
    this.activeConstraints.clear();

    layers.forEach(layer => {
      this.dormantLayers.set(layer.index, layer);
    });

    this.emit({
      type: 'physics:dormant:layers:set',
      timestamp: Date.now(),
      layerCount: layers.length,
      totalShapes: layers.reduce((sum, layer) => sum + layer.shapes.length, 0),
      totalScrews: layers.reduce((sum, layer) => sum + layer.screwCount, 0)
    });
  }

  /**
   * Activate physics for a specific layer
   */
  activateLayerPhysics(layerIndex: number): void {
    if (this.activeLayerIndices.has(layerIndex)) {
      // Already active
      return;
    }

    const layer = this.dormantLayers.get(layerIndex);
    if (!layer) {
      console.warn(`[PhysicsActivationManager] Layer ${layerIndex} not found in dormant layers`);
      return;
    }

    try {
      // Create physics bodies for all shapes in the layer
      const createdBodies = this.createPhysicsBodiesFromData(layer.shapes);
      
      // Create constraints for all screws in the layer
      const createdConstraints = this.createConstraintsForScrews(layer);

      // Mark layer as active
      this.activeLayerIndices.add(layerIndex);
      layer.isPhysicsActive = true;

      this.emit({
        type: 'layer:physics:activated',
        timestamp: Date.now(),
        layerIndex,
        shapesActivated: createdBodies.length,
        constraintsCreated: createdConstraints.length
      });

      console.log(`[PhysicsActivationManager] Activated physics for layer ${layerIndex}: ${createdBodies.length} bodies, ${createdConstraints.length} constraints`);

    } catch (error) {
      console.error(`[PhysicsActivationManager] Failed to activate layer ${layerIndex}:`, error);
      this.emit({
        type: 'physics:activation:error',
        timestamp: Date.now(),
        layerIndex,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Deactivate physics for a specific layer
   */
  deactivateLayerPhysics(layerIndex: number): void {
    if (!this.activeLayerIndices.has(layerIndex)) {
      // Already inactive
      return;
    }

    const layer = this.dormantLayers.get(layerIndex);
    if (!layer) {
      console.warn(`[PhysicsActivationManager] Layer ${layerIndex} not found`);
      return;
    }

    try {
      // Remove all constraints for this layer
      const constraintsRemoved = this.removeConstraintsForLayer(layerIndex);
      
      // Remove all physics bodies for this layer
      const bodiesRemoved = this.removeBodiesForLayer(layerIndex);

      // Mark layer as inactive
      this.activeLayerIndices.delete(layerIndex);
      layer.isPhysicsActive = false;

      this.emit({
        type: 'layer:physics:deactivated',
        timestamp: Date.now(),
        layerIndex,
        shapesDeactivated: bodiesRemoved,
        constraintsRemoved
      });

      console.log(`[PhysicsActivationManager] Deactivated physics for layer ${layerIndex}: ${bodiesRemoved} bodies, ${constraintsRemoved} constraints removed`);

    } catch (error) {
      console.error(`[PhysicsActivationManager] Failed to deactivate layer ${layerIndex}:`, error);
    }
  }

  /**
   * Helper method to determine ShapeType from definition
   */
  private getShapeTypeFromDefinition(definition: ShapeDefinition): ShapeType {
    // Check physics type first for most accurate determination
    const physicsType = definition.physics?.type;
    
    if (physicsType === 'circle') return 'circle';
    if (physicsType === 'composite') return 'capsule';
    
    // For path-based shapes (fromVertices), determine specific type
    if (physicsType === 'fromVertices' || definition.category === 'path') {
      if (definition.id === 'arrow' || definition.id.includes('arrow')) return 'arrow';
      if (definition.id === 'chevron' || definition.id.includes('chevron')) return 'chevron';
      if (definition.id === 'star' || definition.id.includes('star')) return 'star';
      if (definition.id === 'horseshoe' || definition.id.includes('horseshoe')) return 'horseshoe';
      // Default path shape to star
      return 'star';
    }
    
    // For polygon types, check the sides
    if (physicsType === 'polygon' && definition.dimensions?.sides) {
      return 'polygon';
    }
    
    // Check category for additional hints
    if (definition.category === 'composite') return 'capsule';
    
    // Default fallback based on id
    if (definition.id === 'circle') return 'circle';
    if (definition.id === 'capsule') return 'capsule';
    if (definition.id === 'rectangle') return 'rectangle';
    
    // Check if it has sides defined (polygon)
    if (definition.dimensions?.sides) return 'polygon';
    
    // Default to polygon for unknown types
    return 'polygon';
  }

  /**
   * Create physics bodies from pre-computed shape data
   */
  createPhysicsBodiesFromData(shapes: PrecomputedShape[]): Body[] {
    const createdBodies: Body[] = [];

    shapes.forEach(shape => {
      try {
        // Determine shape type from definition
        const shapeType = this.getShapeTypeFromDefinition(shape.definition);
        
        // Create physics body using the factory
        const bodyResult = PhysicsBodyFactory.createShapeBodyFromDefinition(
          shape.definition.physics.type,
          shape.position,
          {
            radius: shape.dimensions.radius as number | undefined,
            width: shape.dimensions.width as number | undefined,
            height: shape.dimensions.height as number | undefined,
          },
          {
            isStatic: shape.physicsData?.options?.isStatic ?? false,
            density: shape.physicsData?.options?.density,
            friction: shape.physicsData?.options?.friction,
            frictionAir: shape.physicsData?.options?.frictionAir,
            restitution: shape.physicsData?.options?.restitution,
            collisionFilter: shape.physicsData?.collisionFilter,
            render: shape.physicsData?.render,
          }
        );

        const { body, parts } = bodyResult;

        // Set additional properties from serialized data
        if (shape.physicsData) {
          Body.setAngle(body, shape.physicsData.angle);
          Body.setVelocity(body, shape.physicsData.velocity);
          Body.setAngularVelocity(body, shape.physicsData.angularVelocity);
        }

        // Create Shape entity
        const shapeEntity = new Shape(
          shape.id,
          shapeType,
          shape.position,
          body,
          `layer-${shape.screws[0]?.layerIndex ?? 0}`, // Get layer from screw data
          shape.visual.color,
          shape.visual.tint,
          shape.definition.id,
          {
            width: shape.dimensions.width as number | undefined,
            height: shape.dimensions.height as number | undefined,
            radius: shape.dimensions.radius as number | undefined,
            sides: shape.dimensions.sides as number | undefined,
            vertices: shape.dimensions.vertices as { x: number; y: number }[] | undefined,
          },
          parts ? { isComposite: true, parts } : undefined
        );

        // Store references
        this.activeBodies.set(shape.id, body);
        this.activeShapes.set(shape.id, shapeEntity);
        createdBodies.push(body);

        // Emit event for physics world to add the body
        this.emit({
          type: 'physics:body:added',
          timestamp: Date.now(),
          bodyId: shape.id,
          shape: shapeEntity,
          body: body
        });

      } catch (error) {
        console.error(`[PhysicsActivationManager] Failed to create body for shape ${shape.id}:`, error);
      }
    });

    return createdBodies;
  }

  /**
   * Create constraints for all screws in a layer
   */
  createConstraintsForScrews(layer: PrecomputedLayer): Constraint[] {
    const createdConstraints: Constraint[] = [];

    layer.shapes.forEach(shape => {
      const shapeBody = this.activeBodies.get(shape.id);
      const shapeEntity = this.activeShapes.get(shape.id);
      
      if (!shapeBody || !shapeEntity) {
        console.warn(`[PhysicsActivationManager] No body or entity found for shape ${shape.id}`);
        return;
      }

      shape.screws.forEach(precomputedScrew => {
        try {
          // Create Screw entity
          const screwEntity = new Screw(
            precomputedScrew.id,
            precomputedScrew.shapeId,
            precomputedScrew.position,
            precomputedScrew.color as ScrewColor
          );

          // Use ConstraintUtils to create constraint and anchor body
          const constraintResult = ConstraintUtils.createSingleScrewConstraint(
            shapeBody,
            screwEntity,
            {
              stiffness: PHYSICS_CONSTANTS.constraint.stiffness,
              damping: PHYSICS_CONSTANTS.constraint.damping,
            }
          );

          const { constraint, anchorBody } = constraintResult;

          // Update screw entity with constraint
          screwEntity.setConstraint(constraint);
          screwEntity.anchorBody = anchorBody;

          // Add screw to shape
          shapeEntity.addScrew(screwEntity);

          // Store references
          this.activeBodies.set(`anchor_${precomputedScrew.id}`, anchorBody);
          this.activeConstraints.set(precomputedScrew.id, constraint);
          this.activeScrews.set(precomputedScrew.id, screwEntity);
          createdConstraints.push(constraint);

          // Emit event for physics world to add the anchor body
          this.emit({
            type: 'physics:body:added',
            timestamp: Date.now(),
            bodyId: `anchor_${precomputedScrew.id}`,
            shape: shapeEntity,
            body: anchorBody
          });

          // Emit event for physics world to add the constraint
          this.emit({
            type: 'physics:constraint:added',
            timestamp: Date.now(),
            constraintId: precomputedScrew.id,
            screw: screwEntity,
            constraint: constraint
          });

        } catch (error) {
          console.error(`[PhysicsActivationManager] Failed to create constraint for screw ${precomputedScrew.id}:`, error);
        }
      });
    });

    return createdConstraints;
  }

  /**
   * Remove constraints for a specific layer
   */
  private removeConstraintsForLayer(layerIndex: number): number {
    const layer = this.dormantLayers.get(layerIndex);
    if (!layer) return 0;

    let constraintsRemoved = 0;

    layer.shapes.forEach(shape => {
      const shapeEntity = this.activeShapes.get(shape.id);
      
      shape.screws.forEach(screw => {
        const constraint = this.activeConstraints.get(screw.id);
        const anchorBody = this.activeBodies.get(`anchor_${screw.id}`);
        const screwEntity = this.activeScrews.get(screw.id);

        if (constraint && screwEntity) {
          // Emit removal event for constraint
          this.emit({
            type: 'physics:constraint:removed',
            timestamp: Date.now(),
            constraintId: screw.id,
            screw: screwEntity
          });

          this.activeConstraints.delete(screw.id);
          constraintsRemoved++;
        }

        if (anchorBody && shapeEntity) {
          // Emit anchor body removal using immediate removal event
          this.emit({
            type: 'physics:body:removed:immediate',
            timestamp: Date.now(),
            bodyId: `anchor_${screw.id}`,
            anchorBody: anchorBody,
            shape: shapeEntity
          });

          this.activeBodies.delete(`anchor_${screw.id}`);
        }

        // Clean up screw entity
        if (screwEntity) {
          this.activeScrews.delete(screw.id);
        }
      });
    });

    return constraintsRemoved;
  }

  /**
   * Remove physics bodies for a specific layer
   */
  private removeBodiesForLayer(layerIndex: number): number {
    const layer = this.dormantLayers.get(layerIndex);
    if (!layer) return 0;

    let bodiesRemoved = 0;

    layer.shapes.forEach(shape => {
      const body = this.activeBodies.get(shape.id);
      const shapeEntity = this.activeShapes.get(shape.id);
      
      if (body && shapeEntity) {
        // Emit removal event for shape body
        this.emit({
          type: 'physics:body:removed',
          timestamp: Date.now(),
          bodyId: shape.id,
          shape: shapeEntity
        });

        this.activeBodies.delete(shape.id);
        this.activeShapes.delete(shape.id);
        bodiesRemoved++;
      }
    });

    return bodiesRemoved;
  }

  /**
   * Get active layer indices
   */
  getActiveLayerIndices(): number[] {
    return Array.from(this.activeLayerIndices);
  }

  /**
   * Check if a layer is active
   */
  isLayerActive(layerIndex: number): boolean {
    return this.activeLayerIndices.has(layerIndex);
  }

  /**
   * Get physics body for a shape
   */
  getShapeBody(shapeId: string): Body | null {
    return this.activeBodies.get(shapeId) || null;
  }

  /**
   * Get constraint for a screw
   */
  getScrewConstraint(screwId: string): Constraint | null {
    return this.activeConstraints.get(screwId) || null;
  }

  /**
   * Get statistics about physics activation
   */
  getActivationStats(): {
    activeLayers: number;
    dormantLayers: number;
    activeBodies: number;
    activeConstraints: number;
  } {
    return {
      activeLayers: this.activeLayerIndices.size,
      dormantLayers: this.dormantLayers.size - this.activeLayerIndices.size,
      activeBodies: this.activeBodies.size,
      activeConstraints: this.activeConstraints.size
    };
  }

  /**
   * Activate physics for multiple layers at once
   */
  activateMultipleLayers(layerIndices: number[]): void {
    layerIndices.forEach(index => {
      this.activateLayerPhysics(index);
    });
  }

  /**
   * Deactivate physics for multiple layers at once
   */
  deactivateMultipleLayers(layerIndices: number[]): void {
    layerIndices.forEach(index => {
      this.deactivateLayerPhysics(index);
    });
  }

  /**
   * Update dormant layer data (for save/load scenarios)
   */
  updateDormantLayerData(layerIndex: number, layer: PrecomputedLayer): void {
    this.dormantLayers.set(layerIndex, layer);
  }

  /**
   * Cleanup all physics objects
   */
  cleanup(): void {
    // Deactivate all active layers
    const activeIndices = Array.from(this.activeLayerIndices);
    activeIndices.forEach(index => {
      this.deactivateLayerPhysics(index);
    });

    // Clear all data
    this.dormantLayers.clear();
    this.activeLayerIndices.clear();
    this.activeBodies.clear();
    this.activeConstraints.clear();
    this.activeShapes.clear();
    this.activeScrews.clear();

    this.emit({
      type: 'physics:activation:cleanup:completed',
      timestamp: Date.now()
    });
  }
}