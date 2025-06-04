/**
 * Centralized color theme management for rendering
 * Provides consistent color schemes across game and editor
 */

import { COLOR_PALETTES, SCREW_COLORS } from '@/shared/utils/Constants';

export interface ShapeColorScheme {
  fill: string;
  stroke: string;
  highlight: string;
  selected: string;
  preview: string;
  alpha: number;
}

export interface ScrewColorScheme {
  border: string;
  highlight: string;
  shadow: string;
  cross: string;
  colors: typeof SCREW_COLORS;
}

export interface DebugColorScheme {
  bounds: string;
  physics: string;
  constraint: string;
  error: string;
  warning: string;
  info: string;
  grid: string;
  text: string;
  background: string;
}

export interface UIColorScheme {
  primary: string;
  secondary: string;
  success: string;
  danger: string;
  warning: string;
  info: string;
  light: string;
  dark: string;
  border: string;
  background: string;
  text: string;
}

export interface ColorTheme {
  name: string;
  shapes: ShapeColorScheme;
  screws: ScrewColorScheme;
  debug: DebugColorScheme;
  ui: UIColorScheme;
}

/**
 * Game color theme - physics-accurate rendering with subtle tinting
 */
export const GAME_THEME: ColorTheme = {
  name: 'game',
  shapes: {
    fill: 'transparent',
    stroke: COLOR_PALETTES.ui.dark,
    highlight: COLOR_PALETTES.ui.primary,
    selected: COLOR_PALETTES.ui.warning,
    preview: COLOR_PALETTES.editor.shape,
    alpha: 0.7,
  },
  screws: {
    border: '#2C3E50',
    highlight: '#ECF0F1',
    shadow: '#34495E',
    cross: '#2C3E50',
    colors: SCREW_COLORS,
  },
  debug: {
    bounds: COLOR_PALETTES.debug.bounds,
    physics: COLOR_PALETTES.debug.physics,
    constraint: COLOR_PALETTES.debug.constraint,
    error: COLOR_PALETTES.debug.error,
    warning: COLOR_PALETTES.ui.warning,
    info: COLOR_PALETTES.ui.info,
    grid: 'rgba(100, 100, 100, 0.3)',
    text: COLOR_PALETTES.ui.light,
    background: 'rgba(0, 0, 0, 0.7)',
  },
  ui: {
    primary: COLOR_PALETTES.ui.primary,
    secondary: COLOR_PALETTES.ui.secondary,
    success: COLOR_PALETTES.ui.success,
    danger: COLOR_PALETTES.ui.danger,
    warning: COLOR_PALETTES.ui.warning,
    info: COLOR_PALETTES.ui.info,
    light: COLOR_PALETTES.ui.light,
    dark: COLOR_PALETTES.ui.dark,
    border: COLOR_PALETTES.ui.border,
    background: '#1A252F',
    text: COLOR_PALETTES.ui.light,
  },
};

/**
 * Editor color theme - clean, modern interface with preview emphasis
 */
export const EDITOR_THEME: ColorTheme = {
  name: 'editor',
  shapes: {
    fill: 'rgba(0, 123, 255, 0.1)',
    stroke: COLOR_PALETTES.editor.shape,
    highlight: COLOR_PALETTES.ui.primary,
    selected: COLOR_PALETTES.ui.success,
    preview: COLOR_PALETTES.editor.shape,
    alpha: 0.8,
  },
  screws: {
    border: COLOR_PALETTES.editor.shape,
    highlight: COLOR_PALETTES.ui.light,
    shadow: COLOR_PALETTES.ui.secondary,
    cross: COLOR_PALETTES.editor.shape,
    colors: SCREW_COLORS,
  },
  debug: {
    bounds: COLOR_PALETTES.debug.bounds,
    physics: COLOR_PALETTES.debug.physics,
    constraint: COLOR_PALETTES.debug.constraint,
    error: COLOR_PALETTES.debug.error,
    warning: COLOR_PALETTES.ui.warning,
    info: COLOR_PALETTES.ui.info,
    grid: 'rgba(100, 100, 100, 0.6)',
    text: COLOR_PALETTES.ui.dark,
    background: 'rgba(255, 255, 255, 0.9)',
  },
  ui: {
    primary: COLOR_PALETTES.ui.primary,
    secondary: COLOR_PALETTES.ui.secondary,
    success: COLOR_PALETTES.ui.success,
    danger: COLOR_PALETTES.ui.danger,
    warning: COLOR_PALETTES.ui.warning,
    info: COLOR_PALETTES.ui.info,
    light: COLOR_PALETTES.ui.light,
    dark: COLOR_PALETTES.ui.dark,
    border: COLOR_PALETTES.ui.border,
    background: COLOR_PALETTES.ui.light,
    text: COLOR_PALETTES.ui.dark,
  },
};

