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
- **Progression**: Progressive layer count (10+ layers) per level, with automatic level advancement

### Key Features
- **Event-Driven Architecture** with 72 event types for loose coupling and maintainability
- Physics-based gameplay using Matter.js with constraint-based screw system
- Layer-based depth system with transparency and fade-in effects (1 second duration)
- Smart touch selection prioritizing container color matches for mobile devices
- Color-coded screw collection system with 9 distinct screw colors
- Comprehensive local storage save/resume with Matter.js physics serialization
- Responsive design with portrait mode optimization and device-specific scaling
- Haptic feedback for mobile devices with vibration patterns
- Advanced animation system with collection, transfer, and shake animations
- Blocked screw feedback with shake animation and haptic response
- Advanced event system with debugging, monitoring, and performance tracking capabilities
- Intelligent auto-transfer system from holding holes to matching containers
- Visual warning system with pulsing red border when game over is imminent
- Progressive difficulty with increasing layer counts every 3 levels

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
- **Factory Pattern**: JSON-driven shape generation with ShapeRegistry and ShapeLoader
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

**Enhanced Physics Properties**:
- **Reduced Air Friction**: 10x reduction (0.0005) for maximum natural swinging motion
- **Lower Constraint Damping**: Reduced from 0.1 to 0.02 for realistic physics behavior
- **Gravity-Only Forces**: Manual forces removed when screws are removed - only gravity applies
- **Shape Border Rendering**: Fixed rendering order to prevent border thickness changes
- **Responsive Bounds**: All systems update virtual dimensions when canvas resizes

**Key Features**:
- Constraint-based screw attachment
- Shape stability checking
- Physics body lifecycle management
- Support detection for sleeping shapes
- **Composite Body Support**: Capsules use Matter.js composite bodies (rectangle + 2 circles)
- **Multi-Part Physics**: Each capsule part has independent physics properties
- **Enhanced Single-Screw Physics**: Shapes with one screw have optimized pendulum motion with initial perturbation

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
- **Fade-in Animation**: New layers fade in over 1 second with ease-in-out curve

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
- **Rotation-Aware Blocking Detection**: Shape collision detection with proper coordinate transformation
- **Smart Selection**: Prioritizing screws for container matching

**Blocking Detection Features**:
- **Coordinate Transformation**: Converts screw positions to shape-local coordinates using rotation matrix
- **Shape-Specific Algorithms**: Rectangle, Circle, Polygon, and Capsule each use optimized intersection methods
- **Polygon Support**: Point-in-polygon and line-segment intersection for precise n-sided polygon collision
- **Capsule Rotation**: Fixed missing rotation handling for composite capsule shapes

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

- **Screw Removal**: 10 points per screw removed from shapes (regardless of destination)
- **Level Completion**: Level score added to total score
- **Score Display**: HUD shows "Level Score" for current level and "Grand Total" for cumulative score
- **Progressive Difficulty**: Layer count increases every 3 levels (levels 1-3: 10 layers, 4-6: 11 layers, 7-9: 12 layers, etc.)

### Container System

Each level has 4 containers with specific colors:
- **Capacity**: 3 screws per container (uses UI_CONSTANTS.containers.hole.count)
- **Color Matching**: Screws must match container color
- **Fade Animations**: Smooth 0.5-second fade-out when full, followed by 0.5-second fade-in for replacements
- **Dynamic Colors**: New containers use colors from active screws prioritizing those in holding holes
- **Visual Polish**: Containers use `globalAlpha` for opacity during animations
- **Responsive Positioning**: Container and hole positions calculated using current virtual dimensions
- **Consistent Calculations**: All systems use identical hole spacing formula: `containerWidth / (holeCount + 1)`

### Holding Holes System

Emergency storage for non-matching screws:
- **Capacity**: 5 holding holes total
- **Visual Design**: Light grey circular backgrounds for better visibility
- **Game Over**: When all holes filled, 5-second countdown begins with pulsing red border warning
- **Auto-Transfer**: Intelligent automatic transfer system:
  - Immediate transfer when screw arrives if matching container available
  - Batch transfer when new containers appear/are replaced
  - Reservation system prevents multiple screws targeting same hole
- **Visual Warning**: Pulsing red border (1 pulse/second) around canvas when all holes full

### Layer Blocking System

