/**
 * Comprehensive easing functions library for smooth animations
 * Provides a wide variety of easing functions for different animation effects
 */

export type EasingFunctionName = 
  | 'linear'
  | 'easeInQuad' | 'easeOutQuad' | 'easeInOutQuad'
  | 'easeInCubic' | 'easeOutCubic' | 'easeInOutCubic'
  | 'easeInQuart' | 'easeOutQuart' | 'easeInOutQuart'
  | 'easeInQuint' | 'easeOutQuint' | 'easeInOutQuint'
  | 'easeInSine' | 'easeOutSine' | 'easeInOutSine'
  | 'easeInExpo' | 'easeOutExpo' | 'easeInOutExpo'
  | 'easeInCirc' | 'easeOutCirc' | 'easeInOutCirc'
  | 'easeInBack' | 'easeOutBack' | 'easeInOutBack'
  | 'easeInElastic' | 'easeOutElastic' | 'easeInOutElastic'
  | 'easeInBounce' | 'easeOutBounce' | 'easeInOutBounce';

/**
 * Easing function type definition
 */
export type EasingFunction = (t: number) => number;

/**
 * Basic easing functions
 */
export const EasingFunctions = {
  /**
   * Linear interpolation (no easing)
   */
  linear: (t: number): number => t,

  /**
   * Quadratic easing functions
   */
  easeInQuad: (t: number): number => t * t,
  easeOutQuad: (t: number): number => 1 - (1 - t) * (1 - t),
  easeInOutQuad: (t: number): number => 
    t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,

  /**
   * Cubic easing functions (commonly used for smooth animations)
   */
  easeInCubic: (t: number): number => t * t * t,
  easeOutCubic: (t: number): number => 1 - Math.pow(1 - t, 3),
  easeInOutCubic: (t: number): number => 
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,

  /**
   * Quartic easing functions
   */
  easeInQuart: (t: number): number => t * t * t * t,
  easeOutQuart: (t: number): number => 1 - Math.pow(1 - t, 4),
  easeInOutQuart: (t: number): number => 
    t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2,

  /**
   * Quintic easing functions
   */
  easeInQuint: (t: number): number => t * t * t * t * t,
  easeOutQuint: (t: number): number => 1 - Math.pow(1 - t, 5),
  easeInOutQuint: (t: number): number => 
    t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2,

  /**
   * Sinusoidal easing functions (smooth, natural feeling)
   */
  easeInSine: (t: number): number => 1 - Math.cos((t * Math.PI) / 2),
  easeOutSine: (t: number): number => Math.sin((t * Math.PI) / 2),
  easeInOutSine: (t: number): number => -(Math.cos(Math.PI * t) - 1) / 2,

  /**
   * Exponential easing functions (dramatic acceleration/deceleration)
   */
  easeInExpo: (t: number): number => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
  easeOutExpo: (t: number): number => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  easeInOutExpo: (t: number): number => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return t < 0.5 
      ? Math.pow(2, 20 * t - 10) / 2
      : (2 - Math.pow(2, -20 * t + 10)) / 2;
  },

  /**
   * Circular easing functions (gentle curves)
   */
  easeInCirc: (t: number): number => 1 - Math.sqrt(1 - Math.pow(t, 2)),
  easeOutCirc: (t: number): number => Math.sqrt(1 - Math.pow(t - 1, 2)),
  easeInOutCirc: (t: number): number => 
    t < 0.5
      ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
      : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2,

  /**
   * Back easing functions (overshoot effect, great for spring-like animations)
   */
  easeInBack: (t: number): number => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },
  easeOutBack: (t: number): number => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  easeInOutBack: (t: number): number => {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },

  /**
   * Elastic easing functions (bouncy, rubber-band effect)
   */
  easeInElastic: (t: number): number => {
    const c4 = (2 * Math.PI) / 3;
    if (t === 0) return 0;
    if (t === 1) return 1;
    return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
  },
  easeOutElastic: (t: number): number => {
    const c4 = (2 * Math.PI) / 3;
    if (t === 0) return 0;
    if (t === 1) return 1;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  easeInOutElastic: (t: number): number => {
    const c5 = (2 * Math.PI) / 4.5;
    if (t === 0) return 0;
    if (t === 1) return 1;
    return t < 0.5
      ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
      : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
  },

  /**
   * Bounce easing functions (bouncing ball effect)
   */
  easeInBounce: (t: number): number => 1 - EasingFunctions.easeOutBounce(1 - t),
  easeOutBounce: (t: number): number => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },
  easeInOutBounce: (t: number): number => 
    t < 0.5
      ? (1 - EasingFunctions.easeOutBounce(1 - 2 * t)) / 2
      : (1 + EasingFunctions.easeOutBounce(2 * t - 1)) / 2,
} as const;

/**
 * Get an easing function by name
 * @param name - The name of the easing function
 * @returns The easing function
 */
export function getEasingFunction(name: EasingFunctionName): EasingFunction {
  return EasingFunctions[name];
}

/**
 * Apply easing to a value between 0 and 1
 * @param t - Progress value between 0 and 1
 * @param easingName - The name of the easing function to use
 * @returns The eased value
 */
export function applyEasing(t: number, easingName: EasingFunctionName = 'linear'): number {
  const clampedT = Math.max(0, Math.min(1, t));
  return getEasingFunction(easingName)(clampedT);
}

/**
 * Interpolate between two values using an easing function
 * @param from - Start value
 * @param to - End value
 * @param t - Progress value between 0 and 1
 * @param easingName - The name of the easing function to use
 * @returns The interpolated value
 */
export function easedInterpolate(
  from: number, 
  to: number, 
  t: number, 
  easingName: EasingFunctionName = 'linear'
): number {
  const easedT = applyEasing(t, easingName);
  return from + (to - from) * easedT;
}

/**
 * Create a custom easing function by combining multiple easings
 * @param easings - Array of easing configurations with timing and function names
 * @returns A composite easing function
 */
export function createCompositeEasing(
  easings: Array<{ 
    start: number; 
    end: number; 
    easing: EasingFunctionName 
  }>
): EasingFunction {
  return (t: number): number => {
    const clampedT = Math.max(0, Math.min(1, t));
    
    for (const config of easings) {
      if (clampedT >= config.start && clampedT <= config.end) {
        const localT = (clampedT - config.start) / (config.end - config.start);
        const easingFunc = getEasingFunction(config.easing);
        const easedLocalT = easingFunc(localT);
        return config.start + (config.end - config.start) * easedLocalT;
      }
    }
    
    return clampedT;
  };
}

/**
 * Commonly used easing presets for specific animation types
 */
export const EasingPresets = {
  // UI animations
  ui: {
    default: 'easeInOutCubic' as EasingFunctionName,
    quick: 'easeOutQuad' as EasingFunctionName,
    smooth: 'easeInOutSine' as EasingFunctionName,
  },
  
  // Game animations
  game: {
    collection: 'easeInOutBack' as EasingFunctionName,
    transfer: 'easeInOutElastic' as EasingFunctionName,
    movement: 'easeInOutCubic' as EasingFunctionName,
    bounce: 'easeOutBounce' as EasingFunctionName,
  },
  
  // Physics-like animations
  physics: {
    spring: 'easeOutBack' as EasingFunctionName,
    elastic: 'easeOutElastic' as EasingFunctionName,
    gravity: 'easeInQuad' as EasingFunctionName,
    friction: 'easeOutExpo' as EasingFunctionName,
  },
} as const;