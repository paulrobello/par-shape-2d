# Game Event Flows Documentation

## Documentation Guidelines

**Note**: This document does not maintain statistics on emission/subscription counts. These change frequently and are not essential for understanding the event architecture.

**Note**: This document is a companion to the `game_architecture.md` document, which details the overall game architecture and logic flows. This document focuses specifically on the event-driven architecture and event flows within the game.

**Updates**: Changes should be integrated directly into existing sections rather than added to a separate "updates" section. Only add new sections when entirely new systems are introduced.

## Overview

The game event system provides a comprehensive, type-safe event-driven architecture for the 2D physics puzzle game. It follows a clean separation of concerns with a shared foundation that both game and editor extend.

## Architecture

### Core Components

1. **SharedEventBus** (`src/shared/events/SharedEventBus.ts`)
   - Core event bus with priority handling, loop detection, and performance tracking
   - Supports both synchronous and asynchronous event processing
   - Provides comprehensive debugging and monitoring capabilities

2. **BaseEventTypes** (`src/shared/events/BaseEventTypes.ts`)
   - Common event interfaces used by both game and editor
   - Includes physics, shape lifecycle, validation, file operations, and system events

3. **Game EventBus** (`src/game/events/EventBus.ts`)
   - Singleton extending SharedEventBus with game-specific configuration
   - Namespace: 'game'
   - Max history: 1000 events, Loop detection threshold: 50

4. **Game EventTypes** (`src/game/events/EventTypes.ts`)
   - 120+ game-specific event definitions
   - Comprehensive type safety with union types

## Event Categories

### Game Lifecycle Events
- **Game State**: `game:started`, `game:paused`, `game:resumed`, `game:over`
- **Level Management**: `level:started`, `level:complete`, `level:progress:updated`
- **System Coordination**: `system:ready`, `all_layers:cleared`

### Screw System Events (Core Gameplay)
- **User Interactions**: `screw:clicked`, `screw:blocked:clicked`
- **State Changes**: `screw:removed`, `screw:collected`, `screw:blocked`, `screw:unblocked`
- **Animations**: `screw:animation:started`, `screw:animation:completed`
- **Transfers**: `screw:transfer:started`, `screw:transfer:completed`, `screw:transfer:failed`
- **Ownership**: Immediate ownership transfer when operations begin (not when animations complete)
- **Generation**: `screws:generated`, `shape:screws:ready`
- **Counting**: `remaining:screws:requested` - Counts screws in shapes AND holding holes

### Shape System Events
- **Lifecycle**: `shape:created`, `shape:destroyed`, `shape:fell_off_screen`
- **Physics**: `shape:physics:updated`, `shape:attachment:changed`

### Layer System Events
- **Management**: `layer:created`, `layer:cleared`, `layer:visibility:changed`
- **State**: `layers:updated`, `layer:bounds:changed`, `layer:indices:updated`
- **Readiness**: `layer:shapes:ready`, `all_layers:screws:ready`

### Container System Events
- **State Changes**: `container:filled`, `container:replaced`, `container:all_removed`
- **Progress**: `container:progress:updated`, `container:state:updated`
- **Colors**: `container:colors:updated`

### Physics Events
- **Bodies**: `physics:body:added`, `physics:body:removed`, `physics:body:removed:immediate`
- **Constraints**: `physics:constraint:added`, `physics:constraint:removed`
- **Collisions**: `physics:collision:detected`
- **Simulation**: `physics:step:completed`, `physics:dormant:layers:set`

### Persistence Events
- **Save/Load**: `save:requested`, `save:completed`, `restore:requested`, `restore:completed`
- **State**: `save:state:changed`

## Event Emitters and Subscribers Matrix

### Major Event Emitters

| System | Primary Events Emitted |
|--------|------------------------|
| **ContainerManager** | `container:filled`, `container:state:updated`, `container:colors:updated`, `container:replaced`, `container:all_removed` |
| **HoldingHoleManager** | `holding_hole:filled`, `holding_hole:state:updated`, `holding_holes:full`, `holding_holes:available` |
| **ScrewManager** | `screw:collected`, `screw:removed`, `screw:animation:*`, `screw:transfer:*` |
| **GameStateCore** | Game state transitions, progress tracking events |
| **SaveLoadManager** | `save:completed`, `restore:completed`, error events |
| **PhysicsWorld** | `physics:body:*`, `physics:constraint:*`, `physics:collision:detected` |

### Major Event Subscribers

