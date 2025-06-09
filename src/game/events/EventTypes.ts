/**
 * Type definitions for the game's event system
 */

import { Shape } from '../entities/Shape';
import { Layer } from '../entities/Layer';
import { Screw, ScrewColor } from '@/types/game';
import Matter from 'matter-js';
import { BaseEvent, EventPriority, EventHandler, EventSubscriptionOptions } from '@/shared/events';
// Removed precomputation imports - no longer using precomputation system

// Re-export shared types for backward compatibility
export { EventPriority, type EventHandler, type EventSubscriptionOptions };

// Game lifecycle events
export interface GameStartedEvent extends BaseEvent {
  type: 'game:started';
}

export interface GamePausedEvent extends BaseEvent {
  type: 'game:paused';
}

export interface GameResumedEvent extends BaseEvent {
  type: 'game:resumed';
}

export interface GameOverEvent extends BaseEvent {
  type: 'game:over';
  reason: 'holding_holes_full' | 'user_triggered' | 'error';
  finalScore: number;
}

export interface LevelCompleteEvent extends BaseEvent {
  type: 'level:complete';
  level: number;
  score: number;
}

export interface LevelStartedEvent extends BaseEvent {
  type: 'level:started';
  level: number;
}

// Removed LevelPrecomputedEvent - no longer using precomputation system


// Removed PhysicsActivationRequestedEvent - no longer using precomputation system

// Removed PhysicsActivationErrorEvent - no longer using precomputation system

// Removed PhysicsActivationCleanupCompletedEvent - no longer using precomputation system

export interface PhysicsDormantLayersSetEvent extends BaseEvent {
  type: 'physics:dormant:layers:set';
  layerCount: number;
  totalShapes: number;
  totalScrews: number;
}

// Removed ContainerStrategyInitializedEvent - no longer using precomputation system

// Removed LevelPrecomputationRequestedEvent - no longer using precomputation system

export interface LevelProgressUpdatedEvent extends BaseEvent {
  type: 'level:progress:updated';
  screwsRemoved: number;
  totalScrews: number;
  percentage: number;
  perfectBalanceStatus: 'on_track' | 'minor_deviation' | 'major_deviation' | 'achieved';
}

export interface NextLevelRequestedEvent extends BaseEvent {
  type: 'next_level:requested';
}

export interface AllLayersClearedEvent extends BaseEvent {
  type: 'all_layers:cleared';
}

// Screw system events
export interface ScrewClickedEvent extends BaseEvent {
  type: 'screw:clicked';
  screw: Screw;
  position: { x: number; y: number };
  forceRemoval?: boolean; // True when Shift is held in debug mode
}

export interface ScrewRemovedEvent extends BaseEvent {
  type: 'screw:removed';
  screw: Screw;
  shape: Shape;
}

export interface ScrewCollectedEvent extends BaseEvent {
  type: 'screw:collected';
  screw: Screw;
  destination: 'container' | 'holding_hole';
  points: number;
}

export interface ScrewAnimationStartedEvent extends BaseEvent {
  type: 'screw:animation:started';
  screw: Screw;
  targetPosition: { x: number; y: number };
}

export interface ScrewAnimationCompletedEvent extends BaseEvent {
  type: 'screw:animation:completed';
  screw: Screw;
}

export interface ScrewBlockedEvent extends BaseEvent {
  type: 'screw:blocked';
  screw: Screw;
  blockingShapes: Shape[];
}

export interface ScrewUnblockedEvent extends BaseEvent {
  type: 'screw:unblocked';
  screw: Screw;
}

export interface ScrewBlockedClickEvent extends BaseEvent {
  type: 'screw:blocked:clicked';
  screw: Screw;
  position: { x: number; y: number };
}

export interface ScrewTransferStartedEvent extends BaseEvent {
  type: 'screw:transfer:started';
  screwId: string;
  fromHoleIndex: number;
  toContainerIndex: number;
  toHoleIndex: number;
  fromPosition: { x: number; y: number };
  toPosition: { x: number; y: number };
}

export interface ScrewTransferCompletedEvent extends BaseEvent {
  type: 'screw:transfer:completed';
  screwId: string;
  fromHoleIndex: number;
  toContainerIndex: number;
  toHoleIndex: number;
}

export interface ScrewTransferFailedEvent extends BaseEvent {
  type: 'screw:transfer:failed';
  screwId: string;
  fromHoleIndex: number;
  toContainerIndex: number;
  toHoleIndex: number;
  reason: string;
}

export interface ShapeScrewsReadyEvent extends BaseEvent {
  type: 'shape:screws:ready';
  shape: Shape;
  screws: Screw[];
}

