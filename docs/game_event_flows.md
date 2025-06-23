# Game Event Flows Documentation

## Documentation Guidelines

**Note**: This document does not maintain statistics on emission/subscription counts. These change frequently and are not essential for understanding the event architecture.

**Note**: This document is a companion to the `game_architecture.md` document, which details the overall game architecture and logic flows. This document focuses specifically on the event-driven architecture and event flows within the game.

**Maintenance**: This document describes the current state of the event architecture. New functionality is documented directly in relevant sections rather than as separate updates.

## Overview

The game event system provides a comprehensive, type-safe event-driven architecture for the 2D physics puzzle game. It follows a clean separation of concerns with a shared foundation that both game and editor extend.

### Event Naming Convention Standardization

All events follow a consistent `domain:action` or `domain:subdomain:action` format with colon separators for predictable hierarchy and industry alignment. Standard event naming patterns include:
- `level:score:updated` for level score updates
- `game:state:request` for game state requests
- `container:state:request` for container state requests

This standardization provides consistent, predictable event names and easier understanding of event hierarchy. **Note**: Some events may still use underscores in legacy systems during the transition to the colon format.

## Architecture

### Core Components

1. **SharedEventBus** (`src/shared/events/SharedEventBus.ts`)
   - Core event bus with priority handling, loop detection, and performance tracking
   - **Key Features**:
     - Priority-based event processing for critical operations
     - Loop detection with contextual keys (threshold: 50) prevents infinite chains
     - Performance monitoring and metrics built-in
     - Comprehensive debugging capabilities
     - Event history tracking (limited to 1000 entries for memory management)
   - **Benefits**: Eliminated code duplication, consistent event handling, better debugging
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
   - 96 game-specific event definitions
   - Comprehensive type safety with union types
   - **Race condition protection**: Single event handlers prevent duplicate processing (e.g., `next:level:requested` is handled exclusively by `GameEventCoordinator`)

## Event Categories

### System Initialization Events
All game systems emit a `system:initialized` event upon successful initialization to ensure proper system activation validation:

- **Purpose**: Allows EventFlowValidator and debugging tools to confirm all systems are properly initialized
- **Timing**: Emitted at the end of each system's `onInitialize()` method
- **Format**: `{ type: 'system:initialized', systemName: 'SystemName', timestamp: number }`
- **Systems**: GameManager, GameState, LayerManager, ScrewManager, PhysicsWorld
- **Implementation Details**:
  - **GameManager**: Emits after event coordinator setup
  - **GameState**: Emits after sub-manager initialization (GameStateCore, ContainerManager, HoldingHoleManager, SaveLoadManager)
  - **LayerManager**: Emits after event handler setup
  - **ScrewManager**: Emits after bounds initialization
  - **PhysicsWorld**: Emits after physics world setup and event bridging
- **Benefits**: Provides early detection of system initialization failures and improves debugging capabilities

### Game Lifecycle Events
- **Game State**: `game:started`, `game:paused`, `game:resumed`, `game:over`
- **Level Management**: `level:started`, `level:win:condition:met`, `level:transition:completed`, `level:progress:updated`, `next:level:requested`
- **Level Completion Effects**: `level:completion:burst:started`, `level:completion:burst:completed` - Visual celebration system for level completion
- **Game Over Restart**: Click/tap during game over screen triggers restart while preserving current level and total score
- **System Coordination**: `system:ready`, `system:initialized`, `all:layers:cleared`

### Screw System Events (Core Gameplay)
- **User Interactions**: `screw:clicked` (single-source emission from GameManager only), `screw:blocked:clicked` (with race condition protection)
- **State Changes**: `screw:removed`, `screw:collected`, `screw:blocked`, `screw:unblocked`
- **Animations**: `screw:animation:started`, `screw:animation:completed`
- **Transfers**: `screw:transfer:started`, `screw:transfer:completed`, `screw:transfer:failed`
- **Ownership**: Immediate ownership transfer when operations begin (not when animations complete) - prevents race conditions during shape destruction
- **Generation**: `screws:generated`, `shape:screws:ready`
- **Counting**: `remaining:screws:requested` - Counts screws in visible shapes and holding holes for container planning, with hole sizing based on ALL screws of selected colors
- **Physics Integration**: Enhanced physics constraint management with proper `isInContainer` state handling

