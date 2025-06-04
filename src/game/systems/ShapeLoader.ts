import { LoadedShapeDefinitions } from '@/types/shapes';
import { ShapeValidator } from '@/shared/validation';

// Import all shape JSON files
import circleJson from '@/data/shapes/basic/circle.json';
import triangleJson from '@/data/shapes/polygons/triangle.json';
import pentagonJson from '@/data/shapes/polygons/pentagon.json';
import hexagonJson from '@/data/shapes/polygons/hexagon.json';
import heptagonJson from '@/data/shapes/polygons/heptagon.json';
import octagonJson from '@/data/shapes/polygons/octagon.json';
import polygonSquareJson from '@/data/shapes/polygons/square.json';
import polygonRectangleJson from '@/data/shapes/polygons/rectangle.json';
import arrowJson from '@/data/shapes/paths/arrow.json';
import chevronJson from '@/data/shapes/paths/chevron.json';
import starJson from '@/data/shapes/paths/star.json';
import horseshoeJson from '@/data/shapes/paths/horseshoe.json';
import capsuleJson from '@/data/shapes/composite/capsule.json';

export class ShapeLoader {
  private static readonly SHAPE_DEFINITIONS: Record<string, unknown> = {
    circle: circleJson,
    triangle: triangleJson,
    pentagon: pentagonJson,
    hexagon: hexagonJson,
    heptagon: heptagonJson,
    octagon: octagonJson,
    square: polygonSquareJson,
    rectangle: polygonRectangleJson,
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
        const validationResult = ShapeValidator.validateWithDefaults(definition);
        
        if (!validationResult.isValid) {
          console.error(`Invalid shape definition for ${id}:`, validationResult.errors.join(', '));
          continue;
        }

        if (!validationResult.validatedShape) {
          console.error(`Failed to validate shape definition for ${id}: no validated shape returned`);
          continue;
        }

        definitions[id] = validationResult.validatedShape;

        // Log applied defaults for debugging
        if (validationResult.appliedDefaults && validationResult.appliedDefaults.length > 0) {
          console.log(`Applied defaults for ${id}:`, validationResult.appliedDefaults);
        }

        // Log warnings if any
        if (validationResult.warnings && validationResult.warnings.length > 0) {
          console.warn(`Warnings for ${id}:`, validationResult.warnings.join(', '));
        }
      } catch (error) {
        console.error(`Failed to load shape definition for ${id}:`, error);
      }
    }
    
    return definitions;
  }

}