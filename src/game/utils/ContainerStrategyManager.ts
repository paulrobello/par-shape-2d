/**
 * Container Strategy Manager
 * Implements smart container replacement logic based on actual game state
 */

import { BaseSystem } from '../core/BaseSystem';
import { Container, HoldingHole, ScrewColor } from '../../types/game';
import { GAME_CONFIG, DEBUG_CONFIG } from '../../shared/utils/Constants';

/**
 * Manages container replacement strategy based on actual game state
 */
export class ContainerStrategyManager extends BaseSystem {
  private readonly MAX_HOLES_PER_CONTAINER = 3;
  private readonly MIN_HOLES_PER_CONTAINER = 1;
  private readonly HOLDING_HOLE_COUNT = GAME_CONFIG.holdingHoles.count; // 5 holding holes
  
  private activeContainers: Container[] = [];
  private holdingHoles: HoldingHole[] = [];
  private visibleScrewColors: ScrewColor[] = [];
  private totalScrewsInLevel = 0;
  private screwsCollected = 0;

  constructor() {
    super('ContainerStrategyManager');
  }

  async onInitialize(): Promise<void> {
    this.setupEventHandlers();
    
    this.emit({
      type: 'system:ready',
      timestamp: Date.now()
    });
  }

  private setupEventHandlers(): void {
    // Listen for screw collection to track progress
    this.subscribe('screw:collected', () => {
      this.screwsCollected++;
    });

    // Listen for container state updates
    this.subscribe('container:state:updated', (event: import('../events/EventTypes').ContainerStateUpdatedEvent) => {
      this.updateContainerState(event.containers, this.holdingHoles);
    });

    // Listen for holding hole state updates
    this.subscribe('holding_hole:state:updated', (event: import('../events/EventTypes').HoldingHoleStateUpdatedEvent) => {
      this.holdingHoles = [...event.holdingHoles];
    });

    // Listen for screw generation to track total screws
    this.subscribe('screws:generated', (event: import('../events/EventTypes').ScrewsGeneratedEvent) => {
      this.totalScrewsInLevel = event.totalScrewsGenerated;
    });

    // Listen for layers updated to track visible screw colors
    this.subscribe('layers:updated', (event: import('../events/EventTypes').LayersUpdatedEvent) => {
      // Extract screw colors from visible layers
      const colors: ScrewColor[] = [];
      event.visibleLayers.forEach(layer => {
        layer.getAllShapes().forEach(shape => {
          shape.getAllScrews().forEach(screw => {
            if (!screw.isCollected) {
              colors.push(screw.color);
            }
          });
        });
      });
      this.visibleScrewColors = colors;
    });
  }

  /**
   * Check if container should be replaced based on smart logic
   */
  shouldReplaceContainer(containerIndex: number): boolean {
    // Calculate remaining screws (from shapes only - not yet collected)
    const remainingScrews = this.totalScrewsInLevel - this.screwsCollected;
    
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`[CONTAINER_STRATEGY] Checking replacement for container ${containerIndex}. Remaining screws: ${remainingScrews}`);
    }
    
    // No replacement if no screws remain
    if (remainingScrews <= 0) {
      return false;
    }
    
    // Calculate available space in remaining containers (excluding the one being removed)
    const availableSpace = this.activeContainers
      .filter((_, index) => index !== containerIndex)
      .reduce((total, container) => {
        const filledHoles = container.holes.filter(hole => hole !== null).length;
        const available = container.maxHoles - filledHoles;
        return total + available;
      }, 0);
    
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`[CONTAINER_STRATEGY] Available space in remaining containers: ${availableSpace}`);
    }
    
    // Only replace if existing containers don't have enough space
    return availableSpace < remainingScrews;
  }

  /**
   * Update container state
   */
  updateContainerState(containers: Container[], holdingHoles: HoldingHole[]): void {
    this.activeContainers = [...containers];
    this.holdingHoles = [...holdingHoles];
  }



  /**
   * Get all available screw colors from visible screws and holding holes
   */
  private getAllAvailableScrewColors(): ScrewColor[] {
    const colors: ScrewColor[] = [...this.visibleScrewColors];
    
    // Add colors from holding holes
    this.holdingHoles.forEach(hole => {
      if (hole.screwColor) {
        colors.push(hole.screwColor);
      }
    });
    
    return colors;
  }
  
  /**
   * Count screws by color
   */
  private countScrewsByColor(colors: ScrewColor[]): Map<ScrewColor, number> {
    const counts = new Map<ScrewColor, number>();
    
    colors.forEach(color => {
      counts.set(color, (counts.get(color) || 0) + 1);
    });
    
    return counts;
  }
  
  /**
   * Get available space in containers by color
   */
  private getAvailableSpaceByColor(excludeContainerIndex?: number): Map<ScrewColor, number> {
    const spaceByColor = new Map<ScrewColor, number>();
    
    this.activeContainers.forEach((container, index) => {
      // Skip the container being removed
      if (excludeContainerIndex !== undefined && index === excludeContainerIndex) {
        return;
      }
      
      const filledHoles = container.holes.filter(hole => hole !== null).length;
      const availableSpace = container.maxHoles - filledHoles;
      
      if (availableSpace > 0) {
        const currentSpace = spaceByColor.get(container.color) || 0;
        spaceByColor.set(container.color, currentSpace + availableSpace);
      }
    });
    
    return spaceByColor;
  }

  /**
   * Reset state for new level
   */
  reset(): void {
    this.activeContainers = [];
    this.holdingHoles = [];
    this.visibleScrewColors = [];
    this.totalScrewsInLevel = 0;
    this.screwsCollected = 0;
  }

  /**
   * Generate statistics for level completion
   */
  generateCompletionStats(): {
    containersUsed: number;
    totalHolesCreated: number;
    efficiency: number;
    wastedSpace: number;
  } {
    const totalHoles = this.activeContainers.reduce((sum, c) => sum + c.maxHoles, 0);
    const filledHoles = this.activeContainers.reduce((sum, c) => {
      return sum + c.holes.filter(hole => hole !== null).length;
    }, 0);
    
    const efficiency = totalHoles > 0 ? (filledHoles / totalHoles) * 100 : 0;
    const wastedSpace = totalHoles - filledHoles;
    
    return {
      containersUsed: this.activeContainers.length,
      totalHolesCreated: totalHoles,
      efficiency,
      wastedSpace
    };
  }

  /**
   * Update progress when screw is collected
   */
  onScrewCollected(screwsCollected: number): void {
    this.screwsCollected = screwsCollected;
  }

}