### Shape System Events
- **Lifecycle**: `shape:created`, `shape:destroyed`, `shape:fell_off_screen`
- **Physics**: `shape:physics:updated`, `shape:attachment:changed`

### Layer System Events
- **Management**: `layer:created`, `layer:cleared`, `layer:visibility:changed`
- **State**: `layers:updated`, `layer:bounds:changed`, `layer:indices:updated`
- **Readiness**: `layer:shapes:ready`, `all_layers:screws:ready`
- **Layer Clearing**: `all:layers:cleared` - **Note**: Visual state only, NOT level completion

### Container System Events
- **State Changes**: `container:filled`, `container:replaced`, `container:all_removed`
- **Progress**: `container:progress:updated`, `container:state:updated`
- **Colors**: `container:colors:updated`
- **Lifecycle**: `container:initialize`, `container:removing:screws`
- **Transfers**: `screw:transfer:completed`, `screw:transfer:failed`, `screw:transfer:color_check`
- **Positioning**: Fixed 4-slot system prevents container shifting on removal
- **Hole Planning**: Container holes sized based on VISIBLE screws only (1-3 holes max), ensuring accurate prioritization of container colors
- **Proactive Management**: Containers created before needed via `layers:updated` and `layer:indices:updated` triggers
- **Replacement Timing**: Fixed race conditions by moving replacement logic to animation completion cycle

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
| **GameManager** | `system:initialized`, `game:started`, `game:paused`, `game:resumed`, `game:over`, `level:started`, `screw:clicked` (single-source input)<br/>**Note**: `game:started` is reused for restart functionality |
| **GameState** | `system:initialized`, `container:initialize`, `screw:transfer:started`, `screw:transfer:failed` |
| **LayerManager** | `system:initialized`, `layer:created`, `shape:created`, `physics:body:added`, `layer:shapes:ready`, `all:layers:screws:ready`, `total:screw:count:set` |
| **ScrewManager** | `system:initialized`, `screw:collected`, `screw:removed`, `screw:animation:*`, `screw:transfer:*`, `shape:screws:ready`, `container:filled` |
| **PhysicsWorld** | `system:initialized`, `physics:body:*`, `physics:constraint:*`, `physics:collision:detected`, `physics:step:completed`, `physics:error` |
| **ContainerManager** | `container:filled`, `container:state:updated`, `container:colors:updated`, `container:replaced`, `container:all_removed`, `container:removing:screws`, `level:completion:burst:started`, `level:completion:burst:completed` |
| **HoldingHoleManager** | `holding_hole:filled`, `holding_hole:state:updated`, `holding_holes:full`, `holding_holes:available` |
| **GameStateCore** | `level:transition:completed`, game state transitions, progress tracking events |
| **ProgressTracker** | `level:win:condition:met`, `progress:updated`, progress tracking events |
| **SaveLoadManager** | `save:completed`, `restore:completed`, error events |

### Major Event Subscribers

| System | Primary Events Subscribed |
|--------|---------------------------|
| **GameEventCoordinator** | `game:started`, `game:over`, `level:complete`, `debug:*`, `score:*`, `progress:updated`, `holding_hole:filled`, `container:filled` |
| **ContainerManager** | `container:filled`, `container:initialize`, `screw:transfer:*`, `screw:collected`, `bounds:changed`, `layers:updated`, `layer:indices:updated` |
| **GameRenderManager** | Render-related events, bounds changes |
| **GameDebugManager** | `debug:mode:toggled`, `debug:info:requested` |
| **SaveLoadManager** | `save:requested`, `restore:requested` |

## Input Handling Event Architecture

### Single-Source Input Pattern

The game implements a **single-source input handling pattern** to ensure reliable event emission and prevent animation conflicts:

#### **Event Source Hierarchy**
- **Primary Source**: GameManager exclusively handles all canvas input events
- **Event Emission**: Only GameManager emits `screw:clicked` events
- **No Duplication**: React component (GameCanvas) does not handle click events

