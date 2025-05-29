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
    minPerLayer: 3,
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

export const UI_CONSTANTS = {
  header: {
    height: 60,
  },
  containers: {
    width: 120,
    height: 50,
    spacing: 16,
    borderRadius: 20,
  },
  holdingHoles: {
    height: 30,
    spacing: 24,
    radius: 4, // Smaller holes for better proportion
  },
  screws: {
    radius: 12,
    borderWidth: 2,
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
    friction: 0.1,
    frictionAir: 0.02,
    restitution: 0.3,
    density: 0.001,
  },
  constraint: {
    stiffness: 1,
    damping: 0.1,
  },
} as const;
