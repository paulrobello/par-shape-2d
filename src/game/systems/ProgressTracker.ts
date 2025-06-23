/**
 * Progress tracking system that monitors screw collection progress
 * Screws are only counted as collected after their container is removed when full
 * Provides progress percentage based on total screws vs screws from removed containers
 */

import { BaseSystem } from '../core/BaseSystem';
import {
  TotalScrewCountSetEvent,
  TotalScrewCountAddEvent,
  ProgressUpdatedEvent,
  LevelWinConditionMetEvent,
  LevelStartedEvent,
  GameOverEvent,
  ScrewCollectedEvent,
  ScrewCountResponseEvent,
  ContainerRemovedEvent
} from '../events/EventTypes';
import { DEBUG_CONFIG } from '@/shared/utils/Constants';

interface ProgressState {
  totalScrews: number;
  screwsInContainer: number; // Screws currently placed in containers (not yet counted as collected)
  screwsFromRemovedContainers: number; // Screws that are actually collected (from containers that were removed when full)
  progress: number; // 0-100 percentage based only on screwsFromRemovedContainers
}

export class ProgressTracker extends BaseSystem {
  private state: ProgressState = {
    totalScrews: 0,
    screwsInContainer: 0,
    screwsFromRemovedContainers: 0,
    progress: 0
  };

  private previousProgress = -1; // Track to prevent duplicate events

  constructor() {
    super('ProgressTracker');
  }

  protected onInitialize(): void {
    this.setupEventListeners();
    if (DEBUG_CONFIG.logProgressTracking) {
      console.log(`[ProgressTracker] System initialized and listening for events`);
    }
    
    // Emit system initialized event for validation
    this.emit({
      type: 'system:initialized',
      systemName: this.systemName,
      timestamp: Date.now()
    });
  }

  private setupEventListeners(): void {
    // Listen for total screw count
    this.subscribe('total:screw:count:set', this.handleTotalScrewCountSet.bind(this));
    this.subscribe('total:screw:count:add', this.handleTotalScrewCountAdd.bind(this));
    this.subscribe('screw:count:response', this.handleScrewCountResponse.bind(this));
    
    // Listen for screws being collected to containers
    this.subscribe('screw:collected', this.handleScrewCollected.bind(this));
    
    // Listen for level events to reset state
    this.subscribe('level:started', this.handleLevelStarted.bind(this));
    this.subscribe('game:over', this.handleGameOver.bind(this));
    
    // Listen for container events
    this.subscribe('container:all_removed', this.handleAllContainersRemoved.bind(this));
    this.subscribe('container:removed', this.handleContainerRemoved.bind(this));
    this.subscribe('container:filled', this.handleContainerFilled.bind(this));
  }

  private handleTotalScrewCountSet(event: TotalScrewCountSetEvent): void {
    this.executeIfActive(() => {
      if (DEBUG_CONFIG.logProgressTracking) {
        console.log(`[ProgressTracker] Received total_screw_count:set event: ${event.totalScrews} screws from ${event.source}`);
      }
      this.state.totalScrews = event.totalScrews;
      this.calculateAndEmitProgress();
    });
  }

  private handleTotalScrewCountAdd(event: TotalScrewCountAddEvent): void {
    this.executeIfActive(() => {
      this.state.totalScrews += event.additionalScrews;
      this.calculateAndEmitProgress();
    });
  }

  private handleScrewCountResponse(event: ScrewCountResponseEvent): void {
    this.executeIfActive(() => {
      this.state.totalScrews = event.totalScrews;
      this.calculateAndEmitProgress();
    });
  }

  private handleScrewCollected(event: ScrewCollectedEvent): void {
    this.executeIfActive(() => {
      // Don't count screws as collected just for being placed in containers
      // Screws should only be counted as collected after their container is removed when full
      // This method now only handles the overflow check for totalScrews if needed
      if (event.destination === 'container') {
        // Only check for overflow scenarios, but don't increment the collection count
        // The actual collection counting happens in handleContainerFilled when containers are removed
        if (DEBUG_CONFIG.logProgressTracking) {
          console.log(`[ProgressTracker] Screw placed in container, but not counted as collected until container is removed`);
        }
      }
    });
  }

  private handleLevelStarted(event: LevelStartedEvent): void {
    void event;
    this.executeIfActive(() => {
      // Only reset the collection counters, not totalScrews
      // totalScrews might already be set by total_screw_count:set event before level:started
      const currentTotalScrews = this.state.totalScrews;
      this.state.screwsInContainer = 0;
      this.state.screwsFromRemovedContainers = 0;
      this.state.progress = 0;
      this.previousProgress = -1;
      
      // Preserve totalScrews if it was already set
      this.state.totalScrews = currentTotalScrews;
      
      // Emit the reset progress
      this.calculateAndEmitProgress();
      
      // Only set fallback timer if totalScrews wasn't already set
      if (currentTotalScrews === 0) {
        setTimeout(() => {
          if (this.state.totalScrews === 0) {
            console.warn(`[ProgressTracker] No screw count received after 3 seconds, requesting manually...`);
            this.emit({
              type: 'screw:count:requested',
              timestamp: Date.now(),
              source: 'ProgressTracker-fallback'
            });
          }
        }, 3000);
      }
    });
  }

  private handleGameOver(event: GameOverEvent): void {
    void event;
    this.executeIfActive(() => {
      this.resetProgress();
    });
  }

  private handleContainerFilled(event: import('../events/EventTypes').ContainerFilledEvent): void {
    this.executeIfActive(() => {
      // Container is filled but not yet removed - don't count screws as collected yet
      // Wait for container:removed event to actually count the screws
      if (DEBUG_CONFIG.logProgressTracking) {
        console.log(`[ProgressTracker] Container filled with ${event.screws.length} screws, but waiting for removal to count as collected`);
      }
    });
  }

