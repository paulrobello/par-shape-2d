# Shared Refactor Plan - Game and Editor Consolidation

## Executive Summary

The current codebase has significant duplication between the game and editor modules, leading to logic drift, maintenance overhead, and increased complexity. This plan outlines a comprehensive refactoring to extract shared functionality into reusable utilities, starting with screw placement strategies as the primary focus.

**Key Issues Identified:**
- **1000+ lines** of duplicated screw placement logic between game and editor
- **500+ lines** of duplicated physics integration code
- **200+ lines** of duplicated shape validation logic
- Inconsistent constants and configuration across modules
- Tight coupling between editor and game-specific implementations

**Proposed Solution:**
Create a unified `src/shared/` directory with domain-specific modules that both game and editor can consume, eliminating duplication while maintaining clean separation of concerns.

## Current State Analysis

### Major Duplication Areas

#### 1. Screw Placement Strategy (Highest Priority)

**Game Implementation:**
- `src/game/utils/ScrewPositionUtils.ts` (641 lines) - Comprehensive strategy implementations
- `src/game/utils/ScrewCollisionUtils.ts` (264 lines) - Collision detection utilities  
- `src/game/utils/ScrewContainerUtils.ts` (198 lines) - Container/holding hole logic
- `src/game/systems/ScrewManager.ts` (800+ lines) - Game-specific screw management

**Editor Implementation:**
- `src/editor/systems/ShapeEditorManager.ts` (1614 lines) - **Completely duplicated** strategy implementations
  - `calculateCornerPositions()` - Duplicates game's `getCornerPositions()`
  - `calculatePerimeterPositions()` - Duplicates game's `getPerimeterPositions()`
  - `calculateGridPositions()` - Duplicates game's `getGridPositions()` 
  - `calculateCapsulePositions()` - Duplicates game's `getCapsulePositions()`
  - `calculateCustomPositions()` - Duplicates game's `getCustomPositions()`

**Key Problem:** The editor has reimplemented **all** screw placement strategies instead of reusing the well-designed game utilities. This leads to:
- **Logic drift** - Different bugs and behaviors between game and editor
- **Maintenance overhead** - Bug fixes must be applied twice
- **Code bloat** - ~1000 lines of unnecessary duplication

#### 2. Physics Integration (Medium Priority)

**Duplication:**
- `src/game/physics/PhysicsWorld.ts` (577 lines) vs `src/editor/systems/PhysicsSimulator.ts` (494 lines)
- Both create Matter.js worlds, handle constraints, and manage physics bodies
- Similar physics body creation patterns duplicated

#### 3. Shape Definition Handling (Medium Priority)

**Duplication:**
- `src/game/systems/ShapeLoader.ts` - Shape loading and validation for built-in shapes
- `src/editor/systems/FileManager.ts` - File I/O and validation for user shapes
- Nearly identical validation logic applied differently

### Current Sharing Patterns

**What's Already Shared (Good Examples):**
- `src/types/` - Shape definitions and game types
- `src/game/utils/MathUtils.ts` - Mathematical functions (properly imported by editor)
- `src/game/utils/Colors.ts` - Color utilities
- Some constants imported from game to editor

**Current Import Pattern:**
```typescript
// Editor importing from game (creates tight coupling)
import { ShapeRenderer } from '@/game/rendering/ShapeRenderer';
import { PhysicsWorld } from '@/game/physics/PhysicsWorld';
import { PHYSICS_CONSTANTS } from '@/game/utils/Constants';
```

## Proposed Architecture

### New Directory Structure

