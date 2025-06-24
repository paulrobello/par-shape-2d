/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-this-alias */
/**
 * ThrottleUtils - Utilities for throttling and debouncing operations
 * 
 * Provides reusable patterns for:
 * - Function throttling (limit execution rate)
 * - Function debouncing (delay until idle)
 * - Request queuing and batching
 * - Rate limiting with token buckets
 * - Async operation management
 */

import { DEBUG_CONFIG } from './Constants';
import { DebugLogger } from './DebugLogger';

/**
 * Throttle options
 */
export interface ThrottleOptions {
  leading?: boolean;  // Execute on leading edge (default: true)
  trailing?: boolean; // Execute on trailing edge (default: true)
}

/**
 * Debounce options
 */
export interface DebounceOptions {
  leading?: boolean;  // Execute on leading edge (default: false)
  trailing?: boolean; // Execute on trailing edge (default: true)
  maxWait?: number;   // Maximum time to wait before forcing execution
}

/**
 * Rate limiter options
 */
export interface RateLimiterOptions {
  maxTokens: number;      // Maximum tokens in bucket
  refillRate: number;     // Tokens per second
  initialTokens?: number; // Starting tokens (default: maxTokens)
}

/**
 * Batch processor options
 */
export interface BatchProcessorOptions<T> {
  maxBatchSize: number;   // Maximum items per batch
  maxWaitTime: number;    // Maximum ms to wait before processing
  processor: (items: T[]) => void | Promise<void>;
}

