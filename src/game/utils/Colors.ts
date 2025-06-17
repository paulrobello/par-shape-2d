import { ScrewColor } from '@/types/game';
import { SCREW_COLORS } from '@/shared/utils/Constants';

export function getAllScrewColors(): ScrewColor[] {
  return Object.keys(SCREW_COLORS) as ScrewColor[];
}

export function getRandomScrewColor(preferredColors?: ScrewColor[]): ScrewColor {
  // If preferred colors are provided and not empty, use them with higher probability
  if (preferredColors && preferredColors.length > 0) {
    return preferredColors[Math.floor(Math.random() * preferredColors.length)];
  }
  
  // Fallback to any random color
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