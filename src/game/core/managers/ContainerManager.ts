/**
 * Container management system
 * Handles container creation, positioning, state management, and removal
 */

import { BaseSystem } from '../BaseSystem';
import { Container, ScrewColor } from '@/types/game';
import { GAME_CONFIG, UI_CONSTANTS, DEBUG_CONFIG } from '@/shared/utils/Constants';
import { ContainerPlanner, ContainerPlan } from '../../utils/ContainerPlanner';
import {
  ContainerFilledEvent,
  ScrewTransferCompletedEvent,
  ScrewTransferFailedEvent,
  ScrewTransferColorCheckEvent
} from '../../events/EventTypes';

export class ContainerManager extends BaseSystem {
  private containers: Container[] = [];
  private virtualGameWidth = GAME_CONFIG.canvas.width;
  private virtualGameHeight = GAME_CONFIG.canvas.height;
  private currentPlan: ContainerPlan | null = null;

  constructor() {
    super('ContainerManager');
  }

  protected async onInitialize(): Promise<void> {
    this.setupEventHandlers();
  }

  public update(deltaTime: number): void {
    void deltaTime; // Not used
    
    // Only handle container animations - no periodic corrections needed
    this.updateContainerAnimations();
  }

  private setupEventHandlers(): void {
    // Container lifecycle events
    this.subscribe('container:filled', this.handleContainerFilled.bind(this));
    this.subscribe('container:initialize', this.handleContainerInitialize.bind(this));
    
    // Transfer events
    this.subscribe('screw:transfer:completed', this.handleScrewTransferCompleted.bind(this));
    this.subscribe('screw:transfer:failed', this.handleScrewTransferFailed.bind(this));
    this.subscribe('screw:transfer:color_check', this.handleScrewTransferColorCheck.bind(this));
    
    // Bounds events
    this.subscribe('bounds:changed', this.handleBoundsChanged.bind(this));
  }

  // ========== NEW CLEAN CONTAINER PLANNING SYSTEM ==========

