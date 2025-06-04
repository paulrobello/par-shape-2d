import { BaseEditorSystem } from '../core/BaseEditorSystem';
import { ShapeDefinition } from '@/types/shapes';
import { Bodies, Body, Vertices, Bounds } from 'matter-js';
import { Shape } from '@/game/entities/Shape';
import { Screw } from '@/game/entities/Screw';
import { ShapeRenderer } from '@/game/rendering/ShapeRenderer';
import { ScrewRenderer } from '@/game/rendering/ScrewRenderer';
import { EditorEventPriority } from '../core/EditorEventBus';
import { 
  EditorShapeCreatedEvent, 
  EditorShapeUpdatedEvent, 
  EditorShapeDestroyedEvent, 
  EditorCanvasResizedEvent, 
  EditorPhysicsDebugToggledEvent,
  EditorScrewAddedEvent,
  EditorScrewRemovedEvent,
  EditorPhysicsSimulationShapeRequestedEvent
} from '../events/EditorEventTypes';
import { Vector2, ShapeType } from '@/types/game';
import { DEBUG_CONFIG } from '@/shared/utils/Constants';
import { initializePolyDecomp, isPolyDecompInitialized } from '@/game/utils/PhysicsInit';
import {
  ScrewPlacementStrategyFactory
} from '@/shared/strategies';

interface EditorShape {
  shape: Shape;
  screws: Screw[];
  definition: ShapeDefinition;
  id: string;
}

/**
 * ShapeEditorManager handles shape creation, modification, and screw placement
 * for the shape editor interface.
 */
export class ShapeEditorManager extends BaseEditorSystem {
  private currentShape: EditorShape | null = null;
  private canvasWidth: number = 800;
  private canvasHeight: number = 600;
  private debugMode: boolean = false;
  private isSimulationRunning: boolean = false;

  constructor() {
    super('ShapeEditorManager');
    this.setupEventHandlers();
    
    // Initialize poly-decomp if not already done
    if (!isPolyDecompInitialized()) {
      initializePolyDecomp();
    }
  }

  private setupEventHandlers(): void {
    this.subscribe('editor:shape:created', this.handleShapeCreated.bind(this), EditorEventPriority.HIGH);
    this.subscribe('editor:shape:updated', this.handleShapeUpdated.bind(this), EditorEventPriority.HIGH);
    this.subscribe('editor:shape:destroyed', this.handleShapeDestroyed.bind(this), EditorEventPriority.HIGH);
    this.subscribe('editor:canvas:resized', this.handleCanvasResized.bind(this), EditorEventPriority.NORMAL);
    this.subscribe('editor:physics:debug:toggled', this.handlePhysicsDebugToggled.bind(this), EditorEventPriority.NORMAL);
    this.subscribe('editor:screw:added', this.handleScrewAdded.bind(this), EditorEventPriority.HIGH);
    this.subscribe('editor:screw:removed', this.handleScrewRemoved.bind(this), EditorEventPriority.HIGH);
    this.subscribe('editor:physics:simulation:shape:requested', this.handlePhysicsSimulationShapeRequested.bind(this), EditorEventPriority.HIGH);
    this.subscribe('editor:physics:start:requested', this.handlePhysicsStart.bind(this), EditorEventPriority.HIGH);
    this.subscribe('editor:physics:pause:requested', this.handlePhysicsPause.bind(this), EditorEventPriority.HIGH);
    this.subscribe('editor:physics:reset:requested', this.handlePhysicsReset.bind(this), EditorEventPriority.HIGH);
  }

  protected async onInitialize(): Promise<void> {
    // System-specific initialization logic
    if (DEBUG_CONFIG.logShapeDebug) {
      console.log('✅ ShapeEditorManager initialized');
    }
  }

  protected onUpdate(deltaTime: number): void {
    // Update logic if needed (deltaTime parameter required by interface)
    void deltaTime; // Explicitly mark as unused
  }

