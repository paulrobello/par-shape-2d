/**
 * Unified debug logging utilities
 */

import { DEBUG_CONFIG } from './Constants';

export class DebugLogger {
  private static throttleMap = new Map<string, number>();

  /**
   * Logs message only if condition is true
   */
  static logConditional(
    condition: boolean,
    message: string,
    ...args: unknown[]
  ): void {
    if (condition) {
      console.log(message, ...args);
    }
  }

  /**
   * Physics-related debug logging
   */
  static logPhysics(message: string, ...args: unknown[]): void {
    this.logConditional(
      DEBUG_CONFIG.logPhysicsDebug, 
      `🔧 PHYSICS: ${message}`, 
      ...args
    );
  }

  /**
   * Screw-related debug logging
   */
  static logScrew(message: string, ...args: unknown[]): void {
    this.logConditional(
      DEBUG_CONFIG.logScrewDebug, 
      `🎯 SCREW: ${message}`, 
      ...args
    );
  }

  /**
   * Container-related debug logging
   */
  static logContainer(message: string, ...args: unknown[]): void {
    this.logConditional(
      DEBUG_CONFIG.logScrewDebug, 
      `🏭 CONTAINER: ${message}`, 
      ...args
    );
  }

  /**
   * Layer-related debug logging
   */
  static logLayer(message: string, ...args: unknown[]): void {
    this.logConditional(
      DEBUG_CONFIG.logLayerDebug, 
      `🎭 LAYER: ${message}`, 
      ...args
    );
  }

  /**
   * Progress tracking debug logging
   */
  static logProgress(message: string, ...args: unknown[]): void {
    this.logConditional(
      DEBUG_CONFIG.logProgressTracking, 
      `📊 PROGRESS: ${message}`, 
      ...args
    );
  }

  /**
   * Warning messages (always logged but with consistent formatting)
   */
  static logWarning(message: string, ...args: unknown[]): void {
    console.warn(`⚠️ WARNING: ${message}`, ...args);
  }

  /**
   * Error messages (always logged but with consistent formatting)
   */
  static logError(message: string, ...args: unknown[]): void {
    console.error(`❌ ERROR: ${message}`, ...args);
  }

  /**
   * Success messages (conditional on debug flags)
   */
  static logSuccess(message: string, ...args: unknown[]): void {
    this.logConditional(
      DEBUG_CONFIG.logScrewDebug || DEBUG_CONFIG.logProgressTracking, 
      `✅ SUCCESS: ${message}`, 
      ...args
    );
  }

  /**
   * Throttled logging - only logs if enough time has passed since last log
   */
  static logWithThrottle(
    key: string,
    intervalMs: number,
    message: string,
    ...args: unknown[]
  ): void {
    const now = Date.now();
    const lastLog = this.throttleMap.get(key) || 0;

    if (now - lastLog > intervalMs) {
      console.log(message, ...args);
      this.throttleMap.set(key, now);
    }
  }

  /**
   * Clears throttle map (useful for testing or memory management)
   */
  static clearThrottleMap(): void {
    this.throttleMap.clear();
  }
}