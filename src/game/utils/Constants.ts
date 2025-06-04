import { GameConfig, ScrewColor } from '@/types/game';

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
    maxHoles: 3,
  },
  holdingHoles: {
    count: 5,
  },
  physics: {
    gravity: { x: 0, y: 0.8 },
    timestep: 1000 / 60, // 60fps
  },
};

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
  '#FFE6E6', // Light red
  '#E6FFE6', // Light green  
  '#E6F3FF', // Light blue
  '#FFFFE6', // Light yellow
  '#F0E6FF', // Light purple
] as const;

export const LAYOUT_CONSTANTS = {
  shapeArea: {
    startY: 200, // Y position where shape area begins (below containers and holding holes)
    backgroundColor: '#1A252F', // Darker background for shape area
    borderColor: '#34495E', // Subtle border color
  },
} as const;

export const UI_CONSTANTS = {
  header: {
    height: 60,
  },
  containers: {
    width: 80,
    height: 40,
    spacing: 10,
    borderRadius: 8,
    startY: 100,
    hole: {
      radius: 8,
      count: 3,
    },
  },
  holdingHoles: {
    radius: 8, // Same as container hole radius
    spacing: 20, // Reduced spacing for smaller holes
    startY: 160,
    innerRadius: 6, // radius - 2 for inner hole
  },
  screws: {
    radius: 12,
    borderWidth: 2,
    highlight: {
      offsetX: 2,
      offsetY: 2,
      sizeRatio: 0.4, // radius * this = highlight size
    },
    cross: {
      sizeRatio: 0.6, // radius * this = cross size
      lineWidth: 2,
    },
    indicators: {
      removableRadiusOffset: 3, // radius + this = removable indicator radius
      blockedRadiusOffset: 2, // radius + this = blocked indicator radius
    },
  },
  shapes: {
    borderWidth: 3,
    alpha: 0.7,
  },
} as const;

export const PHYSICS_CONSTANTS = {
  world: {
    bounds: {
      x: 0,
      y: 0,
      width: GAME_CONFIG.canvas.width,
      height: GAME_CONFIG.canvas.height * 2, // Extended for multiple layers
    },
  },
  shape: {
    friction: 0.1, // Reduced friction for more sliding
    frictionAir: 0.005, // Reduced air resistance
    restitution: 0, // Not bouncy
    density: 5, // Slightly heavier for better falling motion
  },
  constraint: {
    stiffness: 1,
    damping: 0.01, // Much reduced damping for more swinging motion
  },
} as const;

export const DEBUG_CONFIG = {
  // Set to true to enable verbose debug logging
  enableVerboseLogging: false,
  // Set to true to log container rendering details
  logContainerRendering: false,
  // Set to true to log screw placement details
  logScrewPlacement: false,
  // Set to true to log physics state changes
  logPhysicsStateChanges: false,
  // Set to true to log shape destruction details
  logShapeDestruction: false,
  // Set to true to log physics updates (🔧 Physics Update: messages)
  logPhysicsUpdates: false,
  // Set to true to debug shape creation issues
  logShapeCreation: false,
  // Set to true to log shape-related debug messages
  logShapeDebug: false,
  // Set to true to log screw-related debug messages
  logScrewDebug: false,
  // Set to true to log EventFlow validation messages
  logEventFlow: false,
  // Set to true to log physics-related debug messages
  logPhysicsDebug: false,
  // Set to true to log layer-related debug messages
  logLayerDebug: false,
} as const;

// SHAPE_CONFIG.enabledShapes removed - shapes are now controlled by the "enabled" field in individual JSON files

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
