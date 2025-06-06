/**
 * Mathematical engine for calculating perfect level balance
 * Ensures levels end with filled containers and empty holding holes
 */

import { 
  ContainerReplacementPlan, 
  ScrewColorDistribution,
  PerfectBalanceState,
  ContainerReplacement,
  ProgressMilestone,
  LevelDifficulty,
  ContainerReplacementReason
} from '../../types/precomputed';
import { BaseSystem } from '../core/BaseSystem';
import { getAllScrewColors } from './Colors';
import { UI_CONSTANTS } from './Constants';

/**
 * Core mathematical engine for perfect balance calculations
 */
export class PerfectBalanceCalculator extends BaseSystem {
  private readonly CONTAINER_CAPACITY = UI_CONSTANTS.containers.hole.count; // 3 screws per container
  private readonly HOLDING_HOLE_COUNT = 5; // 5 holding holes (hardcoded for now)
  private readonly AVAILABLE_COLORS = getAllScrewColors(); // 9 colors

  constructor() {
    super('PerfectBalanceCalculator');
  }

  async onInitialize(): Promise<void> {
    // Initialize perfect balance calculator
    console.log('[PerfectBalanceCalculator] Initialized with:');
    console.log(`  - Container capacity: ${this.CONTAINER_CAPACITY} screws`);
    console.log(`  - Holding holes: ${this.HOLDING_HOLE_COUNT}`);
    console.log(`  - Available colors: ${this.AVAILABLE_COLORS.length}`);
    
    this.emit({
      type: 'system:ready',
      timestamp: Date.now()
    });
  }

  /**
   * Calculate the perfect screw count for a level
   * Ensures total screws result in perfectly filled containers
   */
  calculatePerfectScrewCount(targetLayers: number, difficulty: LevelDifficulty): number {
    // Base screw count calculation based on layers and difficulty
    const baseScrewsPerLayer = this.calculateBaseScrewsPerLayer(difficulty);
    const rawScrewCount = targetLayers * baseScrewsPerLayer;

    // Adjust to ensure perfect division by container capacity
    const perfectScrewCount = Math.ceil(rawScrewCount / this.CONTAINER_CAPACITY) * this.CONTAINER_CAPACITY;

    // Ensure minimum viable level size
    const minimumScrews = this.CONTAINER_CAPACITY * 2; // At least 2 filled containers
    
    const finalCount = Math.max(perfectScrewCount, minimumScrews);
    
    console.log(`[PerfectBalanceCalculator] Screw count calculation:`);
    console.log(`  - Target layers: ${targetLayers}`);
    console.log(`  - Base screws per layer: ${baseScrewsPerLayer}`);
    console.log(`  - Raw screw count: ${rawScrewCount}`);
    console.log(`  - Perfect screw count: ${perfectScrewCount}`);
    console.log(`  - Final count: ${finalCount}`);
    
    return finalCount;
  }

  /**
   * Plan optimal container replacements for perfect balance
   */
  planContainerReplacements(
    totalScrews: number, 
    screwDistribution: ScrewColorDistribution,
    difficulty: LevelDifficulty
  ): ContainerReplacementPlan {
    const replacements: ContainerReplacement[] = [];
    const tolerance = difficulty.balanceTolerance;

    // Calculate how many total containers we'll need
    const totalContainersNeeded = Math.ceil(totalScrews / this.CONTAINER_CAPACITY);
    
    // Plan replacement schedule to prevent holding hole overflow
    const colorArray = Array.from(screwDistribution.colorCounts.entries())
      .sort(([, a], [, b]) => b - a); // Sort by count descending

    let currentScrewCount = 0;
    let containersPlaced = 0;
    const initialContainerCount = 4; // Start with 4 containers

    // Create initial containers with most common colors
    colorArray.slice(0, initialContainerCount).map(([color]) => color);
    
    // Plan replacements as we progress through the level
    for (let i = 0; i < colorArray.length; i++) {
      const [, count] = colorArray[i];
      const containersForThisColor = Math.ceil(count / this.CONTAINER_CAPACITY);
      
      // Check if we need replacement at this point
      if (containersPlaced + containersForThisColor > initialContainerCount) {
        const replacementPoint = currentScrewCount + (count % this.CONTAINER_CAPACITY);
        
        if (replacementPoint < totalScrews) {
          replacements.push({
            atScrewCount: replacementPoint,
            newColors: this.selectOptimalColors(
              screwDistribution, 
              replacementPoint
            ),
            reason: this.determineReplacementReason(replacementPoint, totalScrews, containersPlaced),
            expectedState: {
              holdingHolesUsed: this.calculateHoldingHolesUsed(replacementPoint),
              containersRemaining: totalContainersNeeded - Math.floor(replacementPoint / this.CONTAINER_CAPACITY)
            }
          });
        }
      }

      currentScrewCount += count;
      containersPlaced += containersForThisColor;
    }

    // Validate the plan achieves perfect balance
    const finalState = this.calculateFinalState(totalScrews, screwDistribution, tolerance);
    const isValid = this.validatePerfectBalance(finalState, tolerance);

    return {
      replacements,
      finalState,
      isValid,
      metadata: {
        generatedAt: Date.now(),
        algorithm: 'optimal_color_distribution',
        validation: this.generateValidationReport(finalState, isValid)
      }
    };
  }