#### **Input Processing Flow**
1. **Native Event Capture**: GameManager adds `addEventListener` to canvas for click/touch
2. **Smart Hit Detection**: Intelligent screw selection using GameRenderManager.getRenderState().allScrews
   - **Selection Algorithm**: Closest screw selected; non-blocked preferred within 5px threshold
   - **Blocking Check**: Uses ScrewManager.isScrewBlocked() for real-time blocking detection
   - **Consistent Radius**: All screws respond within full radius (30px touch, 15px mouse)
   - **Result**: Blocked screws properly trigger shake feedback at full interaction distance
3. **State Validation**: ScrewEventHandler validates screw exists in ScrewManager.state.screws
4. **Single Emission**: One `screw:clicked` event per user interaction

#### **Historical Issue Resolution**

**Previous Architecture Problem**:
- Both GameManager and GameCanvas handled the same canvas events
- Resulted in duplicate `screw:clicked` events for every interaction
- Caused interference with shake animations and collection behaviors

**Current Solution**:
- GameManager: Exclusive input event handler using native addEventListener
- GameCanvas: React component provides canvas but no event handling
- Result: Single event emission, reliable animations, predictable behavior

#### **Cross-Platform Input Support**
- **Mouse Events**: 15px interaction radius for precise desktop targeting
- **Touch Events**: 30px interaction radius for comfortable mobile interaction
- **Debug Features**: Shift+click for force removal, bypass mechanisms
- **Event Prevention**: Touch events prevent default zoom/scroll behaviors

#### **Game State Input Handling**
- **Active Gameplay**: Standard screw hit detection and click processing
- **Game Over State**: Any click/tap triggers restart via `handleRestartGame()`
- **Menu Overlay**: Click/tap anywhere resumes game (mobile-friendly)
- **State Priority**: Game over and menu overlay inputs bypass normal screw detection

## Critical Event Flows

### 0. Start Screen Interaction Flow

The start screen provides user onboarding and requires deliberate user interaction to begin gameplay:

```mermaid
sequenceDiagram
    participant User
    participant React as GameCanvas (React)
    participant GM as GameManager
    participant GS as GameState
    participant EB as EventBus
    
    Note over React: Systems initialized, start screen overlay visible
    React->>React: showStartScreen = true
    React->>React: Display start screen overlay with instructions
    
    User->>React: Click/Tap anywhere on start screen
    React->>React: handleStart() called
    React->>React: setShowStartScreen(false)
    React->>GS: gameState.startGame()
    
    GS->>EB: emit('game:started')
    GS->>EB: emit('level:started')
    
    Note over React: Start screen overlay hidden
    Note over GM: Game now accepts screw interactions
```

**Key Features:**
- **User-Initiated**: Game only starts when user explicitly clicks/taps
- **Educational**: Start screen provides clear objective and control instructions
- **Cross-Platform**: Works with both mouse clicks and touch interactions
- **State Management**: `showStartScreen` state controls overlay visibility
- **No Auto-Start**: Eliminated automatic game start for better user control
- **Mobile Optimized**: Responsive typography with CSS clamp() and proper z-index layering (1002) above canvas (1001)

### 1. System Initialization Flow

The system initialization flow ensures all game systems are properly initialized and validated:

```mermaid
sequenceDiagram
    participant GC as GameCanvas (React)
    participant SC as SystemCoordinator  
    participant GM as GameManager
    participant GS as GameState
    participant LM as LayerManager
    participant SM as ScrewManager
    participant PW as PhysicsWorld
    participant EFV as EventFlowValidator
    participant EB as EventBus

    Note over GC: React component mounts
    GC->>SC: new SystemCoordinator()
    GC->>SC: initialize(canvas)
    
    Note over SC: Create systems in dependency order
    SC->>PW: new PhysicsWorld()
    SC->>GS: new GameState()
    SC->>SM: new ScrewManager()
    SC->>LM: new LayerManager()
    SC->>GM: new GameManager()
    
    Note over SC: Initialize systems in dependency order
    
    SC->>PW: initialize()
    PW->>PW: setupEventHandlers() + setupPhysicsWorldEvents()
    PW->>EB: emit('system:initialized', { systemName: 'PhysicsWorld' })
    
    SC->>GS: initialize()
    GS->>GS: Initialize sub-managers (GameStateCore, ContainerManager, etc.)
    GS->>EB: emit('system:initialized', { systemName: 'GameState' })
    
    SC->>SM: initialize()
    SM->>SM: setupEventHandlers() + initialize bounds
    SM->>EB: emit('system:initialized', { systemName: 'ScrewManager' })
    
    SC->>LM: initialize()
    LM->>LM: setupEventHandlers()
    LM->>EB: emit('system:initialized', { systemName: 'LayerManager' })
    
    SC->>GM: initialize()
    GM->>GM: setupEventHandlers()
    GM->>EB: emit('system:initialized', { systemName: 'GameManager' })
    
    Note over SC: All systems initialized
    SC->>EB: emit('system:ready')
    
    Note over EFV: Validation after 1 second
    EFV->>EB: Check for 'system:initialized' events
    EFV->>EFV: Validate all expected systems emitted init events
    
    alt All systems initialized
        EFV->>GC: { isValid: true, issues: [], recommendations: [] }
    else Missing initialization events
        EFV->>GC: { isValid: false, issues: [...], recommendations: [...] }
    end
```