Strategic depth-based gameplay:
- **Z-Order Blocking**: Screws blocked by shapes in front layers
- **Visual Feedback**: Blocked screws show shake animation when clicked to indicate they cannot be removed
- **Haptic Feedback**: Mobile devices vibrate briefly (50ms) when blocked screws are clicked
- **Layer Transparency**: Back layers visible through front layers
- **Depth Index**: Numerical ordering for consistent rendering
- **Rotation-Aware Blocking**: All shapes use proper coordinate transformation for accurate collision detection
- **Composite Shape Support**: Capsules (rectangle + 2 circles) have specialized blocking detection
- **Precise Collision**: Each shape type uses geometry-specific intersection algorithms with rotation handling

## Rendering System

### Canvas-Based Rendering
**Files**: `src/game/rendering/ShapeRenderer.ts`, `src/game/rendering/ScrewRenderer.ts`

The game uses HTML5 Canvas with sophisticated rendering features:

### Screw Rendering System
**File**: `src/game/rendering/ScrewRenderer.ts`

- **Dynamic Scaling**: Screws support scale parameter for size variations
- **Container/Holding Hole Screws**: Render at 0.75 scale (25% smaller) for visual hierarchy
- **Visual Components**: Scaled body, border, highlight, and cross symbol
- **Uniform Hole Sizes**: Holding holes match container hole dimensions (radius: 8px)

### Responsive Scaling
- **Dynamic Canvas Dimensions**: Canvas adapts to viewport size on both mobile and desktop
- **Virtual Dimensions**: Now match canvas dimensions (1:1 mapping) instead of fixed 640x800
- **Coordinate Transformation**: Client → Canvas (no additional scaling needed)
- **Optimal Sizing**: Mobile uses full viewport, desktop scales proportionally
- **Bounds Events**: All systems receive bounds:changed events to update calculations

### Layer Rendering
Depth-ordered rendering with transparency and fade-in effects:

```typescript
// Render layers back-to-front with fade-in animation
for (let i = this.state.visibleLayers.length - 1; i >= 0; i--) {
  const layer = this.state.visibleLayers[i];
  
  // Apply layer fade-in opacity
  this.state.ctx.save();
  this.state.ctx.globalAlpha = layer.getFadeOpacity();
  
  // Render shapes and screws with layer opacity
  ShapeRenderer.renderShapes(layer.getAllShapes(), renderContext);
  ScrewRenderer.renderScrews(getScrewsForLayer(layer), renderContext);
  
  this.state.ctx.restore();
}
```

**Layer Fade-in Animation**:
- **Duration**: 1 second (1000ms)
- **Easing**: Ease-in-out curve for smooth appearance
- **Implementation**: Applied via `ctx.globalAlpha` during rendering
- **Trigger**: Activates when new layers are generated
- **Visual Effect**: Gradual opacity transition from 0 to 1
- **Purpose**: Provides smooth visual feedback for layer progression

### Shape Rendering
JSON-driven shape rendering with visual consistency:

- **JSON-Based Definitions**: All shapes defined in JSON files with complete configuration
- **Supported Shapes**: Circle, Polygon (3-8 sides, including 4 for square/rectangle), Capsule, Arrow, Chevron, Star, Horseshoe
- **Visual Style**: Solid borders with translucent fills configured per shape
- **Screw Holes**: Automatically positioned based on JSON-defined placement strategies
- **Tint System**: Each layer has a unique color tint
- **Border Effects**: Consistent stroke width and styling from JSON visual properties
- **Path-Based Shapes**: Arrow, chevron, star, and horseshoe use vertex paths with poly-decomp for physics
- **Individual Control**: Each shape can be enabled/disabled via JSON `enabled` field

### Shape Sizes
JSON-configured dimensions with 87.5% scaling for improved visibility:

- **Circle**: Radius 45-90px (from circle.json)
- **Regular Polygons**: Radius 56-101px for triangle, pentagon, hexagon, heptagon, octagon (from polygon JSON files)
- **Square Polygon**: Radius 63-112px for regular 4-sided polygon (from polygons/square.json)
- **Rectangle Polygon**: Width 75-150px, height 30-120px, aspect ratio 0.4-2.5 (from polygons/rectangle.json)
- **Capsule**: Width 77-227px, height 34px (from capsule.json)
- **Path Shapes**: Scale 0.8-1.5 applied to vertex paths defined in arrow.json, chevron.json, star.json, horseshoe.json
- **Size Reduction**: All shapes support 15% reduction factor during placement retries (reductionFactor: 0.15)

