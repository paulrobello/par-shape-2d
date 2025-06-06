/**
 * Container Strategy Manager
 * Implements smart container replacement logic for perfect balance achievement
 */

import { BaseSystem } from '../core/BaseSystem';
import { 
  ContainerReplacementPlan, 
  ContainerReplacement,
  PerfectBalanceStats,
  PerfectBalanceStatus
} from '../../types/precomputed';
import { Container, HoldingHole } from '../../types/game';
import { getAllScrewColors } from './Colors';
import { UI_CONSTANTS, GAME_CONFIG } from '../../shared/utils/Constants';

/**
 * Manages container replacement strategy for perfect level completion
 */
export class ContainerStrategyManager extends BaseSystem {
  private readonly CONTAINER_CAPACITY = UI_CONSTANTS.containers.hole.count; // 3 screws per container
  private readonly HOLDING_HOLE_COUNT = GAME_CONFIG.holdingHoles.count; // 5 holding holes
  
  private currentPlan: ContainerReplacementPlan | null = null;
  private screwsCollected = 0;
  private nextReplacementIndex = 0;
  private activeContainers: Container[] = [];
  private holdingHoles: HoldingHole[] = [];

  constructor() {
    super('ContainerStrategyManager');
  }

  async onInitialize(): Promise<void> {
    // TODO: Set up event handlers for container strategy management
  }

  /**
   * Initialize with a container replacement plan
   */
  setPlan(plan: ContainerReplacementPlan): void {
    this.currentPlan = plan;
    this.nextReplacementIndex = 0;
    this.screwsCollected = 0;
    
    this.emit({
      type: 'container:strategy:initialized',
      timestamp: Date.now(),
      plan: plan,
      totalReplacements: plan.replacements.length
    });
  }

  /**
   * Update container state
   */
  updateContainerState(containers: Container[], holdingHoles: HoldingHole[]): void {
    this.activeContainers = [...containers];
    this.holdingHoles = [...holdingHoles];
  }

  /**
   * Check if container should be replaced based on perfect balance strategy
   */
  shouldReplaceContainer(
    container: Container, 
    remainingScrews: Map<string, number>
  ): boolean {
    if (!this.currentPlan) return false;

    // Check if we have a planned replacement at this screw count
    const nextReplacement = this.getNextPlannedReplacement();
    if (nextReplacement && this.screwsCollected >= nextReplacement.atScrewCount) {
      return true;
    }

    // Strategic replacement logic: prevent holding hole overflow
    const containerColor = container.color;
    const remainingOfThisColor = remainingScrews.get(containerColor) || 0;
    const currentScrewsInContainer = container.holes.filter(hole => hole !== null).length;
    const availableHolesInContainer = this.CONTAINER_CAPACITY - currentScrewsInContainer;
    const availableHoldingHoles = this.getAvailableHoldingHoles();

    // Don't replace if container can hold remaining screws of its color
    if (remainingOfThisColor <= availableHolesInContainer) {
      return false;
    }

    // Replace if overflow would exceed holding hole capacity
    const totalAvailableSpace = availableHolesInContainer + availableHoldingHoles;
    return remainingOfThisColor > totalAvailableSpace;
  }

  /**
   * Execute planned container replacement
   */
  executeReplacementPlan(plan: ContainerReplacementPlan): void {
    if (!this.currentPlan) {
      this.currentPlan = plan;
    }

    const replacement = this.getNextPlannedReplacement();
    if (!replacement) return;

    // Execute the replacement
    this.executeReplacement(replacement);
    this.nextReplacementIndex++;

    this.emit({
      type: 'container:replacement:executed',
      timestamp: Date.now(),
      containerId: `container_${replacement.atScrewCount}`,
      newColors: replacement.newColors
    });
  }

  /**
   * Calculate optimal colors for new containers
   */
  calculateOptimalColors(remainingScrews: Map<string, number>): string[] {
    // Sort colors by remaining count (descending)
    const sortedColors = Array.from(remainingScrews.entries())
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => b - a)
      .map(([color]) => color);

    // Take top 4 colors, or all if fewer than 4
    const selectedColors = sortedColors.slice(0, 4);
    
    // Fill remaining slots with random colors if needed
    while (selectedColors.length < 4) {
      const availableColors = getAllScrewColors();
      const randomColor = availableColors[Math.floor(Math.random() * availableColors.length)];
      if (!selectedColors.includes(randomColor)) {
        selectedColors.push(randomColor);
      }
    }

