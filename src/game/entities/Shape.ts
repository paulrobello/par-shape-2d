import { Body } from 'matter-js';
import { Shape as IShape, ShapeType, Vector2, Screw } from '@/types/game';
import { createRegularPolygonVertices } from '@/game/utils/MathUtils';
import { UI_CONSTANTS } from '@/game/utils/Constants';

export class Shape implements IShape {
  public id: string;
  public type: ShapeType;
  public position: Vector2;
  public rotation: number;
  public width?: number;
  public height?: number;
  public radius?: number;
  public vertices?: Vector2[];
  public body: Body;
  public screws: Screw[] = [];
  public holes: Vector2[] = []; // Positions where screws were removed
  public layerId: string;
  public color: string;
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
    dimensions?: {
      width?: number;
      height?: number;
      radius?: number;
      vertices?: Vector2[];
    },
    compositeData?: {
      isComposite: boolean;
      parts: Body[];
    }
  ) {
    this.id = id;
    this.type = type;
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

    switch (this.type) {
      case 'rectangle':
      case 'square':
        return this.createRectanglePath();
      case 'circle':
        return this.createCirclePath();
      case 'triangle':
        return this.createTrianglePath();
      case 'pentagon':
        return this.createPentagonPath();
      case 'capsule':
        return this.createCapsulePath();
      default:
        return path;
    }
  }

  private createRectanglePath(): Path2D {
    const path = new Path2D();
    const w = this.width || 60;
    const h = this.height || 60;
    const radius = Math.min(w, h) * 0.1;

    // Create rounded rectangle
    const x = this.position.x - w / 2;
    const y = this.position.y - h / 2;

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
    path.arc(this.position.x, this.position.y, r, 0, Math.PI * 2);
    return path;
  }

  private createTrianglePath(): Path2D {
    const path = new Path2D();
    const r = this.radius || 30;
    const vertices = createRegularPolygonVertices(this.position, r, 3);

    if (vertices.length > 0) {
      path.moveTo(vertices[0].x, vertices[0].y);
      for (let i = 1; i < vertices.length; i++) {
        path.lineTo(vertices[i].x, vertices[i].y);
      }
      path.closePath();
    }

    return path;
  }

  private createPentagonPath(): Path2D {
    const path = new Path2D();
    const radius = this.radius || 30;
    const sides = 5; // Pentagon to match physics shape

    for (let i = 0; i < sides; i++) {
      const angle = (i * Math.PI * 2) / sides - Math.PI / 2; // Start from top
      const x = this.position.x + Math.cos(angle) * radius;
      const y = this.position.y + Math.sin(angle) * radius;

      if (i === 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }

    path.closePath();
    return path;
  }

  private createCapsulePath(): Path2D {
    const path = new Path2D();
    const w = this.width || 120; // Default width
    const h = this.height || (UI_CONSTANTS.screws.radius * 2 + 10); // Default height (2x screw radius + 10px)
    const radius = h / 2; // Circle radius is half the height

    // Draw capsule centered at position
    const x = this.position.x - w / 2;
    const y = this.position.y - h / 2;

    // Start from top-left corner of rectangle part
    path.moveTo(x + radius, y);
    
    // Top line
    path.lineTo(x + w - radius, y);
    
    // Right semicircle
    path.arc(x + w - radius, y + radius, radius, -Math.PI / 2, Math.PI / 2);
    
    // Bottom line
    path.lineTo(x + radius, y + h);
    
    // Left semicircle
    path.arc(x + radius, y + radius, radius, Math.PI / 2, Math.PI * 1.5);
    
    path.closePath();
    return path;
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
      case 'square':
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

      case 'triangle':
        const triangleRadius = this.radius || 30;
        const triangleVertices = createRegularPolygonVertices(this.position, triangleRadius, 3);
        for (let i = 0; i < count; i++) {
          const edgeIndex = Math.floor((i / count) * 3);
          const t = ((i / count) * 3) % 1;
          const v1 = triangleVertices[edgeIndex];
          const v2 = triangleVertices[(edgeIndex + 1) % 3];

          points.push({
            x: v1.x + (v2.x - v1.x) * t,
            y: v1.y + (v2.y - v1.y) * t,
          });
        }
        break;

      case 'pentagon':
        const pentagonRadius = this.radius || 30;
        const sides = 5; // Pentagon vertices
        const pentagonVertices: Vector2[] = [];

        // Generate pentagon vertices
        for (let i = 0; i < sides; i++) {
          const angle = (i * Math.PI * 2) / sides - Math.PI / 2;
          pentagonVertices.push({
            x: this.position.x + Math.cos(angle) * pentagonRadius,
            y: this.position.y + Math.sin(angle) * pentagonRadius,
          });
        }

        // Distribute points along pentagon edges
        for (let i = 0; i < count; i++) {
          const edgeIndex = Math.floor((i / count) * pentagonVertices.length);
          const t = ((i / count) * pentagonVertices.length) % 1;
          const v1 = pentagonVertices[edgeIndex];
          const v2 = pentagonVertices[(edgeIndex + 1) % pentagonVertices.length];

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

      default:
        // Fallback to body vertices
        this.body.vertices.forEach(vertex => {
          points.push({ x: vertex.x, y: vertex.y });
        });
    }

    return points;
  }

  public dispose(): void {
    this.screws = [];
  }

  // Serialization methods for save/load
  public toSerializable(): import('@/types/game').SerializableShape {
    return {
      id: this.id,
      type: this.type,
      position: { ...this.position },
      rotation: this.rotation,
      width: this.width,
      height: this.height,
      radius: this.radius,
      vertices: this.vertices ? [...this.vertices] : undefined,
      screws: (this.screws || []).map(screw => ({
        id: screw.id,
        shapeId: screw.shapeId,
        position: { ...screw.position },
        color: screw.color,
        isRemovable: screw.isRemovable,
        isCollected: screw.isCollected,
        isBeingCollected: screw.isBeingCollected,
        targetContainerId: screw.targetContainerId,
      })),
      holes: this.holes ? this.holes.map(hole => ({ ...hole })) : [], // Include screw holes
      layerId: this.layerId,
      color: this.color,
      tint: this.tint,
      // Physics body properties for recreation
      bodyPosition: this.body ? { x: this.body.position.x, y: this.body.position.y } : { ...this.position },
      bodyAngle: this.body ? this.body.angle : this.rotation,
      bodyVelocity: this.body ? {
        x: (typeof this.body.velocity.x === 'number' && isFinite(this.body.velocity.x)) ? this.body.velocity.x : 0,
        y: (typeof this.body.velocity.y === 'number' && isFinite(this.body.velocity.y)) ? this.body.velocity.y : 0
      } : { x: 0, y: 0 },
      bodyAngularVelocity: this.body ? 
        (typeof this.body.angularVelocity === 'number' && isFinite(this.body.angularVelocity)) ? this.body.angularVelocity : 0 
        : 0,
      isStatic: this.body ? this.body.isStatic : false,
      isSleeping: this.body ? this.body.isSleeping : false,
      // Physics material properties
      friction: this.body ? this.body.friction : 0.1,
      frictionAir: this.body ? this.body.frictionAir : 0.01,
      restitution: this.body ? this.body.restitution : 0.3,
      density: this.body ? this.body.density : 0.001,
      // Collision filter properties
      collisionGroup: this.body ? (this.body.collisionFilter.group || 0) : 0,
      collisionCategory: this.body ? (this.body.collisionFilter.category || 1) : 1,
      collisionMask: this.body ? (this.body.collisionFilter.mask ?? 0xFFFFFFFF) : 0xFFFFFFFF,
      // Body identification
      bodyLabel: this.body ? this.body.label : `shape-${this.id}`,
    };
  }

  public fromSerializable(
    data: import('@/types/game').SerializableShape,
    physicsWorld: import('@/game/physics/PhysicsWorld').PhysicsWorld,
    screwManager: import('@/game/systems/ScrewManager').ScrewManager
  ): void {
    // Simple restoration - just update position from save data
    if (data.bodyPosition) {
      const Matter = require('matter-js'); // eslint-disable-line @typescript-eslint/no-require-imports
      Matter.Body.setPosition(this.body, data.bodyPosition);
      this.position = { ...data.bodyPosition };
    }
    
    // Restore holes
    this.holes = data.holes ? data.holes.map(hole => ({ ...hole })) : [];
    
    console.log(`Updated shape ${this.id} position to (${this.position.x}, ${this.position.y})`);

    // Restore screws - connect to existing screws in ScrewManager instead of creating new ones
    this.screws = [];
    if (data.screws) {
      data.screws.forEach(screwData => {
        // Find existing screw in ScrewManager by ID
        const existingScrew = screwManager.getScrew(screwData.id);
        
        if (existingScrew) {
          // Use existing screw and attach it to this shape
          this.screws.push(existingScrew);
          
          // Constraint is already handled by the event-driven ScrewManager
          // No need to manually attach constraints in the event-driven architecture
        } else {
          // Fallback: create screw if not found in manager (shouldn't happen with proper order)
          console.warn(`Screw ${screwData.id} not found in ScrewManager, creating new one`);
          
          const { Screw: ScrewClass } = require('@/game/entities/Screw'); // eslint-disable-line @typescript-eslint/no-require-imports
          const screw = new ScrewClass(
            screwData.id,
            screwData.shapeId,
            screwData.position,
            screwData.color
          );

          // Restore screw properties
          screw.isRemovable = screwData.isRemovable;
          screw.isCollected = screwData.isCollected;
          screw.isBeingCollected = screwData.isBeingCollected;
          screw.targetContainerId = screwData.targetContainerId;

          this.screws.push(screw);

          // In event-driven architecture, screws are managed automatically
          // No need to manually register screws
        }
      });
    }
  }

    // Rest of fromSerializable method is fine as is
}
