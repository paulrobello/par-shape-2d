import { BaseEditorSystem } from '../core/BaseEditorSystem';
import { ShapeDefinition } from '@/types/shapes';
import { EditorEventPriority } from '../core/EditorEventBus';
import { EditorFileLoadRequestedEvent, EditorFileSaveRequestedEvent } from '../events/EditorEventTypes';

/**
 * Manages file operations for shape definitions
 */
export class FileManager extends BaseEditorSystem {
  constructor() {
    super('FileManager');
  }

  protected async onInitialize(): Promise<void> {
    this.setupEventSubscriptions();
  }

  protected onUpdate(deltaTime: number): void {
    // FileManager doesn't need frame updates
    void deltaTime;
  }

  protected onRender(context: CanvasRenderingContext2D): void {
    // FileManager doesn't render
    void context;
  }

  protected onDestroy(): void {
    // Cleanup if needed
  }

  private setupEventSubscriptions(): void {
    // Handle file load requests
    this.subscribe('editor:file:load:requested', async (event: EditorFileLoadRequestedEvent) => {
      await this.loadFile(event.payload.file);
    }, EditorEventPriority.HIGH);

    // Handle file save requests
    this.subscribe('editor:file:save:requested', async (event: EditorFileSaveRequestedEvent) => {
      await this.saveFile(event.payload.shapeDefinition, event.payload.filename);
    }, EditorEventPriority.HIGH);
  }

  private async loadFile(file: File): Promise<void> {
    console.log('FileManager: Loading file:', file.name, 'size:', file.size);
    try {
      const text = await this.readFileAsText(file);
      console.log('FileManager: File read successfully, parsing JSON...');
      const shapeDefinition = this.parseShapeDefinition(text);
      
      // Validate the shape definition
      const validationErrors = this.validateShapeDefinition(shapeDefinition as unknown as Record<string, unknown>);
      if (validationErrors.length > 0) {
        await this.emit({
          type: 'editor:file:validation:failed',
          payload: {
            errors: validationErrors,
            filename: file.name,
          },
        });
        return;
      }

      // Emit successful load
      await this.emit({
        type: 'editor:file:load:completed',
        payload: {
          shapeDefinition,
          filename: file.name,
        },
      });
    } catch (error) {
      await this.emit({
        type: 'editor:file:load:failed',
        payload: {
          error: error instanceof Error ? error.message : 'Unknown error',
          filename: file.name,
        },
      });
    }
  }

  private async saveFile(shapeDefinition: ShapeDefinition, filename?: string): Promise<void> {
    try {
      const json = JSON.stringify(shapeDefinition, null, 2);
      const finalFilename = filename || `${shapeDefinition.id || 'shape'}.json`;
      
      await this.downloadFile(json, finalFilename, 'application/json');
      
      await this.emit({
        type: 'editor:file:save:completed',
        payload: {
          filename: finalFilename,
        },
      });
    } catch (error: unknown) {
      await this.emit({
        type: 'editor:error:file',
        payload: {
          error: error instanceof Error ? error.message : 'Unknown error',
          operation: 'save',
          filename,
        },
      });
    }
  }

  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  private parseShapeDefinition(text: string): ShapeDefinition {
    try {
      const parsed = JSON.parse(text);
      return parsed as ShapeDefinition;
    } catch {
      throw new Error('Invalid JSON format');
    }
  }