**Key Features**:
- **Dependency Order**: Systems initialize in correct dependency sequence
- **Validation Ready**: EventFlowValidator can confirm all systems are active
- **Early Detection**: Missing initialization events indicate system failures
- **Type Safety**: All initialization events include system name for tracking

### 2. Screw Removal Flow (Single-Source Input Handling)

```mermaid
sequenceDiagram
    participant User
    participant GM as GameManager
    participant SEH as ScrewEventHandler
    participant SM as ScrewManager
    participant PM as PhysicsWorld
    participant CM as ContainerManager
    participant HM as HoldingHoleManager
    participant EB as EventBus

    User->>GM: Click/Touch on canvas
    GM->>GM: Smart hit detection using render state
    GM->>GM: Find closest screw (5px preference for non-blocked)
    
    alt Screw found
        GM->>EB: emit('screw:clicked') [SINGLE SOURCE - No duplication]
        EB->>SEH: Route to ScrewEventHandler
        SEH->>SEH: Validate screw exists in ScrewManager state
        SEH->>SM: Forward to ScrewManager.handleScrewClicked()
        
        alt Screw is not blocked
            SM->>SM: Validate screw state (not collected/being collected)
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
                SM->>SM: HapticUtils.trigger('success')
                CM->>EB: emit('container:filled') [if container full]
                alt Container becomes full
                    CM->>CM: HapticUtils.trigger('container_filled')
                end
            else Container full, use holding hole
                Note over SM: Transfer ownership to holding hole immediately
                SM->>SM: screw.transferOwnership(holeId, 'holding_hole')
                SM->>HM: Animate to holding hole
                SM->>EB: emit('screw:animation:completed')
                SM->>EB: emit('screw:collected', destination: 'holding_hole')
                SM->>SM: HapticUtils.trigger('success')
                HM->>EB: emit('holding_hole:filled')
                HM->>EB: emit('holding_holes:full') [if all holes full]
            end
        else Screw is blocked
            SM->>EB: emit('screw:blocked:clicked')
            SM->>SM: Start shake animation (ANIMATION_CONSTANTS.shake.duration, amplitude, frequency)
            SM->>SM: HapticUtils.trigger('blocked')
            SM->>EB: emit('screw:shake:updated') events during animation
            Note over SM: Horizontal/vertical oscillation with render data updates
        end
    else No screw found
        Note over GM: No action taken
    end
```

### 3. Container Management Flow (Proactive + Reactive)

**Features proactive management with race condition protection:**