  private handleContainerRemoved(event: ContainerRemovedEvent): void {
    this.executeIfActive(() => {
      // When a container is actually removed, count the screws as collected
      const screwsInRemovedContainer = event.screwIds.length;
      
      this.state.screwsFromRemovedContainers += screwsInRemovedContainer;
      
      if (DEBUG_CONFIG.logProgressTracking) {
        console.log(`[ProgressTracker] Container removed with ${screwsInRemovedContainer} screws. Total collected: ${this.state.screwsFromRemovedContainers}`);
      }
      
      this.calculateAndEmitProgress();
    });
  }

  private handleAllContainersRemoved(event: import('../events/EventTypes').ContainerAllRemovedEvent): void {
    void event;
    this.executeIfActive(() => {
      // Request remaining screw counts to verify all screws are collected
      this.emit({
        type: 'remaining:screws:requested',
        timestamp: Date.now(),
        callback: (screwsByColor: Map<string, number>) => {
          // Check if there are any remaining screws
          let totalRemaining = 0;
          screwsByColor.forEach(count => {
            totalRemaining += count;
          });
          
          if (totalRemaining === 0) {
            // All screws collected and last container removed - level complete!
            const completionEvent: LevelWinConditionMetEvent = {
              type: 'level:win:condition:met',
              totalScrews: this.state.totalScrews,
              finalProgress: 100,
              timestamp: Date.now(),
              source: this.systemName
            };
            
            this.emit(completionEvent);
          }
        }
      });
    });
  }

  private calculateAndEmitProgress(): void {
    // Handle edge case: no screws - only consider complete if explicitly set to 0 after level initialization
    // During level transitions, totalScrews is reset to 0 temporarily, so don't auto-complete in that case
    if (this.state.totalScrews === 0) {
      this.state.progress = 0; // Don't auto-complete during level initialization when totalScrews hasn't been set yet
    } else {
      // Calculate progress based on how many screws are truly collected (from removed containers)
      const collectedScrews = this.state.screwsFromRemovedContainers;
      const actualCollectedScrews = Math.min(collectedScrews, this.state.totalScrews);
      this.state.progress = Math.floor((actualCollectedScrews / this.state.totalScrews) * 100);
      
      // When approaching completion, verify with real-time remaining screw count
      if (this.state.progress >= 95) {
        // Request verification of remaining screws before declaring completion
        this.emit({
          type: 'remaining:screws:requested',
          timestamp: Date.now(),
          callback: (screwsByColor: Map<string, number>) => {
            let totalRemaining = 0;
            screwsByColor.forEach(count => {
              totalRemaining += count;
            });
            
            // If there are still screws remaining, cap progress at 99%
            if (totalRemaining > 0 && this.state.progress >= 100) {
              this.state.progress = 99;
              this.emitProgressEvent();
            }
          }
        });
      }
    }

    // Clamp progress to valid range
    this.state.progress = Math.max(0, Math.min(100, this.state.progress));


    this.emitProgressEvent();
  }

  private emitProgressEvent(): void {
    // Only emit if progress actually changed
    if (this.state.progress !== this.previousProgress) {
      this.previousProgress = this.state.progress;

      // Emit progress update event - only report actually collected screws
      const progressEvent: ProgressUpdatedEvent = {
        type: 'progress:updated',
        totalScrews: this.state.totalScrews,
        screwsInContainer: Math.min(this.state.screwsFromRemovedContainers, this.state.totalScrews),
        progress: this.state.progress,
        timestamp: Date.now(),
        source: this.systemName
      };

      if (DEBUG_CONFIG.logProgressTracking) {
        console.log(`[ProgressTracker] Emitting progress:updated event:`, progressEvent);
      }
      this.emit(progressEvent);

      // Check for level completion
      if (this.state.progress >= 100) {
        const completionEvent: LevelWinConditionMetEvent = {
          type: 'level:win:condition:met',
          totalScrews: this.state.totalScrews,
          finalProgress: this.state.progress,
          timestamp: Date.now(),
          source: this.systemName
        };

        this.emit(completionEvent);
      }
    } else {
      if (DEBUG_CONFIG.logProgressTracking) {
        console.log(`[ProgressTracker] Progress unchanged, not emitting event (${this.state.progress}%)`);
      }
    }
  }

  private resetProgress(): void {
    this.state = {
      totalScrews: 0,
      screwsInContainer: 0,
      screwsFromRemovedContainers: 0,
      progress: 0
    };
    this.previousProgress = -1;
  }

  /**
   * Get current progress state (for debugging/testing)
   */
  getProgressState(): Readonly<ProgressState> {
    return { ...this.state };
  }

  /**
   * Manual reset method (for level restart functionality)
   */
  reset(): void {
    this.executeIfActive(() => {
      this.resetProgress();
      
      // Emit reset progress event
      const progressEvent: ProgressUpdatedEvent = {
        type: 'progress:updated',
        totalScrews: 0,
        screwsInContainer: 0,
        progress: 0,
        timestamp: Date.now(),
        source: this.systemName
      };

      this.emit(progressEvent);
    });
  }

  /**
   * Set total screw count manually (for testing or special cases)
   */
  setTotalScrews(count: number): void {
    this.executeIfActive(() => {
      if (count < 0) {
        console.warn('ProgressTracker: Total screw count cannot be negative');
        return;
      }

      this.state.totalScrews = count;
      this.calculateAndEmitProgress();
    });
  }

  protected onDestroy(): void {
    this.resetProgress();
  }
}