  protected onRender(context: CanvasRenderingContext2D): void {
    // Delegate to the public render method
    this.render(context);
  }

  protected onDestroy(): void {
    // Clean up resources
    this.currentShape = null;
    
    if (DEBUG_CONFIG.logShapeDebug) {
      console.log('❌ ShapeEditorManager destroyed');
    }
  }

  // Event handlers
  private async handleShapeCreated(event: EditorShapeCreatedEvent): Promise<void> {
    if (!this.isActive) return;
    
    const { shapeDefinition, shapeId } = event.payload;
    
    await this.createShape(shapeDefinition, shapeId);
  }

  private async handleShapeUpdated(event: EditorShapeUpdatedEvent): Promise<void> {
    if (!this.isActive) return;
    
    if (!this.currentShape || this.currentShape.id !== event.payload.shapeId) {
      // Create new shape if none exists or ID mismatch
      await this.createShape(event.payload.shapeDefinition, event.payload.shapeId);
      return;
    }
    
    // Update existing shape by recreating it with new definition
    await this.createShape(event.payload.shapeDefinition, event.payload.shapeId);
  }

  private async handleShapeDestroyed(event: EditorShapeDestroyedEvent): Promise<void> {
    if (!this.isActive) return;
    
    if (this.currentShape && this.currentShape.id === event.payload.shapeId) {
      this.currentShape = null;
      
      if (DEBUG_CONFIG.logShapeDebug) {
        console.log(`ShapeEditorManager: Destroyed shape ${event.payload.shapeId}`);
      }
    }
  }

  private async handleCanvasResized(event: EditorCanvasResizedEvent): Promise<void> {
    if (!this.isActive) return;
    
    this.canvasWidth = event.payload.width;
    this.canvasHeight = event.payload.height;
    
    if (DEBUG_CONFIG.logShapeDebug) {
      console.log(`ShapeEditorManager: Canvas resized to ${this.canvasWidth}x${this.canvasHeight}`);
    }
  }

  private async handlePhysicsDebugToggled(event: EditorPhysicsDebugToggledEvent): Promise<void> {
    if (!this.isActive) return;
    
    this.debugMode = event.payload.enabled;
    
    if (DEBUG_CONFIG.logShapeDebug) {
      console.log(`ShapeEditorManager: Debug mode ${this.debugMode ? 'enabled' : 'disabled'}`);
    }
  }

  private async handleScrewAdded(event: EditorScrewAddedEvent): Promise<void> {
    if (!this.isActive) return;
    if (!this.currentShape) return;
    
    const { position, screwId } = event.payload;
    
    // Create new screw
    const screw = new Screw(screwId, this.currentShape.id, position, 'blue');
    this.currentShape.screws.push(screw);
    
    // Update the shape definition's custom positions if using custom strategy
    if (this.currentShape.definition.screwPlacement.strategy === 'custom') {
      if (!this.currentShape.definition.screwPlacement.customPositions) {
        this.currentShape.definition.screwPlacement.customPositions = [];
      }
      
      // Convert world position to shape-relative position
      const relativePos = {
        x: position.x - this.currentShape.shape.position.x,
        y: position.y - this.currentShape.shape.position.y
      };
      
      this.currentShape.definition.screwPlacement.customPositions.push({
        position: relativePos,
        priority: this.currentShape.definition.screwPlacement.customPositions.length
      });
    }
    
    await this.emit({
      type: 'editor:screw:placement:updated',
      payload: { 
        shapeId: this.currentShape.id,
        screwPositions: this.currentShape.screws.map(screw => ({
          x: screw.position.x,
          y: screw.position.y,
          id: screw.id
        }))
      }
    });
  }

