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

### 1. Screw Removal Flow

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
            SM->>CM: Animate to container
            SM->>EB: emit('screw:animation:completed')
            SM->>EB: emit('screw:collected', destination: 'container')
            CM->>EB: emit('container:filled') [if container full]
        else Container full, use holding hole
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

## Event Naming Conventions

### Established Patterns

1. **Domain-Action Structure**: `domain:action` or `domain:subdomain:action`
   -  `screw:clicked`, `container:filled`, `level:complete`
   -  `physics:body:added`, `screw:animation:started`

2. **State Update Events**: Use `:updated` suffix
   -  `container:state:updated`, `layer:bounds:changed`

3. **Request-Response Patterns**: Use `:requested` for requests
   -  `save:requested`, `restore:requested`

### Naming Convention Issues Found

**Inconsistent Separator Usage**:
- `screw_colors:requested` � Should be `screw:colors:requested`
- `remaining_screws:requested` � Should be `remaining:screws:requested`
- `screw_count:requested` � Should be `screw:count:requested`

**Mixed Request Patterns**:
- Some use `:requested`, others could use `:request` for consistency

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