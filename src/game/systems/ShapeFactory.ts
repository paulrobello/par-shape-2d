import { Bodies, Body } from 'matter-js';
import { Shape } from '@/game/entities/Shape';
import { ShapeType, Vector2 } from '@/types/game';
import { PHYSICS_CONSTANTS, SHAPE_TINTS, UI_CONSTANTS } from '@/game/utils/Constants';
import { randomBetween, createRegularPolygonVertices } from '@/game/utils/MathUtils';

type ShapeDimensions = 
  | { width: number; height: number } // Rectangle/Square
  | { radius: number } // Circle/Triangle/Pentagon
  | Record<string, never>; // For star or other shapes

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
    const maxRetries = 5; // Try up to 5 different shape/size combinations
    
    for (let retry = 0; retry < maxRetries; retry++) {
      const shapeTypes: ShapeType[] = ['rectangle', 'square', 'circle', 'triangle', 'star', 'capsule'];
      const type = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
      
      const shape = this.createShapeWithPlacement(type, position, layerId, layerIndex, physicsLayerGroup, colorIndex, existingShapes, layerBounds, retry);
      
      if (shape) {
        return shape;
      }
      
      console.log(`Retry ${retry + 1}/${maxRetries}: Failed to place ${type} shape, trying different shape/size`);
    }
    
    // If all retries failed, create a very small circle as absolute fallback
    console.warn(`All shape placement retries failed, creating minimal circle`);
    return this.createMinimalShape(position, layerId, layerIndex, physicsLayerGroup, colorIndex, layerBounds);
  }

  private static createShapeWithPlacement(
    type: ShapeType,
    position: Vector2,
    layerId: string,
    layerIndex: number,
    physicsLayerGroup: number,
    colorIndex: number,
    existingShapes: Shape[],
    layerBounds: { x: number; y: number; width: number; height: number },
    retryCount: number
  ): Shape | null {
    const id = `shape-${++this.shapeCounter}`;
    
    // Get dimensions based on retry count (smaller sizes for later retries)
    let dimensions: ShapeDimensions = {};
    const sizeReduction = retryCount * 0.15; // Reduce size by 15% per retry
    
    switch (type) {
      case 'rectangle':
        dimensions = this.createRectangleDimensions(sizeReduction);
        break;
      case 'square':
        dimensions = this.createSquareDimensions(sizeReduction);
        break;
      case 'circle':
        dimensions = this.createCircleDimensions(sizeReduction);
        break;
      case 'triangle':
        dimensions = this.createTriangleDimensions(sizeReduction);
        break;
      case 'star':
        dimensions = this.createStarDimensions(sizeReduction);
        break;
      case 'capsule':
        dimensions = this.createCapsuleDimensions(sizeReduction);
        break;
      default:
        dimensions = this.createCircleDimensions(sizeReduction);
    }
    
    // Try to find a non-overlapping position
    const finalPosition = this.findNonOverlappingPosition(position, type, dimensions, existingShapes, layerBounds);
    
    if (!finalPosition) {
      console.log(`Could not place ${type} shape (retry ${retryCount})`);
      return null;
    }
    
    // Create the physics body
    let body: Body;
    let compositeData: { isComposite: boolean; parts: Body[] } | undefined;
    
    switch (type) {
      case 'rectangle':
      case 'square':
        body = this.createRectangleBody(finalPosition, dimensions as { width: number; height: number });
        break;
      case 'circle':
        body = this.createCircleBody(finalPosition, dimensions as { radius: number });
        break;
      case 'triangle':
        body = this.createTriangleBody(finalPosition, dimensions as { radius: number });
        break;
      case 'star':
        body = this.createStarBody(finalPosition, dimensions as { radius: number });
        break;
      case 'capsule':
        const capsuleResult = this.createCapsuleBody(finalPosition, dimensions as { width: number; height: number });
        body = capsuleResult.composite;
        compositeData = {
          isComposite: true,
          parts: capsuleResult.parts
        };
        break;
      default:
        body = this.createCircleBody(finalPosition, dimensions as { radius: number });
    }

    // Set collision group for layer separation using physics layer group
    body.collisionFilter.group = physicsLayerGroup;
    body.collisionFilter.category = 1 << (physicsLayerGroup - 1);
    body.collisionFilter.mask = 1 << (physicsLayerGroup - 1);
    
    // Also set collision filters for composite parts
    if (compositeData && compositeData.parts) {
      compositeData.parts.forEach(part => {
        part.collisionFilter.group = physicsLayerGroup;
        part.collisionFilter.category = 1 << (physicsLayerGroup - 1);
        part.collisionFilter.mask = 1 << (physicsLayerGroup - 1);
      });
    }

    const color = this.getLayerColor(colorIndex);
    const tint = SHAPE_TINTS[colorIndex % SHAPE_TINTS.length];
    
    console.log(`Successfully placed ${type} shape at (${finalPosition.x.toFixed(1)}, ${finalPosition.y.toFixed(1)}) on retry ${retryCount}`);
    return new Shape(id, type, finalPosition, body, layerId, color, tint, dimensions, compositeData);
  }

  private static createMinimalShape(
    position: Vector2,
    layerId: string,
    layerIndex: number,
    physicsLayerGroup: number,
    colorIndex: number,
    layerBounds: { x: number; y: number; width: number; height: number }
  ): Shape {
    const id = `shape-${++this.shapeCounter}`;
    const dimensions = { radius: 20 }; // Very small circle
    
    // Clamp position to bounds
    const finalPosition = {
      x: Math.max(layerBounds.x + dimensions.radius, Math.min(layerBounds.x + layerBounds.width - dimensions.radius, position.x)),
      y: Math.max(layerBounds.y + dimensions.radius, Math.min(layerBounds.y + layerBounds.height - dimensions.radius, position.y))
    };
    
    const body = this.createCircleBody(finalPosition, dimensions);
    body.collisionFilter.group = physicsLayerGroup;
    body.collisionFilter.category = 1 << (physicsLayerGroup - 1);
    body.collisionFilter.mask = 1 << (physicsLayerGroup - 1);

    const color = this.getLayerColor(colorIndex);
    const tint = SHAPE_TINTS[colorIndex % SHAPE_TINTS.length];
    
    return new Shape(id, 'circle', finalPosition, body, layerId, color, tint, dimensions);
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
    // Use the new placement logic for existing createShape calls
    const shape = this.createShapeWithPlacement(type, position, layerId, layerIndex, physicsLayerGroup, colorIndex, existingShapes, layerBounds, 0);
    
    if (shape) {
      return shape;
    }
    
    // Fallback to minimal shape if placement fails
    return this.createMinimalShape(position, layerId, layerIndex, physicsLayerGroup, colorIndex, layerBounds);
  }

  private static findNonOverlappingPosition(
    preferredPosition: Vector2,
    type: ShapeType,
    dimensions: ShapeDimensions,
    existingShapes: Shape[],
    layerBounds: { x: number; y: number; width: number; height: number }
  ): Vector2 | null {
    const testRadius = this.getShapeRadiusFromDimensions(type, dimensions);
    const minSeparation = 30; // Minimum distance between shape centers
    
    const playAreaX = layerBounds.x;
    const playAreaY = layerBounds.y;
    const playAreaWidth = layerBounds.width;
    const playAreaHeight = layerBounds.height;

    // Helper function to clamp position within bounds
    const clampPosition = (pos: Vector2): Vector2 => ({
      x: Math.max(playAreaX + testRadius, Math.min(playAreaX + playAreaWidth - testRadius, pos.x)),
      y: Math.max(playAreaY + testRadius, Math.min(playAreaY + playAreaHeight - testRadius, pos.y))
    });

    // Enhanced overlap checking that considers actual shape bounds
    const checkOverlap = (testPos: Vector2): boolean => {
      return existingShapes.some(shape => {
        const distance = Math.sqrt(
          Math.pow(testPos.x - shape.position.x, 2) +
          Math.pow(testPos.y - shape.position.y, 2)
        );
        const otherRadius = this.getShapeApproximateRadius(shape.type);
        
        // Use stricter separation for better visual appearance
        const requiredSeparation = Math.max(minSeparation, testRadius + otherRadius + 10);
        return distance < requiredSeparation;
      });
    };
    
    // Phase 1: Try positions around the preferred position with increasing radius
    for (let attempt = 0; attempt < 50; attempt++) {
      let testPosition: Vector2;
      
      if (attempt === 0) {
        testPosition = clampPosition(preferredPosition);
      } else {
        // Use spiral pattern around preferred position
        const angle = (attempt * 137.5) * (Math.PI / 180); // Golden angle for even distribution
        const radius = Math.min(attempt * 20, Math.min(playAreaWidth, playAreaHeight) / 3);
        testPosition = clampPosition({
          x: preferredPosition.x + Math.cos(angle) * radius,
          y: preferredPosition.y + Math.sin(angle) * radius,
        });
      }
      
      if (!checkOverlap(testPosition)) {
        return testPosition;
      }
    }
    
    // Phase 2: Grid-based placement for systematic coverage
    const gridSize = Math.max(testRadius * 2 + minSeparation, 80);
    const cols = Math.floor(playAreaWidth / gridSize);
    const rows = Math.floor(playAreaHeight / gridSize);
    
    // Create array of grid positions in deterministic order
    const gridPositions: Vector2[] = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        gridPositions.push({
          x: playAreaX + col * gridSize + gridSize / 2,
          y: playAreaY + row * gridSize + gridSize / 2
        });
      }
    }
    
    // Sort grid positions by distance from preferred position for better placement
    gridPositions.sort((a, b) => {
      const distA = Math.sqrt(Math.pow(a.x - preferredPosition.x, 2) + Math.pow(a.y - preferredPosition.y, 2));
      const distB = Math.sqrt(Math.pow(b.x - preferredPosition.x, 2) + Math.pow(b.y - preferredPosition.y, 2));
      return distA - distB;
    });
    
    for (const gridPos of gridPositions) {
      const testPosition = clampPosition(gridPos);
      if (!checkOverlap(testPosition)) {
        return testPosition;
      }
    }
    
    // Phase 3: Try center and corners as last deterministic attempt
    const corners = [
      { x: playAreaX + testRadius + 20, y: playAreaY + testRadius + 20 },
      { x: playAreaX + playAreaWidth - testRadius - 20, y: playAreaY + testRadius + 20 },
      { x: playAreaX + testRadius + 20, y: playAreaY + playAreaHeight - testRadius - 20 },
      { x: playAreaX + playAreaWidth - testRadius - 20, y: playAreaY + playAreaHeight - testRadius - 20 },
      { x: playAreaX + playAreaWidth / 2, y: playAreaY + playAreaHeight / 2 }
    ];
    
    for (const corner of corners) {
      const testPosition = clampPosition(corner);
      if (!checkOverlap(testPosition)) {
        return testPosition;
      }
    }
    
    // No valid position found
    console.log(`Could not find non-overlapping position for ${type} shape with radius ${testRadius}`);
    return null;
  }

  private static getShapeRadiusFromDimensions(type: ShapeType, dimensions: ShapeDimensions): number {
    switch (type) {
      case 'rectangle':
      case 'square':
      case 'capsule':
        const rectDims = dimensions as { width: number; height: number };
        return Math.max(rectDims.width, rectDims.height) / 2;
      case 'circle':
      case 'triangle':
      case 'star':
        const circleDims = dimensions as { radius: number };
        return circleDims.radius;
      default:
        return 50; // Fallback radius
    }
  }

  private static getShapeApproximateRadius(type: ShapeType): number {
    switch (type) {
      case 'rectangle':
        return 100; // 87.5% increase: 48*1.875=90, plus extra for longer rectangles
      case 'square':
        return 88; // 87.5% increase: 42*1.875=79, rounded up for safety
      case 'circle':
        return 90; // 87.5% increase: 48*1.875=90
      case 'triangle':
        return 101; // 87.5% increase: 54*1.875=101
      case 'star':
        return 90; // 87.5% increase: 48*1.875=90
      case 'capsule':
        // Max width for 6 screws: 6 * 24 + 5 * 5 = 169
        return 85; // Half of max width
      default:
        return 90; // 87.5% increase: 48*1.875=90
    }
  }

  private static createRectangleDimensions(sizeReduction: number = 0) {
    // Create more varied rectangles - some wide, some tall, some longer
    const aspectRatio = randomBetween(0.4, 2.5); // Allow for very wide or very tall rectangles
    const baseSize = randomBetween(75, 150) * (1 - sizeReduction); // 87.5% increase: 40*1.875=75, 80*1.875=150
    
    if (aspectRatio < 1) {
      // Wide rectangle
      return {
        width: Math.round(baseSize),
        height: Math.round(baseSize * aspectRatio),
      };
    } else {
      // Tall rectangle  
      return {
        width: Math.round(baseSize / aspectRatio),
        height: Math.round(baseSize),
      };
    }
  }

  private static createSquareDimensions(sizeReduction: number = 0) {
    const size = Math.round(randomBetween(90, 158) * (1 - sizeReduction)); // 87.5% increase: 48*1.875=90, 84*1.875=158
    return {
      width: size,
      height: size,
    };
  }

  private static createCircleDimensions(sizeReduction: number = 0) {
    return {
      radius: Math.round(randomBetween(45, 90) * (1 - sizeReduction)), // 87.5% increase: 24*1.875=45, 48*1.875=90
    };
  }

  private static createTriangleDimensions(sizeReduction: number = 0) {
    return {
      radius: Math.round(randomBetween(56, 101) * (1 - sizeReduction)), // 87.5% increase: 30*1.875=56, 54*1.875=101
    };
  }

  private static createStarDimensions(sizeReduction: number = 0) {
    return {
      radius: Math.round(randomBetween(56, 90) * (1 - sizeReduction)), // 87.5% increase: 30*1.875=56, 48*1.875=90
    };
  }

  private static createCapsuleDimensions(sizeReduction: number = 0) {
    // Import constants properly
    const screwRadius = UI_CONSTANTS.screws.radius;
    const height = screwRadius * 2; // Height is double the screw radius
    
    // Length is between 3 and 6 screws with 5 pixels between each
    const screwCount = Math.floor(randomBetween(3, 7)); // 3 to 6 screws
    const screwSpacing = 5; // Space between screws
    const width = screwCount * (screwRadius * 2) + (screwCount - 1) * screwSpacing;
    
    return {
      width: Math.round(width * (1 - sizeReduction)),
      height: Math.round(height * (1 - sizeReduction)),
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

  private static createCapsuleBody(position: Vector2, dimensions: { width: number; height: number }): { composite: Body; parts: Body[] } {
    
    const radius = dimensions.height / 2;
    const rectWidth = dimensions.width - dimensions.height; // Rectangle width without the circles
    
    // Create the middle rectangle
    const rectangle = Bodies.rectangle(
      position.x,
      position.y,
      rectWidth,
      dimensions.height,
      {
        ...PHYSICS_CONSTANTS.shape,
        render: { visible: false },
      }
    );
    
    // Create the left circle
    const leftCircle = Bodies.circle(
      position.x - rectWidth / 2,
      position.y,
      radius,
      {
        ...PHYSICS_CONSTANTS.shape,
        render: { visible: false },
      }
    );
    
    // Create the right circle
    const rightCircle = Bodies.circle(
      position.x + rectWidth / 2,
      position.y,
      radius,
      {
        ...PHYSICS_CONSTANTS.shape,
        render: { visible: false },
      }
    );
    
    // Create a composite body from the parts
    const capsuleComposite = Body.create({
      parts: [rectangle, leftCircle, rightCircle],
      ...PHYSICS_CONSTANTS.shape,
      render: { visible: false },
    });
    
    // Set the position to ensure the composite is centered correctly
    Body.setPosition(capsuleComposite, position);
    
    return {
      composite: capsuleComposite,
      parts: [rectangle, leftCircle, rightCircle]
    };
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