    return selectedColors;
  }

  /**
   * Validate that perfect ending will be achieved
   */
  validatePerfectEnding(
    totalScrews: number,
    screwsCollected: number,
    containers: Container[],
    holdingHoles: HoldingHole[]
  ): boolean {
    if (!this.currentPlan) return false;

    const remainingScrews = totalScrews - screwsCollected;
    
    // Calculate total available space
    const containerSpace = containers.reduce((sum, container) => {
      const currentScrews = container.holes.filter(hole => hole !== null).length;
      return sum + (this.CONTAINER_CAPACITY - currentScrews);
    }, 0
    );
    const holdingHoleSpace = holdingHoles.filter(hole => !hole.screwId).length;
    const totalAvailableSpace = containerSpace + holdingHoleSpace;

    // Check if remaining screws fit in available space
    if (remainingScrews > totalAvailableSpace) {
      return false;
    }

    // Check if final state matches plan
    const expectedFinalState = this.currentPlan.finalState;
    const projectedFilledContainers = Math.floor(totalScrews / this.CONTAINER_CAPACITY);
    const projectedRemainder = totalScrews % this.CONTAINER_CAPACITY;

    return (
      projectedFilledContainers === expectedFinalState.filledContainers &&
      projectedRemainder === 0 && // Perfect division
      expectedFinalState.emptyHoldingHoles === this.HOLDING_HOLE_COUNT
    );
  }

  /**
   * Update progress and check for plan execution
   */
  onScrewCollected(screwsCollected: number): void {
    this.screwsCollected = screwsCollected;

    // Check if we need to execute next replacement
    const nextReplacement = this.getNextPlannedReplacement();
    if (nextReplacement && screwsCollected >= nextReplacement.atScrewCount) {
      this.emit({
        type: 'container:replacement:planned',
        timestamp: Date.now(),
        atScrewCount: nextReplacement.atScrewCount,
        newColors: nextReplacement.newColors
      });
    }

    // Update balance status
    const balanceStatus = this.calculateBalanceStatus(screwsCollected);
    this.emit({
      type: 'perfect:balance:status',
      timestamp: Date.now(),
      status: balanceStatus
    });
  }

  /**
   * Calculate current perfect balance status
   */
  calculateBalanceStatus(screwsCollected: number): PerfectBalanceStatus {
    if (!this.currentPlan) return 'major_deviation';

    const totalScrews = this.currentPlan.finalState.totalScrewsCollected;
    const progress = screwsCollected / totalScrews;

    // Check if we're following the plan correctly
    const expectedReplacements = this.currentPlan.replacements.filter(r => 
      r.atScrewCount <= screwsCollected
    ).length;
    
    const actualReplacements = this.nextReplacementIndex;

    if (progress >= 1.0 && this.validateCurrentState()) {
      return 'achieved';
    }

    if (Math.abs(expectedReplacements - actualReplacements) > 1) {
      return 'major_deviation';
    }

    if (expectedReplacements !== actualReplacements) {
      return 'minor_deviation';
    }

    return 'on_track';
  }

  /**
   * Generate final statistics for perfect balance achievement
   */
  generatePerfectBalanceStats(): PerfectBalanceStats {
    const containers = this.activeContainers;
    const holdingHoles = this.holdingHoles;

    const filledContainers = containers.filter(c => {
      const screwCount = c.holes.filter(hole => hole !== null).length;
      return screwCount === this.CONTAINER_CAPACITY;
    }).length;
    const emptyContainers = containers.filter(c => {
      const screwCount = c.holes.filter(hole => hole !== null).length;
      return screwCount === 0;
    }).length;
    const occupiedHoldingHoles = holdingHoles.filter(h => h.screwId !== null).length;
    const emptyHoldingHoles = holdingHoles.filter(h => h.screwId === null).length;

    const totalScrewsInContainers = containers.reduce((sum, c) => {
      const screwCount = c.holes.filter(hole => hole !== null).length;
      return sum + screwCount;
    }, 0);
    const totalScrewsInHoldingHoles = occupiedHoldingHoles;
    const totalCollected = totalScrewsInContainers + totalScrewsInHoldingHoles;

    const planExecutedPerfectly = this.currentPlan ? 
      this.nextReplacementIndex === this.currentPlan.replacements.length : false;
    
    const finalBalanceAchieved = emptyHoldingHoles === this.HOLDING_HOLE_COUNT && 
      totalCollected % this.CONTAINER_CAPACITY === 0;

    return {
      containers: {
        filled: filledContainers,
        empty: emptyContainers,
        total: containers.length
      },
      holdingHoles: {
        occupied: occupiedHoldingHoles,
        empty: emptyHoldingHoles,
        total: this.HOLDING_HOLE_COUNT
      },
      screws: {
        collected: totalCollected,
        total: this.currentPlan?.finalState.totalScrewsCollected || totalCollected,
        wasteCount: totalScrewsInHoldingHoles
      },
      performance: {
        planExecutedPerfectly,
        deviationsFromPlan: this.currentPlan ? 
          Math.abs(this.nextReplacementIndex - this.currentPlan.replacements.length) : 0,
        finalBalanceAchieved
      }
    };
  }

  /**
   * Get next planned replacement
   */
  private getNextPlannedReplacement(): ContainerReplacement | null {
    if (!this.currentPlan || this.nextReplacementIndex >= this.currentPlan.replacements.length) {
      return null;
    }
    return this.currentPlan.replacements[this.nextReplacementIndex];
  }

  /**
   * Execute a specific replacement
   */
  private executeReplacement(replacement: ContainerReplacement): void {
    // TODO: This would be handled by GameState in the actual implementation
    // For now, this is scaffolding code
    console.log('[ContainerStrategyManager] Container replacement executed:', replacement.newColors);
  }

  /**
   * Get available holding holes count
   */
  private getAvailableHoldingHoles(): number {
    return this.holdingHoles.filter(hole => hole.screwId === null).length;
  }

  /**
   * Validate current state against plan expectations
   */
  private validateCurrentState(): boolean {
    if (!this.currentPlan) return false;

    const filledContainers = this.activeContainers.filter(c => {
      const screwCount = c.holes.filter(hole => hole !== null).length;
      return screwCount === this.CONTAINER_CAPACITY;
    }).length;
    
    const emptyHoldingHoles = this.holdingHoles.filter(h => 
      h.screwId === null
    ).length;

    // Allow some tolerance in validation
    const expectedFilled = this.currentPlan.finalState.filledContainers;
    const expectedEmpty = this.currentPlan.finalState.emptyHoldingHoles;

    return (
      Math.abs(filledContainers - expectedFilled) <= 1 &&
      emptyHoldingHoles >= expectedEmpty - 1
    );
  }
}