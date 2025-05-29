import { Layer } from '@/game/entities/Layer';
import { Shape } from '@/game/entities/Shape';
import { ShapeFactory } from '@/game/systems/ShapeFactory';
import { ScrewManager } from '@/game/systems/ScrewManager';
import { PhysicsWorld } from '@/game/physics/PhysicsWorld';
import { GAME_CONFIG, SHAPE_TINTS } from '@/game/utils/Constants';
import { randomIntBetween } from '@/game/utils/MathUtils';

export class LayerManager {
  private layers: Layer[] = [];
  private physicsWorld: PhysicsWorld;
  private screwManager: ScrewManager;
  private layerCounter = 0;
  private depthCounter = 0; // Track depth ordering
  private physicsGroupCounter = 0; // Track physics separation
  private colorCounter = 0; // Track color cycling independently
  private maxLayers: number;
  private totalLayersForLevel = 10;
  private layersGeneratedThisLevel = 0;
  private onLayerCreated?: () => void;
  private onLayerClearedCallback?: () => void;
  private getCurrentBounds?: () => { x: number; y: number; width: number; height: number };

  constructor(physicsWorld: PhysicsWorld, maxLayers: number = 10) {
    this.physicsWorld = physicsWorld;
    this.screwManager = new ScrewManager(physicsWorld);
    this.maxLayers = maxLayers;
  }

  public setOnLayerCreatedCallback(callback: () => void): void {
    this.onLayerCreated = callback;
  }

  public setOnLayerClearedCallback(callback: () => void): void {
    this.onLayerClearedCallback = callback;
  }

  public setGetCurrentBoundsCallback(callback: () => { x: number; y: number; width: number; height: number }): void {
    this.getCurrentBounds = callback;
  }

  public createLayer(fadeIn: boolean = false, bounds?: { x: number; y: number; width: number; height: number }): Layer {
    const id = `layer-${++this.layerCounter}`;
    const index = this.layers.length;
    
    // New layers get higher depth indices to render behind existing layers
    // Ensure new layer depth is higher than any existing layer
    const maxExistingDepth = this.layers.length > 0 
      ? Math.max(...this.layers.map(l => l.depthIndex)) 
      : -1;
    const depthIndex = Math.max(++this.depthCounter, maxExistingDepth + 1);
    const physicsLayerGroup = ++this.physicsGroupCounter;
    
    // Find an unused color from the 5-color pool for visible layers
    const colorIndex = this.getUnusedColorIndex();
    
    const layer = new Layer(id, index, depthIndex, physicsLayerGroup, colorIndex, fadeIn);
    
    // Update bounds immediately if provided, or get current bounds
    const currentBounds = bounds || (this.getCurrentBounds ? this.getCurrentBounds() : null);
    if (currentBounds) {
      layer.updateBounds(currentBounds);
    }
    
    // Insert layer sorted by depth (highest depth renders first/behind)
    this.insertLayerByDepth(layer);
    this.updateLayerVisibility();
    
    // Always increment the generation counter
    this.layersGeneratedThisLevel++;
    
    const existingDepths = this.layers.map(l => `${l.id}:${l.depthIndex}`).join(', ');
    if (fadeIn) {
      console.log(`Generated layer ${this.layersGeneratedThisLevel}/${this.totalLayersForLevel} with fade-in at index ${index}, depth ${depthIndex}, color ${colorIndex}. Existing: [${existingDepths}]`);
    } else {
      console.log(`Created initial layer ${this.layersGeneratedThisLevel}/${this.totalLayersForLevel} at index ${index}, depth ${depthIndex}, color ${colorIndex}. Existing: [${existingDepths}]`);
    }
    
    // Trigger save callback when new layer is created
    if (this.onLayerCreated) {
      this.onLayerCreated();
    }
    
    return layer;
  }

