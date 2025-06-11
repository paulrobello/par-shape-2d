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
  containers: Container[]
): Vector2 {
  const containerWidth = UI_CONSTANTS.containers.width;
  const containerHeight = UI_CONSTANTS.containers.height;
  
  // Get the actual container to use its position and maxHoles
  const container = containers[containerIndex];
  if (!container) {
    console.warn(`Container ${containerIndex} not found`);
    return { x: 0, y: 0 };
  }
  
  const holeCount = container.maxHoles;
  
  // Convert container center position to top-left corner, then calculate hole positions
  // This EXACTLY matches how GameRenderManager.renderContainers() calculates hole positions
  const containerLeft = container.position.x - containerWidth / 2;
  const containerTop = container.position.y - containerHeight / 2;
  
  const holeSpacing = (containerWidth - 8) / (holeCount + 1); // Account for 4px padding on each side
  const holeX = containerLeft + 4 + holeSpacing * (holeIndex + 1); // Use container's left edge + padding + spacing
  const holeY = containerTop + containerHeight / 2 + 5; // Use container's top edge + half height + 5px offset
  
  return { x: holeX, y: holeY };
}

/**
 * Calculate holding hole positions
 */
export function calculateHoldingHolePositions(
  virtualGameWidth: number
): Vector2[] {
  const holeCount = GAME_CONFIG.holdingHoles.count;
  const holeRadius = UI_CONSTANTS.holdingHoles.radius;
  const spacing = UI_CONSTANTS.holdingHoles.spacing;
  const y = UI_CONSTANTS.holdingHoles.startY;
  
  // Calculate positions matching GameManager.renderHoldingHoles()
  const totalWidth = (holeCount * holeRadius * 2) + ((holeCount - 1) * spacing);
  const startX = (virtualGameWidth - totalWidth) / 2;
  
  const positions: Vector2[] = [];
  for (let i = 0; i < holeCount; i++) {
    positions.push({
      x: startX + (i * (holeRadius * 2 + spacing)) + holeRadius,
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
  virtualGameWidth: number
): { type: 'container' | 'holding_hole'; position: Vector2; id: string; holeIndex?: number } | null {
  // First, collect all matching containers with available space
  const matchingContainers: { container: Container; index: number; availableHoles: number }[] = [];
  
  for (let i = 0; i < containers.length; i++) {
    const container = containers[i];
    // Skip full containers or containers without proper structure
    if (container.isFull || !container.holes || !container.reservedHoles) {
      continue;
    }
    
    if (container.color === screw.color) {
      // Count available holes in this container
      let availableHoles = 0;
      for (let holeIndex = 0; holeIndex < container.holes.length; holeIndex++) {
        if (!container.holes[holeIndex] && !container.reservedHoles[holeIndex]) {
          availableHoles++;
        }
      }
      
      if (availableHoles > 0) {
        matchingContainers.push({ container, index: i, availableHoles });
      }
    }
  }
  
  // If we found matching containers, choose the one with fewest available holes
  if (matchingContainers.length > 0) {
    // Sort by available holes (ascending) to get container with fewest holes first
    matchingContainers.sort((a, b) => a.availableHoles - b.availableHoles);
    
    const chosen = matchingContainers[0];
    const container = chosen.container;
    const containerIndex = chosen.index;
    
    // Find first available hole in the chosen container
    for (let holeIndex = 0; holeIndex < container.holes.length; holeIndex++) {
      if (!container.holes[holeIndex] && !container.reservedHoles[holeIndex]) {
        return {
          type: 'container',
          position: calculateContainerHolePosition(containerIndex, holeIndex, virtualGameWidth, containers),
          id: container.id,
          holeIndex
        };
      }
    }
  }
  
  // If no matching container, find first available holding hole
  const holdingPositions = calculateHoldingHolePositions(virtualGameWidth);
  for (let i = 0; i < holdingHoles.length; i++) {
    const hole = holdingHoles[i];
    // Check that hole is not occupied and not reserved
    if (!hole.screwId && !hole.reservedBy) {
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