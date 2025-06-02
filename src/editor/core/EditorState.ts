import { ShapeDefinition } from '@/types/shapes';
import { BaseEditorSystem } from './BaseEditorSystem';
import { EditorEventPriority } from './EditorEventBus';
import { 
  EditorFileLoadCompletedEvent, 
  EditorPropertyChangedEvent,
  EditorModeChangedEvent,
  EditorPhysicsDebugToggledEvent
} from '../events/EditorEventTypes';

export interface EditorStateData {
  currentShape: ShapeDefinition | null;
  currentShapeId: string | null;
  filename: string | null;
  isDirty: boolean;
  mode: 'edit' | 'simulate' | 'debug';
  simulationRunning: boolean;
  debugMode: boolean;
}

/**
 * Manages editor state and persistence
 */
export class EditorState extends BaseEditorSystem {
  private state: EditorStateData = {
    currentShape: null,
    currentShapeId: null,
    filename: null,
    isDirty: false,
    mode: 'edit',
    simulationRunning: false,
    debugMode: false,
  };

  private stateChangeCallbacks: Array<(state: EditorStateData) => void> = [];

  constructor() {
    super('EditorState');
  }

  protected async onInitialize(): Promise<void> {
    this.setupEventSubscriptions();
  }

  protected onUpdate(deltaTime: number): void {
    // EditorState doesn't need frame updates
    void deltaTime;
  }

  protected onRender(context: CanvasRenderingContext2D): void {
    // EditorState doesn't render
    void context;
  }

  protected onDestroy(): void {
    this.stateChangeCallbacks = [];
  }

  private setupEventSubscriptions(): void {
    // File loading
    this.subscribe('editor:file:load:completed', async (event: EditorFileLoadCompletedEvent) => {
      this.setState({
        currentShape: event.payload.shapeDefinition,
        currentShapeId: `shape_${Date.now()}`,
        filename: event.payload.filename,
        isDirty: false,
      });
    }, EditorEventPriority.HIGH);

    // Property changes
    this.subscribe('editor:property:changed', async (event: EditorPropertyChangedEvent) => {
      if (this.state.currentShape) {
        const updatedShape = this.updateShapeProperty(
          this.state.currentShape,
          event.payload.path,
          event.payload.value
        );
        
        this.setState({
          currentShape: updatedShape,
          isDirty: true,
        });

        // Emit shape updated event
        if (this.state.currentShapeId) {
          await this.emit({
            type: 'editor:shape:updated',
            payload: {
              shapeDefinition: updatedShape,
              shapeId: this.state.currentShapeId,
            },
          });
        }
      }
    }, EditorEventPriority.HIGH);

    // Mode changes
    this.subscribe('editor:mode:changed', async (event: EditorModeChangedEvent) => {
      this.setState({
        mode: event.payload.mode,
      });
    });

    // Physics simulation
    this.subscribe('editor:physics:start:requested', async () => {
      this.setState({
        simulationRunning: true,
        mode: 'simulate',
      });
    });

    this.subscribe('editor:physics:pause:requested', async () => {
      this.setState({
        simulationRunning: false,
      });
    });

    this.subscribe('editor:physics:reset:requested', async () => {
      this.setState({
        simulationRunning: false,
      });
    });

    // Debug mode
    this.subscribe('editor:physics:debug:toggled', async (event: EditorPhysicsDebugToggledEvent) => {
      this.setState({
        debugMode: event.payload.enabled,
      });
    });
  }

  private updateShapeProperty(shape: ShapeDefinition, path: string, value: unknown): ShapeDefinition {
    const updatedShape = JSON.parse(JSON.stringify(shape)); // Deep clone
    
    const pathParts = path.split('.');
    let current: Record<string, unknown> = updatedShape;
    
    // Navigate to the parent of the target property
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (!(pathParts[i] in current)) {
        current[pathParts[i]] = {};
      }
      current = current[pathParts[i]] as Record<string, unknown>;
    }
    
    // Set the value
    current[pathParts[pathParts.length - 1]] = value;
    
    return updatedShape;
  }

  private setState(updates: Partial<EditorStateData>): void {
    this.state = { ...this.state, ...updates };
    this.notifyStateChange();
  }

  private notifyStateChange(): void {
    this.stateChangeCallbacks.forEach(callback => {
      try {
        callback({ ...this.state });
      } catch (error) {
        console.error('Error in state change callback:', error);
      }
    });
  }

  // Public API
  getState(): EditorStateData {
    return { ...this.state };
  }

  getCurrentShape(): ShapeDefinition | null {
    return this.state.currentShape;
  }

  getCurrentShapeId(): string | null {
    return this.state.currentShapeId;
  }

  isDirty(): boolean {
    return this.state.isDirty;
  }

  isSimulating(): boolean {
    return this.state.simulationRunning;
  }

  isDebugMode(): boolean {
    return this.state.debugMode;
  }

  getMode(): 'edit' | 'simulate' | 'debug' {
    return this.state.mode;
  }

  onStateChange(callback: (state: EditorStateData) => void): () => void {
    this.stateChangeCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.stateChangeCallbacks.indexOf(callback);
      if (index !== -1) {
        this.stateChangeCallbacks.splice(index, 1);
      }
    };
  }

  // Manual state setters for specific use cases
  async setCurrentShape(shape: ShapeDefinition, filename?: string): Promise<void> {
    this.setState({
      currentShape: shape,
      currentShapeId: `shape_${Date.now()}`,
      filename: filename || null,
      isDirty: false,
    });

    if (this.state.currentShapeId) {
      await this.emit({
        type: 'editor:shape:created',
        payload: {
          shapeDefinition: shape,
          shapeId: this.state.currentShapeId,
        },
      });
    }
  }

  async clearCurrentShape(): Promise<void> {
    const oldShapeId = this.state.currentShapeId;
    
    this.setState({
      currentShape: null,
      currentShapeId: null,
      filename: null,
      isDirty: false,
    });

    if (oldShapeId) {
      await this.emit({
        type: 'editor:shape:destroyed',
        payload: {
          shapeId: oldShapeId,
        },
      });
    }
  }

  markClean(): void {
    this.setState({ isDirty: false });
  }
}