### Shape Placement
Advanced deterministic placement system eliminating all overlaps:

#### 3-Phase Placement Algorithm (ShapeFactory.ts)
- **Phase 1**: Spiral pattern around preferred position using golden angle (137.5°)
- **Phase 2**: Grid-based systematic coverage with distance-sorted positions
- **Phase 3**: Corner and center positions as final deterministic attempts
- **No Random Fallback**: Completely deterministic placement system

#### Retry System with Size Reduction
- **5 Retry Attempts**: Each retry uses progressively smaller shapes
- **Size Reduction**: 15% smaller per retry attempt
- **Shape Type Variation**: Different shape types attempted per retry
- **Minimal Fallback**: 20px radius circle only if all attempts fail

#### Enhanced Collision Detection
- **Minimum Separation**: 30px between shape centers
- **Actual Dimensions**: Uses real shape dimensions instead of approximations
- **Stricter Requirements**: `Math.max(minSeparation, testRadius + otherRadius + 10)`
- **Grid Optimization**: Grid size = `Math.max(testRadius * 2 + minSeparation, 80)`

### Screw Placement
JSON-driven placement strategies with advanced positioning algorithms:

#### Placement Strategies (Defined in Shape JSON)

**1. Corners Strategy** (`"strategy": "corners"`):
- **Used by**: Circle, Polygons (including square and rectangle)
- **Algorithm**: Places screws at shape corners or cardinal points
- **Configuration**: 
  - `cornerMargin`: Distance from edges (typically 30px)
  - Edge-center fallbacks for narrow/short shapes
- **Examples**: Polygon corners/vertices, Circle cardinal directions (N,E,S,W)

**2. Perimeter Strategy** (`"strategy": "perimeter"`):
- **Used by**: Path shapes (Arrow, Chevron, Star, Horseshoe)
- **Algorithm**: Distributes screws along shape perimeter
- **Configuration**:
  - `perimeterPoints`: Number of potential positions (typically 8)
  - `perimeterMargin`: Distance from perimeter edge (typically 30px)
- **Adaptive**: Adjusts to complex shape boundaries

**3. Capsule Strategy** (`"strategy": "capsule"`):
- **Used by**: Capsule composite shapes
- **Algorithm**: Horizontal distribution along center line
- **Configuration**:
  - `capsuleEndMargin`: Distance from ends (typically 5px)
  - Even spacing based on screw count
- **Multi-part aware**: Accounts for composite body structure

**4. Grid Strategy** (`"strategy": "grid"`):
- **Usage**: Available for custom implementations
- **Algorithm**: Regular grid-based positioning
- **Configuration**: `gridSpacing` for grid cell size

**5. Custom Strategy** (`"strategy": "custom"`):
- **Usage**: Predefined custom positions
- **Algorithm**: Uses exact coordinates from JSON
- **Configuration**: 
  - `customPositions`: Array of {position, priority} objects
  - Allows precise designer control

#### Core Algorithm (ScrewManager.ts)
- **JSON-Driven**: Strategy selected from shape definition
- **Position Generation**: Strategy-specific placement locations
- **Overlap Prevention**: Ensures minimum separation distance between screws
- **Area-Based Constraints**: Dynamic limits based on shape size
- **Fallback Strategy**: Graceful degradation for constrained spaces

#### Universal Constants
- **Minimum Separation**: 48 pixels between screws (4x screw radius = 48px)
- **Safety Margin**: 30 pixels from shape edges (2.5x screw radius)
- **Single Screw**: Always centered on shape for optimal pendulum motion with enhanced physics

#### Area-Based Screw Limits
- **Very Small** (< 2500 area): 1 screw maximum
- **Small** (2500-4000): 2 screws maximum  
- **Medium** (4000-6000): 3 screws maximum
- **Large** (6000-10000): 4 screws maximum
- **Very Large** (10000-15000): 5 screws maximum
- **Huge** (15000+): 6 screws maximum

#### Position Selection Algorithm
1. Generate all possible positions (corners + alternates + center)
2. Apply overlap detection with minimum separation distance
3. Select non-overlapping positions up to area-based limit
4. Fallback to center position if overlap issues occur

### Shape Configuration & JSON Structure
**Files**: Individual JSON files in `src/data/shapes/`

Complete JSON-based shape definition system with the following structure:

