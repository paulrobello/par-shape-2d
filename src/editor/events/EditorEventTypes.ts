import { ShapeDefinition } from '@/types/shapes';
import { BaseEvent, EventHandler } from '@/shared/events';

// File Management Events
export interface EditorFileLoadRequestedEvent extends BaseEvent {
  type: 'editor:file:load:requested';
  payload: {
    file: File;
  };
}

export interface EditorFileLoadCompletedEvent extends BaseEvent {
  type: 'editor:file:load:completed';
  payload: {
    shapeDefinition: ShapeDefinition;
    filename: string;
  };
}

export interface EditorFileLoadFailedEvent extends BaseEvent {
  type: 'editor:file:load:failed';
  payload: {
    error: string;
    filename: string;
  };
}

export interface EditorFileSaveRequestedEvent extends BaseEvent {
  type: 'editor:file:save:requested';
  payload: {
    shapeDefinition: ShapeDefinition;
    filename?: string;
  };
}

export interface EditorFileSaveCompletedEvent extends BaseEvent {
  type: 'editor:file:save:completed';
  payload: {
    filename: string;
  };
}

export interface EditorFileValidationFailedEvent extends BaseEvent {
  type: 'editor:file:validation:failed';
  payload: {
    errors: string[];
    filename: string;
  };
}

// Property Management Events
export interface EditorPropertyChangedEvent extends BaseEvent {
  type: 'editor:property:changed';
  payload: {
    path: string;
    value: unknown;
    oldValue?: unknown;
  };
}

export interface EditorPropertyValidatedEvent extends BaseEvent {
  type: 'editor:property:validated';
  payload: {
    path: string;
    isValid: boolean;
    error?: string;
  };
}

export interface EditorPropertyRandomRequestedEvent extends BaseEvent {
  type: 'editor:property:random:requested';
  payload: {
    paths?: string[]; // If not provided, randomize all
  };
}

export interface EditorPropertyResetRequestedEvent extends BaseEvent {
  type: 'editor:property:reset:requested';
  payload: {
    paths?: string[]; // If not provided, reset all
  };
}

// Shape Management Events
export interface EditorShapeCreatedEvent extends BaseEvent {
  type: 'editor:shape:created';
  payload: {
    shapeDefinition: ShapeDefinition;
    shapeId: string;
  };
}

export interface EditorShapeUpdatedEvent extends BaseEvent {
  type: 'editor:shape:updated';
  payload: {
    shapeDefinition: ShapeDefinition;
    shapeId: string;
  };
}

export interface EditorShapeDestroyedEvent extends BaseEvent {
  type: 'editor:shape:destroyed';
  payload: {
    shapeId: string;
  };
}

export interface EditorShapeSelectedEvent extends BaseEvent {
  type: 'editor:shape:selected';
  payload: {
    shapeId: string | null;
  };
}

export interface EditorShapePreviewUpdatedEvent extends BaseEvent {
  type: 'editor:shape:preview:updated';
  payload: {
    shapeId: string;
  };
}

// Screw Management Events
export interface EditorScrewPlacementUpdatedEvent extends BaseEvent {
  type: 'editor:screw:placement:updated';
  payload: {
    shapeId: string;
    screwPositions: Array<{ x: number; y: number; id: string }>;
  };
}

export interface EditorScrewAddedEvent extends BaseEvent {
  type: 'editor:screw:added';
  payload: {
    shapeId: string;
    position: { x: number; y: number };
    screwId: string;
  };
}

export interface EditorScrewRemovedEvent extends BaseEvent {
  type: 'editor:screw:removed';
  payload: {
    shapeId: string;
    screwId: string;
  };
}

export interface EditorScrewStrategyChangedEvent extends BaseEvent {
  type: 'editor:screw:strategy:changed';
  payload: {
    shapeId: string;
    strategy: string;
  };
}

// Physics Simulation Events
export interface EditorPhysicsStartRequestedEvent extends BaseEvent {
  type: 'editor:physics:start:requested';
  payload: {
    shapeId: string;
  };
}

export interface EditorPhysicsPauseRequestedEvent extends BaseEvent {
  type: 'editor:physics:pause:requested';
  payload: Record<string, never>;
}

export interface EditorPhysicsResetRequestedEvent extends BaseEvent {
  type: 'editor:physics:reset:requested';
  payload: Record<string, never>;
}

export interface EditorPhysicsStepCompletedEvent extends BaseEvent {
  type: 'editor:physics:step:completed';
  payload: {
    timestamp: number;
  };
}

export interface EditorPhysicsDebugToggledEvent extends BaseEvent {
  type: 'editor:physics:debug:toggled';
  payload: {
    enabled: boolean;
  };
}

export interface EditorPhysicsSimulationShapeRequestedEvent extends BaseEvent {
  type: 'editor:physics:simulation:shape:requested';
  payload: {
    shapeId: string;
  };
}

export interface EditorPhysicsSimulationShapeProvidedEvent extends BaseEvent {
  type: 'editor:physics:simulation:shape:provided';
  payload: {
    shapeId: string;
    shape: {
      id: string;
      type: string;
      position: { x: number; y: number };
      body: unknown; // Matter.js Body
      radius?: number;
      width?: number;
      height?: number;
    };
    screws: Array<{
      id: string;
      position: { x: number; y: number };
    }>;
  };
}

// UI State Events
export interface EditorPanelToggledEvent extends BaseEvent {
  type: 'editor:panel:toggled';
  payload: {
    panel: string;
    visible: boolean;
  };
}

