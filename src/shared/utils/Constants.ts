/**
 * Consolidated constants and configuration for game and editor systems
 * Single source of truth for all shared configuration values
 */

import { GameConfig, ScrewColor } from '@/types/game';

// =============================================================================
// PHYSICS CONSTANTS
// =============================================================================

export const PHYSICS_CONSTANTS = {
  shape: {
    friction: 0.1,
    frictionAir: 0.001,  // Reduced from 0.005 for faster swinging
    restitution: 0,
    density: 5,
  },
  constraint: {
    stiffness: 1,
    damping: 0.05,  // Reduced from 0.1 for less resistance
  },
  world: {
    bounds: { x: 0, y: 0, width: 800, height: 600 },
  },
  gravity: {
    game: { x: 0, y: 0.8 },
    editor: { x: 0, y: 1, scale: 0.001 },
  },
  timestep: 1000 / 60, // 60 FPS
} as const;

// =============================================================================
// GAME CONFIGURATION
// =============================================================================

export const GAME_CONFIG: GameConfig = {
  canvas: {
    width: 640,
    height: 800,
  },
  layer: {
    width: 640,
    height: 800,
    maxVisible: 4,
  },
  shapes: {
    minPerLayer: 6,
    maxPerLayer: 6,
    minScrews: 1,
    maxScrews: 6,
  },
  containers: {
    count: 4,
    maxHoles: 3, // Maximum 3 holes per container
  },
  holdingHoles: {
    count: 5,
  },
  physics: {
    gravity: PHYSICS_CONSTANTS.gravity.game,
    timestep: PHYSICS_CONSTANTS.timestep,
  },
} as const;

// =============================================================================
// EDITOR CONFIGURATION
// =============================================================================

