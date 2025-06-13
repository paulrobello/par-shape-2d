/**
 * Holding hole management system
 * Handles holding hole creation, positioning, state management, and screw transfers
 */

import { BaseSystem } from '../BaseSystem';
import { HoldingHole, ScrewColor } from '@/types/game';
import { GAME_CONFIG, UI_CONSTANTS, DEBUG_CONFIG } from '@/shared/utils/Constants';
import {
  HoldingHoleFilledEvent,
  ScrewTransferStartedEvent,
  ScrewTransferCompletedEvent,
  ScrewTransferFailedEvent,
  HoldingHolesCheckTransfersEvent,
  ContainerRemovingScrewsEvent,
  BoundsChangedEvent
} from '../../events/EventTypes';

export class HoldingHoleManager extends BaseSystem {
  private holdingHoles: HoldingHole[] = [];
  private virtualGameWidth = GAME_CONFIG.canvas.width;
  private virtualGameHeight = GAME_CONFIG.canvas.height;

  constructor() {
    super('HoldingHoleManager');
  }

  protected async onInitialize(): Promise<void> {
    this.setupEventHandlers();
    
    // Perform one-time cleanup of any stale screw references from previous sessions
    this.cleanupStaleReferences();
  }

  private setupEventHandlers(): void {
    // Holding hole events
    this.subscribe('holding_hole:filled', this.handleHoldingHoleFilled.bind(this));
    this.subscribe('holding_holes:check_transfers', this.handleCheckTransfers.bind(this));
    
    // Container events
    this.subscribe('container:removing:screws', this.handleContainerRemovingScrews.bind(this));
    
    // Bounds events
    this.subscribe('bounds:changed', this.handleBoundsChanged.bind(this));
    
    // Transfer events
    this.subscribe('screw:transfer:started', this.handleScrewTransferStarted.bind(this));
    this.subscribe('screw:transfer:completed', this.handleScrewTransferCompleted.bind(this));
    this.subscribe('screw:transfer:failed', this.handleScrewTransferFailed.bind(this));
  }