```mermaid
sequenceDiagram
    participant LM as LayerManager
    participant CM as ContainerManager
    participant EB as EventBus
    participant SM as ScrewManager
    participant SEH as ScrewEventHandler
    participant CP as ContainerPlanner

    Note over CM: PROACTIVE CONTAINER MANAGEMENT
    
    alt Layer state changes (affects screw removability)
        LM->>EB: emit('layers:updated')
        EB->>CM: Route to handleLayersUpdated()
        CM->>CM: Check throttle (1 second)
        CM->>EB: emit('remaining:screws:requested')
        EB->>SEH: Process remaining screw count request
        SEH->>SEH: Count screws in visible shapes + holding holes
        SEH->>SEH: Identify visible colors for container selection
        SEH->>CM: Return screws by color + visible colors (callback)
        CM->>CP: calculateOptimalContainers(visibleScrewInventory)
        CP->>CM: Return ContainerPlan
        
        alt Plan requires containers or containers missing
            CM->>CM: applyContainerPlan() - Add missing containers only
            CM->>EB: emit('container:state:updated')
            Note over CM: Containers ready BEFORE user needs them
        end
    end
    
    alt Layer indices change
        LM->>EB: emit('layer:indices:updated')
        EB->>CM: Route to handleLayerIndicesUpdated()
        Note over CM: Same proactive flow as layers:updated
    end

    Note over CM: REACTIVE CONTAINER MANAGEMENT (Existing)
    
    EB->>CM: 'screw:collected' (destination: 'container')
    CM->>CM: Add screw to container
    
    alt Container becomes full
        CM->>EB: emit('container:filled') with color & screws
        CM->>CM: Find container by color (not index)
        CM->>CM: Mark container for removal & start fade-out
        CM->>EB: emit('container:removing:screws') with calculated visualIndex
        
        Note over CM: Wait 500ms for fade-out animation
        Note over CM: Container and screws fade out together (synchronized alpha)
        CM->>CM: Clear slot but preserve position
        CM->>CM: Remove from containers array
        CM->>EB: emit('container:removed') with visualIndex
        
        Note over CM: IMMEDIATELY check for replacement (after removal)
        CM->>EB: emit('remaining:screws:requested')
        EB->>SEH: Process remaining screw count request
        SEH->>CM: Return screws by color + visible colors (callback)
        CM->>CM: Filter to visible colors for replacement decisions
        
        alt More screws need containers
            CM->>CM: Find first vacant slot
            CM->>CM: createReplacementContainersWithFadeIn(slot)
            CM->>EB: emit('container:state:updated')
            Note over CM: Replacement appears in vacant slot with fade-in (500ms)
            Note over CM: New container fades in empty (ready for screws)
        end
    end
```

### 4. Level Progression Flow

**Properly coordinated through GameEventCoordinator to prevent duplicate processing:**

```mermaid
sequenceDiagram
    participant User
    participant GM as GameManager
    participant GEC as GameEventCoordinator
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
        SEH->>SEH: Count screws in visible shapes + holding holes
        SEH->>PT: Return total remaining screws + visible colors (callback)
        
        alt No screws remaining
            PT->>EB: emit('level:win:condition:met')
            EB->>GEC: Process win condition (score addition)
            Note over GEC: GameStateCore adds level score to total
            GEC->>EB: emit('level:transition:completed')
            EB->>GEC: Handle level transition
            GEC->>LM: Clear all layers
            LM->>EB: emit('all:layers:cleared')
            
            Note over GEC: Show level complete screen after 3s delay
            Note over GEC: Display "Click to Continue" message
        end
    end
    
    User->>GM: Click on level complete screen
    GM->>EB: emit('next:level:requested')
    EB->>GEC: Route to GameEventCoordinator (ONLY handler)
    GEC->>GEC: Clear level complete timers
    GEC->>GM: Hide level complete screen
    GEC->>GM: Call GameState.nextLevel()
    GM->>GM: Initialize next level
    GM->>EB: emit('level:started')
    
    Note over GEC: Single handler prevents duplicate level progression
```

### 5. Level Completion Burst Effect Flow

**Triggered when the last container is removed:**

```mermaid
sequenceDiagram
    participant CM as ContainerManager
    participant EB as EventBus
    participant GRM as GameRenderManager
    participant BE as BurstEffect
    
    CM->>CM: checkForLastContainerRemoval()
    alt remainingContainers.length === 0
        CM->>BE: Create LevelCompletionBurstEffect
        CM->>BE: start(centerPosition)
        CM->>EB: emit('level:completion:burst:started')
        CM->>CM: HapticUtils.trigger('level_complete')
        
        Note over BE: 2.5s burst animation plays
        Note over BE: - 40 burst particles
        Note over BE: - 100 sparkle particles
        Note over BE: - "COMPLETE" wave text
        
        BE->>BE: Animation completes
        CM->>EB: emit('level:completion:burst:completed')
        CM->>EB: emit('container:all_removed')
    end
```

### 6. Game Over Trigger Flow (Holding Holes Full)

**Triggered when all holding holes are filled for 5 seconds:**

