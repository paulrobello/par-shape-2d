/**
 * Editor-specific constants and configuration
 */

import { GAME_CONFIG } from '@/game/utils/Constants';

export const EDITOR_CONSTANTS = {
  canvas: {
    defaultWidth: 800,
    defaultHeight: 600,
    backgroundColor: '#f8f9fa',
    gridSize: 20,
    snapToGrid: false,
  },
  
  shape: {
    defaultPosition: { x: 0, y: 0 },
    previewTint: '#4a90e2',
    highlightColor: '#007bff',
    selectionRadius: 15,
  },
  
  screw: {
    defaultColor: '#ff0000',
    clickRadius: 15,
    previewAlpha: 0.7,
  },
  
  physics: {
    gravity: GAME_CONFIG.physics.gravity,
    timestep: GAME_CONFIG.physics.timestep,
    maxBodies: 50,
  },
  
  ui: {
    panelWidth: 300,
    toolbarHeight: 60,
    borderRadius: 4,
    spacing: {
      small: 4,
      medium: 8,
      large: 16,
    },
    colors: {
      primary: '#007bff',
      secondary: '#6c757d',
      success: '#28a745',
      danger: '#dc3545',
      warning: '#ffc107',
      info: '#17a2b8',
      light: '#f8f9fa',
      dark: '#343a40',
      border: '#e0e0e0',
    },
  },
  
  animation: {
    defaultDuration: 300,
    easing: 'ease-in-out',
  },
  
  validation: {
    maxFileSize: 1024 * 1024, // 1MB
    allowedFileTypes: ['.json', 'application/json'],
    maxShapeSize: 1000,
    minShapeSize: 10,
  },
  
  debug: {
    showPerformance: true,
    logEvents: false,
    maxHistorySize: 1000,
  },
} as const;

export const EDITOR_EVENTS = {
  file: {
    loadRequested: 'editor:file:load:requested',
    loadCompleted: 'editor:file:load:completed',
    loadFailed: 'editor:file:load:failed',
    saveRequested: 'editor:file:save:requested',
    saveCompleted: 'editor:file:save:completed',
    validationFailed: 'editor:file:validation:failed',
  },
  
  property: {
    changed: 'editor:property:changed',
    validated: 'editor:property:validated',
    randomRequested: 'editor:property:random:requested',
    resetRequested: 'editor:property:reset:requested',
  },
  
  shape: {
    created: 'editor:shape:created',
    updated: 'editor:shape:updated',
    destroyed: 'editor:shape:destroyed',
    selected: 'editor:shape:selected',
    previewUpdated: 'editor:shape:preview:updated',
  },
  
  screw: {
    placementUpdated: 'editor:screw:placement:updated',
    added: 'editor:screw:added',
    removed: 'editor:screw:removed',
    strategyChanged: 'editor:screw:strategy:changed',
  },
  
  physics: {
    startRequested: 'editor:physics:start:requested',
    pauseRequested: 'editor:physics:pause:requested',
    resetRequested: 'editor:physics:reset:requested',
    stepCompleted: 'editor:physics:step:completed',
    debugToggled: 'editor:physics:debug:toggled',
  },
  
  ui: {
    panelToggled: 'editor:panel:toggled',
    modeChanged: 'editor:mode:changed',
    canvasResized: 'editor:canvas:resized',
  },
  
  error: {
    validation: 'editor:error:validation',
    physics: 'editor:error:physics',
    file: 'editor:error:file',
  },
} as const;

export type EditorConstants = typeof EDITOR_CONSTANTS;
export type EditorEventNames = typeof EDITOR_EVENTS;