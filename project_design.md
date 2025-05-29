# PAR Shape 2D - Technical Design Document

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture Overview](#architecture-overview)
3. [Core Systems](#core-systems)
4. [Game Mechanics](#game-mechanics)
5. [Rendering System](#rendering-system)
6. [Input System](#input-system)
7. [Save System](#save-system)
8. [Mobile Support](#mobile-support)
9. [File Structure & Mapping](#file-structure--mapping)
10. [Technical Decisions](#technical-decisions)
11. [Performance Considerations](#performance-considerations)
12. [Development Features](#development-features)

## Project Overview

PAR Shape 2D is a 2D physics-based puzzle game where players must strategically remove screws from shapes to clear layers. Built with Next.js, TypeScript, and Matter.js, the game features responsive design optimized for both desktop and mobile devices.

### Core Concept
- **Objective**: Clear all layers by removing screws from shapes
- **Mechanics**: Screws hold shapes in place; removing them allows shapes to fall via physics
- **Strategy**: Screws can only be removed if not blocked by shapes in front layers
- **Progression**: 10 layers per level, with automatic level advancement

### Key Features
- Physics-based gameplay using Matter.js
- Layer-based depth system with transparency
- Smart touch selection for mobile devices
- Color-coded screw collection system
- Local storage save/resume functionality
- Responsive design with portrait mode optimization
- Haptic feedback for mobile devices

## Architecture Overview

The application follows a modular architecture with clear separation of concerns:

```
┌─────────────────┐
│   React Layer   │  ← UI Components, Event Handling
├─────────────────┤
│  Game Manager   │  ← Central Orchestrator
├─────────────────┤
│ Core Systems    │  ← State, Physics, Layers, Screws
├─────────────────┤
│   Entities      │  ← Shapes, Screws, Layers
├─────────────────┤
│   Rendering     │  ← Canvas-based Drawing
├─────────────────┤
│   Utilities     │  ← Constants, Colors, Math
└─────────────────┘
```

### Design Patterns
- **Entity-Component-System**: Game objects with modular components
- **Manager Pattern**: Centralized system coordination
- **Factory Pattern**: Procedural shape generation
- **Observer Pattern**: Event-driven callbacks
- **Strategy Pattern**: Different rendering strategies per shape type

## Core Systems

### Physics System
**File**: `src/game/physics/PhysicsWorld.ts`

The physics system wraps Matter.js with game-specific functionality:

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

Centralized state management with persistence:

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

**Responsibilities**:
- Score tracking and level progression
- Container and holding hole management
- Screw placement and reservation system
- Full game state serialization/deserialization
- Container removal and replacement logic

### Layer Management
**File**: `src/game/systems/LayerManager.ts`

Manages the layer system with depth-based rendering:

- **Layer Generation**: Lazy loading of 4 visible layers
- **Depth Ordering**: Back-to-front rendering with `depthIndex`
- **Visibility Management**: Only visible layers are processed
- **Bounds Management**: Dynamic layer sizing for responsive design
- **Physics Separation**: Each layer uses separate collision groups

### Screw Management  
**File**: `src/game/systems/ScrewManager.ts`

Handles screw interactions and animations:

- **Constraint Management**: Creating/removing Matter.js constraints
- **Animation System**: Smooth screw collection animations
- **Blocking Detection**: Checking if screws are blocked by shapes
- **Smart Selection**: Prioritizing screws for container matching

## Game Mechanics

### Core Gameplay Loop

1. **Player Interaction**: Click/tap on visible, unblocked screws
2. **Screw Removal**: Constraint removed, screw animates to destination
3. **Shape Physics**: Shapes fall when all screws removed
4. **Collection System**: Screws go to matching containers or holding holes
5. **Container Management**: Full containers (3 screws) are replaced after delay
6. **Level Progression**: Level complete when all layers cleared

### Scoring System

- **Container Placement**: 10 points per screw
- **Holding Hole**: 5 points per screw (less desirable)
- **Level Completion**: Level score added to total score
- **Progressive Difficulty**: More complex shapes at higher levels

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
- **Viewport Detection**: Automatic mobile/desktop detection
- **Orientation Handling**: Portrait mode enforcement with rotation notice
- **Screen Utilization**: Full-screen canvas on mobile devices
- **Safe Areas**: Respects device-specific screen boundaries

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
├── GameManager.ts          # Central orchestrator
│   ├── Canvas management and scaling
│   ├── Input handling (mouse/touch)
│   ├── Render loop coordination  
│   ├── Game state transitions
│   └── Event callback management
│
├── GameState.ts           # State management and persistence
│   ├── Score and level tracking
│   ├── Container/holding hole management
│   ├── Save/load functionality
│   └── Screw placement logic
│
└── GameLoop.ts           # Game loop timing and update/render cycles
    ├── 60fps target timing
    ├── Update/render coordination
    └── Performance monitoring
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
│   ├── Game dimensions and limits
│   ├── Physics parameters
│   ├── Color definitions
│   └── Animation settings
│
├── Colors.ts           # Color management utilities
│   ├── Random color selection
│   ├── Color manipulation (lighten/darken)
│   ├── RGBA conversion utilities
│   └── Container color matching
│
└── MathUtils.ts       # Mathematical utility functions
    ├── Vector operations
    ├── Collision detection helpers
    ├── Geometric calculations
    └── Animation easing functions
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

---

*This design document reflects the current implementation as of the codebase analysis. The architecture provides a solid foundation for future enhancements while maintaining clean separation of concerns and optimized performance across platforms.*