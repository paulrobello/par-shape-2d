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

/**
 * Manages physics activation and deactivation for performance optimization
 */
export class PhysicsActivationManager extends BaseSystem {
  private activeLayerIndices = new Set<number>();
  private dormantLayers = new Map<number, PrecomputedLayer>();
  private activeBodies = new Map<string, Body>();
  private activeConstraints = new Map<string, Constraint>();
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
   * Create physics bodies from pre-computed shape data
   */
  createPhysicsBodiesFromData(shapes: PrecomputedShape[]): Body[] {
    const createdBodies: Body[] = [];

    shapes.forEach(shape => {
      try {
        // TODO: Create physics body using the factory
        // This would need a proper Shape entity, not just data
        // For now, this is scaffolding code
        const body = null;

        if (body) {
          // Set additional properties from serialized data
          if (shape.physicsData) {
            Body.setAngle(body, shape.physicsData.angle);
            Body.setVelocity(body, shape.physicsData.velocity);
            Body.setAngularVelocity(body, shape.physicsData.angularVelocity);
          }

          // Store body reference
          this.activeBodies.set(shape.id, body);
          createdBodies.push(body);

          // TODO: Emit event for physics world to add the body
          // This would need a proper Shape entity
          // For now, this is scaffolding code
        }

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
      if (!shapeBody) {
        console.warn(`[PhysicsActivationManager] No body found for shape ${shape.id}`);
        return;
      }

      shape.screws.forEach(screw => {
        try {
          // TODO: Create anchor body for the screw
          // This would need a proper Screw entity, not just data
          // For now, this is scaffolding code
          const anchorBody = null;
          const constraint = null;

          if (constraint && anchorBody) {
            // Store references
            this.activeBodies.set(`anchor_${screw.id}`, anchorBody);
            this.activeConstraints.set(screw.id, constraint);
            createdConstraints.push(constraint);

            // TODO: Emit events for physics world
            // This would need proper Shape and Screw entities
            // For now, this is scaffolding code
          }

        } catch (error) {
          console.error(`[PhysicsActivationManager] Failed to create constraint for screw ${screw.id}:`, error);
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
      shape.screws.forEach(screw => {
        const constraint = this.activeConstraints.get(screw.id);
        const anchorBody = this.activeBodies.get(`anchor_${screw.id}`);

        if (constraint) {
          // TODO: Emit removal event
          // This would need proper event types
          this.activeConstraints.delete(screw.id);
          constraintsRemoved++;
        }

        if (anchorBody) {
          // TODO: Emit anchor body removal
          // This would need proper event types
          this.activeBodies.delete(`anchor_${screw.id}`);
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
      if (body) {
        // TODO: Emit removal event
        // This would need proper event types
        this.activeBodies.delete(shape.id);
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

    this.emit({
      type: 'physics:activation:cleanup:completed',
      timestamp: Date.now()
    });
  }
}