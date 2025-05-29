import { Body } from 'matter-js';
import { Shape as IShape, ShapeType, Vector2, Screw } from '@/types/game';
import { createRegularPolygonVertices } from '@/game/utils/MathUtils';

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

    // Store shape reference on body for easy lookup
    this.body.label = `shape-${this.id}`;
    (this.body as Body & { shapeId: string }).shapeId = this.id;
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
      case 'star':
        return this.createStarPath();
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

  private createStarPath(): Path2D {
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
        
      case 'star':
        const starRadius = this.radius || 30;
        const sides = 5; // Pentagon vertices
        const pentagonVertices: Vector2[] = [];
        
        // Generate pentagon vertices
        for (let i = 0; i < sides; i++) {
          const angle = (i * Math.PI * 2) / sides - Math.PI / 2;
          pentagonVertices.push({
            x: this.position.x + Math.cos(angle) * starRadius,
            y: this.position.y + Math.sin(angle) * starRadius,
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
      bodyVelocity: this.body ? { x: this.body.velocity.x, y: this.body.velocity.y } : { x: 0, y: 0 },
      bodyAngularVelocity: this.body ? this.body.angularVelocity : 0,
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
    console.log('Shape.fromSerializable called with data:', data);
    
    if (!data) {
      console.error('Shape.fromSerializable: data is undefined');
      return;
    }
    
    // Update properties that might have changed
    this.position = data.position ? { ...data.position } : { ...this.position };
    this.rotation = data.rotation || this.rotation;
    this.layerId = data.layerId || this.layerId;
    this.color = data.color || this.color;
    this.tint = data.tint || this.tint;
    
    // Restore holes where screws were removed
    this.holes = data.holes ? data.holes.map(hole => ({ ...hole })) : [];
    
    // Recreate physics body with saved state
    // First remove old body if it exists
    if (this.body) {
      physicsWorld.removeBodies([this.body]);
    }
    
    // Create new body based on shape type and restore its state
    console.log('Creating physics body for shape:', this.id, 'type:', this.type);
    this.body = this.createPhysicsBody(data);
    physicsWorld.addBodies([this.body]);
    
    // Restore screws
    this.screws = [];
    if (data.screws) {
      data.screws.forEach(screwData => {
        // Import Screw class here to avoid circular dependencies
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
        
        // Register screw with screw manager if not collected
        if (!screw.isCollected) {
          screwManager.addScrew(screw);
          if (!screw.isBeingCollected) {
            screwManager.attachScrewToShape(screw, this);
          }
        }
      });
    }
  }

  private createPhysicsBody(data: import('@/types/game').SerializableShape): Body {
    console.log('createPhysicsBody called with data:', {
      hasBodyPosition: !!data.bodyPosition,
      hasPosition: !!data.position,
      type: this.type,
      id: this.id
    });
    
    // Import Matter.js here to avoid circular dependencies
    const Matter = require('matter-js'); // eslint-disable-line @typescript-eslint/no-require-imports
    
    // Use bodyPosition if available, otherwise fall back to position
    const bodyPos = data.bodyPosition || data.position || { x: 0, y: 0 };
    const bodyAngle = data.bodyAngle || data.rotation || 0;
    const bodyVel = data.bodyVelocity || { x: 0, y: 0 };
    const bodyAngVel = data.bodyAngularVelocity || 0;
    const isStatic = data.isStatic || false;
    const isSleeping = data.isSleeping || false;
    
    // Physics material properties with fallbacks from PHYSICS_CONSTANTS
    const friction = data.friction ?? 0.1;
    const frictionAir = data.frictionAir ?? 0.01; 
    const restitution = data.restitution ?? 0.3;
    const density = data.density ?? 0.001;
    
    // Collision filter properties
    const collisionGroup = data.collisionGroup || 0;
    const collisionCategory = data.collisionCategory || 1;
    const collisionMask = data.collisionMask ?? 0xFFFFFFFF;
    
    // Body identification
    const bodyLabel = data.bodyLabel || `shape-${this.id}`;
    
    console.log('createPhysicsBody using:', { 
      bodyPos, 
      bodyAngle, 
      type: this.type,
      collisionGroup,
      collisionCategory,
      collisionMask,
      friction,
      density
    });
    
    let body: Body;
    
    try {
      switch (this.type) {
      case 'rectangle':
        body = Matter.Bodies.rectangle(
          bodyPos.x,
          bodyPos.y,
          data.width || 100,
          data.height || 60,
          {
            friction,
            frictionAir,
            restitution,
            density,
            render: { visible: false }
          }
        );
        break;
      case 'square':
        const size = data.width || 80;
        body = Matter.Bodies.rectangle(
          bodyPos.x,
          bodyPos.y,
          size,
          size,
          {
            friction,
            frictionAir,
            restitution,
            density,
            render: { visible: false }
          }
        );
        break;
      case 'circle':
        body = Matter.Bodies.circle(
          bodyPos.x,
          bodyPos.y,
          data.radius || 40,
          {
            friction,
            frictionAir,
            restitution,
            density,
            render: { visible: false }
          }
        );
        break;
      case 'triangle':
        const triangleVertices = data.vertices || [
          { x: 0, y: -40 },
          { x: -35, y: 30 },
          { x: 35, y: 30 }
        ];
        console.log('Triangle vertices:', triangleVertices.length, triangleVertices);
        
        if (triangleVertices.length >= 3) {
          const absoluteTriangleVertices = triangleVertices.map(v => ({
            x: v.x + bodyPos.x,
            y: v.y + bodyPos.y
          }));
          body = Matter.Bodies.fromVertices(
            bodyPos.x,
            bodyPos.y,
            [absoluteTriangleVertices],
            {
              friction,
              frictionAir,
              restitution,
              density,
              render: { visible: false }
            }
          );
        } else {
          console.log('Triangle vertices invalid, falling back to rectangle');
          // Fallback to rectangle if vertices are invalid
          body = Matter.Bodies.rectangle(
            bodyPos.x,
            bodyPos.y,
            data.width || 100,
            data.height || 60,
            {
              friction,
              frictionAir,
              restitution,
              density,
              render: { visible: false }
            }
          );
        }
        break;
      case 'star':
        const starVertices = data.vertices || [];
        console.log('Star vertices:', starVertices.length, starVertices);
        
        if (starVertices.length >= 3) {
          const absoluteStarVertices = starVertices.map(v => ({
            x: v.x + bodyPos.x,
            y: v.y + bodyPos.y
          }));
          body = Matter.Bodies.fromVertices(
            bodyPos.x,
            bodyPos.y,
            [absoluteStarVertices],
            {
              friction,
              frictionAir,
              restitution,
              density,
              render: { visible: false }
            }
          );
        } else {
          console.log('Star vertices invalid, falling back to circle');
          // Fallback to circle if vertices are invalid
          body = Matter.Bodies.circle(
            bodyPos.x,
            bodyPos.y,
            data.radius || 40,
            {
              friction,
              frictionAir,
              restitution,
              density,
              render: { visible: false }
            }
          );
        }
        break;
      default:
        // Fallback to rectangle
        body = Matter.Bodies.rectangle(
          bodyPos.x,
          bodyPos.y,
          100,
          60,
          {
            friction,
            frictionAir,
            restitution,
            density,
            render: { visible: false }
          }
        );
      }
    } catch (error) {
      console.error('Error creating physics body, using fallback rectangle:', error);
      // Ultimate fallback - simple rectangle
      body = Matter.Bodies.rectangle(
        bodyPos.x,
        bodyPos.y,
        100,
        60,
        {
          friction,
          frictionAir,
          restitution,
          density,
          render: { visible: false }
        }
      );
    }
    
    // Set collision filter and identification
    body.collisionFilter.group = collisionGroup;
    body.collisionFilter.category = collisionCategory;
    body.collisionFilter.mask = collisionMask;
    body.label = bodyLabel;
    
    // Store shape reference on body for easy lookup
    (body as Body & { shapeId: string }).shapeId = this.id;
    
    // Restore physics state
    try {
      Matter.Body.setAngle(body, bodyAngle);
      Matter.Body.setVelocity(body, bodyVel);
      Matter.Body.setAngularVelocity(body, bodyAngVel);
      Matter.Body.setStatic(body, isStatic);
      
      if (isSleeping) {
        Matter.Sleeping.set(body, true);
      }
    } catch (error) {
      console.error('Error setting physics body properties:', error);
      // Continue with basic body - physics state restoration failed but body is still usable
    }
    
    return body;
  }
}