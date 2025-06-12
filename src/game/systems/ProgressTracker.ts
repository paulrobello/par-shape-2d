/**
 * Progress tracking system that monitors screws moved to containers
 * Provides progress percentage based on total screws vs screws in containers
 */

import { BaseSystem } from '../core/BaseSystem';
import {
  TotalScrewCountSetEvent,
  TotalScrewCountAddEvent,
  ProgressUpdatedEvent,
  LevelCompletedEvent,
  LevelStartedEvent,
  GameOverEvent,
  ScrewCollectedEvent,
  ScrewCountResponseEvent
} from '../events/EventTypes';
import { DEBUG_CONFIG } from '@/shared/utils/Constants';

interface ProgressState {
  totalScrews: number;
  screwsInContainer: number;
  screwsFromRemovedContainers: number; // Track screws from filled containers that were removed
  progress: number; // 0-100 percentage
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
      // Only count screws that go to containers, not holding holes
      if (event.destination === 'container') {
        this.state.screwsInContainer++;
        
        // If we're about to exceed totalScrews, request an updated count
        // This handles cases where screw generation happened after initial count
        if (this.state.screwsInContainer > this.state.totalScrews) {
          this.emit({
            type: 'screw:count:requested',
            timestamp: Date.now(),
            source: 'ProgressTracker-overflow'
          });
        }
        
        this.calculateAndEmitProgress();
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
      // When a container is filled and removed, move screws from current containers to removed containers count
      const screwsInFilledContainer = event.screws.length;
      this.state.screwsInContainer -= screwsInFilledContainer;
      this.state.screwsFromRemovedContainers += screwsInFilledContainer;
      
      if (DEBUG_CONFIG.logProgressTracking) {
        console.log(`[ProgressTracker] Container filled with ${screwsInFilledContainer} screws. Current: ${this.state.screwsInContainer}, From removed: ${this.state.screwsFromRemovedContainers}`);
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
            const completionEvent: LevelCompletedEvent = {
              type: 'level:completed',
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
      // Calculate total screws processed (current containers + removed containers)
      const totalProcessedScrews = this.state.screwsInContainer + this.state.screwsFromRemovedContainers;
      const actualProcessedScrews = Math.min(totalProcessedScrews, this.state.totalScrews);
      this.state.progress = Math.floor((actualProcessedScrews / this.state.totalScrews) * 100);
    }

    // Clamp progress to valid range
    this.state.progress = Math.max(0, Math.min(100, this.state.progress));


    // Only emit if progress actually changed
    if (this.state.progress !== this.previousProgress) {
      this.previousProgress = this.state.progress;

      // Emit progress update event
      const totalProcessedScrews = this.state.screwsInContainer + this.state.screwsFromRemovedContainers;
      const progressEvent: ProgressUpdatedEvent = {
        type: 'progress:updated',
        totalScrews: this.state.totalScrews,
        screwsInContainer: Math.min(totalProcessedScrews, this.state.totalScrews),
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
        const completionEvent: LevelCompletedEvent = {
          type: 'level:completed',
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