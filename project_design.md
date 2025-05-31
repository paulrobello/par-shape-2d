# PAR Shape 2D - Technical Design Document

## Table of Contents
1. [Project Overview](#project-overview)
2. [Event-Driven Architecture](#event-driven-architecture)
3. [Core Systems](#core-systems)
4. [Event System](#event-system)
5. [Game Mechanics](#game-mechanics)
6. [Rendering System](#rendering-system)
7. [Input System](#input-system)
8. [Save System](#save-system)
9. [Mobile Support](#mobile-support)
10. [File Structure & Mapping](#file-structure--mapping)
11. [Technical Decisions](#technical-decisions)
12. [Performance Considerations](#performance-considerations)
13. [Development Features](#development-features)
14. [Migration Summary](#migration-summary)

## Project Overview

PAR Shape 2D is a 2D physics-based puzzle game where players must strategically remove screws from shapes to clear layers. Built with Next.js, TypeScript, and Matter.js, the game features responsive design optimized for both desktop and mobile devices.

### Core Concept
- **Objective**: Clear all layers by removing screws from shapes
- **Mechanics**: Screws hold shapes in place; removing them allows shapes to fall via physics
- **Strategy**: Screws can only be removed if not blocked by shapes in front layers
- **Progression**: 10 layers per level, with automatic level advancement

### Key Features
- **Event-Driven Architecture** with 72 event types for loose coupling and maintainability
- Physics-based gameplay using Matter.js with constraint-based screw system
- Layer-based depth system with transparency and fade effects
- Smart touch selection prioritizing container color matches for mobile devices
- Color-coded screw collection system with 9 distinct screw colors
- Comprehensive local storage save/resume with Matter.js physics serialization
- Responsive design with portrait mode optimization and device-specific scaling
- Haptic feedback for mobile devices with vibration patterns
- Advanced event system with debugging, monitoring, and performance tracking capabilities

## Event-Driven Architecture

The application follows a **clean event-driven architecture** with complete decoupling between systems:

```
┌─────────────────┐
│   React Layer   │  ← UI Components, SystemCoordinator
├─────────────────┤
│  Game Manager   │  ← Input Handling & Rendering Coordination
├─────────────────┤
│   Event Bus     │  ← Centralized Event Communication
├─────────────────┤
│ Core Systems    │  ← Event-Driven: State, Physics, Layers, Screws
├─────────────────┤
│   Entities      │  ← Shapes, Screws, Layers
├─────────────────┤
│   Rendering     │  ← Canvas-based Drawing
├─────────────────┤
│   Utilities     │  ← Constants, Colors, Math
└─────────────────┘
```

### Design Patterns
- **Event-Driven Architecture**: Systems communicate via events, not direct calls
- **Publisher-Subscriber**: EventBus manages all inter-system communication
- **Entity-Component-System**: Game objects with modular components
- **Coordinator Pattern**: SystemCoordinator manages system lifecycle
- **Factory Pattern**: Procedural shape generation
- **Strategy Pattern**: Different rendering strategies per shape type

### Architecture Benefits
- **Loose Coupling**: Systems are independent and testable
- **Clean Code**: No complex parameter passing or circular dependencies
- **Maintainability**: Changes to one system don't affect others
- **Debugging**: Comprehensive event flow monitoring and validation
- **Scalability**: Easy to add new systems or modify existing ones

## Core Systems

All core systems extend the `BaseSystem` class and communicate exclusively through events:

### Physics System
**File**: `src/game/physics/PhysicsWorld.ts`

Event-driven physics system that manages Matter.js independently:

**Event-Driven Features**:
- **Event Communication**: Listens for bounds changes, game state events
- **Autonomous Operation**: Manages physics without external dependencies
- **Event Emission**: Publishes collision events, physics step completion
- **Body Management**: Handles add/remove events from other systems

**Core Functionality**:
- **Engine Configuration**: 60fps timestep, optimized iterations
- **Gravity**: Moderate downward force (0.8 units)
- **Boundaries**: Non-collidable walls (shapes fall through)
- **Sleep Management**: Automatic wake-up of unsupported shapes
- **Collision Detection**: Event-driven collision handling

**Key Features**:
- Constraint-based screw attachment
- Shape stability checking
- Physics body lifecycle management
- Support detection for sleeping shapes

### Game State Management
**File**: `src/game/core/GameState.ts`

Event-driven state management with full decoupling:

```typescript
interface GameState {
  currentLevel: number;
  levelScore: number;
  totalScore: number;
  gameStarted: boolean;
  gameOver: boolean;
  levelComplete: boolean;
}
```

**Event-Driven Features**:
- **Event Handlers**: Responds to screw collection, level changes, save/restore requests
- **State Events**: Emits score updates, level progression, game state changes
- **Container Management**: Handles container filling/replacement through events
- **Persistence Events**: Coordinates save/restore operations

**Responsibilities**:
- Score tracking and level progression
- Container and holding hole management
- Screw placement and reservation system
- Full game state serialization/deserialization
- Container removal and replacement logic

### Layer Management
**File**: `src/game/systems/LayerManager.ts`

Event-driven layer system with complete autonomy:

**Event-Driven Features**:
- **Event Handlers**: Responds to level start, bounds changes, shape events
- **Layer Events**: Emits layer creation, clearing, visibility changes
- **Shape Coordination**: Coordinates with ScrewManager through events
- **Bounds Events**: Handles responsive design through event system

**Core Functionality**:
- **Layer Generation**: Lazy loading of 4 visible layers
- **Depth Ordering**: Back-to-front rendering with `depthIndex`
- **Visibility Management**: Only visible layers are processed
- **Bounds Management**: Dynamic layer sizing for responsive design
- **Physics Separation**: Each layer uses separate collision groups

### Screw Management  
**File**: `src/game/systems/ScrewManager.ts`

Event-driven screw system managing all screw interactions:

**Event-Driven Features**:
- **Event Handlers**: Responds to shape creation, screw clicks, container updates
- **Screw Events**: Emits screw creation, removal, blocking state changes
- **Physics Events**: Coordinates constraint management through physics events
- **Animation Events**: Manages collection animations with event feedback

**Core Functionality**:
- **Constraint Management**: Creating/removing Matter.js constraints
- **Animation System**: Smooth screw collection animations
- **Blocking Detection**: Checking if screws are blocked by shapes
- **Smart Selection**: Prioritizing screws for container matching

## Event System

### EventBus
**File**: `src/game/events/EventBus.ts`

Centralized singleton event system managing all inter-system communication:

**Features**:
- **Type-Safe Events**: Comprehensive TypeScript event definitions (72+ event types)
- **Priority System**: Events can have different priorities (LOW, NORMAL, HIGH, CRITICAL)
- **Loop Detection**: Prevents infinite event chains with configurable limits
- **Performance Tracking**: Monitors event frequency, duration, and handler counts
- **Async Support**: Both synchronous and asynchronous event emission
- **Subscription Management**: Automatic cleanup and memory management
- **Event History**: Maintains 1000 recent events for debugging

### Event Types
**File**: `src/game/events/EventTypes.ts`

Comprehensive event definitions covering all system interactions (72 total event types):

**Categories**:
- **Game Lifecycle**: start, pause, resume, game over, level progression (7 types)
- **Screw System**: clicks, removal, collection, animations, blocking (10 types)
- **Shape System**: creation, destruction, physics updates (6 types)
- **Layer System**: creation, clearing, visibility changes (6 types)
- **Container System**: filling, replacement, color updates (9 types)
- **Physics Events**: body/constraint management, collisions (8 types)
- **Save/Restore**: state persistence operations (5 types)
- **Score Events**: point tracking and updates (3 types)
- **Debug Events**: mode toggles and performance testing (3 types)
- **System Communication**: 148 total emissions, 62 total subscriptions

### BaseSystem
**File**: `src/game/core/BaseSystem.ts`

Abstract base class providing event-aware functionality to all systems:

**Capabilities**:
- **Event Subscription**: Type-safe event handling with automatic cleanup
- **Event Emission**: Publishing events to other systems with priority support
- **Lifecycle Management**: Initialize, update, render, destroy with proper sequencing
- **State Management**: Active/inactive state handling with event notifications
- **Debug Support**: System information, monitoring, and performance tracking
- **Error Handling**: Robust error management for event operations

## Game Mechanics

### Core Gameplay Loop

1. **Player Interaction**: Click/tap on visible, unblocked screws
2. **Screw Removal**: Constraint removed, screw animates to destination
3. **Shape Physics**: Shapes fall when all screws removed
4. **Collection System**: Screws go to matching containers or holding holes
5. **Container Management**: Full containers (3 screws) are replaced after delay
6. **Level Progression**: Level complete when all layers cleared

### Scoring System

- **Container Placement**: 100 points per screw in matching container
- **Holding Hole**: 50 points per screw (emergency storage, less desirable)
- **Level Completion**: Level score added to total score
- **Progressive Difficulty**: More complex shapes and additional screws at higher levels

### Container System

Each level has 4 containers with specific colors:
- **Capacity**: 3 screws per container
- **Color Matching**: Screws must match container color
- **Replacement**: Full containers removed after 0.75 second delay
- **Dynamic Colors**: New containers use colors from active screws

### Holding Holes System

Emergency storage for non-matching screws:
- **Capacity**: 5 holding holes total
- **Game Over**: When all holes filled, 5-second countdown begins
- **Auto-Transfer**: Screws move to matching containers when available

### Layer Blocking System

Strategic depth-based gameplay:
- **Z-Order Blocking**: Screws blocked by shapes in front layers
- **Visual Feedback**: Blocked screws cannot be selected
- **Layer Transparency**: Back layers visible through front layers
- **Depth Index**: Numerical ordering for consistent rendering

## Rendering System

### Canvas-Based Rendering
**Files**: `src/game/rendering/ShapeRenderer.ts`, `src/game/rendering/ScrewRenderer.ts`

The game uses HTML5 Canvas with sophisticated rendering features:

### Responsive Scaling
- **Uniform Scaling**: Maintains aspect ratio across device sizes
- **Virtual Dimensions**: Game logic operates in virtual coordinates
- **Coordinate Transformation**: Client → Canvas → Virtual game coordinates
- **Optimal Sizing**: Scales to fit viewport while preserving design

### Layer Rendering
Depth-ordered rendering with transparency effects:

```typescript
// Render layers back-to-front
const sortedLayers = layerManager.getVisibleLayersSortedByDepth();
sortedLayers.forEach(layer => {
  ctx.globalAlpha = layer.getFadeOpacity();
  ShapeRenderer.renderShapes(layer.getAllShapes(), renderContext);
  ScrewRenderer.renderScrews(getScrewsForLayer(layer), renderContext);
});
```

### Shape Rendering
Procedural shape generation with visual consistency:

- **Supported Shapes**: Rectangle, Square, Circle, Triangle, Pentagon
- **Visual Style**: Solid borders with translucent fills
- **Screw Holes**: Automatically positioned based on shape geometry
- **Tint System**: Each layer has a unique color tint
- **Border Effects**: Consistent stroke width and styling

### Mobile Optimizations
- **Touch-Friendly**: Larger tap targets for mobile
- **Haptic Feedback**: Vibration on screw removal and container filling
- **Portrait Mode**: Optimized layout for mobile devices
- **Performance**: Efficient rendering for lower-powered devices

## Input System

### Multi-Input Support
**File**: `src/game/core/GameManager.ts` (input handling methods)

Unified handling for mouse and touch input:

### Mouse Input (Desktop)
- **Click Handling**: Precise screw selection
- **Hover Effects**: Visual feedback for interactive elements
- **Coordinate Precision**: 15px selection radius

### Touch Input (Mobile)
- **Touch Events**: `touchstart`, `touchend`, `touchmove`
- **Gesture Prevention**: Prevents scroll/zoom during gameplay
- **Large Touch Areas**: 30px selection radius for easier targeting
- **Haptic Feedback**: Tactile response for successful interactions

### Smart Screw Selection
Advanced selection algorithm for overlapping screws:

```typescript
// Priority order for multiple screws in touch area:
1. Screw matching available container color
2. Closest screw to touch point
3. First screw if multiple at same distance
```

### Coordinate Transformation
Three-stage coordinate system:
1. **Client Coordinates**: Browser mouse/touch positions
2. **Canvas Coordinates**: Scaled to canvas pixel dimensions  
3. **Virtual Game Coordinates**: Internal game world positions

## Save System

### Local Storage Persistence
**File**: `src/game/core/GameState.ts` (save/load methods)

Comprehensive state persistence with full game restoration:

### Save Data Structure
```typescript
interface FullGameSave {
  gameState: GameState;
  level: Level;
  containers: Container[];
  holdingHoles: HoldingHole[];
  layerManagerState: SerializableLayerManagerState;
  screwManagerState: { animatingScrews: SerializableScrew[] };
}
```

### Serialization Strategy
- **Matter.js Bodies**: Converted to serializable format with physics properties
- **Constraint Recreation**: Screws rebuild constraints on load
- **Animation State**: In-progress animations preserved
- **Position Accuracy**: Exact body positions and velocities saved

### Save Triggers
Automatic saving at key moments:
- New layer creation
- Layer clearing
- Container creation/removal
- Screw collection completion

### State Restoration
- **Automatic Resume**: Games resume automatically on page load
- **Physics Rebuilding**: Matter.js bodies recreated from serialized data
- **Bounds Updating**: Layer bounds recalculated for current screen size
- **Animation Continuity**: Ongoing animations restored

## Mobile Support

### Responsive Design
**File**: `src/components/game/GameCanvas.tsx`

Comprehensive mobile optimization:

### Device Adaptation
- **Device Detection**: react-device-detect library for accurate identification
- **Viewport Detection**: Automatic mobile/desktop detection with responsive canvas sizing
- **Orientation Handling**: Portrait mode enforcement with rotation notice overlay
- **Screen Utilization**: Full viewport canvas on mobile, proportional scaling on desktop
- **Safe Areas**: Respects device-specific screen boundaries and notches

### Touch Optimization
- **Large Touch Targets**: 30px radius for comfortable tapping
- **Smart Selection**: Priority system for overlapping elements
- **Gesture Prevention**: Disables zoom, scroll, and other default behaviors
- **Visual Feedback**: Clear indication of interactive elements

### Performance Optimization
- **Reduced Complexity**: Simplified effects on mobile
- **Efficient Rendering**: Optimized drawing operations
- **Memory Management**: Careful object lifecycle management
- **Battery Considerations**: Frame rate optimization for mobile devices

### Haptic Feedback
Native mobile feedback integration:
- **Screw Removal**: Light vibration (10ms)
- **Container Filling**: Medium vibration (20ms)
- **Game Over**: Heavy vibration (30ms)
- **Cross-Platform**: Works on both iOS and Android
- **Implementation**: Navigator.vibrate API with fallback detection

## File Structure & Mapping

### React/UI Layer
```
src/app/
├── page.tsx                 # Main app page with rotation notice and game container
├── layout.tsx              # App layout configuration
└── globals.css             # Global styles and responsive design rules

src/components/game/
└── GameCanvas.tsx          # Main game component with canvas, controls, debug info
```

### Game Core
```
src/game/core/
├── BaseSystem.ts          # Abstract base class for all systems
│   ├── Event subscription and emission
│   ├── Lifecycle management (init/update/render/destroy)
│   ├── State management and debugging support
│   └── Error handling for event operations
│
├── GameManager.ts         # Simplified orchestrator (12 emissions, 18 subscriptions)
│   ├── Canvas management and responsive scaling
│   ├── Input handling (mouse/touch) with coordinate transformation
│   ├── Render loop coordination and debug mode
│   └── Event-driven game loop management
│
├── GameState.ts          # Event-driven state management (53 emissions, 10 subscriptions)
│   ├── Score and level tracking with persistence
│   ├── Container/holding hole management with replacement logic
│   ├── Comprehensive save/load with Matter.js serialization
│   └── Screw placement and reservation system
│
├── GameLoop.ts          # Game loop timing and coordination
│   ├── 60fps target timing with performance monitoring
│   ├── Update/render coordination through events
│   └── Frame rate tracking and optimization
│
├── SystemCoordinator.ts # System lifecycle management
│   ├── Initialization sequencing of all systems
│   ├── Event-driven system coordination
│   ├── Cleanup and resource management
│   └── Debug mode integration
│
└── EventFlowValidator.ts # Event system monitoring and validation
    ├── Tracks 15 key events with priority monitoring
    ├── Event flow validation and loop detection
    ├── Performance analysis and debugging
    └── System health monitoring
```

### Physics System
```
src/game/physics/
└── PhysicsWorld.ts       # Matter.js world wrapper
    ├── Engine configuration and boundaries
    ├── Body/constraint lifecycle management
    ├── Collision detection and response
    └── Sleep/wake management for stability
```

### Entity Layer
```
src/game/entities/
├── Layer.ts              # Layer container with shapes and bounds
│   ├── Shape collection management
│   ├── Visibility and fade effects
│   ├── Bounds calculation and updates
│   └── Serialization for save/load
│
├── Shape.ts              # Individual game shapes with physics
│   ├── Matter.js body integration
│   ├── Screw attachment points
│   ├── Visual properties (color, tint)
│   └── Collision detection methods
│
└── Screw.ts             # Removable constraints between shapes
    ├── Matter.js constraint management
    ├── Animation state tracking
    ├── Blocking detection
    └── Target container assignment
```

### System Layer
```
src/game/systems/
├── LayerManager.ts       # Layer lifecycle and visibility management
│   ├── Layer generation and disposal
│   ├── Depth ordering and rendering order
│   ├── Visibility culling optimization
│   └── Level progression logic
│
├── ScrewManager.ts      # Screw interactions and animations
│   ├── Constraint creation/removal
│   ├── Collection animation system
│   ├── Blocking detection algorithms
│   └── Smart selection logic
│
└── ShapeFactory.ts      # Procedural shape generation
    ├── Shape type selection and sizing
    ├── Screw hole placement algorithms
    ├── Physics body creation
    └── Visual property assignment
```

### Rendering Layer
```
src/game/rendering/
├── ShapeRenderer.ts     # Shape drawing with holes
│   ├── Procedural shape drawing
│   ├── Screw hole visualization
│   ├── Tint and transparency effects
│   └── Debug outline rendering
│
└── ScrewRenderer.ts    # Screw visualization and UI elements
    ├── Screw drawing with cross pattern
    ├── Animation state rendering
    ├── Container/holding hole display
    └── Preview/collected state rendering
```

### Utility Layer
```
src/game/utils/
├── Constants.ts         # Game configuration and constants
│   ├── Game dimensions, colors, and limits
│   ├── Physics parameters and collision groups
│   ├── Layout settings for mobile/desktop
│   └── Animation timing and container settings
│
├── Colors.ts           # Color management utilities
│   ├── Random color selection with 9 screw colors
│   ├── Color manipulation (lighten/darken/alpha)
│   ├── RGBA conversion and hex utilities
│   └── Container color matching algorithms
│
├── MathUtils.ts       # Mathematical utility functions
│   ├── Vector operations and geometric calculations
│   ├── Collision detection and intersection helpers
│   ├── Animation easing functions
│   └── Coordinate transformation utilities
│
└── DeviceDetection.ts # Device and platform detection
    ├── Mobile/desktop identification using react-device-detect
    ├── Touch capability detection
    ├── Viewport size calculations
    └── Responsive design utilities
```

### Event System
```
src/game/events/
├── EventBus.ts          # Centralized singleton event system
│   ├── Priority handling (LOW, NORMAL, HIGH, CRITICAL)
│   ├── Loop detection and prevention
│   ├── Performance tracking and monitoring
│   ├── Event history (1000 recent events)
│   └── Async/sync event emission support
│
├── EventTypes.ts        # Comprehensive event type definitions (72 types)
│   ├── Game lifecycle events (7 types)
│   ├── Screw system events (10 types)
│   ├── Shape and layer events (12 types)
│   ├── Container and physics events (17 types)
│   └── Debug and system events (26 types)
│
├── EventLogger.ts       # Event logging and debugging
│   ├── Detailed event logging with timestamps
│   ├── Event filtering and categorization
│   ├── Performance metrics collection
│   └── Debug output formatting
│
├── EventDebugger.ts     # Advanced debugging tools
│   ├── Event flow analysis and visualization
│   ├── System communication mapping
│   ├── Performance bottleneck identification
│   └── Event chain validation
│
└── index.ts            # Event system exports and utilities
    ├── Event type exports
    ├── Utility functions
    ├── Debug helpers
    └── Type guards
```

### Type Definitions
```
src/types/
└── game.ts            # TypeScript interfaces and type definitions
    ├── Core game interfaces (GameState, Shape, Screw)
    ├── Physics integration types
    ├── Serialization interfaces
    └── Event callback types
```

## Technical Decisions

### Framework Choices

**Next.js**: Chosen for its excellent TypeScript support, optimized builds, and deployment convenience. The app directory structure provides clean organization.

**Matter.js**: Selected for its mature physics engine with constraint support, excellent performance, and comprehensive feature set for 2D physics.

**HTML5 Canvas**: Preferred over WebGL for simpler implementation, better compatibility, and sufficient performance for the game's requirements.

**TypeScript**: Ensures type safety, better development experience, and maintainable code with comprehensive interfaces.

### Architecture Decisions

**Entity-Component-System**: Provides flexibility for game objects while maintaining clear separation of data and behavior.

**Layer-Based Rendering**: Enables sophisticated depth effects and transparency without complex 3D mathematics.

**Uniform Scaling**: Maintains visual consistency across devices while maximizing screen utilization.

**Local Storage**: Provides instant save/resume functionality without requiring server infrastructure.

### Performance Optimizations

**Lazy Layer Generation**: Only creates visible layers to reduce memory usage and improve performance.

**Efficient Coordinate Transformation**: Caches scaling calculations and uses optimized transformation pipeline.

**Object Pooling**: Reuses physics bodies and game objects to reduce garbage collection overhead.

**Selective Rendering**: Only renders visible elements and skips off-screen objects.

## Performance Considerations

### Memory Management
- **Object Pooling**: Reuse of physics bodies and constraints
- **Lazy Loading**: On-demand layer generation
- **Garbage Collection**: Careful cleanup of Matter.js objects
- **Texture Management**: Efficient canvas operations

### Rendering Optimization
- **Layer Culling**: Only render visible layers
- **Batched Operations**: Group similar drawing operations
- **Coordinate Caching**: Cache transformation calculations
- **Alpha Optimization**: Skip transparent elements when possible

### Mobile Considerations
- **Touch Area Optimization**: Larger targets reduce processing
- **Animation Simplification**: Reduced effects on lower-powered devices
- **Frame Rate Adaptation**: Dynamic quality adjustment
- **Battery Optimization**: Efficient update loops

### Physics Optimization
- **Sleep Management**: Allow unused bodies to sleep
- **Collision Groups**: Separate layer physics for efficiency
- **Constraint Batching**: Efficient constraint creation/removal
- **Update Frequency**: Optimized physics timestep

## Development Features

### Debug System
Comprehensive debugging tools accessible via keyboard shortcuts:

**Debug Mode (D key)**:
- Visual physics body outlines
- Layer information display
- Performance metrics
- Object count monitoring

**Development Controls**:
- **R**: Restart current level
- **G**: Trigger game over (testing)
- **S**: Force save game state
- **I**: Inspect save data structure
- **C**: Clear all save data

### Save Data Inspection
Detailed save data analysis for debugging:
- Complete game state structure
- Layer and shape counts
- Physics body information
- Animation state details

### Debug Information Panel
Real-time game statistics:
- Layer generation progress
- Active object counts
- Physics body tracking
- Game over timer display
- Layer detail breakdown with visual indicators

### Performance Monitoring
- Frame rate tracking
- Memory usage estimation
- Physics update timing
- Rendering performance metrics

## Migration Summary

The PAR Shape 2D codebase underwent a comprehensive 6-phase migration from a tightly-coupled monolithic architecture to a clean event-driven system:

### Migration Phases
1. **Planning**: Analyzed existing codebase and designed event-driven architecture
2. **Foundation**: Created EventBus, BaseSystem, and event type definitions
3. **Core Implementation**: Built event-driven versions of all major systems
4. **System Creation**: Completed GameManager, GameState, LayerManager, ScrewManager, PhysicsWorld
5. **Testing & Validation**: Created SystemCoordinator and EventFlowValidator for comprehensive testing
6. **Cleanup & Documentation**: Replaced original systems, updated documentation

### Benefits Achieved
- **Eliminated Complexity**: Reduced 2040-line monolithic GameManager
- **Improved Maintainability**: Systems can be modified independently
- **Enhanced Testability**: Individual systems can be tested in isolation
- **Better Debugging**: Comprehensive event flow monitoring and validation
- **Cleaner Code**: No complex parameter passing or circular dependencies
- **Fixed Bugs**: Resolved save/restore issues through cleaner state management

### Current State
- ✅ All systems use event-driven architecture
- ✅ Comprehensive event system with debugging
- ✅ SystemCoordinator manages all system lifecycle
- ✅ Build passes with no TypeScript errors
- ✅ Ready for production use

---

*This design document reflects the current event-driven implementation. The architecture provides a robust, maintainable foundation for future enhancements while ensuring loose coupling and optimal performance across platforms.*