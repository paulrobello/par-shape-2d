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
import {
  BoundsChangedEvent,
  LevelStartedEvent,
  SaveRequestedEvent,
  RestoreRequestedEvent,
  ContainerColorsUpdatedEvent,
  ShapeFellOffScreenEvent,
  ShapeScrewsReadyEvent,
  LayerIndicesUpdatedEvent
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
  expectedShapesPerLayer: Map<string, number>; // layerId -> expected number of shapes
  virtualGameWidth?: number;
  virtualGameHeight?: number;
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
      expectedShapesPerLayer: new Map(),
    };
  }

  protected async onInitialize(): Promise<void> {
    this.setupEventHandlers();
    
    // Emit initialization event for EventFlowValidator
    this.emit({
      type: 'system:initialized',
      timestamp: Date.now(),
      systemName: 'LayerManager'
    });
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
  }

  // Event Handlers
  private handleLevelStarted(event: LevelStartedEvent): void {
    this.executeIfActive(() => {
      this.initializeLevel(event.level);
    });
  }

  private handleBoundsChanged(event: BoundsChangedEvent): void {
    this.executeIfActive(() => {
      // Store virtual game dimensions
      this.state.virtualGameWidth = event.width;
      this.state.virtualGameHeight = event.height;
      
      // Define the shape area using layout constants
      // But ensure it fits within the actual canvas
      const defaultShapeAreaY = LAYOUT_CONSTANTS.shapeArea.startY;
      
      // If canvas is too small, adjust the shape area to fit
      const minShapeAreaHeight = 200; // Minimum height for shapes
      let shapeAreaY: number = defaultShapeAreaY;
      let shapeAreaHeight = event.height - shapeAreaY;
      
      // If the shape area would be too small, adjust it
      if (shapeAreaHeight < minShapeAreaHeight) {
        // Calculate a better shape area that fits
        shapeAreaY = Math.max(100, event.height - minShapeAreaHeight) as number;
        shapeAreaHeight = event.height - shapeAreaY;
        console.warn(`Canvas height (${event.height}) is too small for default shape area. Adjusting shape area Y from ${defaultShapeAreaY} to ${shapeAreaY}`);
      }
      
      // Constrain shapes to the dedicated shape area only
      this.state.currentBounds = {
        x: 0,
        y: shapeAreaY,
        width: event.width,
        height: shapeAreaHeight
      };
      
      if (DEBUG_CONFIG.logBoundsOperations) {
        console.log(`🎮 LayerManager: Bounds changed event received:
          - Canvas size: ${event.width}x${event.height}
          - Shape area Y start: ${shapeAreaY}
          - Shape area height: ${shapeAreaHeight}
          - Shape area bounds: (${this.state.currentBounds.x}, ${this.state.currentBounds.y}, ${this.state.currentBounds.width}, ${this.state.currentBounds.height})`);
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
      // Layers are regenerated fresh when level starts via initializeLevel()
      // No restoration needed - layers are not persisted between sessions
      // This handler exists for event coordination but requires no action
    });
  }

  private handleShapeScrewsReady(event: ShapeScrewsReadyEvent): void {
    this.executeIfActive(() => {
      const { shape, screws } = event;
      
      if (DEBUG_CONFIG.logProgressTracking) {
        console.log(`🔍 LayerManager.handleShapeScrewsReady: Shape ${shape.id} has ${screws.length} screws`);
      }
      
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
      const expectedShapeCount = this.state.expectedShapesPerLayer.get(layer.id) || 0;
      const shapesWithScrewsInLayer = this.state.shapesWithScrewsReady.get(layer.id)!;
      const allShapesInLayer = layer.getAllShapes();
      
      if (DEBUG_CONFIG.logProgressTracking) {
        console.log(`🔍 LayerManager: Layer ${layer.id} screw readiness check - ${shapesWithScrewsInLayer.size}/${expectedShapeCount} expected (${allShapesInLayer.length} currently in layer)`);
        console.log(`🔍 All shapes in layer:`, allShapesInLayer.map(s => s.id));
        console.log(`🔍 Shapes with screws ready:`, Array.from(shapesWithScrewsInLayer));
      }
      
      if (expectedShapeCount === shapesWithScrewsInLayer.size) {
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
          
          // Calculate total screws across all layers for debugging
          const totalScrews = this.state.layers.reduce((total, layer) => {
            return total + layer.getAllShapes().reduce((shapeTotal, shape) => {
              return shapeTotal + shape.getAllScrews().length;
            }, 0);
          }, 0);
          
          // Calculate screws only from initially visible layers for progress tracking
          // Hidden layers will be added to the count when revealed via showNextHiddenLayer()
          const initiallyVisibleScrews = this.state.layers.reduce((total, layer) => {
            // Only count screws from layers that are initially visible
            if (layer.isVisible) {
              return total + layer.getAllShapes().reduce((shapeTotal, shape) => {
                return shapeTotal + shape.getAllScrews().length;
              }, 0);
            }
            return total;
          }, 0);
          
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`LayerManager: ALL layers have completed screw generation. Total layers: ${this.state.layers.length}, Total shapes: ${totalShapes}, Total screws: ${totalScrews}, Initially visible screws: ${initiallyVisibleScrews}`);
          }
          
          // Mark as emitted to prevent loops
          this.state.allLayersScrewsReadyEmitted = true;
          
          // Emit all layers screws ready event
          this.emit({
            type: 'all:layers:screws:ready',
            timestamp: Date.now(),
            totalLayers: this.state.layers.length,
            totalShapes
          });
          
          // Emit total screw count for progress tracking
          // FIXED: Only include initially visible layers, hidden layers added via total:screw:count:add when revealed
          const totalScrewCountEvent = {
            type: 'total:screw:count:set' as const,
            timestamp: Date.now(),
            totalScrews: initiallyVisibleScrews,
            source: this.systemName
          };
          this.emit(totalScrewCountEvent);
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
      
      // Layer depth assignment for proper visual ordering
      // New layers (higher index) should render behind existing layers (lower index)
      // depthIndex: higher value = renders behind (first in render loop)
      // So layer 0 (initial) should have low depthIndex (renders front)
      // And layer 4 (new) should have high depthIndex (renders behind)
      const depthIndex = index; // Higher index = higher depthIndex = renders behind
      
      // Use round-robin color assignment to ensure variety
      // This prevents the issue where all non-visible layers get the same color
      const colorIndex = this.state.colorCounter % SHAPE_TINTS.length;
      this.state.colorCounter++;
      
      // Now create layer with the correct color from the start
      const layer = new Layer(id, index, depthIndex, physicsLayerGroup, colorIndex, fadeIn, isRestored);
      
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
        if (DEBUG_CONFIG.logLayerDebug) {
          console.warn(`No current bounds available for layer ${layer.id}, using default shape area bounds`);
        }
      }
      
      // Simply add layer to the end (layers are created in order)
      this.state.layers.push(layer);
      this.updateLayerVisibility();
      
      // Update layer indices to ensure ScrewManager has current mappings
      this.updateLayerIndices();
      
      if (DEBUG_CONFIG.logLayerOperations) {
        console.log(`🎨 Normal layer creation: ${layer.id} index=${index} colorIndex=${colorIndex} tint=${layer.tint} visible=${layer.isVisible}`);
      }
      
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
      
      if (DEBUG_CONFIG.logLayerOperations) {
        console.log(`🎯 GENERATING SHAPES FOR LAYER ${layer.id}:
          - Index: ${layer.index}
          - Visible: ${layer.isVisible}
          - Bounds: (${layer.bounds.x}, ${layer.bounds.y}, ${layer.bounds.width.toFixed(0)}, ${layer.bounds.height.toFixed(0)})
          - Virtual game size: ${this.state.virtualGameWidth}x${this.state.virtualGameHeight}`);
      }
      
      const shapeCount = randomIntBetween(
        GAME_CONFIG.shapes.minPerLayer,
        GAME_CONFIG.shapes.maxPerLayer
      );
      
      if (DEBUG_CONFIG.logLayerOperations) {
        console.log(`🎯 Will generate ${shapeCount} shapes for layer ${layer.id}`);
      }
      
      // Track expected number of shapes for this layer
      this.state.expectedShapesPerLayer.set(layer.id, shapeCount);
      if (DEBUG_CONFIG.logProgressTracking) {
        console.log(`🎯 LayerManager: Set expected shapes for ${layer.id}: ${shapeCount}`);
      }
      
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
          
          // Add tolerance for composite shapes (like capsules) that may shift slightly during physics body creation
          const tolerance = shape.isComposite ? 60 : 10; // Much more tolerance for composite shapes
          const withinBounds = (
            shapeBounds.x >= layer.bounds.x - tolerance &&
            shapeBounds.x + shapeBounds.width <= layer.bounds.x + layer.bounds.width + tolerance &&
            shapeBounds.y >= layer.bounds.y - tolerance &&
            shapeBounds.y + shapeBounds.height <= layer.bounds.y + layer.bounds.height + tolerance
          );
          
          if (withinBounds) {
            if (DEBUG_CONFIG.logShapePositioning) {
              console.log(`✅ Created shape ${shape.id} in layer ${layer.id} at (${shape.position.x.toFixed(1)}, ${shape.position.y.toFixed(1)})
                - Layer visible: ${layer.isVisible}
                - Shape bounds: (${shapeBounds.x.toFixed(1)}, ${shapeBounds.y.toFixed(1)}, ${shapeBounds.width.toFixed(1)}, ${shapeBounds.height.toFixed(1)})
                - Screws: ${shape.getAllScrews().length}`);
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
            if (DEBUG_CONFIG.logProgressTracking) {
              console.log(`🚀 LayerManager: Emitting physics:body:added event for shape ${shape.id} with ${shape.screws.length} screws already`);
            }
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
            if (DEBUG_CONFIG.logShapeCreation) {
              console.warn(`⚠️ Shape ${shape.id} created with ${screwCount} screws but failed bounds check:
                Shape bounds: (${shapeBounds.x.toFixed(1)}, ${shapeBounds.y.toFixed(1)}, ${shapeBounds.width.toFixed(1)}, ${shapeBounds.height.toFixed(1)})
                Layer bounds: (${layer.bounds.x}, ${layer.bounds.y}, ${layer.bounds.width}, ${layer.bounds.height})
                Position: (${shape.position.x.toFixed(1)}, ${shape.position.y.toFixed(1)})
                Tolerance applied: ${tolerance}px (isComposite: ${shape.isComposite})
                Attempt ${attempt + 1}/20`);
            }
            
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
      
      // Update indices only (visibility will be updated by caller if needed)
      this.updateLayerIndices();
      
      return true;
    }) || false;
  }

  private onLayerCleared(layer: Layer): void {
    if (DEBUG_CONFIG.logLayerDebug) {
      console.log(`Layer ${layer.id} cleared!`);
      console.log(`Before removal - layersGeneratedThisLevel: ${this.state.layersGeneratedThisLevel}, totalLayersForLevel: ${this.state.totalLayersForLevel}, active layers: ${this.state.layers.length}`);
    }
    
    // Remove the cleared layer WITHOUT updating visibility yet
    // We'll update visibility after revealing the next layer
    const index = this.state.layers.findIndex(l => l.id === layer.id);
    if (index !== -1) {
      // Remove all shapes and emit events
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
      
      // CRITICAL: Emit layer cleared event BEFORE removing from array and updating indices
      // This ensures ScrewManager can clean up its references before receiving the indices update
      this.emit({
        type: 'layer:cleared',
        timestamp: Date.now(),
        layer,
        index: layer.index
      });
      
      // Remove from array
      this.state.layers.splice(index, 1);
      
      // Update indices but DON'T update visibility yet
      this.updateLayerIndices();
    }
    
    if (DEBUG_CONFIG.logLayerDebug) {
      console.log(`After removal - layersGeneratedThisLevel: ${this.state.layersGeneratedThisLevel}, totalLayersForLevel: ${this.state.totalLayersForLevel}, active layers: ${this.state.layers.length}`);
    }
    
    // Show the next hidden layer if one exists
    this.showNextHiddenLayer();
    
    // NOW update visibility after potentially revealing a new layer
    this.updateLayerVisibility();
    
    // Emit layer state change for visibility updates
    if (this.state.layers.length === 0) {
      if (DEBUG_CONFIG.logLayerDebug) {
        console.log('🎉 All layers cleared! (Level completion is determined by ProgressTracker)');
      }
      this.emit({
        type: 'all:layers:cleared',
        timestamp: Date.now()
      });
    }
  }

  private getUnusedColorIndex(): number {
    const totalColors = SHAPE_TINTS.length;
    
    // Only consider visible layers for color uniqueness
    // This ensures visible layers always have unique colors
    const visibleLayers = this.getVisibleLayers();
    
    const usedColorIndices = new Set(
      visibleLayers
        .filter(layer => 'colorIndex' in layer && layer.colorIndex >= 0) // Filter out placeholders
        .map(layer => layer.colorIndex % totalColors)
    );
    
    if (DEBUG_CONFIG.logLayerOperations) {
      console.log(`🎨 Color assignment - Total colors: ${totalColors}, Visible layers: ${visibleLayers.length}`);
      console.log(`🎨 Used color indices:`, Array.from(usedColorIndices));
      console.log(`🎨 Visible layer details:`, visibleLayers.filter(l => 'colorIndex' in l).map(l => ({ id: l.id, colorIndex: l.colorIndex, tint: l.tint })));
    }
    
    // Find first unused color among visible layers
    for (let colorIndex = 0; colorIndex < totalColors; colorIndex++) {
      if (!usedColorIndices.has(colorIndex)) {
        if (DEBUG_CONFIG.logLayerOperations) {
          console.log(`🎨 Found unused color index: ${colorIndex} (tint: ${SHAPE_TINTS[colorIndex]})`);
        }
        return colorIndex;
      }
    }
    
    // Fallback: cycle through colors if all are used (shouldn't happen with 8 colors and 4 visible layers)
    const fallbackIndex = this.state.colorCounter % totalColors;
    this.state.colorCounter++;
    if (DEBUG_CONFIG.logLayerOperations) {
      console.log(`🎨 All colors used, falling back to: ${fallbackIndex} (tint: ${SHAPE_TINTS[fallbackIndex]})`);
    }
    return fallbackIndex;
  }


  private updateLayerIndices(): void {
    this.state.layers.forEach((layer, layerIndex) => {
      layer.updateIndex(layerIndex);
    });
    
    // Always emit the event to ensure lookup is populated, even if indices didn't change
    // This ensures ScrewManager has the current layer indices
    const allLayerIndices = this.state.layers.map(layer => ({
      layerId: layer.id,
      newIndex: layer.index
    }));
    
    // Log this event for debugging layer operations
    if (DEBUG_CONFIG.logLayerOperations) {
      console.log(`🔄 LayerManager: Emitting layer indices update:`, allLayerIndices);
    }
    
    this.emit({
      type: 'layer:indices:updated',
      timestamp: Date.now(),
      layers: allLayerIndices
    } as LayerIndicesUpdatedEvent);
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
        return;
      }
      
      // Create a copy of layers array to avoid modification during iteration
      const layersToCheck = [...this.state.layers];
      
      layersToCheck.forEach(layer => {
        layer.updateShapePositions();
        layer.updateFadeAnimation();
        
        // Update screw positions directly from shape bodies using local offsets
        layer.getAllShapes().forEach(shape => {
          shape.getAllScrews().forEach(screw => {
            screw.updateFromShapeBody(shape.body);
          });
        });
        
        // Check for shapes that have fallen off screen and remove them
        this.cleanupOffScreenShapes(layer);
        
        // Note: Invisible layers are intentionally pre-generated and will be revealed later
        // Only clean up shapes that are actually out of bounds, not just invisible
        
        // Check if layer is now cleared
        if (layer.isCleared()) {
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
        if (DEBUG_CONFIG.logShapePositioning) {
          console.log(`Shape ${shape.id} fell off screen at (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}), removing...`);
          if (farFromVisibleArea) {
            console.log(`  -> Removed due to being far from visible area`);
          }
          if (hidingInHUD) {
            console.log(`  -> Removed due to hiding in HUD area (y=${pos.y.toFixed(1)} < ${LAYOUT_CONSTANTS.shapeArea.startY - 50})`);
          }
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
      if (DEBUG_CONFIG.logLayerOperations) {
        console.log(`[LayerManager] Generating all ${this.state.totalLayersForLevel} layers for level ${levelNumber}`);
      }
      
      for (let i = 0; i < this.state.totalLayersForLevel; i++) {
        // Create ALL layers with fade-in capability
        const layer = this.createLayer(true); // Always enable fade-in
        this.generateShapesForLayer(layer);
        
        // Initial layers (0-3) start fully visible, hidden layers (4+) start ready for fade-in
        if (i >= GAME_CONFIG.layer.maxVisible) {
          layer.makeHidden();
          // Disable physics for hidden layers
          this.disableLayerPhysics(layer);
          if (DEBUG_CONFIG.logLayerOperations) {
            console.log(`[LayerManager] Layer ${i + 1} generated but hidden with physics disabled and fade-in ready`);
          }
        } else {
          // Initial visible layers start with full opacity (fade already complete)
          layer.fadeOpacity = 1.0;
          layer.fadeStartTime = 0;
          if (DEBUG_CONFIG.logLayerOperations) {
            console.log(`[LayerManager] Layer ${i + 1} generated and visible with fade-in capability`);
          }
        }
      }
      
      this.state.layersGeneratedThisLevel = this.state.totalLayersForLevel;
      
      // Ensure layer indices are properly updated after all layers and shapes are created
      this.updateLayerIndices();
      
      // Update layer visibility to emit final LayersUpdatedEvent after all layers are initialized
      this.updateLayerVisibility();
      
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
        // Log detailed information about the layer being revealed
        const shapeCount = hiddenLayer.getAllShapes().length;
        const totalScrews = hiddenLayer.getAllShapes().reduce((total, shape) => total + shape.getAllScrews().length, 0);
        if (DEBUG_CONFIG.logLayerOperations) {
          console.log(`[LayerManager] Revealing hidden layer ${hiddenLayer.id}:
            - Index: ${hiddenLayer.index}
            - Shapes: ${shapeCount}
            - Total screws: ${totalScrews}
            - Bounds: (${hiddenLayer.bounds.x}, ${hiddenLayer.bounds.y}, ${hiddenLayer.bounds.width}, ${hiddenLayer.bounds.height})`);
        }
        
        // Make the layer visible
        hiddenLayer.makeVisible();
        
        // Enable physics for all shapes in the now-visible layer
        this.enableLayerPhysics(hiddenLayer);
        
        if (DEBUG_CONFIG.logLayerOperations) {
          console.log(`[LayerManager] Made layer ${hiddenLayer.id} visible with fade-in and enabled physics`);
        }
        
        // Add the newly visible layer's screws to the total screw count for progress tracking
        const newLayerScrews = hiddenLayer.getAllShapes().reduce((total, shape) => {
          return total + shape.getAllScrews().length;
        }, 0);
        
        if (newLayerScrews > 0) {
          if (DEBUG_CONFIG.logLayerOperations) {
            console.log(`[LayerManager] Adding ${newLayerScrews} screws from newly visible layer ${hiddenLayer.id} to total count`);
          }
          this.emit({
            type: 'total:screw:count:add',
            timestamp: Date.now(),
            additionalScrews: newLayerScrews,
            source: this.systemName
          });
        }
        
        // Log shape positions to verify they're in visible area
        if (DEBUG_CONFIG.logLayerDebug) {
          hiddenLayer.getAllShapes().forEach(shape => {
            const pos = shape.position;
            const bounds = shape.getBounds();
            console.log(`  - Shape ${shape.id} at (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}), bounds: (${bounds.x.toFixed(1)}, ${bounds.y.toFixed(1)}, ${bounds.width.toFixed(1)}, ${bounds.height.toFixed(1)})`);
          });
        }
        
        // Emit layer visibility changed event
        this.emit({
          type: 'layer:visibility:changed',
          timestamp: Date.now(),
          layer: hiddenLayer,
          visible: true
        });
        
        // Don't emit layers:updated here - let onLayerCleared handle it after calling us
      } else {
        if (DEBUG_CONFIG.logLayerDebug) {
          console.log(`[LayerManager] No hidden layers to show`);
        }
      }
    });
  }

  public clearAllLayers(): void {
    this.executeIfActive(() => {
      if (DEBUG_CONFIG.logLayerOperations) {
        console.log(`🗑️ Clearing all layers - currently have ${this.state.layers.length} layers`);
      }
      
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
      this.state.expectedShapesPerLayer.clear();
    });
  }

  /**
   * Update layer visibility based on current state
   */
  public updateLayerVisibility(): void {
    if (DEBUG_CONFIG.logLayerOperations) {
      console.log(`👁️ Updating layer visibility`);
    }
    
    // Use normal visibility logic for all layers
    this.updateLayerVisibilityOriginal();
  }

  /**
   * Layer visibility logic
   */
  private updateLayerVisibilityOriginal(): void {
    const maxVisible = GAME_CONFIG.layer.maxVisible;
    const visibilityChanged: { layer: Layer; visible: boolean }[] = [];
    
    // Count currently visible layers to understand the state
    const currentlyVisibleCount = this.state.layers.filter(l => l.isVisible).length;
    
    if (DEBUG_CONFIG.logLayerOperations) {
      console.log(`[LayerManager] updateLayerVisibility: ${this.state.layers.length} total layers, ${currentlyVisibleCount} currently visible, maxVisible=${maxVisible}`);
    }
    
    // Process each layer's visibility
    this.state.layers.forEach((layer, index) => {
      const wasVisible = layer.isVisible;
      
      // Determine if this layer should be visible based on index
      const shouldBeVisibleByIndex = index < maxVisible;
      
      // Enhanced fade-in detection - check if layer was recently made visible with fade-in
      const isFadingIn = layer.fadeOpacity < 1 && layer.fadeStartTime > 0;
      const recentlyMadeVisible = layer.isVisible && layer.fadeStartTime > 0 && (Date.now() - layer.fadeStartTime) < 2000; // 2 second window
      
      // Preserve layers that should stay visible
      const shouldPreserveVisibility = layer.isVisible && (isFadingIn || recentlyMadeVisible);
      
      if (DEBUG_CONFIG.logLayerDebug) {
        console.log(`[LayerManager] Layer ${layer.id} (index=${index}): wasVisible=${wasVisible}, shouldBeVisibleByIndex=${shouldBeVisibleByIndex}, isFadingIn=${isFadingIn}, recentlyMadeVisible=${recentlyMadeVisible}, fadeOpacity=${layer.fadeOpacity}, fadeStartTime=${layer.fadeStartTime}`);
      }
      
      // Determine final visibility state
      // CRITICAL: If a layer was explicitly made visible (e.g., by showNextHiddenLayer), preserve that state
      // regardless of index-based rules to prevent interference with fade-in animations
      let shouldBeVisible: boolean;
      if (shouldPreserveVisibility) {
        shouldBeVisible = true; // Always preserve explicitly revealed layers
        if (DEBUG_CONFIG.logLayerDebug) {
          console.log(`[LayerManager] Preserving visibility for layer ${layer.id} (fade-in or recently revealed)`);
        }
      } else {
        shouldBeVisible = shouldBeVisibleByIndex; // Use index-based rules for other layers
      }
      
      // Only change visibility if absolutely necessary and safe to do so
      if (layer.isVisible !== shouldBeVisible) {
        if (shouldBeVisible) {
          layer.isVisible = true;
          console.log(`[LayerManager] Made layer ${layer.id} visible (index-based rule)`);
        } else {
          // Only hide layers if they're not in a fade-in state
          if (!isFadingIn && !recentlyMadeVisible) {
            layer.isVisible = false;
            console.log(`[LayerManager] Made layer ${layer.id} hidden`);
          } else {
            console.log(`[LayerManager] Skipping hide for layer ${layer.id} - layer is fading in or recently revealed`);
          }
        }
      }
      
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
   * Debug method to log current layer visibility state
   */
  public debugLayerVisibility(): void {
    if (!DEBUG_CONFIG.logDebugUtilities) return;
    
    console.log('🔍 Layer Visibility Debug:');
    console.log(`Total layers: ${this.state.layers.length}`);
    console.log(`Visible layers: ${this.getVisibleLayers().length}`);
    console.log(`Current bounds: ${this.state.currentBounds ? `(${this.state.currentBounds.x}, ${this.state.currentBounds.y}, ${this.state.currentBounds.width}, ${this.state.currentBounds.height})` : 'NOT SET'}`);
    console.log(`Virtual game size: ${this.state.virtualGameWidth}x${this.state.virtualGameHeight}`);
    
    this.state.layers.forEach((layer, index) => {
      const shapeCount = layer.getAllShapes().length;
      const screwCount = layer.getAllShapes().reduce((total, shape) => total + shape.getAllScrews().length, 0);
      const shapes = layer.getAllShapes();
      console.log(`Layer ${index} (${layer.id}):
        - Visible: ${layer.isVisible}
        - Opacity: ${layer.getFadeOpacity()}
        - Shapes: ${shapeCount}
        - Screws: ${screwCount}
        - Bounds: (${layer.bounds.x}, ${layer.bounds.y}, ${layer.bounds.width}, ${layer.bounds.height})`);
      
      // Log first few shape positions if any
      if (shapes.length > 0) {
        console.log(`  Sample shape positions:`);
        shapes.slice(0, 3).forEach(shape => {
          console.log(`    - ${shape.id} at (${shape.position.x.toFixed(1)}, ${shape.position.y.toFixed(1)})`);
        });
      }
    });
  }
}