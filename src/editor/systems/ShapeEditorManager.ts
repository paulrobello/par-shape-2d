import { BaseEditorSystem } from '../core/BaseEditorSystem';
import { ShapeDefinition } from '@/types/shapes';
import { Bodies } from 'matter-js';
import { Shape } from '@/game/entities/Shape';
import { Screw } from '@/game/entities/Screw';
import { ShapeRenderer } from '@/game/rendering/ShapeRenderer';
import { ScrewRenderer } from '@/game/rendering/ScrewRenderer';
import { getRandomScrewColor } from '@/game/utils/Colors';
import { EditorEventPriority } from '../core/EditorEventBus';
import { 
  EditorShapeCreatedEvent, 
  EditorShapeUpdatedEvent, 
  EditorShapeDestroyedEvent, 
  EditorCanvasResizedEvent, 
  EditorPhysicsDebugToggledEvent,
  EditorScrewAddedEvent,
  EditorScrewRemovedEvent
} from '../events/EditorEventTypes';

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

    // Center the shape on canvas
    const centerX = this.canvasWidth / 2;
    const centerY = this.canvasHeight / 2;

    context.save();
    context.translate(centerX, centerY);

    // Render shape
    this.renderShape(context, this.currentShape.shape);

    // Render screws
    this.renderScrews(context, this.currentShape.screws);

    // Render debug info if enabled
    if (this.debugMode) {
      this.renderDebugInfo(context, this.currentShape.shape);
    }

    context.restore();
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
      const { width, height } = this.generateDimensions(definition);
      console.log('ShapeEditorManager: Generated dimensions:', { width, height });
      const finalWidth = width || 100;
      const finalHeight = height || 100;
      const centerX = this.canvasWidth / 2;
      const centerY = this.canvasHeight / 2;
      
      // Create a basic physics body for the shape (simplified for editor)
      const body = Bodies.rectangle(centerX, centerY, finalWidth, finalHeight);
      
      // Create the shape entity with basic properties
      const shape = new Shape(
        shapeId,
        'rectangle', // Simplified for editor preview
        { x: centerX, y: centerY },
        body,
        'editor-layer',
        '#4a90e2', // Default blue color
        '#4a90e2', // Default tint
        { width: finalWidth, height: finalHeight, radius: Math.min(finalWidth, finalHeight) / 2 }
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
      const { width, height } = this.generateDimensions(definition);
      const finalWidth = width || 100;
      const finalHeight = height || 100;
      const centerX = this.canvasWidth / 2;
      const centerY = this.canvasHeight / 2;
      
      // Create a basic physics body for the updated shape
      const body = Bodies.rectangle(centerX, centerY, finalWidth, finalHeight);
      
      const newShape = new Shape(
        shapeId,
        'rectangle', // Simplified for editor preview
        { x: centerX, y: centerY },
        body,
        'editor-layer',
        '#4a90e2', // Default blue color
        '#4a90e2', // Default tint
        { width: finalWidth, height: finalHeight, radius: Math.min(finalWidth, finalHeight) / 2 }
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

  private generateDimensions(definition: ShapeDefinition): { width?: number; height?: number; radius?: number } {
    const dimensions = definition.dimensions;
    
    if (dimensions.type === 'random') {
      // Generate random dimensions within ranges
      const result: Record<string, unknown> = {};
      
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
      if (dimensions.radius) {
        if (typeof dimensions.radius === 'number') {
          result.radius = dimensions.radius;
        } else {
          result.radius = this.randomInRange(dimensions.radius.min, dimensions.radius.max);
        }
      }
      
      return result;
    } else {
      // Use fixed dimensions
      return {
        width: dimensions.width as number,
        height: dimensions.height as number,
        radius: dimensions.radius as number,
      };
    }
  }

  private randomInRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  private async createScrews(shape: Shape, _definition: ShapeDefinition): Promise<Screw[]> {
    // For the editor, create basic screw positions (simplified)
    void _definition;
    const screws: Screw[] = [];
    const screwColor = getRandomScrewColor();
    
    // Simple screw placement - just corners for now
    if (shape.width && shape.height) {
      const positions = [
        { x: shape.position.x - shape.width/2 + 20, y: shape.position.y - shape.height/2 + 20 },
        { x: shape.position.x + shape.width/2 - 20, y: shape.position.y - shape.height/2 + 20 },
        { x: shape.position.x - shape.width/2 + 20, y: shape.position.y + shape.height/2 - 20 },
        { x: shape.position.x + shape.width/2 - 20, y: shape.position.y + shape.height/2 - 20 },
      ];
      
      for (let i = 0; i < positions.length; i++) {
        const screw = new Screw(
          `${shape.id}-screw-${i}`,
          shape.id,
          positions[i],
          screwColor
        );
        screws.push(screw);
      }
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
    const renderContext = {
      ctx: context,
      canvas: context.canvas,
      debugMode: this.debugMode,
    };

    // Set a nice tint color for the editor
    shape.tint = '#4a90e2';
    
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
    if (this.currentShape.definition.screwPlacement.strategy !== 'custom') return;

    const screwColor = getRandomScrewColor();
    const screw = new Screw(
      screwId,
      this.currentShape.shape.id,
      position,
      screwColor
    );

    this.currentShape.screws.push(screw);

    // Update custom positions in definition
    if (!this.currentShape.definition.screwPlacement.customPositions) {
      this.currentShape.definition.screwPlacement.customPositions = [];
    }
    
    this.currentShape.definition.screwPlacement.customPositions.push({
      position,
      priority: 1,
    });

    // Emit update
    await this.emit({
      type: 'editor:property:changed',
      payload: {
        path: 'screwPlacement.customPositions',
        value: this.currentShape.definition.screwPlacement.customPositions,
      },
    });
  }

  private async removeCustomScrew(shapeId: string, screwId: string): Promise<void> {
    if (!this.currentShape || this.currentShape.id !== shapeId) return;
    if (this.currentShape.definition.screwPlacement.strategy !== 'custom') return;

    const screwIndex = this.currentShape.screws.findIndex(s => s.id === screwId);
    if (screwIndex === -1) return;

    this.currentShape.screws.splice(screwIndex, 1);

    // Update custom positions in definition
    if (this.currentShape.definition.screwPlacement.customPositions) {
      this.currentShape.definition.screwPlacement.customPositions.splice(screwIndex, 1);
      
      await this.emit({
        type: 'editor:property:changed',
        payload: {
          path: 'screwPlacement.customPositions',
          value: this.currentShape.definition.screwPlacement.customPositions,
        },
      });
    }
  }

  // Public API for canvas interactions
  async handleCanvasClick(x: number, y: number): Promise<void> {
    if (!this.currentShape) return;
    if (this.currentShape.definition.screwPlacement.strategy !== 'custom') return;

    // Convert to shape-relative coordinates
    const relativeX = x - this.canvasWidth / 2;
    const relativeY = y - this.canvasHeight / 2;

    // Check if clicking on existing screw to remove it
    const clickedScrewIndex = this.currentShape.screws.findIndex(screw => {
      const dx = screw.position.x - relativeX;
      const dy = screw.position.y - relativeY;
      return Math.sqrt(dx * dx + dy * dy) < 15; // 15px click radius
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
      const newScrewId = `custom_screw_${Date.now()}`;
      await this.emit({
        type: 'editor:screw:added',
        payload: {
          shapeId: this.currentShape.id,
          position: { x: relativeX, y: relativeY },
          screwId: newScrewId,
        },
      });
    }
  }

  getCurrentShape(): EditorShape | null {
    return this.currentShape;
  }
}