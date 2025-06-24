/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * StateManager<T> - Generic state management utility with validation and history
 * 
 * Provides a type-safe, consistent approach to state management with:
 * - State transition validation
 * - Change subscriptions
 * - History tracking and undo
 * - Immutable state updates
 * - Debug inspection tools
 * 
 * @example
 * interface GameState {
 *   level: number;
 *   score: number;
 *   isPaused: boolean;
 * }
 * 
 * const stateManager = new StateManager<GameState>({
 *   level: 1,
 *   score: 0,
 *   isPaused: false
 * });
 * 
 * stateManager
 *   .addValidator('score', (newScore) => newScore >= 0)
 *   .subscribe('score', (newScore, oldScore) => {
 *     console.log(`Score changed: ${oldScore} -> ${newScore}`);
 *   });
 * 
 * stateManager.update({ score: 100 }); // Valid update
 * stateManager.update({ score: -50 }); // Rejected by validator
 */

import { DebugLogger } from './DebugLogger';
import { DEBUG_CONFIG } from './Constants';

/**
 * State change event
 */
export interface StateChange<T, K extends keyof T = keyof T> {
  property: K;
  oldValue: T[K];
  newValue: T[K];
  timestamp: number;
}

/**
 * State validator function
 */
export type StateValidator<T, K extends keyof T> = (
  newValue: T[K],
  oldValue: T[K],
  fullState: T
) => boolean | string;

/**
 * State change subscriber function
 */
export type StateSubscriber<T, K extends keyof T> = (
  newValue: T[K],
  oldValue: T[K],
  fullState: T
) => void;

/**
 * State transition rule
 */
export interface StateTransition<T> {
  from: Partial<T>;
  to: Partial<T>;
  condition?: (state: T) => boolean;
  name?: string;
}

/**
 * State manager configuration
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface StateManagerConfig<T> {
  maxHistorySize?: number;
  enableHistory?: boolean;
  debugNamespace?: string;
  immutable?: boolean;
}

/**
 * Generic state management class
 */
export class StateManager<T> {
  private state: T;
  private initialState: T;
  private validators = new Map<keyof T, StateValidator<T, keyof T>[]>();
  private subscribers = new Map<keyof T, StateSubscriber<T, keyof T>[]>();
  private globalSubscribers: Array<(changes: StateChange<T>[], state: T) => void> = [];
  private history: Array<{ state: T; timestamp: number }> = [];
  private historyIndex = -1;
  private config: Required<StateManagerConfig<T>>;
  private transitions: StateTransition<T>[] = [];
  private frozen = false;

  constructor(initialState: T, config: StateManagerConfig<T> = {}) {
    this.config = {
      maxHistorySize: 50,
      enableHistory: true,
      debugNamespace: 'StateManager',
      immutable: true,
      ...config
    };

    this.state = this.deepClone(initialState);
    this.initialState = this.deepClone(initialState);
    
    if (this.config.enableHistory) {
      this.pushHistory();
    }
  }

  /**
   * Get current state (immutable copy)
   */
  getState(): Readonly<T> {
    return this.config.immutable ? this.deepClone(this.state) : this.state;
  }

  /**
   * Get specific property value
   */
  get<K extends keyof T>(property: K): T[K] {
    return this.config.immutable ? this.deepClone(this.state[property]) : this.state[property];
  }

  /**
   * Update state with validation
   */
  update(updates: Partial<T>): boolean {
    if (this.frozen) {
      if (DEBUG_CONFIG.logEventFlow) {
        DebugLogger.logEvent(`[${this.config.debugNamespace}] State is frozen, update rejected`);
      }
      return false;
    }

    const changes: StateChange<T>[] = [];
    const newState = { ...this.state };
    let hasChanges = false;

    // Validate and collect changes
    for (const key in updates) {
      if (key in (this.state as any)) {
        const property = key as keyof T;
        const oldValue = this.state[property];
        const newValue = updates[property] as T[keyof T];

        // Skip if no change
        if (this.deepEquals(oldValue, newValue)) {
          continue;
        }

        // Run validators
        const validators = this.validators.get(property) || [];
        for (const validator of validators) {
          const result = validator(newValue, oldValue, this.state);
          if (result !== true) {
            if (DEBUG_CONFIG.logEventFlow) {
              const message = typeof result === 'string' ? result : `Validation failed for ${String(property)}`;
              DebugLogger.logEvent(`[${this.config.debugNamespace}] ${message}`);
            }
            return false;
          }
        }

        // Collect change
        changes.push({
          property,
          oldValue,
          newValue,
          timestamp: Date.now()
        });
        newState[property] = newValue;
        hasChanges = true;
      }
    }

    if (!hasChanges) {
      return true;
    }

    // Check state transitions
    if (!this.isTransitionAllowed(this.state, newState)) {
      if (DEBUG_CONFIG.logEventFlow) {
        DebugLogger.logEvent(`[${this.config.debugNamespace}] State transition not allowed`);
      }
      return false;
    }

    // Apply changes
    this.state = newState;

    // Push to history
    if (this.config.enableHistory) {
      this.pushHistory();
    }

    // Notify subscribers
    this.notifySubscribers(changes);

    if (DEBUG_CONFIG.logEventFlow) {
      DebugLogger.logEvent(`[${this.config.debugNamespace}] State updated: ${JSON.stringify(changes)}`);
    }

    return true;
  }

