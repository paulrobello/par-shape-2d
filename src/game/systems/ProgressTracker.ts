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
    console.log('[ProgressTracker] Initializing ProgressTracker system...');
    this.setupEventListeners();
    console.log('[ProgressTracker] ProgressTracker system initialized');
  }

  private setupEventListeners(): void {
    console.log('[ProgressTracker] Setting up event listeners...');
    
    // Listen for total screw count
    console.log('[ProgressTracker] Subscribing to total_screw_count:set and total_screw_count:add');
    this.subscribe('total_screw_count:set', this.handleTotalScrewCountSet.bind(this));
    this.subscribe('total_screw_count:add', this.handleTotalScrewCountAdd.bind(this));
    
    // Listen for screws being collected to containers
    console.log('[ProgressTracker] Subscribing to screw:collected');
    this.subscribe('screw:collected', this.handleScrewCollected.bind(this));
    
    // Listen for level events to reset state
    console.log('[ProgressTracker] Subscribing to level:started and game:over');
    this.subscribe('level:started', this.handleLevelStarted.bind(this));
    this.subscribe('game:over', this.handleGameOver.bind(this));
    
    // Listen for container removal to check win condition
    console.log('[ProgressTracker] Subscribing to container:all_removed');
    this.subscribe('container:all_removed', this.handleAllContainersRemoved.bind(this));
    
    console.log('[ProgressTracker] Event listeners setup complete');
  }

  private handleTotalScrewCountSet(event: TotalScrewCountSetEvent): void {
    this.executeIfActive(() => {
      console.log(`[ProgressTracker] Total screw count set: ${event.totalScrews}`);
      this.state.totalScrews = event.totalScrews;
      this.calculateAndEmitProgress();
    });
  }

  private handleTotalScrewCountAdd(event: TotalScrewCountAddEvent): void {
    this.executeIfActive(() => {
      console.log(`[ProgressTracker] Adding ${event.additionalScrews} screws to total count (was ${this.state.totalScrews})`);
      this.state.totalScrews += event.additionalScrews;
      console.log(`[ProgressTracker] New total screw count: ${this.state.totalScrews}`);
      this.calculateAndEmitProgress();
    });
  }

  private handleScrewCollected(event: ScrewCollectedEvent): void {
    this.executeIfActive(() => {
      console.log(`[ProgressTracker] Screw collected to: ${event.destination}`);
      // Only count screws that go to containers, not holding holes
      if (event.destination === 'container') {
        this.state.screwsInContainer++;
        console.log(`[ProgressTracker] Container screw count: ${this.state.screwsInContainer}/${this.state.totalScrews}`);
        this.calculateAndEmitProgress();
      }
    });
  }

  private handleLevelStarted(event: LevelStartedEvent): void {
    this.executeIfActive(() => {
      console.log(`[ProgressTracker] Level started: ${event.level}, current totalScrews: ${this.state.totalScrews}`);
      // Only reset if we're actually starting a new level, not during initialization
      // We'll reset screwsInContainer but preserve totalScrews until explicitly set again
      this.state.screwsInContainer = 0;
      this.state.progress = 0;
      this.previousProgress = -1;
      console.log(`[ProgressTracker] Reset container count but preserved totalScrews: ${this.state.totalScrews}`);
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
      console.log('[ProgressTracker] All containers removed! Checking win condition...');
      
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
          
          console.log(`[ProgressTracker] Remaining screws after last container removed: ${totalRemaining}`);
          
          if (totalRemaining === 0) {
            // All screws collected and last container removed - level complete!
            console.log('[ProgressTracker] LEVEL COMPLETE! All screws collected and last container removed.');
            
            const completionEvent: LevelCompletedEvent = {
              type: 'level:completed',
              totalScrews: this.state.totalScrews,
              finalProgress: 100,
              timestamp: Date.now(),
              source: this.systemName
            };
            
            this.emit(completionEvent);
          } else {
            console.log(`[ProgressTracker] Cannot complete level - ${totalRemaining} screws still remaining`);
          }
        }
      });
    });
  }

  private calculateAndEmitProgress(): void {
    // Handle edge case: no screws
    if (this.state.totalScrews === 0) {
      this.state.progress = 100; // Consider complete if no screws to collect
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

      console.log(`[ProgressTracker] Emitting progress event:`, progressEvent);
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