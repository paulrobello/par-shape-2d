# Level Pre-computation & Perfect Balance Refactor Plan

## Overview

This document outlines a comprehensive refactor to transform PAR Shape 2D from a layer-based progression system to a screw-based system with perfect mathematical balance. The goal is to ensure that when the last screw is removed, all containers are perfectly filled and all holding holes are empty.

## Current System Analysis

### Existing Architecture
- **Layer Generation**: Lazy loading of 4 visible layers at a time
- **Shape Creation**: On-demand when layers become visible
- **Screw Placement**: Created with shapes, immediate physics activation
- **Progress Tracking**: Based on layers cleared
- **Container Management**: Replace when filled (3 screws), leading to potential overflow

### Problems to Solve
1. **Imperfect Endings**: Levels end with partially filled containers and occupied holding holes
2. **Resource Waste**: All layers have active physics even when not visible
3. **Unpredictable Balance**: No guarantee of perfect screw/container mathematics
4. **Layer-Based Progress**: Doesn't reflect actual game completion accurately

## Target Architecture

### Core Principles
1. **Pre-computation**: Generate entire level structure at start
2. **Perfect Balance**: Mathematical guarantee of complete container filling
3. **Lazy Physics**: Activate physics only for visible layers
4. **Screw-Based Progress**: Track progress by screws removed vs total screws
5. **Smart Container Strategy**: Replace containers only when mathematically necessary

## Implementation Phases

### Phase 1: Pre-computation Infrastructure

#### New Systems
**File**: `src/game/systems/LevelPrecomputer.ts`
```typescript
class LevelPrecomputer extends BaseSystem {
  // Pre-compute entire level structure
  // Calculate perfect screw counts
  // Generate container replacement plan
  // Create dormant shape/screw data
}
```

**File**: `src/types/precomputed.ts`
```typescript
interface PrecomputedLevel {
  totalScrews: number;
  targetContainerCount: number;
  layers: PrecomputedLayer[];
  containerReplacementPlan: ContainerReplacementPlan;
  screwColorDistribution: ScrewColorDistribution;
  progressMilestones: ProgressMilestone[];
}

interface PrecomputedLayer {
  index: number;
  shapes: PrecomputedShape[];
  isPhysicsActive: boolean;
  screwCount: number;
  depthIndex: number;
}

interface PrecomputedShape {
  id: string;
  definition: ShapeDefinition;
  position: Vector;
  dimensions: any;
  rotation: number;
  screws: PrecomputedScrew[];
  physicsData?: SerializedPhysicsBody;
}

interface PrecomputedScrew {
  id: string;
  position: Vector;
  color: string;
  shapeId: string;
  layerIndex: number;
}

interface ContainerReplacementPlan {
  replacements: Array<{
    atScrewCount: number;
    newColors: string[];
    reason: string;
  }>;
  finalState: {
    filledContainers: number;
    emptyHoldingHoles: number;
    totalScrewsCollected: number;
  };
}

interface ScrewColorDistribution {
  colorCounts: Map<string, number>;
  totalScrews: number;
  perfectDivision: boolean; // totalScrews % 3 === 0
}
```

#### Modified Systems
**File**: `src/game/systems/LayerManager.ts`
- Work with pre-computed layer data instead of generating on-demand
- Add `activateLayerPhysics(layerIndex: number)` method
- Maintain visibility logic but trigger physics activation
- Handle dormant shapes without physics bodies

**File**: `src/game/core/GameState.ts`
- Store `PrecomputedLevel` data
- Track screw-based progress instead of layer progress
- Handle container replacement based on pre-computed plan
- Emit screw progress events

#### New Events
```typescript
// Add to EventTypes.ts
'level:precomputed': { levelData: PrecomputedLevel };
'level:balance:calculated': { plan: ContainerReplacementPlan };
'screw:progress:updated': { removed: number; total: number; percentage: number };
```

### Phase 2: Perfect Balance Mathematics

#### New System
**File**: `src/game/utils/PerfectBalanceCalculator.ts`
```typescript
class PerfectBalanceCalculator {
  calculatePerfectScrewCount(targetLayers: number): number;
  planContainerReplacements(screwDistribution: ScrewColorDistribution): ContainerReplacementPlan;
  validatePerfectBalance(plan: ContainerReplacementPlan): boolean;
  optimizeScrewColors(totalScrews: number): ScrewColorDistribution;
}
```