```
src/
├── shared/                                 # 🆕 New shared utilities
│   ├── core/
│   │   ├── BaseSystem.ts                   # Unified base system class
│   │   ├── EventBusInterface.ts            # Common event patterns
│   │   └── SystemManager.ts                # System lifecycle management
│   ├── entities/
│   │   ├── Shape.ts                        # 📦 Moved from game/entities/
│   │   ├── Screw.ts                        # 📦 Moved from game/entities/
│   │   └── Layer.ts                        # 📦 Moved from game/entities/
│   ├── physics/
│   │   ├── PhysicsWorld.ts                 # 📦 Moved from game/physics/
│   │   ├── PhysicsBodyFactory.ts           # 🆕 Extracted from multiple sources
│   │   └── ConstraintUtils.ts              # 🆕 Shared constraint management
│   ├── rendering/
│   │   ├── ShapeRenderer.ts                # 📦 Enhanced from game/rendering/
│   │   ├── ScrewRenderer.ts                # 📦 Moved from game/rendering/
│   │   └── RenderUtils.ts                  # 🆕 Common rendering utilities
│   ├── strategies/                         # 🆕 Screw placement strategies
│   │   ├── ScrewPlacementStrategy.ts       # 🆕 Unified strategy interface
│   │   ├── CornerStrategy.ts               # 🆕 Extracted from multiple sources
│   │   ├── PerimeterStrategy.ts            # 🆕 Extracted from multiple sources
│   │   ├── GridStrategy.ts                 # 🆕 Extracted from multiple sources
│   │   ├── CapsuleStrategy.ts              # 🆕 Extracted from multiple sources
│   │   ├── CustomStrategy.ts               # 🆕 Extracted from multiple sources
│   │   └── index.ts                        # 🆕 Strategy factory
│   ├── utils/
│   │   ├── Constants.ts                    # 🔄 Consolidated from multiple files
│   │   ├── MathUtils.ts                    # 📦 Moved from game/utils/
│   │   ├── Colors.ts                       # 📦 Moved from game/utils/
│   │   ├── ValidationUtils.ts              # 🆕 Extracted from multiple sources
│   │   ├── GeometryUtils.ts                # 🆕 Geometric calculations
│   │   ├── CollisionUtils.ts               # 📦 Enhanced from ScrewCollisionUtils
│   │   ├── FileUtils.ts                    # 🆕 File I/O utilities
│   │   └── PhysicsInit.ts                  # 📦 Moved from game/utils/
│   └── validation/
│       ├── ShapeValidator.ts               # 🆕 Unified shape validation
│       ├── PropertyValidator.ts            # 🆕 Property validation rules
│       └── ValidationRules.ts              # 🆕 Common validation patterns
├── game/                                   # 🔄 Refactored to use shared/
│   ├── systems/
│   │   ├── ScrewManager.ts                 # 🔄 Uses shared/strategies/
│   │   ├── ShapeFactory.ts                 # 🔄 Uses shared/physics/
│   │   └── ShapeLoader.ts                  # 🔄 Uses shared/validation/
│   └── utils/                              # 🔄 Game-specific utilities only
├── editor/                                 # 🔄 Refactored to use shared/
│   ├── systems/
│   │   ├── ShapeEditorManager.ts           # 🔄 Simplified using shared/strategies/
│   │   ├── FileManager.ts                  # 🔄 Uses shared/validation/
│   │   └── PhysicsSimulator.ts             # 🔄 Uses shared/physics/
│   └── utils/                              # 🔄 Editor-specific utilities only
├── types/                                  # ✅ Keep existing structure
└── data/                                   # ✅ Keep existing structure
```

### Key Design Principles

1. **Framework Agnostic** - Shared utilities have no React or game-specific dependencies
2. **Strategy Pattern** - Screw placement strategies implement common interface
3. **Dependency Injection** - Systems can inject different strategy implementations
4. **Type Safety** - Comprehensive TypeScript interfaces for all shared functionality
5. **Single Responsibility** - Each shared module has a focused purpose

## Detailed Migration Plan

### Phase 1: Screw Placement Strategy Consolidation (Priority 1)

**Objective:** Eliminate 1000+ lines of duplicated screw placement code

#### Step 1.1: Create Strategy Interface and Base Classes

```typescript
// src/shared/strategies/ScrewPlacementStrategy.ts
export interface ScrewPlacementStrategy {
  getName(): string;
  calculatePositions(shape: Shape, config: PlacementConfig): Vector2[];
  validateConfig(config: PlacementConfig): ValidationResult;
}

export abstract class BasePlacementStrategy implements ScrewPlacementStrategy {
  protected minSeparation: number = 20;
  protected applyMinSeparation(positions: Vector2[]): Vector2[];
  // Common filtering and validation logic
}
```

#### Step 1.2: Extract Strategy Implementations

**From:** `src/game/utils/ScrewPositionUtils.ts` and `src/editor/systems/ShapeEditorManager.ts`  
**To:** Individual strategy classes in `src/shared/strategies/`

```typescript
// src/shared/strategies/CornerStrategy.ts
export class CornerStrategy extends BasePlacementStrategy {
  calculatePositions(shape: Shape, config: CornerPlacementConfig): Vector2[] {
    // Consolidate BEST logic from both game and editor implementations
    // Use editor's enhanced corner detection algorithms
    // Apply game's robust filtering logic
  }
}

// src/shared/strategies/PerimeterStrategy.ts  
export class PerimeterStrategy extends BasePlacementStrategy {
  calculatePositions(shape: Shape, config: PerimeterPlacementConfig): Vector2[] {
    // Merge game's edge-based distribution with editor's vertex precision
  }
}
```

#### Step 1.3: Create Strategy Factory

```typescript
// src/shared/strategies/index.ts
export class ScrewPlacementStrategyFactory {
  static create(strategyType: PlacementStrategyType): ScrewPlacementStrategy {
    switch (strategyType) {
      case 'corners': return new CornerStrategy();
      case 'perimeter': return new PerimeterStrategy();
      case 'grid': return new GridStrategy();
      case 'capsule': return new CapsuleStrategy();  
      case 'custom': return new CustomStrategy();
    }
  }
}
```

