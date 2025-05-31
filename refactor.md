# PAR Shape 2D - Event-Driven Architecture Refactor Plan

## Overview

This document outlines a comprehensive refactor plan to transform the PAR Shape 2D game from a tightly-coupled architecture to an event-driven, loosely-coupled system. The current implementation suffers from:

- Excessive parameter passing between systems
- Tight coupling causing cascading changes
- Redundant code across multiple systems
- Fragile save/restore functionality
- Difficulty in testing individual systems

## Goals

1. **Decouple Systems**: Eliminate direct dependencies between core systems
2. **Event-Driven Communication**: Replace method calls with event-based messaging
3. **Improve Save/Restore**: Make state persistence more reliable and maintainable
4. **Reduce Code Duplication**: Eliminate redundant logic across systems
5. **Enhance Testability**: Enable independent testing of each system
6. **Simplify Maintenance**: Make future feature additions easier

## Event System Design

### Core Event Categories

#### Game Lifecycle Events
```typescript
GAME_STARTED = 'game:started'
GAME_PAUSED = 'game:paused'
GAME_RESUMED = 'game:resumed'
GAME_OVER = 'game:over'
LEVEL_COMPLETE = 'level:complete'
LEVEL_STARTED = 'level:started'
```

#### Screw System Events
```typescript
SCREW_CLICKED = 'screw:clicked'
SCREW_REMOVED = 'screw:removed'
SCREW_COLLECTED = 'screw:collected'
SCREW_ANIMATION_STARTED = 'screw:animation:started'
SCREW_ANIMATION_COMPLETED = 'screw:animation:completed'
SCREW_BLOCKED = 'screw:blocked'
SCREW_UNBLOCKED = 'screw:unblocked'
```

#### Shape System Events
```typescript
SHAPE_CREATED = 'shape:created'
SHAPE_DESTROYED = 'shape:destroyed'
SHAPE_FELL_OFF_SCREEN = 'shape:fell_off_screen'
SHAPE_PHYSICS_UPDATED = 'shape:physics:updated'
SHAPE_ATTACHMENT_CHANGED = 'shape:attachment:changed'
```

#### Layer System Events
```typescript
LAYER_CREATED = 'layer:created'
LAYER_CLEARED = 'layer:cleared'
LAYER_VISIBILITY_CHANGED = 'layer:visibility:changed'
LAYERS_UPDATED = 'layers:updated'
LAYER_BOUNDS_CHANGED = 'layer:bounds:changed'
```

#### Container System Events
```typescript
CONTAINER_FILLED = 'container:filled'
CONTAINER_REPLACED = 'container:replaced'
HOLDING_HOLE_FILLED = 'holding_hole:filled'
HOLDING_HOLES_FULL = 'holding_holes:full'
CONTAINER_COLORS_UPDATED = 'container:colors:updated'
```

#### Physics Events
```typescript
PHYSICS_BODY_ADDED = 'physics:body:added'
PHYSICS_BODY_REMOVED = 'physics:body:removed'
COLLISION_DETECTED = 'physics:collision:detected'
CONSTRAINT_ADDED = 'physics:constraint:added'
CONSTRAINT_REMOVED = 'physics:constraint:removed'
PHYSICS_STEP_COMPLETED = 'physics:step:completed'
```

#### Save/Restore Events
```typescript
SAVE_REQUESTED = 'save:requested'
SAVE_COMPLETED = 'save:completed'
RESTORE_REQUESTED = 'restore:requested'
RESTORE_COMPLETED = 'restore:completed'
SAVE_STATE_CHANGED = 'save:state:changed'
```

#### Score Events
```typescript
SCORE_UPDATED = 'score:updated'
LEVEL_SCORE_UPDATED = 'level_score:updated'
TOTAL_SCORE_UPDATED = 'total_score:updated'
```

## Implementation Phases

### Phase 1: Event Bus Foundation (Week 1)

#### Day 1-2: Core Event System
**Files to Create:**
- `src/game/events/EventBus.ts`
- `src/game/events/GameEvents.ts`
- `src/game/core/BaseSystem.ts`

**EventBus Features:**
- TypeScript-safe event subscription/emission
- Event priority system for ordering
- Event history for debugging
- Async and sync event support
- Event source tracking
- Loop detection and prevention
- Performance monitoring

#### Day 3: Event Type Definitions
**File to Create:**
- `src/game/events/EventTypes.ts`

**Define:**
- All event interfaces with payloads
- Event payload validation
- Event documentation
- Type-safe event handlers

#### Day 4: Base System Class
**File to Create:**
- `src/game/core/BaseSystem.ts`

**Features:**
- Common event subscription/unsubscription
- System lifecycle management
- Auto-cleanup on destruction
- Event handler registration helpers
- Error handling and recovery

#### Day 5: Debug and Logging
**Files to Create:**
- `src/game/events/EventLogger.ts`
- `src/game/events/EventDebugger.ts`

