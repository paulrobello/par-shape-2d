/**
 * Event-driven LayerManager implementation
 * Manages layers independently through events, removing direct dependencies
 */

import { BaseSystem } from '../core/BaseSystem';
import { Layer } from '@/game/entities/Layer';
import { Shape } from '@/game/entities/Shape';
import { ShapeFactory } from '@/game/systems/ShapeFactory';
import { GAME_CONFIG, SHAPE_TINTS, LAYOUT_CONSTANTS, DEBUG_CONFIG, getTotalLayersForLevel } from '@/shared/utils/Constants';
import { ScrewColor } from '@/types/game';
import { randomIntBetween } from '@/game/utils/MathUtils';
// Removed precomputation imports - no longer using precomputation system
import {
  BoundsChangedEvent,
  LevelStartedEvent,
  SaveRequestedEvent,
  RestoreRequestedEvent,
  ContainerColorsUpdatedEvent,
  ShapeFellOffScreenEvent,
  ShapeScrewsReadyEvent
} from '../events/EventTypes';

interface LayerManagerState {
  layers: Layer[];
  layerCounter: number;
  physicsGroupCounter: number;
  colorCounter: number;
  totalLayersForLevel: number;
  layersGeneratedThisLevel: number;
  maxLayers: number;
  currentBounds: { x: number; y: number; width: number; height: number } | null;
  containerColors: string[];
  isRestoringFlag: boolean;
  shapesWithScrewsReady: Map<string, Set<string>>; // layerId -> Set of shapeIds that have screws ready
  layersWithScrewsReady: Set<string>; // Set of layerIds that have completed screw generation
  allLayersScrewsReadyEmitted: boolean; // Flag to prevent multiple emissions
  // Removed precomputation state - no longer using precomputation system
}

export class LayerManager extends BaseSystem {
  private state: LayerManagerState;

  constructor(maxLayers: number = 10) {
    super('LayerManager');
    
    this.state = {
      layers: [],
      layerCounter: 0,
      physicsGroupCounter: 0,
      colorCounter: 0,
      totalLayersForLevel: 10,
      layersGeneratedThisLevel: 0,
      maxLayers,
      currentBounds: null,
      containerColors: [],
      isRestoringFlag: false,
      shapesWithScrewsReady: new Map(),
      layersWithScrewsReady: new Set(),
      allLayersScrewsReadyEmitted: false,
      // Removed precomputation initialization - no longer using precomputation system
    };
  }

  protected async onInitialize(): Promise<void> {
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Level management events
    this.subscribe('level:started', this.handleLevelStarted.bind(this));
    this.subscribe('bounds:changed', this.handleBoundsChanged.bind(this));
    this.subscribe('container:colors:updated', this.handleContainerColorsUpdated.bind(this));
    
    // Shape events
    this.subscribe('shape:fell_off_screen', this.handleShapeFellOffScreen.bind(this));
    this.subscribe('shape:screws:ready', this.handleShapeScrewsReady.bind(this));
    
    // Save/restore events
    this.subscribe('save:requested', this.handleSaveRequested.bind(this));
    this.subscribe('restore:requested', this.handleRestoreRequested.bind(this));

    // Removed precomputation event handlers - no longer using precomputation system
  }

  // Event Handlers
  private handleLevelStarted(event: LevelStartedEvent): void {
    this.executeIfActive(() => {
      this.initializeLevel(event.level);
    });
  }

  private handleBoundsChanged(event: BoundsChangedEvent): void {
    this.executeIfActive(() => {
      // Define the shape area using layout constants
      const shapeAreaY = LAYOUT_CONSTANTS.shapeArea.startY;
      const shapeAreaHeight = event.height - shapeAreaY;
      
      // Constrain shapes to the dedicated shape area only
      this.state.currentBounds = {
        x: 0,
        y: shapeAreaY,
        width: event.width,
        height: shapeAreaHeight
      };
      
      if (DEBUG_CONFIG.logLayerDebug) {
        console.log(`LayerManager: Updated bounds to shape area: (${this.state.currentBounds.x}, ${this.state.currentBounds.y}, ${this.state.currentBounds.width}, ${this.state.currentBounds.height})`);
      }
      
      // Update bounds for all existing layers
      this.state.layers.forEach(layer => {
        if (this.state.currentBounds) {
          layer.updateBounds(this.state.currentBounds);
          
          this.emit({
            type: 'layer:bounds:changed',
            timestamp: Date.now(),
            layer,
            bounds: this.state.currentBounds
          });
        }
      });
    });
  }

  private handleContainerColorsUpdated(event: ContainerColorsUpdatedEvent): void {
    this.executeIfActive(() => {
      this.state.containerColors = [...event.colors];
    });
  }

