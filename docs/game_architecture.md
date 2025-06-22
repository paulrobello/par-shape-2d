# Game Architecture Documentation

## Documentation Guidelines

**Note**: This document is a companion to the `game_event_flows.md` document, which details the event-driven architecture of the game. This document focuses on the overall game architecture, system organization, and logic flows.

**Important**: This document describes the current state of the game architecture. New functionality is documented directly in relevant sections rather than as separate updates. This document should NOT be treated as a changelog.

## Overview

PAR Shape 2D is a physics-based puzzle game using Next.js, TypeScript, and Matter.js. The game features a sophisticated event-driven architecture with complete system decoupling, comprehensive shared utilities, and robust physics integration.

### Core Game Concept

Players remove screws from layered shapes to collect them in color-matched containers. Each level presents multiple layers of shapes with screws that must be strategically removed to allow shapes to fall and progress through the level.

### Key Features

- **Physics-Based Gameplay**: Real-time physics simulation using Matter.js
- **Layered Shape System**: Multiple layers with depth-based collision detection
- **Strategic Screw Removal**: Screws hold shapes in place and must be removed strategically
- **Color-Matching Mechanics**: Screws must be placed in matching colored containers
- **Progressive Difficulty**: Increasing complexity through additional layers and shapes
- **Touch/Mouse Support**: Full cross-platform input handling with adaptive touch radius (UI_CONSTANTS.input.touchRadius for mobile, UI_CONSTANTS.input.mouseRadius for desktop)
- **Mobile-Friendly UI**: Menu overlay supports tap-to-resume for seamless mobile gameplay
- **Haptic Feedback**: Comprehensive vibration patterns for mobile devices via HapticUtils

## Architectural Principles

### 1. Event-Driven Architecture

The entire game operates on a comprehensive event system that ensures complete decoupling between systems:

- **Centralized Event Bus**: `SharedEventBus` handles all inter-system communication
- **Type-Safe Events**: 96 game-specific event types with full TypeScript support
- **Priority-Based Processing**: Events can be prioritized for critical operations
- **Loop Detection**: Sophisticated protection against infinite event loops
- **Performance Monitoring**: Built-in event processing metrics and debugging

### 2. System Decoupling

All game systems extend `BaseSystem` and operate independently:

- **Autonomous Operation**: Each system manages its own state and responsibilities
- **Event-Only Communication**: No direct system-to-system dependencies
- **Graceful Degradation**: Systems can fail without affecting others
- **Hot-Swappable**: Systems can be replaced or modified independently

### 3. Shared Utilities Framework

Comprehensive utilities prevent code duplication and ensure consistency:

- **EventEmissionUtils**: Standard event creation with automatic timestamps and completion patterns
- **StateValidationUtils**: Unified validation with system, game state, and screw validation helpers  
- **DebugLogger**: Consistent debug logging with conditional output, standardized formatting, and emojis
  - **logGame()**: General game state logging
  - **logEvent()**: Event flow logging
  - **logCollision()**: Collision detection logging
  - **logShapeCreation()**: Shape factory logging
  - **logInfo()**: Always-visible information messages
- **HapticUtils**: Centralized haptic feedback management for mobile devices
  - **Success Pattern**: 50ms vibration for screw removal
  - **Blocked Pattern**: 50ms vibration for blocked actions
  - **Container Filled**: [100, 50, 100] celebration pattern
  - **Level Complete**: [100, 50, 100, 50, 150] extended celebration
  - **Game Over**: [200, 100, 200] distinct pattern
- **Enhanced Animation System**:
  - **EasingFunctions**: 24+ professional easing functions (cubic, elastic, bounce, etc.)
  - **AnimationUtils**: State management with transition support for evolving animation APIs
  - **EasingPresets**: Curated configurations for UI, game, and physics animations
  - **ANIMATION_CONSTANTS**: Centralized timing configuration
    - Collection: 800ms duration
    - Transfer: 600ms duration  
    - Shake: 300ms duration with 8 oscillations, 3px amplitude
    - Container Fade: 500ms duration
    - Level Completion Burst: 5500ms duration (optimized to complete before 6s overlay)
  - **Screw Rotation**: Configurable rotation speeds for collection (1 rps) and transfer (1.5 rps) animations
  - **Blocked Screw Feedback**: ANIMATION_CONSTANTS.shake configuration with alternating horizontal/vertical movement
