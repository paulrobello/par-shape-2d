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
import { DEBUG_CONFIG } from '@/game/utils/Constants';
import { initializePolyDecomp, isPolyDecompInitialized } from '@/game/utils/PhysicsInit';

interface EditorShape {
  shape: Shape;
  screws: Screw[];
  definition: ShapeDefinition;
  id: string;
}

/**
 * Manages shape creation, rendering, and screw placement in the editor
 */
export class ShapeEditorManager extends BaseEditorSystem {
  private currentShape: EditorShape | null = null;
  private canvasWidth = 800;
  private canvasHeight = 600;
  private debugMode = false;
  private isSimulationRunning = false;

  constructor() {
    super('ShapeEditorManager');
  }

  protected async onInitialize(): Promise<void> {
    this.setupEventSubscriptions();
  }

  protected onUpdate(_deltaTime: number): void {
    // Shape editor doesn't need frame updates for shapes/screws
    // Animation updates would be handled by physics simulator if needed
    void _deltaTime;
  }

  protected onRender(context: CanvasRenderingContext2D): void {
    if (!this.currentShape) {
      this.renderEmptyState(context);
      return;
    }

    // Render shape (shape is already positioned at center)
    this.renderShape(context, this.currentShape.shape);

    // Render screws
    this.renderScrews(context, this.currentShape.screws);

    // Render screw placement indicators
    this.renderScrewPlacementIndicators(context, this.currentShape);

    // Render debug info if enabled
    if (this.debugMode) {
      this.renderDebugInfo(context, this.currentShape.shape);
    }
  }

  protected onDestroy(): void {
    this.currentShape = null;
  }

  private setupEventSubscriptions(): void {
    // Handle shape creation
    this.subscribe('editor:shape:created', async (event: EditorShapeCreatedEvent) => {
      await this.createShape(event.payload.shapeDefinition, event.payload.shapeId);
    }, EditorEventPriority.HIGH);

    // Handle shape updates
    this.subscribe('editor:shape:updated', async (event: EditorShapeUpdatedEvent) => {
      await this.updateShape(event.payload.shapeDefinition, event.payload.shapeId);
    }, EditorEventPriority.HIGH);

    // Handle shape destruction
    this.subscribe('editor:shape:destroyed', async (event: EditorShapeDestroyedEvent) => {
      this.destroyShape(event.payload.shapeId);
    });

    // Handle canvas resize
    this.subscribe('editor:canvas:resized', async (event: EditorCanvasResizedEvent) => {
      this.canvasWidth = event.payload.width;
      this.canvasHeight = event.payload.height;
    });

    // Handle debug toggle
    this.subscribe('editor:physics:debug:toggled', async (event: EditorPhysicsDebugToggledEvent) => {
      this.debugMode = event.payload.enabled;
    });

    // Handle screw interactions
    this.subscribe('editor:screw:added', async (event: EditorScrewAddedEvent) => {
      await this.addCustomScrew(event.payload.shapeId, event.payload.position, event.payload.screwId);
    });

    this.subscribe('editor:screw:removed', async (event: EditorScrewRemovedEvent) => {
      await this.removeCustomScrew(event.payload.shapeId, event.payload.screwId);
    });

    // Handle physics simulation shape requests
    this.subscribe('editor:physics:simulation:shape:requested', async (event: EditorPhysicsSimulationShapeRequestedEvent) => {
      await this.provideShapeForSimulation(event.payload.shapeId);
    });

    // Track simulation state to disable screw manipulation during physics
    this.subscribe('editor:physics:start:requested', async () => {
      this.isSimulationRunning = true;
    });

    this.subscribe('editor:physics:reset:requested', async () => {
      this.isSimulationRunning = false;
    });
  }

