/**
 * Type definitions for pre-computed level data and perfect balance system
 */

import { Vector } from 'matter-js';
import { ShapeDefinition } from './shapes';

/**
 * Complete pre-computed level structure with perfect balance guarantees
 */
export interface PrecomputedLevel {
  /** Total number of screws in the entire level */
  totalScrews: number;
  /** Number of containers needed to achieve perfect balance */
  targetContainerCount: number;
  /** All layers pre-computed with shapes and screws */
  layers: PrecomputedLayer[];
  /** Strategic plan for container replacements */
  containerReplacementPlan: ContainerReplacementPlan;
  /** Distribution of screw colors for optimal matching */
  screwColorDistribution: ScrewColorDistribution;
  /** Key progress milestones for UI updates */
  progressMilestones: ProgressMilestone[];
  /** Level difficulty metadata */
  difficulty: LevelDifficulty;
}

/**
 * Pre-computed layer with dormant physics objects
 */
export interface PrecomputedLayer {
  /** Layer index (0-based) */
  index: number;
  /** All shapes in this layer */
  shapes: PrecomputedShape[];
  /** Whether physics is currently active for this layer */
  isPhysicsActive: boolean;
  /** Total screws in this layer */
  screwCount: number;
  /** Depth ordering for rendering */
  depthIndex: number;
  /** Bounds for this layer */
  bounds: {
    width: number;
    height: number;
    x: number;
    y: number;
  };
}

/**
 * Pre-computed shape with dormant physics data
 */
export interface PrecomputedShape {
  /** Unique identifier */
  id: string;
  /** Shape definition from JSON */
  definition: ShapeDefinition;
  /** Position in layer */
  position: Vector;
  /** Generated dimensions */
  dimensions: Record<string, unknown>;
  /** Initial rotation */
  rotation: number;
  /** All screws attached to this shape */
  screws: PrecomputedScrew[];
  /** Physics data for when layer becomes active */
  physicsData?: SerializedPhysicsBody;
  /** Visual properties */
  visual: {
    color: string;
    tint: string;
    borderWidth: number;
    alpha: number;
  };
}

/**
 * Pre-computed screw with placement and targeting data
 */
export interface PrecomputedScrew {
  /** Unique identifier */
  id: string;
  /** Position relative to shape */
  position: Vector;
  /** Screw color for container matching */
  color: string;
  /** Parent shape ID */
  shapeId: string;
  /** Layer this screw belongs to */
  layerIndex: number;
  /** Target container for this screw */
  targetDestination: ScrewDestination;
  /** Order this screw should be collected for perfect balance */
  collectionPriority: number;
}

/**
 * Serialized physics body data for dormant objects
 */
export interface SerializedPhysicsBody {
  /** Matter.js body properties */
  position: Vector;
  angle: number;
  velocity: Vector;
  angularVelocity: number;
  /** Body creation parameters */
  options: {
    isStatic: boolean;
    isSleeping: boolean;
    density: number;
    friction: number;
    frictionAir: number;
    restitution: number;
  };
  /** Collision filter settings */
  collisionFilter: {
    category: number;
    mask: number;
    group: number;
  };
  /** Render properties */
  render: {
    fillStyle: string;
    strokeStyle: string;
    lineWidth: number;
  };
}

/**
 * Strategic plan for container replacements to achieve perfect balance
 */
export interface ContainerReplacementPlan {
  /** Scheduled container replacements */
  replacements: ContainerReplacement[];
  /** Guaranteed final state */
  finalState: PerfectBalanceState;
  /** Validation that plan achieves perfect balance */
  isValid: boolean;
  /** Plan generation metadata */
  metadata: {
    generatedAt: number;
    algorithm: string;
    validation: string[];
  };
}

/**
 * Individual container replacement specification
 */
export interface ContainerReplacement {
  /** Trigger: number of screws collected when replacement occurs */
  atScrewCount: number;
  /** New container colors */
  newColors: string[];
  /** Reason for replacement */
  reason: ContainerReplacementReason;
  /** Expected state after replacement */
  expectedState: {
    holdingHolesUsed: number;
    containersRemaining: number;
  };
}

/**
 * Reasons for container replacement
 */
export type ContainerReplacementReason = 
  | 'perfect_balance_required'
  | 'prevent_holding_overflow' 
  | 'color_optimization'
  | 'level_completion_preparation';

/**
 * Distribution of screw colors for optimal container matching
 */
export interface ScrewColorDistribution {
  /** Count of each color */
  colorCounts: Map<string, number>;
  /** Total screws (should equal sum of colorCounts) */
  totalScrews: number;
  /** Whether total is perfectly divisible by 3 */
  perfectDivision: boolean;
  /** Optimization metadata */
  optimization: {
    wasteMinimized: boolean;
    balanceAchievable: boolean;
    holdingHoleUsage: number;
  };
}

