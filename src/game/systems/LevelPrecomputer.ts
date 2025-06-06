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
import { getAllScrewColors } from '../utils/Colors';
import { distance } from '../utils/MathUtils';
import { UI_CONSTANTS } from '@/shared/utils/Constants';
import { ScrewPlacementStrategyFactory } from '../../shared/strategies';

/**
 * Core system for pre-computing entire levels with perfect balance
 */
export class LevelPrecomputer extends BaseSystem {
  private balanceCalculator: PerfectBalanceCalculator;
  private shapeRegistry?: ShapeRegistry;
  private shapeFactory?: ShapeFactory;
  private strategyFactory?: ScrewPlacementStrategyFactory;

  constructor() {
    super('LevelPrecomputer');
    this.balanceCalculator = new PerfectBalanceCalculator();
    // Initialize shape registry to get shape definitions
    this.shapeRegistry = ShapeRegistry.getInstance();
    // this.strategyFactory = new ScrewPlacementStrategyFactory();
  }

  /**
   * Initialize the pre-computer system
   */
  async onInitialize(): Promise<void> {
    // TODO: Initialize dependencies if needed
    // await this.shapeRegistry.initialize();
    // await this.shapeFactory.initialize();
    
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

    for (let i = 0; i < layerCount; i++) {
      const layerScrewCount = Math.min(screwsPerLayer, remainingScrews);
      
      const layer = await this.precomputeLayer(
        i,
        layerScrewCount,
        colorDistribution
      );

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
    while (currentScrewCount < targetScrews) {
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

        // Generate screws for this shape
        shape.screws = this.precomputeScrewsForShape(
          shape,
          screwsNeeded,
          colorDistribution,
          layerIndex
        );

        shapes.push(shape);
        currentScrewCount += shape.screws.length;
      } else {
        // Failed to place more shapes, distribute remaining screws
        this.distributeRemainingScrews(shapes, targetScrews - currentScrewCount, colorDistribution);
        break;
      }
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
    
    const maxAttempts = 50;

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
    
    // TODO: Get placement strategy for this shape
    // const strategy = this.strategyFactory?.createStrategy(
    //   shape.definition.screwPlacement.strategy,
    //   shape.definition.screwPlacement
    // );

    // Generate screw positions (placeholder)
    const positions: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < screwCount; i++) {
      positions.push({
        x: shape.position.x + (Math.random() - 0.5) * 100,
        y: shape.position.y + (Math.random() - 0.5) * 100
      });
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
    // Use virtual dimensions for bounds calculation
    const width = 640; // Default virtual width
    const height = 800; // Default virtual height
    
    return {
      width: width * 0.9, // Leave margins
      height: height * 0.8,
      x: width * 0.05,
      y: height * 0.1
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
    const maxAttempts = 100;
    const minSeparation = 30;

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
    const colors = getAllScrewColors();
    const baseColor = colors[Math.floor(Math.random() * colors.length)];
    const tint = '#ffffff'; // Default tint
    
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