| System | Primary Events Subscribed |
|--------|---------------------------|
| **GameEventCoordinator** | `game:started`, `game:over`, `level:complete`, `debug:*`, `score:*`, `progress:updated`, `holding_hole:filled`, `container:filled` |
| **ContainerManager** | `container:filled`, `screw:transfer:*`, `bounds:changed`, `layers:updated`, `layer:shapes:ready` |
| **GameRenderManager** | Render-related events, bounds changes |
| **GameDebugManager** | `debug:mode:toggled`, `debug:info:requested` |
| **SaveLoadManager** | `save:requested`, `restore:requested` |

## Critical Event Flows

### 1. Screw Removal Flow (with Ownership Transfer)

```mermaid
sequenceDiagram
    participant User
    participant UI as Canvas/UI
    participant SM as ScrewManager
    participant PM as PhysicsWorld
    participant CM as ContainerManager
    participant HM as HoldingHoleManager
    participant EB as EventBus

    User->>UI: Click on screw
    UI->>EB: emit('screw:clicked')
    EB->>SM: Process screw click
    
    alt Screw is not blocked
        SM->>PM: Remove physics constraint
        PM->>EB: emit('physics:constraint:removed')
        SM->>EB: emit('screw:removed')
        SM->>EB: emit('screw:animation:started')
        
        alt Container available
            Note over SM: Transfer ownership to container immediately
            SM->>SM: screw.transferOwnership(containerId, 'container')
            SM->>CM: Animate to container
            SM->>EB: emit('screw:animation:completed')
            SM->>EB: emit('screw:collected', destination: 'container')
            CM->>EB: emit('container:filled') [if container full]
        else Container full, use holding hole
            Note over SM: Transfer ownership to holding hole immediately
            SM->>SM: screw.transferOwnership(holeId, 'holding_hole')
            SM->>HM: Animate to holding hole
            SM->>EB: emit('screw:animation:completed')
            SM->>EB: emit('screw:collected', destination: 'holding_hole')
            HM->>EB: emit('holding_hole:filled')
            HM->>EB: emit('holding_holes:full') [if all holes full]
        end
    else Screw is blocked
        SM->>EB: emit('screw:blocked:clicked')
        Note over UI: Show blocked feedback
    end
```

### 2. Container Management Flow

```mermaid
sequenceDiagram
    participant CM as ContainerManager
    participant EB as EventBus
    participant SM as ScrewManager
    participant SEH as ScrewEventHandler
    participant UI as GameUI

    EB->>CM: 'screw:collected' (destination: 'container')
    CM->>CM: Add screw to container
    
    alt Container becomes full
        CM->>EB: emit('container:filled')
        CM->>CM: Mark container for removal
        
        Note over CM: Wait 500ms for fade-out animation
        CM->>EB: emit('remaining:screws:requested')
        EB->>SEH: Process remaining screw count request
        SEH->>SEH: Count screws in shapes + holding holes
        SEH->>CM: Return screws by color (callback)
        
        alt Replacement needed
            CM->>CM: Create replacement container
            CM->>EB: emit('container:replaced')
        else No replacement needed
            CM->>CM: Remove container
            alt Last container removed
                CM->>EB: emit('container:all_removed')
            end
        end
        
        CM->>EB: emit('container:state:updated')
    end
    
    EB->>CM: 'layers:updated'
    CM->>CM: Update available screw colors
    CM->>EB: emit('container:colors:updated')
```

### 3. Level Progression Flow

```mermaid
sequenceDiagram
    participant GM as GameManager
    participant PT as ProgressTracker
    participant CM as ContainerManager
    participant SEH as ScrewEventHandler
    participant LM as LayerManager
    participant EB as EventBus

    EB->>PT: 'screw:collected'
    PT->>PT: Update progress counters
    PT->>EB: emit('progress:updated')
    
    alt All containers removed
        EB->>PT: 'container:all_removed'
        PT->>EB: emit('remaining:screws:requested')
        EB->>SEH: Process remaining screw count request
        SEH->>SEH: Count screws in shapes + holding holes
        SEH->>PT: Return total remaining screws (callback)
        
        alt No screws remaining
            PT->>EB: emit('level:completed')
            EB->>GM: Process level completion
            GM->>LM: Clear all layers
            LM->>EB: emit('all_layers:cleared')
            GM->>EB: emit('level:complete')
        end
    end
    
    EB->>GM: 'next_level:requested'
    GM->>GM: Initialize next level
    GM->>EB: emit('level:started')
```

### 4. Physics Integration Flow