  /**
   * Set a single property
   */
  set<K extends keyof T>(property: K, value: T[K]): boolean {
    return this.update({ [property]: value } as unknown as Partial<T>);
  }

  /**
   * Add a property validator
   */
  addValidator<K extends keyof T>(
    property: K,
    validator: StateValidator<T, K>
  ): this {
    const validators = this.validators.get(property) || [];
    validators.push(validator as StateValidator<T, keyof T>);
    this.validators.set(property, validators);
    return this;
  }

  /**
   * Remove a property validator
   */
  removeValidator<K extends keyof T>(
    property: K,
    validator: StateValidator<T, K>
  ): boolean {
    const validators = this.validators.get(property);
    if (!validators) return false;

    const index = validators.indexOf(validator as StateValidator<T, keyof T>);
    if (index !== -1) {
      validators.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Subscribe to property changes
   */
  subscribe<K extends keyof T>(
    property: K,
    subscriber: StateSubscriber<T, K>
  ): () => void {
    const subscribers = this.subscribers.get(property) || [];
    subscribers.push(subscriber as StateSubscriber<T, keyof T>);
    this.subscribers.set(property, subscribers);

    // Return unsubscribe function
    return () => {
      const subs = this.subscribers.get(property);
      if (subs) {
        const index = subs.indexOf(subscriber as StateSubscriber<T, keyof T>);
        if (index !== -1) {
          subs.splice(index, 1);
        }
      }
    };
  }

  /**
   * Subscribe to all state changes
   */
  subscribeAll(subscriber: (changes: StateChange<T>[], state: T) => void): () => void {
    this.globalSubscribers.push(subscriber);
    
    return () => {
      const index = this.globalSubscribers.indexOf(subscriber);
      if (index !== -1) {
        this.globalSubscribers.splice(index, 1);
      }
    };
  }

  /**
   * Add a state transition rule
   */
  addTransition(transition: StateTransition<T>): this {
    this.transitions.push(transition);
    return this;
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    this.state = this.deepClone(this.initialState);
    if (this.config.enableHistory) {
      this.history = [];
      this.historyIndex = -1;
      this.pushHistory();
    }
    
    // Notify all subscribers of reset
    const changes: StateChange<T>[] = [];
    for (const key in (this.state as any)) {
      const property = key as keyof T;
      changes.push({
        property,
        oldValue: (this.state as any)[property],
        newValue: (this.initialState as any)[property],
        timestamp: Date.now()
      });
    }
    this.notifySubscribers(changes);
  }

  /**
   * Undo last state change
   */
  undo(): boolean {
    if (!this.config.enableHistory || this.historyIndex <= 0) {
      return false;
    }

    this.historyIndex--;
    const historicalState = this.history[this.historyIndex];
    if (!historicalState) return false;

    const oldState = this.state;
    this.state = this.deepClone(historicalState.state);

    // Notify subscribers
    const changes: StateChange<T>[] = [];
    for (const key in (this.state as any)) {
      const property = key as keyof T;
      if (!this.deepEquals((oldState as any)[property], (this.state as any)[property])) {
        changes.push({
          property,
          oldValue: (oldState as any)[property],
          newValue: (this.state as any)[property],
          timestamp: Date.now()
        });
      }
    }
    this.notifySubscribers(changes);

    return true;
  }

  /**
   * Redo state change
   */
  redo(): boolean {
    if (!this.config.enableHistory || this.historyIndex >= this.history.length - 1) {
      return false;
    }

    this.historyIndex++;
    const historicalState = this.history[this.historyIndex];
    if (!historicalState) return false;

    const oldState = this.state;
    this.state = this.deepClone(historicalState.state);

    // Notify subscribers
    const changes: StateChange<T>[] = [];
    for (const key in (this.state as any)) {
      const property = key as keyof T;
      if (!this.deepEquals((oldState as any)[property], (this.state as any)[property])) {
        changes.push({
          property,
          oldValue: (oldState as any)[property],
          newValue: (this.state as any)[property],
          timestamp: Date.now()
        });
      }
    }
    this.notifySubscribers(changes);

    return true;
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.config.enableHistory && this.historyIndex > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.config.enableHistory && this.historyIndex < this.history.length - 1;
  }

  /**
   * Get state history
   */
  getHistory(): ReadonlyArray<{ state: Readonly<T>; timestamp: number }> {
    return this.history.map(h => ({
      state: this.deepClone(h.state),
      timestamp: h.timestamp
    }));
  }

  /**
   * Freeze state (prevent updates)
   */
  freeze(): void {
    this.frozen = true;
  }

  /**
   * Unfreeze state
   */
  unfreeze(): void {
    this.frozen = false;
  }

  /**
   * Check if state is frozen
   */
  isFrozen(): boolean {
    return this.frozen;
  }

  /**
   * Get debug information
   */
  getDebugInfo(): {
    currentState: T;
    validators: string[];
    subscribers: string[];
    transitions: number;
    historySize: number;
    frozen: boolean;
  } {
    return {
      currentState: this.getState() as T,
      validators: Array.from(this.validators.keys()).map(String),
      subscribers: Array.from(this.subscribers.keys()).map(String),
      transitions: this.transitions.length,
      historySize: this.history.length,
      frozen: this.frozen
    };
  }

  /**
   * Create a derived state manager
   */
  derive<U>(
    selector: (state: T) => U,
    config?: StateManagerConfig<U>
  ): StateManager<U> {
    const derivedState = selector(this.state);
    const derived = new StateManager(derivedState, config);

    // Subscribe to parent changes
    this.subscribeAll(() => {
      const newDerivedState = selector(this.state);
      derived.update(newDerivedState);
    });

    return derived;
  }

  // Private methods

  private deepClone<V>(value: V): V {
    if (value === null || typeof value !== 'object') return value;
    if (value instanceof Date) return new Date(value.getTime()) as V;
    if (value instanceof Array) return value.map(item => this.deepClone(item)) as V;
    if (value instanceof Map) return new Map(value) as V;
    if (value instanceof Set) return new Set(value) as V;
    
    const cloned = {} as V;
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        cloned[key] = this.deepClone(value[key]);
      }
    }
    return cloned;
  }