export interface ScrewsGeneratedEvent extends BaseEvent {
  type: 'screws:generated';
  shapeId: string;
  screwCount: number;
  totalScrewsGenerated: number;
}

// Shape system events
export interface ShapeCreatedEvent extends BaseEvent {
  type: 'shape:created';
  shape: Shape;
  layer: Layer;
}

export interface ShapeDestroyedEvent extends BaseEvent {
  type: 'shape:destroyed';
  shape: Shape;
  layer: Layer;
}

export interface ShapeFellOffScreenEvent extends BaseEvent {
  type: 'shape:fell_off_screen';
  shape: Shape;
  layer: Layer;
}

export interface ShapePhysicsUpdatedEvent extends BaseEvent {
  type: 'shape:physics:updated';
  shape: Shape;
  velocity: { x: number; y: number };
  position: { x: number; y: number };
}

export interface ShapeAttachmentChangedEvent extends BaseEvent {
  type: 'shape:attachment:changed';
  shape: Shape;
  attachedScrews: Screw[];
}

// Layer system events
export interface LayerCreatedEvent extends BaseEvent {
  type: 'layer:created';
  layer: Layer;
  index: number;
}

export interface LayerClearedEvent extends BaseEvent {
  type: 'layer:cleared';
  layer: Layer;
  index: number;
}

export interface LayerVisibilityChangedEvent extends BaseEvent {
  type: 'layer:visibility:changed';
  layer: Layer;
  visible: boolean;
}

export interface LayersUpdatedEvent extends BaseEvent {
  type: 'layers:updated';
  visibleLayers: Layer[];
  totalLayers: number;
}

export interface LayerBoundsChangedEvent extends BaseEvent {
  type: 'layer:bounds:changed';
  layer: Layer;
  bounds: { x: number; y: number; width: number; height: number };
}

export interface LayerIndicesUpdatedEvent extends BaseEvent {
  type: 'layer:indices:updated';
  layers: Array<{ layerId: string; newIndex: number }>;
}

export interface LayerShapesReadyEvent extends BaseEvent {
  type: 'layer:shapes:ready';
  layer: Layer;
  screwColors: ScrewColor[];
}

export interface AllLayersScrewsReadyEvent extends BaseEvent {
  type: 'all_layers:screws:ready';
  totalLayers: number;
  totalShapes: number;
}

export interface ScrewCountRequestedEvent extends BaseEvent {
  type: 'screw_count:requested';
  source: string;
}

export interface RemainingScrewCountsRequestedEvent extends BaseEvent {
  type: 'remaining_screws:requested';
  callback: (screwsByColor: Map<string, number>) => void;
}

export interface ScrewCountResponseEvent extends BaseEvent {
  type: 'screw_count:response';
  totalScrews: number;
  requestSource: string;
}

// Container system events
export interface ContainerFilledEvent extends BaseEvent {
  type: 'container:filled';
  containerIndex: number;
  color: string;
  screws: string[]; // Screw IDs, not objects
}

export interface ContainerReplacedEvent extends BaseEvent {
  type: 'container:replaced';
  containerIndex: number;
  oldColor: import('@/types/game').ScrewColor;
  newColor: import('@/types/game').ScrewColor;
}

export interface ContainerAllRemovedEvent extends BaseEvent {
  type: 'container:all_removed';
}

export interface HoldingHoleFilledEvent extends BaseEvent {
  type: 'holding_hole:filled';
  holeIndex: number;
  screwId: string | null; // null when hole is emptied
  screwColor?: ScrewColor; // Color of screw being placed (undefined when hole is emptied)
}

export interface HoldingHolesFullEvent extends BaseEvent {
  type: 'holding_holes:full';
  countdown: number;
}

export interface HoldingHolesAvailableEvent extends BaseEvent {
  type: 'holding_holes:available';
}

export interface ContainerColorsUpdatedEvent extends BaseEvent {
  type: 'container:colors:updated';
  colors: import('@/types/game').ScrewColor[];
}

export interface ContainerStateUpdatedEvent extends BaseEvent {
  type: 'container:state:updated';
  containers: import('@/types/game').Container[];
}

export interface HoldingHoleStateUpdatedEvent extends BaseEvent {
  type: 'holding_hole:state:updated';
  holdingHoles: import('@/types/game').HoldingHole[];
}

export interface ScrewColorsRequestedEvent extends BaseEvent {
  type: 'screw_colors:requested';
  containerIndex: number;
  existingColors: import('@/types/game').ScrewColor[];
  callback: (activeScrewColors: import('@/types/game').ScrewColor[]) => void;
}