  private handleShapeFellOffScreen(event: ShapeFellOffScreenEvent): void {
    this.executeIfActive(() => {
      this.removeShape(event.shape.id);
    });
  }

  private handleSaveRequested(_event: SaveRequestedEvent): void {
    void _event;
    this.executeIfActive(() => {
      // The layer manager state will be collected by other systems
      // Just ensure our state is consistent
      if (DEBUG_CONFIG.logLayerDebug) {
        console.log(`LayerManager save state: ${this.state.layers.length} layers, ${this.state.layersGeneratedThisLevel}/${this.state.totalLayersForLevel} generated`);
      }
    });
  }

  private handleRestoreRequested(_event: RestoreRequestedEvent): void {
    void _event;
    this.executeIfActive(() => {
      // Restoration will be handled through separate mechanism
      // This is just a placeholder for coordination
    });
  }

  private handleShapeScrewsReady(event: ShapeScrewsReadyEvent): void {
    this.executeIfActive(() => {
      const { shape } = event;
      
      // Find which layer this shape belongs to
      const layer = this.state.layers.find(l => l.getShape(shape.id));
      if (!layer) {
        console.warn(`LayerManager: Could not find layer for shape ${shape.id}`);
        return;
      }

      // Track that this shape has screws ready
      if (!this.state.shapesWithScrewsReady.has(layer.id)) {
        this.state.shapesWithScrewsReady.set(layer.id, new Set());
      }
      this.state.shapesWithScrewsReady.get(layer.id)!.add(shape.id);

      // Check if all shapes in this layer have screws ready
      const allShapesInLayer = layer.getAllShapes();
      const shapesWithScrewsInLayer = this.state.shapesWithScrewsReady.get(layer.id)!;
      
      if (allShapesInLayer.length === shapesWithScrewsInLayer.size) {
        // All shapes in this layer have screws ready - collect screw colors
        const screwColors: ScrewColor[] = [];
        for (const layerShape of allShapesInLayer) {
          for (const screw of layerShape.getAllScrews()) {
            if (!screwColors.includes(screw.color)) {
              screwColors.push(screw.color);
            }
          }
        }

        if (DEBUG_CONFIG.logScrewDebug) {
          if (DEBUG_CONFIG.logLayerDebug) {
          console.log(`LayerManager: Layer ${layer.id} shapes ready with screw colors:`, screwColors);
        }
        }
        
        // Emit layer shapes ready event
        this.emit({
          type: 'layer:shapes:ready',
          timestamp: Date.now(),
          layer,
          screwColors
        });
        
        // Track that this layer has completed screw generation
        this.state.layersWithScrewsReady.add(layer.id);
        
        // Check if ALL layers have completed screw generation
        if (this.state.layersWithScrewsReady.size === this.state.totalLayersForLevel && !this.state.allLayersScrewsReadyEmitted) {
          // All layers have completed screw generation
          const totalShapes = this.state.layers.reduce((total, l) => total + l.getAllShapes().length, 0);
          
          // Calculate total screws across all layers
          const totalScrews = this.state.layers.reduce((total, layer) => {
            return total + layer.getAllShapes().reduce((shapeTotal, shape) => {
              return shapeTotal + shape.getAllScrews().length;
            }, 0);
          }, 0);
          
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`LayerManager: ALL layers have completed screw generation. Total layers: ${this.state.layers.length}, Total shapes: ${totalShapes}, Total screws: ${totalScrews}`);
          }
          
          // Mark as emitted to prevent loops
          this.state.allLayersScrewsReadyEmitted = true;
          
          // Emit all layers screws ready event
          this.emit({
            type: 'all_layers:screws:ready',
            timestamp: Date.now(),
            totalLayers: this.state.layers.length,
            totalShapes
          });
          
          // Emit total screw count for progress tracking
          console.log(`[LayerManager] Emitting total screw count: ${totalScrews}`);
          this.emit({
            type: 'total_screw_count:set',
            timestamp: Date.now(),
            totalScrews,
            source: this.systemName
          });
        }
      }
    });
  }

  // Public API Methods
  public createLayer(fadeIn: boolean = false, isRestored: boolean = false): Layer {
    return this.executeIfActive(() => {
      const id = `layer-${++this.state.layerCounter}`;
      const index = this.state.layers.length;
      const physicsLayerGroup = ++this.state.physicsGroupCounter;
      
      // Create layer with simple index-based ordering (no complex depth system!)
      // index = 0 → back layer, index = 1 → in front of layer 0, etc.
      const layer = new Layer(id, index, index, physicsLayerGroup, 0, fadeIn, isRestored);
      
      // Update bounds immediately if available, or use shape area default
      if (this.state.currentBounds) {
        layer.updateBounds(this.state.currentBounds);
      } else {
        // Use shape area bounds as default (fallback)
        const defaultShapeAreaBounds = {
          x: 0,
          y: LAYOUT_CONSTANTS.shapeArea.startY,
          width: GAME_CONFIG.canvas.width,
          height: GAME_CONFIG.canvas.height - LAYOUT_CONSTANTS.shapeArea.startY
        };
        layer.updateBounds(defaultShapeAreaBounds);
        console.warn(`No current bounds available for layer ${layer.id}, using default shape area bounds`);
      }
      
      // Simply add layer to the end (layers are created in order)
      this.state.layers.push(layer);
      this.updateLayerVisibility();
      
      // Now assign color based on final visibility state
      const colorIndex = this.getUnusedColorIndex();
      layer.colorIndex = colorIndex;
      layer.tint = SHAPE_TINTS[colorIndex % SHAPE_TINTS.length];
      
      console.log(`🎨 Normal layer creation: ${layer.id} index=${index} colorIndex=${colorIndex} tint=${layer.tint} visible=${layer.isVisible}`);
      
      // Always increment the generation counter
      this.state.layersGeneratedThisLevel++;
      
      const existingLayers = this.state.layers.map(l => `${l.id}:${l.index}:${l.colorIndex}`).join(', ');
      const visibleColorIndices = this.getVisibleLayers().map(l => l.colorIndex).join(', ');
      if (fadeIn) {
        if (DEBUG_CONFIG.logPhysicsDebug) {
          console.log(`🎨 Generated layer ${this.state.layersGeneratedThisLevel}/${this.state.totalLayersForLevel} with fade-in at index ${index}, color ${colorIndex}, physics group ${physicsLayerGroup}. Existing: [${existingLayers}]. Visible colors: [${visibleColorIndices}]`);
        }
      } else {
        if (DEBUG_CONFIG.logPhysicsDebug) {
          console.log(`🎨 Created initial layer ${this.state.layersGeneratedThisLevel}/${this.state.totalLayersForLevel} at index ${index}, color ${colorIndex}, physics group ${physicsLayerGroup}. Existing: [${existingLayers}]. Visible colors: [${visibleColorIndices}]`);
        }
      }
      
      // Emit layer created event
      this.emit({
        type: 'layer:created',
        timestamp: Date.now(),
        layer,
        index
      });
      
      return layer;
    }) || new Layer('error', 0, 0, 0, 0);
  }

  public generateShapesForLayer(layer: Layer): void {
    this.executeIfActive(() => {
      if (layer.isGenerated) return;
      
      if (DEBUG_CONFIG.logLayerDebug) {
        console.log(`GENERATING SHAPES FOR LAYER ${layer.id}: bounds=(${layer.bounds.x}, ${layer.bounds.y}, ${layer.bounds.width.toFixed(0)}, ${layer.bounds.height.toFixed(0)})`);
      }
      
      const shapeCount = randomIntBetween(
        GAME_CONFIG.shapes.minPerLayer,
        GAME_CONFIG.shapes.maxPerLayer
      );
      
      // Get existing shapes in the layer to avoid overlap
      const existingShapesInLayer = layer.getAllShapes();
      const shapes: Shape[] = [...existingShapesInLayer];
      
      for (let i = 0; i < shapeCount; i++) {
        let shapeCreated = false;
        
        for (let attempt = 0; attempt < 20 && !shapeCreated; attempt++) {
          const shapeMargin = 50;
          const maxWidth = layer.bounds.width;
          const maxHeight = layer.bounds.height;
          
          const usableWidth = Math.max(100, maxWidth - 2 * shapeMargin);
          const usableHeight = Math.max(100, maxHeight - 2 * shapeMargin);
          
          const position = {
            x: layer.bounds.x + shapeMargin + Math.random() * usableWidth,
            y: layer.bounds.y + shapeMargin + Math.random() * usableHeight,
          };
          
          const shape = ShapeFactory.createRandomShape(
            position,
            layer.id,
            layer.index,
            layer.physicsLayerGroup,
            layer.colorIndex,
            shapes,
            layer.bounds
          );
          
          // Check if the final position is still within acceptable bounds
          const shapeBounds = shape.getBounds();
          
          const withinBounds = (
            shapeBounds.x >= layer.bounds.x &&
            shapeBounds.x + shapeBounds.width <= layer.bounds.x + layer.bounds.width &&
            shapeBounds.y >= layer.bounds.y &&
            shapeBounds.y + shapeBounds.height <= layer.bounds.y + layer.bounds.height
          );
          
          if (withinBounds) {
            if (DEBUG_CONFIG.logPhysicsDebug) {
              console.log(`Created shape ${shape.id} in layer ${layer.id} (color ${layer.colorIndex}) at position (${shape.position.x}, ${shape.position.y}) with physics group ${layer.physicsLayerGroup}`);
              console.log(`🎨 Shape ${shape.id}: color=${shape.color}, tint=${shape.tint}, collision filter: group=${shape.body.collisionFilter.group}, category=${shape.body.collisionFilter.category}, mask=${shape.body.collisionFilter.mask}`);
            }
            shapes.push(shape);
            layer.addShape(shape);
            shapeCreated = true;
            
            // Emit shape created event
            this.emit({
              type: 'shape:created',
              timestamp: Date.now(),
              source: 'LayerManager',
              shape,
              layer
            });
            
            // Emit physics body added event
            this.emit({
              type: 'physics:body:added',
              timestamp: Date.now(),
              source: 'LayerManager',
              bodyId: shape.body.id.toString(),
              shape,
              body: shape.body // Include the actual body so PhysicsWorld can add it
            });
            
            // NOTE: For composite bodies, we only add the parent body to the physics world
            // Individual parts should NOT be added separately - Matter.js handles them automatically
          } else {
            // Shape was created but is out of bounds - need to clean it up properly
            const shapeBounds = shape.getBounds();
            const screwCount = shape.getAllScrews().length;
            console.warn(`⚠️ Shape ${shape.id} created with ${screwCount} screws but failed bounds check:
              Shape bounds: (${shapeBounds.x.toFixed(1)}, ${shapeBounds.y.toFixed(1)}, ${shapeBounds.width.toFixed(1)}, ${shapeBounds.height.toFixed(1)})
              Layer bounds: (${layer.bounds.x}, ${layer.bounds.y}, ${layer.bounds.width}, ${layer.bounds.height})
              Position: (${shape.position.x.toFixed(1)}, ${shape.position.y.toFixed(1)})
              Attempt ${attempt + 1}/20`);
            
            // Dispose of the shape to clean up any resources (including screws)
            shape.dispose();
          }
        }
        
        if (!shapeCreated) {
          if (DEBUG_CONFIG.logLayerDebug) {
            console.log(`Failed to place shape ${i + 1} in layer ${layer.id} after multiple attempts`);
          }
        }
      }
      
      layer.setGenerated(true);
    });
  }

  public getLayers(): Layer[] {
    return [...this.state.layers];
  }


  public getLayersSortedByIndex(): Layer[] {
    return [...this.state.layers].sort((a, b) => a.index - b.index);
  }

  public getVisibleLayersSortedByIndex(): Layer[] {
    return this.getLayersSortedByIndex().filter(layer => layer.isVisible);
  }

  public getLayer(layerId: string): Layer | null {
    return this.state.layers.find(layer => layer.id === layerId) || null;
  }

  public getLayerByIndex(index: number): Layer | null {
    return this.state.layers[index] || null;
  }

  public removeShape(shapeId: string): boolean {
    return this.executeIfActive(() => {
      for (const layer of this.state.layers) {
        const shape = layer.getShape(shapeId);
        if (shape) {
          // Emit physics body removed event
          this.emit({
            type: 'physics:body:removed',
            timestamp: Date.now(),
            bodyId: shape.body.id.toString(),
            shape
          });
          
          // For composite shapes, also remove parts
          if (shape.isComposite && shape.parts) {
            shape.parts.forEach(part => {
              this.emit({
                type: 'physics:body:removed',
                timestamp: Date.now(),
                bodyId: part.id.toString(),
                shape
              });
            });
          }
          
          // Emit shape destroyed event
          this.emit({
            type: 'shape:destroyed',
            timestamp: Date.now(),
            shape,
            layer
          });
          
          // Remove from layer
          layer.removeShape(shapeId);
          
          if (DEBUG_CONFIG.logLayerDebug) {
            console.log(`Shape ${shapeId} removed from layer ${layer.id}. Layer empty: ${layer.isEmpty()}, has shapes with screws: ${layer.hasShapesWithScrews()}`);
          }
          
          return true;
        }
      }
      return false;
    }) || false;
  }

  public removeLayer(layerId: string): boolean {
    return this.executeIfActive(() => {
      const index = this.state.layers.findIndex(layer => layer.id === layerId);
      if (index === -1) return false;
      
      const layer = this.state.layers[index];
      
      // Emit physics body removed events for all shapes
      layer.getAllShapes().forEach(shape => {
        this.emit({
          type: 'physics:body:removed',
          timestamp: Date.now(),
          bodyId: shape.body.id.toString(),
          shape
        });
        
        // For composite shapes, also remove parts
        if (shape.isComposite && shape.parts) {
          shape.parts.forEach(part => {
            this.emit({
              type: 'physics:body:removed',
              timestamp: Date.now(),
              bodyId: part.id.toString(),
              shape
            });
          });
        }
        
        // Emit shape destroyed event
        this.emit({
          type: 'shape:destroyed',
          timestamp: Date.now(),
          shape,
          layer
        });
      });
      
      // Dispose layer
      layer.dispose();
      
      // Remove from array
      this.state.layers.splice(index, 1);
      
      // Update indices and visibility
      this.updateLayerIndices();
      this.updateLayerVisibility();
      
      return true;
    }) || false;
  }

  private onLayerCleared(layer: Layer): void {
    if (DEBUG_CONFIG.logLayerDebug) {
      console.log(`Layer ${layer.id} cleared!`);
      console.log(`Before removal - layersGeneratedThisLevel: ${this.state.layersGeneratedThisLevel}, totalLayersForLevel: ${this.state.totalLayersForLevel}, active layers: ${this.state.layers.length}`);
    }
    
    // Remove the cleared layer
    this.removeLayer(layer.id);
    
    // Emit layer cleared event
    this.emit({
      type: 'layer:cleared',
      timestamp: Date.now(),
      layer,
      index: layer.index
    });
    
    if (DEBUG_CONFIG.logLayerDebug) {
      console.log(`After removal - layersGeneratedThisLevel: ${this.state.layersGeneratedThisLevel}, totalLayersForLevel: ${this.state.totalLayersForLevel}, active layers: ${this.state.layers.length}`);
    }
    
    // Show the next hidden layer if one exists
    this.showNextHiddenLayer();
    
    // Check if level is complete (no more active layers)
    if (this.state.layers.length === 0) {
      if (DEBUG_CONFIG.logLayerDebug) {
        console.log('🎉 All layers cleared! Level complete!');
      }
      this.emit({
        type: 'all_layers:cleared',
        timestamp: Date.now()
      });
    }
  }

  private getUnusedColorIndex(): number {
    const totalColors = SHAPE_TINTS.length;
    
    // Get currently visible layers (after indices have been updated)
    const visibleLayers = this.getVisibleLayers();
    
    const usedColorIndices = new Set(
      visibleLayers.map(layer => layer.colorIndex % totalColors)
    );
    
    for (let colorIndex = 0; colorIndex < totalColors; colorIndex++) {
      if (!usedColorIndices.has(colorIndex)) {
        return colorIndex;
      }
    }
    
    const fallbackIndex = this.state.colorCounter % totalColors;
    this.state.colorCounter++;
    return fallbackIndex;
  }


  private updateLayerIndices(): void {
    this.state.layers.forEach((layer, layerIndex) => {
      layer.updateIndex(layerIndex);
    });
  }


  // Override BaseSystem update method to handle frame updates
  public update(deltaTime: number): void {
    void deltaTime; // Layer manager doesn't need frame timing
    this.executeIfActive(() => {
      // Update shape positions from physics bodies each frame
      this.updateShapePositions();
    });
  }

  public updateShapePositions(): void {
    this.executeIfActive(() => {
      // Skip all layer management during restoration
      if (this.state.isRestoringFlag) {
        if (DEBUG_CONFIG.logLayerDebug) {
          console.log('Skipping updateShapePositions during restoration');
        }
        return;
      }
      
      // Create a copy of layers array to avoid modification during iteration
      const layersToCheck = [...this.state.layers];
      
      layersToCheck.forEach(layer => {
        layer.updateShapePositions();
        layer.updateFadeAnimation();
        
        // Check for shapes that have fallen off screen and remove them
        this.cleanupOffScreenShapes(layer);
        
        // Check if layer is now cleared
        if (layer.isCleared()) {
          if (DEBUG_CONFIG.logLayerDebug) {
            console.log(`Layer ${layer.id} is cleared, removing it`);
          }
          this.onLayerCleared(layer);
        }
      });
    });
  }

  private cleanupOffScreenShapes(layer: Layer): void {
    const shapesToRemove: string[] = [];
    
    layer.getAllShapes().forEach(shape => {
      const pos = shape.position;
      
      const margin = 200;
      const fallDistance = 500; // Increased from 300 to 500 to be more lenient
      
      const shouldRemove = (
        pos.x < -margin ||
        pos.x > layer.bounds.x + layer.bounds.width + margin ||
        pos.y < -margin ||
        pos.y > layer.bounds.y + layer.bounds.height + fallDistance
      );
      
      // Check if shape is hiding in the HUD area (above the game area)
      const hidingInHUD = pos.y < LAYOUT_CONSTANTS.shapeArea.startY - 50; // 50px buffer
      
      // Additional check: if shape is far from visible area, remove it regardless
      const farFromVisibleArea = (
        Math.abs(pos.x - (layer.bounds.x + layer.bounds.width / 2)) > layer.bounds.width ||
        Math.abs(pos.y - (layer.bounds.y + layer.bounds.height / 2)) > layer.bounds.height * 1.5
      );
      
      if (shouldRemove || farFromVisibleArea || hidingInHUD) {
        console.log(`Shape ${shape.id} fell off screen at (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}), removing...`);
        if (farFromVisibleArea) {
          console.log(`  -> Removed due to being far from visible area`);
        }
        if (hidingInHUD) {
          console.log(`  -> Removed due to hiding in HUD area (y=${pos.y.toFixed(1)} < ${LAYOUT_CONSTANTS.shapeArea.startY - 50})`);
        }
        shapesToRemove.push(shape.id);
        
        // Emit shape fell off screen event
        this.emit({
          type: 'shape:fell_off_screen',
          timestamp: Date.now(),
          shape,
          layer
        });
      }
    });
    
    // Remove off-screen shapes
    shapesToRemove.forEach(shapeId => {
      this.removeShape(shapeId);
    });
  }

  public getAllShapes(): Shape[] {
    return this.state.layers.flatMap(layer => layer.getAllShapes());
  }

  public getShapeById(shapeId: string): Shape | null {
    for (const layer of this.state.layers) {
      const shape = layer.getShape(shapeId);
      if (shape) return shape;
    }
    return null;
  }

  public initializeLevel(levelNumber: number): void {
    this.executeIfActive(() => {
      // Clear existing layers
      this.clearAllLayers();
      
      // Reset layer generation counter for new level and update total layers for this level
      this.state.layersGeneratedThisLevel = 0;
      this.state.totalLayersForLevel = getTotalLayersForLevel(levelNumber);
      
      // Generate ALL layers for the level upfront, but only make some visible
      console.log(`[LayerManager] Generating all ${this.state.totalLayersForLevel} layers for level ${levelNumber}`);
      
      for (let i = 0; i < this.state.totalLayersForLevel; i++) {
        const layer = this.createLayer();
        this.generateShapesForLayer(layer);
        
        // Only make the first few layers visible initially
        if (i >= GAME_CONFIG.layer.maxVisible) {
          layer.makeHidden();
          // Disable physics for hidden layers
          this.disableLayerPhysics(layer);
          console.log(`[LayerManager] Layer ${i + 1} generated but hidden with physics disabled`);
        } else {
          console.log(`[LayerManager] Layer ${i + 1} generated and visible`);
        }
      }
      
      this.state.layersGeneratedThisLevel = this.state.totalLayersForLevel;
      
      if (DEBUG_CONFIG.logLayerDebug) {
        console.log(`Initialized level ${levelNumber} with ${this.state.totalLayersForLevel} total layers. ${GAME_CONFIG.layer.maxVisible} visible initially.`);
      }
    });
  }

  /**
   * Show the next hidden layer (make it visible with fade-in animation)
   */
  private showNextHiddenLayer(): void {
    this.executeIfActive(() => {
      // Find the first hidden layer
      const hiddenLayer = this.state.layers.find(layer => !layer.isVisible);
      
      if (hiddenLayer) {
        // Make the layer visible
        hiddenLayer.makeVisible();
        
        // Enable physics for all shapes in the now-visible layer
        this.enableLayerPhysics(hiddenLayer);
        
        console.log(`[LayerManager] Made layer ${hiddenLayer.id} visible with fade-in and enabled physics`);
        
        // Emit layer visibility changed event
        this.emit({
          type: 'layer:visibility:changed',
          timestamp: Date.now(),
          layer: hiddenLayer,
          visible: true
        });
        
        // Emit layers updated event to refresh the visible layers list
        this.emit({
          type: 'layers:updated',
          timestamp: Date.now(),
          visibleLayers: this.getVisibleLayers(),
          totalLayers: this.state.layers.length
        });
      } else {
        if (DEBUG_CONFIG.logLayerDebug) {
          console.log(`[LayerManager] No hidden layers to show`);
        }
      }
    });
  }

  public clearAllLayers(): void {
    this.executeIfActive(() => {
      console.log(`🗑️ Clearing all layers - currently have ${this.state.layers.length} layers`);
      
      // Emit physics body removed events for all shapes
      this.state.layers.forEach(layer => {
        layer.getAllShapes().forEach(shape => {
          this.emit({
            type: 'physics:body:removed',
            timestamp: Date.now(),
            bodyId: shape.body.id.toString(),
            shape
          });
          
          // Emit shape destroyed event
          this.emit({
            type: 'shape:destroyed',
            timestamp: Date.now(),
            shape,
            layer
          });
        });
      });
      
      // Dispose all layers
      this.state.layers.forEach(layer => layer.dispose());
      this.state.layers = [];
      this.state.layerCounter = 0;
      this.state.physicsGroupCounter = 0;
      this.state.colorCounter = 0;
      this.state.layersGeneratedThisLevel = 0;
      this.state.shapesWithScrewsReady.clear();
      this.state.layersWithScrewsReady.clear();
      this.state.allLayersScrewsReadyEmitted = false;
    });
  }

  public isLevelComplete(): boolean {
    // Level is complete when all layers are cleared, regardless of how many were generated
    // This ensures the level can complete even if fewer than totalLayersForLevel were needed
    return this.state.layers.length === 0;
  }

  public getLayersGeneratedThisLevel(): number {
    return this.state.layersGeneratedThisLevel;
  }

  public getTotalLayersForLevel(): number {
    return this.state.totalLayersForLevel;
  }

  public getRemainingLayerCount(): number {
    return this.state.layers.filter(layer => !layer.isCleared()).length;
  }

  // Removed precomputation event handlers - no longer using precomputation system

  // Removed precomputation layer creation methods - no longer using precomputation system

  // Removed precomputation shape creation methods - no longer using precomputation system

  // Removed precomputation physics body creation methods - no longer using precomputation system

  // Removed precomputation path body creation methods - no longer using precomputation system

  // Removed precomputation capsule body creation methods - no longer using precomputation system

  // Removed precomputation shape type mapping methods - no longer using precomputation system

  /**
   * Update layer visibility based on current state
   */
  public updateLayerVisibility(): void {
    console.log(`👁️ Updating layer visibility`);
    
    // Use normal visibility logic for all layers
    this.updateLayerVisibilityOriginal();
  }

  /**
   * Layer visibility logic
   */
  private updateLayerVisibilityOriginal(): void {
    const maxVisible = GAME_CONFIG.layer.maxVisible;
    const visibilityChanged: { layer: Layer; visible: boolean }[] = [];
    
    this.state.layers.forEach((layer) => {
      const wasVisible = layer.isVisible;
      layer.updateVisibility(maxVisible, 0);
      
      if (wasVisible !== layer.isVisible) {
        visibilityChanged.push({ layer, visible: layer.isVisible });
      }
    });
    
    // Emit visibility change events
    visibilityChanged.forEach(({ layer, visible }) => {
      this.emit({
        type: 'layer:visibility:changed',
        timestamp: Date.now(),
        layer,
        visible
      });
    });
    
    // Emit layers updated event
    this.emit({
      type: 'layers:updated',
      timestamp: Date.now(),
      visibleLayers: this.getVisibleLayers(),
      totalLayers: this.state.layers.length
    });
  }

  /**
   * Get visible layers
   */
  public getVisibleLayers(): Layer[] {
    return this.state.layers.filter(layer => layer.isVisible);
  }

  /**
   * Enable physics for all shapes in a layer
   */
  private enableLayerPhysics(layer: Layer): void {
    layer.getAllShapes().forEach(shape => {
      // Emit physics body added event
      this.emit({
        type: 'physics:body:added',
        timestamp: Date.now(),
        source: 'LayerManager',
        bodyId: shape.body.id.toString(),
        shape,
        body: shape.body
      });
      
      // For composite shapes, the body already includes all parts
      // No need to add parts separately as Matter.js handles them automatically
    });
  }

  /**
   * Disable physics for all shapes in a layer
   */
  private disableLayerPhysics(layer: Layer): void {
    layer.getAllShapes().forEach(shape => {
      // Emit physics body removed event
      this.emit({
        type: 'physics:body:removed',
        timestamp: Date.now(),
        bodyId: shape.body.id.toString(),
        shape
      });
      
      // For composite shapes, also remove parts from physics
      if (shape.isComposite && shape.parts) {
        shape.parts.forEach(part => {
          this.emit({
            type: 'physics:body:removed',
            timestamp: Date.now(),
            bodyId: part.id.toString(),
            shape
          });
        });
      }
    });
  }

  /**
   * Force cleanup of all out-of-bounds shapes (for debug purposes)
   */
  public forceCleanupOutOfBoundsShapes(): void {
    console.log('🧹 Force cleaning up out-of-bounds shapes...');
    
    let totalRemoved = 0;
    
    this.state.layers.forEach(layer => {
      const shapesToRemove: string[] = [];
      
      layer.getAllShapes().forEach(shape => {
        const pos = shape.position;
        const shapeBounds = shape.getBounds();
        
        // Very generous cleanup - remove anything that's clearly not in the main game area
        const isOutOfBounds = (
          pos.x < -500 ||
          pos.x > layer.bounds.x + layer.bounds.width + 500 ||
          pos.y < -500 ||
          pos.y > layer.bounds.y + layer.bounds.height + 800 ||
          shapeBounds.y > layer.bounds.y + layer.bounds.height + 200 ||
          pos.y < LAYOUT_CONSTANTS.shapeArea.startY - 100 // Check for shapes hiding in HUD area
        );
        
        if (isOutOfBounds) {
          console.log(`Force removing out-of-bounds shape ${shape.id} at (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)})`);
          shapesToRemove.push(shape.id);
          totalRemoved++;
        }
      });
      
      // Remove the shapes
      shapesToRemove.forEach(shapeId => {
        this.removeShape(shapeId);
      });
    });
    
    console.log(`🧹 Force cleanup complete - removed ${totalRemoved} out-of-bounds shapes`);
  }

  /**
   * Debug method to find shapes with screws that might be out of bounds
   */
  public debugOutOfBoundsShapes(): void {
    console.log('🔍 Debugging out-of-bounds shapes...');
    
    let totalShapes = 0;
    let outOfBoundsShapes = 0;
    let totalScrews = 0;
    let outOfBoundsScrews = 0;
    let hudShapes = 0;
    let hudScrews = 0;
    
    this.state.layers.forEach(layer => {
      const shapes = layer.getAllShapes();
      totalShapes += shapes.length;
      
      shapes.forEach(shape => {
        const screws = shape.getAllScrews();
        totalScrews += screws.length;
        
        const shapeBounds = shape.getBounds();
        const pos = shape.position;
        
        // Check if shape is out of layer bounds
        const withinLayerBounds = (
          shapeBounds.x >= layer.bounds.x &&
          shapeBounds.x + shapeBounds.width <= layer.bounds.x + layer.bounds.width &&
          shapeBounds.y >= layer.bounds.y &&
          shapeBounds.y + shapeBounds.height <= layer.bounds.y + layer.bounds.height
        );
        
        // Check if shape should have been cleaned up (same logic as cleanupOffScreenShapes)
        const margin = 200;
        const fallDistance = 300;
        const shouldBeRemoved = (
          pos.x < -margin ||
          pos.x > layer.bounds.x + layer.bounds.width + margin ||
          pos.y < -margin ||
          pos.y > layer.bounds.y + layer.bounds.height + fallDistance
        );
        
        // Check if shape is in HUD area
        const inHudArea = pos.y < LAYOUT_CONSTANTS.shapeArea.startY;
        
        if (!withinLayerBounds || shouldBeRemoved) {
          outOfBoundsShapes++;
          outOfBoundsScrews += screws.length;
          
          console.warn(`❌ Out-of-bounds shape found: ${shape.id} in layer ${layer.id}
            Shape position: (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)})
            Shape bounds: (${shapeBounds.x.toFixed(1)}, ${shapeBounds.y.toFixed(1)}, ${shapeBounds.width.toFixed(1)}, ${shapeBounds.height.toFixed(1)})
            Layer bounds: (${layer.bounds.x}, ${layer.bounds.y}, ${layer.bounds.width}, ${layer.bounds.height})
            Within layer: ${withinLayerBounds}, Should be removed: ${shouldBeRemoved}
            Screws: ${screws.length} (Active: ${shape.getActiveScrews().length})`);
        }
        
        if (inHudArea) {
          hudShapes++;
          hudScrews += screws.length;
          
          console.warn(`🎭 Shape hiding in HUD area: ${shape.id} in layer ${layer.id}
            Position: (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}) - Above game area (y < ${LAYOUT_CONSTANTS.shapeArea.startY})
            Screws: ${screws.length} (Active: ${shape.getActiveScrews().length})`);
        }
      });
    });
    
    console.log(`📊 Debug Summary:
      Total shapes: ${totalShapes}
      Out-of-bounds shapes: ${outOfBoundsShapes}
      HUD area shapes: ${hudShapes}
      Total screws: ${totalScrews}
      Out-of-bounds screws: ${outOfBoundsScrews}
      HUD area screws: ${hudScrews}
      Layers: ${this.state.layers.length}`);
  }

  protected onDestroy(): void {
    this.clearAllLayers();
  }
}