```mermaid
sequenceDiagram
    participant SM as ScrewManager
    participant PM as PhysicsWorld
    participant ShM as ShapeManager
    participant EB as EventBus

    EB->>SM: 'screw:clicked'
    SM->>PM: Remove constraint
    PM->>EB: emit('physics:constraint:removed')
    PM->>EB: emit('physics:body:removed:immediate')
    
    Note over PM: Physics simulation step
    PM->>EB: emit('physics:step:completed')
    
    alt Shape falls due to screw removal
        PM->>EB: emit('physics:collision:detected')
        ShM->>EB: emit('shape:physics:updated')
        
        alt Shape falls off screen
            ShM->>EB: emit('shape:fell_off_screen')
            ShM->>PM: Remove physics body
            PM->>EB: emit('physics:body:removed')
        end
    end
```

### 5. Remaining Screw Counting Flow

The `remaining:screws:requested` event is critical for container replacement logic and win condition checking. It ensures accurate screw counting across all game states.

```mermaid
sequenceDiagram
    participant CM as ContainerManager
    participant PT as ProgressTracker  
    participant EB as EventBus
    participant SEH as ScrewEventHandler
    participant HHM as HoldingHoleManager

    Note over CM,PT: Triggered by container removal or level completion check
    
    alt Container replacement check
        CM->>EB: emit('remaining:screws:requested')
    else Win condition check
        PT->>EB: emit('remaining:screws:requested')
    end
    
    EB->>SEH: Route to ScrewEventHandler
    
    SEH->>SEH: Count screws in shapes
    Note over SEH: Filter: !isCollected && !isBeingCollected
    
    SEH->>SEH: Count screws in holding holes
    Note over SEH: Check: hole.screwId && hole.screwColor
    
    SEH->>SEH: Combine counts by color
    
    alt Container replacement
        SEH->>CM: Return Map<color, count> via callback
        CM->>CM: Determine if replacement needed
    else Win condition
        SEH->>PT: Return Map<color, count> via callback
        PT->>PT: Check if total remaining = 0
    end
```

**Key Implementation Details:**
- **ScrewEventHandler.handleRemainingScrewCountsRequested()** processes the request
- **Counts screws in shapes**: Iterates through `state.screws` filtering for active screws
- **Counts screws in holding holes**: Iterates through `state.holdingHoles` checking for occupied holes
- **Returns color-mapped counts**: Uses callback pattern with `Map<string, number>`
- **Used by ContainerManager**: For intelligent container replacement decisions  
- **Used by ProgressTracker**: For accurate win condition detection

### 6. Ownership Transfer and Disposal Safety Flow

The ownership system ensures data integrity during shape destruction and layer clearing:

```mermaid
sequenceDiagram
    participant LM as LayerManager
    participant Shape as Shape Entity
    participant SEH as ScrewEventHandler
    participant Screw as Screw Entity
    participant EB as EventBus

    LM->>EB: emit('shape:destroyed')
    EB->>SEH: Route destruction event
    
    SEH->>SEH: Find screws by shapeId
    
    loop For each screw
        SEH->>Screw: Check screw.canBeDeletedBy(shapeId)
        
        alt Shape still owns screw
            Note over SEH: owner = shapeId && ownerType = 'shape'
            SEH->>SEH: Delete screw safely
            SEH->>EB: emit('screw:destroyed')
        else Screw owned by container/hole
            Note over SEH: Preserve screw - owned by container/holding_hole
            SEH->>SEH: Skip deletion
        end
    end
    
    LM->>Shape: shape.dispose()
    Shape->>Shape: Filter screws by ownership
    
    loop For each screw in shape.screws
        Shape->>Screw: Check screw.canBeDeletedBy(this.id)
        
        alt Shape owns screw
            Shape->>Screw: screw.dispose()
            Shape->>Shape: Remove from array
        else Screw transferred to container/hole
            Shape->>Shape: Keep reference but don't dispose
        end
    end
```

**Ownership Benefits:**
- **Race Condition Prevention**: Clear ownership eliminates complex cleanup checks
- **Data Integrity**: Screws cannot be deleted by unauthorized systems
- **Simplified Logic**: No need to check containers/holding holes during disposal
- **Debug Visibility**: Complete ownership tracking with logging

## Event Naming Conventions

### Established Patterns

1. **Domain-Action Structure**: `domain:action` or `domain:subdomain:action`
   -  `screw:clicked`, `container:filled`, `level:complete`
   -  `physics:body:added`, `screw:animation:started`

2. **State Update Events**: Use `:updated` suffix
   -  `container:state:updated`, `layer:bounds:changed`

3. **Request-Response Patterns**: Use `:requested` for requests
   -  `save:requested`, `restore:requested`

### Naming Convention Fixes Applied