- **Advanced Rendering Utilities**:
  - **GeometryRenderer**: High-performance shape rendering with rounded corners and optimized glow effects
    - Single-layer glow rendering (optimized from 3-layer) for 70% reduction in draw calls
    - Efficient composite operations with screen blending for particle effects
  - **ButtonStyles**: Professional UI styling system with accessibility features
  - **ScrewRenderer**: Enhanced screw visualization with visible rotation, clean 4-point cross, and alpha inheritance for container fade animations
- **GeometryUtils**: Mathematical calculations and collision detection
- **CollisionUtils**: Advanced two-phase collision detection with precise geometric accuracy
- **Constants**: Centralized configuration values and game constants shared across all systems

### 4. Physics Integration

Deep integration with Matter.js physics engine:

- **Shared Physics World**: Centralized physics simulation
- **Body Management**: Automatic physics body lifecycle management
- **Constraint System**: Dynamic constraint management and lifecycle control
- **Collision Detection**: Advanced two-phase collision handling (broad + narrow phase) with layer isolation and precise geometric accuracy

### 5. Advanced Collision Detection System

The game features a sophisticated collision detection system that ensures accurate screw blocking based on actual shape geometry rather than simplified bounding boxes:

#### **Two-Phase Collision Detection**
- **Broad Phase**: Fast bounding box intersection test for early elimination
- **Narrow Phase**: Precise circle-vs-shape geometric collision detection

#### **Shape-Specific Collision Handling**
- **Concave Shapes** (stars, arrows, chevrons, horseshoes): Uses original shape vertices to preserve concave geometry
- **Convex Shapes** (rectangles, circles, polygons, capsules): Uses physics body vertices for optimal performance
- **Composite Shapes**: Handles multi-part physics bodies with individual collision testing

#### **Priority-Based Collision Selection**
1. **Priority 1**: Original vertices for concave shapes (prevents convex hull false positives)
2. **Priority 2**: Physics body vertices for convex shapes (maintains physics accuracy)
3. **Priority 3**: Shape-type specific algorithms for special cases
4. **Fallback**: Vertex-based collision for unknown types

#### **Geometric Accuracy Benefits**
- **Visual Consistency**: Collision detection matches what players see visually
- **Eliminates False Positives**: Screws no longer blocked by invisible bounding box extensions
- **Maintains Performance**: Efficient algorithms with minimal computational overhead
- **Shape Integrity**: Preserves the unique characteristics of each shape type

#### **Technical Implementation**
- **Circle-vs-Polygon**: Point-in-polygon testing with edge intersection detection
- **Rotation Awareness**: Handles shape rotation with proper coordinate transformation
- **Radius Consideration**: Includes screw radius in collision calculations
- **Edge Case Handling**: Robust algorithms for degenerate cases and corner interactions

## System Architecture

### System Relationships Overview

The following diagram illustrates the relationships and dependencies between all game systems:

