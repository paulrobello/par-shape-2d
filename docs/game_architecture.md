# Game Architecture Documentation

## Documentation Guidelines

**Note**: This document is a companion to the `game_event_flows.md` document, which details the event-driven architecture of the game. This document focuses on the overall game architecture, system organization, and logic flows.

**Updates**: Changes should be integrated directly into existing sections rather than added to a separate "updates" section. Only add new sections when entirely new systems are introduced.

## Overview

PAR Shape 2D is a physics-based puzzle game built with Next.js, TypeScript, and Matter.js. The game features a sophisticated event-driven architecture with complete system decoupling, comprehensive shared utilities, and robust physics integration.

### Core Game Concept

Players remove screws from layered shapes to collect them in color-matched containers. Each level presents multiple layers of shapes with screws that must be strategically removed to allow shapes to fall and progress through the level.

### Key Features

- **Physics-Based Gameplay**: Real-time physics simulation using Matter.js
- **Layered Shape System**: Multiple layers with depth-based collision detection
- **Strategic Screw Removal**: Screws hold shapes in place and must be removed strategically
- **Color-Matching Mechanics**: Screws must be placed in matching colored containers
- **Progressive Difficulty**: Increasing complexity through additional layers and shapes
- **Touch/Mouse Support**: Full cross-platform input handling

## Architectural Principles

### 1. Event-Driven Architecture

The entire game operates on a comprehensive event system that ensures complete decoupling between systems:

- **Centralized Event Bus**: `SharedEventBus` handles all inter-system communication
- **Type-Safe Events**: 120+ game-specific event types with full TypeScript support
- **Priority-Based Processing**: Events can be prioritized for critical operations
- **Loop Detection**: Sophisticated protection against infinite event loops
- **Performance Monitoring**: Built-in event processing metrics and debugging

### 2. System Decoupling

All game systems extend `BaseSystem` and operate independently:

- **Autonomous Operation**: Each system manages its own state and responsibilities
- **Event-Only Communication**: No direct system-to-system dependencies
- **Graceful Degradation**: Systems can fail without affecting others
- **Hot-Swappable**: Systems can be replaced or upgraded independently

### 3. Shared Utilities Framework

Comprehensive utilities eliminate code duplication and ensure consistency:

- **EventEmissionUtils**: Standardized event creation and emission patterns
- **StateValidationUtils**: Unified validation across all systems
- **DebugLogger**: Consistent debug logging with conditional output
- **AnimationUtils**: Shared animation and timing utilities
- **GeometryUtils**: Mathematical calculations and collision detection

### 4. Physics Integration

Deep integration with Matter.js physics engine:

- **Shared Physics World**: Centralized physics simulation
- **Body Management**: Automatic physics body lifecycle management
- **Constraint System**: Dynamic constraint creation and removal
- **Collision Detection**: Advanced collision handling with layer isolation

## System Architecture

### Core Systems

#### **GameManager** (`src/game/core/GameManager.ts`)
**Responsibility**: Overall game lifecycle and coordination
- Game state transitions (start, pause, resume, stop)
- Level progression management
- System initialization and cleanup
- Input event routing (mouse/touch)
- Save/restore game state

**Key Events Emitted**:
- `game:started`, `game:paused`, `game:resumed`, `game:over`
- `level:started`, `level:complete`

#### **GameStateCore** (`src/game/core/GameStateCore.ts`)
**Responsibility**: Central game state management
- Current level tracking
- Score management (level and total scores)
- Game progress monitoring
- Win/lose condition evaluation
- State persistence coordination

**Key Events Handled**:
- `screw:collected` - Updates progress and scores
- `container:filled` - Tracks container completion
- `level:completed` - Handles level completion logic

#### **ScrewManager** (`src/game/systems/ScrewManager.ts`)
**Responsibility**: Complete screw lifecycle management with ownership tracking
- Screw creation and placement within shapes
- Click/touch event handling for screw selection
- Collection animation management
- Physics constraint management
- Transfer coordination to containers/holding holes
- **Ownership system** ensuring data integrity and preventing race conditions

**Key Components**:
- **ScrewEventHandler**: Event processing and routing with ownership validation
- **ScrewAnimationService**: Collection animation management
- **ScrewTransferService**: Destination finding, transfer logic, and ownership transfers
- **ScrewPhysicsService**: Physics constraint management
- **ScrewPlacementService**: Strategic screw placement within shapes