  private async handleScrewRemoved(event: EditorScrewRemovedEvent): Promise<void> {
    if (!this.isActive) return;
    if (!this.currentShape) return;
    
    const { screwId } = event.payload;
    
    // Find and remove the screw by ID
    const screwIndex = this.currentShape.screws.findIndex(screw => screw.id === screwId);
    
    if (screwIndex >= 0) {
      this.currentShape.screws.splice(screwIndex, 1);
      
      // Update custom positions if needed
      if (this.currentShape.definition.screwPlacement.strategy === 'custom') {
        if (this.currentShape.definition.screwPlacement.customPositions) {
          this.currentShape.definition.screwPlacement.customPositions.splice(screwIndex, 1);
          
          // Update priorities
          this.currentShape.definition.screwPlacement.customPositions.forEach((pos, index) => {
            pos.priority = index;
          });
        }
      }
      
      await this.emit({
        type: 'editor:screw:placement:updated',
        payload: { 
          shapeId: this.currentShape.id,
          screwPositions: this.currentShape.screws.map(screw => ({
            x: screw.position.x,
            y: screw.position.y,
            id: screw.id
          }))
        }
      });
    }
  }

  private async handlePhysicsSimulationShapeRequested(event: EditorPhysicsSimulationShapeRequestedEvent): Promise<void> {
    if (!this.isActive) return;
    
    await this.provideShapeForSimulation(event.payload.shapeId);
  }

  private async handlePhysicsStart(): Promise<void> {
    if (!this.isActive) return;
    
    this.isSimulationRunning = true;
  }

  private async handlePhysicsPause(): Promise<void> {
    if (!this.isActive) return;
    
    this.isSimulationRunning = false;
  }

  private async handlePhysicsReset(): Promise<void> {
    if (!this.isActive) return;
    
    this.isSimulationRunning = false;
  }

