import { Body } from 'matter-js';
import { Shape as IShape, ShapeType, Vector2, Screw } from '@/types/game';
import { UI_CONSTANTS, DEBUG_CONFIG } from '@/shared/utils/Constants';
import { GeometryRenderer } from '@/shared/rendering/core/GeometryRenderer';

/**
 * Represents a shape entity in the physics puzzle game with integrated screw management.
 * 
 * Shapes are the primary interactive objects that players manipulate by removing screws.
 * Each shape maintains its own physics body, visual properties, and collection of screws
 * that hold it in place within the game layer.
 * 
 * Key features:
 * - Integration with Matter.js physics engine
 * - Dynamic screw placement and removal
 * - Layer-based organization and collision
 * - Path2D generation for rendering
 * - Composite shape support for complex geometries
 * - Tinting system for layer identification
 * 
 * @example
 * ```typescript
 * const shape = new Shape('shape-1', 'rectangle', 'rect-def', {x: 100, y: 100}, 
 *                        0, physicsBody, 'layer-1', '#ff0000', '#ffcccc');
 * shape.addScrew(screw);
 * shape.setColor('#00ff00');
 * ```
 */
export class Shape implements IShape {
  public id: string;
  public type: ShapeType;
  public definitionId: string; // Store the original definition ID for strategy lookup
  public position: Vector2;
  public rotation: number;
  public width?: number;
  public height?: number;
  public radius?: number;
  public sides?: number;
  public vertices?: Vector2[];
  public body: Body;
  public screws: Screw[] = [];
  public holes: Vector2[] = []; // Positions where screws were removed
  public layerId: string;
  public color: string;
  
  // Throttling for path creation debug logging
  private static lastPathCreationLog = 0;
  private static readonly PATH_CREATION_THROTTLE_MS = 5000; // 5 seconds
  public tint: string;
  public isComposite?: boolean;
  public parts?: Body[];

  constructor(
    id: string,
    type: ShapeType,
    position: Vector2,
    body: Body,
    layerId: string,
    color: string,
    tint: string,
    definitionId: string, // Add definitionId parameter
    dimensions?: {
      width?: number;
      height?: number;
      radius?: number;
      sides?: number;
      vertices?: Vector2[];
    },
    compositeData?: {
      isComposite: boolean;
      parts: Body[];
    }
  ) {
    if (DEBUG_CONFIG.logShapeDebug) {
      console.log(`Shape constructor: Creating shape with type='${type}', id='${id}', dimensions:`, dimensions);
    }
    
    this.id = id;
    this.type = type;
    this.definitionId = definitionId;
    this.position = position;
    this.rotation = 0;
    this.body = body;
    this.layerId = layerId;
    this.color = color;
    this.tint = tint;

    if (dimensions) {
      this.width = dimensions.width;
      this.height = dimensions.height;
      this.radius = dimensions.radius;
      this.sides = dimensions.sides;
      this.vertices = dimensions.vertices;
    }

    if (compositeData) {
      this.isComposite = compositeData.isComposite;
      this.parts = compositeData.parts;
    }

    // Store shape reference on body for easy lookup
    this.body.label = `shape-${this.id}`;
    (this.body as Body & { shapeId: string }).shapeId = this.id;

    // Also label parts if composite
    if (this.parts) {
      this.parts.forEach((part, index) => {
        part.label = `shape-${this.id}-part-${index}`;
        (part as Body & { shapeId: string }).shapeId = this.id;
      });
    }
  }

  public updateFromBody(): void {
    this.position = { x: this.body.position.x, y: this.body.position.y };
    this.rotation = this.body.angle;
  }

