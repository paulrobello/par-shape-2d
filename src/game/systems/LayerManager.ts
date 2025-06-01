/**
 * Event-driven LayerManager implementation
 * Manages layers independently through events, removing direct dependencies
 */

import { BaseSystem } from '../core/BaseSystem';
import { Layer } from '@/game/entities/Layer';
import { Shape } from '@/game/entities/Shape';
import { ShapeFactory } from '@/game/systems/ShapeFactory';
import { GAME_CONFIG, SHAPE_TINTS, LAYOUT_CONSTANTS, getTotalLayersForLevel } from '@/game/utils/Constants';
import { ScrewColor } from '@/types/game';
import { randomIntBetween } from '@/game/utils/MathUtils';
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
  depthCounter: number;
  physicsGroupCounter: number;
  colorCounter: number;
  totalLayersForLevel: number;
  layersGeneratedThisLevel: number;
  maxLayers: number;
  currentBounds: { x: number; y: number; width: number; height: number } | null;
  containerColors: string[];
  isRestoringFlag: boolean;
  shapesWithScrewsReady: Map<string, Set<string>>; // layerId -> Set of shapeIds that have screws ready
}

export class LayerManager extends BaseSystem {
  private state: LayerManagerState;

  constructor(maxLayers: number = 10) {
    super('LayerManager');
    
    this.state = {
      layers: [],
      layerCounter: 0,
      depthCounter: 100, // Start high so new layers appear behind existing ones
      physicsGroupCounter: 0,
      colorCounter: 0,
      totalLayersForLevel: 10,
      layersGeneratedThisLevel: 0,
      maxLayers,
      currentBounds: null,
      containerColors: [],
      isRestoringFlag: false,
      shapesWithScrewsReady: new Map()
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
      
      console.log(`LayerManager: Updated bounds to shape area: (${this.state.currentBounds.x}, ${this.state.currentBounds.y}, ${this.state.currentBounds.width}, ${this.state.currentBounds.height})`);
      
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
      console.log(`LayerManager save state: ${this.state.layers.length} layers, ${this.state.layersGeneratedThisLevel}/${this.state.totalLayersForLevel} generated`);
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

        console.log(`LayerManager: Layer ${layer.id} shapes ready with screw colors:`, screwColors);
        
        // Emit layer shapes ready event
        this.emit({
          type: 'layer:shapes:ready',
          timestamp: Date.now(),
          layer,
          screwColors
        });
      }
    });
  }

  // Public API Methods
  public createLayer(fadeIn: boolean = false, isRestored: boolean = false): Layer {
    return this.executeIfActive(() => {
      const id = `layer-${++this.state.layerCounter}`;
      const index = this.state.layers.length;
      
      // Ensure new layer depth is lower than any existing layer (so it appears behind)
      const minExistingDepth = this.state.layers.length > 0 
        ? Math.min(...this.state.layers.map(l => l.depthIndex)) 
        : this.state.depthCounter; // Use depthCounter as starting point
      const depthIndex = minExistingDepth - 1;
      
      // Update depthCounter to track the lowest depth used
      this.state.depthCounter = Math.min(this.state.depthCounter, depthIndex);
      const physicsLayerGroup = ++this.state.physicsGroupCounter;
      
      // Find an unused color from the 5-color pool for visible layers
      const colorIndex = this.getUnusedColorIndex();
      
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
        console.warn(`No current bounds available for layer ${layer.id}, using default shape area bounds`);
      }
      
      // Insert layer sorted by depth
      this.insertLayerByDepth(layer);
      this.updateLayerVisibility();
      
      // Always increment the generation counter
      this.state.layersGeneratedThisLevel++;
      
      const existingDepths = this.state.layers.map(l => `${l.id}:${l.depthIndex}:${l.colorIndex}`).join(', ');
      const visibleColorIndices = this.getVisibleLayers().map(l => l.colorIndex).join(', ');
      if (fadeIn) {
        console.log(`🎨 Generated layer ${this.state.layersGeneratedThisLevel}/${this.state.totalLayersForLevel} with fade-in at index ${index}, depth ${depthIndex}, color ${colorIndex}, physics group ${physicsLayerGroup}. Existing: [${existingDepths}]. Visible colors: [${visibleColorIndices}]`);
      } else {
        console.log(`🎨 Created initial layer ${this.state.layersGeneratedThisLevel}/${this.state.totalLayersForLevel} at index ${index}, depth ${depthIndex}, color ${colorIndex}, physics group ${physicsLayerGroup}. Existing: [${existingDepths}]. Visible colors: [${visibleColorIndices}]`);
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
      
      console.log(`GENERATING SHAPES FOR LAYER ${layer.id}: bounds=(${layer.bounds.x}, ${layer.bounds.y}, ${layer.bounds.width.toFixed(0)}, ${layer.bounds.height.toFixed(0)})`);
      
      const shapeCount = randomIntBetween(
        GAME_CONFIG.shapes.minPerLayer,
        GAME_CONFIG.shapes.maxPerLayer
      );
      
      const shapes: Shape[] = [];
      
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
            console.log(`Created shape ${shape.id} in layer ${layer.id} (color ${layer.colorIndex}) at position (${shape.position.x}, ${shape.position.y}) with physics group ${layer.physicsLayerGroup}`);
            console.log(`🎨 Shape ${shape.id}: color=${shape.color}, tint=${shape.tint}, collision filter: group=${shape.body.collisionFilter.group}, category=${shape.body.collisionFilter.category}, mask=${shape.body.collisionFilter.mask}`);
            shapes.push(shape);
            layer.addShape(shape);
            shapeCreated = true;
            
            // Emit shape created event
            this.emit({
              type: 'shape:created',
              timestamp: Date.now(),
              shape,
              layer
            });
            
            // Emit physics body added event
            this.emit({
              type: 'physics:body:added',
              timestamp: Date.now(),
              bodyId: shape.body.id.toString(),
              shape,
              body: shape.body // Include the actual body so PhysicsWorld can add it
            });
          } else {
            console.log(`Shape ${shape.id} placement attempt ${attempt + 1} failed - out of bounds`);
          }
        }
        
        if (!shapeCreated) {
          console.log(`Failed to place shape ${i + 1} in layer ${layer.id} after multiple attempts`);
        }
      }
      
      layer.setGenerated(true);
    });
  }

  public getLayers(): Layer[] {
    return [...this.state.layers];
  }

  public getVisibleLayers(): Layer[] {
    return this.state.layers.filter(layer => layer.isVisible);
  }

  public getLayersSortedByDepth(): Layer[] {
    return [...this.state.layers].sort((a, b) => b.depthIndex - a.depthIndex);
  }

  public getVisibleLayersSortedByDepth(): Layer[] {
    return this.getLayersSortedByDepth().filter(layer => layer.isVisible);
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
          
          // Emit shape destroyed event
          this.emit({
            type: 'shape:destroyed',
            timestamp: Date.now(),
            shape,
            layer
          });
          
          // Remove from layer
          layer.removeShape(shapeId);
          
          console.log(`Shape ${shapeId} removed from layer ${layer.id}. Layer empty: ${layer.isEmpty()}, has shapes with screws: ${layer.hasShapesWithScrews()}`);
          
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
    console.log(`Layer ${layer.id} cleared!`);
    console.log(`Before removal - layersGeneratedThisLevel: ${this.state.layersGeneratedThisLevel}, totalLayersForLevel: ${this.state.totalLayersForLevel}, active layers: ${this.state.layers.length}`);
    
    // Remove the cleared layer
    this.removeLayer(layer.id);
    
    // Emit layer cleared event
    this.emit({
      type: 'layer:cleared',
      timestamp: Date.now(),
      layer,
      index: layer.index
    });
    
    console.log(`After removal - layersGeneratedThisLevel: ${this.state.layersGeneratedThisLevel}, totalLayersForLevel: ${this.state.totalLayersForLevel}, active layers: ${this.state.layers.length}`);
    
    // Generate a new layer if we haven't reached the total for this level
    // AND we still have visible layers (not at the end of the level)
    const shouldGenerateNewLayer = this.state.layersGeneratedThisLevel < this.state.totalLayersForLevel && 
                                   this.state.layers.length > 0;
    
    if (shouldGenerateNewLayer) {
      console.log(`Generating new layer: ${this.state.layersGeneratedThisLevel}/${this.state.totalLayersForLevel} generated, ${this.state.layers.length} active layers`);
      const newLayer = this.createLayer(true); // Create with fade-in animation
      this.generateShapesForLayer(newLayer);
      console.log(`After generation - layersGeneratedThisLevel: ${this.state.layersGeneratedThisLevel}, totalLayersForLevel: ${this.state.totalLayersForLevel}, active layers: ${this.state.layers.length}`);
    } else {
      console.log(`No new layer generated: ${this.state.layersGeneratedThisLevel}/${this.state.totalLayersForLevel} layers generated, ${this.state.layers.length} active layers remaining`);
      
      // Check if level is complete (no more active layers)
      if (this.state.layers.length === 0) {
        console.log('🎉 All layers cleared! Level complete!');
        this.emit({
          type: 'all_layers:cleared',
          timestamp: Date.now()
        });
      }
    }
  }

  private getUnusedColorIndex(): number {
    const totalColors = SHAPE_TINTS.length;
    const visibleLayers = this.getVisibleLayers();
    
    const usedColorIndices = new Set(
      visibleLayers.map(layer => layer.colorIndex % totalColors)
    );
    
    console.log(`Visible layers: ${visibleLayers.length}, Used color indices: [${Array.from(usedColorIndices).sort().join(', ')}]`);
    
    for (let colorIndex = 0; colorIndex < totalColors; colorIndex++) {
      if (!usedColorIndices.has(colorIndex)) {
        console.log(`Selected unused color index ${colorIndex} for new layer`);
        return colorIndex;
      }
    }
    
    const fallbackIndex = this.state.colorCounter % totalColors;
    console.log(`All colors used, falling back to color index ${fallbackIndex}`);
    this.state.colorCounter++;
    return fallbackIndex;
  }

  private insertLayerByDepth(layer: Layer): void {
    let insertIndex = 0;
    for (let i = 0; i < this.state.layers.length; i++) {
      if (this.state.layers[i].depthIndex < layer.depthIndex) {
        insertIndex = i;
        break;
      }
      insertIndex = i + 1;
    }
    this.state.layers.splice(insertIndex, 0, layer);
    this.updateLayerIndices();
  }

  private updateLayerIndices(): void {
    this.state.layers.forEach((layer, layerIndex) => {
      layer.updateIndex(layerIndex);
    });
  }

  private updateLayerVisibility(): void {
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
        console.log('Skipping updateShapePositions during restoration');
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
          console.log(`Layer ${layer.id} is cleared, removing it`);
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
      const fallDistance = 300;
      
      const shouldRemove = (
        pos.x < -margin ||
        pos.x > layer.bounds.x + layer.bounds.width + margin ||
        pos.y < -margin ||
        pos.y > layer.bounds.y + layer.bounds.height + fallDistance
      );
      
      if (shouldRemove) {
        console.log(`Shape ${shape.id} fell off screen at (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}), removing...`);
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
      
      // Create initial visible layers
      const initialLayers = Math.min(GAME_CONFIG.layer.maxVisible, this.state.maxLayers);
      for (let i = 0; i < initialLayers; i++) {
        const layer = this.createLayer();
        this.generateShapesForLayer(layer);
      }
      
      console.log(`Initialized level ${levelNumber} with ${initialLayers} layers. ${this.state.layersGeneratedThisLevel}/${this.state.totalLayersForLevel} total generated.`);
    });
  }

  public clearAllLayers(): void {
    this.executeIfActive(() => {
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
      this.state.depthCounter = 100; // Reset to high value for new layers to appear behind
      this.state.physicsGroupCounter = 0;
      this.state.colorCounter = 0;
      this.state.layersGeneratedThisLevel = 0;
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

  // Serialization methods for save/load
  public toSerializable(): import('@/types/game').SerializableLayerManagerState {
    console.log(`Saving LayerManager state - layersGeneratedThisLevel: ${this.state.layersGeneratedThisLevel}, totalLayersForLevel: ${this.state.totalLayersForLevel}, active layers: ${this.state.layers.length}`);
    return {
      layers: this.state.layers.map(layer => layer.toSerializable()),
      layerCounter: this.state.layerCounter,
      depthCounter: this.state.depthCounter,
      physicsGroupCounter: this.state.physicsGroupCounter,
      colorCounter: this.state.colorCounter,
      totalLayersForLevel: this.state.totalLayersForLevel,
      layersGeneratedThisLevel: this.state.layersGeneratedThisLevel,
    };
  }

  public fromSerializable(data: import('@/types/game').SerializableLayerManagerState): void {
    this.executeIfActive(() => {
      console.log(`Starting LayerManager restoration`);
      console.log(`Loading LayerManager state - layersGeneratedThisLevel: ${data.layersGeneratedThisLevel}, totalLayersForLevel: ${data.totalLayersForLevel}, layers count: ${data.layers?.length || 0}`);
      
      // Set restoration flag
      this.state.isRestoringFlag = true;
      
      // Clear existing state
      this.clearAllLayers();
      
      // Restore counters
      this.state.layerCounter = data.layerCounter;
      this.state.depthCounter = data.depthCounter;
      this.state.physicsGroupCounter = data.physicsGroupCounter;
      this.state.colorCounter = data.colorCounter;
      this.state.totalLayersForLevel = data.totalLayersForLevel;
      this.state.layersGeneratedThisLevel = data.layersGeneratedThisLevel;
      
      console.log(`After loading counters - layersGeneratedThisLevel: ${this.state.layersGeneratedThisLevel}, totalLayersForLevel: ${this.state.totalLayersForLevel}`);
      
      // Recreate layers
      if (data.layers) {
        data.layers.forEach((layerData, index) => {
          console.log(`Restoring layer ${index + 1}/${data.layers.length}: ${layerData.id}`);
          
          const layer = new Layer(
            layerData.id,
            layerData.index,
            layerData.depthIndex,
            layerData.physicsLayerGroup,
            layerData.colorIndex,
            false, // Don't fade in when loading
            true   // Mark as restored
          );
          
          // For now, skip complex restoration and just create empty layers
          // In a full implementation, this would emit events to restore shapes and screws
          console.log(`Layer ${layerData.id} needs restoration - skipping complex restoration for now`);
          
          this.state.layers.push(layer);
          
          console.log(`Layer ${layerData.id} restoration requested - shapes and screws will be restored by other systems`);
        });
      }
      
      // Sort layers by depth
      this.state.layers.sort((a, b) => b.depthIndex - a.depthIndex);
      
      // Update visibility
      this.updateLayerVisibility();
      
      console.log(`LayerManager restoration complete: ${this.state.layers.length} layers, ${this.getAllShapes().length} total shapes`);
      
      // Clear restoration flag
      this.state.isRestoringFlag = false;
      console.log('LayerManager restoration flag cleared');
    });
  }

  protected onDestroy(): void {
    this.clearAllLayers();
  }
}