  // Shape creation methods
  private async createShape(definition: ShapeDefinition, shapeId: string): Promise<void> {
    if (DEBUG_CONFIG.logShapeDebug) {
      console.log('ShapeEditorManager: Creating shape', shapeId);
    }
    
    // Prevent duplicate creation
    if (this.currentShape && this.currentShape.id === shapeId) {
      if (DEBUG_CONFIG.logShapeDebug) {
        console.log('ShapeEditorManager: Shape already exists, skipping creation');
      }
      return;
    }
    
    try {
      // For the editor, create a simplified shape for preview
      const dimensions = this.generateDimensions(definition);
      if (DEBUG_CONFIG.logShapeDebug) {
        console.log('ShapeEditorManager: Generated dimensions:', dimensions);
      }
      
      const centerX = this.canvasWidth / 2;
      const centerY = this.canvasHeight / 2;
      
      // Create appropriate physics body based on shape type
      let body: Body;
      let shapeType: string;
      let shapeDimensions: { width?: number; height?: number; radius?: number; sides?: number; vertices?: Vector2[] } = {};
      
      if (definition.physics.type === 'circle') {
        // Circle shape
        const radius = dimensions.radius || 50;
        body = Bodies.circle(centerX, centerY, radius);
        shapeType = 'circle';
        shapeDimensions = { radius };
      } else if (definition.physics.type === 'polygon' && dimensions.radius && dimensions.sides) {
        // Polygon shape
        const radius = dimensions.radius;
        const sides = dimensions.sides;
        body = Bodies.polygon(centerX, centerY, sides, radius);
        shapeType = 'polygon';
        shapeDimensions = { radius, sides };
      } else if (definition.physics.type === 'fromVertices' && dimensions.path) {
        // Path shape - use fromVertices to create physics body
        // @ts-expect-error the @types lib is not up to date
        const pathVertices = Vertices.fromPath(dimensions.path);
        
        // Scale the vertices if scale is specified
        if (dimensions.scale && dimensions.scale !== 1 && dimensions.scale > 0) {
          const initialBounds = Bounds.create(pathVertices);
          const center = {
            x: (initialBounds.min.x + initialBounds.max.x) / 2,
            y: (initialBounds.min.y + initialBounds.max.y) / 2
          };
          Vertices.scale(pathVertices, dimensions.scale, dimensions.scale, center);
        }
        
        // Center the vertices at origin for relative positioning
        const bounds = Bounds.create(pathVertices);
        const centerVertexX = (bounds.min.x + bounds.max.x) / 2;
        const centerVertexY = (bounds.min.y + bounds.max.y) / 2;
        Vertices.translate(pathVertices, { x: -centerVertexX, y: -centerVertexY }, 1);
        
        // Store original vertices for rendering (in local coordinates)
        const originalVertices: Vector2[] = pathVertices.map(v => ({
          x: v.x,
          y: v.y
        }));
        
        // Ensure poly-decomp is initialized before creating physics body
        if (!isPolyDecompInitialized()) {
          initializePolyDecomp();
        }
        
        // Create physics body
        body = Bodies.fromVertices(centerX, centerY, [pathVertices], {}, true);
        shapeType = 'star'; // Use 'star' as fallback type for path shapes
        shapeDimensions = { vertices: originalVertices };
      } else if (definition.physics.type === 'composite' && definition.id.includes('capsule')) {
        // Capsule shape - create composite body like ShapeFactory
        const finalWidth = dimensions.width || 120;
        const finalHeight = dimensions.height || 40;
        const radius = finalHeight / 2;
        const rectWidth = finalWidth - finalHeight;
        
        // Create the parts
        const rectangle = Bodies.rectangle(centerX, centerY, rectWidth, finalHeight);
        const leftCircle = Bodies.circle(centerX - rectWidth / 2, centerY, radius);
        const rightCircle = Bodies.circle(centerX + rectWidth / 2, centerY, radius);
        
        // Create composite body
        body = Body.create({ parts: [rectangle, leftCircle, rightCircle] });
        Body.setPosition(body, { x: centerX, y: centerY });
        
        shapeType = 'capsule';
        shapeDimensions = { width: finalWidth, height: finalHeight };
      } else {
        // Rectangle/other shapes
        const finalWidth = dimensions.width || 100;
        const finalHeight = dimensions.height || 100;
        body = Bodies.rectangle(centerX, centerY, finalWidth, finalHeight);
        shapeType = 'rectangle';
        shapeDimensions = { width: finalWidth, height: finalHeight };
      }
      
      // Create the shape entity with basic properties
      const shape = new Shape(
        shapeId,
        shapeType as ShapeType,
        { x: centerX, y: centerY },
        body,
        'editor-layer',
        '#007bff', // Blue color
        '#007bff', // Blue tint
        shapeDimensions,
        // Add composite data for capsules
        shapeType === 'capsule' ? { 
          isComposite: true, 
          parts: body.parts ? body.parts : [] 
        } : undefined
      );
      
      if (!shape) {
        throw new Error('Failed to create shape');
      }

      // Create screws using shared strategy system
      const screws = await this.createScrews(shape, definition);

      this.currentShape = {
        shape,
        screws,
        definition,
        id: shapeId,
      };

      await this.emit({
        type: 'editor:shape:preview:updated',
        payload: { shapeId }
      });

      // Emit screw placement update
      await this.emit({
        type: 'editor:screw:placement:updated',
        payload: {
          shapeId,
          screwPositions: screws.map((screw, index) => ({
            x: screw.position.x,
            y: screw.position.y,
            id: screw.id || `screw_${index}`,
          })),
        },
      });

    } catch (error) {
      await this.emit({
        type: 'editor:error:validation',
        payload: {
          errors: [error instanceof Error ? error.message : 'Failed to create shape'],
          context: 'shape creation',
        },
      });
    }
  }