export class ThrottleUtils {
  /**
   * Throttle a function to execute at most once per interval
   * 
   * @example
   * const throttledSave = ThrottleUtils.throttle(saveData, 1000);
   * throttledSave(); // Executes immediately
   * throttledSave(); // Ignored
   * throttledSave(); // Ignored
   * // After 1 second, can execute again
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    options: ThrottleOptions = {}
  ): T & { cancel: () => void; flush: () => void } {
    const { leading = true, trailing = true } = options;
    let timeout: NodeJS.Timeout | null = null;
    let lastArgs: Parameters<T> | null = null;
    let lastThis: any;
    let lastCallTime: number | null = null;
    let lastInvokeTime = 0;
    let result: ReturnType<T>;

    const invoke = (time: number) => {
      const args = lastArgs!;
      const thisArg = lastThis;
      lastArgs = lastThis = null;
      lastInvokeTime = time;
      result = func.apply(thisArg, args);
      return result;
    };

    const shouldInvoke = (time: number) => {
      const timeSinceLastCall = lastCallTime ? time - lastCallTime : 0;
      const timeSinceLastInvoke = time - lastInvokeTime;
      return !lastCallTime || timeSinceLastCall >= wait || timeSinceLastInvoke >= wait;
    };

    const trailingEdge = (time: number) => {
      timeout = null;
      if (trailing && lastArgs) {
        return invoke(time);
      }
      lastArgs = lastThis = null;
      return result;
    };

    const timerExpired = () => {
      const time = Date.now();
      if (shouldInvoke(time)) {
        return trailingEdge(time);
      }
      timeout = setTimeout(timerExpired, wait - (time - lastInvokeTime));
    };

    const throttled = function (this: any, ...args: Parameters<T>) {
      const time = Date.now();
      const isInvoking = shouldInvoke(time);
      
      lastArgs = args;
      lastThis = this;
      lastCallTime = time;

      if (isInvoking) {
        if (!timeout) {
          lastInvokeTime = time;
          if (leading) {
            result = func.apply(this, args);
          }
          timeout = setTimeout(timerExpired, wait);
          if (!leading) {
            lastArgs = lastThis = null;
          }
        }
      }
      return result;
    } as T;

    (throttled as any).cancel = () => {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      lastCallTime = lastInvokeTime = 0;
      lastArgs = lastThis = null;
    };

    (throttled as any).flush = () => {
      if (timeout) {
        trailingEdge(Date.now());
      }
    };

    return throttled as T & { cancel: () => void; flush: () => void };
  }

  /**
   * Debounce a function to execute after a delay of inactivity
   * 
   * @example
   * const debouncedSearch = ThrottleUtils.debounce(search, 300);
   * debouncedSearch('a'); // Waits...
   * debouncedSearch('ab'); // Resets timer, waits...
   * debouncedSearch('abc'); // Resets timer, waits...
   * // After 300ms of no calls, executes with 'abc'
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    options: DebounceOptions = {}
  ): T & { cancel: () => void; flush: () => void } {
    const { leading = false, trailing = true, maxWait } = options;
    let timeout: NodeJS.Timeout | null = null;
    let maxTimeout: NodeJS.Timeout | null = null;
    let lastArgs: Parameters<T> | null = null;
    let lastThis: any;
    let lastCallTime: number | null = null;
    let lastInvokeTime = 0;
    let result: ReturnType<T>;

    const invoke = (time: number) => {
      const args = lastArgs!;
      const thisArg = lastThis;
      lastArgs = lastThis = null;
      lastInvokeTime = time;
      result = func.apply(thisArg, args);
      return result;
    };

    const leadingEdge = (time: number) => {
      lastInvokeTime = time;
      timeout = setTimeout(timerExpired, wait);
      return leading ? invoke(time) : result;
    };

    const remainingWait = (time: number) => {
      const timeSinceLastCall = time - (lastCallTime || 0);
      const timeSinceLastInvoke = time - lastInvokeTime;
      const timeWaiting = wait - timeSinceLastCall;
      return maxWait !== undefined
        ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
        : timeWaiting;
    };

    const shouldInvoke = (time: number) => {
      const timeSinceLastCall = time - (lastCallTime || 0);
      const timeSinceLastInvoke = time - lastInvokeTime;
      return !lastCallTime || 
        timeSinceLastCall >= wait || 
        (maxWait !== undefined && timeSinceLastInvoke >= maxWait);
    };

    const timerExpired = () => {
      const time = Date.now();
      if (shouldInvoke(time)) {
        trailingEdge(time);
      } else {
        timeout = setTimeout(timerExpired, remainingWait(time));
      }
    };

    const trailingEdge = (time: number) => {
      timeout = null;
      if (trailing && lastArgs) {
        return invoke(time);
      }
      lastArgs = lastThis = null;
      return result;
    };

    const cancel = () => {
      if (timeout) clearTimeout(timeout);
      if (maxTimeout) clearTimeout(maxTimeout);
      timeout = maxTimeout = null;
      lastCallTime = lastInvokeTime = 0;
      lastArgs = lastThis = null;
    };

    const flush = () => {
      if (timeout) {
        trailingEdge(Date.now());
      }
    };

    const debounced = function (this: any, ...args: Parameters<T>) {
      const time = Date.now();
      const isInvoking = shouldInvoke(time);
      
      lastArgs = args;
      lastThis = this;
      lastCallTime = time;

      if (isInvoking) {
        if (!timeout) {
          return leadingEdge(time);
        }
        if (maxWait !== undefined && !maxTimeout) {
          maxTimeout = setTimeout(() => {
            if (timeout) {
              trailingEdge(Date.now());
              timeout = null;
            }
          }, maxWait);
        }
      }

      if (!timeout) {
        timeout = setTimeout(timerExpired, wait);
      }

      return result;
    } as T;

    (debounced as any).cancel = cancel;
    (debounced as any).flush = flush;

    return debounced as T & { cancel: () => void; flush: () => void };
  }

  /**
   * Create a rate limiter using token bucket algorithm
   * 
   * @example
   * const limiter = ThrottleUtils.createRateLimiter({
   *   maxTokens: 10,
   *   refillRate: 1 // 1 token per second
   * });
   * 
   * if (limiter.tryConsume(3)) {
   *   // Allowed - consumed 3 tokens
   * } else {
   *   // Rate limited
   * }
   */
  static createRateLimiter(options: RateLimiterOptions) {
    const { maxTokens, refillRate, initialTokens = maxTokens } = options;
    let tokens = initialTokens;
    let lastRefillTime = Date.now();

    const refill = () => {
      const now = Date.now();
      const timePassed = (now - lastRefillTime) / 1000;
      const tokensToAdd = timePassed * refillRate;
      tokens = Math.min(maxTokens, tokens + tokensToAdd);
      lastRefillTime = now;
    };

    return {
      tryConsume(count = 1): boolean {
        refill();
        if (tokens >= count) {
          tokens -= count;
          return true;
        }
        return false;
      },

      getTokens(): number {
        refill();
        return tokens;
      },

      reset(): void {
        tokens = maxTokens;
        lastRefillTime = Date.now();
      },

      getTimeUntilToken(): number {
        refill();
        if (tokens >= 1) return 0;
        return ((1 - tokens) / refillRate) * 1000;
      }
    };
  }

