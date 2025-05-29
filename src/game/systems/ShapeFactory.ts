import { Bodies, Body } from 'matter-js';
import { Shape } from '@/game/entities/Shape';
import { ShapeType, Vector2 } from '@/types/game';
import { PHYSICS_CONSTANTS, SHAPE_TINTS } from '@/game/utils/Constants';
import { randomBetween, createRegularPolygonVertices } from '@/game/utils/MathUtils';

export class ShapeFactory {
  private static shapeCounter = 0;

  public static createRandomShape(
    position: Vector2,
    layerId: string,
    layerIndex: number,
    physicsLayerGroup: number,
    colorIndex: number,
    existingShapes: Shape[] = [],
    layerBounds: { x: number; y: number; width: number; height: number }
  ): Shape {
    const shapeTypes: ShapeType[] = ['rectangle', 'square', 'circle', 'triangle', 'star'];
    const type = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
    
    return this.createShape(type, position, layerId, layerIndex, physicsLayerGroup, colorIndex, existingShapes, layerBounds);
  }

  public static createShape(
    type: ShapeType,
    position: Vector2,
    layerId: string,
    layerIndex: number,
    physicsLayerGroup: number,
    colorIndex: number,
    existingShapes: Shape[] = [],
    layerBounds: { x: number; y: number; width: number; height: number }
  ): Shape {
    const id = `shape-${++this.shapeCounter}`;
    
    // Attempt to place shape without overlap
    const finalPosition = this.findNonOverlappingPosition(position, type, existingShapes, 50, layerBounds);
    
    let body: Body;
    let dimensions: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
    
    switch (type) {
      case 'rectangle':
        dimensions = this.createRectangleDimensions();
        body = this.createRectangleBody(finalPosition, dimensions);
        break;
      case 'square':
        dimensions = this.createSquareDimensions();
        body = this.createRectangleBody(finalPosition, dimensions);
        break;
      case 'circle':
        dimensions = this.createCircleDimensions();
        body = this.createCircleBody(finalPosition, dimensions);
        break;
      case 'triangle':
        dimensions = this.createTriangleDimensions();
        body = this.createTriangleBody(finalPosition, dimensions);
        break;
      case 'star':
        dimensions = this.createStarDimensions();
        body = this.createStarBody(finalPosition, dimensions);
        break;
      default:
        dimensions = this.createCircleDimensions();
        body = this.createCircleBody(finalPosition, dimensions);
    }

    // Set collision group for layer separation using physics layer group
    // Use positive groups so shapes only collide within their own layer
    body.collisionFilter.group = physicsLayerGroup;
    // Use category/mask system for more explicit control
    body.collisionFilter.category = 1 << (physicsLayerGroup - 1); // Unique category for this physics layer
    body.collisionFilter.mask = 1 << (physicsLayerGroup - 1); // Only collide with same physics layer

    const color = this.getLayerColor(colorIndex);
    const tint = SHAPE_TINTS[colorIndex % SHAPE_TINTS.length];
    
    return new Shape(id, type, finalPosition, body, layerId, color, tint, dimensions);
  }

  private static findNonOverlappingPosition(
    preferredPosition: Vector2,
    type: ShapeType,
    existingShapes: Shape[],
    maxAttempts: number = 50,
    layerBounds: { x: number; y: number; width: number; height: number }
  ): Vector2 {
    const testRadius = this.getShapeApproximateRadius(type);
    
    const playAreaX = layerBounds.x;
    const playAreaY = layerBounds.y;
    const playAreaWidth = layerBounds.width;
    const playAreaHeight = layerBounds.height;
    console.log(`Using provided layer bounds for repositioning: (${playAreaX}, ${playAreaY}, ${playAreaWidth}, ${playAreaHeight})`);

    // Helper function to clamp position within bounds
    const clampPosition = (pos: Vector2): Vector2 => ({
      x: Math.max(playAreaX + testRadius, Math.min(playAreaX + playAreaWidth - testRadius, pos.x)),
      y: Math.max(playAreaY + testRadius, Math.min(playAreaY + playAreaHeight - testRadius, pos.y))
    });
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      let testPosition: Vector2;
      
      if (attempt === 0) {
        testPosition = clampPosition(preferredPosition);
      } else {
        // Use larger offsets that can reach anywhere in the play area
        testPosition = clampPosition({
          x: preferredPosition.x + randomBetween(-playAreaWidth/2, playAreaWidth/2),
          y: preferredPosition.y + randomBetween(-playAreaHeight/2, playAreaHeight/2),
        });
      }
      
      // Check if position overlaps with existing shapes
      const overlaps = existingShapes.some(shape => {
        const distance = Math.sqrt(
          Math.pow(testPosition.x - shape.position.x, 2) +
          Math.pow(testPosition.y - shape.position.y, 2)
        );
        const combinedRadius = testRadius + this.getShapeApproximateRadius(shape.type);
        // Add some padding between shapes
        return distance < combinedRadius + 10;
      });
      
      if (!overlaps) {
        return testPosition;
      }
    }
    