#### Step 1.4: Refactor Game Systems

```typescript
// src/game/systems/ScrewManager.ts (simplified)
import { ScrewPlacementStrategyFactory } from '@/shared/strategies';

export class ScrewManager extends BaseSystem {
  generateScrewsForShape(shape: Shape): Screw[] {
    const strategy = ScrewPlacementStrategyFactory.create(shape.screwPlacement.strategy);
    const positions = strategy.calculatePositions(shape, shape.screwPlacement);
    // Rest of game-specific logic (physics constraints, animations, etc.)
  }
}
```

#### Step 1.5: Refactor Editor Systems

```typescript
// src/editor/systems/ShapeEditorManager.ts (massively simplified)
import { ScrewPlacementStrategyFactory } from '@/shared/strategies';

export class ShapeEditorManager extends BaseEditorSystem {
  calculatePotentialScrewPositions(): Vector2[] {
    if (!this.currentShape) return [];
    
    const strategy = ScrewPlacementStrategyFactory.create(
      this.currentShape.screwPlacement.strategy
    );
    return strategy.calculatePositions(this.currentShape, this.currentShape.screwPlacement);
  }
  
  // Remove 500+ lines of duplicated strategy implementations!
}
```

**Impact:** 
- ✅ **~1000 lines removed** from editor
- ✅ **Logic consistency** between game and editor
- ✅ **Single source of truth** for screw placement algorithms
- ✅ **Enhanced functionality** - merge best features from both implementations

### Phase 2: Physics Integration Consolidation (Priority 2)

**Objective:** Reduce physics code duplication and improve consistency

#### Step 2.1: Extract Physics Body Factory

```typescript
// src/shared/physics/PhysicsBodyFactory.ts
export class PhysicsBodyFactory {
  static createShapeBody(shape: Shape, options: BodyOptions): Matter.Body {
    // Consolidated body creation logic from game and editor
  }
  
  static createScrewBody(screw: Screw, options: BodyOptions): Matter.Body {
    // Unified screw physics body creation
  }
  
  static createConstraint(bodyA: Matter.Body, bodyB: Matter.Body, options: ConstraintOptions): Matter.Constraint {
    // Shared constraint creation with consistent parameters
  }
}
```

#### Step 2.2: Enhance PhysicsWorld as Shared Utility

```typescript
// src/shared/physics/PhysicsWorld.ts (enhanced)
export class PhysicsWorld {
  // Existing functionality
  
  // Add editor-specific methods
  createSimulationBodies(shape: Shape, screws: Screw[]): SimulationBodies {
    // Logic extracted from editor's PhysicsSimulator
  }
  
  resetSimulation(): void {
    // Unified reset logic for both game and editor
  }
}
```

### Phase 3: Validation Consolidation (Priority 3)

**Objective:** Unify shape validation logic between game and editor

#### Step 3.1: Create Shared Validation Framework

```typescript
// src/shared/validation/ShapeValidator.ts
export class ShapeValidator {
  static validateShapeDefinition(definition: ShapeDefinition): ValidationResult {
    // Merge validation logic from ShapeLoader and FileManager
    // Apply consistent rules for dimensions, properties, constraints
  }
  
  static validateScrewPlacement(placement: ScrewPlacementConfig): ValidationResult {
    // Unified screw placement validation
  }
}
```

### Phase 4: Constants and Configuration Consolidation (Priority 4)

**Objective:** Centralize configuration and eliminate duplicate constants

#### Step 4.1: Consolidate Constants

```typescript
// src/shared/utils/Constants.ts
export const PHYSICS_CONSTANTS = {
  // Merged from game and editor
};

export const UI_CONSTANTS = {
  // Shared UI configuration
};

export const SCREW_CONSTANTS = {
  // Screw-related configuration
  MIN_SEPARATION: 20,
  CLICK_RADIUS: 15,
  VISUAL_RADIUS: 6,
};
```

### Phase 5: Rendering Consolidation (Priority 5)

**Objective:** Minimize rendering code duplication

#### Step 5.1: Enhance ShapeRenderer for Shared Use

```typescript
// src/shared/rendering/ShapeRenderer.ts
export class ShapeRenderer {
  // Enhanced to support both game and editor rendering modes
  renderShape(shape: Shape, context: RenderContext, options: RenderOptions): void {
    // Unified shape rendering with configurable options
  }
  
  renderDebugInfo(shape: Shape, context: RenderContext): void {
    // Debug rendering available for both game and editor
  }
}
```

## Risk Assessment and Mitigation

### High Risk Areas