  /**
   * Optimize screw color distribution for perfect balance
   */
  optimizeScrewColors(totalScrews: number): ScrewColorDistribution {
    const availableColors = this.AVAILABLE_COLORS;
    const colorsNeeded = Math.min(availableColors.length, Math.ceil(totalScrews / this.CONTAINER_CAPACITY));
    
    // Distribute screws as evenly as possible across colors
    const baseCountPerColor = Math.floor(totalScrews / colorsNeeded);
    const remainder = totalScrews % colorsNeeded;
    
    const colorCounts = new Map<string, number>();
    
    for (let i = 0; i < colorsNeeded; i++) {
      const color = availableColors[i];
      const count = baseCountPerColor + (i < remainder ? 1 : 0);
      colorCounts.set(color, count);
    }

    const perfectDivision = totalScrews % this.CONTAINER_CAPACITY === 0;
    const holdingHoleUsage = perfectDivision ? 0 : totalScrews % this.CONTAINER_CAPACITY;

    return {
      colorCounts,
      totalScrews,
      perfectDivision,
      optimization: {
        wasteMinimized: true,
        balanceAchievable: perfectDivision,
        holdingHoleUsage
      }
    };
  }

  /**
   * Validate that a plan achieves perfect balance
   */
  validatePerfectBalance(finalState: PerfectBalanceState, tolerance: number = 0): boolean {
    return (
      finalState.emptyHoldingHoles === this.HOLDING_HOLE_COUNT &&
      finalState.totalScrewsCollected % this.CONTAINER_CAPACITY <= tolerance &&
      finalState.isPerfect
    );
  }

  /**
   * Generate progress milestones for UI updates
   */
  generateProgressMilestones(totalScrews: number, replacementPlan: ContainerReplacementPlan): ProgressMilestone[] {
    const milestones: ProgressMilestone[] = [];

    // Standard progress milestones
    const progressPoints = [0.25, 0.5, 0.75];
    progressPoints.forEach(point => {
      const screwCount = Math.floor(totalScrews * point);
      milestones.push({
        atScrewCount: screwCount,
        percentage: point * 100,
        type: point === 0.25 ? 'quarter_complete' : 
              point === 0.5 ? 'half_complete' : 'three_quarters_complete',
        description: `${point * 100}% Complete - ${screwCount}/${totalScrews} screws collected`
      });
    });

    // Container replacement milestones
    replacementPlan.replacements.forEach(replacement => {
      milestones.push({
        atScrewCount: replacement.atScrewCount,
        percentage: (replacement.atScrewCount / totalScrews) * 100,
        type: 'container_replacement',
        description: `Container colors updated for optimal balance`
      });
    });

    // Final phase milestone
    const finalPhaseStart = totalScrews - Math.floor(totalScrews * 0.1); // Last 10%
    milestones.push({
      atScrewCount: finalPhaseStart,
      percentage: (finalPhaseStart / totalScrews) * 100,
      type: 'final_phase',
      description: 'Final phase - Perfect balance approaching'
    });

    // Perfect balance achievement
    milestones.push({
      atScrewCount: totalScrews,
      percentage: 100,
      type: 'perfect_balance_achieved',
      description: 'Perfect balance achieved! All containers filled, all holding holes empty.'
    });

    return milestones.sort((a, b) => a.atScrewCount - b.atScrewCount);
  }