```mermaid
graph TB
    %% Core Management Layer
    GameManager[GameManager<br/>Game Lifecycle & Coordination]
    GameStateCore[GameStateCore<br/>State Management & Scoring]
    
    %% Event System (Central Hub)
    EventBus((SharedEventBus<br/>Event Coordination))
    
    %% Core Game Systems
    ScrewManager[ScrewManager<br/>Screw Lifecycle & Physics]
    ContainerManager[ContainerManager<br/>Container & Collection Logic]
    LayerManager[LayerManager<br/>Shape & Layer Organization]
    PhysicsWorld[PhysicsWorld<br/>Matter.js Integration]
    
    %% Supporting Systems
    HoldingHoleManager[HoldingHoleManager<br/>Overflow Storage]
    ProgressTracker[ProgressTracker<br/>Progress & Win Conditions]
    SaveLoadManager[SaveLoadManager<br/>State Persistence]
    GameRenderManager[GameRenderManager<br/>Visual Presentation]
    
    %% Screw Subsystems
    ScrewEventHandler[ScrewEventHandler<br/>Event Processing]
    ScrewAnimationService[ScrewAnimationService<br/>Animation Management]
    ScrewTransferService[ScrewTransferService<br/>Transfer Logic]
    ScrewPhysicsService[ScrewPhysicsService<br/>Physics Integration]
    ScrewPlacementService[ScrewPlacementService<br/>Strategic Placement]
    
    %% Shared Utilities
    SharedUtils[Shared Utilities<br/>EventEmissionUtils<br/>StateValidationUtils<br/>DebugLogger<br/>HapticUtils<br/>GeometryRenderer<br/>ScrewRenderer<br/>AnimationUtils<br/>Constants]
    
    %% Relationships - Core Management
    GameManager -.-> EventBus
    GameStateCore -.-> EventBus
    
    %% Relationships - Core Systems to Event Bus
    ScrewManager -.-> EventBus
    ContainerManager -.-> EventBus
    LayerManager -.-> EventBus
    PhysicsWorld -.-> EventBus
    
    %% Relationships - Supporting Systems to Event Bus
    HoldingHoleManager -.-> EventBus
    ProgressTracker -.-> EventBus
    SaveLoadManager -.-> EventBus
    GameRenderManager -.-> EventBus
    
    %% Screw System Internal Structure
    ScrewManager --> ScrewEventHandler
    ScrewManager --> ScrewAnimationService
    ScrewManager --> ScrewTransferService
    ScrewManager --> ScrewPhysicsService
    ScrewManager --> ScrewPlacementService
    
    %% Screw Subsystems to Event Bus
    ScrewEventHandler -.-> EventBus
    ScrewAnimationService -.-> EventBus
    ScrewTransferService -.-> EventBus
    ScrewPhysicsService -.-> EventBus
    
    %% Physics Integration
    ScrewPhysicsService --> PhysicsWorld
    LayerManager --> PhysicsWorld
    
    %% Shared Utilities Usage (all systems use these)
    GameManager --> SharedUtils
    GameStateCore --> SharedUtils
    ScrewManager --> SharedUtils
    ContainerManager --> SharedUtils
    LayerManager --> SharedUtils
    PhysicsWorld --> SharedUtils
    HoldingHoleManager --> SharedUtils
    ProgressTracker --> SharedUtils
    SaveLoadManager --> SharedUtils
    GameRenderManager --> SharedUtils
    
    %% Key Data Flows
    EventBus -.->|screw:clicked| ScrewManager
    EventBus -.->|screw:collected| ContainerManager
    EventBus -.->|screw:collected| ProgressTracker
    EventBus -.->|container:filled| GameStateCore
    EventBus -.->|level:completed| GameManager
    EventBus -.->|remaining:screws:requested| ScrewEventHandler
    
    %% Styling
    classDef coreSystem fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef supportSystem fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef screwSubsystem fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef eventSystem fill:#e8f5e8,stroke:#1b5e20,stroke-width:3px
    classDef sharedSystem fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    
    class GameManager,GameStateCore,ScrewManager,ContainerManager,LayerManager,PhysicsWorld coreSystem
    class HoldingHoleManager,ProgressTracker,SaveLoadManager,GameRenderManager supportSystem
    class ScrewEventHandler,ScrewAnimationService,ScrewTransferService,ScrewPhysicsService,ScrewPlacementService screwSubsystem
    class EventBus eventSystem
    class SharedUtils sharedSystem
```

**Legend:**
- **Blue (Core Systems)**: Primary game logic systems
- **Purple (Supporting Systems)**: Specialized functionality systems  
- **Orange (Screw Subsystems)**: Components within ScrewManager
- **Green (Event System)**: Central communication hub
- **Pink (Shared Utilities)**: Common functionality used by all systems
- **Solid Lines**: Direct dependencies/composition
- **Dotted Lines**: Event-based communication

### Core Systems

#### **GameManager** (`src/game/core/GameManager.ts`)
**Responsibility**: Overall game lifecycle and coordination
- Game state transitions (start, pause, resume, stop)
- Level progression management
- System initialization and cleanup
- **Exclusive input event handling** (mouse/touch clicks on canvas)
- **Canvas bounds management** (emits `bounds:changed` events for system coordination)
- Save/restore game state
- Menu overlay interaction handling

**Input Event Processing**:
- **Single-source responsibility**: Only GameManager handles canvas click/touch events
- **Hit detection**: Finds screws at click coordinates using render state
- **Event emission**: Converts raw input to `screw:clicked` events
- **Debug support**: Shift+click for force removal, debug bypass controls
- **Cross-platform**: Handles both mouse (15px radius) and touch (30px radius) input
- **Menu Overlay**: Click/tap anywhere on paused overlay to resume game (mobile-friendly)