```json
{
  "id": "rectangle",
  "name": "Rectangle",
  "category": "basic",
  "enabled": true,
  "dimensions": {
    "type": "random",
    "width": { "min": 75, "max": 150 },
    "height": { "min": 30, "max": 120 },
    "aspectRatio": { "min": 0.4, "max": 2.5 },
    "reductionFactor": 0.15
  },
  "physics": {
    "type": "rectangle"
  },
  "rendering": {
    "type": "primitive"
  },
  "screwPlacement": {
    "strategy": "corners",
    "cornerMargin": 30,
    "minSeparation": 48,
    "maxScrews": {
      "byArea": [
        { "maxArea": 2500, "screwCount": 1 },
        { "maxArea": 4000, "screwCount": 2 }
      ],
      "absolute": 6
    }
  },
  "visual": {
    "supportsHoles": true
  },
  "behavior": {
    "allowSingleScrew": true,
    "singleScrewDynamic": true,
    "rotationalInertiaMultiplier": 3
  }
}
```

#### JSON Field Definitions

**Core Properties**:
- **`id`**: Unique identifier for the shape type
- **`name`**: Display name for the shape
- **`category`**: Shape category: "basic", "polygon", "path", or "composite"
- **`enabled`**: Boolean flag to enable/disable shape in game

**Dimensions Configuration**:
- **`type`**: "fixed" or "random" - determines size generation method
- **`width`/`height`**: Fixed number or {min, max} range for basic shapes
- **`radius`**: Fixed number or {min, max} range for circles and polygons
- **`sides`**: Number of sides for polygon shapes
- **`path`**: Vertex coordinates string for path-based shapes
- **`scale`**: {min, max} scaling range for path shapes
- **`aspectRatio`**: {min, max} width/height ratio constraints
- **`reductionFactor`**: Percentage reduction per retry attempt (default: 0.15)

**Physics Configuration**:
- **`type`**: Physics body type: "rectangle", "circle", "polygon", "fromVertices", "composite"
- **`decomposition`**: Boolean for path decomposition (path shapes only)
- **`composite`**: Multi-part physics definition for capsules

**Rendering Configuration**:
- **`type`**: Rendering method: "primitive", "path", "composite"
- **`preserveOriginalVertices`**: Keep original vertices for visual rendering
- **`compositeParts`**: Multi-part rendering definition

**Screw Placement Configuration**:
- **`strategy`**: Placement algorithm: "corners", "perimeter", "grid", "custom", "capsule"
- **`cornerMargin`**: Distance from shape edges for corner placement
- **`perimeterPoints`**: Number of points for perimeter strategy
- **`minSeparation`**: Minimum distance between screws (48px default)
- **`maxScrews`**: Area-based and absolute screw limits
- **`capsuleEndMargin`**: End spacing for capsule shapes

**Visual Properties**:
- **`supportsHoles`**: Boolean for screw hole rendering support
- **`borderWidth`**: Stroke width (optional, defaults applied)
- **`alpha`**: Transparency level (optional, defaults applied)

**Behavior Properties**:
- **`allowSingleScrew`**: Permit shapes with only one screw
- **`singleScrewDynamic`**: Enable pendulum physics for single-screw shapes
- **`rotationalInertiaMultiplier`**: Physics enhancement factor (default: 3)

#### Shape Categories & Examples

**Basic Shapes** (`src/data/shapes/basic/`):
- Circle - Simple geometric primitive

**Polygon Shapes** (`src/data/shapes/polygons/`):
- Triangle, Square, Rectangle, Pentagon, Hexagon, Heptagon, Octagon - Geometric polygons (3-8 sides)

**Path Shapes** (`src/data/shapes/paths/`):
- Arrow, Chevron, Star, Horseshoe - Complex vertex-defined shapes

**Composite Shapes** (`src/data/shapes/composite/`):
- Capsule - Multi-part physics bodies (rectangle + 2 circles)

#### System Features
- **Decentralized Control**: Each shape JSON file contains its own `enabled` boolean field
- **Individual Configuration**: Shapes can be enabled/disabled in their own definition files
- **Runtime Control**: ShapeRegistry filters shapes based on their `enabled` field during loading
- **Fallback**: If all shapes disabled, defaults to circle shape
- **Hot Reloading**: JSON changes can be applied without code modification

### Physics Behavior by Screw Count

#### Single-Screw Dynamics
- **Dynamic Bodies**: Shapes with one screw remain non-static for natural pendulum motion
- **Enhanced Inertia**: Rotational inertia increased to `mass × 3` for better swinging
- **Initial Perturbation**: Small random angular velocity and force applied to activate physics
- **Wake-up Control**: Explicit sleeping prevention to ensure continuous motion
- **Pendulum Motion**: Natural swinging behavior around the single attachment point

