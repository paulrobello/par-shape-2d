/**
 * Haptic feedback utility for mobile devices
 * Provides consistent vibration patterns for game events
 */

export type HapticPattern = 'success' | 'blocked' | 'container_filled' | 'level_complete' | 'game_over';

/**
 * Centralized haptic feedback patterns as defined in README.md
 */
export class HapticUtils {
  /**
   * Check if haptic feedback is available on the device
   */
  static isAvailable(): boolean {
    return typeof navigator !== 'undefined' && 
           navigator.vibrate !== undefined &&
           typeof navigator.vibrate === 'function';
  }

  /**
   * Trigger haptic feedback for different game actions
   * @param pattern The type of haptic pattern to trigger
   */
  static trigger(pattern: HapticPattern): void {
    if (!this.isAvailable()) {
      return; // Haptic feedback not available
    }

    switch (pattern) {
      case 'success':
        // Light feedback for successful screw removal (50ms per README spec)
        navigator.vibrate(50);
        break;
      case 'blocked':
        // Medium feedback for blocked actions (50ms per README spec)
        navigator.vibrate(50);
        break;
      case 'container_filled':
        // Celebration pattern for container completion
        navigator.vibrate([100, 50, 100]);
        break;
      case 'level_complete':
        // Extended celebration for level completion
        navigator.vibrate([100, 50, 100, 50, 150]);
        break;
      case 'game_over':
        // Distinct pattern for game over
        navigator.vibrate([200, 100, 200]);
        break;
    }
  }

  /**
   * Trigger a custom vibration pattern
   * @param pattern Array of vibration durations in milliseconds
   */
  static triggerCustom(pattern: number | number[]): void {
    if (!this.isAvailable()) {
      return;
    }
    
    navigator.vibrate(pattern);
  }

  /**
   * Stop any ongoing vibration
   */
  static stop(): void {
    if (!this.isAvailable()) {
      return;
    }
    
    // Passing 0 or empty array stops vibration
    navigator.vibrate(0);
  }
}