    // If we can't find a non-overlapping position after many attempts,
    // try completely random positions within the play area
    for (let attempt = 0; attempt < 20; attempt++) {
      const testPosition = {
        x: playAreaX + testRadius + Math.random() * (playAreaWidth - 2 * testRadius),
        y: playAreaY + testRadius + Math.random() * (playAreaHeight - 2 * testRadius),
      };
      
      const overlaps = existingShapes.some(shape => {
        const distance = Math.sqrt(
          Math.pow(testPosition.x - shape.position.x, 2) +
          Math.pow(testPosition.y - shape.position.y, 2)
        );
        const combinedRadius = testRadius + this.getShapeApproximateRadius(shape.type);
        return distance < combinedRadius + 10;
      });
      
      if (!overlaps) {
        return testPosition;
      }
    }
    
    // If all else fails, use the preferred position clamped to bounds
    return clampPosition(preferredPosition);
  }

  private static getShapeApproximateRadius(type: ShapeType): number {
    switch (type) {
      case 'rectangle':
        return 80; // 50% increase: 48*1.5=72, plus extra for longer rectangles
      case 'square':
        return 70; // 50% increase: 42*1.5=63, rounded up for safety
      case 'circle':
        return 72; // 50% increase: 48*1.5=72
      case 'triangle':
        return 81; // 50% increase: 54*1.5=81
      case 'star':
        return 72; // 50% increase: 48*1.5=72
      default:
        return 72; // 50% increase: 48*1.5=72
    }
  }

  private static createRectangleDimensions() {
    // Create more varied rectangles - some wide, some tall, some longer
    const aspectRatio = randomBetween(0.4, 2.5); // Allow for very wide or very tall rectangles
    const baseSize = randomBetween(60, 120); // 50% increase: 40*1.5=60, 80*1.5=120
    
    if (aspectRatio < 1) {
      // Wide rectangle
      return {
        width: baseSize,
        height: Math.round(baseSize * aspectRatio),
      };
    } else {
      // Tall rectangle  
      return {
        width: Math.round(baseSize / aspectRatio),
        height: baseSize,
      };
    }
  }

  private static createSquareDimensions() {
    const size = randomBetween(72, 126); // 50% increase: 48*1.5=72, 84*1.5=126
    return {
      width: size,
      height: size,
    };
  }

  private static createCircleDimensions() {
    return {
      radius: randomBetween(36, 72), // 50% increase: 24*1.5=36, 48*1.5=72
    };
  }

  private static createTriangleDimensions() {
    return {
      radius: randomBetween(45, 81), // 50% increase: 30*1.5=45, 54*1.5=81
    };
  }

  private static createStarDimensions() {
    return {
      radius: randomBetween(45, 72), // 50% increase: 30*1.5=45, 48*1.5=72
    };
  }

  private static createRectangleBody(position: Vector2, dimensions: { width: number; height: number }): Body {
    return Bodies.rectangle(
      position.x,
      position.y,
      dimensions.width,
      dimensions.height,
      {
        ...PHYSICS_CONSTANTS.shape,
        render: { visible: false }, // We'll handle rendering ourselves
      }
    );
  }

  private static createCircleBody(position: Vector2, dimensions: { radius: number }): Body {
    return Bodies.circle(
      position.x,
      position.y,
      dimensions.radius,
      {
        ...PHYSICS_CONSTANTS.shape,
        render: { visible: false },
      }
    );
  }

  private static createTriangleBody(position: Vector2, dimensions: { radius: number }): Body {
    const vertices = createRegularPolygonVertices(position, dimensions.radius, 3);
    const matterVertices = vertices.map(v => ({ x: v.x, y: v.y }));
    
    return Bodies.fromVertices(
      position.x,
      position.y,
      [matterVertices],
      {
        ...PHYSICS_CONSTANTS.shape,
        render: { visible: false },
      }
    );
  }

  private static createStarBody(position: Vector2, dimensions: { radius: number }): Body {
    // Use a pentagon (5-sided polygon) to represent the star
    // This provides a star-like appearance with stable physics
    return Bodies.polygon(
      position.x,
      position.y,
      5, // 5 sides for pentagon star
      dimensions.radius,
      {
        ...PHYSICS_CONSTANTS.shape,
        render: { visible: false },
      }
    );
  }

  private static getLayerColor(colorIndex: number): string {
    // Define distinct colors for each layer that match our 5-color cycling system
    const layerColors = [
      '#E74C3C', // Red
      '#2ECC71', // Green  
      '#3498DB', // Blue
      '#F1C40F', // Yellow
      '#9B59B6', // Purple
    ];
    
    // Use modulo to cycle through colors if we have more layers than colors
    return layerColors[colorIndex % layerColors.length];
  }
}