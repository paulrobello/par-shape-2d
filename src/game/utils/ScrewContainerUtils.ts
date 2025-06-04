/**
 * Static utility functions for screw container and holding hole calculations
 * Extracted from ScrewManager to improve modularity
 */

import { Vector2, ScrewColor, Container, HoldingHole } from '@/types/game';
import { Screw } from '@/game/entities/Screw';
import { UI_CONSTANTS, GAME_CONFIG } from '@/shared/utils/Constants';

/**
 * Calculate the position of a specific hole within a container
 */
export function calculateContainerHolePosition(
  containerIndex: number, 
  holeIndex: number,
  virtualGameWidth: number,
  virtualGameHeight: number
): Vector2 {
  const containerWidth = UI_CONSTANTS.containers.width;
  const containerHeight = UI_CONSTANTS.containers.height;
  const containerSpacing = UI_CONSTANTS.containers.spacing;
  const holeCount = UI_CONSTANTS.containers.hole.count;
  
  // Calculate container position
  const totalContainersWidth = 4 * containerWidth + 3 * containerSpacing;
  const startX = (virtualGameWidth - totalContainersWidth) / 2;
  const containerX = startX + containerIndex * (containerWidth + containerSpacing);
  const containerY = virtualGameHeight - containerHeight / 2 - 20;
  
  // Calculate hole position within container (same formula as other systems)
  const holeSpacing = containerWidth / (holeCount + 1);
  const holeX = containerX - containerWidth / 2 + (holeIndex + 1) * holeSpacing;
  const holeY = containerY;
  
  return { x: holeX, y: holeY };
}

/**
 * Calculate holding hole positions
 */
export function calculateHoldingHolePositions(
  virtualGameWidth: number,
  virtualGameHeight: number
): Vector2[] {
  const holeCount = GAME_CONFIG.holdingHoles.count;
  const holeSpacing = 80;
  const totalWidth = (holeCount - 1) * holeSpacing;
  const startX = (virtualGameWidth - totalWidth) / 2;
  const y = virtualGameHeight - 140;
  
  const positions: Vector2[] = [];
  for (let i = 0; i < holeCount; i++) {
    positions.push({
      x: startX + i * holeSpacing,
      y: y
    });
  }
  
  return positions;
}

/**
 * Find the best destination for a screw (container or holding hole)
 */
export function findScrewDestination(
  screw: Screw,
  containers: Container[],
  holdingHoles: HoldingHole[],
  virtualGameWidth: number,
  virtualGameHeight: number
): { type: 'container' | 'holding_hole'; position: Vector2; id: string; holeIndex?: number } | null {
  // First, try to find a matching container with space
  for (let i = 0; i < containers.length; i++) {
    const container = containers[i];
    if (container.color === screw.color) {
      // Find first available hole in this container
      for (let holeIndex = 0; holeIndex < container.holes.length; holeIndex++) {
        if (!container.holes[holeIndex]) {
          return {
            type: 'container',
            position: calculateContainerHolePosition(i, holeIndex, virtualGameWidth, virtualGameHeight),
            id: container.id,
            holeIndex
          };
        }
      }
    }
  }
  
  // If no matching container, find first available holding hole
  const holdingPositions = calculateHoldingHolePositions(virtualGameWidth, virtualGameHeight);
  for (let i = 0; i < holdingHoles.length; i++) {
    const hole = holdingHoles[i];
    if (!hole.screwId) {
      return {
        type: 'holding_hole',
        position: holdingPositions[i],
        id: hole.id,
        holeIndex: i
      };
    }
  }
  
  return null; // No space available anywhere
}

/**
 * Determine destination type based on screw's current position
 */
export function determineDestinationType(
  screw: Screw,
  containers: Container[],
  holdingHoles: HoldingHole[],
  virtualGameWidth: number,
  virtualGameHeight: number
): 'container' | 'holding_hole' {
  const screwPos = screw.position;
  
  // Check if position is in container area
  const containerY = virtualGameHeight - UI_CONSTANTS.containers.height / 2 - 20;
  const containerTolerance = 30;
  
  if (Math.abs(screwPos.y - containerY) < containerTolerance) {
    return 'container';
  }
  
  // Check if position is in holding hole area
  const holdingY = virtualGameHeight - 140;
  const holdingTolerance = 30;
  
  if (Math.abs(screwPos.y - holdingY) < holdingTolerance) {
    return 'holding_hole';
  }
  
  // Default fallback - check which is closer
  const containerDistance = Math.abs(screwPos.y - containerY);
  const holdingDistance = Math.abs(screwPos.y - holdingY);
  
  return containerDistance < holdingDistance ? 'container' : 'holding_hole';
}

/**
 * Check if a screw can be transferred to a container based on color matching
 */
export function canTransferToContainer(
  screw: Screw,
  containers: Container[]
): { canTransfer: boolean; containerIndex: number; holeIndex: number } {
  for (let i = 0; i < containers.length; i++) {
    const container = containers[i];
    if (container.color === screw.color) {
      // Find first available hole
      for (let holeIndex = 0; holeIndex < container.holes.length; holeIndex++) {
        if (!container.holes[holeIndex]) {
          return { canTransfer: true, containerIndex: i, holeIndex };
        }
      }
    }
  }
  
  return { canTransfer: false, containerIndex: -1, holeIndex: -1 };
}

/**
 * Get all screw colors currently in holding holes
 */
export function getScrewColorsInHoldingHoles(
  screws: Map<string, Screw>,
  holdingHoles: HoldingHole[]
): ScrewColor[] {
  const colors: ScrewColor[] = [];
  
  for (const hole of holdingHoles) {
    if (hole.screwId) {
      const screw = screws.get(hole.screwId);
      if (screw) {
        colors.push(screw.color);
      }
    }
  }
  
  return colors;
}

/**
 * Get all unique screw colors from active screws
 */
export function getAllActiveScrewColors(screws: Map<string, Screw>): ScrewColor[] {
  const colorSet = new Set<ScrewColor>();
  
  for (const screw of screws.values()) {
    if (!screw.isCollected) {
      colorSet.add(screw.color);
    }
  }
  
  return Array.from(colorSet);
}