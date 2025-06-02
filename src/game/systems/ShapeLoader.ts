import { ShapeDefinition, LoadedShapeDefinitions } from '@/types/shapes';

// Import all shape JSON files
import rectangleJson from '@/data/shapes/basic/rectangle.json';
import squareJson from '@/data/shapes/basic/square.json';
import circleJson from '@/data/shapes/basic/circle.json';
import triangleJson from '@/data/shapes/polygons/triangle.json';
import pentagonJson from '@/data/shapes/polygons/pentagon.json';
import hexagonJson from '@/data/shapes/polygons/hexagon.json';
import heptagonJson from '@/data/shapes/polygons/heptagon.json';
import octagonJson from '@/data/shapes/polygons/octagon.json';
import arrowJson from '@/data/shapes/paths/arrow.json';
import chevronJson from '@/data/shapes/paths/chevron.json';
import starJson from '@/data/shapes/paths/star.json';
import horseshoeJson from '@/data/shapes/paths/horseshoe.json';
import capsuleJson from '@/data/shapes/composite/capsule.json';

export class ShapeLoader {
  private static readonly SHAPE_DEFINITIONS: Record<string, unknown> = {
    rectangle: rectangleJson,
    square: squareJson,
    circle: circleJson,
    triangle: triangleJson,
    pentagon: pentagonJson,
    hexagon: hexagonJson,
    heptagon: heptagonJson,
    octagon: octagonJson,
    arrow: arrowJson,
    chevron: chevronJson,
    star: starJson,
    horseshoe: horseshoeJson,
    capsule: capsuleJson,
  };

  public static async loadShapeDefinitions(): Promise<LoadedShapeDefinitions> {
    const definitions: LoadedShapeDefinitions = {};
    
    // Load and validate each shape definition
    for (const [id, definition] of Object.entries(this.SHAPE_DEFINITIONS)) {
      try {
        const validatedDefinition = this.validateShapeDefinition(definition);
        definitions[id] = validatedDefinition;
      } catch (error) {
        console.error(`Failed to load shape definition for ${id}:`, error);
      }
    }
    
    return definitions;
  }

  private static validateShapeDefinition(def: unknown): ShapeDefinition {
    // Type guard
    const definition = def as Record<string, unknown>;
    
    // Basic validation
    if (!definition.id || typeof definition.id !== 'string') {
      throw new Error('Shape definition must have an id');
    }
    
    if (!definition.name || typeof definition.name !== 'string') {
      throw new Error('Shape definition must have a name');
    }
    
    if (!['basic', 'polygon', 'path', 'composite'].includes(definition.category as string)) {
      throw new Error('Shape definition must have a valid category');
    }
    
    // Validate dimensions
    if (!definition.dimensions || typeof definition.dimensions !== 'object') {
      throw new Error('Shape definition must have dimensions');
    }
    
    const dimensions = definition.dimensions as Record<string, unknown>;
    if (!['fixed', 'random'].includes(dimensions.type as string)) {
      throw new Error('Shape dimensions must have a valid type');
    }
    
    // Validate physics
    if (!definition.physics || typeof definition.physics !== 'object') {
      throw new Error('Shape definition must have physics configuration');
    }
    
    const physics = definition.physics as Record<string, unknown>;
    if (!['rectangle', 'circle', 'polygon', 'fromVertices', 'composite'].includes(physics.type as string)) {
      throw new Error('Shape physics must have a valid type');
    }
    
    // Validate rendering
    if (!definition.rendering || typeof definition.rendering !== 'object') {
      throw new Error('Shape definition must have rendering configuration');
    }
    
    const rendering = definition.rendering as Record<string, unknown>;
    if (!['primitive', 'path', 'composite'].includes(rendering.type as string)) {
      throw new Error('Shape rendering must have a valid type');
    }
    
    // Validate screw placement
    if (!definition.screwPlacement || typeof definition.screwPlacement !== 'object') {
      throw new Error('Shape definition must have screw placement configuration');
    }
    
    const screwPlacement = definition.screwPlacement as Record<string, unknown>;
    if (!['corners', 'perimeter', 'grid', 'custom', 'capsule'].includes(screwPlacement.strategy as string)) {
      throw new Error('Shape screw placement must have a valid strategy');
    }
    
    // Apply defaults and return as ShapeDefinition
    const visual = definition.visual as Record<string, unknown> | undefined;
    const behavior = definition.behavior as Record<string, unknown> | undefined;
    
    const result: ShapeDefinition = {
      id: definition.id as string,
      name: definition.name as string,
      category: definition.category as 'basic' | 'polygon' | 'path' | 'composite',
      dimensions: {
        ...dimensions,
        reductionFactor: (dimensions.reductionFactor as number) ?? 0.15,
      } as ShapeDefinition['dimensions'],
      physics: physics as ShapeDefinition['physics'],
      rendering: rendering as ShapeDefinition['rendering'],
      visual: {
        borderWidth: (visual?.borderWidth as number) ?? 3,
        alpha: (visual?.alpha as number) ?? 0.7,
        supportsHoles: (visual?.supportsHoles as boolean) ?? true,
        ...(visual || {}),
      } as ShapeDefinition['visual'],
      behavior: {
        allowSingleScrew: (behavior?.allowSingleScrew as boolean) ?? true,
        singleScrewDynamic: (behavior?.singleScrewDynamic as boolean) ?? true,
        rotationalInertiaMultiplier: (behavior?.rotationalInertiaMultiplier as number) ?? 3,
        ...(behavior || {}),
      } as ShapeDefinition['behavior'],
      screwPlacement: {
        ...screwPlacement,
        minSeparation: (screwPlacement.minSeparation as number) ?? 48,
      } as ShapeDefinition['screwPlacement'],
    };
    
    return result;
  }
}