#### Multi-Screw Statics
- **Static Bodies**: Shapes with multiple screws become static for stability
- **Constraint Network**: Multiple attachment points prevent rotation and translation
- **Structural Integrity**: Multiple screws create rigid connections for puzzle mechanics

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

## Animation System

### Animation Types
The game features three distinct animation systems for screw interactions:

#### Collection Animation
- **Duration**: 800ms with easeInOutCubic easing
- **Purpose**: Smooth transition from screw to destination (container/holding hole)
- **Visual**: Gradual fade and position interpolation
- **State**: `isBeingCollected` flag with progress tracking (0-1)

#### Transfer Animation
- **Duration**: 600ms with easeInOutCubic easing  
- **Purpose**: Move screws from holding holes to matching containers
- **Visual**: Direct path animation with slight fade
- **State**: `isBeingTransferred` flag with progress tracking (0-1)

#### Shake Animation (Blocked Feedback)
- **Duration**: 300ms with sine wave oscillation
- **Purpose**: Visual feedback when blocked screws are clicked
- **Visual**: Alternating horizontal/vertical shake with fade-out
- **Intensity**: 3px maximum amplitude, 8 oscillations
- **Haptic**: 50ms vibration on mobile devices
- **State**: `isShaking` flag with progress tracking (0-1)

### Animation Implementation
**Files**: `src/game/entities/Screw.ts`, `src/game/systems/ScrewManager.ts`, `src/game/rendering/ScrewRenderer.ts`

- **Entity-Level**: Animation state and progress managed in Screw entities
- **System-Level**: ScrewManager updates all animations each frame
- **Rendering-Level**: ScrewRenderer applies visual transformations

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
│   ├── Visibility and fade-in effects (1 second duration)
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
    ├── Animation state tracking (collection, transfer, shake)
    ├── Blocking detection and shake feedback
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
│   ├── Shake animation for blocked screws
│   ├── Blocking detection algorithms
│   ├── Smart selection logic
│   └── JSON-based screw placement strategies
│
├── ShapeFactory.ts      # JSON-driven shape generation with overlap prevention
│   ├── Shape definition loading from JSON
│   ├── Dynamic dimension generation
│   ├── Physics body creation based on JSON config
│   └── Overlap prevention algorithms
│
├── ShapeRegistry.ts     # Shape definition management
│   ├── Loads all shape JSON files on startup
│   ├── Provides shape definitions to other systems
│   ├── Filters enabled shapes based on JSON enabled field
│   └── Manages shape type registry and availability
│
└── ShapeLoader.ts       # Shape JSON loading and validation
    ├── Deterministic 3-phase placement algorithm
    ├── Retry system with progressive size reduction
    ├── Enhanced collision detection and separation
    ├── Shape type selection and sizing
    ├── Screw hole placement algorithms
    ├── Physics body creation
    └── Visual property assignment
```

### Rendering Layer
```
src/game/rendering/
├── ShapeRenderer.ts     # Shape drawing with holes
│   ├── JSON-driven shape drawing
│   ├── Screw hole visualization
│   ├── Tint and transparency effects
│   └── Debug outline rendering
│
└── ScrewRenderer.ts    # Screw visualization and UI elements
    ├── Screw drawing with cross pattern
    ├── Animation state rendering (collection, transfer, shake)
    ├── Shake offset positioning for blocked screws
    ├── Container/holding hole display
    ├── Preview/collected state rendering
    └── All dimensions from UI_CONSTANTS for uniform appearance
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
├── game.ts            # TypeScript interfaces and type definitions
│   ├── Core game interfaces (GameState, Shape, Screw)
│   ├── Physics integration types
│   ├── Serialization interfaces
│   └── Event callback types
│
└── shapes.ts          # Shape definition types
    ├── ShapeDefinition interface
    ├── Dimension configuration types
    ├── Physics configuration types
    └── Screw placement strategy types