  private generateDimensions(definition: ShapeDefinition): { width?: number; height?: number; radius?: number; sides?: number; path?: string; scale?: number } {
    const dimensions = definition.dimensions;
    
    if (dimensions.type === 'random') {
      // Generate random dimensions within ranges
      const result: Record<string, unknown> = {};
      
      // If shape has radius, set width and height to 0
      if (dimensions.radius) {
        if (typeof dimensions.radius === 'number') {
          result.radius = dimensions.radius;
        } else {
          result.radius = this.randomInRange(dimensions.radius.min, dimensions.radius.max);
        }
        // Include sides for polygons
        if (dimensions.sides) {
          result.sides = dimensions.sides as number;
        }
        result.width = 0;
        result.height = 0;
      } else if (dimensions.path) {
        // Path shape
        result.path = dimensions.path as string;
        if (dimensions.scale) {
          if (typeof dimensions.scale === 'number') {
            result.scale = dimensions.scale;
          } else {
            result.scale = this.randomInRange(dimensions.scale.min, dimensions.scale.max);
          }
        }
      } else {
        // Only set width/height for non-radius shapes
        if (dimensions.width) {
          if (typeof dimensions.width === 'number') {
            result.width = dimensions.width;
          } else {
            result.width = this.randomInRange(dimensions.width.min, dimensions.width.max);
          }
        }
        if (dimensions.height) {
          if (typeof dimensions.height === 'number') {
            result.height = dimensions.height;
          } else {
            result.height = this.randomInRange(dimensions.height.min, dimensions.height.max);
          }
        }
      }
      
      return result;
    } else {
      // Use fixed dimensions
      const result: Record<string, unknown> = {};
      
      if (dimensions.radius) {
        result.radius = dimensions.radius as number;
        // Include sides for polygons
        if (dimensions.sides) {
          result.sides = dimensions.sides as number;
        }
        result.width = 0;
        result.height = 0;
      } else if (dimensions.path) {
        // Path shape
        result.path = dimensions.path as string;
        if (dimensions.scale) {
          if (typeof dimensions.scale === 'number') {
            result.scale = dimensions.scale;
          } else {
            result.scale = (dimensions.scale.min + dimensions.scale.max) / 2; // Use average for fixed type
          }
        }
      } else {
        result.width = dimensions.width as number;
        result.height = dimensions.height as number;
      }
      
      return result;
    }
  }

  private randomInRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  private async createScrews(shape: Shape, definition: ShapeDefinition): Promise<Screw[]> {
    const screws: Screw[] = [];
    const screwColor = 'red'; // Always use red for screws
    
    // Use the shared strategy system to calculate positions
    const positions = this.calculatePotentialScrewPositions(shape, definition);
    
    for (let i = 0; i < positions.length; i++) {
      const screw = new Screw(
        `${shape.id}-screw-${i}`,
        shape.id,
        positions[i],
        screwColor
      );
      screws.push(screw);
    }
    
    return screws;
  }

  // Public methods
  public render(context: CanvasRenderingContext2D): void {
    if (!this.currentShape) return;
    
    const { shape, screws } = this.currentShape;
    
    // Clear the canvas
    context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    // Render the shape
    const renderContext = {
      ctx: context,
      canvas: context.canvas,
      debugMode: this.debugMode
    };
    ShapeRenderer.renderShape(shape, renderContext);
    
    // Render screws
    screws.forEach(screw => {
      ScrewRenderer.renderScrew(screw, renderContext);
    });
    
    // Render screw placement indicators
    this.renderScrewPlacementIndicators(context, this.currentShape);
    
    // Render debug info if enabled
    if (this.debugMode) {
      this.renderDebugInfo(context, shape);
    }
  }

