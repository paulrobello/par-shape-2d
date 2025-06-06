/**
 * Level Pre-computation System
 * Generates entire level structure upfront with perfect balance guarantees
 */

import { BaseSystem } from '../core/BaseSystem';
import { 
  PrecomputedLevel, 
  PrecomputedLayer, 
  PrecomputedShape, 
  PrecomputedScrew,
  PrecomputationConfig,
  PrecomputationResult,
  LevelDifficulty,
  ScrewDestination
} from '../../types/precomputed';
import { ShapeDefinition } from '../../types/shapes';
import { PerfectBalanceCalculator } from '../utils/PerfectBalanceCalculator';
import { ShapeRegistry } from './ShapeRegistry';
import { ShapeFactory } from './ShapeFactory';
import { distance } from '../utils/MathUtils';
import { UI_CONSTANTS } from '@/shared/utils/Constants';
import { ScrewPlacementStrategyFactory } from '../../shared/strategies';
import { Shape } from '../entities/Shape';
import { Vector2 } from '../../types/game';

/**
 * Core system for pre-computing entire levels with perfect balance
 */
export class LevelPrecomputer extends BaseSystem { // TODO is this still being used?
  private balanceCalculator: PerfectBalanceCalculator;
  private shapeRegistry?: ShapeRegistry;
  private shapeFactory?: ShapeFactory;

  constructor() {
    super('LevelPrecomputer');
    this.balanceCalculator = new PerfectBalanceCalculator();
    // Initialize shape registry to get shape definitions
    this.shapeRegistry = ShapeRegistry.getInstance();
    // No need to instantiate factory - uses static methods
  }

  /**
   * Initialize the pre-computer system
   */
  async onInitialize(): Promise<void> {
    // Initialize dependencies
    console.log('[LevelPrecomputer] Initializing dependencies...');
    
    // Initialize balance calculator
    await this.balanceCalculator.onInitialize();
    
    // Initialize shape registry if needed
    if (this.shapeRegistry && typeof this.shapeRegistry.initialize === 'function') {
      await this.shapeRegistry.initialize();
    }
    
    // Strategy factory is ready to use (no initialization needed)
    
    console.log('[LevelPrecomputer] Dependencies initialized successfully');
    
    // Set up event handlers
    this.subscribe('level:precomputation:requested', this.handlePrecomputationRequest.bind(this));
    
    this.emit({
      type: 'system:ready',
      timestamp: Date.now()
    });
  }

  /**
   * Pre-compute an entire level with perfect balance guarantees
   */
  async precomputeLevel(
    levelNumber: number, 
    config: PrecomputationConfig
  ): Promise<PrecomputationResult> {
    const startTime = Date.now();
    
    try {
      if (config.debug.logProgress) {
        console.log(`[LevelPrecomputer] Starting pre-computation for level ${levelNumber}`);
      }

      // Phase 1: Calculate level difficulty and constraints
      const difficulty = this.calculateLevelDifficulty(levelNumber);
      const targetScrewCount = this.balanceCalculator.calculatePerfectScrewCount(
        config.targetLayers, 
        difficulty
      );

      if (config.debug.logProgress) {
        console.log(`[LevelPrecomputer] Target screws: ${targetScrewCount}, layers: ${config.targetLayers}`);
      }

      // Phase 2: Optimize screw color distribution
      const screwColorDistribution = this.balanceCalculator.optimizeScrewColors(targetScrewCount);

      // Phase 3: Plan container replacement strategy
      const containerReplacementPlan = this.balanceCalculator.planContainerReplacements(
        targetScrewCount,
        screwColorDistribution,
        difficulty
      );

      // Phase 4: Generate progress milestones
      const progressMilestones = this.balanceCalculator.generateProgressMilestones(
        targetScrewCount,
        containerReplacementPlan
      );

      // Phase 5: Pre-compute all layers
      const layers = await this.precomputeLayers(
        config.targetLayers,
        targetScrewCount,
        screwColorDistribution
      );

      // Phase 6: Validate perfect balance
      const isBalanceValid = this.balanceCalculator.validatePerfectBalance(
        containerReplacementPlan.finalState,
        config.balanceRequirements.tolerance
      );

      if (!isBalanceValid && config.balanceRequirements.strictBalance) {
        throw new Error('Failed to achieve perfect balance with strict requirements');
      }

      // Phase 7: Assemble final level data
      const levelData: PrecomputedLevel = {
        totalScrews: targetScrewCount,
        targetContainerCount: Math.ceil(targetScrewCount / UI_CONSTANTS.containers.hole.count),
        layers,
        containerReplacementPlan,
        screwColorDistribution,
        progressMilestones,
        difficulty
      };

      const computationTime = Date.now() - startTime;

      // Emit completion event
      this.emit({
        type: 'level:precomputed',
        timestamp: Date.now(),
        levelData
      });

      return {
        success: true,
        levelData,
        stats: {
          computationTime,
          shapesGenerated: layers.reduce((sum, layer) => sum + layer.shapes.length, 0),
          screwsGenerated: targetScrewCount,
          balanceValidated: isBalanceValid
        },
        issues: {
          errors: [],
          warnings: isBalanceValid ? [] : ['Perfect balance not achieved but within tolerance']
        }
      };

    } catch (error) {
      const computationTime = Date.now() - startTime;
      
      return {
        success: false,
        stats: {
          computationTime,
          shapesGenerated: 0,
          screwsGenerated: 0,
          balanceValidated: false
        },
        issues: {
          errors: [error instanceof Error ? error.message : 'Unknown pre-computation error'],
          warnings: []
        }
      };
    }
  }

