/**
 * Container management system
 * Handles container creation, positioning, state management, and removal
 */

import { BaseSystem } from '../BaseSystem';
import { Container, ScrewColor } from '@/types/game';
import { GAME_CONFIG, UI_CONSTANTS, DEBUG_CONFIG, ANIMATION_CONSTANTS } from '@/shared/utils/Constants';
import { ContainerPlanner, ContainerPlan } from '../../utils/ContainerPlanner';
import {
  ContainerFilledEvent,
  ScrewTransferCompletedEvent,
  ScrewTransferFailedEvent,
  ScrewTransferColorCheckEvent,
  ContainerAllRemovedEvent,
  LevelCompletionBurstStartedEvent
} from '../../events/EventTypes';
import { LevelCompletionBurstEffect } from '@/shared/rendering/components/LevelCompletionBurstEffect';
import { HapticUtils } from '@/shared/utils/HapticUtils';

export class ContainerManager extends BaseSystem {
  private containers: Container[] = [];
  
  // Fixed slot positions for containers to prevent shifting
  private static readonly MAX_CONTAINER_SLOTS = 4;
  private containerSlots: (Container | null)[] = new Array(ContainerManager.MAX_CONTAINER_SLOTS).fill(null);
  
  private virtualGameWidth = GAME_CONFIG.canvas.width;
  private virtualGameHeight = GAME_CONFIG.canvas.height;
  private currentPlan: ContainerPlan | null = null;
  
  // Throttling for proactive container updates
  private lastProactiveUpdate = 0;
  private static readonly PROACTIVE_UPDATE_THROTTLE_MS = 1000; // 1 second throttle
  
  // Level completion burst effect
  private burstEffect: LevelCompletionBurstEffect | null = null;

  constructor() {
    super('ContainerManager');
  }

  protected async onInitialize(): Promise<void> {
    this.setupEventHandlers();
  }

  public update(deltaTime: number): void {
    // Update container animations
    this.updateContainerAnimations();
    
    // Update burst effect if active
    this.updateBurstEffect(deltaTime);
  }