**Features:**
- Event flow visualization
- Performance profiling
- Event replay capability
- Debug console integration
- Event filtering and search

### Phase 2: State System Decoupling (Week 2)

#### Day 1-2: GameState Refactor
**File to Refactor:**
- `src/game/core/GameState.ts`

**Changes:**
- Remove all direct method calls to other systems
- Emit events for all state changes
- Subscribe to relevant game events
- Implement event-driven save triggers
- Add state validation through events

**New Event Flows:**
- State changes → emit STATE_CHANGED events
- Score updates → emit SCORE_UPDATED events
- Level progression → emit LEVEL_* events
- Container management → emit CONTAINER_* events

#### Day 3: Save/Restore Event System
**Changes to GameState:**
- Implement SAVE_REQUESTED handler
- Emit SAVE_STATE_CHANGED for auto-save triggers
- Handle RESTORE_REQUESTED with event coordination
- Remove direct save/load method calls

**Benefits:**
- Any system can trigger saves by emitting SAVE_REQUESTED
- Restore process coordinates through events
- State consistency maintained through validation events
- No more circular dependencies in save/restore

#### Day 4-5: State Event Testing
- Create comprehensive tests for state events
- Verify save/restore through events
- Test state consistency mechanisms
- Performance testing for event overhead

### Phase 3: Core Systems Refactor (Week 3)

#### Day 1-2: LayerManager Refactor
**File to Refactor:**
- `src/game/systems/LayerManager.ts`

**Changes:**
- Remove direct references to GameState, ScrewManager
- Subscribe to SHAPE_* events for layer updates
- Emit LAYER_* events for all layer changes
- Use SAVE_REQUESTED events instead of direct saves
- Handle bounds updates through LAYER_BOUNDS_CHANGED

**Event Integrations:**
- Listen to SHAPE_FELL_OFF_SCREEN → update layer contents
- Listen to LEVEL_STARTED → generate new layers
- Emit LAYER_CLEARED → trigger level progression check
- Emit LAYERS_UPDATED → trigger rendering updates

#### Day 2: PhysicsWorld Refactor
**File to Refactor:**
- `src/game/physics/PhysicsWorld.ts`

**Changes:**
- Remove game logic, focus purely on physics
- Emit PHYSICS_* events for all physics changes
- Subscribe to CONSTRAINT_* requests from other systems
- Handle body lifecycle through events
- Remove direct references to game entities

**Event Integrations:**
- Listen to SCREW_REMOVED → emit CONSTRAINT_REMOVED
- Listen to SHAPE_CREATED → emit PHYSICS_BODY_ADDED
- Emit COLLISION_DETECTED → let other systems handle game logic
- Emit PHYSICS_STEP_COMPLETED → trigger stability checks

#### Day 3-4: ScrewManager Refactor
**File to Refactor:**
- `src/game/systems/ScrewManager.ts`

**Changes:**
- Remove direct GameState manipulation
- Remove direct container management
- Use events for all screw operations
- Handle blocking detection through layer events
- Manage animations independently

**Event Integrations:**
- Listen to SCREW_CLICKED → validate and emit SCREW_REMOVED
- Listen to CONTAINER_COLORS_UPDATED → update screw targeting
- Emit SCREW_COLLECTED → let GameState handle scoring
- Listen to LAYER_VISIBILITY_CHANGED → update blocking status

#### Day 5: ShapeFactory Refactor
**File to Refactor:**
- `src/game/systems/ShapeFactory.ts`

**Changes:**
- Make factory purely generative
- Emit SHAPE_CREATED events
- Remove direct layer manipulation
- Use events for shape placement and physics setup

### Phase 4: GameManager Simplification (Week 4)

#### Day 1-3: GameManager Event Orchestration
**File to Refactor:**
- `src/game/core/GameManager.ts`

**Changes:**
- Remove all business logic
- Focus on input handling and rendering coordination
- Become primary event orchestrator
- Remove direct system method calls
- Simplify initialization through events

**New Responsibilities:**
- Handle user input → emit appropriate events
- Coordinate rendering loop
- Manage canvas and scaling
- Event-driven system initialization
- Debug mode coordination

**Event Orchestration Examples:**
- Mouse/touch input → emit SCREW_CLICKED
- Keyboard input → emit DEBUG_TOGGLE, SAVE_REQUESTED
- Rendering loop → emit RENDER_REQUESTED
- Window resize → emit BOUNDS_CHANGED

#### Day 4-5: Input System Cleanup
- Simplify coordinate transformation
- Remove business logic from input handlers
- Clean up parameter passing in rendering
- Optimize event-driven rendering loop

### Phase 5: Testing and Validation (Week 5, Days 1-3)

#### Comprehensive Testing Plan

**Save/Restore Testing:**
- Test save triggers from various events
- Verify complete state restoration
- Test partial state scenarios
- Stress test with rapid save/restore cycles