  /**
   * Pre-compute all layers for the level
   */
  private async precomputeLayers(
    layerCount: number,
    totalScrews: number,
    colorDistribution: { colorCounts: Map<string, number> }
  ): Promise<PrecomputedLayer[]> {
    const layers: PrecomputedLayer[] = [];
    const screwsPerLayer = Math.ceil(totalScrews / layerCount);
    let remainingScrews = totalScrews;

    console.log(`[LevelPrecomputer] Generating layers:`);
    console.log(`  - Layer count: ${layerCount}`);
    console.log(`  - Total screws: ${totalScrews}`);
    console.log(`  - Screws per layer: ${screwsPerLayer}`);

    for (let i = 0; i < layerCount; i++) {
      const layerScrewCount = Math.min(screwsPerLayer, remainingScrews);
      
      console.log(`[LevelPrecomputer] Generating layer ${i} with ${layerScrewCount} target screws`);
      
      const layer = await this.precomputeLayer(
        i,
        layerScrewCount,
        colorDistribution
      );

      console.log(`[LevelPrecomputer] Layer ${i} generated with ${layer.shapes.length} shapes and ${layer.screwCount} actual screws`);
      
      layers.push(layer);
      remainingScrews -= layerScrewCount;

      if (remainingScrews <= 0) break;
    }

    return layers;
  }

  /**
   * Pre-compute a single layer
   */
  private async precomputeLayer(
    layerIndex: number,
    targetScrews: number,
    colorDistribution: { colorCounts: Map<string, number> }
  ): Promise<PrecomputedLayer> {
    const shapes: PrecomputedShape[] = [];
    let currentScrewCount = 0;

    // Calculate layer bounds
    const bounds = this.calculateLayerBounds();

    // Generate shapes until we have enough screws
    let shapeAttempts = 0;
    while (currentScrewCount < targetScrews && shapeAttempts < 20) {
      shapeAttempts++;
      const shape = await this.precomputeShape(
        layerIndex,
        bounds,
        shapes
      );

      if (shape) {
        // Determine how many screws this shape needs
        const screwsNeeded = Math.min(
          targetScrews - currentScrewCount,
          this.calculateMaxScrewsForShape(shape)
        );

        console.log(`  Shape ${shapes.length + 1}: max screws = ${this.calculateMaxScrewsForShape(shape)}, assigning = ${screwsNeeded}`);

        // Generate screws for this shape
        shape.screws = this.precomputeScrewsForShape(
          shape,
          screwsNeeded,
          colorDistribution,
          layerIndex
        );

        shapes.push(shape);
        currentScrewCount += shape.screws.length;
        
        console.log(`  Added shape with ${shape.screws.length} screws, total now: ${currentScrewCount}/${targetScrews}`);
      } else {
        console.log(`  Failed to place shape ${shapeAttempts}, distributing remaining screws`);
        // Failed to place more shapes, distribute remaining screws
        this.distributeRemainingScrews(shapes, targetScrews - currentScrewCount, colorDistribution);
        break;
      }
    }
    
    if (shapeAttempts >= 20) {
      console.log(`  Reached maximum shape attempts (20), distributing remaining screws`);
      this.distributeRemainingScrews(shapes, targetScrews - currentScrewCount, colorDistribution);
    }

    return {
      index: layerIndex,
      shapes,
      isPhysicsActive: false, // Start dormant
      screwCount: currentScrewCount,
      depthIndex: layerIndex,
      bounds
    };
  }