  private async createShape(definition: ShapeDefinition, shapeId: string): Promise<void> {
    console.log('ShapeEditorManager: Creating shape', shapeId);
    
    // Prevent duplicate creation
    if (this.currentShape && this.currentShape.id === shapeId) {
      console.log('ShapeEditorManager: Shape already exists, skipping creation');
      return;
    }
    
    try {
      // For the editor, create a simplified shape for preview
      const dimensions = this.generateDimensions(definition);
      console.log('ShapeEditorManager: Generated dimensions:', dimensions);
      
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

      // Create screws using ScrewManager logic
      const screws = await this.createScrews(shape, definition);

      this.currentShape = {
        shape,
        screws,
        definition,
        id: shapeId,
      };

      // Emit screw placement update
      await this.emit({
        type: 'editor:screw:placement:updated',
        payload: {
          shapeId,
          screwPositions: screws.map((screw, index) => ({
            x: screw.position.x,
            y: screw.position.y,
            id: `screw_${index}`,
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

  private async updateShape(definition: ShapeDefinition, shapeId: string): Promise<void> {
    if (!this.currentShape || this.currentShape.id !== shapeId) {
      // Create new shape if none exists or ID mismatch
      await this.createShape(definition, shapeId);
      return;
    }

    try {
      // Recreate shape with new definition  
      const dimensions = this.generateDimensions(definition);
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
      
      const newShape = new Shape(
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
      
      if (!newShape) {
        throw new Error('Failed to update shape');
      }

      // Recreate screws
      const newScrews = await this.createScrews(newShape, definition);

      this.currentShape = {
        shape: newShape,
        screws: newScrews,
        definition,
        id: shapeId,
      };

      // Emit preview update
      await this.emit({
        type: 'editor:shape:preview:updated',
        payload: { shapeId },
      });

      // Emit screw placement update
      await this.emit({
        type: 'editor:screw:placement:updated',
        payload: {
          shapeId,
          screwPositions: newScrews.map((screw, index) => ({
            x: screw.position.x,
            y: screw.position.y,
            id: `screw_${index}`,
          })),
        },
      });

    } catch (error) {
      await this.emit({
        type: 'editor:error:validation',
        payload: {
          errors: [error instanceof Error ? error.message : 'Failed to update shape'],
          context: 'shape update',
        },
      });
    }
  }

  private destroyShape(shapeId: string): void {
    if (this.currentShape && this.currentShape.id === shapeId) {
      this.currentShape = null;
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
    
    // Use the same positioning logic as the indicators
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

  private renderEmptyState(context: CanvasRenderingContext2D): void {
    const centerX = this.canvasWidth / 2;
    const centerY = this.canvasHeight / 2;
    
    context.fillStyle = '#999';
    context.font = '16px sans-serif';
    context.textAlign = 'center';
    context.fillText('Load a shape to begin editing', centerX, centerY);
  }

  private renderShape(context: CanvasRenderingContext2D, shape: Shape): void {
    console.log('ShapeEditorManager: Rendering shape at', shape.position, 'type:', shape.type, 'radius:', shape.radius, 'width:', shape.width, 'height:', shape.height);
    
    const renderContext = {
      ctx: context,
      canvas: context.canvas,
      debugMode: this.debugMode,
    };

    // Set a nice tint color for the editor
    shape.tint = '#007bff';
    
    ShapeRenderer.renderShape(shape, renderContext);
  }

  private renderScrews(context: CanvasRenderingContext2D, screws: Screw[]): void {
    const renderContext = {
      ctx: context,
      canvas: context.canvas,
      debugMode: this.debugMode,
    };

    screws.forEach(screw => {
      ScrewRenderer.renderScrew(screw, renderContext);
    });
  }

  private renderDebugInfo(context: CanvasRenderingContext2D, shape: Shape): void {
    // Render physics body outline
    if (shape.body) {
      context.strokeStyle = '#ff0000';
      context.lineWidth = 2;
      context.setLineDash([5, 5]);
      
      const vertices = shape.body.vertices;
      if (vertices && vertices.length > 0) {
        context.beginPath();
        context.moveTo(vertices[0].x - shape.position.x, vertices[0].y - shape.position.y);
        for (let i = 1; i < vertices.length; i++) {
          context.lineTo(vertices[i].x - shape.position.x, vertices[i].y - shape.position.y);
        }
        context.closePath();
        context.stroke();
      }
      
      context.setLineDash([]);
    }

    // Render center point
    context.fillStyle = '#ff0000';
    context.beginPath();
    context.arc(0, 0, 3, 0, Math.PI * 2);
    context.fill();
  }

  private async addCustomScrew(shapeId: string, position: { x: number; y: number }, screwId: string): Promise<void> {
    if (!this.currentShape || this.currentShape.id !== shapeId) return;
    
    // In editor, allow adding screws to any shape for testing

    const screwColor = 'red'; // Always use red for screws
    const screw = new Screw(
      screwId,
      this.currentShape.shape.id,
      position,
      screwColor
    );

    this.currentShape.screws.push(screw);

    // Update custom positions in definition if it's a custom strategy
    if (this.currentShape.definition.screwPlacement.strategy === 'custom') {
      if (!this.currentShape.definition.screwPlacement.customPositions) {
        this.currentShape.definition.screwPlacement.customPositions = [];
      }
      
      // Convert absolute canvas coordinates to relative coordinates (offset from shape center)
      const relativePosition = {
        x: position.x - this.currentShape.shape.position.x,
        y: position.y - this.currentShape.shape.position.y
      };
      
      this.currentShape.definition.screwPlacement.customPositions.push({
        position: relativePosition,
        priority: 1,
      });

      // Note: We don't emit 'editor:property:changed' for screw placement updates
      // to avoid triggering shape regeneration which would change dimensions.
      // The shape definition is updated in-place for screw positions only.
    }
    
    // Emit screw placement update for UI
    await this.emit({
      type: 'editor:screw:placement:updated',
      payload: {
        shapeId: this.currentShape.id,
        screwPositions: this.currentShape.screws.map((s, index) => ({
          x: s.position.x,
          y: s.position.y,
          id: s.id || `screw_${index}`,
        })),
      },
    });
  }

  private async removeCustomScrew(shapeId: string, screwId: string): Promise<void> {
    console.log('ShapeEditorManager: removeCustomScrew called with', { shapeId, screwId });
    if (!this.currentShape || this.currentShape.id !== shapeId) {
      console.log('ShapeEditorManager: No current shape or ID mismatch');
      return;
    }
    
    // In editor, allow removing screws from any shape for testing

    const screwIndex = this.currentShape.screws.findIndex(s => s.id === screwId);
    console.log('ShapeEditorManager: Found screw at index', screwIndex);
    if (screwIndex === -1) {
      console.log('ShapeEditorManager: Screw not found');
      return;
    }

    console.log('ShapeEditorManager: Removing screw from array');
    this.currentShape.screws.splice(screwIndex, 1);

    // Update custom positions in definition if it's a custom strategy
    if (this.currentShape.definition.screwPlacement.strategy === 'custom' && 
        this.currentShape.definition.screwPlacement.customPositions) {
      this.currentShape.definition.screwPlacement.customPositions.splice(screwIndex, 1);
      
      // Note: We don't emit 'editor:property:changed' for screw placement updates
      // to avoid triggering shape regeneration which would change dimensions.
      // The shape definition is updated in-place for screw positions only.
    }
    
    // Emit screw placement update for UI
    await this.emit({
      type: 'editor:screw:placement:updated',
      payload: {
        shapeId: this.currentShape.id,
        screwPositions: this.currentShape.screws.map((s, index) => ({
          x: s.position.x,
          y: s.position.y,
          id: s.id || `screw_${index}`,
        })),
      },
    });

    console.log('ShapeEditorManager: Screw removed, remaining screws:', this.currentShape.screws.length);
  }

  // Public API for canvas interactions
  async handleCanvasClick(x: number, y: number): Promise<void> {
    if (!this.currentShape) return;
    
    // Check if physics simulation is running - if so, disable screw manipulation
    // We need to access the editor state to check simulation status
    const simulationRunning = await this.checkSimulationStatus();
    if (simulationRunning) {
      if (DEBUG_CONFIG.logPhysicsDebug) {
        console.log('ShapeEditorManager: Screw manipulation disabled during physics simulation');
      }
      return;
    }
    
    const clickX = x;
    const clickY = y;
    const strategy = this.currentShape.definition.screwPlacement.strategy;

    // Check if clicking on existing screw to remove it
    const clickedScrewIndex = this.currentShape.screws.findIndex(screw => {
      const dx = screw.position.x - clickX;
      const dy = screw.position.y - clickY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < 15; // 15px click radius
    });

    if (clickedScrewIndex !== -1) {
      // Remove screw
      const screwId = this.currentShape.screws[clickedScrewIndex].id;
      await this.emit({
        type: 'editor:screw:removed',
        payload: {
          shapeId: this.currentShape.id,
          screwId,
        },
      });
    } else {
      // Add new screw
      let targetPosition = { x: clickX, y: clickY };
      
      // For non-custom strategies, snap to nearest indicator position
      if (strategy !== 'custom') {
        const potentialPositions = this.calculatePotentialScrewPositions(
          this.currentShape.shape,
          this.currentShape.definition
        );
        
        // Find nearest indicator position within threshold
        let nearestPosition: Vector2 | null = null;
        let nearestDistance = Infinity;
        const threshold = 15; // pixels
        
        for (const position of potentialPositions) {
          const dx = position.x - clickX;
          const dy = position.y - clickY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < nearestDistance && distance <= threshold) {
            nearestDistance = distance;
            nearestPosition = position;
          }
        }
        
        // Only proceed if we found a valid position within threshold
        if (!nearestPosition) {
          console.log('ShapeEditorManager: Click not near any valid screw position for', strategy, 'strategy');
          return;
        }
        
        // Check if there's already a screw at this position
        const hasScrew = this.currentShape.screws.some(screw => {
          const dx = screw.position.x - nearestPosition.x;
          const dy = screw.position.y - nearestPosition.y;
          return Math.sqrt(dx * dx + dy * dy) < 10;
        });
        
        if (hasScrew) {
          console.log('ShapeEditorManager: Screw already exists at this position');
          return;
        }
        
        targetPosition = nearestPosition;
      }
      
      const newScrewId = `custom_screw_${Date.now()}`;
      await this.emit({
        type: 'editor:screw:added',
        payload: {
          shapeId: this.currentShape.id,
          position: targetPosition,
          screwId: newScrewId,
        },
      });
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
    const positions: Vector2[] = [];
    const strategy = definition.screwPlacement.strategy;
    const minSeparation = definition.screwPlacement.minSeparation || 48;
    
    switch (strategy) {
      case 'corners':
        positions.push(...this.calculateCornerPositions(shape, definition));
        break;
      case 'perimeter':
        positions.push(...this.calculatePerimeterPositions(shape, definition));
        break;
      case 'grid':
        positions.push(...this.calculateGridPositions(shape, definition));
        break;
      case 'custom':
        positions.push(...this.calculateCustomPositions(shape, definition));
        break;
      case 'capsule':
        positions.push(...this.calculateCapsulePositions(shape, definition));
        break;
    }
    
    // Apply min separation filtering to all strategies
    return this.filterPositionsByMinSeparation(positions, minSeparation);
  }

  private calculateCornerPositions(shape: Shape, definition: ShapeDefinition): Vector2[] {
    const positions: Vector2[] = [];
    const margin = definition.screwPlacement.cornerMargin || 20;
    
    if (shape.radius && shape.sides) {
      // Polygon - calculate actual corner positions using the SAME formula as Shape.createPolygonPath()
      const radius = shape.radius;
      const sides = shape.sides;
      
      for (let i = 0; i < sides; i++) {
        // Use the exact same angle calculation as in Shape.createPolygonPath()
        // This ensures screws are positioned at the actual polygon vertices
        const angle = (i * Math.PI * 2) / sides + (Math.PI / sides);
        // Position screws slightly inward from the actual vertices
        const screwRadius = radius - margin;
        positions.push({
          x: shape.position.x + Math.cos(angle) * screwRadius,
          y: shape.position.y + Math.sin(angle) * screwRadius
        });
      }
    } else if (shape.radius && !shape.sides) {
      // Circle - use cross pattern
      const offset = shape.radius - margin;
      positions.push(
        { x: shape.position.x + offset, y: shape.position.y },
        { x: shape.position.x - offset, y: shape.position.y },
        { x: shape.position.x, y: shape.position.y + offset },
        { x: shape.position.x, y: shape.position.y - offset }
      );
    } else if (shape.width && shape.height) {
      // Rectangle - use corners
      const marginX = Math.min(margin, shape.width * 0.2);
      const marginY = Math.min(margin, shape.height * 0.2);
      positions.push(
        { x: shape.position.x - shape.width/2 + marginX, y: shape.position.y - shape.height/2 + marginY },
        { x: shape.position.x + shape.width/2 - marginX, y: shape.position.y - shape.height/2 + marginY },
        { x: shape.position.x - shape.width/2 + marginX, y: shape.position.y + shape.height/2 - marginY },
        { x: shape.position.x + shape.width/2 - marginX, y: shape.position.y + shape.height/2 - marginY }
      );
    }
    
    return positions;
  }

  private calculatePerimeterPositions(shape: Shape, definition: ShapeDefinition): Vector2[] {
    let positions: Vector2[] = [];
    const points = definition.screwPlacement.perimeterPoints || 8;
    const margin = definition.screwPlacement.perimeterMargin || 20;
    
    if (shape.radius && shape.sides) {
      // Polygon perimeter - distribute along actual polygon edges
      positions = this.calculatePolygonPerimeterPositions(shape, points, margin);
    } else if (shape.radius) {
      // Circle perimeter - circular distribution
      const radius = shape.radius - margin;
      
      for (let i = 0; i < points; i++) {
        const angle = (i * Math.PI * 2) / points;
        
        positions.push({
          x: shape.position.x + Math.cos(angle) * radius,
          y: shape.position.y + Math.sin(angle) * radius
        });
      }
    } else if (shape.width && shape.height) {
      // Rectangle perimeter
      const w = shape.width - margin * 2;
      const h = shape.height - margin * 2;
      const perimeter = 2 * (w + h);
      const spacing = perimeter / points;
      
      for (let i = 0; i < points; i++) {
        const distance = i * spacing;
        let x, y;
        
        if (distance < w) {
          // Top edge
          x = shape.position.x - w/2 + distance;
          y = shape.position.y - h/2;
        } else if (distance < w + h) {
          // Right edge
          x = shape.position.x + w/2;
          y = shape.position.y - h/2 + (distance - w);
        } else if (distance < 2*w + h) {
          // Bottom edge
          x = shape.position.x + w/2 - (distance - w - h);
          y = shape.position.y + h/2;
        } else {
          // Left edge
          x = shape.position.x - w/2;
          y = shape.position.y + h/2 - (distance - 2*w - h);
        }
        
        positions.push({ x, y });
      }
    } else if (shape.vertices && shape.vertices.length > 0) {
      // Path shapes with stored vertices
      positions = this.calculatePathPerimeterPositions(shape, points, margin);
    }
    
    return positions;
  }

  private calculatePolygonPerimeterPositions(shape: Shape, points: number, margin: number): Vector2[] {
    const positions: Vector2[] = [];
    const radius = shape.radius!;
    const sides = shape.sides!;
    
    // Calculate the vertices of the polygon (same as Shape.createPolygonPath())
    const vertices: Vector2[] = [];
    for (let i = 0; i < sides; i++) {
      const angle = (i * Math.PI * 2) / sides + (Math.PI / sides);
      vertices.push({
        x: shape.position.x + Math.cos(angle) * radius,
        y: shape.position.y + Math.sin(angle) * radius
      });
    }
    
    // Calculate the perimeter length of the polygon
    let totalPerimeter = 0;
    const edgeLengths: number[] = [];
    for (let i = 0; i < sides; i++) {
      const current = vertices[i];
      const next = vertices[(i + 1) % sides];
      const length = Math.sqrt(
        Math.pow(next.x - current.x, 2) + Math.pow(next.y - current.y, 2)
      );
      edgeLengths.push(length);
      totalPerimeter += length;
    }
    
    // Distribute points along the perimeter proportionally
    const targetSpacing = totalPerimeter / points;
    let currentDistance = 0;
    let edgeIndex = 0;
    let distanceOnCurrentEdge = 0;
    
    for (let i = 0; i < points; i++) {
      const targetDistance = i * targetSpacing;
      
      // Find which edge this point should be on
      while (currentDistance + edgeLengths[edgeIndex] - distanceOnCurrentEdge < targetDistance && edgeIndex < sides) {
        currentDistance += edgeLengths[edgeIndex] - distanceOnCurrentEdge;
        edgeIndex = (edgeIndex + 1) % sides;
        distanceOnCurrentEdge = 0;
      }
      
      // Calculate position along the current edge
      const remainingDistance = targetDistance - currentDistance;
      distanceOnCurrentEdge = remainingDistance;
      
      const current = vertices[edgeIndex];
      const next = vertices[(edgeIndex + 1) % sides];
      const edgeProgress = remainingDistance / edgeLengths[edgeIndex];
      
      // Apply margin by moving the point inward from the edge
      const edgeX = current.x + (next.x - current.x) * edgeProgress;
      const edgeY = current.y + (next.y - current.y) * edgeProgress;
      
      // Calculate inward direction (toward center)
      const centerX = shape.position.x;
      const centerY = shape.position.y;
      const toCenter = {
        x: centerX - edgeX,
        y: centerY - edgeY
      };
      const toCenterLength = Math.sqrt(toCenter.x * toCenter.x + toCenter.y * toCenter.y);
      
      if (toCenterLength > 0) {
        const normalizedToCenter = {
          x: toCenter.x / toCenterLength,
          y: toCenter.y / toCenterLength
        };
        
        positions.push({
          x: edgeX + normalizedToCenter.x * margin,
          y: edgeY + normalizedToCenter.y * margin
        });
      } else {
        // Fallback if point is exactly at center
        positions.push({ x: edgeX, y: edgeY });
      }
    }
    
    return positions;
  }

  private calculatePathPerimeterPositions(shape: Shape, points: number, margin: number): Vector2[] {
    const positions: Vector2[] = [];
    const vertices = shape.vertices!;
    
    // Calculate the perimeter length of the path
    let totalPerimeter = 0;
    const edgeLengths: number[] = [];
    for (let i = 0; i < vertices.length; i++) {
      const current = vertices[i];
      const next = vertices[(i + 1) % vertices.length];
      const length = Math.sqrt(
        Math.pow(next.x - current.x, 2) + Math.pow(next.y - current.y, 2)
      );
      edgeLengths.push(length);
      totalPerimeter += length;
    }
    
    // Distribute points along the perimeter proportionally
    const targetSpacing = totalPerimeter / points;
    let currentDistance = 0;
    let edgeIndex = 0;
    let distanceOnCurrentEdge = 0;
    
    for (let i = 0; i < points; i++) {
      const targetDistance = i * targetSpacing;
      
      // Find which edge this point should be on
      while (currentDistance + edgeLengths[edgeIndex] - distanceOnCurrentEdge < targetDistance && edgeIndex < vertices.length) {
        currentDistance += edgeLengths[edgeIndex] - distanceOnCurrentEdge;
        edgeIndex = (edgeIndex + 1) % vertices.length;
        distanceOnCurrentEdge = 0;
      }
      
      // Calculate position along the current edge
      const remainingDistance = targetDistance - currentDistance;
      distanceOnCurrentEdge = remainingDistance;
      
      const current = vertices[edgeIndex];
      const next = vertices[(edgeIndex + 1) % vertices.length];
      const edgeProgress = remainingDistance / edgeLengths[edgeIndex];
      
      // Apply margin by moving the point inward from the edge
      const edgeX = shape.position.x + current.x + (next.x - current.x) * edgeProgress;
      const edgeY = shape.position.y + current.y + (next.y - current.y) * edgeProgress;
      
      // Calculate inward direction (toward center)
      const centerX = shape.position.x;
      const centerY = shape.position.y;
      const toCenter = {
        x: centerX - edgeX,
        y: centerY - edgeY
      };
      const toCenterLength = Math.sqrt(toCenter.x * toCenter.x + toCenter.y * toCenter.y);
      
      if (toCenterLength > 0) {
        const normalizedToCenter = {
          x: toCenter.x / toCenterLength,
          y: toCenter.y / toCenterLength
        };
        
        positions.push({
          x: edgeX + normalizedToCenter.x * margin,
          y: edgeY + normalizedToCenter.y * margin
        });
      } else {
        // Fallback if point is exactly at center
        positions.push({ x: edgeX, y: edgeY });
      }
    }
    
    return positions;
  }

  private filterPositionsByMinSeparation(positions: Vector2[], minSeparation: number): Vector2[] {
    if (positions.length === 0 || minSeparation <= 0) {
      return positions;
    }

    const filteredPositions: Vector2[] = [];
    
    // Always include the first position
    if (positions.length > 0) {
      filteredPositions.push(positions[0]);
    }
    
    // Filter subsequent positions based on min separation
    for (let i = 1; i < positions.length; i++) {
      const currentPos = positions[i];
      let tooClose = false;
      
      // Check distance to all already accepted positions
      for (const acceptedPos of filteredPositions) {
        const distance = Math.sqrt(
          Math.pow(currentPos.x - acceptedPos.x, 2) + 
          Math.pow(currentPos.y - acceptedPos.y, 2)
        );
        
        if (distance < minSeparation) {
          tooClose = true;
          break;
        }
      }
      
      // Only add if it's far enough from all existing positions
      if (!tooClose) {
        filteredPositions.push(currentPos);
      }
    }
    
    return filteredPositions;
  }

  private calculateGridPositions(shape: Shape, definition: ShapeDefinition): Vector2[] {
    const positions: Vector2[] = [];
    const spacing = definition.screwPlacement.gridSpacing || 40;
    
    if (shape.width && shape.height) {
      const margin = 20;
      const startX = shape.position.x - shape.width/2 + margin;
      const endX = shape.position.x + shape.width/2 - margin;
      const startY = shape.position.y - shape.height/2 + margin;
      const endY = shape.position.y + shape.height/2 - margin;
      
      for (let x = startX; x <= endX; x += spacing) {
        for (let y = startY; y <= endY; y += spacing) {
          positions.push({ x, y });
        }
      }
    } else if (shape.radius) {
      // Grid inside circle
      const margin = 20;
      const radius = shape.radius - margin;
      const size = radius * 2;
      const startX = shape.position.x - radius;
      const startY = shape.position.y - radius;
      
      for (let x = startX; x <= startX + size; x += spacing) {
        for (let y = startY; y <= startY + size; y += spacing) {
          // Check if point is inside circle
          const dx = x - shape.position.x;
          const dy = y - shape.position.y;
          if (Math.sqrt(dx * dx + dy * dy) <= radius) {
            positions.push({ x, y });
          }
        }
      }
    }
    
    return positions;
  }

  private calculateCustomPositions(shape: Shape, definition: ShapeDefinition): Vector2[] {
    const positions: Vector2[] = [];
    
    if (definition.screwPlacement.customPositions) {
      for (const customPos of definition.screwPlacement.customPositions) {
        positions.push({
          x: shape.position.x + customPos.position.x,
          y: shape.position.y + customPos.position.y
        });
      }
    }
    
    return positions;
  }

  private calculateCapsulePositions(shape: Shape, definition: ShapeDefinition): Vector2[] {
    const positions: Vector2[] = [];
    const margin = definition.screwPlacement.capsuleEndMargin || 20;
    
    if (shape.width && shape.height) {
      // Capsule is typically a rectangle with rounded ends
      // Place screws at strategic positions
      const endRadius = Math.min(shape.width, shape.height) / 2;
      
      // End positions
      positions.push(
        { x: shape.position.x - shape.width/2 + endRadius, y: shape.position.y },
        { x: shape.position.x + shape.width/2 - endRadius, y: shape.position.y }
      );
      
      // Side positions if large enough
      if (shape.height > endRadius * 2 + margin * 2) {
        positions.push(
          { x: shape.position.x, y: shape.position.y - shape.height/2 + margin },
          { x: shape.position.x, y: shape.position.y + shape.height/2 - margin }
        );
      }
    }
    
    return positions;
  }

  private async checkSimulationStatus(): Promise<boolean> {
    return this.isSimulationRunning;
  }
}