**Ownership System**:
- **Single Owner Principle**: Each screw has exactly one owner (`shape`, `container`, `holding_hole`)
- **Immediate Transfer**: Ownership changes when operations begin, not when animations complete
- **Deletion Protection**: Only current owner can delete/destroy screws
- **Clean Disposal**: Shapes only dispose screws they still own

**Key Events**:
- `screw:clicked` → `screw:removed` → `screw:collected`
- `screw:animation:started` → `screw:animation:completed`
- `screw:transfer:started` → `screw:transfer:completed` (with ownership transfer)

#### **ContainerManager** (`src/game/core/managers/ContainerManager.ts`)
**Responsibility**: Container lifecycle and screw assignment with fixed-slot positioning
- Container creation with appropriate colors
- Screw placement and hole management
- Container completion detection
- Intelligent container replacement with fade animations
- Fixed 4-slot positioning system

**Key Features**:
- **Fixed-Slot System**: 4 predetermined positions prevent container shifting
- **Smart Replacement**: Uses real-time screw data for optimal container selection
- **Vacant Slot Usage**: New containers appear in first available slot
- **Color-Based Identification**: Finds containers by color instead of index for reliability
- **Race Condition Prevention**: Event-driven replacement with immediate fade-in
- **Reservation System**: Prevents duplicate screw assignments

**Slot Architecture**:
- `containerSlots[]` maintains 4 fixed positions
- `getContainers()` returns slot-ordered containers
- Positioning calculated for all slots, not just filled ones
- Container removal preserves slot positions

#### **LayerManager** (`src/game/systems/LayerManager.ts`)
**Responsibility**: Multi-layer shape organization and visual management
- Layer creation and management (10+ layers per level)
- Shape placement within layers
- Layer visibility and depth management
- Physics group isolation between layers
- Progressive layer revelation
- **Layer state notifications**: Emits layer clearing events for UI updates
- **Note**: Does NOT determine level completion - only handles layer management

**Layer Properties**:
- Each layer has unique visual tinting
- Physics bodies only interact within their layer
- 6 shapes per layer with strategic placement
- Depth-based collision detection for screw accessibility

#### **PhysicsWorld** (`src/game/physics/PhysicsWorld.ts`)
**Responsibility**: Physics engine integration and management
- Matter.js world management
- Body and constraint lifecycle
- Collision event processing
- Physics debugging and visualization
- Performance optimization

**Integration Points**:
- Shape body creation and management
- Screw constraint handling
- Layer-based collision groups
- Real-time physics stepping

### Supporting Systems

#### **HoldingHoleManager** (`src/game/core/managers/HoldingHoleManager.ts`)
**Responsibility**: Overflow screw storage
- 5-hole holding area management
- Screw transfer to new containers
- Full-hole timeout management (5-second rule)
- Visual feedback for available/occupied holes

#### **ProgressTracker** (`src/game/systems/ProgressTracker.ts`)
**Responsibility**: **Authoritative game progress tracking and level completion**
- Real-time progress percentage calculation
- Screw counting across shapes and holding holes
- **Single source of truth for level completion detection**
- Progress bar updates
- **Score integration**: Triggers score addition to total when level completes
- **Win condition evaluation**: Determines when all game objectives are met

#### **SaveLoadManager** (`src/game/core/managers/SaveLoadManager.ts`)
**Responsibility**: Game state persistence
- Complete game state serialization
- Cross-system state collection
- LocalStorage management
- State validation and restoration
- **Race Condition Safe**: Uses event-driven state collection

#### **GameRenderManager** (`src/game/core/managers/GameRenderManager.ts`)
**Responsibility**: Visual presentation and UI
- Canvas rendering and scaling
- HUD display (progress, score, level)
- Container and holding hole visualization
- Animation coordination
- Mobile responsiveness

## Level Completion Architecture

### Single Responsibility Principle

The game follows a **strict single responsibility pattern** for level completion:

#### **ProgressTracker: Authoritative Source**
- **Sole determinant** of level completion based on actual game objectives
- Monitors screw collection progress across all containers
- Emits `level:completed` when all screws are properly collected
- **Score Management**: Adds level score to total score upon completion
- **Win Condition Logic**: Evaluates when level objectives are fully met

#### **LayerManager: Visual Management Only**
- Handles layer creation, visibility, and physics organization
- Emits `all:layers:cleared` for UI state updates
- **Does NOT determine level completion** - purely layer management
- Layer clearing is independent of actual game progress