  public generateShapesForLayer(layer: Layer): void {
    if (layer.isGenerated) return;
    
    console.log(`GENERATING SHAPES FOR LAYER ${layer.id}: bounds=(${layer.bounds.x}, ${layer.bounds.y}, ${layer.bounds.width.toFixed(0)}, ${layer.bounds.height.toFixed(0)})`);
    console.log(`LAYER BOUNDS DETAILS: Y start=${layer.bounds.y}, height=${layer.bounds.height.toFixed(0)}, Y end=${layer.bounds.y + layer.bounds.height}`);
    
    const shapeCount = randomIntBetween(
      GAME_CONFIG.shapes.minPerLayer,
      GAME_CONFIG.shapes.maxPerLayer
    );
    
    const shapes: Shape[] = [];
    
    for (let i = 0; i < shapeCount; i++) {
      // Try multiple times to find a good position for this shape
      let shapeCreated = false;
      
      for (let attempt = 0; attempt < 20 && !shapeCreated; attempt++) {
        // Generate position within layer bounds with minimal margin for larger shapes
        // Maximum shape radius is ~81px (triangle), so use smaller margin to maximize space
        const shapeMargin = 50; // Reduced margin for better distribution
        const maxWidth = layer.bounds.width;
        const maxHeight = layer.bounds.height;
        
        // Ensure we have enough space for shapes after accounting for margins
        const usableWidth = Math.max(100, maxWidth - 2 * shapeMargin);
        const usableHeight = Math.max(100, maxHeight - 2 * shapeMargin);
        
        const position = {
          x: layer.bounds.x + shapeMargin + Math.random() * usableWidth,
          y: layer.bounds.y + shapeMargin + Math.random() * usableHeight,
        };
        
        if (attempt === 0) {
          console.log(`Shape ${i} position calculation: bounds=(${layer.bounds.x}, ${layer.bounds.y}, ${layer.bounds.width.toFixed(0)}, ${layer.bounds.height.toFixed(0)}), margin=${shapeMargin}, usable=(${usableWidth.toFixed(0)}, ${usableHeight.toFixed(0)}), position=(${position.x.toFixed(1)}, ${position.y.toFixed(1)})`);
          console.log(`Shape ${i} Y position range: min=${layer.bounds.y + shapeMargin}, max=${layer.bounds.y + shapeMargin + usableHeight}, actual=${position.y.toFixed(1)}, TOTAL_Y_EXTENT=${layer.bounds.y + layer.bounds.height}`);
          console.log(`Shape ${i} ASPECT_CHECK: width=${layer.bounds.width.toFixed(0)}, height=${layer.bounds.height.toFixed(0)}, ratio=${(layer.bounds.height/layer.bounds.width).toFixed(2)}`);
        }
        
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
          console.log(`Created shape ${shape.id} in layer ${layer.id} at position (${shape.position.x}, ${shape.position.y})`);
          shapes.push(shape);
          layer.addShape(shape);
          shapeCreated = true;
        } else {
          console.log(`Shape ${shape.id} placement attempt ${attempt + 1} failed - out of bounds`);
          // Don't add shape if it's out of bounds, try again
        }
      }
      
      // If we couldn't place the shape after many attempts, skip it
      if (!shapeCreated) {
        console.log(`Failed to place shape ${i + 1} in layer ${layer.id} after multiple attempts`);
      }
    }
    
    // Add shapes to physics world
    const bodies = shapes.map(shape => shape.body);
    this.physicsWorld.addBodies(bodies);
    
    // Generate screws for each shape
    shapes.forEach(shape => {
      this.screwManager.generateScrewsForShape(shape);
    });
    
