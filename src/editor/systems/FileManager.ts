import { BaseEditorSystem } from '../core/BaseEditorSystem';
import { ShapeDefinition } from '@/types/shapes';
import { EditorEventPriority } from '../core/EditorEventBus';
import { EditorFileLoadRequestedEvent, EditorFileSaveRequestedEvent } from '../events/EditorEventTypes';
import { ShapeValidator } from '@/shared/validation';

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
      // parseShapeDefinition now handles validation internally
      const shapeDefinition = this.parseShapeDefinition(text);

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
    const validationResult = ShapeValidator.validateFromJson(text);
    
    if (!validationResult.isValid) {
      const errorMessage = validationResult.errors.length > 0 
        ? validationResult.errors.join('; ') 
        : 'Unknown validation error';
      throw new Error(`Shape validation failed: ${errorMessage}`);
    }

    if (!validationResult.validatedShape) {
      throw new Error('Failed to parse shape definition');
    }

    // Log applied defaults for user awareness
    if (validationResult.appliedDefaults && validationResult.appliedDefaults.length > 0) {
      console.log('Applied defaults to shape:', validationResult.appliedDefaults);
    }

    // Log warnings if any
    if (validationResult.warnings && validationResult.warnings.length > 0) {
      console.warn('Shape validation warnings:', validationResult.warnings.join('; '));
    }

    return validationResult.validatedShape;
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
      // Validate the shape definition using shared validator
      const validationResult = ShapeValidator.validateWithDefaults(shapeDefinition);
      if (!validationResult.isValid) {
        await this.emit({
          type: 'editor:file:validation:failed',
          payload: {
            errors: validationResult.errors,
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