  private handleHoldingHoleFilled(event: HoldingHoleFilledEvent): void {
    this.executeIfActive(() => {
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`📥 HoldingHoleManager: RECEIVED holding_hole:filled event for hole ${event.holeIndex}, screwId: ${event.screwId || 'null'}`);
      }
      const { holeIndex, screwId } = event;
      
      if (holeIndex >= 0 && holeIndex < this.holdingHoles.length) {
        const hole = this.holdingHoles[holeIndex];
        
        const wasFullBefore = this.isHoldingAreaFull();
        
        if (screwId === null) {
          // Screw was transferred out of hole (hole now empty)
          hole.screwId = null;
          hole.screwColor = undefined; // Clear the stored color
          console.log(`🕳️ Holding hole ${holeIndex} is now empty`);
          
          // If holes were full before but not anymore, cancel the timer
          if (wasFullBefore && !this.isHoldingAreaFull()) {
            console.log(`✅ Holding holes no longer full - cancelling game over timer`);
            this.emit({
              type: 'holding_holes:available',
              timestamp: Date.now()
            });
          }
        } else {
          // Screw was placed in hole
          hole.screwId = screwId;
          hole.screwColor = event.screwColor; // Store the screw color from the event
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`✅ HoldingHoleManager: Placed screw ${screwId} (color: ${event.screwColor}) in holding hole ${holeIndex}`);
          }
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`🏠 HoldingHoleManager: Total screws in holding holes:`, this.holdingHoles.filter(h => h.screwId !== null).length);
          }
          
          if (this.isHoldingAreaFull()) {
            this.emit({
              type: 'holding_holes:full',
              timestamp: Date.now(),
              countdown: 5000 // 5 second countdown
            });
          }
        }
        
        // Emit holding hole state update
        this.emit({
          type: 'holding_hole:state:updated',
          timestamp: Date.now(),
          holdingHoles: this.holdingHoles
        });
      }
    });
  }

  private handleScrewTransferStarted(event: ScrewTransferStartedEvent): void {
    this.executeIfActive(() => {
      const { fromHoleIndex, screwId } = event;
      
      // Clear the holding hole immediately when transfer starts to free it up for other screws
      if (fromHoleIndex >= 0 && fromHoleIndex < this.holdingHoles.length) {
        const hole = this.holdingHoles[fromHoleIndex];
        const wasFullBefore = this.isHoldingAreaFull();
        
        if (hole.screwId === screwId) {
          // Clear the holding hole immediately to free it up
          hole.screwId = null;
          hole.screwColor = undefined;
          
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`🚀 HoldingHoleManager: Transfer started - immediately cleared holding hole ${fromHoleIndex} for screw ${screwId}`);
          }
          
          // If holes were full before but not anymore, cancel the timer
          if (wasFullBefore && !this.isHoldingAreaFull()) {
            console.log(`✅ Holding holes no longer full after transfer start - cancelling game over timer`);
            this.emit({
              type: 'holding_holes:available',
              timestamp: Date.now()
            });
          }
          
          // Emit holding hole state update
          this.emit({
            type: 'holding_hole:state:updated',
            timestamp: Date.now(),
            holdingHoles: this.holdingHoles
          });
        } else if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`⚠️ HoldingHoleManager: Transfer started but hole ${fromHoleIndex} contains different screw (${hole.screwId} vs ${screwId})`);
        }
      }
    });
  }

  private handleScrewTransferCompleted(event: ScrewTransferCompletedEvent): void {
    this.executeIfActive(() => {
      const { screwId } = event;
      
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`✅ HoldingHoleManager: Transfer completed for screw ${screwId}`);
        console.log(`ℹ️ Holding hole was already cleared when transfer started`);
      }
      
      // The holding hole was already cleared in handleScrewTransferStarted
      // This is just a completion notification - no action needed
      // The hole is already available for other screws to use
    });
  }

  private handleScrewTransferFailed(event: ScrewTransferFailedEvent): void {
    this.executeIfActive(() => {
      const { screwId, reason, fromHoleIndex } = event;
      
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`❌ HoldingHoleManager: Transfer failed for screw ${screwId}: ${reason}`);
        console.log(`🔄 Need to restore screw to holding hole since we cleared it optimistically`);
      }
      
      // Since we cleared the holding hole optimistically when transfer started,
      // we need to restore the screw to a holding hole when transfer fails
      let targetHoleIndex = fromHoleIndex;
      
      // Check if original hole is still available
      if (fromHoleIndex >= 0 && fromHoleIndex < this.holdingHoles.length) {
        const originalHole = this.holdingHoles[fromHoleIndex];
        if (originalHole.screwId !== null) {
          // Original hole is occupied, find any available hole
          targetHoleIndex = this.holdingHoles.findIndex(h => h.screwId === null);
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`⚠️ Original hole ${fromHoleIndex} is occupied, using hole ${targetHoleIndex}`);
          }
        }
      } else {
        // Invalid original hole index, find any available hole
        targetHoleIndex = this.holdingHoles.findIndex(h => h.screwId === null);
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`⚠️ Invalid original hole ${fromHoleIndex}, using hole ${targetHoleIndex}`);
        }
      }
      
      if (targetHoleIndex >= 0) {
        // Restore the screw to the available holding hole
        // We need to emit a holding_hole:filled event to properly restore the screw
        this.emit({
          type: 'holding_hole:filled',
          timestamp: Date.now(),
          source: 'HoldingHoleManager',
          holeIndex: targetHoleIndex,
          screwId: screwId,
          // Note: screwColor will be set by the ScrewManager when it handles this event
        });
        
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`🔄 Restored screw ${screwId} to holding hole ${targetHoleIndex} after failed transfer`);
        }
      } else {
        console.error(`❌ No available holding holes to restore failed transfer screw ${screwId}!`);
        // The screw will remain in limbo - this is a critical error that should be rare
      }
    });
  }

  private handleCheckTransfers(event: HoldingHolesCheckTransfersEvent): void {
    void event;
    this.executeIfActive(() => {
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`🔄 HoldingHoleManager: Received check_transfers event - attempting automatic transfers`);
      }
      
      // Trigger automatic transfers from holding holes to available containers
      this.tryTransferFromHoldingHoles();
    });
  }

  private handleContainerRemovingScrews(event: ContainerRemovingScrewsEvent): void {
    this.executeIfActive(() => {
      const { screwIds } = event;
      
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`🧹 HoldingHoleManager: Container being removed with screws:`, screwIds);
        console.log(`🔍 Checking holding holes for stale references to these screws...`);
      }
      
      let clearedCount = 0;
      const wasFullBefore = this.isHoldingAreaFull();
      
      // Clear any holding holes that contain screws being removed with the container
      this.holdingHoles.forEach((hole, index) => {
        if (hole.screwId && screwIds.includes(hole.screwId)) {
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`🧹 Clearing holding hole ${index} - contained screw ${hole.screwId} that was removed with container`);
          }
          
          hole.screwId = null;
          hole.screwColor = undefined;
          clearedCount++;
        }
      });
      
      if (clearedCount > 0) {
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`✅ HoldingHoleManager: Cleared ${clearedCount} holding holes with stale screw references`);
        }
        
        // If holes were full before but not anymore, emit available event
        if (wasFullBefore && !this.isHoldingAreaFull()) {
          console.log(`✅ Holding holes no longer full after clearing stale references - emitting available event`);
          this.emit({
            type: 'holding_holes:available',
            timestamp: Date.now()
          });
        }
        
        // Emit holding hole state update
        this.emit({
          type: 'holding_hole:state:updated',
          timestamp: Date.now(),
          holdingHoles: this.holdingHoles
        });
      } else if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`ℹ️ HoldingHoleManager: No stale references found for removed screws`);
      }
    });
  }

  private handleBoundsChanged(event: BoundsChangedEvent): void {
    this.executeIfActive(() => {
      this.virtualGameWidth = event.width;
      this.virtualGameHeight = event.height;
      console.log(`HoldingHoleManager: Updated virtual dimensions to ${event.width}x${event.height}`);
      this.recalculateHoldingHolePositions(event.width, event.height);
    });
  }

  // Holding hole management methods
  public initializeHoldingHoles(virtualGameWidth?: number, virtualGameHeight?: number): void {
    const currentWidth = virtualGameWidth || this.virtualGameWidth;
    void virtualGameHeight; // Unused parameter
    
    const holeRadius = UI_CONSTANTS.holdingHoles.radius;
    const spacing = UI_CONSTANTS.holdingHoles.spacing;
    const startY = UI_CONSTANTS.holdingHoles.startY;
    const holeCount = GAME_CONFIG.holdingHoles.count;
    
    const totalWidth = (holeCount * holeRadius * 2) + ((holeCount - 1) * spacing);
    const startX = (currentWidth - totalWidth) / 2;

    this.holdingHoles = Array.from({ length: holeCount }, (_, index) => ({
      id: `holding-${index}`,
      position: { 
        x: startX + (index * (holeRadius * 2 + spacing)) + holeRadius,
        y: startY 
      },
      screwId: null,
    }));
    
    // Emit holding hole state update
    this.emit({
      type: 'holding_hole:state:updated',
      timestamp: Date.now(),
      holdingHoles: this.holdingHoles
    });
    
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`🕳️ HoldingHoleManager: Initialized ${this.holdingHoles.length} holding holes and emitted holding_hole:state:updated`);
    }
  }

  private isHoldingAreaFull(): boolean {
    return this.holdingHoles.every(hole => hole.screwId !== null);
  }

  private recalculateHoldingHolePositions(virtualGameWidth?: number, virtualGameHeight?: number): void {
    void virtualGameHeight; // Currently unused
    const currentWidth = virtualGameWidth || this.virtualGameWidth;

    // Recalculate holding hole positions
    if (this.holdingHoles.length > 0) {
      const holeRadius = UI_CONSTANTS.holdingHoles.radius;
      const spacing = UI_CONSTANTS.holdingHoles.spacing;
      const startY = UI_CONSTANTS.holdingHoles.startY;
      
      const totalWidth = (this.holdingHoles.length * holeRadius * 2) + ((this.holdingHoles.length - 1) * spacing);
      const startX = (currentWidth - totalWidth) / 2;

      this.holdingHoles.forEach((hole, index) => {
        hole.position.x = startX + (index * (holeRadius * 2 + spacing)) + holeRadius;
        hole.position.y = startY;
      });
    }
    
    // Emit updated state
    this.emit({
      type: 'holding_hole:state:updated',
      timestamp: Date.now(),
      holdingHoles: this.holdingHoles
    });
  }

  /**
   * Try to automatically transfer screws from holding holes to available containers
   * This helps ensure all screws get properly processed for level completion
   */
  public tryTransferFromHoldingHoles(): void {
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`[AUTO_TRANSFER] Attempting to transfer screws from holding holes to containers`);
      console.log(`[AUTO_TRANSFER] Current holding holes state:`, this.holdingHoles.map((h, i) => ({
        index: i,
        id: h.id,
        screwId: h.screwId,
        screwColor: h.screwColor,
        hasScrew: !!h.screwId
      })));
    }
    
    let transferRequestCount = 0;
    
    // Check each holding hole for screws that can be transferred
    this.holdingHoles.forEach((hole, holeIndex) => {
      if (!hole.screwId || !hole.screwColor) {
        if (DEBUG_CONFIG.logScrewDebug && hole.screwId && !hole.screwColor) {
          console.log(`⚠️ [AUTO_TRANSFER] Hole ${holeIndex} has screwId ${hole.screwId} but no screwColor!`);
        }
        return; // Skip empty holes
      }
      
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`🔄 [AUTO_TRANSFER] Requesting transfer for screw ${hole.screwId} (${hole.screwColor}) from hole ${holeIndex}`);
      }
      
      // Emit event to request transfer (GameState will handle finding available containers)
      this.emit({
        type: 'screw:transfer:request',
        timestamp: Date.now(),
        screwId: hole.screwId,
        screwColor: hole.screwColor,
        fromHoleIndex: holeIndex
      });
      
      transferRequestCount++;
    });
    
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`[AUTO_TRANSFER] Emitted ${transferRequestCount} transfer requests`);
    }
  }

  /**
   * Check if screw can be placed in any holding hole
   */
  public hasAvailableHoldingHole(): boolean {
    return this.holdingHoles.some(hole => hole.screwId === null);
  }

  /**
   * Find first available holding hole
   */
  public findAvailableHoldingHole(): number {
    const index = this.holdingHoles.findIndex(hole => hole.screwId === null);
    return index >= 0 ? index : -1;
  }

  /**
   * Get screw colors from holding holes
   */
  public getHoldingHoleColors(): ScrewColor[] {
    const colors: ScrewColor[] = [];
    
    this.holdingHoles.forEach(hole => {
      if (hole.screwColor) {
        colors.push(hole.screwColor);
      }
    });
    
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`[SCREW_COLORS] Holding hole colors:`, colors);
    }
    
    return colors;
  }

  /**
   * Clean up any stale screw references from previous game sessions
   * This addresses visual artifacts like red circles in holding holes
   */
  private cleanupStaleReferences(): void {
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`🧹 HoldingHoleManager: Starting cleanup of stale references from previous sessions`);
    }
    
    let clearedCount = 0;
    
    // Clear any holding holes that have screw references but whose screws no longer exist
    this.holdingHoles.forEach((hole, index) => {
      if (hole.screwId) {
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`🔍 Checking holding hole ${index} with screwId ${hole.screwId}`);
        }
        
        // Since we're in initialization, we assume any existing screw references are stale
        // from previous game sessions and should be cleared
        hole.screwId = null;
        hole.screwColor = undefined;
        clearedCount++;
        
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`🧹 Cleared stale reference in holding hole ${index}`);
        }
      }
    });
    
    if (clearedCount > 0) {
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`✅ HoldingHoleManager: Cleaned up ${clearedCount} stale references`);
      }
      
      // Emit holding hole state update to refresh the display
      this.emit({
        type: 'holding_hole:state:updated',
        timestamp: Date.now(),
        holdingHoles: this.holdingHoles
      });
    } else if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`ℹ️ HoldingHoleManager: No stale references found during cleanup`);
    }
  }

  // Public getter methods
  public getHoldingHoles(): HoldingHole[] {
    return [...this.holdingHoles];
  }

  public getHoldingHoleCount(): number {
    return this.holdingHoles.length;
  }

  public getScrewsInHoldingHoles(): number {
    return this.holdingHoles.filter(hole => hole.screwId !== null).length;
  }
}