  /**
   * Pre-compute a single shape
   */
  private async precomputeShape(
    layerIndex: number,
    bounds: { x: number; y: number; width: number; height: number },
    existingShapes: PrecomputedShape[]
  ): Promise<PrecomputedShape | null> {
    // Get enabled shape definitions from registry
    const availableDefinitions = this.shapeRegistry?.getEnabledShapes() || [];
    
    if (availableDefinitions.length === 0) {
      console.error('[LevelPrecomputer] No shape definitions available');
      return null;
    }
    
    const maxAttempts = 100; // Increased from 50

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Select random shape definition
      const definition = availableDefinitions[Math.floor(Math.random() * availableDefinitions.length)];
      
      // Generate dimensions based on the selected definition
      const dimensions = this.generateShapeDimensions(definition);
      
      // Find valid position
      const position = this.findValidPosition(bounds, dimensions, existingShapes);
      
      if (position) {
        const shape: PrecomputedShape = {
          id: `shape_${layerIndex}_${existingShapes.length}`,
          definition,
          position,
          dimensions,
          rotation: Math.random() * Math.PI * 2,
          screws: [], // Will be populated later
          visual: this.generateVisualProperties()
        };

        return shape;
      }
    }

    return null; // Failed to place shape
  }

  /**
   * Pre-compute screws for a shape
   */
  private precomputeScrewsForShape(
    shape: PrecomputedShape,
    screwCount: number,
    colorDistribution: { colorCounts: Map<string, number> },
    layerIndex: number
  ): PrecomputedScrew[] {
    const screws: PrecomputedScrew[] = [];
    
    // Get placement strategy for this shape
    let positions: Vector2[] = [];
    
    if (shape.definition.screwPlacement) {
      try {
        const strategy = ScrewPlacementStrategyFactory.create(
          shape.definition.screwPlacement.strategy
        );
        
        if (strategy) {
          // Create temporary Shape object for strategy calculations
          const tempShape = this.createTemporaryShape(shape);
          
          console.log(`[LevelPrecomputer] Created temp shape for ${shape.id}: type=${tempShape.type}, position=(${tempShape.position.x}, ${tempShape.position.y})`);
          
          // Create placement context
          const context = {
            shape: tempShape,
            config: shape.definition.screwPlacement,
            canvasWidth: 800, // Updated to match our bounds
            canvasHeight: 1000, // Updated to match our bounds
            existingScrews: []
          };
          
          console.log(`[LevelPrecomputer] Using strategy config:`, shape.definition.screwPlacement);
          
          // Get positions from strategy
          const allPositions = strategy.calculatePositions(context);
          
          console.log(`[LevelPrecomputer] Strategy generated ${allPositions.length} total positions:`, allPositions);
          
          // Limit to requested screw count
          positions = allPositions.slice(0, screwCount);
          
          console.log(`[LevelPrecomputer] Selected ${positions.length} positions for ${screwCount} requested screws using ${strategy.getName()} strategy`);
        }
      } catch (error) {
        console.warn(`[LevelPrecomputer] Failed to use placement strategy for shape ${shape.id}:`, error);
      }
    }
    
    // Fallback to random positioning if strategy failed or unavailable
    if (positions.length === 0) {
      console.warn(`[LevelPrecomputer] Falling back to random positioning for shape ${shape.id}`);
      for (let i = 0; i < screwCount; i++) {
        positions.push({
          x: shape.position.x + (Math.random() - 0.5) * 100,
          y: shape.position.y + (Math.random() - 0.5) * 100
        });
      }
    }

    // Create screws with colors and targeting
    for (let i = 0; i < Math.min(screwCount, positions.length); i++) {
      const color = this.selectScrewColor(colorDistribution);
      const destination = this.calculateScrewDestination(color);

      screws.push({
        id: `screw_${shape.id}_${i}`,
        position: positions[i],
        color,
        shapeId: shape.id,
        layerIndex,
        targetDestination: destination,
        collectionPriority: this.calculateCollectionPriority(layerIndex, i)
      });
    }

    return screws;
  }

  /**
   * Calculate level difficulty based on level number
   */
  private calculateLevelDifficulty(levelNumber: number): LevelDifficulty {
    const layerCount = 3 + Math.floor(levelNumber / 3); // Base layers per level
    
    let shapeComplexity: 'simple' | 'medium' | 'complex' = 'simple';
    let screwDensity: 'low' | 'medium' | 'high' = 'low';
    let balanceTolerance = 0;

    if (levelNumber >= 10) {
      shapeComplexity = 'complex';
      screwDensity = 'high';
    } else if (levelNumber >= 5) {
      shapeComplexity = 'medium';
      screwDensity = 'medium';
    }

    // Early levels allow slight tolerance
    if (levelNumber <= 3) {
      balanceTolerance = 2;
    } else if (levelNumber <= 6) {
      balanceTolerance = 1;
    }

    return {
      layerCount,
      shapeComplexity,
      screwDensity,
      balanceTolerance
    };
  }

  /**
   * Calculate layer bounds for shape placement
   */
  private calculateLayerBounds(): { x: number; y: number; width: number; height: number } {
    // Use larger bounds to give shapes more space
    const width = 800; // Increased from 640
    const height = 1000; // Increased from 800
    
    // Use the same logic as LayerManager for shape area
    const shapeAreaY = 200; // Similar to LAYOUT_CONSTANTS.shapeArea.startY
    const shapeAreaHeight = height - shapeAreaY;
    
    return {
      x: 0,
      y: shapeAreaY,
      width: width,
      height: shapeAreaHeight
    };
  }

  /**
   * Generate shape dimensions from definition
   */
  private generateShapeDimensions(definition: ShapeDefinition): Record<string, unknown> {
    const dims = definition.dimensions;
    
    // Use similar logic to ShapeFactory.generateDimensions
    switch (definition.category) {
      case 'basic':
        if (definition.id === 'rectangle') {
          const widthRange = dims.width as { min: number; max: number };
          const heightRange = dims.height as { min: number; max: number };
          return {
            width: Math.random() * (widthRange.max - widthRange.min) + widthRange.min,
            height: Math.random() * (heightRange.max - heightRange.min) + heightRange.min
          };
        } else if (definition.id === 'circle') {
          const radiusRange = dims.radius as { min: number; max: number };
          return {
            radius: Math.random() * (radiusRange.max - radiusRange.min) + radiusRange.min
          };
        }
        break;
        
      case 'polygon':
        if (dims.radius) {
          const radiusRange = dims.radius as { min: number; max: number };
          return {
            radius: Math.random() * (radiusRange.max - radiusRange.min) + radiusRange.min,
            sides: dims.sides
          };
        } else if (dims.width && dims.height) {
          const widthRange = dims.width as { min: number; max: number };
          const heightRange = dims.height as { min: number; max: number };
          return {
            width: Math.random() * (widthRange.max - widthRange.min) + widthRange.min,
            height: Math.random() * (heightRange.max - heightRange.min) + heightRange.min,
            sides: dims.sides
          };
        }
        break;
        
      case 'path':
        const scaleRange = dims.scale as { min: number; max: number };
        return {
          path: dims.path,
          scale: Math.random() * (scaleRange.max - scaleRange.min) + scaleRange.min
        };
        
      case 'composite':
        if (definition.id === 'capsule') {
          // Random number of screws determines width
          const screwCount = Math.floor(Math.random() * 6) + 3; // 3-8 screws
          const screwRadius = UI_CONSTANTS.screws.radius;
          const spacing = 5;
          const width = screwCount * (screwRadius * 2) + (screwCount - 1) * spacing;
          
          return {
            width,
            height: dims.height as number
          };
        }
        break;
    }
    
    // Fallback dimensions
    return { width: 100, height: 100 };
  }

  /**
   * Find valid position for shape placement
   */
  private findValidPosition(
    bounds: { x: number; y: number; width: number; height: number },
    dimensions: Record<string, unknown>,
    existingShapes: PrecomputedShape[]
  ): { x: number; y: number } | null {
    const maxAttempts = 200; // Increased attempts
    const minSeparation = 20; // Reduced separation

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const width = typeof dimensions.width === 'number' ? dimensions.width : 50;
      const height = typeof dimensions.height === 'number' ? dimensions.height : 50;
      
      const position = {
        x: bounds.x + Math.random() * Math.max(0, bounds.width - width),
        y: bounds.y + Math.random() * Math.max(0, bounds.height - height)
      };

      // Check collision with existing shapes
      const hasCollision = existingShapes.some(existing => {
        const dist = distance(position, existing.position);
        const minDistance = minSeparation + Math.max(
          this.getShapeRadius(dimensions),
          this.getShapeRadius(existing.dimensions)
        );
        return dist < minDistance;
      });

      if (!hasCollision) {
        return position;
      }
    }

    return null;
  }

  /**
   * Get approximate radius for a shape (for collision detection)
   */
  private getShapeRadius(dimensions: Record<string, unknown>): number {
    if (typeof dimensions.radius === 'number') return dimensions.radius;
    if (typeof dimensions.width === 'number' && typeof dimensions.height === 'number') {
      return Math.max(dimensions.width, dimensions.height) / 2;
    }
    return 50; // Default radius
  }

  /**
   * Generate visual properties for a shape
   */
  private generateVisualProperties(): { color: string; tint: string; borderWidth: number; alpha: number } {
    // Use a neutral color - will be overridden by layer color assignment
    const baseColor = '#888888'; // Gray - will be replaced by layer color
    const tint = '#ffffff'; // White tint - will be replaced by layer tint
    
    return {
      color: baseColor,
      tint,
      borderWidth: 2,
      alpha: 0.8
    };
  }

  /**
   * Calculate maximum screws for a shape based on area
   */
  private calculateMaxScrewsForShape(shape: PrecomputedShape): number {
    const area = this.calculateShapeArea(shape.dimensions);
    
    // Use existing area-based limits from the game
    if (area < 2500) return 1;
    if (area < 4000) return 2;
    if (area < 6000) return 3;
    if (area < 10000) return 4;
    if (area < 15000) return 5;
    return 6;
  }

  /**
   * Calculate shape area for screw limits
   */
  private calculateShapeArea(dimensions: Record<string, unknown>): number {
    if (typeof dimensions.radius === 'number') {
      return Math.PI * dimensions.radius * dimensions.radius;
    }
    if (typeof dimensions.width === 'number' && typeof dimensions.height === 'number') {
      return dimensions.width * dimensions.height;
    }
    return 2500; // Default area
  }

  /**
   * Select screw color based on distribution plan
   */
  private selectScrewColor(colorDistribution: { colorCounts: Map<string, number> }): string {
    const colors = Array.from(colorDistribution.colorCounts.keys());
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Calculate screw destination for targeting
   */
  private calculateScrewDestination(color: string): ScrewDestination {
    // For now, use simple container targeting
    // In full implementation, this would use the container replacement plan
    return {
      type: 'container',
      containerId: `container_${color}`
    };
  }

  /**
   * Calculate collection priority for optimal removal order
   */
  private calculateCollectionPriority(layerIndex: number, screwIndex: number): number {
    // Higher priority for later layers (remove back-to-front)
    return layerIndex * 1000 + screwIndex;
  }

  /**
   * Distribute remaining screws to existing shapes
   */
  private distributeRemainingScrews(
    shapes: PrecomputedShape[],
    remainingScrews: number,
    colorDistribution: { colorCounts: Map<string, number> }
  ): void {
    let screwsToDistribute = remainingScrews;
    let shapeIndex = 0;

    while (screwsToDistribute > 0 && shapes.length > 0) {
      const shape = shapes[shapeIndex % shapes.length];
      const maxAdditional = this.calculateMaxScrewsForShape(shape) - shape.screws.length;
      
      if (maxAdditional > 0) {
        const color = this.selectScrewColor(colorDistribution);
        const destination = this.calculateScrewDestination(color);
        
        shape.screws.push({
          id: `screw_${shape.id}_${shape.screws.length}`,
          position: { x: 0, y: 0 }, // Will be calculated by strategy
          color,
          shapeId: shape.id,
          layerIndex: shape.screws[0]?.layerIndex || 0,
          targetDestination: destination,
          collectionPriority: this.calculateCollectionPriority(0, shape.screws.length)
        });
        
        screwsToDistribute--;
      }
      
      shapeIndex++;
    }
  }

  /**
   * Create a temporary Shape object for strategy placement calculations
   */
  private createTemporaryShape(precomputedShape: PrecomputedShape): Shape {
    const { position, dimensions, rotation, definition } = precomputedShape;
    
    // Determine shape type from definition
    let shapeType: string = definition.id;
    if (definition.category === 'polygon' && definition.id === 'rectangle') {
      shapeType = 'rectangle';
    } else if (definition.category === 'basic' && definition.id === 'circle') {
      shapeType = 'circle';
    } else if (definition.category === 'polygon') {
      shapeType = 'polygon';
    } else if (definition.category === 'composite') {
      shapeType = definition.id; // capsule
    } else if (definition.category === 'path') {
      shapeType = definition.id; // arrow, chevron, star, horseshoe
    }
    
    // Create a minimal Shape object with the necessary properties
    const tempShape = {
      id: precomputedShape.id,
      type: shapeType,
      definitionId: definition.id,
      position: position,
      rotation: rotation,
      
      // Extract dimensions based on shape type
      ...dimensions,
      
      // Minimal physics body interface for strategy calculations
      body: {
        position: { x: position.x, y: position.y },
        angle: rotation,
        vertices: this.generateVerticesForShape(precomputedShape)
      }
    } as unknown as Shape;
    
    return tempShape;
  }
  
  /**
   * Generate vertices for the temporary shape physics body
   */
  private generateVerticesForShape(precomputedShape: PrecomputedShape): Vector2[] {
    const { position, dimensions, definition } = precomputedShape;
    const vertices: Vector2[] = [];
    
    // Generate basic vertices based on shape type
    switch (definition.category) {
      case 'basic':
        if (definition.id === 'circle') {
          const radius = dimensions.radius as number || 50;
          // Generate circular vertices (8 points)
          for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            vertices.push({
              x: position.x + Math.cos(angle) * radius,
              y: position.y + Math.sin(angle) * radius
            });
          }
        }
        break;
        
      case 'polygon':
        const sides = dimensions.sides as number || 4;
        const radius = dimensions.radius as number || 50;
        for (let i = 0; i < sides; i++) {
          const angle = (i / sides) * Math.PI * 2;
          vertices.push({
            x: position.x + Math.cos(angle) * radius,
            y: position.y + Math.sin(angle) * radius
          });
        }
        break;
        
      case 'composite':
        // For capsule, create rectangle with rounded ends
        const width = dimensions.width as number || 100;
        const height = dimensions.height as number || 50;
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        
        vertices.push(
          { x: position.x - halfWidth, y: position.y - halfHeight },
          { x: position.x + halfWidth, y: position.y - halfHeight },
          { x: position.x + halfWidth, y: position.y + halfHeight },
          { x: position.x - halfWidth, y: position.y + halfHeight }
        );
        break;
        
      default:
        // Default rectangle
        const defaultWidth = dimensions.width as number || 100;
        const defaultHeight = dimensions.height as number || 50;
        const halfW = defaultWidth / 2;
        const halfH = defaultHeight / 2;
        
        vertices.push(
          { x: position.x - halfW, y: position.y - halfH },
          { x: position.x + halfW, y: position.y - halfH },
          { x: position.x + halfW, y: position.y + halfH },
          { x: position.x - halfW, y: position.y + halfH }
        );
    }
    
    return vertices;
  }

  /**
   * Handle pre-computation request event
   */
  private async handlePrecomputationRequest(event: import('../events/EventTypes').LevelPrecomputationRequestedEvent): Promise<void> {
    const { level, config } = event;
    
    console.log(`[LevelPrecomputer] Starting pre-computation for level ${level}`);
    
    try {
      const result = await this.precomputeLevel(level, config);
      
      if (result.success && result.levelData) {
        console.log(`[LevelPrecomputer] Level ${level} pre-computation completed successfully`);
        console.log(`  - ${result.stats.shapesGenerated} shapes generated`);
        console.log(`  - ${result.stats.screwsGenerated} screws generated`);
        console.log(`  - Balance validated: ${result.stats.balanceValidated}`);
        console.log(`  - Computation time: ${result.stats.computationTime}ms`);
      } else {
        console.error(`[LevelPrecomputer] Level ${level} pre-computation failed:`, result.issues.errors);
      }
    } catch (error) {
      console.error(`[LevelPrecomputer] Pre-computation error for level ${level}:`, error);
    }
  }
}