export interface ScrewTransferColorCheckEvent extends BaseEvent {
  type: 'screw:transfer:color_check';
  targetContainer: import('@/types/game').Container;
  targetColor: import('@/types/game').ScrewColor;
  holdingHoleScrews: { screwId: string; holeIndex: number }[];
  callback: (validTransfers: { screwId: string; holeIndex: number }[]) => void;
}

export interface ContainerProgressUpdatedEvent extends BaseEvent {
  type: 'container:progress:updated';
  screwsInContainers: number;
  containersRemoved: number;
  totalScrewsToContainers: number;
  totalScrewsCollected: number;
  percentage: number;
}

// Physics events
export interface PhysicsBodyAddedEvent extends BaseEvent {
  type: 'physics:body:added';
  bodyId: string;
  shape: Shape;
  body?: Matter.Body;
}

export interface PhysicsBodyRemovedEvent extends BaseEvent {
  type: 'physics:body:removed';
  bodyId: string;
  shape: Shape;
}

export interface PhysicsBodyRemovedImmediateEvent extends BaseEvent {
  type: 'physics:body:removed:immediate';
  bodyId: string;
  anchorBody: Matter.Body;
  shape: Shape;
}

export interface PhysicsScrewRemovedImmediateEvent extends BaseEvent {
  type: 'physics:screw:removed:immediate';
  screwId: string;
  constraint?: Matter.Constraint;
  anchorBody?: Matter.Body;
  shape: Shape;
}

export interface CollisionDetectedEvent extends BaseEvent {
  type: 'physics:collision:detected';
  bodyA: string;
  bodyB: string;
  force: number;
  collisionId?: string; // Unique ID to prevent event loop detection
}

export interface ConstraintAddedEvent extends BaseEvent {
  type: 'physics:constraint:added';
  constraintId: string;
  screw: Screw;
  constraint?: Matter.Constraint;
}

export interface ConstraintRemovedEvent extends BaseEvent {
  type: 'physics:constraint:removed';
  constraintId: string;
  screw: Screw;
}

export interface PhysicsStepCompletedEvent extends BaseEvent {
  type: 'physics:step:completed';
  deltaTime: number;
}

// Save/restore events
export interface SaveRequestedEvent extends BaseEvent {
  type: 'save:requested';
  trigger: 'auto' | 'manual' | 'level_change' | 'game_over';
}

export interface SaveCompletedEvent extends BaseEvent {
  type: 'save:completed';
  success: boolean;
  error?: string;
}

export interface RestoreRequestedEvent extends BaseEvent {
  type: 'restore:requested';
  saveData?: import('@/types/game').FullGameSave;
}

export interface RestoreCompletedEvent extends BaseEvent {
  type: 'restore:completed';
  success: boolean;
  error?: string;
}

export interface SaveStateChangedEvent extends BaseEvent {
  type: 'save:state:changed';
  hasUnsavedChanges: boolean;
}

// Score events
export interface ScoreUpdatedEvent extends BaseEvent {
  type: 'score:updated';
  points: number;
  total: number;
  reason: 'screw_collected' | 'level_complete' | 'bonus';
}

export interface LevelScoreUpdatedEvent extends BaseEvent {
  type: 'level_score:updated';
  levelScore: number;
  level: number;
}

export interface TotalScoreUpdatedEvent extends BaseEvent {
  type: 'total_score:updated';
  totalScore: number;
}

// Debug events
export interface DebugModeToggledEvent extends BaseEvent {
  type: 'debug:mode:toggled';
  enabled: boolean;
}

export interface DebugInfoRequestedEvent extends BaseEvent {
  type: 'debug:info:requested';
  infoType: 'save_data' | 'performance' | 'state';
}

export interface DebugPerformanceTestEvent extends BaseEvent {
  type: 'debug:performance:test';
  iteration?: number;
}

// Error handling events
export interface SystemErrorEvent extends BaseEvent {
  type: 'system:error';
  system: string;
  error: Error;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
}

export interface PhysicsErrorEvent extends BaseEvent {
  type: 'physics:error';
  error: Error;
  bodyId?: string;
  constraintId?: string;
}

export interface SaveErrorEvent extends BaseEvent {
  type: 'save:error';
  error: Error;
  operation: 'save' | 'restore';
  recoverable: boolean;
}

// Rendering events
export interface RenderRequestedEvent extends BaseEvent {
  type: 'render:requested';
  context: CanvasRenderingContext2D;
}

export interface BoundsChangedEvent extends BaseEvent {
  type: 'bounds:changed';
  width: number;
  height: number;
  scale: number;
}

// System coordination events
export interface SystemReadyEvent extends BaseEvent {
  type: 'system:ready';
}

