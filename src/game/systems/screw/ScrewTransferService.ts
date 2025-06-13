/**
 * ScrewTransferService - Handles screw transfers between containers and holding holes
 * Manages destination finding, placement, and transfer animations
 */

import { Screw } from '@/game/entities/Screw';
import { Vector2, Container, HoldingHole } from '@/types/game';
import { EventBus } from '@/game/events/EventBus';
import { DEBUG_CONFIG } from '@/shared/utils/Constants';
import {
  findScrewDestination,
  calculateContainerHolePosition,
} from '@/game/utils/ScrewContainerUtils';

export interface IScrewTransferService {
  findScrewDestination(screw: Screw): { type: 'container' | 'holding_hole'; position: Vector2; id: string; holeIndex?: number } | null;
  placeScrewInDestination(screw: Screw): void;
  startScrewCollection(screwId: string, targetPosition: Vector2, destinationInfo?: { type: 'container' | 'holding_hole'; id: string; holeIndex?: number }, forceRemoval?: boolean): boolean;
  checkAllHoldingHolesForTransfers(): void;
  checkAndTransferFromHoldingHole(screw: Screw, holeIndex: number): void;
}

interface TransferState {
  screws: Map<string, Screw>;
  containers: Container[];
  holdingHoles: HoldingHole[];
  virtualGameWidth: number;
}

export class ScrewTransferService implements IScrewTransferService {
  private state: TransferState;
  private eventBus: EventBus;
  private source: string;

  constructor(state: TransferState, eventBus: EventBus, source: string) {
    this.state = state;
    this.eventBus = eventBus;
    this.source = source;
  }