**Game Over and Restart Handling**:
- **Game Over Input**: Click/tap anywhere during game over screen to restart
- **State Preservation**: Restart maintains current level and total score
- **Level Regeneration**: New random shape positioning while preserving level structure
- **Score Reset**: Clears level score but preserves total score across restarts

**Key Events Emitted**:
- `game:started`, `game:paused`, `game:resumed`, `game:over`
- `level:started`, `level:complete`
- `screw:clicked` - Primary screw interaction event
- `bounds:changed` - Canvas dimension updates (initialization + resize)

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
- Screw instantiation and placement within shapes
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
- Container instantiation with appropriate colors and hole counts (1-3 holes per container)
- **Hole Planning**: Creates containers for colors present in visible layers or holding holes, with hole counts based on TOTAL screws (across all layers) for proper capacity planning
- Screw placement and hole management
- Container completion detection
- Intelligent container substitution with synchronized fade animations
- Fixed 4-slot positioning system
- **Container Fade Animation**: 500ms fade-out/fade-in transitions with synchronized screw fading

**Key Features**:
- **Fixed-Slot System**: 4 predetermined positions prevent container shifting
- **Smart Replacement**: Uses real-time screw data for optimal container selection
- **Vacant Slot Usage**: New containers appear in first available slot
- **Color-Based Identification**: Finds containers by color instead of index for reliability
- **Race Condition Prevention**: Event-driven substitution with immediate fade-in
- **Reservation System**: Prevents duplicate screw assignments

**Slot Architecture**:
- `containerSlots[]` maintains 4 fixed positions
- `getContainers()` returns slot-ordered containers
- Positioning calculated for all slots, not just filled ones
- Container removal preserves slot positions

**Container Replacement Timing**:
1. Container filled → Mark for removal → Start fade-out animation (500ms)
   - Container and contained screws fade out together using synchronized alpha values
   - Screws inherit container's fadeOpacity for seamless visual transition
2. After fade-out completes → Remove container and screws physically  
3. **IMMEDIATELY** spawn replacement containers with fade-in animation (500ms)
4. Replacement containers become fully visible

**Proactive Container Management**:
- **ContainerPlanner** utility for optimal container calculation using visible layer data
- **Color Selection**: Only creates containers for colors present in visible shapes or holding holes
- **Hole Sizing**: Counts ALL remaining screws of selected colors (across all layers) for proper capacity planning
- **Visibility-Aware**: Tracks visible layers and adapts container selection accordingly
- Event-driven updates on layer changes
- Throttled updates (1-second) to prevent excessive recalculation
- Conservative updates that only add missing containers

#### **LayerManager** (`src/game/systems/LayerManager.ts`)
**Responsibility**: Multi-layer shape organization and visual management
- Layer instantiation and management (10+ layers per level, with only 4 visible at a time)
- Shape placement within layers using **ShapeFactory** for robust shape generation
- Layer visibility and depth management
- Physics group isolation between layers
- Progressive layer revelation
- **Canvas bounds coordination**: Listens to `bounds:changed` events to update shape area constraints
- **Layer state notifications**: Emits layer clearing events for UI updates
- **Note**: Does NOT determine level completion - only handles layer management

**Layer Properties**:
- Each layer has unique visual tinting using round-robin color assignment from 8 distinct colors
- **Layer Color System**: Uses sequential color assignment (colorCounter % 8) ensuring variety and preventing color duplication issues
- **Tint Colors**: Light red, green, blue, yellow, purple, pink, mint, and lime - chosen for visual distinction
- Physics bodies only interact within their layer
- 6 shapes per layer with strategic placement including capsule shapes
- Depth-based collision detection for screw accessibility
- **ShapeFactory Integration**: Uses advanced shape generation with fallback mechanisms for reliable shape placement
- **Screw Colors**: Screws are randomly colored using one of 9 colors: pink, red, green, blue, light blue, yellow, purple, orange, or brown
- **Shape Types**: Supports 12 shape types: circle, capsule, arrow, chevron, star, triangle, square, rectangle, pentagon, hexagon, heptagon, octagon, horseshoe (currently disabled)