    layer.setGenerated(true);
  }

  public getLayers(): Layer[] {
    return [...this.layers];
  }

  public getVisibleLayers(): Layer[] {
    return this.layers.filter(layer => layer.isVisible);
  }

  public getLayersSortedByDepth(): Layer[] {
    // Return layers sorted by depth for rendering (highest depth first/background)
    return [...this.layers].sort((a, b) => b.depthIndex - a.depthIndex);
  }

  public getVisibleLayersSortedByDepth(): Layer[] {
    return this.getLayersSortedByDepth().filter(layer => layer.isVisible);
  }

  public getLayer(layerId: string): Layer | null {
    return this.layers.find(layer => layer.id === layerId) || null;
  }

  public getLayerByIndex(index: number): Layer | null {
    return this.layers[index] || null;
  }

  public removeShape(shapeId: string): boolean {
    for (const layer of this.layers) {
      const shape = layer.getShape(shapeId);
      if (shape) {
        // Remove from physics world
        this.physicsWorld.removeBodies([shape.body]);
        
        // Remove from layer
        layer.removeShape(shapeId);
        
        // Log removal but don't check for clearing here - let updateShapePositions handle it
        console.log(`Shape ${shapeId} removed from layer ${layer.id}. Layer empty: ${layer.isEmpty()}, has shapes with screws: ${layer.hasShapesWithScrews()}`);
        
        return true;
      }
    }
    return false;
  }

  public removeLayer(layerId: string): boolean {
    const index = this.layers.findIndex(layer => layer.id === layerId);
    if (index === -1) return false;
    
    const layer = this.layers[index];
    
    // Remove all shapes from physics world
    const bodies = layer.getAllShapes().map(shape => shape.body);
    this.physicsWorld.removeBodies(bodies);
    
    // Dispose layer
    layer.dispose();
    
    // Remove from array
    this.layers.splice(index, 1);
    
    // Update indices and visibility
    this.updateLayerIndices();
    this.updateLayerVisibility();
    
    return true;
  }

  private onLayerCleared(layer: Layer): void {
    console.log(`Layer ${layer.id} cleared!`);
    console.log(`Before removal - layersGeneratedThisLevel: ${this.layersGeneratedThisLevel}, totalLayersForLevel: ${this.totalLayersForLevel}, active layers: ${this.layers.length}`);
    
    // Remove the cleared layer
    this.removeLayer(layer.id);
    
    console.log(`After removal - layersGeneratedThisLevel: ${this.layersGeneratedThisLevel}, totalLayersForLevel: ${this.totalLayersForLevel}, active layers: ${this.layers.length}`);
    
    // Generate a new layer if we haven't reached the total for this level
    if (this.layersGeneratedThisLevel < this.totalLayersForLevel) {
      console.log(`Generating new layer: ${this.layersGeneratedThisLevel}/${this.totalLayersForLevel} generated, ${this.layers.length} active layers`);
      const newLayer = this.createLayer(true); // Create with fade-in animation
      this.generateShapesForLayer(newLayer);
      console.log(`After generation - layersGeneratedThisLevel: ${this.layersGeneratedThisLevel}, totalLayersForLevel: ${this.totalLayersForLevel}, active layers: ${this.layers.length}`);
    } else {
      console.log(`No new layer generated: ${this.layersGeneratedThisLevel}/${this.totalLayersForLevel} layers already generated for this level`);
    }
    
    // Trigger save callback after all operations are complete
    if (this.onLayerClearedCallback) {
      this.onLayerClearedCallback();
    }
  }

  private getUnusedColorIndex(): number {
    const totalColors = SHAPE_TINTS.length;
    const visibleLayers = this.getVisibleLayers();
    
    // Get color indices of currently visible layers
    const usedColorIndices = new Set(
      visibleLayers.map(layer => layer.colorIndex % totalColors)
    );
    
    console.log(`Visible layers: ${visibleLayers.length}, Used color indices: [${Array.from(usedColorIndices).sort().join(', ')}]`);
    
    // Find the first unused color index
    for (let colorIndex = 0; colorIndex < totalColors; colorIndex++) {
      if (!usedColorIndices.has(colorIndex)) {
        console.log(`Selected unused color index ${colorIndex} for new layer`);
        return colorIndex;
      }
    }
    
    // If all colors are used (shouldn't happen with max 4 visible layers and 5 colors),
    // fall back to simple cycling
    const fallbackIndex = this.colorCounter % totalColors;
    console.log(`All colors used, falling back to color index ${fallbackIndex}`);
    this.colorCounter++; // Increment for next fallback
    return fallbackIndex;
  }

  private insertLayerByDepth(layer: Layer): void {
    // Insert layer in sorted order by depthIndex (highest depth first)
    let insertIndex = 0;
    for (let i = 0; i < this.layers.length; i++) {
      if (this.layers[i].depthIndex < layer.depthIndex) {
        insertIndex = i;
        break;
      }
      insertIndex = i + 1;
    }
    this.layers.splice(insertIndex, 0, layer);
    this.updateLayerIndices();
  }

  private updateLayerIndices(): void {
    this.layers.forEach((layer, layerIndex) => {
      layer.updateIndex(layerIndex);
    });
  }

  private updateLayerVisibility(): void {
    const maxVisible = GAME_CONFIG.layer.maxVisible;
    this.layers.forEach((layer) => {
      layer.updateVisibility(maxVisible, 0); // Always show from index 0
    });
  }

  public updateShapePositions(): void {
    // Create a copy of layers array to avoid modification during iteration
    const layersToCheck = [...this.layers];
    
    layersToCheck.forEach(layer => {
      layer.updateShapePositions();
      layer.updateFadeAnimation(); // Update fade animations
      
      // Check for shapes that have fallen off screen and remove them
      this.cleanupOffScreenShapes(layer);
      
      // Check if layer is now cleared (with potential delay for falling shapes)
      if (layer.isCleared()) {
        console.log(`Layer ${layer.id} is cleared, removing it`);
        this.onLayerCleared(layer);
      }
    });
    
    // Update screw positions and removability
    this.screwManager.updateScrewPositions();
    this.screwManager.updateScrewRemovability(this.getAllShapes(), (layerId: string) => {
      const layer = this.getLayer(layerId);
      return layer ? layer.depthIndex : -1;
    });
  }

  private cleanupOffScreenShapes(layer: Layer): void {
    const shapesToRemove: string[] = [];
    
    layer.getAllShapes().forEach(shape => {
      const pos = shape.position;
      
      // Only remove shapes that have fallen well below the screen
      // Allow shapes to fall off the bottom before removal
      // Keep generous margins on sides and top, but let shapes fall far below bottom
      const margin = 200;
      const fallDistance = 300; // Extra distance below screen before removal
      
      const shouldRemove = (
        pos.x < -margin || // Too far left
        pos.x > layer.bounds.x + layer.bounds.width + margin || // Too far right
        pos.y < -margin || // Too far above (shouldn't happen normally)
        pos.y > layer.bounds.y + layer.bounds.height + fallDistance // Fallen well below bottom
      );
      
      if (shouldRemove) {
        console.log(`Shape ${shape.id} fell off screen at (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}), bounds: (${layer.bounds.x}, ${layer.bounds.y}, ${layer.bounds.width.toFixed(0)}, ${layer.bounds.height.toFixed(0)}), removing...`);
        shapesToRemove.push(shape.id);
      }
    });
    
    // Remove off-screen shapes
    shapesToRemove.forEach(shapeId => {
      this.removeShape(shapeId);
    });
  }

  public getAllShapes(): Shape[] {
    return this.layers.flatMap(layer => layer.getAllShapes());
  }

  public getShapeById(shapeId: string): Shape | null {
    for (const layer of this.layers) {
      const shape = layer.getShape(shapeId);
      if (shape) return shape;
    }
    return null;
  }

  public getShapeAtPoint(point: { x: number; y: number }): Shape | null {
    // Check visible layers from front to back (lowest depth first)
    const visibleLayers = this.getVisibleLayers().sort((a, b) => a.depthIndex - b.depthIndex);
    
    for (const layer of visibleLayers) {
      const shape = layer.getShapeAtPoint(point);
      if (shape) return shape;
    }
    
    return null;
  }

  public initializeLevel(_levelNumber: number): void { // eslint-disable-line @typescript-eslint/no-unused-vars
    // Clear existing layers
    this.clearAllLayers();
    
    // Reset layer generation counter for new level
    this.layersGeneratedThisLevel = 0;
    
    // Create initial visible layers
    const initialLayers = Math.min(GAME_CONFIG.layer.maxVisible, this.maxLayers);
    for (let i = 0; i < initialLayers; i++) {
      const layer = this.createLayer();
      this.generateShapesForLayer(layer);
    }
    
    console.log(`Initialized level with ${initialLayers} layers. ${this.layersGeneratedThisLevel}/${this.totalLayersForLevel} total generated.`);
  }

  public clearAllLayers(): void {
    // Clear all screws first
    this.screwManager.clearAllScrews();
    
    // Remove all shapes from physics world
    const allBodies = this.layers.flatMap(layer => 
      layer.getAllShapes().map(shape => shape.body)
    );
    this.physicsWorld.removeBodies(allBodies);
    
    // Dispose all layers
    this.layers.forEach(layer => layer.dispose());
    this.layers = [];
    this.layerCounter = 0;
    this.depthCounter = 0;
    this.physicsGroupCounter = 0;
    this.colorCounter = 0; // Reset color counter
    this.layersGeneratedThisLevel = 0;
  }

  public isLevelComplete(): boolean {
    // Level is complete when all layers are cleared AND we've generated all layers for this level
    return this.layers.length === 0 && this.layersGeneratedThisLevel >= this.totalLayersForLevel;
  }

  public getLayersGeneratedThisLevel(): number {
    return this.layersGeneratedThisLevel;
  }

  public getTotalLayersForLevel(): number {
    return this.totalLayersForLevel;
  }

  public getRemainingShapeCount(): number {
    return this.layers.reduce((count, layer) => 
      count + layer.getShapeCount(), 0
    );
  }

  public getRemainingLayerCount(): number {
    return this.layers.filter(layer => !layer.isCleared()).length;
  }

  public createTestLevel(): void {
    // Create a single test layer with shapes for development
    const layer = this.createLayer();
    const testShapes = ShapeFactory.createTestShapes(layer.id, layer.index, layer.physicsLayerGroup, layer.colorIndex, 4, layer.getBounds());
    
    testShapes.forEach(shape => {
      layer.addShape(shape);
    });
    
    // Add to physics world
    const bodies = testShapes.map(shape => shape.body);
    this.physicsWorld.addBodies(bodies);
    
    // Generate screws for test shapes
    testShapes.forEach(shape => {
      this.screwManager.generateScrewsForShape(shape);
    });
    
    layer.setGenerated(true);
  }

  public getScrewManager(): ScrewManager {
    return this.screwManager;
  }

  public dispose(): void {
    this.clearAllLayers();
    this.screwManager.dispose();
  }

  // Serialization methods for save/load
  public toSerializable(): import('@/types/game').SerializableLayerManagerState {
    console.log(`Saving LayerManager state - layersGeneratedThisLevel: ${this.layersGeneratedThisLevel}, totalLayersForLevel: ${this.totalLayersForLevel}, active layers: ${this.layers.length}`);
    return {
      layers: this.layers.map(layer => layer.toSerializable()),
      layerCounter: this.layerCounter,
      depthCounter: this.depthCounter,
      physicsGroupCounter: this.physicsGroupCounter,
      colorCounter: this.colorCounter,
      totalLayersForLevel: this.totalLayersForLevel,
      layersGeneratedThisLevel: this.layersGeneratedThisLevel,
    };
  }

  public fromSerializable(data: import('@/types/game').SerializableLayerManagerState): void {
    console.log(`Loading LayerManager state - layersGeneratedThisLevel: ${data.layersGeneratedThisLevel}, totalLayersForLevel: ${data.totalLayersForLevel}, layers count: ${data.layers?.length || 0}`);
    
    // Clear existing state
    this.clearAllLayers();
    
    // Restore counters
    this.layerCounter = data.layerCounter;
    this.depthCounter = data.depthCounter;
    this.physicsGroupCounter = data.physicsGroupCounter;
    this.colorCounter = data.colorCounter;
    this.totalLayersForLevel = data.totalLayersForLevel;
    this.layersGeneratedThisLevel = data.layersGeneratedThisLevel;
    
    console.log(`After loading counters - layersGeneratedThisLevel: ${this.layersGeneratedThisLevel}, totalLayersForLevel: ${this.totalLayersForLevel}`);
    
    // Recreate layers
    if (data.layers) {
      data.layers.forEach(layerData => {
        const layer = new Layer(
          layerData.id,
          layerData.index,
          layerData.depthIndex,
          layerData.physicsLayerGroup,
          layerData.colorIndex,
          false // Don't fade in when loading
        );
        
        // Restore layer state
        layer.fromSerializable(layerData, this.physicsWorld, this.screwManager);
        
        // Add layer to manager
        this.layers.push(layer);
      });
    }
    
    // Sort layers by depth
    this.layers.sort((a, b) => b.depthIndex - a.depthIndex);
    
    // Update visibility
    this.updateLayerVisibility();
  }
}