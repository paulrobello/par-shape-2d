/**
 * ContainerPlanner - Pure function approach to container planning
 * Calculates optimal container configuration from screw inventory
 */

import { ScrewColor } from '@/types/game';
import { GAME_CONFIG } from '@/shared/utils/Constants';

export interface ContainerPlan {
  containers: Array<{
    color: ScrewColor;
    holes: number;
  }>;
  totalContainers: number;
}

export class ContainerPlanner {
  /**
   * Calculate optimal container configuration from screw inventory
   * Pure function - no side effects, easy to test and reason about
   */
  static calculateOptimalContainers(screwInventory: Map<string, number>): ContainerPlan {
    // Filter colors that actually have screws
    const availableColors = Array.from(screwInventory.entries())
      .filter(([, count]) => count > 0)
      .sort(([, countA], [, countB]) => countB - countA) // Most screws first
      .slice(0, GAME_CONFIG.containers.count); // Max containers limit

    const containers = availableColors.map(([color, count]) => ({
      color: color as ScrewColor,
      holes: Math.min(3, Math.max(1, count)) // 1-3 holes based on screw count
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