  public handleCanvasClick(position: Vector2): void {
    if (!this.currentShape) return;
    
    const simulationRunning = this.checkSimulationStatus();
    if (simulationRunning) {
      return; // Don't allow screw manipulation during simulation
    }
    
    // Check if clicking on an existing screw
    const existingScrew = this.currentShape.screws.find(screw => {
      const distance = Math.sqrt(
        Math.pow(screw.position.x - position.x, 2) + 
        Math.pow(screw.position.y - position.y, 2)
      );
      return distance < 15; // 15px click tolerance
    });
    
    if (existingScrew) {
      // Remove existing screw
      this.emit({
        type: 'editor:screw:removed',
        payload: { 
          shapeId: this.currentShape.id,
          screwId: existingScrew.id
        }
      });
    } else {
      // Check if clicking on a placement indicator
      const indicators = this.calculatePotentialScrewPositions(this.currentShape.shape, this.currentShape.definition);
      const clickedIndicator = indicators.find(indicator => {
        const distance = Math.sqrt(
          Math.pow(indicator.x - position.x, 2) + 
          Math.pow(indicator.y - position.y, 2)
        );
        return distance < 15; // 15px click tolerance
      });
      
      if (clickedIndicator) {
        // Add new screw at indicator position
        this.emit({
          type: 'editor:screw:added',
          payload: { 
            shapeId: this.currentShape.id,
            position: clickedIndicator,
            screwId: `screw_${Date.now()}`
          }
        });
      }
    }
  }

  getCurrentShape(): EditorShape | null {
    return this.currentShape;
  }

  private async provideShapeForSimulation(shapeId: string): Promise<void> {
    if (!this.currentShape || this.currentShape.id !== shapeId) {
      console.log('ShapeEditorManager: Cannot provide shape for simulation - shape not found');
      return;
    }

    console.log('ShapeEditorManager: Providing shape for simulation', shapeId);

    await this.emit({
      type: 'editor:physics:simulation:shape:provided',
      payload: {
        shapeId,
        shape: {
          id: this.currentShape.shape.id,
          type: this.currentShape.shape.type,
          position: this.currentShape.shape.position,
          body: this.currentShape.shape.body,
          radius: this.currentShape.shape.radius,
          width: this.currentShape.shape.width,
          height: this.currentShape.shape.height,
        },
        screws: this.currentShape.screws.map(screw => ({
          id: screw.id,
          position: screw.position,
        })),
      },
    });
  }

  private renderScrewPlacementIndicators(context: CanvasRenderingContext2D, editorShape: EditorShape): void {
    const { shape, definition } = editorShape;
    
    // Calculate potential screw positions based on strategy
    const potentialPositions = this.calculatePotentialScrewPositions(shape, definition);
    
    // Render indicators for potential positions
    context.save();
    context.strokeStyle = '#888888';
    context.fillStyle = 'rgba(136, 136, 136, 0.3)';
    context.lineWidth = 1;
    context.setLineDash([3, 3]);
    
    for (const position of potentialPositions) {
      // Check if this position already has a screw
      const hasScrew = editorShape.screws.some(screw => {
        const dx = screw.position.x - position.x;
        const dy = screw.position.y - position.y;
        return Math.sqrt(dx * dx + dy * dy) < 10;
      });
      
      if (!hasScrew) {
        // Draw indicator circle
        context.beginPath();
        context.arc(position.x, position.y, 6, 0, Math.PI * 2);
        context.fill();
        context.stroke();
      }
    }
    
    context.restore();
  }

  private calculatePotentialScrewPositions(shape: Shape, definition: ShapeDefinition): Vector2[] {
    // Use shared strategy system
    const strategy = ScrewPlacementStrategyFactory.create(definition.screwPlacement.strategy);
    const context = {
      shape,
      config: definition.screwPlacement
    };
    
    return strategy.calculatePositions(context);
  }

  private renderDebugInfo(context: CanvasRenderingContext2D, shape: Shape): void {
    // Render physics body outline for debugging
    if (shape.body && shape.body.vertices) {
      context.save();
      context.strokeStyle = '#ff0000';
      context.lineWidth = 1;
      context.setLineDash([5, 5]);
      
      context.beginPath();
      const vertices = shape.body.vertices;
      context.moveTo(vertices[0].x, vertices[0].y);
      
      for (let i = 1; i < vertices.length; i++) {
        context.lineTo(vertices[i].x, vertices[i].y);
      }
      
      context.closePath();
      context.stroke();
      context.restore();
    }
  }

  private checkSimulationStatus(): boolean {
    return this.isSimulationRunning;
  }
}