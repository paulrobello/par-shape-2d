# Event Flow Mapping - PAR Shape 2D

## Documentation Guidelines

**Note**: This document tracks event emitters and subscribers for each event type, but does not maintain statistics on emission/subscription counts. These change frequently and are not essential for understanding the event architecture.

**Updates**: Changes should be integrated directly into existing sections rather than added to a separate "updates" section. Only add new sections when entirely new systems are introduced.

## Table of Contents
1. [Overview](#overview)
2. [Event Categories](#event-categories)
3. [Event Flow Diagrams](#event-flow-diagrams)
4. [Event Dependencies](#event-dependencies)
5. [Performance Analysis](#performance-analysis)

## Overview

This document provides a comprehensive mapping of all events in the PAR Shape 2D event-driven architecture. The game uses a centralized EventBus system where all systems communicate through well-defined events, ensuring loose coupling and maintainability.

**Architecture Summary:**
- **Event-Driven Communication**: Complete decoupling between systems
- **Centralized EventBus**: Priority handling, loop detection, and performance monitoring
- **Type-Safe Events**: Comprehensive TypeScript event definitions
- **7 Core Systems**: All using event-based communication patterns

## Event Categories

### Game Lifecycle Events
| Event Type | Purpose | Emitters | Subscribers |
|------------|---------|----------|-------------|
| `game:started` | Game initialization and restart | GameManager, GameState | GameManager, EventFlowValidator |
| `game:paused` | Pause game execution | GameManager | PhysicsWorld |
| `game:resumed` | Resume game execution | GameManager | PhysicsWorld |
| `game:over` | End game state | GameManager, GameState | GameManager, EventFlowValidator |
| `level:started` | New level initialization | GameManager, GameState | GameManager, LayerManager, EventFlowValidator |
| `level:complete` | Level completion | GameState | GameManager, EventFlowValidator |
| `level:progress:updated` | Level progress tracking | GameState | GameManager |

### Screw System Events
| Event Type | Purpose | Emitters | Subscribers |
|------------|---------|----------|-------------|
| `screw:clicked` | User screw interaction | GameManager | ScrewManager, EventFlowValidator |
| `screw:removed` | Screw constraint removal | ScrewManager | EventFlowValidator |
| `screw:collected` | Screw collection completion | ScrewManager | GameState, EventFlowValidator |
| `screw:blocked` | Screw becomes unremovable | ScrewManager | None |
| `screw:unblocked` | Screw becomes removable | ScrewManager | None |
| `screw:blocked:clicked` | Blocked screw clicked, triggers shake | ScrewManager | None |
| `screw:animation:started` | Collection animation start | ScrewManager | None |
| `screw:animation:completed` | Collection animation end | ScrewManager | None |
| `screw:transfer:started` | Transfer to container start | GameState | ScrewManager |
| `screw:transfer:completed` | Transfer to container end | ScrewManager | GameState, ScrewManager |
| `screw:transfer:failed` | Transfer failure with cleanup | ScrewManager | GameState |
| `screw:transfer:color_check` | Color validation for transfer | GameState | ScrewManager |

### Shape System Events
| Event Type | Purpose | Emitters | Subscribers |
|------------|---------|----------|-------------|
| `shape:created` | Shape instantiation | LayerManager | ScrewManager, EventFlowValidator |
| `shape:destroyed` | Shape removal | LayerManager | GameState, ScrewManager |
| `shape:fell_off_screen` | Shape out of bounds | LayerManager | LayerManager |
| `shape:physics:updated` | Shape physics changes | None | None |
| `shape:attachment:changed` | Screw attachment changes | None | None |
| `shape:screws:ready` | Shape screw setup complete | ScrewManager | LayerManager |

### Layer System Events
| Event Type | Purpose | Emitters | Subscribers |
|------------|---------|----------|-------------|
| `layer:created` | Layer instantiation | LayerManager | EventFlowValidator |
| `layer:cleared` | Layer completion | LayerManager | GameState |
| `layer:visibility:changed` | Layer visibility toggle | LayerManager | None |
| `layers:updated` | Visible layers changed | LayerManager | GameManager |
| `layer:bounds:changed` | Layer boundary updates | LayerManager | None |
| `layer:shapes:ready` | Layer shape setup complete | LayerManager | GameState |
| `all_layers:cleared` | All layers in level cleared | LayerManager | GameState |

### Container System Events
| Event Type | Purpose | Emitters | Subscribers |
|------------|---------|----------|-------------|
| `container:filled` | Container becomes full | GameState | GameManager, GameState |
| `container:replaced` | Container replacement | GameState | GameManager |
| `container:colors:updated` | Container color changes | GameState | ScrewManager, LayerManager |
| `container:state:updated` | Container state changes | GameState | GameManager, ScrewManager |
| `holding_hole:filled` | Holding hole occupied | GameState | GameManager, GameState |
| `holding_holes:full` | All holding holes full | GameState | GameManager |
| `holding_holes:available` | Holding holes freed up, timer cancelled | GameState | GameManager |
| `holding_hole:state:updated` | Holding hole state changes | GameState | GameManager, ScrewManager |
| `screw_colors:requested` | Request for active screw colors | GameState | ScrewManager |
| `screw:transfer:color_check` | Color validation request | GameState | ScrewManager |

### Physics Events
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

### Save/Restore Events
| Event Type | Purpose | Emitters | Subscribers |
|------------|---------|----------|-------------|
| `save:requested` | Save game state | GameManager | GameState, ScrewManager, LayerManager, EventFlowValidator |
| `save:completed` | Save operation done | GameState | None |
| `restore:requested` | Restore game state | GameManager | GameState, ScrewManager, LayerManager, EventFlowValidator |
| `restore:completed` | Restore operation done | GameState | None |
| `save:state:changed` | Unsaved changes flag | GameState | None |

### Score Events
| Event Type | Purpose | Emitters | Subscribers |
|------------|---------|----------|-------------|
| `score:updated` | Points awarded | GameState | GameManager |
| `level_score:updated` | Level score changed | GameState | GameManager |
| `total_score:updated` | Total score changed | GameState | GameManager |

### Debug Events
| Event Type | Purpose | Emitters | Subscribers |
|------------|---------|----------|-------------|
| `debug:mode:toggled` | Debug mode toggle | GameManager | GameManager, EventFlowValidator |
| `debug:info:requested` | Debug data request | GameManager, EventFlowValidator | GameManager |
| `debug:performance:test` | Performance testing | None | EventDebugger |

### Error Events
| Event Type | Purpose | Emitters | Subscribers |
|------------|---------|----------|-------------|
| `system:error` | System-level errors | None | None |
| `physics:error` | Physics simulation errors | PhysicsWorld | None |
| `save:error` | Save/restore errors | None | None |

### Rendering Events
| Event Type | Purpose | Emitters | Subscribers |
|------------|---------|----------|-------------|
| `render:requested` | Render frame request | None | None |
| `bounds:changed` | Canvas bounds update | GameManager | PhysicsWorld, LayerManager, GameState |

### System Coordination Events
| Event Type | Purpose | Emitters | Subscribers |
|------------|---------|----------|-------------|
| `system:ready` | System initialization complete | SystemCoordinator | EventFlowValidator |

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
ScrewManager checks screw.isRemovable
    ↓
If REMOVABLE:
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

If BLOCKED:
    ScrewManager → screw:blocked:clicked
    ↓
    Screw.startShake() triggers shake animation
    ↓
    ScrewManager updates shake animation each frame
    ↓
    ScrewRenderer applies shake offset during rendering
    ↓
    Mobile vibration feedback (50ms)
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
LayerManager → all_layers:cleared (when all layers cleared)
    ↓
GameState → level:complete (with correct level and score data)
    ↓
GameManager (handles completion UI)
    ↓
User clicks to advance → GameManager → next_level:requested
    ↓
GameState → nextLevel() → level:started (next level)
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

### Holding Holes Timer Flow
```
Holding hole fills → GameState → isHoldingAreaFull() returns true
    ↓
GameState → holding_holes:full (with 5s countdown)
    ↓
GameManager → handleHoldingHolesFull() starts setInterval timer
    ↓
Screw transferred from holding hole → GameState → holding_hole:filled (screwId: null)
    ↓
GameState → isHoldingAreaFull() returns false
    ↓
GameState → holding_holes:available
    ↓
GameManager → handleHoldingHolesAvailable() cancels timer
    ↓
Game continues without game over threat
```

## Event Dependencies

### Critical Event Chains
1. **Game Start Chain**: `game:started` → `level:started` → `layer:created` → `layer:shapes:ready` → `shape:created` → `shape:screws:ready`
2. **Screw Interaction Chain**: `screw:clicked` → `screw:removed` → `physics:constraint:removed` → `screw:collected` → `score:updated`
3. **Level Progression Chain**: `layer:cleared` → `level:complete` → `level:started`
4. **Save Chain**: `save:requested` → (multiple handlers) → `save:completed`
5. **Container Chain**: `screw:collected` → `container:filled` → `container:replaced` → `container:colors:updated`
6. **Holding Holes Timer Chain**: `holding_holes:full` → timer started → `holding_holes:available` → timer cancelled

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

---

*This document tracks the event-driven architecture of PAR Shape 2D. Changes should be integrated directly into existing sections to maintain current and accurate event flow information.*