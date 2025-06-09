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
  ScrewCollectedEvent
} from '../events/EventTypes';

interface ProgressState {
  totalScrews: number;
  screwsInContainer: number;
  progress: number; // 0-100 percentage
}

export class ProgressTracker extends BaseSystem {
  private state: ProgressState = {
    totalScrews: 0,
    screwsInContainer: 0,
    progress: 0
  };

  private previousProgress = -1; // Track to prevent duplicate events

  constructor() {
    super('ProgressTracker');
  }

  protected onInitialize(): void {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for total screw count
    this.subscribe('total_screw_count:set', this.handleTotalScrewCountSet.bind(this));
    this.subscribe('total_screw_count:add', this.handleTotalScrewCountAdd.bind(this));
    
    // Listen for screws being collected to containers
    this.subscribe('screw:collected', this.handleScrewCollected.bind(this));
    
    // Listen for level events to reset state
    this.subscribe('level:started', this.handleLevelStarted.bind(this));
    this.subscribe('game:over', this.handleGameOver.bind(this));
    
    // Listen for container removal to check win condition
    this.subscribe('container:all_removed', this.handleAllContainersRemoved.bind(this));
  }

  private handleTotalScrewCountSet(event: TotalScrewCountSetEvent): void {
    this.executeIfActive(() => {
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

  private handleScrewCollected(event: ScrewCollectedEvent): void {
    this.executeIfActive(() => {
      // Only count screws that go to containers, not holding holes
      if (event.destination === 'container') {
        this.state.screwsInContainer++;
        this.calculateAndEmitProgress();
      }
    });
  }

  private handleLevelStarted(event: LevelStartedEvent): void {
    void event;
    this.executeIfActive(() => {
      // Reset all progress state for the new level to prevent race conditions
      // The totalScrews will be set again when the new level's screws are counted
      this.state.screwsInContainer = 0;
      this.state.totalScrews = 0; // Reset to prevent auto-completion before new count is set
      this.state.progress = 0;
      this.previousProgress = -1;
    });
  }

  private handleGameOver(event: GameOverEvent): void {
    void event;
    this.executeIfActive(() => {
      this.resetProgress();
    });
  }

  private handleAllContainersRemoved(event: import('../events/EventTypes').ContainerAllRemovedEvent): void {
    void event;
    this.executeIfActive(() => {
      // Request remaining screw counts to verify all screws are collected
      this.emit({
        type: 'remaining_screws:requested',
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
      // Ensure screwsInContainer doesn't exceed totalScrews
      const actualScrewsInContainer = Math.min(this.state.screwsInContainer, this.state.totalScrews);
      this.state.progress = Math.floor((actualScrewsInContainer / this.state.totalScrews) * 100);
    }

    // Clamp progress to valid range
    this.state.progress = Math.max(0, Math.min(100, this.state.progress));

    // Only emit if progress actually changed
    if (this.state.progress !== this.previousProgress) {
      this.previousProgress = this.state.progress;

      // Emit progress update event
      const progressEvent: ProgressUpdatedEvent = {
        type: 'progress:updated',
        totalScrews: this.state.totalScrews,
        screwsInContainer: Math.min(this.state.screwsInContainer, this.state.totalScrews),
        progress: this.state.progress,
        timestamp: Date.now(),
        source: this.systemName
      };

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
    }
  }

  private resetProgress(): void {
    this.state = {
      totalScrews: 0,
      screwsInContainer: 0,
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