#### **PhysicsWorld** (`src/game/physics/PhysicsWorld.ts`)
**Responsibility**: Physics engine integration and management
- Matter.js world management with composite body support
- Body and constraint lifecycle including complex multi-part shapes
- Collision event processing
- Physics debugging and visualization
- Performance optimization

**Integration Points**:
- Shape body instantiation and management including composite shapes (capsules)
- Screw constraint handling
- Layer-based collision groups
- Real-time physics stepping
- **Composite Body Support**: Proper handling of multi-part physics bodies with accurate bounds calculation

**Physics State Management**:
- Proper handling of screw states: `isBeingCollected`, `isInContainer`, `isCollected`
- Atomic screw collection prevents duplicate clicks and race conditions
- Updated constraint stiffness for natural movement
- Optimized constraint removal for immediate shape falling

**Race Condition Prevention**:
- Physics constraints removed atomically with state changes
- State validation prevents duplicate operations
- Proper screw filtering logic excludes `isInContainer` screws

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
- Container and holding hole visualization with synchronized fade animations
- Animation coordination including screw fade-out with containers
- Mobile responsiveness
- **Screw-Container Fade Synchronization**: Passes container fadeOpacity to ScrewRenderer for unified transitions
- **Menu Overlay Rendering**: Displays pause menu with mobile-friendly "Click/Tap anywhere to resume" instruction

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
- Handles layer instantiation, visibility, and physics organization
- Emits `all:layers:cleared` for UI state updates
- **Does NOT determine level completion** - purely layer management
- Layer clearing is independent of actual game progress

#### **Benefits of This Architecture**
- **Clear Separation**: Each system has a single, well-defined responsibility
- **Accurate Completion**: Level completion based on actual game objectives (screw collection)
- **No Race Conditions**: Single authoritative source prevents competing completion logic
- **Maintainable**: Easy to reason about and debug completion flow

### Level Completion Visual Effects

The game features a sophisticated visual celebration system that provides spectacular "eye candy" when the level is completed. This system demonstrates the game's professional polish and creates satisfying player feedback.

#### **System Overview**

The level completion effects system creates a multi-layered animated celebration that triggers automatically when the last container box is removed from the game. The system is designed to:

- **Provide Immediate Visual Feedback**: Players instantly see that they've accomplished the level objective
- **Create Emotional Satisfaction**: The burst and sparkle effects create a sense of achievement
- **Maintain Performance**: Self-contained animation with proper cleanup and optimization
- **Support Debugging**: Comprehensive debug tools for development and testing

#### **LevelCompletionBurstEffect Class**

Located at `src/shared/rendering/components/LevelCompletionBurstEffect.ts`, this class is a fully self-contained animation system:

##### **Particle Systems**
1. **Burst Particles (40 particles)**
   - Shoot outward radially from the center of the canvas
   - Use `easeOutCubic` easing for natural deceleration
   - Doubled velocity with 300px burst radius (2x speed)
   - Varying distances (0.8-1.2x radius) for organic spread
   - Size: 4px base with ±20% variation for natural look
   - Colors: Gold (#FFD700), Orange-red (#FF6B35), Orange (#F7931E), Yellow (#FFFF00), Deep pink (#FF1493)
   - Glow and shadow effects for premium visual quality

2. **Sparkle Particles (100 particles)**
   - Randomly positioned within sparkle radius around burst center
   - Twinkling animation with individual phase offsets
   - Scale animation between 0.5x and 2x for dynamic sparkle effect
   - Size: 2.5px base with ±40% variation
   - Colors: White (#FFFFFF), Light blue (#E6F3FF), Cornsilk (#FFF8DC), Alice blue (#F0F8FF), Lemon chiffon (#FFFACD)
   - 6 full twinkle cycles over effect duration

3. **Wave Text Animation**
   - Large "COMPLETE" text in professional green (#2ECC71)
   - 64px bold Arial font with stroke and glow effects
   - Individual letter wave motion with sine wave calculation
   - 15px wave amplitude, 2Hz frequency for smooth motion
   - Per-letter phase offsets create flowing wave across the word
   - Fade in/out transitions for professional appearance

##### **Animation Timeline (2.5 seconds total)**
```
0.0-0.5s: Burst Phase
├── Burst particles expand rapidly (easeOutCubic)
├── Particles fade to 30% opacity
└── High-energy explosive motion

0.2-2.0s: Sparkle Phase (overlaps with burst)
├── Sparkle particles begin twinkling
├── 6 full twinkle cycles
├── Random phase offsets prevent uniform motion
└── Gradual fade out over time

0.3-2.2s: Wave Text Phase (overlaps with sparkles)
├── Text fades in over first 20% of phase
├── Continuous wave motion across letters
├── Full opacity in middle 60% of phase
└── Fade out over final 20% of phase

2.0-2.5s: Final Fade
├── All effects fade to completion
├── Automatic cleanup and resource release
└── Event emission for effect completion
```

#### **Integration Architecture**

##### **Trigger System**
- **Detection**: `ContainerManager.checkForLastContainerRemoval()` monitors container count
- **Condition**: Triggers when `remainingContainers.length === 0`
- **Position**: Uses the last removed container's position as burst center
- **Timing**: Starts immediately when condition is met, before level complete overlay

##### **Event Flow**
```typescript
// Events emitted by the level completion system
'level:completion:burst:started' {
  position: { x: number; y: number },
  duration: number
}

'level:completion:burst:completed' {
  position: { x: number; y: number }
}
```

##### **Render Pipeline Integration**
1. **Location**: `GameRenderManager.renderBurstEffect()` calls effect rendering
2. **Order**: Rendered after game elements but before UI overlay
3. **Context**: Uses main game canvas context with proper transforms
4. **Performance**: Only renders when effect is active, automatic cleanup

#### **Configuration and Customization**

The `BurstEffectConfig` interface allows full customization:

```typescript
interface BurstEffectConfig {
  duration?: number;              // Default: 2500ms (under 3s requirement)
  burstParticleCount?: number;    // Default: 10, game uses 40 (4x)
  sparkleParticleCount?: number;  // Default: 18, game uses 100 (5.5x)
  burstRadius?: number;           // Default: 120px, game uses 300px (2.5x velocity)
  sparkleRadius?: number;         // Default: 80px, game uses 240px (3x)
  burstParticleSize?: number;     // Default: 4px
  sparkleParticleSize?: number;   // Default: 2.5px
  textFontSize?: number;          // Default: 64px
  textWaveAmplitude?: number;     // Default: 15px
  textWaveFrequency?: number;     // Default: 2Hz
}
```

#### **Debug and Development Support**

##### **Debug Key Integration**
- **Key**: Press 'C' while in debug mode to manually trigger effect
- **Method**: `ContainerManager.triggerDebugBurstEffect()`
- **Position**: Uses screen center for debug triggering
- **Events**: Emits same events as normal completion for full testing

##### **Debug Logging**
- **Flag**: `DEBUG_CONFIG.logLevelCompletionEffects` controls all effect logging
- **Coverage**: Effect creation, animation updates, rendering calls, completion
- **Performance**: Throttled logging to prevent spam in render loop
- **Debugging**: Helps track effect lifecycle and troubleshoot issues

##### **Menu Integration**
- **Display**: Debug keys shown in pause menu when debug mode is active
- **Instructions**: Clear labeling for 'C' key functionality
- **Visibility**: Gold color (#FFD700) distinguishes debug instructions

#### **Performance Optimization**

##### **Efficient Rendering**
- **Conditional Rendering**: Only renders when `isActive()` returns true
- **Opacity Culling**: Particles below 0.01 opacity are skipped
- **Automatic Cleanup**: Effect nullifies itself on completion
- **Memory Management**: Temporary canvas for text measurement is local

##### **Animation Efficiency**
- **Delta Time Based**: Smooth animation regardless of frame rate
- **Progress Tracking**: Single progress value drives all animations
- **Easing Functions**: Leverages shared `EasingFunctions` utility
- **State Management**: Minimal state updates per frame

#### **Technical Implementation Details**

##### **Class Structure**
```typescript
export class LevelCompletionBurstEffect {
  private animationState: EffectAnimationState | null;
  private config: Required<BurstEffectConfig>;
  
  // Public API
  start(centerPosition: Vector2): void
  update(deltaTime: number): boolean
  render(ctx: CanvasRenderingContext2D): void
  isActive(): boolean
  stop(): void
  
  // Private implementation
  private createWaveTextLetters(): WaveTextLetter[]
  private renderWaveText(): void
  private getRandomBurstColor(): string
  private getRandomSparkleColor(): string
}
```

##### **State Management**
- **Single State Object**: `EffectAnimationState` contains all animation data
- **Null When Inactive**: Clear active/inactive distinction
- **Immutable Config**: Configuration frozen at creation time
- **Progress-Driven**: All animations derived from single progress value (0-1)

#### **Future Enhancement Opportunities**

While the current implementation is complete and polished, potential enhancements include:

- **Sound Integration**: Audio effects synchronized with visual animation
- **Haptic Feedback**: Mobile device vibration on effect trigger
- **Particle Physics**: Physics-based particle movement for more realism
- **Color Theming**: Dynamic colors based on level or achievement type
- **Scale Adaptation**: Responsive sizing based on screen dimensions
- **Multiple Effects**: Different celebration styles for different achievements

## Game Logic Flows

### 1. Screw Removal Flow (Single-Source Input Handling)

```mermaid
sequenceDiagram
    participant User
    participant GM as GameManager
    participant SEH as ScrewEventHandler
    participant SM as ScrewManager
    participant CM as ContainerManager
    participant PM as PhysicsWorld
    participant EB as EventBus

    User->>GM: Click/Touch on canvas
    GM->>GM: Hit detection using render state
    GM->>GM: Find screw at coordinates (15px mouse/30px touch)
    
    alt Screw found
        GM->>EB: emit('screw:clicked') [SINGLE SOURCE]
        EB->>SEH: Route to ScrewEventHandler
        SEH->>SEH: Validate screw exists in ScrewManager state
        SEH->>SM: Forward to ScrewManager.handleScrewClicked()
        
        alt Screw is removable
            SM->>SM: Validate screw state (not collected/being collected)
            SM->>SM: Start collection (atomic state change)
            SM->>PM: Remove physics constraint
            SM->>EB: emit('screw:animation:started')
            
            Note over SM: Collection animation to destination
            
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
            SM->>SM: Start shake animation (400ms duration, 3px amplitude, 8 oscillations)
            SM->>EB: emit('screw:shake:updated') events during animation
            Note over SM: Horizontal/vertical oscillation with render data updates
        end
    else No screw found
        Note over GM: No action taken
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
            PT->>EB: emit('level:win:condition:met')
            EB->>GSC: Process win condition & add score
            Note over GSC: Add level score to total score
            GSC->>EB: emit('level:transition:completed')
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
        EB->>SEH: Count screws by color + identify visible colors
        SEH->>CM: Return screw counts + visible colors
        CM->>CM: Filter to visible colors only for container selection
        
        alt Replacement needed
            CM->>Slots: Find first vacant slot
            CM->>CM: Create container with fade-in at slot
            CM->>Slots: Assign container to vacant slot
            CM->>EB: emit('container:state:updated')
            Note over CM: New container fades in at exact position (500ms)
        else No substitution needed
            Note over Slots: Slot remains vacant until needed
            CM->>EB: emit('container:all_removed')
        end
    end
```

## Data Flow Architecture

### Screw Ownership System

The game implements a comprehensive ownership transfer system that ensures data integrity and prevents race conditions:

#### **Ownership States**:
1. **Shape Ownership**: Initial state when screw is instantiated (`owner = shapeId`, `ownerType = 'shape'`)
2. **Holding Hole Ownership**: Temporary storage (`owner = holeId`, `ownerType = 'holding_hole'`)
3. **Container Ownership**: Final destination (`owner = containerId`, `ownerType = 'container'`)

#### **Transfer Rules**:
- **Immediate Transfer**: Ownership changes when transfer operations begin
- **Atomic Operations**: Transfer and ownership change happen together
- **Single Owner**: Each screw has exactly one owner at any time
- **Deletion Authority**: Only current owner can delete/destroy screws

#### **Benefits**:
- **Race Condition Prevention**: Clear ownership prevents complex cleanup logic
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
- Incremental state changes during gameplay
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
- `progress:updated`, `bounds:changed` (canvas dimension updates), `physics:step:completed`

## Input Handling Architecture

### Single-Source Input Responsibility

The game implements a **single-source input handling pattern** to prevent event duplication and ensure reliable screw interactions:

#### **Design Principle**: One System, One Responsibility
- **GameManager**: Exclusively handles all canvas click/touch events
- **GameCanvas**: React component provides canvas element but does not handle input events
- **No Duplication**: Prevents duplicate event emission that can interfere with animations

#### **Input Processing Pipeline**
1. **Event Capture**: GameManager adds native `addEventListener` to canvas element
2. **Coordinate Conversion**: Converts canvas coordinates to game world coordinates
3. **Hit Detection**: Uses render state to find screws within interaction radius
4. **Event Emission**: Emits single `screw:clicked` event per interaction
5. **State Validation**: ScrewEventHandler validates screw exists in ScrewManager state

#### **Cross-Platform Support**
- **Mouse Input**: 15px interaction radius for precise desktop interaction
- **Touch Input**: 30px interaction radius for comfortable mobile interaction
- **Debug Features**: Shift+click for force removal in debug mode
- **Prevent Defaults**: Touch events prevent default behaviors (zoom, scroll)

#### **Historical Issue Resolution**

**Problem**: Originally both GameManager and GameCanvas handled the same click events, causing:
- Duplicate `screw:clicked` events for every interaction
- Interference with shake animations for blocked screws
- Inconsistent behavior and difficult debugging

**Solution Applied**: 
- Removed click/touch handlers from GameCanvas React component
- GameManager maintains exclusive responsibility for input processing
- Cleaned up duplicate event handling infrastructure
- Added comprehensive debug logging for troubleshooting

**Benefits**:
- ✅ Reliable shake animations for blocked screws
- ✅ Consistent collection animations for removable screws  
- ✅ Single event emission per interaction
- ✅ Predictable debugging and troubleshooting

## Performance Characteristics

### Optimization Strategies

#### **Event System**:
- Event history limited to 1000 entries for memory management
- Loop detection prevents infinite chains (threshold: 50 with contextual keys)
- Priority-based processing for critical events
- Throttled high-frequency events (removability updates)
- Performance monitoring and metrics included

#### **Physics Integration**:
- Layer-based collision groups reduce computation
- Constraint removal designed for immediate shape falling behavior
- Dormant body management for inactive shapes
- Spatial partitioning for collision detection
- Adjusted constraint stiffness for natural movement

#### **Memory Management**:
- Automatic cleanup of completed animations
- Physics body removal for off-screen shapes
- Event subscription cleanup on system destruction
- Bounded memory usage with automatic limits
- Container substitution integrated with animation cycle for timing precision

#### **Rendering Optimization**:
- **Canvas scaling** with proper aspect ratio maintenance and high-DPI support
- **Advanced shape rendering** with multi-layered pipeline:
  - Shape entities generate rounded Path2D objects with quadratic curve corners
  - GeometryRenderer provides sophisticated polygon rounding algorithms
  - Automatic corner radius defaults (4px-12px) for modern visual polish
  - Smart edge length detection prevents over-rounding on small shapes
- **Enhanced visual effects**:
  - Multi-layer shadow and glow rendering for depth perception
  - Smooth screw spinning animations with configurable, comfortable rotation speeds
  - Professional button styling with hover states and accessibility
  - Comprehensive easing library (24+ functions) for natural motion
  - Clean screw design with simple 4-point cross and subtle rim indicators
  - **Synchronized container-screw fade animations**: Screws inherit container alpha for cohesive visual transitions
- **Performance optimizations**:
  - Batched rendering operations with proper context management
  - Animation interpolation for 60fps smooth movement
  - Conditional debug rendering controlled by DEBUG_CONFIG flags
  - Memory-efficient Path2D caching and reuse

### Scalability Considerations

#### **Layer Scaling**: 10 + floor((level - 1) / 3) layers per level
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
- Comprehensive debug logging with conditional output (all debug flags disabled in production)
- Real-time event flow visualization
- Physics debugging with visual overlays
- Performance metrics and profiling
- State inspection utilities
- **Debug Configuration**: Centralized DEBUG_CONFIG with granular control over logging components

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
2. **Procedural Generation**: Algorithm-based level creation

### Architectural Readiness
The current architecture supports these enhancements through:
- Event-driven design enables easy feature addition
- Modular systems allow independent enhancement
- Shared utilities provide consistent foundation
- Comprehensive validation prevents system corruption
- Consolidated rendering components reduce maintenance overhead
