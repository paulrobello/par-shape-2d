# Event Flow Mapping - PAR Shape 2D

## Table of Contents
1. [Overview](#overview)
2. [Event Statistics](#event-statistics)
3. [Event Categories](#event-categories)
4. [Complete Event Mapping](#complete-event-mapping)
5. [System Event Matrix](#system-event-matrix)
6. [Event Flow Diagrams](#event-flow-diagrams)
7. [Event Dependencies](#event-dependencies)
8. [Performance Analysis](#performance-analysis)
9. [Recent Updates](#recent-updates)

## Overview

This document provides a comprehensive mapping of all events in the PAR Shape 2D event-driven architecture. The game uses a centralized EventBus system where all systems communicate through well-defined events, ensuring loose coupling and maintainability.

**Architecture Summary:**
- **Event Types**: 72 defined event types covering all system interactions
- **Systems**: 7 major systems using event-driven communication
- **Event Bus**: Centralized singleton with priority handling and debugging
- **Event Emissions**: 148 total emission points across all systems
- **Event Subscriptions**: 62 subscription points across all systems

## Event Statistics

### Current State (Updated Analysis)
- **Total Event Types Defined**: 72 unique event types
- **Total Event Emissions**: 148 emissions across all systems
- **Total Event Subscriptions**: 62 subscriptions across all systems
- **Event Categories**: 11 distinct categories
- **Active Systems**: 7 systems with event handling

### Event Distribution by System
| System | Emissions | Subscriptions | Ratio |
|--------|-----------|---------------|-------|
| **GameState** | 53 | 10 | 5.3:1 |
| **ScrewManager** | 51 | 12 | 4.3:1 |
| **LayerManager** | 26 | 7 | 3.7:1 |
| **GameManager** | 12 | 18 | 0.7:1 |
| **PhysicsWorld** | 4 | 9 | 0.4:1 |
| **EventFlowValidator** | 1 | 15 | 0.1:1 |
| **SystemCoordinator** | 1 | 0 | ∞:1 |

## Event Categories

### Game Lifecycle Events (7 types)
| Event Type | Purpose | Emitters | Subscribers |
|------------|---------|----------|-------------|
| `game:started` | Game initialization and restart | GameManager, GameState | GameManager, EventFlowValidator |
| `game:paused` | Pause game execution | GameManager | PhysicsWorld |
| `game:resumed` | Resume game execution | GameManager | PhysicsWorld |
| `game:over` | End game state | GameManager, GameState | GameManager, EventFlowValidator |
| `level:started` | New level initialization | GameManager, GameState | GameManager, LayerManager, EventFlowValidator |
| `level:complete` | Level completion | GameState | GameManager, EventFlowValidator |
| `level:progress:updated` | Level progress tracking | GameState | GameManager |

### Screw System Events (10 types)
| Event Type | Purpose | Emitters | Subscribers |
|------------|---------|----------|-------------|
| `screw:clicked` | User screw interaction | GameManager | ScrewManager, EventFlowValidator |
| `screw:removed` | Screw constraint removal | ScrewManager | EventFlowValidator |
| `screw:collected` | Screw collection completion | ScrewManager | GameState, EventFlowValidator |
| `screw:blocked` | Screw becomes unremovable | ScrewManager | None |
| `screw:unblocked` | Screw becomes removable | ScrewManager | None |
| `screw:animation:started` | Collection animation start | ScrewManager | None |
| `screw:animation:completed` | Collection animation end | ScrewManager | None |
| `screw:transfer:started` | Transfer to container start | GameState | ScrewManager |
| `screw:transfer:completed` | Transfer to container end | ScrewManager | GameState, ScrewManager |
| `screw:transfer:color_check` | Color validation for transfer | GameState | ScrewManager |

### Shape System Events (6 types)
| Event Type | Purpose | Emitters | Subscribers |
|------------|---------|----------|-------------|
| `shape:created` | Shape instantiation | LayerManager | ScrewManager, EventFlowValidator |
| `shape:destroyed` | Shape removal | LayerManager | GameState, ScrewManager |
| `shape:fell_off_screen` | Shape out of bounds | LayerManager | LayerManager |
| `shape:physics:updated` | Shape physics changes | None | None |
| `shape:attachment:changed` | Screw attachment changes | None | None |
| `shape:screws:ready` | Shape screw setup complete | ScrewManager | LayerManager |

### Layer System Events (6 types)
| Event Type | Purpose | Emitters | Subscribers |
|------------|---------|----------|-------------|
| `layer:created` | Layer instantiation | LayerManager | EventFlowValidator |
| `layer:cleared` | Layer completion | LayerManager | GameState |
| `layer:visibility:changed` | Layer visibility toggle | LayerManager | None |
| `layers:updated` | Visible layers changed | LayerManager | GameManager |
| `layer:bounds:changed` | Layer boundary updates | LayerManager | None |
| `layer:shapes:ready` | Layer shape setup complete | LayerManager | GameState |

### Container System Events (9 types)
| Event Type | Purpose | Emitters | Subscribers |
|------------|---------|----------|-------------|
| `container:filled` | Container becomes full | GameState | GameManager, GameState |
| `container:replaced` | Container replacement | GameState | GameManager |
| `container:colors:updated` | Container color changes | GameState | ScrewManager, LayerManager |
| `container:state:updated` | Container state changes | GameState | GameManager, ScrewManager |
| `holding_hole:filled` | Holding hole occupied | GameState | GameManager, GameState |
| `holding_holes:full` | All holding holes full | GameState | GameManager |
| `holding_hole:state:updated` | Holding hole state changes | GameState | GameManager, ScrewManager |
| `screw_colors:requested` | Request for active screw colors | GameState | ScrewManager |
| `screw:transfer:color_check` | Color validation request | GameState | ScrewManager |

### Physics Events (8 types)
| Event Type | Purpose | Emitters | Subscribers |
|------------|---------|----------|-------------|
| `physics:body:added` | Physics body creation | ScrewManager, LayerManager | PhysicsWorld, EventFlowValidator |
| `physics:body:removed` | Physics body removal | ScrewManager, LayerManager | PhysicsWorld |
| `physics:body:removed:immediate` | Immediate anchor body removal | ScrewManager | PhysicsWorld |
| `physics:screw:removed:immediate` | Atomic screw constraint/body removal | ScrewManager | PhysicsWorld |
| `physics:constraint:added` | Constraint creation | ScrewManager | PhysicsWorld, EventFlowValidator |
| `physics:constraint:removed` | Constraint removal | ScrewManager | PhysicsWorld |
| `physics:collision:detected` | Collision detection | PhysicsWorld | GameManager |
| `physics:step:completed` | Physics step completion | PhysicsWorld | None |

### Save/Restore Events (5 types)
| Event Type | Purpose | Emitters | Subscribers |
|------------|---------|----------|-------------|
| `save:requested` | Save game state | GameManager | GameState, ScrewManager, LayerManager, EventFlowValidator |
| `save:completed` | Save operation done | GameState | None |
| `restore:requested` | Restore game state | GameManager | GameState, ScrewManager, LayerManager, EventFlowValidator |
| `restore:completed` | Restore operation done | GameState | None |
| `save:state:changed` | Unsaved changes flag | GameState | None |

### Score Events (3 types)
| Event Type | Purpose | Emitters | Subscribers |
|------------|---------|----------|-------------|
| `score:updated` | Points awarded | GameState | GameManager |
| `level_score:updated` | Level score changed | GameState | GameManager |
| `total_score:updated` | Total score changed | GameState | GameManager |

### Debug Events (3 types)
| Event Type | Purpose | Emitters | Subscribers |
|------------|---------|----------|-------------|
| `debug:mode:toggled` | Debug mode toggle | GameManager | GameManager, EventFlowValidator |
| `debug:info:requested` | Debug data request | GameManager, EventFlowValidator | GameManager |
| `debug:performance:test` | Performance testing | None | EventDebugger |

### Error Events (3 types)
| Event Type | Purpose | Emitters | Subscribers |
|------------|---------|----------|-------------|
| `system:error` | System-level errors | None | None |
| `physics:error` | Physics simulation errors | PhysicsWorld | None |
| `save:error` | Save/restore errors | None | None |

### Rendering Events (2 types)
| Event Type | Purpose | Emitters | Subscribers |
|------------|---------|----------|-------------|
| `render:requested` | Render frame request | None | None |
| `bounds:changed` | Canvas bounds update | GameManager | PhysicsWorld, LayerManager, GameState |

### System Coordination Events (1 type)
| Event Type | Purpose | Emitters | Subscribers |
|------------|---------|----------|-------------|
| `system:ready` | System initialization complete | SystemCoordinator | EventFlowValidator |

## Complete Event Mapping

### GameState.ts (State Management)
**File:** `src/game/core/GameState.ts`

**Events Emitted (53 total):**
```typescript
// Container management
'container:state:updated'      // Lines 110, 227, 559, 730, 914
'container:filled'             // Lines 117, 217
'container:replaced'           // Line 715
'container:colors:updated'     // Lines 358, 485, 723

// Holding holes
'holding_hole:state:updated'   // Lines 138, 189, 588, 920
'holding_hole:filled'          // Lines 144, 871
'holding_holes:full'           // Lines 158, 180

// Save/restore
'save:completed'               // Lines 253, 266
'save:state:changed'           // Lines 260, 290, 517, 1008
'restore:completed'            // Line 282

// Game flow
'game:started'                 // Lines 304, 399
'game:over'                    // Line 421
'level:complete'               // Line 437
'level:started'                // Lines 310, 404, 472
'level:progress:updated'       // Line 375
'total_score:updated'          // Line 444

// Scoring
'score:updated'                // Line 498
'level_score:updated'          // Lines 478, 506

// Transfer events
'screw:transfer:color_check'   // Line 799
'screw:transfer:started'       // Line 854
```

**Events Subscribed (10 total):**
```typescript
'screw:collected'              // Handler: handleScrewCollected
'bounds:changed'               // Handler: handleBoundsChanged
'save:requested'               // Handler: handleSaveRequested
'restore:requested'            // Handler: handleRestoreRequested
'layer:shapes:ready'           // Handler: handleLayerShapesReady
'container:filled'             // Handler: handleContainerFilled
'holding_hole:filled'          // Handler: handleHoldingHoleFilled
'screw:transfer:completed'     // Handler: handleScrewTransferCompleted
'layer:cleared'                // Handler: handleLayerCleared
'shape:destroyed'              // Handler: handleShapeDestroyed
```

### ScrewManager.ts (Screw System)
**File:** `src/game/systems/ScrewManager.ts`

**Events Emitted (51 total):**
```typescript
// Screw lifecycle
'screw:collected'              // Line 91
'screw:removed'                // Line 282
'screw:animation:started'      // Line 1553
'screw:animation:completed'    // Line 1576
'screw:unblocked'              // Line 1372
'screw:blocked'                // Line 1378

// Physics integration
'physics:body:added'           // Lines 1002, 1289
'physics:constraint:added'     // Lines 1028, 1314
'physics:constraint:removed'   // Lines 1170, 1256, 1654
'physics:body:removed:immediate' // Lines 1180, 1268, 1670
'physics:screw:removed:immediate' // Line 1051

// Shape integration
'shape:screws:ready'           // Line 562

// Transfer events
'screw:transfer:completed'     // Line 1610
```

**Events Subscribed (12 total):**
```typescript
'shape:created'                // Handler: handleShapeCreated
'shape:destroyed'              // Handler: handleShapeDestroyed
'screw:clicked'                // Handler: handleScrewClicked
'container:colors:updated'     // Handler: handleContainerColorsUpdated
'save:requested'               // Handler: handleSaveRequested
'restore:requested'            // Handler: handleRestoreRequested
'container:state:updated'      // Handler: handleContainerStateUpdated
'holding_hole:state:updated'   // Handler: handleHoldingHoleStateUpdated
'screw:transfer:started'       // Handler: handleScrewTransferStarted
'screw:transfer:completed'     // Handler: handleScrewTransferCompleted
'screw_colors:requested'       // Handler: handleScrewColorsRequested
'screw:transfer:color_check'   // Handler: handleScrewTransferColorCheck
```

### LayerManager.ts (Layer System)
**File:** `src/game/systems/LayerManager.ts`

**Events Emitted (26 total):**
```typescript
// Layer management
'layer:bounds:changed'         // Line 107
'layer:shapes:ready'           // Line 182
'layer:created'                // Line 244
'layer:cleared'                // Line 445
'layer:visibility:changed'     // Line 522
'layers:updated'               // Line 531

// Shape management
'shape:created'                // Line 312
'shape:destroyed'              // Lines 379, 415, 654
'shape:fell_off_screen'        // Line 596

// Physics integration
'physics:body:added'           // Line 320
'physics:body:removed'         // Lines 371, 407, 647
```

**Events Subscribed (7 total):**
```typescript
'level:started'                // Handler: handleLevelStarted
'bounds:changed'               // Handler: handleBoundsChanged
'container:colors:updated'     // Handler: handleContainerColorsUpdated
'shape:fell_off_screen'        // Handler: handleShapeFellOffScreen
'shape:screws:ready'           // Handler: handleShapeScrewsReady
'save:requested'               // Handler: handleSaveRequested
'restore:requested'            // Handler: handleRestoreRequested
```

### GameManager.ts (Core Orchestrator)
**File:** `src/game/core/GameManager.ts`

**Events Emitted (12 total):**
```typescript
// Debug and system events
'save:requested'               // Lines 207, 494
'debug:mode:toggled'           // Line 476
'debug:info:requested'         // Line 501
'game:over'                    // Line 315
'game:paused'                  // Line 514
'game:resumed'                 // Line 524
'bounds:changed'               // Line 716

// User input events
'screw:clicked'                // Line 547

// Menu action events
'game:started'                 // Lines 641, 649, 669
'level:started'                // Line 665
```

**Events Subscribed (18 total):**
```typescript
'game:started'                 // Handler: handleGameStarted
'game:over'                    // Handler: handleGameOver
'level:complete'               // Handler: handleLevelComplete
'debug:mode:toggled'           // Handler: handleDebugModeToggled
'debug:info:requested'         // Handler: handleDebugInfoRequested
'layers:updated'               // Handler: handleLayersUpdated
'score:updated'                // Handler: handleScoreUpdated
'level_score:updated'          // Handler: handleLevelScoreUpdated
'total_score:updated'          // Handler: handleTotalScoreUpdated
'level:started'                // Handler: handleLevelStarted
'level:progress:updated'       // Handler: handleLevelProgressUpdated
'holding_hole:filled'          // Handler: handleHoldingHoleFilled
'container:filled'             // Handler: handleContainerFilled
'holding_holes:full'           // Handler: handleHoldingHolesFull
'physics:collision:detected'   // Handler: handleCollisionDetected
'container:replaced'           // Handler: handleContainerReplaced
'container:state:updated'      // Handler: handleContainerStateUpdated
'holding_hole:state:updated'   // Handler: handleHoldingHoleStateUpdated
```

### PhysicsWorld.ts (Physics System)
**File:** `src/game/physics/PhysicsWorld.ts`

**Events Emitted (4 total):**
```typescript
'physics:collision:detected'   // Line 275
'physics:step:completed'       // Line 414
'physics:error'                // Line 421
```

**Events Subscribed (9 total):**
```typescript
'game:paused'                  // Handler: handleGamePaused
'game:resumed'                 // Handler: handleGameResumed
'bounds:changed'               // Handler: handleBoundsChanged
'physics:body:added'           // Handler: handleBodyAdded
'physics:body:removed'         // Handler: handleBodyRemoved
'physics:body:removed:immediate' // Handler: handleBodyRemovedImmediate
'physics:screw:removed:immediate' // Handler: handleScrewRemovedImmediate
'physics:constraint:added'     // Handler: handleConstraintAdded
'physics:constraint:removed'   // Handler: handleConstraintRemoved
```

### SystemCoordinator.ts (System Lifecycle)
**File:** `src/game/core/SystemCoordinator.ts`

**Events Emitted (1 total):**
```typescript
'system:ready'                 // Line 58
```

**Events Subscribed:** None

### EventFlowValidator.ts (Debug/Monitoring)
**File:** `src/game/core/EventFlowValidator.ts`

**Events Emitted (1 total):**
```typescript
'debug:info:requested'         // Line 180
```

**Events Subscribed (15 total with priority: 3):**
```typescript
'game:started'                 // Handler: trackEvent (priority: 3)
'game:over'                    // Handler: trackEvent (priority: 3)
'level:started'                // Handler: trackEvent (priority: 3)
'level:complete'               // Handler: trackEvent (priority: 3)
'screw:clicked'                // Handler: trackEvent (priority: 3)
'screw:removed'                // Handler: trackEvent (priority: 3)
'screw:collected'              // Handler: trackEvent (priority: 3)
'shape:created'                // Handler: trackEvent (priority: 3)
'layer:created'                // Handler: trackEvent (priority: 3)
'physics:body:added'           // Handler: trackEvent (priority: 3)
'physics:constraint:added'     // Handler: trackEvent (priority: 3)
'save:requested'               // Handler: trackEvent (priority: 3)
'restore:requested'            // Handler: trackEvent (priority: 3)
'debug:mode:toggled'           // Handler: trackEvent (priority: 3)
'system:ready'                 // Handler: trackEvent (priority: 3)
```

## System Event Matrix

| System | Emits | Subscribes | Primary Role |
|--------|-------|------------|--------------|
| **GameState** | 53 events | 10 events | State persistence, scoring, containers |
| **ScrewManager** | 51 events | 12 events | Screw logic, physics constraints, animations |
| **LayerManager** | 26 events | 7 events | Layer management, shape lifecycle |
| **GameManager** | 12 events | 18 events | Input handling, UI coordination, orchestration |
| **PhysicsWorld** | 4 events | 9 events | Matter.js integration, physics simulation |
| **EventFlowValidator** | 1 event | 15 events | Debug monitoring, performance tracking |
| **SystemCoordinator** | 1 event | 0 events | System initialization |

**Total:** 148 emissions, 62 subscriptions

## Event Flow Diagrams

### Game Initialization Flow
```
GameManager → game:started
    ↓
GameState → level:started
    ↓
LayerManager → layer:created
    ↓
LayerManager → layer:shapes:ready
    ↓
GameState → container:colors:updated
    ↓
LayerManager → shape:created
    ↓
ScrewManager → shape:screws:ready
    ↓
ScrewManager → physics:body:added, physics:constraint:added
    ↓
PhysicsWorld (receives bodies and constraints)
```

### Screw Interaction Flow
```
User Click → GameManager → screw:clicked
    ↓
ScrewManager → screw:removed
    ↓
ScrewManager → physics:constraint:removed, physics:body:removed:immediate
    ↓
PhysicsWorld (removes constraint and body)
    ↓
ScrewManager → screw:animation:started
    ↓
ScrewManager → screw:collected
    ↓
GameState → score:updated, container:filled (if applicable)
    ↓
GameManager (updates UI)
```

### Container Transfer Flow
```
GameState → screw:transfer:started
    ↓
ScrewManager → screw:transfer:completed
    ↓
GameState → container:state:updated, holding_hole:state:updated
    ↓
GameManager (updates UI)
```

### Level Completion Flow
```
LayerManager → layer:cleared
    ↓
GameState → level:complete
    ↓
GameManager (handles completion)
    ↓
GameState → level:started (next level)
    ↓
LayerManager → layer:created
    ↓
... (initialization flow continues)
```

### Save/Restore Flow
```
GameManager → save:requested
    ↓
GameState, ScrewManager, LayerManager (all handle save)
    ↓
GameState → save:completed
```

## Event Dependencies

### Critical Event Chains
1. **Game Start Chain**: `game:started` → `level:started` → `layer:created` → `layer:shapes:ready` → `shape:created` → `shape:screws:ready`
2. **Screw Interaction Chain**: `screw:clicked` → `screw:removed` → `physics:constraint:removed` → `screw:collected` → `score:updated`
3. **Level Progression Chain**: `layer:cleared` → `level:complete` → `level:started`
4. **Save Chain**: `save:requested` → (multiple handlers) → `save:completed`
5. **Container Chain**: `screw:collected` → `container:filled` → `container:replaced` → `container:colors:updated`

### Event Priority Analysis
- **EventFlowValidator**: Uses priority 3 (highest) for monitoring all major events
- **All other systems**: Use default priority (EventPriority.NORMAL = 1)
- **EventDebugger**: Uses default priority for specialized debug events

### Circular Dependency Prevention
The EventBus includes loop detection (max 50 loops per event type/source) to prevent infinite event chains.

## Performance Analysis

### Event Frequency Classification
1. **High-Frequency Events**: 
   - `physics:body:added/removed` (frequent during gameplay)
   - `screw:clicked/removed/collected` (user-driven)
   - `bounds:changed` (responsive design)
   - `container:state:updated` (frequent state changes)

2. **Medium-Frequency Events**:
   - `save:requested/completed` (auto-save triggers)
   - `shape:created/destroyed` (level progression)
   - `layer:created/cleared` (level progression)

3. **Low-Frequency Events**:
   - `game:started/over` (game lifecycle)
   - `level:started/complete` (level progression)
   - `debug:*` (debug operations)

### Memory Considerations
- EventBus maintains history of 1000 events for debugging
- All subscriptions are automatically cleaned up when systems are destroyed
- No memory leaks identified in event handling
- Event validation prevents malformed event propagation

### Optimization Opportunities
1. **Event Batching**: Consider batching high-frequency physics events
2. **Selective Monitoring**: EventFlowValidator could use filtered monitoring for performance
3. **Event Pooling**: Reuse event objects to reduce garbage collection

## Recent Updates

### Changes Since Last Update
1. **New Event Types Added**: 22 new event types added to EventTypes.ts
   - Transfer events: `screw:transfer:started`, `screw:transfer:completed`, `screw:transfer:color_check`
   - State events: `container:state:updated`, `holding_hole:state:updated`
   - Request events: `screw_colors:requested`
   - Ready events: `shape:screws:ready`, `layer:shapes:ready`

2. **Enhanced Error Handling**: 
   - Added `physics:error`, `system:error`, `save:error` events
   - Error events include severity levels and recovery information

3. **Improved Transfer System**:
   - Complex screw transfer logic with color validation
   - Multi-step transfer process with start/complete events

4. **Expanded Debug Capabilities**:
   - EventFlowValidator now tracks 15 key events
   - Performance testing events added
   - Enhanced monitoring with priority subscriptions

### Statistics Summary
- **Previous State**: 53+ event types, 72+ emissions, 49+ subscriptions
- **Current State**: 72 event types, 148 emissions, 62 subscriptions
- **Growth**: +36% event types, +105% emissions, +27% subscriptions

### Code Quality Improvements
1. **Better Type Safety**: All events now have proper TypeScript interfaces
2. **Consistent Patterns**: Uniform event emission and subscription patterns
3. **Enhanced Documentation**: Each event type has clear purpose and usage
4. **Error Prevention**: Type-safe event handlers prevent runtime errors

---

*This document is automatically maintained and should be updated whenever event system changes are made.*