#### Core Algorithm
```typescript
// Perfect Balance Constraint
// Total Screws = (Filled Containers × 3) + 0 remaining in holding holes
// Where: Filled Containers = Math.ceil(Total Screws ÷ 3)

const calculatePerfectScrewCount = (targetCount: number): number => {
  // Ensure total screws is multiple of 3 for perfect container division
  return Math.ceil(targetCount / 3) * 3;
};

const planContainerStrategy = (totalScrews: number, colors: ScrewColorDistribution): ContainerReplacementPlan => {
  // Calculate when containers should be replaced to achieve perfect ending
  // Ensure no screws left in holding holes at completion
  // Balance container colors with screw color distribution
};
```

#### Container Replacement Logic
```typescript
const shouldReplaceContainer = (
  currentContainer: Container,
  remainingScrewsOfColor: number,
  availableHoles: number
): boolean => {
  // Don't replace if remaining screws + available holes <= 3
  // Replace only when necessary to prevent holding hole overflow
  return (remainingScrewsOfColor + availableHoles) > 3;
};
```

### Phase 3: Physics Activation System

#### New System
**File**: `src/game/systems/PhysicsActivationManager.ts`
```typescript
class PhysicsActivationManager extends BaseSystem {
  activateLayerPhysics(layerIndex: number): void;
  deactivateLayerPhysics(layerIndex: number): void;
  createPhysicsBodiesFromData(shapes: PrecomputedShape[]): void;
  createConstraintsForScrews(screws: PrecomputedScrew[]): void;
}
```

#### Modified Systems
**File**: `src/shared/physics/PhysicsWorld.ts`
- Add support for dormant physics objects
- Implement `activateBodies(bodies: SerializedPhysicsBody[])` method
- Add `deactivateBodies(bodyIds: string[])` method
- Maintain performance with selective physics activation

**File**: `src/game/entities/Shape.ts`
- Add `isDormant: boolean` property
- Store `physicsData: SerializedPhysicsBody` for dormant shapes
- Support physics activation without re-creation

**File**: `src/game/entities/Screw.ts`
- Add `isDormant: boolean` property
- Store constraint data for dormant screws
- Support constraint creation when layer activates

#### New Events
```typescript
'layer:physics:activated': { layerIndex: number; shapeCount: number };
'layer:physics:deactivated': { layerIndex: number };
'physics:activation:requested': { layerIndex: number };
```

### Phase 4: Progress System Overhaul

#### Modified Systems
**File**: `src/game/core/GameState.ts`
```typescript
// Replace layer-based progress with screw-based
interface GameState {
  // ... existing properties
  screwProgress: {
    removed: number;
    total: number;
    percentage: number;
  };
  perfectBalance: {
    targetContainers: number;
    filledContainers: number;
    holdingHolesUsed: number;
  };
}

// New methods
updateScrewProgress(removedCount: number): void;
calculateLevelCompletion(): boolean; // Based on screws, not layers
```

**File**: `src/components/game/GameCanvas.tsx`
- Update progress display to show screw progress
- Add perfect balance indicators
- Show container fill predictions

#### Modified Events
```typescript
// Update existing events
'level:progress:updated': { 
  screwsRemoved: number; 
  totalScrews: number; 
  percentage: number;
  perfectBalanceStatus: 'on_track' | 'deviation' | 'achieved';
};

'level:complete': {
  level: number;
  screwsCollected: number;
  perfectBalance: boolean;
  finalScore: number;
};
```

### Phase 5: Container Strategy Revision

#### New System
**File**: `src/game/utils/ContainerStrategyManager.ts`
```typescript
class ContainerStrategyManager {
  executeReplacementPlan(plan: ContainerReplacementPlan): void;
  shouldReplaceContainer(
    container: Container, 
    remainingScrews: Map<string, number>
  ): boolean;
  calculateOptimalColors(remainingScrews: Map<string, number>): string[];
  validatePerfectEnding(): boolean;
}
```

#### Modified Systems
**File**: `src/game/core/GameState.ts`
- Implement smart container replacement based on pre-computed plan
- Track remaining screws by color
- Prevent unnecessary container replacements
- Ensure perfect balance achievement

### Phase 6: Save/Load System Updates

#### Modified Systems
**File**: `src/game/core/GameState.ts`
```typescript
interface FullGameSave {
  // ... existing properties
  precomputedLevel: PrecomputedLevel;
  physicsActivationState: Map<number, boolean>; // layerIndex -> isActive
  screwProgress: ScrewProgressState;
  containerReplacementPlan: ContainerReplacementPlan;
}

// New methods
savePrecomputedData(): void;
loadPrecomputedData(saveData: FullGameSave): void;
migrateOldSaveFormat(oldSave: any): FullGameSave;
```

## Event System Changes