/**
 * Progress milestone for UI updates
 */
export interface ProgressMilestone {
  /** Screw count when milestone occurs */
  atScrewCount: number;
  /** Progress percentage (0-100) */
  percentage: number;
  /** Type of milestone */
  type: ProgressMilestoneType;
  /** UI message or description */
  description: string;
}

/**
 * Types of progress milestones
 */
export type ProgressMilestoneType = 
  | 'quarter_complete'
  | 'half_complete' 
  | 'three_quarters_complete'
  | 'container_replacement'
  | 'final_phase'
  | 'perfect_balance_achieved';

/**
 * Guaranteed final state for perfect balance
 */
export interface PerfectBalanceState {
  /** Number of completely filled containers */
  filledContainers: number;
  /** Number of empty holding holes (should always be 5) */
  emptyHoldingHoles: number;
  /** Total screws collected */
  totalScrewsCollected: number;
  /** Validation that balance is perfect */
  isPerfect: boolean;
}

/**
 * Level difficulty configuration
 */
export interface LevelDifficulty {
  /** Target number of layers */
  layerCount: number;
  /** Complexity of shapes */
  shapeComplexity: 'simple' | 'medium' | 'complex';
  /** Screw density per shape */
  screwDensity: 'low' | 'medium' | 'high';
  /** Perfect balance tolerance */
  balanceTolerance: number; // 0 = perfect, 1-2 = slight tolerance
}

/**
 * Screw destination for collection targeting
 */
export interface ScrewDestination {
  /** Type of destination */
  type: 'container' | 'holding_hole' | 'transfer_planned';
  /** Container ID if going to container */
  containerId?: string;
  /** Holding hole index if going to holding hole */
  holdingHoleIndex?: number;
  /** Expected transfer to container after collection */
  plannedTransfer?: {
    toContainerId: string;
    atScrewCount: number;
  };
}

/**
 * Progress tracking state for screw-based system
 */
export interface ScrewProgressState {
  /** Screws removed so far */
  removed: number;
  /** Total screws in level */
  total: number;
  /** Progress percentage (0-100) */
  percentage: number;
  /** Current milestone */
  currentMilestone?: ProgressMilestone;
  /** Next milestone */
  nextMilestone?: ProgressMilestone;
  /** Perfect balance status */
  balanceStatus: PerfectBalanceStatus;
}

/**
 * Perfect balance tracking status
 */
export type PerfectBalanceStatus = 
  | 'on_track'        // Following plan perfectly
  | 'minor_deviation' // Small deviation, still achievable
  | 'major_deviation' // Significant deviation, balance at risk
  | 'achieved';       // Perfect balance achieved

/**
 * Statistics for perfect balance achievement
 */
export interface PerfectBalanceStats {
  /** Final container state */
  containers: {
    filled: number;
    empty: number;
    total: number;
  };
  /** Final holding hole state */
  holdingHoles: {
    occupied: number;
    empty: number;
    total: number;
  };
  /** Screw collection stats */
  screws: {
    collected: number;
    total: number;
    wasteCount: number; // Screws that couldn't be optimally placed
  };
  /** Performance metrics */
  performance: {
    planExecutedPerfectly: boolean;
    deviationsFromPlan: number;
    finalBalanceAchieved: boolean;
  };
}

/**
 * Configuration for level pre-computation
 */
export interface PrecomputationConfig {
  /** Target number of layers for this level */
  targetLayers: number;
  /** Perfect balance requirements */
  balanceRequirements: {
    strictBalance: boolean; // Must be perfectly balanced
    tolerance: number;      // Allowed screws in holding holes at end
  };
  /** Performance settings */
  performance: {
    maxComputationTime: number; // Maximum time to spend pre-computing (ms)
    enablePhysicsPreview: boolean; // Pre-validate physics during computation
  };
  /** Debug options */
  debug: {
    logProgress: boolean;
    validateMath: boolean;
    saveComputationPlan: boolean;
  };
}

/**
 * Result of level pre-computation process
 */
export interface PrecomputationResult {
  /** Success status */
  success: boolean;
  /** Pre-computed level data (if successful) */
  levelData?: PrecomputedLevel;
  /** Computation statistics */
  stats: {
    computationTime: number;
    shapesGenerated: number;
    screwsGenerated: number;
    balanceValidated: boolean;
  };
  /** Any errors or warnings */
  issues: {
    errors: string[];
    warnings: string[];
  };
}