  private setupEventHandlers(): void {
    // Container lifecycle events
    this.subscribe('container:filled', this.handleContainerFilled.bind(this));
    this.subscribe('container:initialize', this.handleContainerInitialize.bind(this));
    
    // Transfer events
    this.subscribe('screw:transfer:completed', this.handleScrewTransferCompleted.bind(this));
    this.subscribe('screw:transfer:failed', this.handleScrewTransferFailed.bind(this));
    this.subscribe('screw:transfer:color_check', this.handleScrewTransferColorCheck.bind(this));
    
    // Proactive container management - update when screw availability changes
    this.subscribe('layers:updated', this.handleLayersUpdated.bind(this));
    this.subscribe('layer:indices:updated', this.handleLayerIndicesUpdated.bind(this));
    this.subscribe('screw:collected', this.handleScrewCollected.bind(this));
    
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
  /**
   * Updates container configuration based on current screw inventory.
   * 
   * This method implements the proactive container management system that ensures
   * containers are available BEFORE players need them. The process:
   * 
   * 1. **Real-time Inventory**: Requests current screw counts from ScrewManager
   * 2. **Optimal Planning**: Uses ContainerPlanner to calculate ideal container layout
   * 3. **Change Detection**: Only updates if the plan actually changed (efficiency)
   * 4. **Conservative Updates**: Preserves existing containers with screws
   * 
   * **Callback Pattern**: Uses event-driven request-response to get screw counts
   * across system boundaries without tight coupling. The callback ensures we get
   * the most current data even if the request takes multiple frames.
   * 
   * **Performance**: Throttled updates prevent excessive recalculation during
   * rapid game state changes.
   * 
   * @param clearExisting - Whether to clear all existing containers (level start)
   */
  private updateContainersFromInventory(clearExisting = false): void {
    // Get complete screw inventory from ScrewManager via event-driven request
    this.emit({
      type: 'remaining:screws:requested',
      timestamp: Date.now(),
      callback: (visibleScrewsByColor: Map<string, number>, totalScrewsByColor: Map<string, number>, visibleColors: Set<string>) => {
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log('🔢 Visible screw counts:', Array.from(visibleScrewsByColor.entries()));
          console.log('🔢 Total screw counts:', Array.from(totalScrewsByColor.entries()));
          console.log('👁️ Visible colors for container selection:', Array.from(visibleColors));
        }
        
        // Create optimal inventory combining visible color selection with total screw counts for hole sizing
        // This ensures containers are only created for visible colors but have enough holes for all screws
        const optimalInventory = new Map<string, number>();
        for (const color of visibleColors) {
          // Use total screw count for hole sizing to ensure containers have enough capacity
          const totalCount = totalScrewsByColor.get(color) || 0;
          if (totalCount > 0) {
            optimalInventory.set(color, totalCount);
          }
        }
        
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log('🎯 Optimal inventory for container planning (visible colors + total counts):', Array.from(optimalInventory.entries()));
        }
        
        // Calculate optimal container plan using visible colors but total screw counts for proper hole sizing
        const newPlan = ContainerPlanner.calculateOptimalContainers(optimalInventory);
        
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
      this.containerSlots.fill(null);
      
      plan.containers.forEach((containerSpec, index) => {
        if (index < ContainerManager.MAX_CONTAINER_SLOTS) {
          const container = this.createContainerFromSpec(containerSpec, index);
          this.containers.push(container);
          this.containerSlots[index] = container;
        }
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
          if (spec) {
            // Find first vacant slot
            const vacantSlotIndex = this.containerSlots.findIndex(slot => slot === null);
            if (vacantSlotIndex !== -1) {
              const container = this.createContainerFromSpec(spec, vacantSlotIndex);
              this.containers.push(container);
              this.containerSlots[vacantSlotIndex] = container;
              
              if (DEBUG_CONFIG.logScrewDebug) {
                console.log(`✅ Added container for color ${color} with ${spec.holes} holes in slot ${vacantSlotIndex}`);
              }
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
      containers: this.getContainers() // Use getter to maintain proper order
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
      fadeDuration: ANIMATION_CONSTANTS.container.fadeDuration,
      isFadingOut: false,
      isFadingIn: false,
    };
  }

  private handleContainerFilled(event: ContainerFilledEvent): void {
    this.executeIfActive(() => {
      // Find the container by matching color and full status
      // This is more reliable than using index which can be inconsistent
      const container = this.containers.find(c => 
        c.color === event.color && 
        c.isFull && 
        !c.isMarkedForRemoval
      );
      
      if (container) {
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`🏭 Container ${container.id} filled - will be removed and containers recalculated`);
        }
        
        // Find the actual visual index of this container
        const orderedContainers = this.getContainers();
        const visualIndex = orderedContainers.indexOf(container);
        
        // Emit event to clear any holding holes containing screws from this container
        this.emit({
          type: 'container:removing:screws',
          timestamp: Date.now(),
          containerIndex: visualIndex,
          screwIds: event.screws
        });
        
        // Mark for removal with fade animation
        container.isMarkedForRemoval = true;
        container.isFadingOut = true;
        container.fadeStartTime = Date.now();
        
        // Schedule both container removal AND replacement after fade animation completes
        setTimeout(() => {
          // Find the container's slot position
          const slotIndex = this.containerSlots.indexOf(container);
          if (slotIndex !== -1) {
            // Clear the slot but preserve the position
            this.containerSlots[slotIndex] = null;
          }
          
          // Remove from containers array
          const arrayIndex = this.containers.indexOf(container);
          if (arrayIndex !== -1) {
            this.containers.splice(arrayIndex, 1);
          }
          
          // Emit removal event
          this.emit({
            type: 'container:removed',
            timestamp: Date.now(),
            containerIndex: visualIndex,
            screwIds: event.screws,
            color: container.color
          });
          
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`🗑️ Container ${container.id} physically removed after fade animation`);
          }
          
          // Check if this was the last container and trigger burst effect
          this.checkForLastContainerRemoval();
          
          // NOW check for replacement containers and create them with fade-in animation
          this.emit({
            type: 'remaining:screws:requested',
            timestamp: Date.now(),
            callback: (visibleScrewsByColor: Map<string, number>, totalScrewsByColor: Map<string, number>, visibleColors: Set<string>) => {
              const totalRemainingScrews = Array.from(totalScrewsByColor.values()).reduce((sum, count) => sum + count, 0);
              
              // Create optimal inventory combining visible color selection with total screw counts for hole sizing
              const optimalInventory = new Map<string, number>();
              for (const color of visibleColors) {
                const totalCount = totalScrewsByColor.get(color) || 0;
                if (totalCount > 0) {
                  optimalInventory.set(color, totalCount);
                }
              }
              
              const totalVisibleScrews = Array.from(optimalInventory.values()).reduce((sum, count) => sum + count, 0);
              
              if (totalVisibleScrews > 0) {
                if (DEBUG_CONFIG.logScrewDebug) {
                  console.log(`🔄 Container removed, ${totalRemainingScrews} total screws remaining (${totalVisibleScrews} visible) - creating replacement containers with fade-in...`);
                }
                this.createReplacementContainersWithFadeIn(optimalInventory);
              } else {
                if (DEBUG_CONFIG.logScrewDebug) {
                  console.log(`✅ Container removed, no remaining screws - no replacement needed`);
                }
              }
            }
          });
          
        }, container.fadeDuration || ANIMATION_CONSTANTS.container.fadeDuration);
      }
    });
  }

  private handleScrewTransferCompleted(event: ScrewTransferCompletedEvent): void {
    this.executeIfActive(() => {
      const { screwId, toContainerIndex, toHoleIndex } = event;
      
      // Get container from visual order (getContainers returns slot-ordered containers)
      const orderedContainers = this.getContainers();
      if (toContainerIndex >= 0 && toContainerIndex < orderedContainers.length) {
        const container = orderedContainers[toContainerIndex];
        
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
            containers: this.getContainers() // Use getter to maintain proper order
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
      // Get container from visual order (getContainers returns slot-ordered containers)
      const orderedContainers = this.getContainers();
      if (toContainerIndex >= 0 && toContainerIndex < orderedContainers.length) {
        const container = orderedContainers[toContainerIndex];
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

  private handleLayersUpdated(): void {
    this.executeIfActive(() => {
      this.proactivelyUpdateContainers('layers updated');
    });
  }

  private handleLayerIndicesUpdated(): void {
    this.executeIfActive(() => {
      this.proactivelyUpdateContainers('layer indices updated');
    });
  }

  /**
   * Proactively update containers with throttling to prevent excessive recalculations
   */
  private proactivelyUpdateContainers(reason: string): void {
    const now = Date.now();
    if (now - this.lastProactiveUpdate < ContainerManager.PROACTIVE_UPDATE_THROTTLE_MS) {
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`🔄 ContainerManager: Throttling proactive update (${reason}) - last update was ${now - this.lastProactiveUpdate}ms ago`);
      }
      return;
    }
    
    this.lastProactiveUpdate = now;
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`🔄 ContainerManager: Proactively updating containers (${reason})...`);
    }
    this.updateContainersFromInventory();
  }

  private handleScrewCollected(): void {
    this.executeIfActive(() => {
      // When screws are collected, proactively update containers
      // This is less critical than layer updates but ensures consistency
      this.proactivelyUpdateContainers('screw collected');
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
        containers: this.getContainers() // Use getter to maintain proper order
      });
    });
  }