// Pre-computation events
// Removed LevelPrecomputedEvent - no longer using precomputation system

// Removed LevelBalanceCalculatedEvent - no longer using precomputation system

export interface ScrewProgressUpdatedEvent extends BaseEvent {
  type: 'screw:progress:updated';
  removed: number;
  total: number;
  percentage: number;
}

// Progress tracking events
export interface ProgressUpdatedEvent extends BaseEvent {
  type: 'progress:updated';
  totalScrews: number;
  screwsInContainer: number;
  progress: number; // 0-100 percentage
}

export interface LevelCompletedEvent extends BaseEvent {
  type: 'level:completed';
  totalScrews: number;
  finalProgress: number;
}

export interface TotalScrewCountSetEvent extends BaseEvent {
  type: 'total_screw_count:set';
  totalScrews: number;
  source: string;
}

export interface TotalScrewCountAddEvent extends BaseEvent {
  type: 'total_screw_count:add';
  additionalScrews: number;
  source: string;
}

// Removed PerfectBalanceStatusEvent - no longer using precomputation system

// Removed ContainerReplacementPlannedEvent - no longer using precomputation system

// Removed ContainerReplacementExecutedEvent - no longer using precomputation system

// Removed PerfectBalanceAchievedEvent - no longer using precomputation system

// Removed physics activation events - no longer using precomputation system


// Union type of all events
export type GameEvent = 
  | GameStartedEvent
  | GamePausedEvent
  | GameResumedEvent
  | GameOverEvent
  | LevelCompleteEvent
  | LevelStartedEvent
  | LevelProgressUpdatedEvent
  | NextLevelRequestedEvent
  | AllLayersClearedEvent
  | ScrewClickedEvent
  | ScrewRemovedEvent
  | ScrewCollectedEvent
  | ScrewAnimationStartedEvent
  | ScrewAnimationCompletedEvent
  | ScrewBlockedEvent
  | ScrewUnblockedEvent
  | ScrewBlockedClickEvent
  | ScrewTransferStartedEvent
  | ScrewTransferCompletedEvent
  | ScrewTransferFailedEvent
  | ShapeScrewsReadyEvent
  | ScrewsGeneratedEvent
  | ShapeCreatedEvent
  | ShapeDestroyedEvent
  | ShapeFellOffScreenEvent
  | ShapePhysicsUpdatedEvent
  | ShapeAttachmentChangedEvent
  | LayerCreatedEvent
  | LayerClearedEvent
  | LayerVisibilityChangedEvent
  | LayersUpdatedEvent
  | LayerBoundsChangedEvent
  | LayerIndicesUpdatedEvent
  | LayerShapesReadyEvent
  | AllLayersScrewsReadyEvent
  | ScrewCountRequestedEvent
  | ScrewCountResponseEvent
  | ContainerFilledEvent
  | ContainerReplacedEvent
  | HoldingHoleFilledEvent
  | HoldingHolesFullEvent
  | HoldingHolesAvailableEvent
  | ContainerColorsUpdatedEvent
  | ContainerStateUpdatedEvent
  | HoldingHoleStateUpdatedEvent
  | ScrewColorsRequestedEvent
  | ScrewTransferColorCheckEvent
  | ContainerProgressUpdatedEvent
  | PhysicsBodyAddedEvent
  | PhysicsBodyRemovedEvent
  | PhysicsBodyRemovedImmediateEvent
  | PhysicsScrewRemovedImmediateEvent
  | CollisionDetectedEvent
  | ConstraintAddedEvent
  | ConstraintRemovedEvent
  | PhysicsStepCompletedEvent
  | SaveRequestedEvent
  | SaveCompletedEvent
  | RestoreRequestedEvent
  | RestoreCompletedEvent
  | SaveStateChangedEvent
  | ScoreUpdatedEvent
  | LevelScoreUpdatedEvent
  | TotalScoreUpdatedEvent
  | DebugModeToggledEvent
  | DebugInfoRequestedEvent
  | DebugPerformanceTestEvent
  | SystemErrorEvent
  | PhysicsErrorEvent
  | SaveErrorEvent
  | RenderRequestedEvent
  | BoundsChangedEvent
  | SystemReadyEvent
  | ScrewProgressUpdatedEvent
  | ProgressUpdatedEvent
  | LevelCompletedEvent
  | TotalScrewCountSetEvent
  | TotalScrewCountAddEvent
  | RemainingScrewCountsRequestedEvent
  | ContainerAllRemovedEvent;
  // Removed precomputation event types from union - no longer using precomputation system

// Game-specific event handler type
export type GameEventHandler<T extends GameEvent = GameEvent> = EventHandler<T>;