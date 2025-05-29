import { ScrewColor } from '@/types/game';
import { SCREW_COLORS } from './Constants';

export function getAllScrewColors(): ScrewColor[] {
  return Object.keys(SCREW_COLORS) as ScrewColor[];
}

export function getRandomScrewColor(): ScrewColor {
  const colors = getAllScrewColors();
  return colors[Math.floor(Math.random() * colors.length)];
}

export function getRandomScrewColors(count: number, exclude: ScrewColor[] = []): ScrewColor[] {
  const availableColors = getAllScrewColors().filter(color => !exclude.includes(color));
  const shuffled = [...availableColors].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, availableColors.length));
}

export function getRandomColorsFromList(colors: ScrewColor[], count: number, exclude: ScrewColor[] = []): ScrewColor[] {
  const availableColors = colors.filter(color => !exclude.includes(color));
  const shuffled = [...availableColors].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, availableColors.length));
}

export function hexToRgba(hex: string, alpha: number = 1): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function darkenColor(hex: string, percent: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  const factor = 1 - percent / 100;
  const newR = Math.round(r * factor);
  const newG = Math.round(g * factor);
  const newB = Math.round(b * factor);
  
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

export function lightenColor(hex: string, percent: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  const factor = percent / 100;
  const newR = Math.round(r + (255 - r) * factor);
  const newG = Math.round(g + (255 - g) * factor);
  const newB = Math.round(b + (255 - b) * factor);
  
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}