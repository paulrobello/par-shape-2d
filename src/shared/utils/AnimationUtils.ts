/**
 * Shared animation utilities for consistent animation behavior
 * across game and editor systems
 */

import { Vector2 } from '@/types/game';

/**
 * Animation state interface for consistent animation tracking
 */
export interface AnimationState {
  isActive: boolean;
  progress: number;
  startTime?: number;
  duration: number;
}

/**
 * Position animation state for movement animations
 */
export interface PositionAnimationState extends AnimationState {
  startPosition: Vector2;
  targetPosition: Vector2;
  currentPosition: Vector2;
}

/**
 * Shake animation state for feedback animations
 */
export interface ShakeAnimationState extends AnimationState {
  offset: Vector2;
  frequency: number;
  amplitude: number;
}

/**
 * Animation constants for consistent timing across the application
 */
export const ANIMATION_CONSTANTS = {
  collection: {
    duration: 800, // Collection animation duration in ms
    easing: 'easeInOutCubic' as EasingFunctionName
  },
  transfer: {
    duration: 600, // Transfer animation duration in ms
    easing: 'easeInOutCubic' as EasingFunctionName
  },
  shake: {
    duration: 300, // Shake animation duration in ms
    frequency: 8,  // Number of oscillations
    amplitude: 3,  // Maximum shake distance in pixels
    easing: 'linear' as EasingFunctionName
  }
} as const;

import { EasingFunctionName, applyEasing } from './EasingFunctions';

/**
 * Create a new position animation state
 */
export function createPositionAnimation(
  startPosition: Vector2,
  targetPosition: Vector2,
  duration: number = ANIMATION_CONSTANTS.collection.duration
): PositionAnimationState {
  return {
    isActive: true,
    progress: 0,
    duration,
    startPosition: { ...startPosition },
    targetPosition: { ...targetPosition },
    currentPosition: { ...startPosition }
  };
}

/**
 * Update position animation and return completion status
 */
export function updatePositionAnimation(
  state: PositionAnimationState,
  deltaTime: number,
  easingName: EasingFunctionName = 'easeInOutCubic'
): boolean {
  if (!state.isActive) return true;

  const progressIncrement = deltaTime / state.duration;
  state.progress = Math.min(1, state.progress + progressIncrement);

  if (state.progress < 1) {
    const easedProgress = applyEasing(state.progress, easingName);
    
    // Interpolate position
    state.currentPosition.x = state.startPosition.x + 
      (state.targetPosition.x - state.startPosition.x) * easedProgress;
    state.currentPosition.y = state.startPosition.y + 
      (state.targetPosition.y - state.startPosition.y) * easedProgress;
    
    return false; // Animation not complete
  } else {
    // Animation complete
    state.currentPosition = { ...state.targetPosition };
    state.isActive = false;
    return true; // Animation complete
  }
}

/**
 * Create a new shake animation state
 */
export function createShakeAnimation(
  frequency: number = ANIMATION_CONSTANTS.shake.frequency,
  amplitude: number = ANIMATION_CONSTANTS.shake.amplitude,
  duration: number = ANIMATION_CONSTANTS.shake.duration
): ShakeAnimationState {
  return {
    isActive: true,
    progress: 0,
    duration,
    frequency,
    amplitude,
    offset: { x: 0, y: 0 }
  };
}

/**
 * Update shake animation and return completion status
 */
export function updateShakeAnimation(
  state: ShakeAnimationState,
  deltaTime: number
): boolean {
  if (!state.isActive) return true;

  const progressIncrement = deltaTime / state.duration;
  state.progress = Math.min(1, state.progress + progressIncrement);

  if (state.progress < 1) {
    const fadeOut = 1 - state.progress; // Fade out the shake over time
    const shakeValue = Math.sin(state.progress * state.frequency * Math.PI * 2) * 
                      state.amplitude * fadeOut;
    
    // Alternate between horizontal and vertical shake
    if (Math.floor(state.progress * state.frequency) % 2 === 0) {
      state.offset.x = shakeValue;
      state.offset.y = 0;
    } else {
      state.offset.x = 0;
      state.offset.y = shakeValue;
    }
    
    return false; // Animation not complete
  } else {
    // Animation complete
    state.isActive = false;
    state.offset = { x: 0, y: 0 };
    return true; // Animation complete
  }
}

/**
 * Interpolate between two positions
 */
export function interpolatePosition(
  start: Vector2,
  end: Vector2,
  t: number
): Vector2 {
  return {
    x: start.x + (end.x - start.x) * t,
    y: start.y + (end.y - start.y) * t
  };
}

/**
 * Calculate smooth step function for animations
 */
export function smoothStep(t: number): number {
  return t * t * (3 - 2 * t);
}

/**
 * Calculate smoother step function for animations
 */
export function smootherStep(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/**
 * Animation type for tracking different animation kinds
 */
export type AnimationType = 'collection' | 'transfer' | 'shake' | 'fade' | 'scale' | 'custom';

/**
 * Generic animation manager for handling multiple animations
 */
export class AnimationManager {
  private animations = new Map<string, {
    type: AnimationType;
    state: AnimationState;
    onComplete?: () => void;
  }>();

  /**
   * Start a new animation
   */
  startAnimation(
    id: string,
    type: AnimationType,
    state: AnimationState,
    onComplete?: () => void
  ): void {
    this.animations.set(id, { type, state, onComplete });
  }

  /**
   * Stop an animation
   */
  stopAnimation(id: string): void {
    this.animations.delete(id);
  }

  /**
   * Update all animations
   */
  updateAnimations(deltaTime: number): string[] {
    const completed: string[] = [];

    for (const [id, animation] of this.animations.entries()) {
      let isComplete = false;

      // Update animation based on type
      switch (animation.type) {
        case 'collection':
          if ('currentPosition' in animation.state) {
            isComplete = updatePositionAnimation(
              animation.state as PositionAnimationState,
              deltaTime,
              ANIMATION_CONSTANTS.collection.easing
            );
          }
          break;
        case 'transfer':
          if ('currentPosition' in animation.state) {
            isComplete = updatePositionAnimation(
              animation.state as PositionAnimationState,
              deltaTime,
              ANIMATION_CONSTANTS.transfer.easing
            );
          }
          break;
        case 'shake':
          if ('offset' in animation.state) {
            isComplete = updateShakeAnimation(
              animation.state as ShakeAnimationState,
              deltaTime
            );
          }
          break;
        default:
          // For custom animations, just update progress
          const progressIncrement = deltaTime / animation.state.duration;
          animation.state.progress = Math.min(1, animation.state.progress + progressIncrement);
          isComplete = animation.state.progress >= 1;
          if (isComplete) {
            animation.state.isActive = false;
          }
          break;
      }

      if (isComplete) {
        completed.push(id);
        if (animation.onComplete) {
          animation.onComplete();
        }
        this.animations.delete(id);
      }
    }

    return completed;
  }

  /**
   * Get animation state by ID
   */
  getAnimation(id: string): AnimationState | null {
    const animation = this.animations.get(id);
    return animation?.state || null;
  }

  /**
   * Check if animation is active
   */
  isAnimationActive(id: string): boolean {
    const animation = this.animations.get(id);
    return animation?.state.isActive || false;
  }

  /**
   * Clear all animations
   */
  clearAllAnimations(): void {
    this.animations.clear();
  }

  /**
   * Get count of active animations
   */
  getActiveAnimationCount(): number {
    return this.animations.size;
  }
}