**Fixed Inconsistent Separator Usage** (✅ Completed):
- `level_score:updated` → `level:score:updated`
- `total_score:updated` → `total:score:updated` 
- `game_state:request` → `game:state:request`
- `container_state:request` → `container:state:request`
- `holding_hole_state:request` → `holding:hole:state:request`
- `game_state:restore` → `game:state:restore`
- `container_state:restore` → `container:state:restore`
- `holding_hole_state:restore` → `holding:hole:state:restore`

**Standardized Pattern**: All events now follow consistent `domain:action` or `domain:subdomain:action` format with colon separators.

## System Reliability Improvements

### Critical Race Condition Fixes (✅ Completed)

#### **Container Replacement Race Condition**
**Issue**: Container replacement used `setTimeout()` which created race conditions where containers could be removed or indices could change during the 500ms delay.

**Solution**: Moved replacement logic to the animation update cycle in `ContainerManager.updateContainerAnimations()`. Replacement now triggers when fade-out animation completes, eliminating timing-based race conditions.

**Files Modified**:
- `src/game/core/managers/ContainerManager.ts` - Added `containersBeingProcessed` Set for duplicate prevention
- Replaced `setTimeout()` with event-driven animation completion handling

#### **Physics Constraint Race Condition**
**Issue**: Physics constraints were removed immediately when screw collection started, but screw state (`isBeingCollected`) wasn't set until later, creating a window for duplicate clicks.

**Solution**: Made screw collection atomic by moving physics constraint removal inside the state-setting operation.

**Files Modified**:
- `src/game/systems/ScrewManager.ts` - Modified `startScrewCollection()` to handle physics atomically
- `src/game/systems/screw/ScrewEventHandler.ts` - Added validation to prevent duplicate clicks

#### **State Validation Improvements**
**Issue**: Missing validation allowed operations on invalid states (e.g., placing screws in occupied holes).

**Solution**: Added comprehensive validation throughout the codebase:
- Container state validation before operations
- Screw state validation to prevent race conditions
- Hole availability validation before placement

### Shared Utilities Framework (✅ Completed)

Created comprehensive shared utilities to eliminate code duplication and ensure consistency:

#### **EventEmissionUtils** (`src/shared/utils/EventEmissionUtils.ts`)
- Standardized event creation with automatic timestamps
- Consistent completion event patterns
- Eliminates duplicate event emission code

#### **StateValidationUtils** (`src/shared/utils/StateValidationUtils.ts`)
- Unified validation patterns for systems, game state, screws, and containers
- Atomic validation operations with clear error reporting
- Prevents invalid state transitions

#### **DebugLogger** (`src/shared/utils/DebugLogger.ts`)
- Consistent debug logging across all systems
- Conditional logging based on debug flags
- Standardized log formatting with emojis for easy identification

## Performance Considerations

### Event Loop Detection
- Sophisticated loop detection with contextual keys
- Prevents infinite event chains during rapid state changes
- Maximum loop count: 50 per unique context

### High-Frequency Events
- `physics:step:completed` - Every physics frame
- `screw:animation:*` - During animations
- `progress:updated` - During active gameplay

### Memory Management
- Event history limited to 1000 entries
- Automatic cleanup of one-time subscriptions
- Performance metrics tracked for all event processing

## Debugging and Monitoring

### Available Tools
1. **Event History**: Last 1000 events with timing data
2. **Performance Stats**: Handler counts, average durations, error counts
3. **Subscription Debugging**: View all active subscriptions by event type
4. **Loop Detection**: Automatic detection and logging of event loops

### Debug Event Types
- `debug:mode:toggled` - Enable/disable debug features
- `debug:info:requested` - Request system state information
- `debug:performance:test` - Run performance tests

## Error Handling

### Error Event Types
- `system:error` - General system errors
- `physics:error` - Physics simulation errors  
- `save:error` - Save/load operation errors

### Error Recovery Patterns
- Graceful degradation for non-critical errors
- Automatic retry mechanisms for transient failures
- Event bus isolation prevents cascading failures

## Best Practices

1. **Event Naming**: Use consistent colon separators and domain-action structure
2. **Error Handling**: Always emit error events for failure cases
3. **State Consistency**: Use request-response patterns for state queries
4. **Performance**: Batch related events when possible
5. **Debugging**: Include contextual information in event payloads
6. **Type Safety**: Always use typed event interfaces

## Future Improvements

1. **Naming Standardization**: Fix underscore vs colon inconsistencies
2. **Event Batching**: Implement batching for high-frequency events
3. **Performance Monitoring**: Add automatic performance threshold alerts
4. **Event Replay**: Add event replay capabilities for debugging