```mermaid
sequenceDiagram
    participant HM as HoldingHoleManager
    participant EB as EventBus
    participant GEC as GameEventCoordinator
    participant GM as GameManager
    
    HM->>EB: emit('holding_holes:full')
    EB->>GEC: Start 5-second countdown timer
    
    Note over GEC: 5-second countdown begins
    
    alt Timer completes (no holes freed)
        GEC->>EB: emit('game:over', reason: 'holding_holes_full')
        GEC->>GEC: HapticUtils.trigger('game_over')
        EB->>GM: Process game over state
        GM->>GM: Show game over screen
    else Hole becomes available
        HM->>EB: emit('holding_holes:available')
        EB->>GEC: Cancel countdown timer
        Note over GEC: Game continues normally
    end
```

### 7. Game Over Restart Flow

**Features state preservation and level regeneration:**

```mermaid
sequenceDiagram
    participant U as User
    participant GM as GameManager
    participant GSM as GameStateManager
    participant TM as TimerManager
    participant UM as UIManager
    participant EB as EventBus
    participant LM as LayerManager

    Note over GM: Game Over State Active
    U->>GM: Click/Tap anywhere on screen
    GM->>GM: Check gameState.gameOver === true
    GM->>GSM: Preserve currentLevel & totalScore
    GM->>TM: clearAllTimers()
    GM->>UM: resetUIState()
    GM->>GSM: resetGameState(preserveLevelAndScore=true)
    
    Note over GSM: Level & total score preserved<br/>Level score cleared to 0
    
    GM->>EB: emit('game:started')
    EB->>LM: Initialize current level
    LM->>LM: Generate new random positioning
    LM->>EB: emit('level:started')
    
    Note over GM: Game returns to active state<br/>Same level, fresh layout
```

### 8. Physics Integration Flow

**Features atomic screw state management and constraint handling:**

```mermaid
sequenceDiagram
    participant SM as ScrewManager
    participant PM as PhysicsWorld
    participant ShM as ShapeManager
    participant EB as EventBus

    EB->>SM: 'screw:clicked'
    SM->>SM: Atomic state update (isBeingCollected + physics)
    SM->>PM: Remove constraint
    PM->>EB: emit('physics:constraint:removed')
    PM->>EB: emit('physics:body:removed:immediate')
    
    Note over SM: Physics constraint removal is atomic with state changes
    
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

### 9. Remaining Screw Counting Flow

The `remaining:screws:requested` event is critical for container replacement logic and win condition checking. It provides both screw counts and visible color information for accurate container planning.

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
    
    SEH->>SEH: Count screws in visible shapes
    Note over SEH: Filter: !isCollected && !isBeingCollected && inVisibleLayer
    
    SEH->>SEH: Count screws in holding holes
    Note over SEH: Check: hole.screwId && hole.screwColor
    
    SEH->>SEH: Identify visible colors from shapes + holes
    SEH->>SEH: Combine counts by color (ALL screws for hole sizing)
    
    alt Container replacement
        SEH->>CM: Return Map<color, count> + visibleColors via callback
        CM->>CM: Filter to visible colors for replacement decisions
    else Win condition
        SEH->>PT: Return Map<color, count> + visibleColors via callback
        PT->>PT: Check if total remaining visible screws = 0
    end
```

**Key Implementation Details:**
- **ScrewEventHandler.handleRemainingScrewCountsRequested()** processes the request
- **Counts screws in visible shapes**: Iterates through `state.screws` filtering for active screws in visible layers
- **Counts screws in holding holes**: Iterates through `state.holdingHoles` checking for occupied holes
- **Identifies visible colors**: Tracks colors present in visible shapes and holding holes for container selection
- **Returns dual data**: Uses callback pattern with `Map<string, number>` + `Set<string>` for counts and visible colors
- **Used by ContainerManager**: For intelligent container replacement decisions using visible colors only
- **Used by ProgressTracker**: For accurate win condition detection based on visible layer progress

### 10. Level Completion Burst Effect Flow

The level completion visual effects system provides spectacular animation when the last container is removed:

