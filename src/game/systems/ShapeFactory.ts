import { Bodies, Body, Vertices, Bounds } from 'matter-js';
import { Shape } from '@/game/entities/Shape';
import { ShapeType, Vector2 } from '@/types/game';
import { ShapeDefinition, ShapeDimensions } from '@/types/shapes';
import { PHYSICS_CONSTANTS, SHAPE_TINTS, UI_CONSTANTS, DEBUG_CONFIG } from '@/shared/utils/Constants';
import { randomBetween } from '@/game/utils/MathUtils';
import { ShapeRegistry } from './ShapeRegistry';
import { initializePolyDecomp, isPolyDecompInitialized } from '@/game/utils/PhysicsInit';

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
    const registry = ShapeRegistry.getInstance();
    const enabledShapes = registry.getEnabledShapes();
    
    if (DEBUG_CONFIG.logShapeCreation) {
      console.log(`🎲 Creating random shape from ${enabledShapes.length} enabled shapes:`, enabledShapes.map(s => s.id));
    }
    
    if (enabledShapes.length === 0) {
      throw new Error('No shapes enabled in configuration');
    }
    
    const maxRetries = 8; // Increased from 5 to help larger shapes like capsules
    const failedShapes: ShapeDefinition[] = [];
    
    for (let retry = 0; retry < maxRetries; retry++) {
      // Select a random shape definition
      const definition = enabledShapes[Math.floor(Math.random() * enabledShapes.length)];
      
      if (DEBUG_CONFIG.logShapeCreation) {
        console.log(`🎯 Attempt ${retry + 1}: Selected shape "${definition.id}" (${definition.category})`);
      }
      
      // Special logging for capsules
      if (definition.id === 'capsule' && DEBUG_CONFIG.logCapsuleGeneration) {
        console.log(`🔵 CAPSULE GENERATION ATTEMPT ${retry + 1}: Starting capsule creation process`);
      }
      
      const shape = this.createShapeWithPlacement(
        definition,
        position,
        layerId,
        layerIndex,
        physicsLayerGroup,
        colorIndex,
        existingShapes,
        layerBounds,
        retry
      );
      
      if (shape) {
        if (DEBUG_CONFIG.logShapeCreation) {
          console.log(`✅ Successfully created ${definition.id} shape`);
        }
        return shape;
      }
      
      failedShapes.push(definition);
      if (DEBUG_CONFIG.logShapeCreation) {
        console.log(`❌ Retry ${retry + 1}/${maxRetries}: Failed to place ${definition.id} shape, trying different shape/size`);
      }
    }
    
    // If all retries failed, create a very small circle as absolute fallback
    console.warn(`🔥 All shape placement retries failed, creating minimal circle. Failed shapes:`, 
      failedShapes.map(s => `${s.id}(${s.category})`).join(', '));
    return this.createMinimalShape(position, layerId, layerIndex, physicsLayerGroup, colorIndex, layerBounds);
  }

  private static createShapeWithPlacement(
    definition: ShapeDefinition,
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
    
    // Get dimensions based on definition and retry count
    // Reduce size reduction penalty for capsules to help them place better
    const reductionFactor = definition.id === 'capsule' ? 0.05 : (definition.dimensions.reductionFactor || 0.15);
    const sizeReduction = retryCount * reductionFactor;
    const dimensions = this.generateDimensions(definition, sizeReduction);
    
    if (!dimensions) {
      if (DEBUG_CONFIG.logShapeCreation) {
        console.error(`❌ Failed to generate dimensions for shape ${definition.id}`);
      }
      return null;
    }
    
    // Find valid position
    const testRadius = this.getShapeRadius(definition, dimensions);
    const validPosition = this.findValidPosition(
      position,
      testRadius,
      existingShapes,
      layerBounds,
      definition.category === 'composite',
      dimensions
    );
    
    if (!validPosition) {
      if (DEBUG_CONFIG.logShapeCreation) {
        console.log(`❌ No valid position found for ${definition.id} (testRadius: ${testRadius}, sizeReduction: ${sizeReduction.toFixed(2)}, dimensions:`, dimensions);
      }
      return null;
    }
    
    // Create physics body
    const bodyResult = this.createPhysicsBody(definition, validPosition, dimensions);
    if (!bodyResult) {
      if (DEBUG_CONFIG.logShapeCreation) {
        console.error(`❌ Failed to create physics body for shape ${definition.id}`);
      }
      return null;
    }
    
    const { body, parts, originalVertices } = bodyResult;
    
    // Configure physics properties
    Body.setMass(body, body.mass * 2);
    body.friction = PHYSICS_CONSTANTS.shape.friction;
    body.frictionAir = PHYSICS_CONSTANTS.shape.frictionAir;
    body.restitution = PHYSICS_CONSTANTS.shape.restitution;
    body.density = PHYSICS_CONSTANTS.shape.density;
    
    // Set collision group for layer separation using bit shifting
    body.collisionFilter = {
      group: physicsLayerGroup,
      category: 1 << (physicsLayerGroup - 1),
      mask: 1 << (physicsLayerGroup - 1)
    };
    
    // Also set collision filter for parts if composite
    if (parts) {
      parts.forEach(part => {
        part.collisionFilter = {
          group: physicsLayerGroup,
          category: 1 << (physicsLayerGroup - 1),
          mask: 1 << (physicsLayerGroup - 1)
        };
      });
    }
    
    // Create the shape entity
    const color = this.getLayerColor(colorIndex);
    // Use offset tint to avoid same-color stroke and fill (better visual distinction)
    const tint = SHAPE_TINTS[(colorIndex + 2) % SHAPE_TINTS.length];
    
    // Map definition ID to ShapeType
    const shapeType = this.getShapeType(definition);
    
    const shape = new Shape(
      id,
      shapeType,
      validPosition,
      body,
      layerId,
      color,
      tint,
      definition.id, // Pass the definition ID for strategy lookup
      {
        width: dimensions.width,
        height: dimensions.height,
        radius: dimensions.radius,
        sides: dimensions.sides,
        vertices: originalVertices,
      },
      parts ? { isComposite: true, parts } : undefined
    );
    
    // CRITICAL: Sync the Shape position with the actual physics body position
    // after Matter.js has positioned the body (important for ALL shapes, not just composite)
    shape.updateFromBody();
    
    return shape;
  }

  private static generateDimensions(definition: ShapeDefinition, sizeReduction: number): ShapeDimensions | null {
    const dims = definition.dimensions;
    const reduction = 1 - sizeReduction;
    
    if (DEBUG_CONFIG.logShapeCreation && definition.id === 'rectangle') {
      console.log(`🔧 Generating dimensions for ${definition.id}, reduction: ${reduction}`);
    }
    
    switch (definition.category) {
      case 'basic':
        if (definition.id === 'rectangle') {
          const aspectRatio = randomBetween(dims.aspectRatio!.min, dims.aspectRatio!.max);
          const widthRange = dims.width as { min: number; max: number };
          const baseSize = randomBetween(
            widthRange.min,
            widthRange.max
          ) * reduction;
          
          if (aspectRatio < 1) {
            return {
              width: Math.round(baseSize),
              height: Math.round(baseSize * aspectRatio),
            };
          } else {
            return {
              width: Math.round(baseSize / aspectRatio),
              height: Math.round(baseSize),
            };
          }
        } else if (definition.id === 'circle') {
          const radiusRange = dims.radius as { min: number; max: number };
          return {
            radius: randomBetween(
              radiusRange.min,
              radiusRange.max
            ) * reduction,
          };
        }
        break;
        
      case 'polygon':
        // Handle both regular polygons (with radius) and irregular polygons (with width/height like rectangle)
        if (dims.radius) {
          const polygonRadiusRange = dims.radius as { min: number; max: number };
          return {
            radius: randomBetween(
              polygonRadiusRange.min,
              polygonRadiusRange.max
            ) * reduction,
            sides: dims.sides,
          };
        } else if (dims.width && dims.height) {
          // Handle irregular polygons like rectangle
          const widthRange = dims.width as { min: number; max: number };
          const heightRange = dims.height as { min: number; max: number };
          let width = randomBetween(widthRange.min, widthRange.max) * reduction;
          let height = randomBetween(heightRange.min, heightRange.max) * reduction;
          
          if (DEBUG_CONFIG.logShapeCreation && definition.id === 'rectangle') {
            console.log(`🔧 Rectangle initial dimensions: width=${width.toFixed(1)}, height=${height.toFixed(1)}`);
          }
          
          // Apply aspect ratio constraints if defined
          if (dims.aspectRatio) {
            const aspectRatioRange = dims.aspectRatio as { min: number; max: number };
            const targetRatio = randomBetween(aspectRatioRange.min, aspectRatioRange.max);
            const currentRatio = width / height;
            
            if (DEBUG_CONFIG.logShapeCreation && definition.id === 'rectangle') {
              console.log(`🔧 Rectangle aspect ratio: current=${currentRatio.toFixed(2)}, target=${targetRatio.toFixed(2)}`);
            }
            
            // Try to adjust to target ratio while staying within original bounds
            if (currentRatio > targetRatio) {
              // Width is too large relative to height, try to reduce width first
              const newWidth = height * targetRatio;
              if (newWidth >= widthRange.min && newWidth <= widthRange.max) {
                width = newWidth;
              } else if (newWidth < widthRange.min) {
                // Width would be too small, increase height instead
                const newHeight = width / targetRatio;
                if (newHeight >= heightRange.min && newHeight <= heightRange.max) {
                  height = newHeight;
                }
                // If neither adjustment works, keep original dimensions
              }
            } else {
              // Height is too large relative to width, try to reduce height first
              const newHeight = width / targetRatio;
              if (newHeight >= heightRange.min && newHeight <= heightRange.max) {
                height = newHeight;
              } else if (newHeight < heightRange.min) {
                // Height would be too small, increase width instead
                const newWidth = height * targetRatio;
                if (newWidth >= widthRange.min && newWidth <= widthRange.max) {
                  width = newWidth;
                }
                // If neither adjustment works, keep original dimensions
              }
            }
            
            if (DEBUG_CONFIG.logShapeCreation && definition.id === 'rectangle') {
              console.log(`🔧 Rectangle final dimensions: width=${width.toFixed(1)}, height=${height.toFixed(1)}, final ratio=${(width/height).toFixed(2)}`);
            }
          }
          
          return {
            width,
            height,
            sides: dims.sides,
          };
        } else {
          throw new Error(`Polygon shape ${definition.id} must have either radius or width/height defined`);
        }
        
      case 'path':
        let scaleValue: number;
        if (typeof dims.scale === 'number') {
          scaleValue = dims.scale;
        } else if (dims.scale && typeof dims.scale === 'object') {
          scaleValue = randomBetween(dims.scale.min, dims.scale.max);
        } else {
          scaleValue = 1.0; // Default scale
        }
        return {
          path: dims.path,
          scale: scaleValue * reduction,
        };
        
      case 'composite':
        if (definition.id === 'capsule') {
          // Random number of screws determines width
          const screwCount = Math.floor(Math.random() * 4) + 2; // 2-5 screws
          const screwRadius = UI_CONSTANTS.screws.radius;
          const spacing = 5;
          const width = screwCount * (screwRadius * 2) + (screwCount - 1) * spacing;
          
          const calculatedWidth = Math.round(width * reduction);
          const calculatedHeight = Math.round((dims.height as number) * reduction);
          
          // Ensure capsule width is always >= height for proper capsule geometry
          const finalDimensions = {
            width: Math.max(calculatedWidth, calculatedHeight),
            height: calculatedHeight,
          };
          
          if (DEBUG_CONFIG.logCapsuleGeneration) {
            console.log(`🔵 CAPSULE DIMENSIONS: screwCount=${screwCount}, width=${width}*${reduction}=${finalDimensions.width}, height=${dims.height}*${reduction}=${finalDimensions.height}`);
          }
          
          return finalDimensions;
        }
        break;
    }
    
    return null;
  }

  private static getShapeRadius(definition: ShapeDefinition, dimensions: ShapeDimensions): number {
    switch (definition.category) {
      case 'basic':
        if (definition.id === 'circle') {
          return dimensions.radius!;
        } else {
          return Math.max(dimensions.width!, dimensions.height!) / 2;
        }
      case 'polygon':
        // Handle both regular polygons (with radius) and irregular polygons (with width/height like rectangle)
        if (dimensions.radius) {
          return dimensions.radius;
        } else if (dimensions.width && dimensions.height) {
          return Math.max(dimensions.width, dimensions.height) / 2;
        } else {
          return 50; // fallback
        }
      case 'path':
        // Estimate based on scale
        return 60 * (dimensions.scale || 1);
      case 'composite':
        return Math.max(dimensions.width!, dimensions.height!) / 2;
      default:
        return 50;
    }
  }

  private static createPhysicsBody(
    definition: ShapeDefinition,
    position: Vector2,
    dimensions: ShapeDimensions
  ): { body: Body; parts?: Body[]; originalVertices?: Vector2[] } | null {
    switch (definition.physics.type) {
      case 'rectangle':
        return {
          body: Bodies.rectangle(
            position.x,
            position.y,
            dimensions.width!,
            dimensions.height!,
            {
              ...PHYSICS_CONSTANTS.shape,
              render: { visible: false },
            }
          ),
        };
        
      case 'circle':
        return {
          body: Bodies.circle(
            position.x,
            position.y,
            dimensions.radius!,
            {
              ...PHYSICS_CONSTANTS.shape,
              render: { visible: false },
            }
          ),
        };
        
      case 'polygon':
        // Handle both regular polygons (with radius) and irregular polygons (with width/height like rectangle)
        if (dimensions.radius) {
          // Regular polygon (triangle, pentagon, hexagon, etc., and square)
          return {
            body: Bodies.polygon(
              position.x,
              position.y,
              dimensions.sides!,
              dimensions.radius,
              {
                ...PHYSICS_CONSTANTS.shape,
                render: { visible: false },
              }
            ),
          };
        } else if (dimensions.width && dimensions.height) {
          // Irregular polygon (rectangle) - use rectangle body
          return {
            body: Bodies.rectangle(
              position.x,
              position.y,
              dimensions.width,
              dimensions.height,
              {
                ...PHYSICS_CONSTANTS.shape,
                render: { visible: false },
              }
            ),
          };
        } else {
          throw new Error(`Polygon shape must have either radius or width/height defined for physics body creation`);
        }
        
      case 'fromVertices':
        return this.createPathBody(position, dimensions);
        
      case 'composite':
        if (definition.id === 'capsule' || definition.id.includes('capsule')) {
          return this.createCapsuleBody(position, dimensions);
        }
        break;
    }
    
    return null;
  }

  private static createPathBody(
    position: Vector2,
    dimensions: ShapeDimensions
  ): { body: Body; originalVertices: Vector2[] } {
    // Ensure poly-decomp is initialized
    if (!isPolyDecompInitialized()) {
      initializePolyDecomp();
    }
    
    // Create vertices from path
    // @ts-expect-error the @types lib is not up to date
    const vertices = Vertices.fromPath(dimensions.path!);
    
    // Scale the vertices
    if (dimensions.scale && dimensions.scale !== 1 && dimensions.scale > 0) {
      const initialBounds = Bounds.create(vertices);
      const center = {
        x: (initialBounds.min.x + initialBounds.max.x) / 2,
        y: (initialBounds.min.y + initialBounds.max.y) / 2
      };
      Vertices.scale(vertices, dimensions.scale, dimensions.scale, center);
    }
    
    // Center the vertices at origin
    const bounds = Bounds.create(vertices);
    const centerX = (bounds.min.x + bounds.max.x) / 2;
    const centerY = (bounds.min.y + bounds.max.y) / 2;
    Vertices.translate(vertices, { x: -centerX, y: -centerY }, 1);
    
    // Store original vertices for rendering
    const originalVertices: Vector2[] = vertices.map(v => ({
      x: v.x,
      y: v.y
    }));
    
    // Create the body with decomposition
    const body = Bodies.fromVertices(
      position.x,
      position.y,
      [vertices],
      {
        ...PHYSICS_CONSTANTS.shape,
        render: { visible: false },
      },
      true // flag for decomposition
    );
    
    return { body, originalVertices };
  }

  private static createCapsuleBody(
    position: Vector2,
    dimensions: ShapeDimensions
  ): { body: Body; parts: Body[] } {
    if (DEBUG_CONFIG.logCapsuleGeneration) {
      console.log(`🔵 CAPSULE BODY CREATION: width=${dimensions.width}, height=${dimensions.height}, position=(${position.x}, ${position.y})`);
    }
    
    const radius = dimensions.height! / 2;
    // Ensure rectWidth is never negative (capsule width must be >= height)
    const rectWidth = Math.max(0, dimensions.width! - dimensions.height!);
    
    if (DEBUG_CONFIG.logCapsuleGeneration) {
      console.log(`🔵 CAPSULE CALCULATIONS: radius=${radius}, rectWidth=${rectWidth} (width=${dimensions.width} - height=${dimensions.height})`);
      if (dimensions.width! < dimensions.height!) {
        console.warn(`🔴 CAPSULE WARNING: Width (${dimensions.width}) < Height (${dimensions.height}) - this creates a degenerate capsule!`);
      }
    }
    
    // Create the parts at origin, then position the composite
    const rectangle = Bodies.rectangle(
      0,
      0,
      rectWidth,
      dimensions.height!,
      {
        ...PHYSICS_CONSTANTS.shape,
        render: { visible: false },
      }
    );
    
    const leftCircle = Bodies.circle(
      -rectWidth / 2,
      0,
      radius,
      {
        ...PHYSICS_CONSTANTS.shape,
        render: { visible: false },
      }
    );
    
    const rightCircle = Bodies.circle(
      rectWidth / 2,
      0,
      radius,
      {
        ...PHYSICS_CONSTANTS.shape,
        render: { visible: false },
      }
    );
    
    // Create composite body using Matter.js Body.create with parts array
    // This is the correct way to create composite bodies according to Matter.js docs
    const parts = [rectangle, leftCircle, rightCircle];
    
    if (DEBUG_CONFIG.logCapsuleGeneration) {
      console.log(`🔵 CAPSULE PARTS BOUNDS before composite:`);
      parts.forEach((part, i) => {
        const partBounds = part.bounds;
        console.log(`  Part ${i}: (${partBounds.min.x.toFixed(1)}, ${partBounds.min.y.toFixed(1)}) to (${partBounds.max.x.toFixed(1)}, ${partBounds.max.y.toFixed(1)})`);
      });
    }
    
    const capsuleComposite = Body.create({
      parts: parts,
      ...PHYSICS_CONSTANTS.shape,
      render: { visible: false },
    });
    
    Body.setPosition(capsuleComposite, position);
    
    if (DEBUG_CONFIG.logCapsuleGeneration) {
      const finalBounds = capsuleComposite.bounds;
      console.log(`🔵 CAPSULE BODY FINAL BOUNDS: (${finalBounds.min.x.toFixed(1)}, ${finalBounds.min.y.toFixed(1)}) to (${finalBounds.max.x.toFixed(1)}, ${finalBounds.max.y.toFixed(1)}) - size: ${(finalBounds.max.x - finalBounds.min.x).toFixed(1)} x ${(finalBounds.max.y - finalBounds.min.y).toFixed(1)}`);
    }
    
    return {
      body: capsuleComposite,
      parts: [rectangle, leftCircle, rightCircle]
    };
  }

  private static getShapeType(definition: ShapeDefinition): ShapeType {
    // Check definition ID first for specific shapes
    const typeMapping: Record<string, ShapeType> = {
      'rectangle': 'rectangle',
      'square': 'polygon',  // Square is a 4-sided polygon
      'circle': 'circle',
      'triangle': 'polygon',
      'pentagon': 'polygon',
      'hexagon': 'polygon',
      'heptagon': 'polygon',
      'octagon': 'polygon',
      'capsule': 'capsule',
      'arrow': 'arrow',
      'chevron': 'chevron',
      'star': 'star',
      'horseshoe': 'horseshoe',
    };
    
    // Return specific type if found in mapping
    if (typeMapping[definition.id]) {
      return typeMapping[definition.id];
    }
    
    // Fallback to physics type for unrecognized definitions
    if (definition.physics.type === 'polygon') {
      return 'polygon';
    }
    if (definition.physics.type === 'circle') {
      return 'circle';
    }
    if (definition.physics.type === 'rectangle') {
      return 'rectangle';
    }
    if (definition.physics.type === 'composite') {
      return 'capsule'; // Assuming composites are capsules for now
    }
    if (definition.physics.type === 'fromVertices') {
      // Map based on definition ID for path-based shapes
      if (definition.id.includes('arrow')) return 'arrow';
      if (definition.id.includes('chevron')) return 'chevron';
      if (definition.id.includes('star')) return 'star';
      if (definition.id.includes('horseshoe')) return 'horseshoe';
      // For custom path shapes created in editor, check the name too
      if (definition.name && definition.name.toLowerCase().includes('arrow')) return 'arrow';
      if (definition.name && definition.name.toLowerCase().includes('chevron')) return 'chevron';
      if (definition.name && definition.name.toLowerCase().includes('star')) return 'star';
      if (definition.name && definition.name.toLowerCase().includes('horseshoe')) return 'horseshoe';
      // For generic custom path shapes, use star as fallback since it has good path rendering
      return 'star'; // Fallback for path-based shapes
    }
    
    return 'circle';
  }

  private static findValidPosition(
    preferredPosition: Vector2,
    testRadius: number,
    existingShapes: Shape[],
    layerBounds: { x: number; y: number; width: number; height: number },
    isComposite: boolean = false,
    dimensions?: ShapeDimensions
  ): Vector2 | null {
    // Implementation remains the same as before
    const minSeparation = 30;
    // Add extra margin for composite shapes (like capsules) that extend beyond their center
    const baseMargin = isComposite ? 60 : 20;

    // Calculate half-dimensions for proper clamping
    // For non-circular shapes, use actual dimensions; otherwise fall back to testRadius
    const halfWidth = dimensions?.width ? dimensions.width / 2 : testRadius;
    const halfHeight = dimensions?.height ? dimensions.height / 2 : testRadius;

    // Use the larger of testRadius or actual half-dimensions for margin
    const marginX = Math.max(baseMargin, halfWidth + 10);
    const marginY = Math.max(baseMargin, halfHeight + 10);

    const playAreaX = layerBounds.x + marginX;
    const playAreaY = layerBounds.y + marginY;
    const playAreaWidth = layerBounds.width - (marginX * 2);
    const playAreaHeight = layerBounds.height - (marginY * 2);

    const clampPosition = (pos: Vector2): Vector2 => {
      // Use actual half-dimensions for clamping to ensure shape stays within bounds
      return {
        x: Math.max(layerBounds.x + halfWidth + 5, Math.min(layerBounds.x + layerBounds.width - halfWidth - 5, pos.x)),
        y: Math.max(layerBounds.y + halfHeight + 5, Math.min(layerBounds.y + layerBounds.height - halfHeight - 5, pos.y))
      };
    };
    
    const checkOverlap = (position: Vector2): boolean => {
      for (const shape of existingShapes) {
        const shapeBounds = shape.getBounds();
        const shapeRadius = Math.max(shapeBounds.width, shapeBounds.height) / 2;
        const distance = Math.sqrt(
          Math.pow(position.x - shape.position.x, 2) + 
          Math.pow(position.y - shape.position.y, 2)
        );
        const requiredDistance = Math.max(minSeparation, testRadius + shapeRadius + 10);
        
        if (distance < requiredDistance) {
          return true;
        }
      }
      return false;
    };
    
    // Try preferred position first
    const clampedPreferred = clampPosition(preferredPosition);
    if (!checkOverlap(clampedPreferred)) {
      return clampedPreferred;
    }
    
    // Try spiral pattern
    const spiralSteps = 50;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    
    for (let i = 1; i <= spiralSteps; i++) {
      const angle = i * goldenAngle;
      const radius = Math.sqrt(i) * minSeparation;
      
      const testPosition = clampPosition({
        x: preferredPosition.x + Math.cos(angle) * radius,
        y: preferredPosition.y + Math.sin(angle) * radius
      });
      
      if (!checkOverlap(testPosition)) {
        return testPosition;
      }
    }
    
    // Try grid positions
    const gridSize = Math.max(Math.max(halfWidth, halfHeight) * 2 + minSeparation, 80);
    const gridPositions: Vector2[] = [];

    for (let gx = layerBounds.x + halfWidth + 10; gx <= layerBounds.x + layerBounds.width - halfWidth - 10; gx += gridSize) {
      for (let gy = layerBounds.y + halfHeight + 10; gy <= layerBounds.y + layerBounds.height - halfHeight - 10; gy += gridSize) {
        gridPositions.push({ x: gx, y: gy });
      }
    }
    
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
    
    // Try corners and center - use proper half-dimensions for each axis
    const corners = [
      { x: layerBounds.x + halfWidth + 20, y: layerBounds.y + halfHeight + 20 },
      { x: layerBounds.x + layerBounds.width - halfWidth - 20, y: layerBounds.y + halfHeight + 20 },
      { x: layerBounds.x + halfWidth + 20, y: layerBounds.y + layerBounds.height - halfHeight - 20 },
      { x: layerBounds.x + layerBounds.width - halfWidth - 20, y: layerBounds.y + layerBounds.height - halfHeight - 20 },
      { x: layerBounds.x + layerBounds.width / 2, y: layerBounds.y + layerBounds.height / 2 }
    ];
    
    for (const corner of corners) {
      const testPosition = clampPosition(corner);
      if (!checkOverlap(testPosition)) {
        return testPosition;
      }
    }
    
    return null;
  }

  private static createMinimalShape(
    position: Vector2,
    layerId: string,
    layerIndex: number,
    physicsLayerGroup: number,
    colorIndex: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _layerBounds: { x: number; y: number; width: number; height: number }
  ): Shape {
    const id = `shape-${++this.shapeCounter}`;
    const radius = 20;
    
    const body = Bodies.circle(position.x, position.y, radius, {
      ...PHYSICS_CONSTANTS.shape,
      render: { visible: false },
    });
    
    Body.setMass(body, body.mass * 2);
    body.friction = PHYSICS_CONSTANTS.shape.friction;
    body.frictionAir = PHYSICS_CONSTANTS.shape.frictionAir;
    body.restitution = PHYSICS_CONSTANTS.shape.restitution;
    body.density = PHYSICS_CONSTANTS.shape.density;
    
    body.collisionFilter = {
      group: physicsLayerGroup,
      category: 1 << (physicsLayerGroup - 1),
      mask: 1 << (physicsLayerGroup - 1)
    };
    
    const color = this.getLayerColor(colorIndex);
    // Use offset tint to avoid same-color stroke and fill (better visual distinction)
    const tint = SHAPE_TINTS[(colorIndex + 2) % SHAPE_TINTS.length];
    
    return new Shape(
      id,
      'circle',
      position,
      body,
      layerId,
      color,
      tint,
      'circle', // Use 'circle' as the definition ID for fallback shapes
      { radius }
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