  /**
   * Handle level initialization - calculate and create optimal containers
   */
  private handleContainerInitialize(): void {
    this.executeIfActive(() => {
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log('🏭 ContainerManager: Level initialized, creating fresh containers...');
      }
      
      // For level initialization, clear existing containers and create fresh ones
      this.updateContainersFromInventory(true);
    });
  }

  /**
   * Main method: Get screw inventory and update containers to match optimal configuration
   */
  private updateContainersFromInventory(clearExisting = false): void {
    // Get complete screw inventory from ScrewManager
    this.emit({
      type: 'remaining:screws:requested',
      timestamp: Date.now(),
      callback: (screwInventory: Map<string, number>) => {
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log('🔢 Current screw inventory:', Array.from(screwInventory.entries()));
        }
        
        // Calculate optimal container plan
        const newPlan = ContainerPlanner.calculateOptimalContainers(screwInventory);
        
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log('📋 Calculated container plan:', newPlan);
        }
        
        // Only update if plan changed or if we need to clear existing
        if (clearExisting || !this.currentPlan || !ContainerPlanner.plansEqual(this.currentPlan, newPlan)) {
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(clearExisting ? '🔄 Creating fresh containers...' : '🔄 Container plan changed, updating containers...');
          }
          
          this.applyContainerPlan(newPlan, clearExisting);
          this.currentPlan = newPlan;
        } else {
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log('✅ Container plan unchanged, no updates needed');
          }
        }
      }
    });
  }

  /**
   * Apply a container plan - conservatively update containers
   * Only adds new containers when needed, never replaces existing containers with screws
   */
  private applyContainerPlan(plan: ContainerPlan, clearExisting = false): void {
    if (clearExisting) {
      // Clear all existing containers and create fresh ones (for level initialization)
      this.containers = [];
      
      plan.containers.forEach((containerSpec, index) => {
        const container = this.createContainerFromSpec(containerSpec, index);
        this.containers.push(container);
      });
      
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`✅ Created ${plan.totalContainers} fresh containers`);
      }
    } else {
      // Conservative approach: only add missing containers, never replace existing ones
      const existingColors = new Set(this.containers.map(c => c.color));
      const neededColors = plan.containers.map(spec => spec.color);
      
      // Find colors that need containers but don't have them
      const missingColors = neededColors.filter(color => !existingColors.has(color));
      
      if (missingColors.length > 0) {
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`🏭 Adding containers for missing colors: ${missingColors.join(', ')}`);
        }
        
        // Add containers for missing colors only
        missingColors.forEach(color => {
          const spec = plan.containers.find(s => s.color === color);
          if (spec && this.containers.length < GAME_CONFIG.containers.count) {
            const container = this.createContainerFromSpec(spec, this.containers.length);
            this.containers.push(container);
            
            if (DEBUG_CONFIG.logScrewDebug) {
              console.log(`✅ Added container for color ${color} with ${spec.holes} holes`);
            }
          }
        });
      } else {
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`✅ All needed colors already have containers - no changes needed`);
        }
        return; // No changes needed, don't emit events
      }
    }
    
    // Position all containers
    this.repositionAllContainers();
    
    // Emit state update
    this.emit({
      type: 'container:state:updated',
      timestamp: Date.now(),
      containers: this.containers
    });
  }

  /**
   * Create a single container from specification
   */
  private createContainerFromSpec(spec: { color: ScrewColor; holes: number }, index: number): Container {
    const containerHeight = UI_CONSTANTS.containers.height;
    const startY = UI_CONSTANTS.containers.startY;
    
    return {
      id: `container_planned_${Date.now()}_${index}`,
      color: spec.color,
      position: {
        x: 0, // Will be positioned by repositionAllContainers
        y: startY + (containerHeight / 2)
      },
      holes: new Array(spec.holes).fill(null),
      reservedHoles: new Array(spec.holes).fill(null),
      maxHoles: spec.holes,
      isFull: false,
      // Fade animation properties
      fadeOpacity: 1.0,
      fadeStartTime: 0,
      fadeDuration: 500,
      isFadingOut: false,
      isFadingIn: false,
    };
  }

  private handleContainerFilled(event: ContainerFilledEvent): void {
    this.executeIfActive(() => {
      const container = this.containers[event.containerIndex];
      if (container && container.isFull && !container.isMarkedForRemoval) {
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`🏭 Container ${container.id} filled - will be removed and containers recalculated`);
        }
        
        // Emit event to clear any holding holes containing screws from this container
        this.emit({
          type: 'container:removing:screws',
          timestamp: Date.now(),
          containerIndex: event.containerIndex,
          screwIds: event.screws
        });
        
        // Mark for removal with fade animation
        container.isMarkedForRemoval = true;
        container.isFadingOut = true;
        container.fadeStartTime = Date.now();
        
        // Schedule container recalculation after removal
        setTimeout(() => {
          // Remove the container
          this.containers.splice(event.containerIndex, 1);
          
          // Emit removal event
          this.emit({
            type: 'container:removed',
            timestamp: Date.now(),
            containerIndex: event.containerIndex,
            screwIds: event.screws,
            color: container.color
          });
          
          // Only recalculate containers if there are screws that need container space
          this.emit({
            type: 'remaining:screws:requested',
            timestamp: Date.now(),
            callback: (screwInventory: Map<string, number>) => {
              const totalRemainingScrews = Array.from(screwInventory.values()).reduce((sum, count) => sum + count, 0);
              
              if (totalRemainingScrews > 0) {
                if (DEBUG_CONFIG.logScrewDebug) {
                  console.log(`🔄 Container removed, ${totalRemainingScrews} screws remaining - recalculating optimal containers...`);
                }
                this.updateContainersFromInventory();
              } else {
                if (DEBUG_CONFIG.logScrewDebug) {
                  console.log(`✅ Container removed, no remaining screws - no recalculation needed`);
                }
              }
            }
          });
          
        }, container.fadeDuration || 500);
      }
    });
  }

  private handleScrewTransferCompleted(event: ScrewTransferCompletedEvent): void {
    this.executeIfActive(() => {
      const { screwId, toContainerIndex, toHoleIndex } = event;
      
      if (toContainerIndex >= 0 && toContainerIndex < this.containers.length) {
        const container = this.containers[toContainerIndex];
        
        // Validate container state and hole availability
        if (container.isMarkedForRemoval) {
          console.warn(`⚠️ Cannot complete transfer to container ${container.id} - marked for removal`);
          return;
        }
        
        if (toHoleIndex >= 0 && toHoleIndex < container.maxHoles) {
          // Validate hole state before placing screw
          if (container.holes[toHoleIndex] !== null) {
            console.error(`❌ Cannot place screw ${screwId} - hole ${toHoleIndex} in container ${container.id} is already occupied!`);
            return;
          }
          
          // Clear the reservation and place the screw in the actual hole
          container.reservedHoles[toHoleIndex] = null;
          container.holes[toHoleIndex] = screwId;
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`Completed transfer of screw ${screwId} to container ${container.id} hole ${toHoleIndex}`);
          }
          
          // Check if container is now full
          if (container.holes.filter(h => h !== null).length === container.maxHoles) {
            container.isFull = true;
            
            this.emit({
              type: 'container:filled',
              timestamp: Date.now(),
              containerIndex: toContainerIndex,
              color: container.color,
              screws: container.holes.filter(id => id !== null) as string[]
            });
          }
          
          // Emit container state update
          this.emit({
            type: 'container:state:updated',
            timestamp: Date.now(),
            containers: this.containers
          });
        }
      }
    });
  }

  private handleScrewTransferFailed(event: ScrewTransferFailedEvent): void {
    this.executeIfActive(() => {
      const { screwId, toContainerIndex, toHoleIndex, reason } = event;
      
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`❌ ContainerManager: Transfer failed for screw ${screwId}: ${reason}`);
      }
      
      // Clear the reservation if it was made
      if (toContainerIndex >= 0 && toContainerIndex < this.containers.length) {
        const container = this.containers[toContainerIndex];
        if (toHoleIndex >= 0 && toHoleIndex < container.maxHoles) {
          if (container.reservedHoles[toHoleIndex] === screwId) {
            container.reservedHoles[toHoleIndex] = null;
            console.log(`🧹 Cleared reservation for container ${container.id} hole ${toHoleIndex}`);
          }
        }
      }
    });
  }

  private handleScrewTransferColorCheck(event: ScrewTransferColorCheckEvent): void {
    this.executeIfActive(() => {
      const { targetColor, holdingHoleScrews, callback } = event;
      
      // Request screw colors from ScrewManager to validate color matches
      this.emit({
        type: 'screw:colors:requested',
        timestamp: Date.now(),
        containerIndex: -1,
        existingColors: [],
        callback: (screwColors: ScrewColor[]) => {
          // Filter holding hole screws that match the target color
          const validTransfers = holdingHoleScrews.filter((screwData, index) => {
            const screwColor = screwColors[index];
            return screwColor === targetColor;
          });
          
          callback(validTransfers);
        }
      });
    });
  }

  private handleBoundsChanged(event: import('../../events/EventTypes').BoundsChangedEvent): void {
    this.executeIfActive(() => {
      this.virtualGameWidth = event.width;
      this.virtualGameHeight = event.height;
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`ContainerManager: Updated virtual dimensions to ${event.width}x${event.height}`);
      }
      this.repositionAllContainers();
      
      // Emit state update
      this.emit({
        type: 'container:state:updated',
        timestamp: Date.now(),
        containers: this.containers
      });
    });
  }

  // ========== ESSENTIAL UTILITY METHODS ==========

  /**
   * Reposition all containers to center them properly
   */
  private repositionAllContainers(): void {
    if (this.containers.length === 0) return;
    
    const containerWidth = UI_CONSTANTS.containers.width;
    const containerHeight = UI_CONSTANTS.containers.height;
    const spacing = UI_CONSTANTS.containers.spacing;
    const startY = UI_CONSTANTS.containers.startY;
    
    const totalContainersWidth = (this.containers.length * containerWidth) + ((this.containers.length - 1) * spacing);
    const startX = (this.virtualGameWidth - totalContainersWidth) / 2;

    this.containers.forEach((container, index) => {
      const containerLeftX = startX + (index * (containerWidth + spacing));
      const containerCenterX = containerLeftX + (containerWidth / 2);
      
      container.position.x = containerCenterX;
      container.position.y = startY + (containerHeight / 2);
    });
  }

  /**
   * Update container animations (fade in/out)
   */
  public updateContainerAnimations(): void {
    const currentTime = Date.now();
    
    this.containers.forEach(container => {
      if (container.isFadingOut || container.isFadingIn) {
        const elapsed = currentTime - container.fadeStartTime;
        const progress = Math.min(elapsed / container.fadeDuration, 1);
        
        if (container.isFadingOut) {
          // Fade from 1 to 0
          container.fadeOpacity = 1 - progress;
          
          if (progress >= 1) {
            container.isFadingOut = false;
            container.fadeOpacity = 0;
          }
        } else if (container.isFadingIn) {
          // Fade from 0 to 1
          container.fadeOpacity = progress;
          
          if (progress >= 1) {
            container.isFadingIn = false;
            container.fadeOpacity = 1;
          }
        }
      }
    });
  }

  // ========== PUBLIC INTERFACE METHODS ==========

  /**
   * Find an available container for a specific color
   */
  public findAvailableContainer(color: ScrewColor): Container | null {
    return this.containers.find(container => {
      if (container.color !== color || container.isFull || container.isMarkedForRemoval) return false;
      
      // Check if there are available holes (not filled and not reserved)
      return container.holes.some((hole, idx) => hole === null && container.reservedHoles[idx] === null);
    }) || null;
  }

  /**
   * Get all containers (for rendering)
   */
  public getContainers(): Container[] {
    return [...this.containers];
  }

  /**
   * Public method to trigger container initialization
   * Called by external systems when level is ready
   */
  public initializeContainersForLevel(): void {
    this.updateContainersFromInventory();
  }

  /**
   * Gets the count of available container holes by color.
   * Used for smart container replacement logic.
   */
  public getAvailableHolesByColor(): Map<string, number> {
    const availableByColor = new Map<string, number>();
    
    // Count available holes in each container
    for (const container of this.containers) {
      // Count empty holes (not filled and not reserved)
      let availableCount = 0;
      for (let i = 0; i < container.maxHoles; i++) {
        if (container.holes[i] === null && container.reservedHoles[i] === null) {
          availableCount++;
        }
      }
      
      // Add to the total for this color
      const current = availableByColor.get(container.color) || 0;
      availableByColor.set(container.color, current + availableCount);
    }
    
    return availableByColor;
  }
}