  public addScrew(screw: Screw): void {
    this.screws.push(screw);
    
    // Debug logging to trace screw addition
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`🔩 Shape.addScrew: Added screw ${screw.id} to shape ${this.id}, now has ${this.screws.length} screws`);
    }
  }

  public removeScrew(screwId: string): boolean {
    const index = this.screws.findIndex(s => s.id === screwId);
    if (index !== -1) {
      this.screws.splice(index, 1);
      return true;
    }
    return false;
  }

  public getAllScrews(): Screw[] {
    return [...this.screws];
  }

  public getActiveScrews(): Screw[] {
    return this.screws.filter(s => !s.isCollected);
  }

  public hasAnyScrews(): boolean {
    return this.getActiveScrews().length > 0;
  }

  public getBounds(): { x: number; y: number; width: number; height: number } {
    const bounds = this.body.bounds;
    return {
      x: bounds.min.x,
      y: bounds.min.y,
      width: bounds.max.x - bounds.min.x,
      height: bounds.max.y - bounds.min.y,
    };
  }

  public getPath2D(): Path2D {
    const path = new Path2D();
    
    // Throttled debug logging for path creation
    if (DEBUG_CONFIG.logShapePathCreation) {
      const now = Date.now();
      if (now - Shape.lastPathCreationLog > Shape.PATH_CREATION_THROTTLE_MS) {
        console.log(`Shape.getPath2D(): Creating path for shape type '${this.type}', width: ${this.width}, height: ${this.height}, radius: ${this.radius}`);
        Shape.lastPathCreationLog = now;
      }
    }

    switch (this.type) {
      case 'rectangle':
        return this.createRectanglePath();
      case 'circle':
        return this.createCirclePath();
      case 'polygon':
        return this.createPolygonPath();
      case 'capsule':
        return this.createCapsulePath();
      case 'arrow':
      case 'chevron':
      case 'star':
      case 'horseshoe':
        return this.createPathFromVertices();
      default:
        console.warn(`Shape.getPath2D(): Unknown shape type '${this.type}', returning empty path`);
        return path;
    }
  }

  private createRectanglePath(): Path2D {
    const path = new Path2D();
    const w = this.width || 60;
    const h = this.height || 60;
    const radius = Math.min(w, h) * 0.1;

    // Create rounded rectangle centered at origin (0,0) - transform will position it correctly
    const x = -w / 2;
    const y = -h / 2;

    path.moveTo(x + radius, y);
    path.lineTo(x + w - radius, y);
    path.quadraticCurveTo(x + w, y, x + w, y + radius);
    path.lineTo(x + w, y + h - radius);
    path.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    path.lineTo(x + radius, y + h);
    path.quadraticCurveTo(x, y + h, x, y + h - radius);
    path.lineTo(x, y + radius);
    path.quadraticCurveTo(x, y, x + radius, y);
    path.closePath();

    return path;
  }

  private createCirclePath(): Path2D {
    const path = new Path2D();
    const r = this.radius || 30;
    // Use origin-relative coordinates (0,0) - transform will position it correctly
    path.arc(0, 0, r, 0, Math.PI * 2);
    return path;
  }

  private createPolygonPath(): Path2D {
    const radius = this.radius || 30;
    const sides = this.sides || 5; // Default to pentagon if sides not specified
    
    // Generate polygon vertices
    const vertices: { x: number; y: number }[] = [];
    for (let i = 0; i < sides; i++) {
      // Match Matter.js Bodies.polygon() vertex orientation - rotation is handled by ShapeRenderer canvas transforms
      const angle = (i * Math.PI * 2) / sides + (Math.PI / sides); // Align with Matter.js polygon orientation
      // Use origin-relative coordinates (0,0) - transform will position it correctly
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      vertices.push({ x, y });
    }
    
    // Use GeometryRenderer to create rounded polygon path
    const cornerRadius = 12; // Consistent with other rounded shapes
    return GeometryRenderer.createRoundedPolygonPath2D(vertices, cornerRadius, true);
  }

  private createCapsulePath(): Path2D {
    const path = new Path2D();
    const w = this.width || 120; // Default width
    const h = this.height || (UI_CONSTANTS.screws.radius * 2 + 10); // Default height (2x screw radius + 10px)
    const radius = h / 2; // Circle radius is half the height

    // Draw capsule centered at origin (0,0) - transform will position it correctly
    const x = -w / 2;
    const y = -h / 2;

    // Start from top-left corner of rectangle part
    path.moveTo(x + radius, y);
    
    // Top line
    path.lineTo(x + w - radius, y);
    
    // Right semicircle - curve outward (clockwise from top to bottom)
    path.arc(x + w - radius, y + radius, radius, -Math.PI / 2, Math.PI / 2, false);
    
    // Bottom line (right to left)
    path.lineTo(x + radius, y + h);
    
    // Left semicircle - curve outward (clockwise from bottom to top)  
    path.arc(x + radius, y + radius, radius, Math.PI / 2, -Math.PI / 2, false);
    
    path.closePath();
    return path;
  }

  private createPathFromVertices(): Path2D {
    // For path-based shapes, use stored vertices for accurate rendering
    // For other shapes, use physics body vertices
    if (this.vertices && this.vertices.length > 0) {
      // These vertices are in local space relative to shape center
      // Use GeometryRenderer to create rounded polygon path for polished look
      const cornerRadius = 10; // Slightly smaller for custom shapes
      return GeometryRenderer.createRoundedPolygonPath2D(this.vertices, cornerRadius, true);
    } else if (this.body.vertices && this.body.vertices.length > 0) {
      // Fall back to physics body vertices (already in world coordinates)
      // Convert to origin-relative coordinates
      const vertices = this.body.vertices;
      const centerX = this.position.x;
      const centerY = this.position.y;
      
      // Convert vertices to relative coordinates
      const relativeVertices = vertices.map(v => ({
        x: v.x - centerX,
        y: v.y - centerY
      }));
      
      // Use rounded polygon path
      const cornerRadius = 10; // Slightly smaller for custom shapes
      return GeometryRenderer.createRoundedPolygonPath2D(relativeVertices, cornerRadius, true);
    }
    
    return new Path2D();
  }

  public getPerimeterPoints(count: number = 16): Vector2[] {
    const points: Vector2[] = [];
    const centerX = this.position.x;
    const centerY = this.position.y;

    switch (this.type) {
      case 'circle':
        const radius = this.radius || 30;
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2;
          points.push({
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius,
          });
        }
        break;

      case 'rectangle':
        const w = this.width || 60;
        const h = this.height || 60;
        const perimeter = 2 * (w + h);

        for (let i = 0; i < count; i++) {
          const t = (i / count) * perimeter;
          let x, y;

          if (t < w) {
            // Top edge
            x = centerX - w/2 + t;
            y = centerY - h/2;
          } else if (t < w + h) {
            // Right edge
            x = centerX + w/2;
            y = centerY - h/2 + (t - w);
          } else if (t < 2 * w + h) {
            // Bottom edge
            x = centerX + w/2 - (t - w - h);
            y = centerY + h/2;
          } else {
            // Left edge
            x = centerX - w/2;
            y = centerY + h/2 - (t - 2 * w - h);
          }

          points.push({ x, y });
        }
        break;

      case 'polygon':
        const polygonRadius = this.radius || 30;
        const polygonSides = this.sides || 5; // Default to pentagon if not specified
        const polygonVertices: Vector2[] = [];

        // Generate polygon vertices with rotation applied for perimeter screw placement, matching Matter.js orientation
        for (let i = 0; i < polygonSides; i++) {
          const angle = (i * Math.PI * 2) / polygonSides + (Math.PI / polygonSides) + this.rotation;
          polygonVertices.push({
            x: this.position.x + Math.cos(angle) * polygonRadius,
            y: this.position.y + Math.sin(angle) * polygonRadius,
          });
        }

        // Distribute points along polygon edges
        for (let i = 0; i < count; i++) {
          const edgeIndex = Math.floor((i / count) * polygonVertices.length);
          const t = ((i / count) * polygonVertices.length) % 1;
          const v1 = polygonVertices[edgeIndex];
          const v2 = polygonVertices[(edgeIndex + 1) % polygonVertices.length];

          points.push({
            x: v1.x + (v2.x - v1.x) * t,
            y: v1.y + (v2.y - v1.y) * t,
          });
        }
        break;

      case 'capsule':
        const capsuleW = this.width || 120;
        const capsuleH = this.height || (UI_CONSTANTS.screws.radius * 2 + 10);
        const capsuleRadius = capsuleH / 2;
        
        // Generate points along the capsule perimeter
        const capsulePerimeter = 2 * (capsuleW - 2 * capsuleRadius) + 2 * Math.PI * capsuleRadius;
        
        for (let i = 0; i < count; i++) {
          const t = (i / count) * capsulePerimeter;
          let x, y;
          
          if (t < capsuleW - 2 * capsuleRadius) {
            // Top straight edge
            x = centerX - capsuleW / 2 + capsuleRadius + t;
            y = centerY - capsuleH / 2;
          } else if (t < capsuleW - 2 * capsuleRadius + Math.PI * capsuleRadius) {
            // Right semicircle
            const angle = -Math.PI / 2 + (t - (capsuleW - 2 * capsuleRadius)) / capsuleRadius;
            x = centerX + capsuleW / 2 - capsuleRadius + Math.cos(angle) * capsuleRadius;
            y = centerY + Math.sin(angle) * capsuleRadius;
          } else if (t < 2 * (capsuleW - 2 * capsuleRadius) + Math.PI * capsuleRadius) {
            // Bottom straight edge
            x = centerX + capsuleW / 2 - capsuleRadius - (t - (capsuleW - 2 * capsuleRadius + Math.PI * capsuleRadius));
            y = centerY + capsuleH / 2;
          } else {
            // Left semicircle
            const angle = Math.PI / 2 + (t - (2 * (capsuleW - 2 * capsuleRadius) + Math.PI * capsuleRadius)) / capsuleRadius;
            x = centerX - capsuleW / 2 + capsuleRadius + Math.cos(angle) * capsuleRadius;
            y = centerY + Math.sin(angle) * capsuleRadius;
          }
          
          points.push({ x, y });
        }
        break;

      case 'arrow':
      case 'chevron':
      case 'star':
      case 'horseshoe':
        // Use body vertices for path-based shapes
        if (this.body.vertices && this.body.vertices.length > 0) {
          const vertices = this.body.vertices;
          const totalLength = this.calculatePerimeterLength(vertices);
          
          for (let i = 0; i < count; i++) {
            const targetDistance = (i / count) * totalLength;
            const point = this.getPointAtDistance(vertices, targetDistance);
            points.push(point);
          }
        }
        break;

      default:
        // Fallback to body vertices
        this.body.vertices.forEach(vertex => {
          points.push({ x: vertex.x, y: vertex.y });
        });
    }

    return points;
  }

  private calculatePerimeterLength(vertices: Matter.Vector[]): number {
    let length = 0;
    for (let i = 0; i < vertices.length; i++) {
      const v1 = vertices[i];
      const v2 = vertices[(i + 1) % vertices.length];
      length += Math.sqrt(Math.pow(v2.x - v1.x, 2) + Math.pow(v2.y - v1.y, 2));
    }
    return length;
  }

  private getPointAtDistance(vertices: Matter.Vector[], targetDistance: number): Vector2 {
    let currentDistance = 0;
    
    for (let i = 0; i < vertices.length; i++) {
      const v1 = vertices[i];
      const v2 = vertices[(i + 1) % vertices.length];
      const edgeLength = Math.sqrt(Math.pow(v2.x - v1.x, 2) + Math.pow(v2.y - v1.y, 2));
      
      if (currentDistance + edgeLength >= targetDistance) {
        const t = (targetDistance - currentDistance) / edgeLength;
        return {
          x: v1.x + (v2.x - v1.x) * t,
          y: v1.y + (v2.y - v1.y) * t
        };
      }
      
      currentDistance += edgeLength;
    }
    
    // Fallback to last vertex
    return { x: vertices[vertices.length - 1].x, y: vertices[vertices.length - 1].y };
  }

  public dispose(): void {
    // Only dispose of screws that this shape still owns
    this.screws = this.screws.filter(screw => {
      if (screw.canBeDeletedBy(this.id)) {
        // This shape owns the screw, it can be disposed
        screw.dispose();
        return false; // Remove from array
      } else {
        // Screw is owned by someone else (container/holding hole), keep reference
        if (DEBUG_CONFIG.logScrewDebug) {
          const ownerInfo = screw.getOwnerInfo();
          console.log(`Shape ${this.id} preserving screw ${screw.id} - owned by ${ownerInfo.ownerType} ${ownerInfo.owner}`);
        }
        return true; // Keep in array
      }
    });
  }
}
