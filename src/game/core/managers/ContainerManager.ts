/**
 * Container management system
 * Handles container creation, positioning, state management, and removal
 */

import { BaseSystem } from '../BaseSystem';
import { Container, ScrewColor, Screw as ScrewInterface } from '@/types/game';
import { GAME_CONFIG, UI_CONSTANTS, DEBUG_CONFIG } from '@/shared/utils/Constants';
import { getRandomScrewColors, getRandomColorsFromList } from '@/game/utils/Colors';
import { ContainerStrategyManager } from '../../utils/ContainerStrategyManager';
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
  private availableScrewColors: ScrewColor[] = [];
  private containerStrategy: ContainerStrategyManager;

  constructor() {
    super('ContainerManager');
    this.containerStrategy = new ContainerStrategyManager();
  }

  protected async onInitialize(): Promise<void> {
    this.setupEventHandlers();
    await this.containerStrategy.initialize();
  }

  private setupEventHandlers(): void {
    // Container events
    this.subscribe('container:filled', this.handleContainerFilled.bind(this));
    
    // Transfer events
    this.subscribe('screw:transfer:completed', this.handleScrewTransferCompleted.bind(this));
    this.subscribe('screw:transfer:failed', this.handleScrewTransferFailed.bind(this));
    this.subscribe('screw:transfer:color_check', this.handleScrewTransferColorCheck.bind(this));
    
    // Bounds events
    this.subscribe('bounds:changed', this.handleBoundsChanged.bind(this));
    
    // Layer events for color updates
    this.subscribe('layers:updated', this.handleLayersUpdated.bind(this));
  }

  private handleContainerFilled(event: ContainerFilledEvent): void {
    this.executeIfActive(() => {
      const container = this.containers[event.containerIndex];
      if (container && container.isFull && !container.isMarkedForRemoval) {
        console.log(`Container ${container.id} filled - marking for removal`);
        
        // Note: Progress tracking handled by ProgressTracker.ts
        
        // Emit event to clear any holding holes containing screws from this container
        this.emit({
          type: 'container:removing:screws',
          timestamp: Date.now(),
          containerIndex: event.containerIndex,
          screwIds: event.screws
        });
        
        this.markContainerForRemoval(container.id);
      }
    });
  }

  private handleScrewTransferCompleted(event: ScrewTransferCompletedEvent): void {
    this.executeIfActive(() => {
      const { screwId, toContainerIndex, toHoleIndex } = event;
      
      if (toContainerIndex >= 0 && toContainerIndex < this.containers.length) {
        const container = this.containers[toContainerIndex];
        
        if (toHoleIndex >= 0 && toHoleIndex < container.maxHoles) {
          // Clear the reservation and place the screw in the actual hole
          container.reservedHoles[toHoleIndex] = null;
          container.holes[toHoleIndex] = screwId;
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`Completed transfer of screw ${screwId} to container ${container.id} hole ${toHoleIndex}`);
          }
          
          // Check if container is now full
          if (container.holes.filter(h => h !== null).length === container.maxHoles) {
            container.isFull = true;
            this.markContainerForRemoval(container.id);
            
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
      console.log(`ContainerManager: Updated virtual dimensions to ${event.width}x${event.height}`);
      this.recalculateContainerPositions(event.width, event.height);
    });
  }

  private handleLayersUpdated(event: import('../../events/EventTypes').LayersUpdatedEvent): void {
    this.executeIfActive(() => {
      // Get colors from all visible screws (visible layers + holding holes)
      const visibleScrewColors = this.getVisibleScrewColors(event.visibleLayers);
      
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`ContainerManager: Layers updated, visible screw colors:`, visibleScrewColors);
      }

      // Update available colors for future container replacements
      this.updateAvailableScrewColors(visibleScrewColors);
      
      // Update ContainerStrategyManager with current state
      this.containerStrategy.updateContainerState(this.containers, []);
    });
  }


  // Container Management Methods
  public initializeContainers(activeScrewColors?: ScrewColor[], virtualGameWidth?: number, virtualGameHeight?: number): void {
    void virtualGameHeight; // Currently unused
    
    // Get real-time screw data to determine optimal container configuration
    this.emit({
      type: 'remaining:screws:requested',
      timestamp: Date.now(),
      callback: (screwsByColor: Map<string, number>) => {
        this.createInitialContainersWithOptimalHoles(screwsByColor, activeScrewColors, virtualGameWidth);
      }
    });
  }

  private createInitialContainersWithOptimalHoles(screwsByColor: Map<string, number>, activeScrewColors?: ScrewColor[], virtualGameWidth?: number): void {
    let colors: ScrewColor[];

    // Get colors from available screws (this includes holding hole screws from screwsByColor)
    const availableScrewColors = Array.from(screwsByColor.keys()).filter(color => screwsByColor.get(color)! > 0) as ScrewColor[];
    
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`🎨 ContainerManager: Available screw colors from all sources:`, availableScrewColors);
      console.log(`🎨 ContainerManager: Active screw colors from shapes:`, activeScrewColors);
      console.log(`🎨 ContainerManager: Screw counts by color:`, Array.from(screwsByColor.entries()));
    }
    
    // At game start, screwsByColor might be empty because screws are still being initialized
    // Fall back to activeScrewColors from layer shapes in that case
    if (availableScrewColors.length === 0 && activeScrewColors && activeScrewColors.length > 0) {
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`🎨 ContainerManager: Using active screw colors from shapes for initial containers (screw data not yet available)`);
      }
      // Use the same smart logic as replacement containers - prioritize colors from shapes
      if (activeScrewColors.length >= GAME_CONFIG.containers.count) {
        colors = getRandomColorsFromList(activeScrewColors, GAME_CONFIG.containers.count);
      } else {
        colors = [...activeScrewColors];
        const remainingSlots = GAME_CONFIG.containers.count - colors.length;
        if (remainingSlots > 0) {
          const additionalColors = getRandomScrewColors(remainingSlots);
          colors.push(...additionalColors.filter(c => !colors.includes(c)));
        }
      }
    } else if (availableScrewColors.length >= GAME_CONFIG.containers.count) {
      // Sort by screw count to prioritize colors with more screws
      const sortedColors = availableScrewColors.sort((a, b) => {
        const countA = screwsByColor.get(a) || 0;
        const countB = screwsByColor.get(b) || 0;
        return countB - countA; // Descending order
      });
      colors = sortedColors.slice(0, GAME_CONFIG.containers.count);
    } else if (availableScrewColors.length > 0) {
      // Use all available colors and fill remaining slots randomly
      colors = [...availableScrewColors];
      const remainingSlots = GAME_CONFIG.containers.count - colors.length;
      if (remainingSlots > 0) {
        const additionalColors = getRandomScrewColors(remainingSlots);
        colors.push(...additionalColors.filter(c => !colors.includes(c)));
      }
    } else if (activeScrewColors && activeScrewColors.length >= GAME_CONFIG.containers.count) {
      colors = getRandomColorsFromList(activeScrewColors, GAME_CONFIG.containers.count);
    } else {
      colors = getRandomScrewColors(GAME_CONFIG.containers.count);
    }

    const currentWidth = virtualGameWidth || this.virtualGameWidth;

    const containerWidth = UI_CONSTANTS.containers.width;
    const containerHeight = UI_CONSTANTS.containers.height;
    const spacing = UI_CONSTANTS.containers.spacing;
    const startY = UI_CONSTANTS.containers.startY;
    const totalContainersWidth = (GAME_CONFIG.containers.count * containerWidth) + ((GAME_CONFIG.containers.count - 1) * spacing);
    const startX = (currentWidth - totalContainersWidth) / 2;

    this.containers = colors.map((color, index) => {
      const containerLeftX = startX + (index * (containerWidth + spacing));
      const containerCenterX = containerLeftX + (containerWidth / 2);
      
      // Calculate optimal holes based on actual screw count (1-3 holes)
      const totalScrewsOfColor = screwsByColor.get(color) || 0;
      // At game start, if screw data isn't available yet, use a reasonable default of 2 holes
      // This will be corrected later when containers are replaced based on actual screw counts
      const optimalHoles = totalScrewsOfColor > 0 
        ? Math.min(3, Math.max(1, totalScrewsOfColor))
        : 2; // Default for initial containers when screw data not yet available
      
      console.log(`🏭 Creating container ${index}: leftX=${containerLeftX}, centerX=${containerCenterX}, width=${containerWidth}, color=${color}, holes=${optimalHoles} (for ${totalScrewsOfColor} screws)`);
      
      return {
        id: `container-${index}`,
        color,
        position: {
          x: containerCenterX,
          y: startY + (containerHeight / 2)
        },
        holes: new Array(optimalHoles).fill(null),
        reservedHoles: new Array(optimalHoles).fill(null),
        maxHoles: optimalHoles,
        isFull: false,
        // Fade animation properties
        fadeOpacity: 1.0,
        fadeStartTime: 0,
        fadeDuration: 500, // 0.5 seconds
        isFadingOut: false,
        isFadingIn: false,
      };
    });
    
    // Update ContainerStrategyManager with new state
    this.containerStrategy.updateContainerState(this.containers, []);
    
    // Emit container state update
    this.emit({
      type: 'container:state:updated',
      timestamp: Date.now(),
      containers: this.containers
    });
    
    // Trigger automatic transfers from holding holes to new containers
    this.emit({
      type: 'holding_holes:check_transfers',
      timestamp: Date.now()
    });
    
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`🏭 ContainerManager: Initialized ${this.containers.length} containers with optimal holes and emitted container:state:updated`);
    }
  }

  public findAvailableContainer(color: ScrewColor): Container | null {
    return this.containers.find(container => {
      if (container.color !== color || container.isFull) return false;
      return this.getAvailableHoleCount(container.id) > 0;
    }) || null;
  }

  public addScrewToContainer(containerId: string, screw: ScrewInterface): boolean {
    const container = this.containers.find(c => c.id === containerId);
    if (!container || container.isFull) return false;

    const reservedIndex = container.reservedHoles.findIndex(id => id === screw.id);

    if (reservedIndex !== -1) {
      if (container.holes[reservedIndex] !== null) {
        console.error(`Reserved hole ${reservedIndex} is already occupied!`);
        return false;
      }
      container.holes[reservedIndex] = screw.id;
      container.reservedHoles[reservedIndex] = null;
    } else {
      const emptyHoleIndex = this.getFirstEmptyHoleIndex(container);
      if (emptyHoleIndex === -1) return false;
      container.holes[emptyHoleIndex] = screw.id;
    }

    container.isFull = container.holes.every(hole => hole !== null);
    return true;
  }

  private markContainerForRemoval(containerId: string): void {
    const container = this.containers.find(c => c.id === containerId);
    if (container && container.isFull && !container.isMarkedForRemoval) {
      container.isMarkedForRemoval = true;
      container.removalTimer = 500; // Changed to match fade duration
      
      // Start fade-out animation
      container.isFadingOut = true;
      container.fadeStartTime = Date.now();
      if (DEBUG_CONFIG.logLayerDebug) {
        console.log(`🎭 Starting fade-out animation for container ${container.id} (opacity: ${container.fadeOpacity})`);
      }
      
      // Check if replacement is needed before creating new container
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`[CONTAINER_REMOVAL] Setting timeout to check replacement for container ${container.id} in 500ms`);
      }
      
      setTimeout(() => {
        // Find the container index BEFORE it's removed
        const currentContainerIndex = this.containers.findIndex(c => c.id === container.id);
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`[CONTAINER_REMOVAL] ⏰ Timeout fired! Checking replacement for container ${container.id}, current index: ${currentContainerIndex}`);
        }
        
        if (currentContainerIndex >= 0) {
          this.checkAndReplaceContainer(currentContainerIndex);
        } else {
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`[CONTAINER_REMOVAL] ❌ Container ${container.id} no longer exists in containers array`);
          }
        }
      }, 500); // 0.5 seconds for fade-out
    }
  }

  private checkAndReplaceContainer(containerIndex: number): void {
    if (containerIndex < 0 || containerIndex >= this.containers.length) return;

    const targetContainer = this.containers[containerIndex];
    
    // Safety check: Only replace containers that are actually marked for removal and full
    if (!targetContainer.isMarkedForRemoval || !targetContainer.isFull) {
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`[CONTAINER_STRATEGY] ⚠️ Skipping replacement for container ${targetContainer.id} - not marked for removal (${targetContainer.isMarkedForRemoval}) or not full (${targetContainer.isFull})`);
      }
      return;
    }

    // Get real-time screw data from ScrewManager
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`[CONTAINER_STRATEGY] Requesting remaining screw counts for smart replacement...`);
    }
    
    // Use the new event to get remaining screws by color
    this.emit({
      type: 'remaining:screws:requested',
      timestamp: Date.now(),
      callback: (screwsByColor: Map<string, number>) => {
        
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`[CONTAINER_STRATEGY] Container ${containerIndex} being replaced`);
          console.log(`[CONTAINER_STRATEGY] Remaining screws by color:`, Array.from(screwsByColor.entries()));
        }
        
        // Get available space (excluding container being removed)
        const spaceByColor = this.getAvailableSpaceByColor(containerIndex);
        
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`[CONTAINER_STRATEGY] Available space by color (excluding container ${containerIndex}):`, Array.from(spaceByColor.entries()));
        }
        
        // Find if any color needs additional space
        let needsReplacement = false;
        let priorityColor: ScrewColor | null = null;
        let maxNeed = 0;
        
        screwsByColor.forEach((count, color) => {
          const availableSpace = spaceByColor.get(color as ScrewColor) || 0;
          const need = count - availableSpace;
          
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`[CONTAINER_STRATEGY] Color ${color}: ${count} screws, ${availableSpace} available space, need: ${need}`);
          }
          
          // Only consider replacement needed if there are actually screws that need space
          // AND the need is significant (more than just 1 screw)
          if (need > 1) {
            needsReplacement = true;
            if (need > maxNeed) {
              maxNeed = need;
              priorityColor = color as ScrewColor;
            }
          } else if (need === 1) {
            // For single screw needs, only replace if there are no other containers of this color
            const otherContainersOfSameColor = this.containers.filter((c, idx) => 
              idx !== containerIndex && c.color === color && !c.isFull && !c.isMarkedForRemoval
            ).length;
            
            if (otherContainersOfSameColor === 0) {
              if (DEBUG_CONFIG.logScrewDebug) {
                console.log(`[CONTAINER_STRATEGY] Single screw need for ${color}, no other containers available - replacement needed`);
              }
              needsReplacement = true;
              if (need > maxNeed) {
                maxNeed = need;
                priorityColor = color as ScrewColor;
              }
            } else {
              if (DEBUG_CONFIG.logScrewDebug) {
                console.log(`[CONTAINER_STRATEGY] Single screw need for ${color}, but ${otherContainersOfSameColor} other containers available - no replacement needed`);
              }
            }
          }
        });
        
        // Additional check: If there are screws in holding holes that would be stranded without containers,
        // we need to create a replacement even if the basic need calculation says no replacement needed
        if (!needsReplacement || !priorityColor) {
          // Check for stranded holding hole screws before deciding no replacement is needed
          const remainingContainersAfterRemoval = this.containers.filter((c, idx) => 
            idx !== containerIndex && !c.isFull && !c.isMarkedForRemoval
          );
          
          // Check if removing this container would leave holding hole screws without options
          let hasStrandedHoldingHoleScrews = false;
          screwsByColor.forEach((count, color) => {
            if (count > 0) {
              const availableContainersForColor = remainingContainersAfterRemoval.filter(c => c.color === color).length;
              if (availableContainersForColor === 0) {
                if (DEBUG_CONFIG.logScrewDebug) {
                  console.log(`[CONTAINER_STRATEGY] Color ${color} has ${count} screws but no available containers after removal - stranded screws detected`);
                }
                hasStrandedHoldingHoleScrews = true;
                if (!priorityColor) {
                  priorityColor = color as ScrewColor;
                }
              }
            }
          });
          
          if (hasStrandedHoldingHoleScrews) {
            if (DEBUG_CONFIG.logScrewDebug) {
              console.log(`[CONTAINER_STRATEGY] Forcing replacement due to stranded holding hole screws`);
            }
            needsReplacement = true;
          }
        }
        
        if (!needsReplacement || !priorityColor) {
          // No replacement needed - just remove the container
          this.containers.splice(containerIndex, 1);
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`[CONTAINER_STRATEGY] No replacement needed - removed container`);
          }
          
          // Check if this was the last container
          if (this.containers.length === 0) {
            if (DEBUG_CONFIG.logScrewDebug) {
              console.log(`[CONTAINER_STRATEGY] Last container removed! Emitting event...`);
            }
            // Emit event for ProgressTracker to check win condition
            this.emit({
              type: 'container:all_removed',
              timestamp: Date.now()
            });
          }
          
          // Update strategy manager and emit events
          this.containerStrategy.updateContainerState(this.containers, []);
          this.emit({
            type: 'container:state:updated',
            timestamp: Date.now(),
            containers: this.containers
          });
        } else {
          // Create replacement with optimal holes (1-3 based on total screws of this color)
          const totalScrewsOfColor = screwsByColor.get(priorityColor) || 0;
          const optimalHoles = Math.min(3, Math.max(1, totalScrewsOfColor));
          
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`[CONTAINER_STRATEGY] Replacing with ${priorityColor} container (${optimalHoles} holes for ${totalScrewsOfColor} total screws, need: ${maxNeed})`);
          }
          
          const oldContainer = this.containers[containerIndex];
          
          // Safety check: Only abort if container has screws but is NOT marked for removal
          // If container is marked for removal, it's okay to replace it even with screws (they're being collected)
          const screwsInOldContainer = oldContainer.holes.filter(id => id !== null).length;
          if (screwsInOldContainer > 0 && !oldContainer.isMarkedForRemoval) {
            if (DEBUG_CONFIG.logScrewDebug) {
              console.log(`[CONTAINER_STRATEGY] ⚠️ Aborting replacement - container ${oldContainer.id} has ${screwsInOldContainer} screws but is not marked for removal!`);
            }
            return;
          }
          
          if (DEBUG_CONFIG.logScrewDebug && screwsInOldContainer > 0) {
            console.log(`[CONTAINER_STRATEGY] Replacing container ${oldContainer.id} with ${screwsInOldContainer} screws (container marked for removal - screws will be collected)`);
          }
          
          const optimalContainer = this.createOptimalContainerFromStrategy(priorityColor, optimalHoles, oldContainer.position);
          
          // Replace the container
          this.containers[containerIndex] = optimalContainer;
          
          // Update strategy manager
          this.containerStrategy.updateContainerState(this.containers, []);
          
          // Emit events
          this.emit({
            type: 'container:replaced',
            timestamp: Date.now(),
            containerIndex,
            oldColor: oldContainer.color,
            newColor: optimalContainer.color
          });
          
          this.emit({
            type: 'container:state:updated',
            timestamp: Date.now(),
            containers: this.containers
          });
          
          // Trigger automatic transfers from holding holes to the new container
          this.emit({
            type: 'holding_holes:check_transfers',
            timestamp: Date.now()
          });
        }
        
        // Clean up empty containers if all screws are collected
        this.cleanupEmptyContainers();
      }
    });
  }

  private createOptimalContainerFromStrategy(color: ScrewColor, holes: number, position: { x: number; y: number }): Container {
    const container: Container = {
      id: `container_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      color,
      position: { ...position },
      holes: Array(holes).fill(null),
      reservedHoles: Array(holes).fill(null),
      maxHoles: holes,
      isFull: false,
      fadeOpacity: 0,
      fadeStartTime: Date.now(),
      fadeDuration: 500,
      isFadingOut: false,
      isFadingIn: true
    };
    
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`[STRATEGY_CONTAINER] Created ${holes}-hole container for ${color} at position (${position.x}, ${position.y})`);
    }
    
    return container;
  }

  private getFirstEmptyHoleIndex(container: Container): number {
    for (let i = 0; i < container.maxHoles; i++) {
      if (!container.holes[i] && !container.reservedHoles[i]) {
        return i;
      }
    }
    return -1;
  }

  private getAvailableHoleCount(containerId: string): number {
    const container = this.containers.find(c => c.id === containerId);
    if (!container) return 0;

    let available = 0;
    for (let i = 0; i < container.maxHoles; i++) {
      if (!container.holes[i] && !container.reservedHoles[i]) {
        available++;
      }
    }
    return available;
  }

  private getAvailableSpaceByColor(excludeContainerIndex?: number): Map<ScrewColor, number> {
    const spaceByColor = new Map<ScrewColor, number>();
    
    this.containers.forEach((container, index) => {
      // Skip the container being removed
      if (excludeContainerIndex !== undefined && index === excludeContainerIndex) {
        return;
      }
      
      const availableSpace = this.getAvailableHoleCount(container.id);
      const currentSpace = spaceByColor.get(container.color) || 0;
      spaceByColor.set(container.color, currentSpace + availableSpace);
    });
    
    return spaceByColor;
  }

  private getVisibleScrewColors(visibleLayers: import('../../entities/Layer').Layer[]): ScrewColor[] {
    const colors = new Set<ScrewColor>();

    // Get colors from all screws on visible layers
    visibleLayers.forEach(layer => {
      layer.getAllShapes().forEach(shape => {
        shape.getAllScrews().forEach(screw => {
          if (!screw.isCollected) {
            colors.add(screw.color);
          }
        });
      });
    });

    return Array.from(colors);
  }

  private updateAvailableScrewColors(colors: ScrewColor[]): void {
    this.availableScrewColors = [...colors];
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`Updated available screw colors for container replacement:`, this.availableScrewColors);
    }
  }

  private recalculateContainerPositions(virtualGameWidth?: number, virtualGameHeight?: number): void {
    void virtualGameHeight; // Currently unused
    const currentWidth = virtualGameWidth || this.virtualGameWidth;

    // Recalculate container positions
    if (this.containers.length > 0) {
      const containerWidth = UI_CONSTANTS.containers.width;
      const containerHeight = UI_CONSTANTS.containers.height;
      const spacing = UI_CONSTANTS.containers.spacing;
      const startY = UI_CONSTANTS.containers.startY;
      const totalContainersWidth = (this.containers.length * containerWidth) + ((this.containers.length - 1) * spacing);
      const startX = (currentWidth - totalContainersWidth) / 2;

      this.containers.forEach((container, index) => {
        container.position.x = startX + (index * (containerWidth + spacing)) + (containerWidth / 2);
        container.position.y = startY + (containerHeight / 2);
      });
    }
    
    // Emit updated state
    this.emit({
      type: 'container:state:updated',
      timestamp: Date.now(),
      containers: this.containers
    });
  }

  private cleanupEmptyContainers(): void {
    // Get remaining screw colors from shapes
    this.emit({
      type: 'screw:colors:requested',
      timestamp: Date.now(),
      containerIndex: -1,
      existingColors: [],
      callback: (shapeScrewColors: ScrewColor[]) => {
        const allRemainingColors = [...shapeScrewColors];
        
        if (allRemainingColors.length === 0) {
          // No more screws - remove all empty containers
          const emptyContainers: number[] = [];
          this.containers.forEach((container, index) => {
            const filledHoles = container.holes.filter(hole => hole !== null).length;
            if (filledHoles === 0) {
              emptyContainers.push(index);
            }
          });
          
          // Remove empty containers from back to front to maintain indices
          for (let i = emptyContainers.length - 1; i >= 0; i--) {
            const containerIndex = emptyContainers[i];
            if (DEBUG_CONFIG.logScrewDebug) {
              console.log(`[CLEANUP] Removing empty container ${this.containers[containerIndex].id} at index ${containerIndex}`);
            }
            this.containers.splice(containerIndex, 1);
          }
          
          if (emptyContainers.length > 0) {
            // Update strategy manager and emit events
            this.containerStrategy.updateContainerState(this.containers, []);
            this.emit({
              type: 'container:state:updated',
              timestamp: Date.now(),
              containers: this.containers
            });
            
            if (DEBUG_CONFIG.logScrewDebug) {
              console.log(`[CLEANUP] Removed ${emptyContainers.length} empty containers, ${this.containers.length} containers remaining`);
            }
          }
        }
      }
    });
  }

  // Animation update method
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
            if (DEBUG_CONFIG.logLayerDebug) {
              console.log(`🎭 Fade-out completed for container ${container.id}`);
            }
          }
        } else if (container.isFadingIn) {
          // Fade from 0 to 1
          container.fadeOpacity = progress;
          
          if (progress >= 1) {
            container.isFadingIn = false;
            container.fadeOpacity = 1;
            console.log(`🎭 Fade-in completed for container ${container.id}`);
          }
        }
      }
    });
  }

  // Public getter methods
  public getContainers(): Container[] {
    return [...this.containers];
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