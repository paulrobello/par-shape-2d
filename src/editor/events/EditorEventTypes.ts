import { ShapeDefinition } from '@/types/shapes';

// File Management Events
export interface EditorFileLoadRequestedEvent {
  type: 'editor:file:load:requested';
  payload: {
    file: File;
  };
}

export interface EditorFileLoadCompletedEvent {
  type: 'editor:file:load:completed';
  payload: {
    shapeDefinition: ShapeDefinition;
    filename: string;
  };
}

export interface EditorFileLoadFailedEvent {
  type: 'editor:file:load:failed';
  payload: {
    error: string;
    filename: string;
  };
}

export interface EditorFileSaveRequestedEvent {
  type: 'editor:file:save:requested';
  payload: {
    shapeDefinition: ShapeDefinition;
    filename?: string;
  };
}

export interface EditorFileSaveCompletedEvent {
  type: 'editor:file:save:completed';
  payload: {
    filename: string;
  };
}

export interface EditorFileValidationFailedEvent {
  type: 'editor:file:validation:failed';
  payload: {
    errors: string[];
    filename: string;
  };
}

// Property Management Events
export interface EditorPropertyChangedEvent {
  type: 'editor:property:changed';
  payload: {
    path: string;
    value: unknown;
    oldValue?: unknown;
  };
}

export interface EditorPropertyValidatedEvent {
  type: 'editor:property:validated';
  payload: {
    path: string;
    isValid: boolean;
    error?: string;
  };
}

export interface EditorPropertyRandomRequestedEvent {
  type: 'editor:property:random:requested';
  payload: {
    paths?: string[]; // If not provided, randomize all
  };
}

export interface EditorPropertyResetRequestedEvent {
  type: 'editor:property:reset:requested';
  payload: {
    paths?: string[]; // If not provided, reset all
  };
}

// Shape Management Events
export interface EditorShapeCreatedEvent {
  type: 'editor:shape:created';
  payload: {
    shapeDefinition: ShapeDefinition;
    shapeId: string;
  };
}

export interface EditorShapeUpdatedEvent {
  type: 'editor:shape:updated';
  payload: {
    shapeDefinition: ShapeDefinition;
    shapeId: string;
  };
}

export interface EditorShapeDestroyedEvent {
  type: 'editor:shape:destroyed';
  payload: {
    shapeId: string;
  };
}

export interface EditorShapeSelectedEvent {
  type: 'editor:shape:selected';
  payload: {
    shapeId: string | null;
  };
}

export interface EditorShapePreviewUpdatedEvent {
  type: 'editor:shape:preview:updated';
  payload: {
    shapeId: string;
  };
}

// Screw Management Events
export interface EditorScrewPlacementUpdatedEvent {
  type: 'editor:screw:placement:updated';
  payload: {
    shapeId: string;
    screwPositions: Array<{ x: number; y: number; id: string }>;
  };
}

export interface EditorScrewAddedEvent {
  type: 'editor:screw:added';
  payload: {
    shapeId: string;
    position: { x: number; y: number };
    screwId: string;
  };
}

export interface EditorScrewRemovedEvent {
  type: 'editor:screw:removed';
  payload: {
    shapeId: string;
    screwId: string;
  };
}

export interface EditorScrewStrategyChangedEvent {
  type: 'editor:screw:strategy:changed';
  payload: {
    shapeId: string;
    strategy: string;
  };
}

// Physics Simulation Events
export interface EditorPhysicsStartRequestedEvent {
  type: 'editor:physics:start:requested';
  payload: {
    shapeId: string;
  };
}

export interface EditorPhysicsPauseRequestedEvent {
  type: 'editor:physics:pause:requested';
  payload: Record<string, never>;
}

export interface EditorPhysicsResetRequestedEvent {
  type: 'editor:physics:reset:requested';
  payload: Record<string, never>;
}

export interface EditorPhysicsStepCompletedEvent {
  type: 'editor:physics:step:completed';
  payload: {
    timestamp: number;
  };
}

export interface EditorPhysicsDebugToggledEvent {
  type: 'editor:physics:debug:toggled';
  payload: {
    enabled: boolean;
  };
}

export interface EditorPhysicsSimulationShapeRequestedEvent {
  type: 'editor:physics:simulation:shape:requested';
  payload: {
    shapeId: string;
  };
}

export interface EditorPhysicsSimulationShapeProvidedEvent {
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
export interface EditorPanelToggledEvent {
  type: 'editor:panel:toggled';
  payload: {
    panel: string;
    visible: boolean;
  };
}

export interface EditorModeChangedEvent {
  type: 'editor:mode:changed';
  payload: {
    mode: 'edit' | 'simulate' | 'debug';
  };
}

export interface EditorCanvasResizedEvent {
  type: 'editor:canvas:resized';
  payload: {
    width: number;
    height: number;
  };
}

// Error Events
export interface EditorErrorValidationEvent {
  type: 'editor:error:validation';
  payload: {
    errors: string[];
    context: string;
  };
}

export interface EditorErrorPhysicsEvent {
  type: 'editor:error:physics';
  payload: {
    error: string;
    context: string;
  };
}

export interface EditorErrorFileEvent {
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
  | EditorErrorValidationEvent
  | EditorErrorPhysicsEvent
  | EditorErrorFileEvent;

// Event type string union
export type EditorEventType = EditorEvent['type'];

// Event handler type
export type EditorEventHandler<T extends EditorEvent = EditorEvent> = (event: T) => void | Promise<void>;