```

### Data Layer
```
src/data/shapes/
├── basic/             # Basic shape definitions
│   ├── rectangle.json (disabled - moved to polygons)
│   ├── square.json    (disabled - moved to polygons)
│   └── circle.json
│
├── polygons/          # Polygon shape definitions (3-8 sides)
│   ├── triangle.json
│   ├── square.json    (4-sided regular polygon)
│   ├── rectangle.json (4-sided irregular polygon with width/height)
│   ├── pentagon.json
│   ├── hexagon.json
│   ├── heptagon.json
│   └── octagon.json
│
├── paths/             # Path-based shape definitions
│   ├── arrow.json
│   ├── chevron.json
│   ├── star.json
│   └── horseshoe.json
│
└── composite/         # Composite shape definitions
    └── capsule.json
```

## Technical Decisions

### Framework Choices

**Next.js**: Chosen for its excellent TypeScript support, optimized builds, and deployment convenience. The app directory structure provides clean organization.

**Matter.js**: Selected for its mature physics engine with constraint support, excellent performance, and comprehensive feature set for 2D physics. Enhanced with reduced damping for natural motion:

```typescript
export const PHYSICS_CONSTANTS = {
  shape: {
    friction: 0.05,        // Reduced for more sliding
    frictionAir: 0.005,    // 4x less air resistance
    restitution: 0.4,      // Slightly more bouncy
    density: 0.012,        // Optimal weight for falling
  },
  constraint: {
    stiffness: 1,
    damping: 0.02,         // 5x less damping for swinging
  },
} as const;
```

**HTML5 Canvas**: Preferred over WebGL for simpler implementation, better compatibility, and sufficient performance for the game's requirements.

**TypeScript**: Ensures type safety, better development experience, and maintainable code with comprehensive interfaces.

**Responsive Design**: Canvas dimensions match viewport (mobile) or scale proportionally (desktop) with all systems updating via bounds:changed events.

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
- **Reduced Damping**: Natural swinging motion with minimal energy loss
- **No Manual Forces**: Pure gravity-based falling without artificial impulses

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

**Debug Logging Control**:
The game includes a configurable debug logging system in `Constants.ts`:
```typescript
export const DEBUG_CONFIG = {
  enableVerboseLogging: false,      // General verbose logging
  logContainerRendering: false,     // Container/hole rendering details
  logScrewPlacement: false,         // Screw placement in containers/holes
  logPhysicsStateChanges: false,    // Physics state transitions
  logShapeDestruction: false,       // Shape destruction details
};
```
This allows selective enabling of debug logs without console spam during normal gameplay.

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
- ✅ Enhanced physics with natural motion (10x reduced air friction, 5x less damping)
- ✅ Zero shape overlaps with deterministic 3-phase placement algorithm
- ✅ Layer fade-in animations (1s duration with ease-in-out curve)
- ✅ Container fade animations (0.5s fade-out/fade-in transitions)
- ✅ Fixed shape border rendering (prevents thickness changes)
- ✅ No manual forces - pure gravity-based falling motion
- ✅ Proper GameState update loop integration via SystemCoordinator
- ✅ Responsive canvas dimensions with proper screw animation targeting
- ✅ All rendering uses UI_CONSTANTS for uniform appearance
- ✅ Fixed mobile layout issues and touch coordinate transformation
- ✅ **Capsule Shape Support**: Full implementation with composite physics bodies
- ✅ **Capsule Screw Placement**: Proper centering with 5px end margins
- ✅ **Capsule Blocking Detection**: Specialized collision detection for composite shapes
- ✅ **Event Loop Prevention**: Unique source identifiers prevent physics event loops
- ✅ **Single-Screw Physics**: Enhanced pendulum motion with initial perturbation and wake-up control
- ✅ **Unified Polygon System**: Complete polygon system supporting 3-8 sided polygons (including square and rectangle as 4-sided)
- ✅ **Rotation-Aware Blocking**: All shapes now properly handle rotation in collision detection
- ✅ **Screw Scaling**: Container and holding hole screws render 25% smaller for visual consistency
- ✅ **Container Hole Position Fix**: Fixed screw transfer animations to target correct hole positions
- ✅ **Path-Based Shapes**: Added support for arrow, chevron, star, and horseshoe shapes using vertex paths
- ✅ **Shape Configuration**: Decentralized shape enabling/disabling via JSON `enabled` field
- ✅ **Vertex Rendering Fix**: Separate rendering vertices from physics vertices for accurate shape display
- ✅ **Poly-Decomp Integration**: Proper complex shape physics using poly-decomp-es library
- ✅ Ready for production use with polished visual experience

---

*This design document reflects the current event-driven implementation. The architecture provides a robust, maintainable foundation for future enhancements while ensuring loose coupling and optimal performance across platforms.*