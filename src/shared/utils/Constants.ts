/**
 * Shared constants used by both game and editor systems
 */

// Re-export physics constants for compatibility
export const PHYSICS_CONSTANTS = {
  shape: {
    friction: 0.1,
    frictionAir: 0.005,
    restitution: 0,
    density: 5,
  },
  constraint: {
    stiffness: 1,
    damping: 0.01,
  },
  world: {
    bounds: { x: 0, y: 0, width: 800, height: 600 },
  },
} as const;

// Game configuration
export const GAME_CONFIG = {
  physics: {
    gravity: { x: 0, y: 1, scale: 0.001 },
    timestep: 1000 / 60, // 60 FPS
  },
} as const;

// Debug configuration
export const DEBUG_CONFIG = {
  logPhysicsDebug: false,
  logPhysicsUpdates: false,
} as const;

// Physics constants shared between game and editor
export const SHARED_PHYSICS_CONSTANTS = {
  shape: {
    friction: 0.1,
    frictionAir: 0.005,
    restitution: 0,
    density: 5,
  },
  constraint: {
    stiffness: 1,
    damping: 0.01,
  },
} as const;

// Screw placement constants
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

// Shape validation constants
export const SHAPE_VALIDATION_CONSTANTS = {
  minDimensions: {
    width: 10,
    height: 10,
    radius: 5,
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
} as const;

// Color constants
export const SHARED_COLORS = {
  editor: {
    shape: '#007bff',
    shapeStroke: '#0056b3',
    screw: 'red',
    indicator: '#888888',
    indicatorFill: 'rgba(136, 136, 136, 0.3)',
    debug: '#ff0000',
  },
  game: {
    // Game-specific colors would be imported from game constants
  },
} as const;