  /**
   * Calculate base screws per layer based on difficulty
   */
  private calculateBaseScrewsPerLayer(difficulty: LevelDifficulty): number {
    const baseMultipliers = {
      simple: 8,   // Simple shapes, fewer screws
      medium: 12,  // Medium complexity
      complex: 16  // Complex shapes, more screws
    };

    const densityMultipliers = {
      low: 0.8,
      medium: 1.0,
      high: 1.2
    };

    return Math.floor(
      baseMultipliers[difficulty.shapeComplexity] * 
      densityMultipliers[difficulty.screwDensity]
    );
  }

  /**
   * Select optimal colors for container replacement
   */
  private selectOptimalColors(
    distribution: ScrewColorDistribution, 
    currentScrewCount: number
  ): string[] {
    const colorsWithRemainingCounts = Array.from(distribution.colorCounts.entries())
      .map(([color, totalCount]) => ({
        color,
        remaining: Math.max(0, totalCount - this.getCollectedCount(color, currentScrewCount, distribution))
      }))
      .filter(({ remaining }) => remaining > 0)
      .sort((a, b) => b.remaining - a.remaining);

    // Select top 4 colors with most remaining screws
    return colorsWithRemainingCounts
      .slice(0, 4)
      .map(({ color }) => color);
  }

  /**
   * Determine reason for container replacement
   */
  private determineReplacementReason(
    screwCount: number, 
    totalScrews: number, 
    containersPlaced: number
  ): ContainerReplacementReason {
    const progressRatio = screwCount / totalScrews;
    
    if (progressRatio > 0.9) return 'level_completion_preparation';
    if (containersPlaced > 8) return 'prevent_holding_overflow';
    if (progressRatio > 0.5) return 'color_optimization';
    return 'perfect_balance_required';
  }

  /**
   * Calculate expected holding holes usage at a point
   */
  private calculateHoldingHolesUsed(
    screwCount: number
  ): number {
    // Simplified calculation - in practice would need current container state
    const remainderScrews = screwCount % this.CONTAINER_CAPACITY;
    return Math.min(remainderScrews, this.HOLDING_HOLE_COUNT);
  }

  /**
   * Calculate final state for perfect balance validation
   */
  private calculateFinalState(
    totalScrews: number, 
    _distribution: ScrewColorDistribution,
    tolerance: number
  ): PerfectBalanceState {
    const filledContainers = Math.floor(totalScrews / this.CONTAINER_CAPACITY);
    const remainingScrews = totalScrews % this.CONTAINER_CAPACITY;
    const emptyHoldingHoles = this.HOLDING_HOLE_COUNT - Math.min(remainingScrews, this.HOLDING_HOLE_COUNT);
    const isPerfect = remainingScrews <= tolerance;

    return {
      filledContainers,
      emptyHoldingHoles,
      totalScrewsCollected: totalScrews,
      isPerfect
    };
  }

  /**
   * Generate validation report for the balance plan
   */
  private generateValidationReport(finalState: PerfectBalanceState, isValid: boolean): string[] {
    const report: string[] = [];
    
    report.push(`Final containers filled: ${finalState.filledContainers}`);
    report.push(`Final holding holes empty: ${finalState.emptyHoldingHoles}`);
    report.push(`Total screws collected: ${finalState.totalScrewsCollected}`);
    report.push(`Perfect balance: ${finalState.isPerfect ? 'YES' : 'NO'}`);
    report.push(`Plan valid: ${isValid ? 'YES' : 'NO'}`);

    if (!isValid) {
      report.push('ISSUES:');
      if (finalState.emptyHoldingHoles !== this.HOLDING_HOLE_COUNT) {
        report.push(`- Holding holes not empty: ${this.HOLDING_HOLE_COUNT - finalState.emptyHoldingHoles} occupied`);
      }
      if (!finalState.isPerfect) {
        report.push('- Perfect balance not achieved');
      }
    }

    return report;
  }

  /**
   * Get collected count for a color at a specific point (placeholder)
   */
  private getCollectedCount(color: string, currentScrewCount: number, distribution: ScrewColorDistribution): number {
    // Simplified - would need actual collection tracking in practice
    const totalForColor = distribution.colorCounts.get(color) || 0;
    const totalScrews = distribution.totalScrews;
    return Math.floor((currentScrewCount / totalScrews) * totalForColor);
  }
}