  /**
   * Create a batch processor that accumulates items and processes them in batches
   * 
   * @example
   * const batcher = ThrottleUtils.createBatchProcessor({
   *   maxBatchSize: 100,
   *   maxWaitTime: 1000,
   *   processor: async (items) => {
   *     await api.bulkSave(items);
   *   }
   * });
   * 
   * batcher.add(item1);
   * batcher.add(item2);
   * // Automatically processes when batch is full or timeout reached
   */
  static createBatchProcessor<T>(options: BatchProcessorOptions<T>) {
    const { maxBatchSize, maxWaitTime, processor } = options;
    let batch: T[] = [];
    let timeout: NodeJS.Timeout | null = null;
    let processing = false;

    const processBatch = async () => {
      if (processing || batch.length === 0) return;
      
      processing = true;
      const itemsToProcess = batch.splice(0, maxBatchSize);
      
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }

      try {
        await processor(itemsToProcess);
        if (DEBUG_CONFIG.logEventFlow) {
          DebugLogger.logEvent(`[BatchProcessor] Processed ${itemsToProcess.length} items`);
        }
      } catch (error) {
        console.error('[BatchProcessor] Error processing batch:', error);
      } finally {
        processing = false;
        if (batch.length > 0) {
          scheduleBatch();
        }
      }
    };

    const scheduleBatch = () => {
      if (!timeout && batch.length > 0) {
        timeout = setTimeout(processBatch, maxWaitTime);
      }
    };

    return {
      add(item: T): void {
        batch.push(item);
        if (batch.length >= maxBatchSize) {
          processBatch();
        } else {
          scheduleBatch();
        }
      },

      addMany(items: T[]): void {
        batch.push(...items);
        if (batch.length >= maxBatchSize) {
          processBatch();
        } else {
          scheduleBatch();
        }
      },

      flush(): Promise<void> {
        return processBatch();
      },

      clear(): void {
        batch = [];
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
      },

      size(): number {
        return batch.length;
      },

      isProcessing(): boolean {
        return processing;
      }
    };
  }

  /**
   * Create a simple time-based cache
   * 
   * @example
   * const cache = ThrottleUtils.createTimeCache<string>(5000); // 5 second TTL
   * cache.set('key', 'value');
   * cache.get('key'); // 'value'
   * // After 5 seconds
   * cache.get('key'); // undefined
   */
  static createTimeCache<T>(ttlMs: number) {
    const cache = new Map<string, { value: T; expiry: number }>();

    const cleanup = () => {
      const now = Date.now();
      for (const [key, entry] of cache.entries()) {
        if (entry.expiry <= now) {
          cache.delete(key);
        }
      }
    };

    return {
      set(key: string, value: T): void {
        cache.set(key, {
          value,
          expiry: Date.now() + ttlMs
        });
      },

      get(key: string): T | undefined {
        const entry = cache.get(key);
        if (!entry) return undefined;
        
        if (entry.expiry <= Date.now()) {
          cache.delete(key);
          return undefined;
        }
        
        return entry.value;
      },

      has(key: string): boolean {
        return this.get(key) !== undefined;
      },

      delete(key: string): boolean {
        return cache.delete(key);
      },

      clear(): void {
        cache.clear();
      },

      size(): number {
        cleanup();
        return cache.size;
      },

      cleanup
    };
  }

  /**
   * Execute an async function with retry logic
   * 
   * @example
   * const result = await ThrottleUtils.withRetry(
   *   () => api.fetchData(),
   *   { maxAttempts: 3, delay: 1000, backoff: 2 }
   * );
   */
  static async withRetry<T>(
    fn: () => Promise<T>,
    options: {
      maxAttempts?: number;
      delay?: number;
      backoff?: number;
      shouldRetry?: (error: any, attempt: number) => boolean;
    } = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      delay = 1000,
      backoff = 2,
      shouldRetry = () => true
    } = options;

    let lastError: any;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxAttempts || !shouldRetry(error, attempt)) {
          throw error;
        }
        
        const waitTime = delay * Math.pow(backoff, attempt - 1);
        if (DEBUG_CONFIG.logEventFlow) {
          DebugLogger.logEvent(
            `[Retry] Attempt ${attempt} failed, retrying in ${waitTime}ms...`
          );
        }
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    throw lastError;
  }
}