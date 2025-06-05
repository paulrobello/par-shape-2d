/**
 * Base event types and interfaces shared between game and editor
 */

import Matter from 'matter-js';
import { ShapeDefinition } from '@/types/shapes';

/**
 * Event priority levels for subscription ordering
 */
export enum EventPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3
}

/**
 * Base event interface that all events must extend
 */
export interface BaseEvent {
  type: string;
  timestamp?: number;
  source?: string;
  priority?: EventPriority;
}

/**
 * Event handler function type
 */
export type EventHandler<T extends BaseEvent = BaseEvent> = (event: T) => void | Promise<void>;

/**
 * Event subscription options
 */
export interface EventSubscriptionOptions {
  priority?: EventPriority;
  once?: boolean;
  source?: string;
}

/**
 * Event subscription metadata
 */
export interface EventSubscription {
  handler: EventHandler;
  priority: EventPriority;
  once: boolean;
  source?: string;
  id: string;
}

/**
 * Event history entry for debugging
 */
export interface EventHistory {
  event: BaseEvent;
  handlers: number;
  duration: number;
  timestamp: number;
}

/**
 * Event bus statistics
 */
export interface EventBusStats {
  totalEvents: number;
  totalHandlers: number;
  averageHandlersPerEvent: number;
  averageDurationPerEvent: number;
  errorCount: number;
  queueSize: number;
  subscriptionCount: number;
}

// ============================================
// Common Event Types (used by both systems)
// ============================================

/**
 * Physics body lifecycle events
 */
export interface PhysicsBodyAddedEvent extends BaseEvent {
  type: 'physics:body:added';
  bodyId: string;
  body: Matter.Body;
  metadata?: unknown;
}

export interface PhysicsBodyRemovedEvent extends BaseEvent {
  type: 'physics:body:removed';
  bodyId: string;
  metadata?: unknown;
}

/**
 * Physics constraint events
 */
export interface PhysicsConstraintAddedEvent extends BaseEvent {
  type: 'physics:constraint:added';
  constraintId: string;
  constraint: Matter.Constraint;
  metadata?: unknown;
}

export interface PhysicsConstraintRemovedEvent extends BaseEvent {
  type: 'physics:constraint:removed';
  constraintId: string;
  metadata?: unknown;
}

/**
 * Physics simulation control events
 */
export interface PhysicsSimulationStartedEvent extends BaseEvent {
  type: 'physics:simulation:started';
}

export interface PhysicsSimulationPausedEvent extends BaseEvent {
  type: 'physics:simulation:paused';
}

export interface PhysicsSimulationResetEvent extends BaseEvent {
  type: 'physics:simulation:reset';
}

export interface PhysicsStepCompletedEvent extends BaseEvent {
  type: 'physics:step:completed';
  deltaTime: number;
}

/**
 * Physics error events
 */
export interface PhysicsErrorEvent extends BaseEvent {
  type: 'physics:error';
  error: Error;
  context?: string;
  bodyId?: string;
  constraintId?: string;
}

/**
 * Shape lifecycle events (common structure)
 */
export interface ShapeCreatedEvent extends BaseEvent {
  type: 'shape:created';
  shapeId: string;
  shapeDefinition?: ShapeDefinition;
  metadata?: unknown;
}

export interface ShapeUpdatedEvent extends BaseEvent {
  type: 'shape:updated';
  shapeId: string;
  changes?: Partial<ShapeDefinition>;
  metadata?: unknown;
}

export interface ShapeDestroyedEvent extends BaseEvent {
  type: 'shape:destroyed';
  shapeId: string;
  metadata?: unknown;
}

/**
 * Validation events
 */
export interface ValidationFailedEvent extends BaseEvent {
  type: 'validation:failed';
  errors: string[];
  context: string;
  target?: unknown;
}

export interface ValidationSucceededEvent extends BaseEvent {
  type: 'validation:succeeded';
  context: string;
  target?: unknown;
}

/**
 * File operation events
 */
export interface FileLoadRequestedEvent extends BaseEvent {
  type: 'file:load:requested';
  file?: File;
  path?: string;
}

export interface FileLoadCompletedEvent extends BaseEvent {
  type: 'file:load:completed';
  filename: string;
  data: unknown;
}

export interface FileLoadFailedEvent extends BaseEvent {
  type: 'file:load:failed';
  filename: string;
  error: string;
}

export interface FileSaveRequestedEvent extends BaseEvent {
  type: 'file:save:requested';
  filename?: string;
  data: unknown;
}

export interface FileSaveCompletedEvent extends BaseEvent {
  type: 'file:save:completed';
  filename: string;
}

export interface FileSaveFailedEvent extends BaseEvent {
  type: 'file:save:failed';
  filename: string;
  error: string;
}

/**
 * Debug mode events
 */
export interface DebugModeToggledEvent extends BaseEvent {
  type: 'debug:mode:toggled';
  enabled: boolean;
}

export interface DebugInfoRequestedEvent extends BaseEvent {
  type: 'debug:info:requested';
  infoType: string;
}

/**
 * System error events
 */
export interface SystemErrorEvent extends BaseEvent {
  type: 'system:error';
  system: string;
  error: Error;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
}

/**
 * Performance monitoring events
 */
export interface PerformanceMetricEvent extends BaseEvent {
  type: 'performance:metric';
  metric: string;
  value: number;
  unit?: string;
}

export interface PerformanceWarningEvent extends BaseEvent {
  type: 'performance:warning';
  metric: string;
  value: number;
  threshold: number;
  message: string;
}

/**
 * State change events
 */
export interface StateChangedEvent extends BaseEvent {
  type: 'state:changed';
  stateName: string;
  oldValue: unknown;
  newValue: unknown;
}

/**
 * Common event type unions
 */
export type CommonPhysicsEvent = 
  | PhysicsBodyAddedEvent
  | PhysicsBodyRemovedEvent
  | PhysicsConstraintAddedEvent
  | PhysicsConstraintRemovedEvent
  | PhysicsSimulationStartedEvent
  | PhysicsSimulationPausedEvent
  | PhysicsSimulationResetEvent
  | PhysicsStepCompletedEvent
  | PhysicsErrorEvent;

export type CommonShapeEvent =
  | ShapeCreatedEvent
  | ShapeUpdatedEvent
  | ShapeDestroyedEvent;

export type CommonValidationEvent =
  | ValidationFailedEvent
  | ValidationSucceededEvent;

export type CommonFileEvent =
  | FileLoadRequestedEvent
  | FileLoadCompletedEvent
  | FileLoadFailedEvent
  | FileSaveRequestedEvent
  | FileSaveCompletedEvent
  | FileSaveFailedEvent;

export type CommonDebugEvent =
  | DebugModeToggledEvent
  | DebugInfoRequestedEvent;

export type CommonErrorEvent =
  | SystemErrorEvent
  | PhysicsErrorEvent;

export type CommonPerformanceEvent =
  | PerformanceMetricEvent
  | PerformanceWarningEvent;

/**
 * All common events union
 */
export type CommonEvent =
  | CommonPhysicsEvent
  | CommonShapeEvent
  | CommonValidationEvent
  | CommonFileEvent
  | CommonDebugEvent
  | CommonErrorEvent
  | CommonPerformanceEvent
  | StateChangedEvent;