/**
 * Debug color theme - high contrast for debugging
 */
export const DEBUG_THEME: ColorTheme = {
  name: 'debug',
  shapes: {
    fill: 'rgba(255, 0, 255, 0.2)',
    stroke: COLOR_PALETTES.debug.physics,
    highlight: COLOR_PALETTES.debug.error,
    selected: COLOR_PALETTES.ui.warning,
    preview: COLOR_PALETTES.debug.bounds,
    alpha: 0.6,
  },
  screws: {
    border: COLOR_PALETTES.debug.error,
    highlight: COLOR_PALETTES.ui.warning,
    shadow: COLOR_PALETTES.debug.physics,
    cross: COLOR_PALETTES.debug.error,
    colors: SCREW_COLORS,
  },
  debug: {
    bounds: COLOR_PALETTES.debug.bounds,
    physics: COLOR_PALETTES.debug.physics,
    constraint: COLOR_PALETTES.debug.constraint,
    error: COLOR_PALETTES.debug.error,
    warning: COLOR_PALETTES.ui.warning,
    info: COLOR_PALETTES.ui.info,
    grid: 'rgba(255, 255, 0, 0.5)',
    text: COLOR_PALETTES.ui.light,
    background: 'rgba(0, 0, 0, 0.8)',
  },
  ui: {
    primary: COLOR_PALETTES.debug.physics,
    secondary: COLOR_PALETTES.debug.bounds,
    success: COLOR_PALETTES.ui.success,
    danger: COLOR_PALETTES.debug.error,
    warning: COLOR_PALETTES.ui.warning,
    info: COLOR_PALETTES.debug.bounds,
    light: COLOR_PALETTES.ui.light,
    dark: COLOR_PALETTES.ui.dark,
    border: COLOR_PALETTES.debug.physics,
    background: '#000000',
    text: COLOR_PALETTES.ui.light,
  },
};

/**
 * Get color theme by name
 */
export function getColorTheme(name: string): ColorTheme {
  switch (name) {
    case 'game':
      return GAME_THEME;
    case 'editor':
      return EDITOR_THEME;
    case 'debug':
      return DEBUG_THEME;
    default:
      return GAME_THEME;
  }
}

/**
 * Get appropriate theme for environment
 */
export function getThemeForEnvironment(environment: 'game' | 'editor', debugMode: boolean = false): ColorTheme {
  if (debugMode) {
    return DEBUG_THEME;
  }
  return environment === 'game' ? GAME_THEME : EDITOR_THEME;
}

/**
 * Color utility functions
 */
export function hexToRgba(hex: string, alpha: number = 1): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return hex;
  }
  
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Darken a color by a percentage
 */
export function darkenColor(color: string, percentage: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
  if (!result) {
    return color;
  }
  
  const r = Math.max(0, parseInt(result[1], 16) * (1 - percentage));
  const g = Math.max(0, parseInt(result[2], 16) * (1 - percentage));
  const b = Math.max(0, parseInt(result[3], 16) * (1 - percentage));
  
  return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
}

/**
 * Lighten a color by a percentage
 */
export function lightenColor(color: string, percentage: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
  if (!result) {
    return color;
  }
  
  const r = Math.min(255, parseInt(result[1], 16) + (255 - parseInt(result[1], 16)) * percentage);
  const g = Math.min(255, parseInt(result[2], 16) + (255 - parseInt(result[2], 16)) * percentage);
  const b = Math.min(255, parseInt(result[3], 16) + (255 - parseInt(result[3], 16)) * percentage);
  
  return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
}