#### **Benefits of This Architecture**
- **Clear Separation**: Each system has a single, well-defined responsibility
- **Accurate Completion**: Level completion based on actual game objectives (screw collection)
- **No Race Conditions**: Single authoritative source prevents competing completion logic
- **Maintainable**: Easy to reason about and debug completion flow

## Game Logic Flows

### 1. Screw Removal Flow

```mermaid
sequenceDiagram
    participant User
    participant GM as GameManager
    participant SM as ScrewManager
    participant CM as ContainerManager
    participant PM as PhysicsWorld
    participant EB as EventBus

    User->>GM: Click/Touch on screw
    GM->>EB: emit('screw:clicked')
    EB->>SM: Route click event
    
    alt Screw is removable
        SM->>SM: Validate screw state
        SM->>SM: Start collection (atomic)
        SM->>PM: Remove physics constraint
        SM->>EB: emit('screw:animation:started')
        
        Note over SM: Animation to destination
        
        SM->>EB: emit('screw:animation:completed')
        SM->>EB: emit('screw:collected')
        SM->>CM: Place in container/holding hole
        
        alt Container becomes full
            CM->>EB: emit('container:filled')
            CM->>CM: Start fade-out animation
            Note over CM: Wait for animation completion
            CM->>CM: Replace container if needed
        end
    else Screw is blocked
        SM->>EB: emit('screw:blocked:clicked')
        Note over GM: Show shake animation
    end
```

### 2. Level Progression Flow (ProgressTracker Authoritative)

```mermaid
sequenceDiagram
    participant GM as GameManager
    participant GSC as GameStateCore
    participant PT as ProgressTracker
    participant CM as ContainerManager
    participant LM as LayerManager
    participant EB as EventBus

    EB->>PT: 'screw:collected'
    PT->>PT: Update progress counters
    PT->>EB: emit('progress:updated')
    
    alt All containers removed
        EB->>PT: 'container:all_removed'
        PT->>EB: emit('remaining:screws:requested')
        
        Note over PT: Count remaining screws in shapes + holes
        
        alt No screws remaining (AUTHORITATIVE)
            PT->>EB: emit('level:completed')
            EB->>GSC: Process completion & add score
            Note over GSC: Add level score to total score
            GSC->>EB: emit('level:complete')
            EB->>GM: Handle level transition
            GM->>LM: Clear current layers (visual only)
            GM->>LM: Generate next level
            GM->>EB: emit('level:started')
        end
    end
    
    Note over PT,LM: LayerManager clearing is independent of completion
    Note over PT: ProgressTracker is SOLE completion authority
```

### 3. Container Management Flow (Fixed-Slot System)

```mermaid
sequenceDiagram
    participant CM as ContainerManager
    participant EB as EventBus
    participant SEH as ScrewEventHandler
    participant Slots as ContainerSlots[4]

    EB->>CM: 'screw:collected'
    CM->>CM: Add screw to container
    
    alt Container becomes full
        CM->>EB: emit('container:filled') with color & screws
        CM->>CM: Find container by color (not index)
        CM->>CM: Mark for removal & start fade-out
        
        Note over CM: Fade animation plays (500ms)
        
        CM->>Slots: Clear slot but preserve position
        CM->>CM: Remove from containers array
        CM->>EB: emit('container:removed') with visualIndex
        
        CM->>EB: emit('remaining:screws:requested')
        EB->>SEH: Count screws by color
        SEH->>CM: Return screw counts
        
        alt Replacement needed
            CM->>Slots: Find first vacant slot
            CM->>CM: Create container with fade-in at slot
            CM->>Slots: Assign container to vacant slot
            CM->>EB: emit('container:state:updated')
            Note over CM: New container fades in at exact position (500ms)
        else No replacement needed
            Note over Slots: Slot remains vacant until needed
            CM->>EB: emit('container:all_removed')
        end
    end
```

## Data Flow Architecture

### Screw Ownership System

The game implements a comprehensive ownership transfer system that ensures data integrity and prevents race conditions:

#### **Ownership States**:
1. **Shape Ownership**: Initial state when screw is created (`owner = shapeId`, `ownerType = 'shape'`)
2. **Holding Hole Ownership**: Temporary storage (`owner = holeId`, `ownerType = 'holding_hole'`)
3. **Container Ownership**: Final destination (`owner = containerId`, `ownerType = 'container'`)