export interface EditorModeChangedEvent extends BaseEvent {
  type: 'editor:mode:changed';
  payload: {
    mode: 'edit' | 'simulate' | 'debug';
  };
}

export interface EditorCanvasResizedEvent extends BaseEvent {
  type: 'editor:canvas:resized';
  payload: {
    width: number;
    height: number;
  };
}

// Drawing Tool Events (Phase 2)
export interface EditorToolSelectedEvent extends BaseEvent {
  type: 'editor:tool:selected';
  payload: {
    toolName: string;
    previousTool?: string;
  };
}

export interface EditorDrawingStartedEvent extends BaseEvent {
  type: 'editor:drawing:started';
  payload: {
    toolName: string;
    startPoint: { x: number; y: number };
  };
}

export interface EditorDrawingProgressEvent extends BaseEvent {
  type: 'editor:drawing:progress';
  payload: {
    toolName: string;
    step: number;
    point: { x: number; y: number };
    data?: unknown;
  };
}

export interface EditorDrawingPreviewUpdatedEvent extends BaseEvent {
  type: 'editor:drawing:preview:updated';
  payload: {
    toolName: string;
    previewData: unknown;
  };
}

export interface EditorDrawingCompletedEvent extends BaseEvent {
  type: 'editor:drawing:completed';
  payload: {
    toolName: string;
    shapeDefinition: ShapeDefinition;
  };
}

export interface EditorDrawingCancelledEvent extends BaseEvent {
  type: 'editor:drawing:cancelled';
  payload: {
    toolName: string;
    reason: 'escape' | 'tool_change' | 'user_action';
  };
}

export interface EditorDrawingModeChangedEvent extends BaseEvent {
  type: 'editor:drawing:mode:changed';
  payload: {
    mode: 'edit' | 'create';
    previousMode: 'edit' | 'create';
  };
}

export interface EditorDrawingStateChangedEvent extends BaseEvent {
  type: 'editor:drawing:state:changed';
  payload: {
    toolName: string;
    state: string;
    previousState?: string;
  };
}

// Grid System Events (Phase 2)
export interface EditorGridToggledEvent extends BaseEvent {
  type: 'editor:grid:toggled';
  payload: {
    enabled: boolean;
  };
}

export interface EditorGridSizeChangedEvent extends BaseEvent {
  type: 'editor:grid:size:changed';
  payload: {
    size: number;
    previousSize: number;
  };
}

export interface EditorGridSnapToggledEvent extends BaseEvent {
  type: 'editor:grid:snap:toggled';
  payload: {
    enabled: boolean;
  };
}

export interface EditorGridCoordinateSnappedEvent extends BaseEvent {
  type: 'editor:grid:coordinate:snapped';
  payload: {
    original: { x: number; y: number };
    snapped: { x: number; y: number };
  };
}

// Error Events
export interface EditorErrorValidationEvent extends BaseEvent {
  type: 'editor:error:validation';
  payload: {
    errors: string[];
    context: string;
  };
}

export interface EditorErrorPhysicsEvent extends BaseEvent {
  type: 'editor:error:physics';
  payload: {
    error: string;
    context: string;
  };
}

export interface EditorErrorFileEvent extends BaseEvent {
  type: 'editor:error:file';
  payload: {
    error: string;
    operation: 'load' | 'save';
    filename?: string;
  };
}

// Union type of all editor events
export type EditorEvent =
  | EditorFileLoadRequestedEvent
  | EditorFileLoadCompletedEvent
  | EditorFileLoadFailedEvent
  | EditorFileSaveRequestedEvent
  | EditorFileSaveCompletedEvent
  | EditorFileValidationFailedEvent
  | EditorPropertyChangedEvent
  | EditorPropertyValidatedEvent
  | EditorPropertyRandomRequestedEvent
  | EditorPropertyResetRequestedEvent
  | EditorShapeCreatedEvent
  | EditorShapeUpdatedEvent
  | EditorShapeDestroyedEvent
  | EditorShapeSelectedEvent
  | EditorShapePreviewUpdatedEvent
  | EditorScrewPlacementUpdatedEvent
  | EditorScrewAddedEvent
  | EditorScrewRemovedEvent
  | EditorScrewStrategyChangedEvent
  | EditorPhysicsStartRequestedEvent
  | EditorPhysicsPauseRequestedEvent
  | EditorPhysicsResetRequestedEvent
  | EditorPhysicsStepCompletedEvent
  | EditorPhysicsDebugToggledEvent
  | EditorPhysicsSimulationShapeRequestedEvent
  | EditorPhysicsSimulationShapeProvidedEvent
  | EditorPanelToggledEvent
  | EditorModeChangedEvent
  | EditorCanvasResizedEvent
  | EditorToolSelectedEvent
  | EditorDrawingStartedEvent
  | EditorDrawingProgressEvent
  | EditorDrawingPreviewUpdatedEvent
  | EditorDrawingCompletedEvent
  | EditorDrawingCancelledEvent
  | EditorDrawingModeChangedEvent
  | EditorDrawingStateChangedEvent
  | EditorGridToggledEvent
  | EditorGridSizeChangedEvent
  | EditorGridSnapToggledEvent
  | EditorGridCoordinateSnappedEvent
  | EditorErrorValidationEvent
  | EditorErrorPhysicsEvent
  | EditorErrorFileEvent;

// Event type string union
export type EditorEventType = EditorEvent['type'];

// Event handler type
export type EditorEventHandler<T extends EditorEvent = EditorEvent> = EventHandler<T>;