  private deepEquals(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a === null || b === null) return false;
    if (typeof a !== typeof b) return false;
    
    if (typeof a !== 'object') return false;
    
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    
    const keys = Object.keys(aObj);
    if (keys.length !== Object.keys(bObj).length) return false;
    
    return keys.every(key => this.deepEquals(aObj[key], bObj[key]));
  }

  private pushHistory(): void {
    // Remove any future history if we're not at the end
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    // Add new state
    this.history.push({
      state: this.deepClone(this.state),
      timestamp: Date.now()
    });

    // Trim history if needed
    if (this.history.length > this.config.maxHistorySize) {
      this.history = this.history.slice(-this.config.maxHistorySize);
    }

    this.historyIndex = this.history.length - 1;
  }

  private notifySubscribers(changes: StateChange<T>[]): void {
    // Notify property-specific subscribers
    for (const change of changes) {
      const subscribers = this.subscribers.get(change.property) || [];
      for (const subscriber of subscribers) {
        try {
          subscriber(change.newValue, change.oldValue, this.state);
        } catch (error) {
          console.error(`Error in state subscriber for ${String(change.property)}:`, error);
        }
      }
    }

    // Notify global subscribers
    for (const subscriber of this.globalSubscribers) {
      try {
        subscriber(changes, this.state);
      } catch (error) {
        console.error('Error in global state subscriber:', error);
      }
    }
  }

  private isTransitionAllowed(from: T, to: T): boolean {
    if (this.transitions.length === 0) return true;

    for (const transition of this.transitions) {
      // Check if current state matches 'from' pattern
      const matchesFrom = this.matchesPattern(from, transition.from);
      const matchesTo = this.matchesPattern(to, transition.to);
      
      if (matchesFrom && matchesTo) {
        // Check additional condition if provided
        if (transition.condition) {
          return transition.condition(to);
        }
        return true;
      }
    }

    return false;
  }

  private matchesPattern(state: T, pattern: Partial<T>): boolean {
    for (const key in pattern) {
      if (!this.deepEquals((state as any)[key], pattern[key])) {
        return false;
      }
    }
    return true;
  }
}

/**
 * Create a state manager with initial state
 */
export function createStateManager<T>(
  initialState: T,
  config?: StateManagerConfig<T>
): StateManager<T> {
  return new StateManager(initialState, config);
}