#### 1. **Breaking Changes to Existing Functionality**
- **Risk:** Refactoring could introduce bugs in working features
- **Mitigation:** 
  - Comprehensive test coverage before refactoring
  - Incremental migration with feature flags
  - Extensive testing after each phase

#### 2. **Import Path Changes**
- **Risk:** Large number of import statements need updating
- **Mitigation:**
  - Use TypeScript compiler for automated refactoring
  - Create temporary re-exports during transition
  - Update imports incrementally

#### 3. **Logic Consolidation Conflicts**
- **Risk:** Game and editor implementations may have subtle behavioral differences
- **Mitigation:**
  - Document current behaviors before consolidation
  - Create comprehensive test suites covering edge cases
  - Preserve domain-specific configuration options

### Medium Risk Areas

#### 1. **Performance Impact**
- **Risk:** Additional abstraction layers could affect performance
- **Mitigation:**
  - Profile critical paths before and after refactoring
  - Optimize shared utilities for performance
  - Minimize object allocation in strategy implementations

#### 2. **Event System Integration**
- **Risk:** Changes to shared entities might affect event propagation
- **Mitigation:**
  - Maintain existing event interfaces
  - Test event flows thoroughly
  - Document any event signature changes

### Low Risk Areas

- Constants consolidation (minimal impact)
- Utility function extraction (isolated changes)
- New strategy pattern implementation (additive)

## Testing Strategy

### Unit Testing Requirements

1. **Strategy Tests**: Each screw placement strategy must have comprehensive unit tests
2. **Physics Tests**: Validate physics body creation and constraint behavior  
3. **Validation Tests**: Ensure shape validation behaves consistently
4. **Integration Tests**: Test game and editor using shared utilities

### Test Coverage Goals

- **Screw Placement Strategies**: 95% coverage
- **Physics Integration**: 90% coverage
- **Validation Logic**: 95% coverage
- **Shared Utilities**: 90% coverage

## Timeline and Milestones

### Phase 1: Screw Placement (2-3 weeks)
- **Week 1**: Create strategy interfaces and base classes
- **Week 2**: Extract and consolidate strategy implementations  
- **Week 3**: Refactor game and editor to use shared strategies, testing

### Phase 2: Physics Integration (1-2 weeks)
- **Week 1**: Extract physics body factory and enhance PhysicsWorld
- **Week 2**: Refactor game and editor physics integration

### Phase 3: Validation (1 week)
- Create shared validation framework and update systems

### Phase 4: Constants (1 week)  
- Consolidate constants and update imports

### Phase 5: Rendering (1 week)
- Enhance ShapeRenderer for shared use

**Total Estimated Timeline: 6-8 weeks**

## Success Metrics

### Code Quality Metrics
- **Lines of Code Reduction**: Target 1500+ lines removed
- **Duplication Elimination**: <5% code duplication between game/editor
- **Test Coverage**: >90% for shared utilities

### Maintainability Metrics  
- **Single Source of Truth**: All screw placement logic in shared strategies
- **Consistent Behavior**: Game and editor produce identical results for same inputs
- **Reduced Coupling**: Editor no longer directly imports from game/ directory

### Performance Metrics
- **No Performance Regression**: Maintain current frame rates
- **Memory Usage**: No significant increase in memory allocation

## Implementation Guidelines

### Code Organization Principles

1. **Pure Functions**: Shared utilities should be stateless where possible
2. **Dependency Injection**: Allow systems to inject different implementations
3. **Interface Segregation**: Create focused interfaces for specific needs
4. **Configuration Over Code**: Use configuration objects instead of hardcoded values

### File Naming Conventions

- Strategy implementations: `[StrategyName]Strategy.ts`
- Utility modules: `[Domain]Utils.ts`  
- Validation modules: `[Domain]Validator.ts`
- Interface definitions: `I[Name].ts`

### Documentation Requirements

- JSDoc comments for all public methods
- README.md for each shared module directory
- Migration guide for updating existing code
- Examples for common usage patterns

## Conclusion

This refactoring plan addresses the significant duplication between game and editor modules, with screw placement strategy consolidation as the primary focus. The proposed shared utilities architecture will:

1. **Eliminate ~1500 lines** of duplicated code
2. **Prevent logic drift** between game and editor implementations  
3. **Improve maintainability** through single source of truth
4. **Enable feature consistency** across both modules
5. **Provide foundation** for future shared functionality

The incremental approach minimizes risk while delivering immediate benefits, starting with the highest-impact areas and progressing through lower-risk consolidations.

**Next Steps:**
1. Review and approve this plan
2. Create feature branch for Phase 1 implementation
3. Begin with screw placement strategy interface design
4. Implement strategy consolidation incrementally with comprehensive testing

---

*This plan represents a comprehensive analysis of the current codebase and a strategic approach to eliminating duplication while maintaining functionality and performance.*