export const EDITOR_CONFIG = {
  canvas: {
    defaultWidth: 800,
    defaultHeight: 600,
    backgroundColor: '#f8f9fa',
    gridSize: 20,
    snapToGrid: true, // Updated to default enabled
  },
  shape: {
    defaultPosition: { x: 0, y: 0 },
    previewTint: '#4a90e2',
    highlightColor: '#007bff',
    selectionRadius: 15,
    borderWidth: 5,
    alpha: 0.7,
  },
  screw: {
    defaultColor: '#ff0000',
    clickRadius: 15,
    previewAlpha: 0.7,
    radius: 12,
    borderWidth: 2,
  },
  physics: {
    gravity: PHYSICS_CONSTANTS.gravity.editor,
    timestep: PHYSICS_CONSTANTS.timestep,
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
} as const;

// =============================================================================
// COLOR CONSTANTS
// =============================================================================

export const SCREW_COLORS: Record<ScrewColor, string> = {
  pink: '#FF69B4',
  red: '#FF4500',
  green: '#32CD32',
  blue: '#1E90FF',
  lightBlue: '#87CEEB',
  yellow: '#FFD700',
  purple: '#9370DB',
  orange: '#FF8C00',
  brown: '#8B4513',
} as const;

export const SHAPE_TINTS = [
  '#FFE0E0', // Light red
  '#E0FFE0', // Light green  
  '#E0E6FF', // Light blue
  '#FFFDE0', // Light yellow
  '#F0E0FF', // Light purple
  '#FFE0F5', // Light pink
  '#E0FFF0', // Light mint
  '#F5FFE0', // Light lime
] as const;

export const COLOR_PALETTES = {
  screws: SCREW_COLORS,
  shapes: SHAPE_TINTS,
  debug: {
    physics: '#FF00FF',
    bounds: '#00FFFF',
    error: '#FF0000',
    highlight: '#4A4A4A',
    constraint: '#2C3E50',
    active: '#27AE60',
    inactive: '#E74C3C',
  },
  ui: {
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
  editor: {
    shape: '#007bff',
    shapeStroke: '#0056b3',
    screw: 'red',
    indicator: '#888888',
    indicatorFill: 'rgba(136, 136, 136, 0.3)',
    debug: '#ff0000',
  },
} as const;

// =============================================================================
// UI CONSTANTS
// =============================================================================

export const UI_CONSTANTS = {
  header: {
    height: 60,
  },
  input: {
    touchRadius: 30,  // Mobile touch interaction radius
    mouseRadius: 15,  // Desktop mouse interaction radius
  },
  containers: {
    width: 80,
    height: 40,
    spacing: 10,
    borderRadius: 8,
    startY: 100,
    hole: {
      radius: 8,
      innerRadius: 6,
      count: 3,
    },
  },
  holdingHoles: {
    radius: 8,
    spacing: 20,
    startY: 158, // Reduced gap between containers and holding holes (was 187)
    innerRadius: 6,
  },
  screws: {
    radius: 12,
    borderWidth: 2,
    blockingMargin: 0,
    highlight: {
      offsetX: 2,
      offsetY: 2,
      sizeRatio: 0.4,
    },
    cross: {
      sizeRatio: 0.6,
      lineWidth: 2,
    },
    indicators: {
      removableRadiusOffset: 3,
      blockedRadiusOffset: 2,
    },
  },
  shapes: {
    borderWidth: 5,
    alpha: 0.7,
  },
  grid: {
    defaultSize: 20,
    defaultOpacity: 0.6,
    defaultDotSize: 2,
  },
  spacing: {
    small: 4,
    medium: 8,
    large: 16,
  },
  borderRadius: {
    small: 4,
    medium: 8,
    large: 16,
  },
} as const;

// =============================================================================
// LAYOUT CONSTANTS
// =============================================================================

export const LAYOUT_CONSTANTS = {
  shapeArea: {
    startY: 171, // 5px past bottom of holding holes (158 + 8 + 5)
    backgroundColor: '#1A252F',
    borderColor: '#34495E',
  },
} as const;

// =============================================================================
// SCREW PLACEMENT CONSTANTS
// =============================================================================

export const SCREW_PLACEMENT_CONSTANTS = {
  minSeparation: 20,
  clickRadius: 15,
  visualRadius: 6,
  defaultMargin: 20,
  strategies: {
    corners: {
      defaultMargin: 20,
      angleThreshold: 30 * Math.PI / 180, // 30 degrees
    },
    perimeter: {
      defaultPoints: 8,
      defaultMargin: 30,
    },
    grid: {
      defaultSpacing: 40,
      defaultMargin: 20,
    },
    capsule: {
      defaultEndMargin: 15,
    },
    custom: {
      maxPositions: 20,
    },
  },
} as const;

// =============================================================================
// SHAPE VALIDATION CONSTANTS
// =============================================================================

export const SHAPE_VALIDATION_CONSTANTS = {
  minDimensions: {
    width: 54,
    height: 54,
    radius: 54,
  },
  maxDimensions: {
    width: 500,
    height: 500,
    radius: 250,
  },
  polygon: {
    minSides: 3,
    maxSides: 12,
  },
  path: {
    minVertices: 3,
    maxVertices: 100,
    minScale: 0.1,
    maxScale: 5.0,
  },
  file: {
    maxSize: 1024 * 1024, // 1MB
    allowedTypes: ['.json', 'application/json'],
  },
} as const;

// =============================================================================
// DEBUG CONFIGURATION
// =============================================================================

/**
 * Centralized debug configuration for conditional logging across all systems.
 * 
 * **Important**: All flags are disabled by default for production performance.
 * Enable specific flags only when debugging particular issues.
 * 
 * **Performance Impact**: Debug logging can significantly impact performance,
 * especially high-frequency flags like logScrewPositionUpdates.
 * 
 * **Usage Pattern**: Enable specific flags for debugging, disable after fixing.
 * Use throttling settings to control log frequency for spammy operations.
 */
export const DEBUG_CONFIG = {
  // Global debug settings
  enableVerboseLogging: false,          // Master switch for all verbose debug output
  
  // Component-specific debug flags
  logContainerRendering: false,         // Container visual updates and rendering pipeline
  logScrewPlacement: false,             // Screw positioning algorithms and collision checks
  logPhysicsStateChanges: false,        // Physics body/constraint state transitions
  logShapeDestruction: false,           // Shape cleanup and disposal operations
  logPhysicsUpdates: false,             // Physics world step updates (high frequency)
  logShapeCreation: false,              // Shape factory and generation processes
  logCapsuleGeneration: false,          // Complex capsule shape generation specifically
  logShapeDebug: false,                 // General shape system operations
  logScrewDebug: false,                 // Screw system operations and state changes
  logEventFlow: false,                  // Event bus emission and handling
  logPhysicsDebug: false,               // Physics engine integration details
  logLayerDebug: false,                 // Layer visibility and management
  
  // Specific screw system debug flags
  logScrewRemovabilityUpdates: false,   // Screw accessibility calculations (medium frequency)
  logScrewLayerVisibility: false,       // Layer-based screw visibility checks
  logProgressTracking: false,           // Progress bar and completion tracking
  logPolygonRounding: false,            // Geometric corner rounding algorithms
  
  // Shape rendering debug flags
  logShapePathCreation: false,          // Path2D creation and optimization
  
  // System operation debug flags
  logLayerOperations: false,            // Layer creation, clearing, and transitions
  logScrewPositionUpdates: false,       // ⚠️ VERY SPAMMY: Real-time position updates (use with caution)
  logBoundsOperations: false,           // Bounds calculations and canvas resizing
  logShapePositioning: false,           // Strategic shape placement algorithms
  logSystemLifecycle: false,            // System initialization and cleanup
  logCollisionDetection: false,         // Hit testing and collision algorithms
  logDebugUtilities: false,             // Debug helpers and state dumps
  logLevelCompletionEffects: true,      // Level completion burst and sparkle effects (enabled for debugging)
  
  // Debug throttling settings (milliseconds) - prevents log spam
  debugThrottleMs: 2000,                // General debug log throttling (2 seconds)
  layerVisibilityThrottleMs: 5000,      // Layer visibility debug throttling (5 seconds)
  screwPositionThrottleMs: 1000,        // Screw position update throttling (1 second)
  
  // Editor-specific debug settings
  editor: {
    showPerformance: false,
    logEvents: false,
    maxHistorySize: 1000,
  },
} as const;

// =============================================================================
// ANIMATION CONSTANTS
// =============================================================================

export const ANIMATION_CONSTANTS = {
  defaultDuration: 300,
  easing: {
    linear: 'linear',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    // Custom easing constants (from MathUtils)
    backConstant: 1.70158,
  },
  timing: {
    fast: 150,
    normal: 300,
    slow: 600,
  },
  // Screw rotation speeds (radians per second)
  screwRotation: {
    collection: Math.PI * 2,  // 1 full rotation per second (was 2)
    transfer: Math.PI * 3,    // 1.5 full rotations per second (was 3)
  },
  // Screw animation durations
  collection: {
    duration: 800,       // Collection animation duration in ms
  },
  transfer: {
    duration: 600,       // Transfer animation duration in ms
  },
  shake: {
    duration: 300,       // Shake animation duration in ms
    frequency: 8,        // Number of oscillations
    amplitude: 3,        // Maximum shake distance in pixels
  },
  // Container animations
  container: {
    fadeDuration: 500,   // Container fade in/out duration in ms
  },
  // Level completion effects
  levelCompletion: {
    burstDuration: 5500, // Level completion burst effect duration in ms - ensures particles fade out before 6s overlay
  },
} as const;

// =============================================================================
// EDITOR EVENTS (moved from EditorConstants)
// =============================================================================

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

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate total layers for a given level
 * Levels 1-3: 10 layers
 * Levels 4-6: 11 layers  
 * Levels 7-9: 12 layers
 * And so on... (+1 layer every 3 levels)
 */
export function getTotalLayersForLevel(level: number): number {
  const baseLayers = 10;
  const additionalLayers = Math.floor((level - 1) / 3);
  return baseLayers + additionalLayers;
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type PhysicsConstants = typeof PHYSICS_CONSTANTS;
export type GameConfiguration = typeof GAME_CONFIG;
export type EditorConfiguration = typeof EDITOR_CONFIG;
export type ColorPalettes = typeof COLOR_PALETTES;
export type UIConstants = typeof UI_CONSTANTS;
export type DebugConfiguration = typeof DEBUG_CONFIG;
export type EditorEventNames = typeof EDITOR_EVENTS;

// =============================================================================
// LEGACY COMPATIBILITY EXPORTS
// =============================================================================

// For backward compatibility with existing imports
export const SHARED_PHYSICS_CONSTANTS = PHYSICS_CONSTANTS;
export const SHARED_COLORS = COLOR_PALETTES;
export const EDITOR_CONSTANTS = EDITOR_CONFIG;