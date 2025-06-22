/**
 * ContainerPlanner - Pure function approach to container planning
 * Calculates optimal container configuration from screw inventory
 */

import { ScrewColor } from '@/types/game';
import { GAME_CONFIG, DEBUG_CONFIG } from '@/shared/utils/Constants';

export interface ContainerPlan {
  containers: Array<{
    color: ScrewColor;
    holes: number;
  }>;
  totalContainers: number;
}

export class ContainerPlanner {
  /**
   * Calculates optimal container configuration using a greedy algorithm.
   * 
   * Strategy:
   * - Prioritizes colors with most screws (reduces total container count)
   * - Limits to 3 holes per container for visual clarity and game balance
   * - Ensures at least 1 hole for colors with any screws
   * - Uses total screw count for hole sizing to prevent under-sizing
   * 
   * Design rationale: Fewer containers with appropriate capacity
   * provides better gameplay flow than many single-hole containers
   * 
   * Pure function - no side effects, easy to test and reason about
   */
  static calculateOptimalContainers(screwInventory: Map<string, number>): ContainerPlan {
    // Filter colors that actually have screws
    const availableColors = Array.from(screwInventory.entries())
      .filter(([, count]) => count > 0)
      .sort(([, countA], [, countB]) => countB - countA) // Most screws first (greedy approach)
      .slice(0, GAME_CONFIG.containers.count); // Max 4 containers (UI layout constraint)

    if (DEBUG_CONFIG.logScrewDebug && availableColors.length > 0) {
      console.log('📦 Container planning - Visible screw colors after greedy sorting:');
      availableColors.forEach(([color, count], index) => {
        console.log(`  ${index + 1}. ${color}: ${count} screws`);
      });
      console.log(`📦 Total colors considered: ${availableColors.length} (max ${GAME_CONFIG.containers.count})`);
    }

    const containers = availableColors.map(([color, count]) => ({
      color: color as ScrewColor,
      holes: Math.min(3, Math.max(1, count)) // 1-3 holes: min 1 for any color, max 3 for visual clarity
    }));

    return {
      containers,
      totalContainers: containers.length
    };
  }

  /**
   * Check if two container plans are equivalent
   * Used to avoid unnecessary container updates
   */
  static plansEqual(planA: ContainerPlan, planB: ContainerPlan): boolean {
    if (planA.totalContainers !== planB.totalContainers) {
      return false;
    }

    for (let i = 0; i < planA.containers.length; i++) {
      const containerA = planA.containers[i];
      const containerB = planB.containers[i];
      
      if (containerA.color !== containerB.color || containerA.holes !== containerB.holes) {
        return false;
      }
    }

    return true;
  }
}