  private validateShapeDefinition(shape: Record<string, unknown>): string[] {
    const errors: string[] = [];

    // Required fields
    if (!shape.id || typeof shape.id !== 'string') {
      errors.push('Missing or invalid "id" field');
    }
    if (!shape.name || typeof shape.name !== 'string') {
      errors.push('Missing or invalid "name" field');
    }
    if (!shape.category || typeof shape.category !== 'string') {
      errors.push('Missing or invalid "category" field');
    }
    if (typeof shape.enabled !== 'boolean') {
      errors.push('Missing or invalid "enabled" field');
    }

    // Dimensions
    if (!shape.dimensions || typeof shape.dimensions !== 'object') {
      errors.push('Missing or invalid "dimensions" field');
    } else {
      const dimensions = shape.dimensions as Record<string, unknown>;
      if (!dimensions.type || !['fixed', 'random'].includes(dimensions.type as string)) {
        errors.push('Invalid dimensions.type - must be "fixed" or "random"');
      }
    }

    // Physics
    if (!shape.physics || typeof shape.physics !== 'object') {
      errors.push('Missing or invalid "physics" field');
    } else {
      const physics = shape.physics as Record<string, unknown>;
      const validPhysicsTypes = ['rectangle', 'circle', 'polygon', 'fromVertices', 'composite'];
      if (!physics.type || !validPhysicsTypes.includes(physics.type as string)) {
        errors.push(`Invalid physics.type - must be one of: ${validPhysicsTypes.join(', ')}`);
      }
    }

    // Rendering
    if (!shape.rendering || typeof shape.rendering !== 'object') {
      errors.push('Missing or invalid "rendering" field');
    } else {
      const rendering = shape.rendering as Record<string, unknown>;
      const validRenderingTypes = ['primitive', 'path', 'composite'];
      if (!rendering.type || !validRenderingTypes.includes(rendering.type as string)) {
        errors.push(`Invalid rendering.type - must be one of: ${validRenderingTypes.join(', ')}`);
      }
    }

    // Screw placement
    if (!shape.screwPlacement || typeof shape.screwPlacement !== 'object') {
      errors.push('Missing or invalid "screwPlacement" field');
    } else {
      const screwPlacement = shape.screwPlacement as Record<string, unknown>;
      const validStrategies = ['corners', 'perimeter', 'grid', 'custom', 'capsule'];
      if (!screwPlacement.strategy || !validStrategies.includes(screwPlacement.strategy as string)) {
        errors.push(`Invalid screwPlacement.strategy - must be one of: ${validStrategies.join(', ')}`);
      }
    }

    // Visual
    if (!shape.visual || typeof shape.visual !== 'object') {
      errors.push('Missing or invalid "visual" field');
    }

    // Behavior
    if (!shape.behavior || typeof shape.behavior !== 'object') {
      errors.push('Missing or invalid "behavior" field');
    }

    return errors;
  }

  private async downloadFile(content: string, filename: string, mimeType: string): Promise<void> {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);
  }

  // Public API for UI components
  async loadFromFile(file: File): Promise<void> {
    await this.emit({
      type: 'editor:file:load:requested',
      payload: { file },
    });
  }

  async saveShapeDefinition(shapeDefinition: ShapeDefinition, filename?: string): Promise<void> {
    await this.emit({
      type: 'editor:file:save:requested',
      payload: { shapeDefinition, filename },
    });
  }

  isValidFileType(file: File): boolean {
    return file.type === 'application/json' || file.name.endsWith('.json');
  }

  getAcceptedFileTypes(): string {
    return '.json,application/json';
  }

  /**
   * Load a shape definition directly (used for shapes created by drawing tools)
   */
  async loadShapeFromDefinition(shapeDefinition: ShapeDefinition): Promise<void> {
    try {
      // Validate the shape definition
      const validationErrors = this.validateShapeDefinition(shapeDefinition as unknown as Record<string, unknown>);
      if (validationErrors.length > 0) {
        await this.emit({
          type: 'editor:file:validation:failed',
          payload: {
            errors: validationErrors,
            filename: shapeDefinition.name || 'Created Shape',
          },
        });
        return;
      }

      // Emit successful load
      await this.emit({
        type: 'editor:file:load:completed',
        payload: {
          shapeDefinition,
          filename: shapeDefinition.name || 'Created Shape',
        },
      });
    } catch (error) {
      await this.emit({
        type: 'editor:file:load:failed',
        payload: {
          error: error instanceof Error ? error.message : 'Unknown error',
          filename: shapeDefinition.name || 'Created Shape',
        },
      });
    }
  }
}