#### **Transfer Rules**:
- **Immediate Transfer**: Ownership changes when transfer operations begin
- **Atomic Operations**: Transfer and ownership change happen together
- **Single Owner**: Each screw has exactly one owner at any time
- **Deletion Authority**: Only current owner can delete/destroy screws

#### **Benefits**:
- **Race Condition Prevention**: Clear ownership eliminates complex cleanup logic
- **Data Integrity**: Screws cannot be lost or duplicated
- **Simplified Logic**: No need to check containers/holding holes for disposal decisions
- **Debug Visibility**: Complete ownership tracking for troubleshooting

### State Management

The game uses distributed state management with eventual consistency:

#### **Primary State Holders**:
1. **GameStateCore**: Game progress, scores, level information
2. **ScrewManager**: All screw entities and their states
3. **ContainerManager**: Container states and hole occupancy
4. **LayerManager**: Shape placement and layer organization

#### **State Synchronization**:
- Events provide eventual consistency between systems
- Request-response patterns for real-time data queries
- Atomic operations prevent state corruption
- Validation at every state transition

#### **Persistence Strategy**:
- Complete state snapshots saved to localStorage
- Cross-system state collection via events
- Incremental updates during gameplay
- Automatic save triggers (level completion, game over)

### Event Flow Patterns

#### **Command Events**: User actions that trigger game logic
- `screw:clicked`, `game:started`, `save:requested`

#### **State Events**: System state changes
- `screw:collected`, `container:filled`, `level:complete`

#### **Request-Response Events**: Data queries between systems
- `remaining:screws:requested` → callback with screw counts
- `game:state:request` → callback with current state

#### **Notification Events**: Information broadcasts
- `progress:updated`, `bounds:changed`, `physics:step:completed`

## Performance Characteristics

### Optimization Strategies

#### **Event System**:
- Event history limited to 1000 entries
- Loop detection prevents infinite chains
- Priority-based processing for critical events
- Throttled high-frequency events (removability updates)

#### **Physics Integration**:
- Layer-based collision groups reduce computation
- Constraint removal optimized for immediate shape falling
- Dormant body management for inactive shapes
- Spatial partitioning for collision detection

#### **Memory Management**:
- Automatic cleanup of completed animations
- Physics body removal for off-screen shapes
- Event subscription cleanup on system destruction
- Throttling state cleanup for long-running games

#### **Rendering Optimization**:
- Canvas scaling with proper aspect ratio maintenance
- Efficient shape and screw rendering
- Animation interpolation for smooth movement
- Conditional debug rendering

### Scalability Considerations

#### **Layer Scaling**: 10 + floor(level / 3) layers per level
#### **Shape Capacity**: 6 shapes per layer, 1-10 screws per shape
#### **Event Throughput**: Designed to handle 100+ events per second
#### **Memory Usage**: Bounded by automatic cleanup mechanisms

## Security and Validation

### Input Validation
- All user inputs validated before processing
- Event payload validation at system boundaries
- State transition validation prevents invalid operations
- Bounds checking for array access and mathematical operations

### State Integrity
- Atomic operations for critical state changes
- Rollback mechanisms for failed operations
- Consistency checks at key transition points
- Validation utilities ensure data integrity

### Error Handling
- Graceful degradation for non-critical failures
- Error event propagation for debugging
- System isolation prevents cascading failures
- Comprehensive error logging and recovery

## Development and Debugging

### Debug Capabilities
- Comprehensive debug logging with conditional output
- Real-time event flow visualization
- Physics debugging with visual overlays
- Performance metrics and profiling
- State inspection utilities

### Testing Strategy
- Event-driven architecture enables isolated unit testing
- Physics simulation can be mocked for deterministic testing
- State validation utilities ensure data integrity
- Integration tests verify cross-system communication

### Development Workflow
- Hot module replacement for rapid iteration
- TypeScript ensures compile-time error catching
- ESLint and Prettier maintain code quality
- Automated build process ensures deployment readiness

## Future Enhancements

### Planned Improvements
1. **Performance Monitoring**: Automatic threshold alerts for slow operations
2. **Event Replay**: Debugging capability to replay event sequences
3. **Advanced Analytics**: Player behavior tracking and optimization
4. **Networking Support**: Multiplayer gameplay foundation
5. **Procedural Generation**: Algorithm-based level creation

### Architectural Readiness
The current architecture supports these enhancements through:
- Event-driven design enables easy feature addition
- Modular systems allow independent enhancement
- Shared utilities provide consistent foundation
- Comprehensive validation prevents system corruption