  /**
   * Find a suitable destination for a screw (container or holding hole)
   */
  public findScrewDestination(screw: Screw): { type: 'container' | 'holding_hole'; position: Vector2; id: string; holeIndex?: number } | null {
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`🔍 Finding destination for screw ${screw.id} (color: ${screw.color})`);
      console.log(`🏠 Available containers:`, this.state.containers.map(c => ({
        id: c.id,
        color: c.color,
        holes: c.holes.map((screwId, index) => ({ index, screwId, filled: screwId !== null })),
        reservedHoles: c.reservedHoles ? c.reservedHoles.map((screwId, index) => ({ index, screwId, reserved: screwId !== null })) : 'UNDEFINED',
        isFull: c.isFull,
        maxHoles: c.maxHoles
      })));
      console.log(`🕳️ Available holding holes:`, this.state.holdingHoles.map((h, index) => ({
        index,
        id: h.id,
        screwId: h.screwId,
        filled: h.screwId !== null,
        screwColor: h.screwColor
      })));
    }
    
    const destination = findScrewDestination(
      screw,
      this.state.containers,
      this.state.holdingHoles,
      this.state.virtualGameWidth
    );
    
    if (!destination) {
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`❌ No available destination found for screw ${screw.id} (color: ${screw.color})`);
        console.log(`🔍 Destination search details:`);
        console.log(`   • Containers checked: ${this.state.containers.length}`);
        console.log(`   • Holding holes checked: ${this.state.holdingHoles.length}`);
      }
    }
    
    return destination;
  }

  /**
   * Place a screw in its destination after collection animation completes
   */
  public placeScrewInDestination(screw: Screw): void {
    if (!screw.targetPosition || !screw.targetType) {
      console.error(`❌ Cannot place screw ${screw.id} - missing targetPosition or targetType`);
      return;
    }

    if (DEBUG_CONFIG.logScrewPlacement && DEBUG_CONFIG.logScrewDebug) {
      console.log(`📍 Placing screw ${screw.id} in ${screw.targetType} (targetContainerId: ${screw.targetContainerId}, targetHoleIndex: ${screw.targetHoleIndex})`);
    }

    if (screw.targetType === 'holding_hole') {
      this.placeScrewInHoldingHole(screw);
    } else if (screw.targetType === 'container' && screw.targetHoleIndex !== undefined) {
      this.placeScrewInContainer(screw);
    }
  }

  /**
   * Start screw collection animation
   */
  public startScrewCollection(screwId: string, targetPosition: Vector2, destinationInfo?: { type: 'container' | 'holding_hole'; id: string; holeIndex?: number }, forceRemoval = false): boolean {
    const screw = this.state.screws.get(screwId);
    if (!screw || (!screw.isRemovable && !forceRemoval) || screw.isCollected || screw.isBeingCollected) {
      return false;
    }

    screw.startCollection(targetPosition);
    
    // Store destination info on the screw
    if (destinationInfo) {
      screw.targetContainerId = destinationInfo.id;
      screw.targetType = destinationInfo.type;
      screw.targetHoleIndex = destinationInfo.holeIndex;
    }
    
    this.eventBus.emit({
      type: 'screw:animation:started',
      timestamp: Date.now(),
      source: this.source,
      screw,
      targetPosition
    });
    
    return true;
  }

  /**
   * Check all holding holes for possible transfers to containers
   */
  public checkAllHoldingHolesForTransfers(): void {
    console.log(`🔍 Checking all holding holes for possible transfers...`);
    
    // Check each holding hole that has a screw
    this.state.holdingHoles.forEach((hole, holeIndex) => {
      if (hole.screwId) {
        // Find the screw object
        const screw = this.state.screws.get(hole.screwId);
        if (screw && !screw.isBeingTransferred && !screw.isBeingCollected) {
          // Check if this screw can transfer to a matching container
          this.checkAndTransferFromHoldingHole(screw, holeIndex);
        }
      }
    });
  }

  /**
   * Check if a screw in a holding hole can transfer to a matching container
   */
  public checkAndTransferFromHoldingHole(screw: Screw, holeIndex: number): void {
    // Find a matching container with available space
    const matchingContainer = this.state.containers.find(container => 
      container.color === screw.color && 
      !container.isFull &&
      container.holes.some((hole, idx) => hole === null && container.reservedHoles[idx] === null)
    );
    
    if (matchingContainer) {
      const containerIndex = this.state.containers.indexOf(matchingContainer);
      // Find first hole that is both empty AND not reserved
      const emptyHoleIndex = matchingContainer.holes.findIndex((hole, idx) => 
        hole === null && matchingContainer.reservedHoles[idx] === null
      );
      
      if (emptyHoleIndex !== -1) {
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`🔄 Found matching container for screw ${screw.id} (${screw.color}) - transferring from holding hole ${holeIndex} to container ${containerIndex} hole ${emptyHoleIndex}`);
        }
        
        // Reserve the container hole immediately
        matchingContainer.reservedHoles[emptyHoleIndex] = screw.id;
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`📌 Reserved container ${containerIndex} hole ${emptyHoleIndex} for screw ${screw.id}`);
        }
        
        // Calculate positions for animation
        const fromPosition = this.state.holdingHoles[holeIndex].position;
        const toPosition = calculateContainerHolePosition(containerIndex, emptyHoleIndex, this.state.virtualGameWidth, this.state.containers);
        
        // Start transfer animation
        this.eventBus.emit({
          type: 'screw:transfer:started',
          timestamp: Date.now(),
          source: this.source,
          screwId: screw.id,
          fromHoleIndex: holeIndex,
          toContainerIndex: containerIndex,
          toHoleIndex: emptyHoleIndex,
          fromPosition,
          toPosition
        });
        
        // Note: HoldingHoleManager will clear the holding hole immediately when transfer starts
        // This frees up the hole for other screws even while this screw is still animating
      }
    }
  }

  private placeScrewInHoldingHole(screw: Screw): void {
    // Find the holding hole by ID
    const holeIndex = this.state.holdingHoles.findIndex(h => h.id === screw.targetContainerId);
    const holdingHole = this.state.holdingHoles[holeIndex];
    
    if (holeIndex !== -1 && holdingHole) {
      // Clear the reservation
      if (holdingHole.reservedBy === screw.id) {
        holdingHole.reservedBy = undefined;
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`Cleared reservation for screw ${screw.id} in holding hole ${holdingHole.id}`);
        }
      }
      
      // Emit event to place screw in holding hole
      this.eventBus.emit({
        type: 'holding_hole:filled',
        timestamp: Date.now(),
        source: this.source,
        holeIndex,
        screwId: screw.id,
        screwColor: screw.color
      });
      
      if (DEBUG_CONFIG.logScrewPlacement && DEBUG_CONFIG.logScrewDebug) {
        console.log(`✅ Placed screw ${screw.id} in holding hole ${holeIndex}`);
      }
      
      // Check if there's now a matching container available
      this.checkAndTransferFromHoldingHole(screw, holeIndex);
    } else {
      console.error(`❌ Failed to find holding hole for screw ${screw.id} - holeIndex: ${holeIndex}`);
    }
  }

  private placeScrewInContainer(screw: Screw): void {
    // Find the container by ID
    const container = this.state.containers.find(c => c.id === screw.targetContainerId);
    const containerIndex = container ? this.state.containers.indexOf(container) : -1;
    
    if (container && containerIndex !== -1 && screw.targetHoleIndex !== undefined) {
      // Clear the reservation
      if (container.reservedHoles[screw.targetHoleIndex] === screw.id) {
        container.reservedHoles[screw.targetHoleIndex] = null;
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`Cleared reservation for screw ${screw.id} in container ${container.id} hole ${screw.targetHoleIndex}`);
        }
      }
      
      // Place the screw ID in the specific hole
      container.holes[screw.targetHoleIndex] = screw.id;
      
      // Check if container is now full
      const filledCount = container.holes.filter(h => h !== null).length;
      if (filledCount === container.maxHoles) {
        container.isFull = true;
        
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`Container ${container.id} is now full with ${filledCount} screws`);
        }
        
        // Emit container filled event
        this.eventBus.emit({
          type: 'container:filled',
          timestamp: Date.now(),
          source: this.source,
          containerIndex,
          color: container.color,
          screws: container.holes.filter(id => id !== null) as string[]
        });
      }
      
      // Update container state
      this.eventBus.emit({
        type: 'container:state:updated',
        timestamp: Date.now(),
        source: this.source,
        containers: this.state.containers
      });
      
      if (DEBUG_CONFIG.logScrewPlacement && DEBUG_CONFIG.logScrewDebug) {
        console.log(`✅ Placed screw ${screw.id} in container ${containerIndex} hole ${screw.targetHoleIndex} (${filledCount}/${container.maxHoles} filled)`);
      }
    } else {
      console.error(`❌ Failed to find container for screw ${screw.id}`);
    }
  }
}