### New Events
```typescript
// Level pre-computation
'level:precomputation:started': { targetLayers: number };
'level:precomputation:completed': { levelData: PrecomputedLevel };
'level:balance:validated': { isValid: boolean; issues: string[] };

// Physics activation
'layer:physics:activation:requested': { layerIndex: number };
'layer:physics:activated': { layerIndex: number; bodiesCreated: number };
'layer:physics:deactivated': { layerIndex: number; bodiesRemoved: number };

// Progress tracking
'screw:progress:updated': { removed: number; total: number; percentage: number };
'perfect:balance:status': { status: 'on_track' | 'deviation' | 'achieved' };

// Container strategy
'container:replacement:planned': { atScrewCount: number; newColors: string[] };
'container:replacement:executed': { containerId: string; newColors: string[] };
'perfect:balance:achieved': { finalStats: PerfectBalanceStats };
```

### Modified Events
```typescript
// Update existing events with screw-based data
'level:progress:updated': {
  // Change from layer-based to screw-based
  screwsRemoved: number;
  totalScrews: number;
  percentage: number;
};

'level:complete': {
  // Add perfect balance validation
  level: number;
  perfectBalanceAchieved: boolean;
  finalContainerState: ContainerFinalState;
};
```

## Implementation Risks & Mitigation

### Risk 1: Memory Usage Increase
**Risk**: Pre-computing all levels could significantly increase memory usage
**Mitigation**: 
- Store minimal data for dormant objects
- Implement cleanup for layers far from view
- Monitor memory usage and add warnings
- Consider level size limits

### Risk 2: Perfect Balance Complexity
**Risk**: Mathematical constraints might be too rigid for interesting gameplay
**Mitigation**:
- Allow small tolerance in early levels (1-2 screws in holding holes)
- Gradually increase precision requirements
- Provide difficulty settings for balance strictness
- Add fallback strategies for edge cases

### Risk 3: Performance Impact
**Risk**: Pre-computation could cause noticeable delays at level start
**Mitigation**:
- Implement async pre-computation with progress indicator
- Cache common calculations
- Optimize algorithms for speed
- Consider pre-computing during gameplay

### Risk 4: Save/Load Complexity
**Risk**: New data structures complicate save system
**Mitigation**:
- Version save data format properly
- Implement migration for existing saves
- Add validation for save data integrity
- Provide fallback to regeneration if save corrupted

### Risk 5: Physics Activation Timing
**Risk**: Activating physics at wrong time could cause glitches
**Mitigation**:
- Careful testing of activation transitions
- Smooth animation during activation
- Validate physics state before activation
- Add debug tools for physics state inspection

## Testing Strategy

### Unit Tests
- `PerfectBalanceCalculator` mathematical validation
- `ContainerStrategyManager` replacement logic
- `LevelPrecomputer` data generation
- Physics activation/deactivation

### Integration Tests
- Complete level pre-computation to perfect ending
- Save/load cycle with pre-computed data
- Physics activation during gameplay
- Container replacement execution

### Performance Tests
- Memory usage comparison before/after
- Level start time measurement
- Physics performance with selective activation
- Large level stress testing

## Success Criteria

### Functional Requirements
1. ✅ All levels end with perfect balance (filled containers, empty holding holes)
2. ✅ Progress accurately reflects screw completion percentage
3. ✅ Physics only active for visible layers
4. ✅ Container replacement happens only when necessary
5. ✅ Save/load preserves all pre-computed data

### Performance Requirements
1. ✅ Level start time increase < 2 seconds
2. ✅ Memory usage increase < 50%
3. ✅ No performance degradation during gameplay
4. ✅ Smooth physics activation transitions

### Quality Requirements
1. ✅ All existing functionality preserved
2. ✅ Event-driven architecture maintained
3. ✅ TypeScript type safety throughout
4. ✅ Comprehensive documentation updated

## Migration Path

### Phase 1: Infrastructure (Week 1)
- Create new systems and data structures
- Implement basic pre-computation without perfect balance
- Add physics activation framework

### Phase 2: Mathematics (Week 2)
- Implement perfect balance calculator
- Add container strategy management
- Test mathematical algorithms

### Phase 3: Integration (Week 3)
- Integrate all systems
- Update event system
- Implement save/load changes

### Phase 4: Testing & Polish (Week 4)
- Comprehensive testing
- Performance optimization
- Bug fixes and edge cases

### Phase 5: Documentation (Week 5)
- Update all documentation
- Create developer guides
- Final testing and validation

This refactor will transform PAR Shape 2D into a mathematically precise, resource-efficient game while maintaining all existing functionality and improving the player experience with perfect level completion balance.