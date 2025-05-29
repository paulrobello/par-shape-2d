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

export const CONTAINER_COLORS: Record<ScrewColor, string> = {
  pink: '#8B4B87',
  red: '#8B2635',
  green: '#1F5F1F',
  blue: '#1C5DA0',
  lightBlue: '#4A80A0',
  yellow: '#B8860B',
  purple: '#5D4E75',
  orange: '#B8632F',
  brown: '#654321',
} as const;

export const DEBUG_COLOR_KEYS: Record<string, ScrewColor> = {
  '1': 'red',
  '2': 'green', 
  '3': 'blue',
  '4': 'yellow',
  '5': 'orange',
  '6': 'purple',
  '7': 'pink',
  '8': 'lightBlue',
  '9': 'brown',
} as const;

export const UI_CONSTANTS = {
  header: {
    height: 80,
  },
  containers: {
    height: 70,
    spacing: 16,
    borderRadius: 20,
  },
  holdingHoles: {
    height: 35,
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

export const ANIMATION_CONSTANTS = {
  screwCollection: {
    duration: 800, // ms
    easing: 'easeInOutCubic',
  },
  containerFall: {
    duration: 600,
    easing: 'easeInBack',
  },
  shapeDestroy: {
    duration: 400,
    easing: 'easeOutQuart',
  },
} as const;