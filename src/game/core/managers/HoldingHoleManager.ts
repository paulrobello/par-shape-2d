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
  }

  private setupEventHandlers(): void {
    // Holding hole events
    this.subscribe('holding_hole:filled', this.handleHoldingHoleFilled.bind(this));
    
    // Bounds events
    this.subscribe('bounds:changed', this.handleBoundsChanged.bind(this));
    
    // Transfer events
    this.subscribe('screw:transfer:started', this.handleScrewTransferStarted.bind(this));
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
      const { fromHoleIndex } = event;
      
      // Clear the holding hole immediately when transfer starts
      if (fromHoleIndex >= 0 && fromHoleIndex < this.holdingHoles.length) {
        const hole = this.holdingHoles[fromHoleIndex];
        hole.screwId = null;
        hole.screwColor = undefined;
        
        if (DEBUG_CONFIG.logScrewDebug) {
          console.log(`🚀 HoldingHoleManager: Cleared holding hole ${fromHoleIndex} for transfer`);
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
    }
    
    // Check each holding hole for screws that can be transferred
    this.holdingHoles.forEach((hole, holeIndex) => {
      if (!hole.screwId || !hole.screwColor) {
        return; // Skip empty holes
      }
      
      // Emit event to request transfer (ContainerManager will handle finding available containers)
      this.emit({
        type: 'screw:transfer:request',
        timestamp: Date.now(),
        screwId: hole.screwId,
        screwColor: hole.screwColor,
        fromHoleIndex: holeIndex
      });
    });
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