**Event Flow Testing:**
- Verify no circular event loops
- Test event ordering and priorities
- Performance testing under load
- Memory leak detection in event handlers

**System Integration Testing:**
- Test all game mechanics still work
- Verify mobile touch handling
- Test debug features
- Cross-browser compatibility

**Regression Testing:**
- Complete gameplay scenarios
- Edge cases and error conditions
- Performance benchmarking
- Mobile device testing

### Phase 6: Cleanup and Documentation (Week 5, Days 4-5)

#### Code Cleanup
- Remove redundant code identified during refactor
- Optimize event flows for performance
- Clean up unused imports and dependencies
- Standardize error handling across systems

#### Documentation Updates
- Update `project_design.md` with new architecture
- Create event flow diagrams
- Document event contracts and payloads
- Add debugging guides for event system

#### Performance Optimization
- Profile event system performance
- Optimize high-frequency events
- Implement event batching where beneficial
- Memory usage optimization

## New File Structure

### Event System Files
```
src/game/events/
├── EventBus.ts          # Central event bus implementation
├── GameEvents.ts        # Event type definitions and interfaces
├── EventTypes.ts        # TypeScript type definitions
├── EventLogger.ts       # Debug and logging utilities
└── EventDebugger.ts     # Development tools and visualization
```

### Core System Updates
```
src/game/core/
├── BaseSystem.ts        # Base class for event-aware systems
├── GameManager.ts       # Simplified event orchestrator
├── GameState.ts         # Event-driven state management
└── GameLoop.ts          # Event-driven game loop
```

## Benefits of Event-Driven Architecture

### Decoupling Benefits
- **Independent Development**: Systems can be developed and tested in isolation
- **Easier Feature Addition**: New features don't require modifying existing systems
- **Better Separation of Concerns**: Each system has a single, clear responsibility
- **Reduced Complexity**: Individual systems become simpler and more focused

### Save/Restore Benefits
- **Automatic State Tracking**: State changes automatically trigger save events
- **Distributed Restoration**: Each system handles its own restoration
- **Consistency Guarantees**: Event validation ensures state consistency
- **Debugging Capability**: Event logs show exact sequence of state changes

### Maintenance Benefits
- **Easier Bug Tracking**: Event logs provide clear audit trail
- **Simplified Testing**: Individual systems can be unit tested
- **Better Code Organization**: Clear boundaries between systems
- **Reduced Regression Risk**: Changes to one system don't affect others

### Performance Benefits
- **Async Processing**: Non-critical events can be processed asynchronously
- **Event Batching**: Similar events can be batched for efficiency
- **Selective Processing**: Systems only process relevant events
- **Memory Efficiency**: Reduced object passing and duplication

## Risk Mitigation

### Implementation Risks
- **Event Ordering Issues**: Use priority system and synchronous events where needed
- **Circular Dependencies**: Implement loop detection and event source tracking
- **Performance Impact**: Profile and optimize high-frequency event paths
- **Debugging Complexity**: Provide comprehensive logging and visualization tools

### Migration Strategy
- **Incremental Implementation**: Implement one phase at a time
- **Backward Compatibility**: Keep old interfaces during transition
- **Extensive Testing**: Test each phase thoroughly before proceeding
- **Rollback Plan**: Ability to revert any phase if issues arise

### Quality Assurance
- **Code Reviews**: Review each phase with focus on event contracts
- **Integration Testing**: Comprehensive testing after each phase
- **Performance Monitoring**: Track performance impact throughout migration
- **User Testing**: Verify game mechanics remain intact

## Success Metrics

### Technical Metrics
- **Coupling Reduction**: Measure system dependencies before/after
- **Code Duplication**: Track redundant code elimination
- **Test Coverage**: Achieve >90% coverage for event system
- **Performance**: Maintain or improve current performance levels

### Quality Metrics
- **Bug Reduction**: Fewer save/restore related bugs
- **Development Velocity**: Faster feature development after refactor
- **Code Maintainability**: Improved code review and modification ease
- **System Reliability**: More stable game state management

## Timeline Summary

| Phase | Duration | Focus | Key Deliverables |
|-------|----------|-------|------------------|
| 1 | Week 1 | Event Bus Foundation | EventBus, BaseSystem, Event types, Debug tools |
| 2 | Week 2 | State Decoupling | Event-driven GameState, Save/restore via events |
| 3 | Week 3 | Systems Refactor | Decoupled LayerManager, ScrewManager, PhysicsWorld |
| 4 | Week 4 | GameManager Simplification | Event orchestrator, Clean input/rendering |
| 5 | Week 5 | Testing & Cleanup | Comprehensive testing, Performance optimization |

**Total Duration**: 5 weeks

**Risk Buffer**: Add 1-2 weeks for unexpected issues and additional testing

This refactor will transform PAR Shape 2D into a maintainable, testable, and extensible codebase with reliable save/restore functionality and clear system boundaries.