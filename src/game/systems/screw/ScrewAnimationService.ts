/**
 * ScrewAnimationService - Handles all screw animation logic
 * Manages collection, transfer, and shake animations for screws
 */

import { Screw } from '@/game/entities/Screw';
import { EventBus } from '@/game/events/EventBus';
import { DEBUG_CONFIG } from '@/shared/utils/Constants';

export interface AnimationResult {
  completed: string[];
  screws: Screw[];
}

export interface IScrewAnimationService {
  updateCollectionAnimations(deltaTime: number): AnimationResult;
  updateTransferAnimations(deltaTime: number): AnimationResult;
  updateShakeAnimations(deltaTime: number): void;
  getAnimatingScrews(): Screw[];
}

export class ScrewAnimationService implements IScrewAnimationService {
  private screws: Map<string, Screw>;
  private eventBus: EventBus;
  private source: string;

  constructor(screws: Map<string, Screw>, eventBus: EventBus, source: string) {
    this.screws = screws;
    this.eventBus = eventBus;
    this.source = source;
  }

  /**
   * Updates collection animations for screws being collected
   */
  public updateCollectionAnimations(deltaTime: number): AnimationResult {
    const completedScrews: string[] = [];
    const collectedScrews: Screw[] = [];

    for (const screw of this.screws.values()) {
      if (screw.isBeingCollected) {
        const isComplete = screw.updateCollectionAnimation(deltaTime);
        if (isComplete) {
          completedScrews.push(screw.id);
          collectedScrews.push(screw);
          
          this.eventBus.emit({
            type: 'screw:animation:completed',
            timestamp: Date.now(),
            source: this.source,
            screw
          });
          
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`Screw ${screw.id} collection completed`);
          }
        }
      }
    }

    return { completed: completedScrews, screws: collectedScrews };
  }

  /**
   * Updates transfer animations for screws being transferred between containers
   */
  public updateTransferAnimations(deltaTime: number): AnimationResult {
    const completedTransfers: string[] = [];
    const transferredScrews: Screw[] = [];

    for (const screw of this.screws.values()) {
      if (screw.isBeingTransferred) {
        const isComplete = screw.updateTransferAnimation(deltaTime);
        if (isComplete) {
          completedTransfers.push(screw.id);
          transferredScrews.push(screw);
          
          // Log the transfer properties before emitting
          console.log(`📊 Transfer properties for ${screw.id}:`, {
            fromHoleIndex: screw.transferFromHoleIndex,
            toContainerIndex: screw.transferToContainerIndex,
            toHoleIndex: screw.transferToHoleIndex
          });
          
          this.eventBus.emit({
            type: 'screw:transfer:completed',
            timestamp: Date.now(),
            source: this.source,
            screwId: screw.id,
            fromHoleIndex: screw.transferFromHoleIndex ?? -1,
            toContainerIndex: screw.transferToContainerIndex ?? -1,
            toHoleIndex: screw.transferToHoleIndex ?? -1
          });
          
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`Screw ${screw.id} transfer animation completed`);
          }
        }
      }
    }

    return { completed: completedTransfers, screws: transferredScrews };
  }

  /**
   * Updates shake animations for blocked screws
   */
  public updateShakeAnimations(deltaTime: number): void {
    let shakingCount = 0;
    let hasActiveShaking = false;
    
    for (const screw of this.screws.values()) {
      if (screw.isShaking) {
        shakingCount++;
        hasActiveShaking = true;
        const wasComplete = screw.updateShakeAnimation(deltaTime);
        if (wasComplete) {
          if (DEBUG_CONFIG.logScrewDebug) {
            console.log(`📳 Shake animation completed for screw ${screw.id}`);
          }
        }
      }
    }
    
    // Emit event to update render data when there are active shake animations
    // This ensures the renderer gets the updated shakeOffset values
    if (hasActiveShaking) {
      this.eventBus.emit({
        type: 'screw:shake:updated',
        timestamp: Date.now(),
        source: this.source,
        shakingCount
      });
    }
    
    // Only log when there are shaking screws to avoid spam
    if (shakingCount > 0 && Date.now() % 1000 < 50) {
      if (DEBUG_CONFIG.logScrewDebug) {
        console.log(`📳 Updating ${shakingCount} shaking screws`);
      }
    }
  }

  /**
   * Gets all screws currently animating
   */
  public getAnimatingScrews(): Screw[] {
    return Array.from(this.screws.values()).filter(
      screw => (screw.isBeingCollected && !screw.isCollected) || screw.isBeingTransferred
    );
  }
}