  // ========== ESSENTIAL UTILITY METHODS ==========

  /**
   * Get container by slot index (visual position)
   */
  private getContainerBySlotIndex(slotIndex: number): Container | null {
    if (slotIndex >= 0 && slotIndex < this.containerSlots.length) {
      return this.containerSlots[slotIndex];
    }
    return null;
  }

  /**
   * Create replacement containers with fade-in animation based on screw inventory
   */
  private createReplacementContainersWithFadeIn(screwInventory: Map<string, number>): void {
    // Calculate optimal container plan
    const newPlan = ContainerPlanner.calculateOptimalContainers(screwInventory);
    
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log('📋 Calculated replacement container plan:', newPlan);
    }
    
    // Find colors that need containers but don't have them
    const existingColors = new Set(this.containers.map(c => c.color));
    const neededColors = newPlan.containers.map(spec => spec.color);
    const missingColors = neededColors.filter(color => !existingColors.has(color));
    
    if (missingColors.length > 0) {
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`🎭 Creating fade-in containers for missing colors: ${missingColors.join(', ')}`);
      }
      
      // Add containers for missing colors with fade-in animation
      missingColors.forEach(color => {
        const spec = newPlan.containers.find(s => s.color === color);
        if (spec) {
          // Find first vacant slot
          const vacantSlotIndex = this.containerSlots.findIndex(slot => slot === null);
          if (vacantSlotIndex !== -1) {
            const container = this.createContainerFromSpecWithFadeIn(spec, vacantSlotIndex);
            
            // Add to both arrays
            this.containers.push(container);
            this.containerSlots[vacantSlotIndex] = container;
            
            if (DEBUG_CONFIG.logScrewDebug) {
              console.log(`✨ Added fade-in container for color ${color} with ${spec.holes} holes in slot ${vacantSlotIndex}`);
            }
          }
        }
      });
      
      // Position all containers
      this.repositionAllContainers();
      
      // Emit state update
      this.emit({
        type: 'container:state:updated',
        timestamp: Date.now(),
        containers: this.getContainers() // Use getter to maintain proper order
      });
    }
  }

  /**
   * Create a container from spec with fade-in animation
   */
  private createContainerFromSpecWithFadeIn(spec: { color: ScrewColor; holes: number }, index: number): Container {
    const containerHeight = UI_CONSTANTS.containers.height;
    const startY = UI_CONSTANTS.containers.startY;
    
    return {
      id: `container_replacement_${Date.now()}_${index}`,
      color: spec.color,
      position: {
        x: 0, // Will be positioned by repositionAllContainers
        y: startY + (containerHeight / 2)
      },
      holes: new Array(spec.holes).fill(null),
      reservedHoles: new Array(spec.holes).fill(null),
      maxHoles: spec.holes,
      isFull: false,
      // Fade-in animation properties
      fadeOpacity: 0.0, // Start invisible
      fadeStartTime: Date.now(), // Start fading in immediately
      fadeDuration: ANIMATION_CONSTANTS.container.fadeDuration,
      isFadingOut: false,
      isFadingIn: true, // Start with fade-in animation
    };
  }

  /**
   * Reposition all containers to their fixed slot positions
   */
  private repositionAllContainers(): void {
    const containerWidth = UI_CONSTANTS.containers.width;
    const containerHeight = UI_CONSTANTS.containers.height;
    const spacing = UI_CONSTANTS.containers.spacing;
    const startY = UI_CONSTANTS.containers.startY;
    
    // Calculate positions for all slots (not just filled ones)
    const totalSlotsWidth = (ContainerManager.MAX_CONTAINER_SLOTS * containerWidth) + 
                           ((ContainerManager.MAX_CONTAINER_SLOTS - 1) * spacing);
    const startX = (this.virtualGameWidth - totalSlotsWidth) / 2;

    // Position each container in its slot
    this.containerSlots.forEach((container, slotIndex) => {
      if (container) {
        const containerLeftX = startX + (slotIndex * (containerWidth + spacing));
        const containerCenterX = containerLeftX + (containerWidth / 2);
        
        container.position.x = containerCenterX;
        container.position.y = startY + (containerHeight / 2);
      }
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

  // ========== BURST EFFECT METHODS ==========

  /**
   * Check if this was the last container removal and trigger burst effect if needed
   */
  private checkForLastContainerRemoval(): void {
    // Check if there are any remaining containers
    const remainingContainers = this.containers.filter(c => !c.isMarkedForRemoval);
    
    if (remainingContainers.length === 0) {
      if (DEBUG_CONFIG.logLevelCompletionEffects) {
        console.log('🎆 Last container removed - triggering burst effect!');
      }
      
      // Create and start the burst effect at center of canvas
      const centerPosition = {
        x: this.virtualGameWidth / 2,
        y: this.virtualGameHeight / 2
      };
      this.burstEffect = new LevelCompletionBurstEffect({
        burstRadius: 300, // Double the burst radius for double velocity (was 150)
        sparkleRadius: 240, // Double the sparkle radius to match (was 120)
        burstParticleCount: 40, // Double the burst particles (was 20)
        sparkleParticleCount: 100 // Double the sparkle particles (was 50)
      });
      this.burstEffect.start(centerPosition);
      
      // Emit burst started event
      this.emit({
        type: 'level:completion:burst:started',
        timestamp: Date.now(),
        position: centerPosition,
        duration: ANIMATION_CONSTANTS.levelCompletion.burstDuration
      } as LevelCompletionBurstStartedEvent);
      
      // Trigger haptic feedback for level completion
      HapticUtils.trigger('level_complete');
      
      // Emit container all removed event
      this.emit({
        type: 'container:all_removed',
        timestamp: Date.now()
      } as ContainerAllRemovedEvent);
    }
  }

  /**
   * Update the burst effect animation
   */
  private updateBurstEffect(deltaTime: number): void {
    if (this.burstEffect && this.burstEffect.isActive()) {
      const isComplete = this.burstEffect.update(deltaTime);
      
      if (isComplete) {
        if (DEBUG_CONFIG.logLevelCompletionEffects) {
          console.log('🎆 Burst effect completed');
        }
        
        // Emit burst completed event
        this.emit({
          type: 'level:completion:burst:completed',
          timestamp: Date.now(),
          position: { x: 0, y: 0 } // Position not needed for completion event
        });
        
        // Clean up the effect
        this.burstEffect = null;
      }
    }
  }

  /**
   * Render the burst effect if active
   * This method should be called by the render system
   */
  public renderBurstEffect(ctx: CanvasRenderingContext2D): void {
    if (this.burstEffect && this.burstEffect.isActive()) {
      this.burstEffect.render(ctx);
    }
  }

  /**
   * Manually trigger the burst effect for debug purposes
   * Used when triggering level completion via debug key
   */
  public triggerDebugBurstEffect(): void {
    if (DEBUG_CONFIG.logLevelCompletionEffects) {
      console.log('🎆 Debug: Manually triggering burst effect');
    }
    
    // Get center position for the effect (center of screen)
    const centerPosition = {
      x: this.virtualGameWidth / 2,
      y: this.virtualGameHeight / 2
    };
    
    // Create and start the burst effect with doubled values
    this.burstEffect = new LevelCompletionBurstEffect({
      burstRadius: 300, // Double the burst radius for double velocity
      sparkleRadius: 240, // Double the sparkle radius to match
      burstParticleCount: 40, // Double the burst particles
      sparkleParticleCount: 100 // Double the sparkle particles
    });
    this.burstEffect.start(centerPosition);
    
    // Emit burst started event
    this.emit({
      type: 'level:completion:burst:started',
      timestamp: Date.now(),
      position: centerPosition,
      duration: ANIMATION_CONSTANTS.levelCompletion.burstDuration
    } as LevelCompletionBurstStartedEvent);
    
    // Trigger haptic feedback for level completion
    HapticUtils.trigger('level_complete');
  }

  /**
   * Check if burst effect is currently active
   * Used for debug logging
   */
  public isBurstEffectActive(): boolean {
    return this.burstEffect !== null && this.burstEffect.isActive();
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
    // Return only non-null containers from slots, maintaining their visual order
    return this.containerSlots.filter((container): container is Container => container !== null);
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