```mermaid
sequenceDiagram
    participant CM as ContainerManager
    participant LCE as LevelCompletionBurstEffect
    participant GRM as GameRenderManager
    participant EB as EventBus
    participant GM as GameManager (Debug)

    Note over CM: Container filled and fade animation starts
    
    CM->>CM: handleContainerFilled() - fade animation (500ms)
    
    Note over CM: After fade animation completes
    
    CM->>CM: checkForLastContainerRemoval(containerPosition)
    
    alt Last container removed (remainingContainers.length === 0)
        CM->>LCE: new LevelCompletionBurstEffect()
        CM->>LCE: start(centerPosition)
        
        Note over LCE: Initialize particle systems:<br/>- 25 burst particles (radial, optimized)<br/>- 50 sparkle particles (random, performance-tuned)<br/>- "COMPLETE" wave text letters (48px font)
        
        CM->>EB: emit('level:completion:burst:started')
        CM->>EB: emit('container:all_removed')
        
        Note over CM,LCE: Update loop (5.5 seconds - optimized for clean overlay transition)
        
        loop Animation Update (60fps)
            CM->>LCE: update(deltaTime)
            
            Note over LCE: Update all effects:<br/>- Burst particles (0-1.5s expand, 1.5-5.5s fade)<br/>- Sparkle particles (0.2-5.0s twinkling)<br/>- Wave text (0.2-4.5s wave animation)
            
            GRM->>CM: renderBurstEffect(ctx)
            CM->>LCE: render(ctx) [if active]
            
            Note over LCE: Render with proper layering:<br/>- Burst particles with glow<br/>- Sparkle particles with twinkle<br/>- Wave text with sine motion
        end
        
        alt Animation Complete (progress >= 1.0)
            LCE->>CM: update() returns true
            CM->>EB: emit('level:completion:burst:completed')
            CM->>CM: burstEffect = null (cleanup)
        end
    end
    
    Note over GM: Debug Mode Alternative
    
    alt Debug Key Pressed ('C' in debug mode)
        GM->>CM: triggerDebugBurstEffect()
        CM->>LCE: new LevelCompletionBurstEffect()
        CM->>LCE: start(centerPosition) [screen center]
        CM->>EB: emit('level:completion:burst:started')
        
        Note over GM,CM: Same animation loop as above
    end
```

**Key Features:**
- **Automatic Triggering**: Starts when last container box is removed from game
- **Multi-Layer Animation**: Three synchronized particle systems with staggered fade-out timing
- **Performance Optimized**: 
  - Single-layer glow rendering (70% reduction in draw calls)
  - Optimized particle counts (25 burst, 50 sparkle)
  - Early opacity culling (threshold 0.05)
  - Delta-time based animation with automatic cleanup
- **Clean Overlay Transition**: 5.5s animation completes before 6s level completion overlay
- **Debug Support**: Manual triggering via 'C' key in debug mode for testing
- **Event Integration**: Proper event emission for system coordination

### 11. Ownership Transfer and Disposal Safety Flow

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
- **Data Integrity**: Screws cannot be deleted by unauthorized systems (via `canBeDeletedBy()` validation)
- **Simplified Logic**: No need to check containers/holding holes during disposal
- **Debug Visibility**: Complete ownership tracking with logging
- **State Integrity**: Proper handling of `isInContainer`, `isBeingCollected`, and `isCollected` states

## Event Naming Conventions

### Established Patterns

1. **Domain-Action Structure**: `domain:action` or `domain:subdomain:action`
   -  `screw:clicked`, `container:filled`, `level:complete`
   -  `physics:body:added`, `screw:animation:started`

2. **State Update Events**: Use `:updated` suffix
   -  `container:state:updated`, `layer:bounds:changed`

3. **Request-Response Patterns**: Use `:requested` for requests
   -  `save:requested`, `restore:requested`

### Event Naming Consistency

All events follow a consistent `domain:action` or `domain:subdomain:action` format with colon separators for predictable hierarchy and industry alignment. This standardization provides consistent, predictable event names and easier understanding of event hierarchy.


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

1. **Naming Standardization**: Complete transition of remaining underscore events to colon format
2. **Event Batching**: Implement batching for high-frequency events
3. **Performance Monitoring**: Add automatic performance threshold alerts
4. **Event Replay**: Add event replay capabilities for debugging
5. **Additional Race Condition Prevention**: Continue monitoring for edge cases in event handling