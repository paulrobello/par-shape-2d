# Shape Editor - Technical Design Document

> **Note**: This document describes the current state and architecture of the Shape Editor. 
> It should contain factual descriptions of how systems work, not change logs or development history. 
> When updating, describe the current functionality and architecture, not what was added or fixed.

## Overview

The Shape Editor is a sub-application within PAR Shape 2D that provides comprehensive shape editing capabilities. Built as a Next.js route at `/editor`, it allows users to create, modify, and test shape definitions used in the game.

## Architecture

### Design Principles
- **Event-Driven Architecture**: Follows the same event-driven patterns as the main game for consistency and decoupling
- **Code Reuse**: Leverages existing game systems (ShapeRenderer, PhysicsWorld, etc.) where possible
- **Modular Design**: Editor components are self-contained and testable
- **Real-time Preview**: Changes are immediately reflected in the playground

### System Overview
```
┌─────────────────┐
│   Editor UI     │  ← React Components, Form Controls
├─────────────────┤
│ Editor Manager  │  ← Main orchestrator, input handling
├─────────────────┤
│   Event Bus     │  ← Centralized event communication
├─────────────────┤
│ Editor Systems  │  ← Shape Manager, Property Manager, Physics Simulator
├─────────────────┤
│  Shared Game    │  ← ShapeRenderer, PhysicsWorld, Shape entities
│    Systems      │
├─────────────────┤
│   Utilities     │  ← File I/O, Validation, Math utils
└─────────────────┘
```

## Core Components

### Editor Route Structure
```
src/app/editor/
├── page.tsx              # Main editor page
├── layout.tsx            # Editor-specific layout
└── components/
    ├── EditorCanvas.tsx   # Main editor canvas component
    ├── PropertyPanel.tsx  # Right-side property editing panel
    ├── PlaygroundArea.tsx # Shape preview and testing area
    ├── FileControls.tsx   # File load/save controls
    └── SimulationControls.tsx # Physics simulation controls
```

### Editor Systems
```
src/editor/
├── core/
│   ├── EditorManager.ts         # Main editor orchestrator (extended for Phase 2)
│   ├── EditorState.ts           # Editor state management
│   ├── EditorEventBus.ts        # Editor-specific event bus
│   └── BaseEditorSystem.ts      # Base class for all editor systems
├── systems/
│   ├── ShapeEditorManager.ts    # Shape creation and modification
│   ├── PropertyManager.ts       # Form property management
│   ├── FileManager.ts           # File I/O operations
│   ├── PhysicsSimulator.ts      # Physics testing system
│   ├── DrawingToolManager.ts    # Drawing tool coordination (Phase 2)
│   ├── GridManager.ts           # Grid system management (Phase 2)
│   └── DrawingStateManager.ts   # Drawing state tracking (Phase 2)
├── drawing/                     # Phase 2 drawing system
│   ├── tools/
│   │   ├── BaseTool.ts          # Abstract base for all drawing tools
│   │   ├── SelectTool.ts        # Default selection tool (Phase 1 mode)
│   │   ├── CircleTool.ts        # Circle drawing tool
│   │   ├── RectangleTool.ts     # Rectangle drawing tool
│   │   ├── PolygonTool.ts       # Polygon drawing tool (Phase 2C)
│   │   ├── CapsuleTool.ts       # Capsule drawing tool (Phase 2C)
│   │   └── PathTool.ts          # Path drawing tool (Phase 2C)
│   └── utils/
│       └── PreviewRenderer.ts   # Drawing preview utilities
├── events/
│   ├── EditorEventTypes.ts      # 39 editor event definitions
│   └── EditorEventFlow.md       # Event flow documentation
├── components/
│   ├── ToolPalette.tsx          # Tool selection UI (Phase 2)
│   ├── GridControls.tsx         # Grid settings UI (Phase 2)
│   └── DrawingOverlay.tsx       # Drawing feedback UI (Phase 2)
└── utils/
    ├── FileUtils.ts             # File operation utilities
    ├── ValidationUtils.ts       # Shape validation
    ├── EditorConstants.ts       # Editor configuration
    └── theme.ts                 # Theme system definitions
```

## Phase 1 Features (Implemented)

### 1. Shape File Management
- **Load**: Unified loading interface - click or drag & drop JSON files
- **Save**: Download edited shapes as JSON files
- **Validation**: Comprehensive shape definition validation
- **Error Handling**: Clear feedback for invalid files
- **Global Drag Prevention**: Window-level drag & drop handling to prevent browser default behavior
- **Streamlined UI**: Single interactive drop zone replaces separate load button

### 2. Property Editing Panel
- **Dynamic Forms**: Form fields adapt to selected shape type
- **Value Ranges**: Input validation based on shape constraints
- **Random Generation**: Generate random values within valid ranges
- **Real-time Updates**: Changes immediately update the playground
- **Collapsible Sections**: Organized property groups for better UX
- **High Contrast UI**: Dark gray text on white backgrounds for accessibility
- **Smart Dimension Handling**: 
  - Width/height inputs automatically disabled for radius-based shapes (circles, polygons)
  - Adaptive form fields based on dimension type (fixed vs random)
  - For fixed dimensions: Single input field that syncs min/max values
  - For random dimensions: Separate min/max input fields
  - Automatic type conversion with sensible value ranges
- **Dynamic Screw Placement Controls**: Input fields shown/hidden based on selected placement strategy
- **Auto-Population of Defaults**: Strategy-specific fields automatically populated with appropriate defaults when strategy changes
- **Intelligent Random Generation**: Random values respect min/max relationships and strategy-specific relevance
- **Scale Factor Support**: Path shapes include adjustable scale property (0.1-5.0 range) with automatic calculation for optimal sizing

### 3. Playground Area
- **Shape Preview**: Real-time rendering using game's ShapeRenderer with blue color scheme (#007bff)
- **Screw Visualization**: Show actual screws in red for clear identification
- **Screw Placement Indicators**: Visual indicators showing potential screw positions based on placement strategy
- **Interactive Screw Manipulation**: Click to add/remove screws at any valid position (all shapes, not just custom strategy)
- **Strategy-Based Positioning**: Supports corners, perimeter, grid, custom, and capsule placement strategies
- **Debug View**: Toggle physics body and constraint visualization
- **Canvas Interaction**: 15-pixel click radius for easy screw interaction

### 4. Screw Placement System
- **Visual Indicators**: Dashed gray circles (6px radius) show valid placement positions
- **Strategy Support**:
  - **Corners**: Cross pattern for circles, actual corner positions for polygons, intelligent corner detection for path shapes using multiple algorithms (configurable margin)
  - **Perimeter**: Shape-aware distribution along actual edges - circles use circular distribution, polygons use edge-based distribution, paths use actual vertex-based distribution with proper margin application (configurable point count and margin)
  - **Grid**: Grid pattern inside shape boundaries with ray-casting point-in-polygon testing for path shapes (configurable spacing and margin enforcement)
  - **Custom**: User-defined positions from JSON configuration (canvas-based editing)
  - **Capsule**: Strategic positions for capsule-shaped objects including center, ends, and sides (configurable end margin)
- **Path Shape Enhancements**: All strategies now fully support path-based shapes (arrow, chevron, star, horseshoe) with proper vertex analysis
- **Advanced Corner Detection**: Multi-method approach using angle analysis, direction change detection, and curvature calculation for comprehensive corner identification
- **Point-in-Polygon Testing**: Ray-casting algorithm ensures grid positions are accurately placed inside complex path shapes
- **Min Separation Enforcement**: All strategies respect minimum separation distance to prevent overlapping screws
- **Real-time Feedback**: Indicators hide when screws are placed at those positions
- **Interactive Editing**: Click empty indicators to add screws, click existing screws to remove
- **Position Alignment**: Screw positions and placement indicators use consistent calculation logic
- **Smart Property Panel**: Only shows relevant configuration fields for the selected strategy
- **Coordinate System Handling**: Custom strategy properly converts canvas coordinates to shape-relative positions
- **Stable Shape Geometry**: Screw placement operations don't trigger shape regeneration or dimension changes

### 5. Physics Simulation
- **Simulation Controls**: Toggle Start/Pause/Reset physics simulation with proper state management
- **Matter.js Constraints**: Real physics constraints between screws and shapes for realistic behavior
- **Constraint Physics**: 
  - Multiple screws: Shape held stable by multiple constraint points
  - Single screw: Shape pivots around constraint point like a pendulum
  - No screws: Shape falls freely due to gravity
- **Color Consistency**: Blue shapes (#007bff) and red screws maintained during simulation
- **Interaction Management**: Screw manipulation disabled during active simulation to prevent conflicts
- **Event-Driven Integration**: Complete communication between editor and physics systems
- **Shape Data Transfer**: Full shape and screw configuration passed to physics world
- **Physics Bodies**: Dynamic bodies with proper mass, friction, and restitution properties

### 6. User Interface & Controls
- **Layout**: 
  - Full-width toolbar spanning entire editor width
  - Main content area split between canvas (left) and property panel (right)
  - Canvas area with inset border effect for visual definition
  - Property panel with fixed 300px width, no overlap with canvas
  - Organized control groups: Tools, File, and Simulation with titles and borders
- **File Controls**: 
  - Grouped under "File" title with border
  - Combined drag & drop and click-to-browse interface
  - Icon-based buttons: Save (disk icon), Copy to clipboard (copy icon), New (document icon)
  - Toast notifications for clipboard operations (bottom-right position)
- **Tool Controls**:
  - Grouped under "Tools" title with border
  - Icon and text-based tool buttons (includes Select tool for edit mode)
  - Clickable mode indicator in header next to "Shape Editor" title with toggle functionality
- **Simulation Controls**: 
  - Grouped under "Simulation" title with border
  - Icon-based Start/Pause button (play/pause icons)
  - Text-based Reset and Debug buttons
  - Removed redundant running indicator
- **Toast Notifications**:
  - react-toastify integration for user feedback
  - Theme-aware styling with translucent backgrounds
  - Bottom-right positioning for non-intrusive notifications
  - Success/error states with appropriate colors
- **Canvas Interaction**: 
  - Click to add/remove screws at placement indicators
  - Visual help text for user guidance
  - ESC key cancellation for drawing operations
- **Property Panel**: Collapsible sections with form controls for all shape properties
- **Responsive Design**: 
  - Fixed horizontal scrollbar issues, proper overflow handling
  - Canvas properly sized within its container accounting for padding
  - High-DPI display support with correct coordinate transformations
- **Accessibility**: High contrast text, clear visual indicators, and informative tooltips

## Event System

### Editor Event Categories
1. **File Events**: Load, save, validation
2. **Property Events**: Form changes, value updates
3. **Shape Events**: Creation, modification, preview updates
4. **Screw Events**: Add, remove, placement updates
5. **Simulation Events**: Physics start/stop/reset
6. **UI Events**: Panel toggles, mode changes, canvas interactions

### Event Flow Pattern
```
User Action → UI Component → Event Emission → System Handler → State Update → UI Refresh
```

## Technical Implementation

### Theme System
- **Dark Mode Detection**: Automatic detection of system color scheme preference using `prefers-color-scheme`
- **Theme Interface**: Comprehensive EditorTheme interface covering all UI elements
- **Light/Dark Themes**: Complete theme definitions with consistent color palettes
- **Dynamic Switching**: Real-time theme updates when system preference changes
- **Canvas Integration**: Canvas background color matches selected theme with immediate initialization
- **Component Theming**: All editor components (buttons, inputs, panels) use theme colors
- **Consistent Colors**: Unified color scheme across entire editor interface
- **Initialization Timing**: Theme applied immediately after EditorManager creation to prevent white background flash

### Shape Definition Editing
- **Type-Safe Forms**: TypeScript interfaces ensure form validity
- **Dynamic Validation**: Real-time validation based on shape type
- **Constraint Enforcement**: Min/max values, aspect ratios, etc.
- **JSON Serialization**: Maintain compatibility with game format
- **Simplified Shape Creation**: Editor uses simplified shape rendering for preview
- **Consistent Color Scheme**: Blue shapes (#007bff) and red screws for visual clarity
- **Intelligent Dimension Management**: 
  - Radius-based shapes (circles, polygons) automatically set width/height to 0
  - Random generation skips width/height for radius-based shapes
  - Property inputs disabled to prevent conflicting dimension values
  - Dynamic form adaptation for both number and {min,max} dimension formats
  - Smart type conversion: fixed↔random with automatic value expansion/averaging
- **Event System Optimization**:
  - Screw placement updates bypass property change events to prevent shape regeneration
  - Selective event emission prevents unwanted dimension changes during screw manipulation
  - Coordinate transformations handle canvas-to-shape-relative position conversion properly

### Screw Placement System
- **Strategy Pattern**: Modular algorithms for different placement strategies with full path shape support
- **Visual Feedback**: Dashed gray indicators show valid positions in real-time
- **Coordinate System**: Logical pixel coordinates for high-DPI display support
- **Interactive Tools**: Click-based add/remove with precise hit detection (15px radius)
- **Event-Driven Updates**: All screw changes trigger re-render events for immediate feedback
- **Strategy Calculations**: Algorithm implementations for corners, perimeter, grid, custom, and capsule strategies
- **Path Shape Support**: Complete implementation for arrow, chevron, star, and horseshoe shapes
- **Advanced Corner Detection**: Multi-algorithm approach combining:
  - Angle-based detection (30° threshold) for sharp corners
  - Direction change detection using cross product analysis
  - Curvature-based detection for smooth transitions
  - Extremal point fallback for comprehensive coverage
- **Grid Strategy Enhancement**: Ray-casting point-in-polygon testing for accurate positioning inside complex shapes
- **Perimeter Strategy Enhancement**: Uses actual shape vertices instead of bounding box approximation for precise edge distribution
- **Min Separation Enforcement**: All placement strategies filter positions based on minimum separation distance
- **Positioning Consistency**: Screw positions and indicators use identical strategy-based calculation logic
- **Duplicate Removal**: Intelligent filtering to prevent overlapping corner positions

### Physics Integration
- **Isolated PhysicsWorld**: Editor has its own PhysicsWorld instance with proper boundaries
- **On-Demand Simulation**: Physics only runs when user starts simulation
- **Constraint System**: Real Matter.js constraints between screws and shape bodies
- **Anchor Bodies**: Static anchor points created at screw positions for constraint attachment
- **Dynamic Bodies**: Physics shapes with realistic mass, friction, and damping properties
- **Synchronized Constants**: Physics properties (gravity, density, friction, restitution, stiffness, damping) are synchronized with game constants to ensure consistent behavior
- **Event Communication**: Proper event-driven data transfer between editor and physics systems
- **Shape Data Provider**: Complete shape and screw configuration passed to simulation
- **State Management**: Simulation state tracking to control interaction during physics
- **Debug Visualization**: Custom rendering for physics debugging
- **Performance**: Efficient physics updates for responsive editing
- **Reset Restoration**: Original shape positions stored and restored on simulation reset
- **Position Tracking**: Automatic restoration of shapes to pre-simulation positions

### Canvas Rendering
- **Shared Renderer**: Use game's ShapeRenderer for consistency
- **Multi-Layer Rendering**: Shape → Screws → Indicators → Debug overlays
- **High-DPI Support**: Proper scaling for retina displays
- **Editor Overlays**: Additional UI elements for editing context
- **Responsive Design**: Adaptive canvas sizing with debounced resize handling
- **Debug Modes**: Toggle between normal and debug rendering
- **Render Optimization**: Conditional rendering with needsRender flag
- **Coordinate Translation**: Proper handling of logical vs physical pixels
- **Theme Integration**: Canvas background adapts to current theme with immediate theme application during initialization
- **Background Rendering**: Programmatic canvas background rendering using theme colors instead of CSS

## File Structure Integration

### Shared Code Usage
- **Game Systems**: Reuse PhysicsWorld, ShapeRenderer, Shape entities
- **Utilities**: Leverage existing math, color, and validation utils
- **Types**: Use game's shape type definitions and interfaces
- **Constants**: Share physics and rendering constants

### Editor-Specific Code
- **UI Components**: Editor-specific React components
- **Form Logic**: Property editing and validation
- **File I/O**: Shape file loading and saving
- **Editor State**: Separate state management for editor functionality

## Physics Library Integration

### Poly-Decomp Initialization
- **Purpose**: Enables proper physics body creation for complex path-based shapes using `Bodies.fromVertices`
- **Implementation**: Centralized initialization system via `PhysicsInit.ts` utility
- **Coverage**: Automatic initialization in both game and editor contexts
- **Benefits**: Eliminates Matter.js warnings and ensures correct physics decomposition for complex shapes
- **Usage**: Transparent - automatically initialized when GameCanvas or EditorCanvas components mount
- **State Tracking**: Internal tracking prevents redundant initialization calls

## Phase 2 Implementation (Partially Complete)

### ✅ Phase 2A - Foundation (Implemented)
- **Grid System**: 
  - Configurable grid with visible dot rendering (5px, 10px, 20px, 50px sizes)
  - Toggle visibility and snap-to-grid functionality with enhanced visibility (2px dots, 60% opacity)
  - Grid snap enabled by default for precise shape creation
  - Efficient rendering with only visible grid points drawn
  - GridManager system with event-driven state updates
  - GridControls UI component in property panel
  
- **Drawing Tool Architecture**:
  - Modular BaseTool abstract class for all drawing tools
  - DrawingToolManager for tool selection and coordination
  - Tool-based workflow with consistent interaction patterns
  - Mode switching between "edit" (Phase 1) and "create" (Phase 2) modes
  - Automatic mode switching: starts in create mode, switches to edit when file loaded
  - ToolPalette UI component in toolbar with visual tool selection and aligned mode display
  
- **State Management**:
  - DrawingStateManager for tracking drawing sessions and progress
  - Multi-step drawing workflow support with state machines
  - Real-time instruction display and user feedback
  - Session history tracking with statistics
  
- **Event System Extension**:
  - Extended from 27 to 39 events (12 new events added)
  - 8 Drawing Tool Events for creation workflows
  - 4 Grid System Events for grid management
  - Maintained backward compatibility with Phase 1 events

### ✅ Phase 2B - Basic Tools (Implemented)
- **SelectTool**: 
  - Maintains all Phase 1 functionality (screw manipulation, property editing)
  - Activates "edit" mode when selected
  - Default tool when file is loaded (switches to edit mode)
  
- **CircleTool**: 
  - Center → radius workflow (2 clicks)
  - Real-time preview with dashed outline
  - Grid snapping support
  - Creates proper ShapeDefinition with physics and screw placement
  - Automatic shape loading and mode switching on completion
  
- **RectangleTool**: 
  - Corner → corner workflow (2 clicks)
  - Preview rectangle with translucent fill
  - Minimum size validation (10x10)
  - Full grid integration
  - Automatic shape loading and mode switching on completion
  
- **Preview System**:
  - PreviewRenderer utility class with consistent styling
  - Dashed lines (5px dash, 5px gap)
  - Translucent fills (0.1 opacity blue)
  - Point markers for click positions
  - Real-time coordinate transformation
  - Dimension display (radius for circles, width×height for rectangles)
  - Proper ESC key cancellation with preview clearing

### ✅ Phase 2C - Advanced Tools (Implemented)
- **PolygonTool**: 
  - Center → radius workflow with configurable sides (3-12 range, defaults to 6)
  - **Interactive Mouse Wheel Control**: Scroll to change sides during creation (scroll up = more sides, scroll down = fewer sides)
  - Real-time preview with proper polygon geometry calculation and visual feedback
  - Creates polygon category shapes with primitive rendering
  - Integrated with grid snapping and ESC cancellation
  
- **CapsuleTool**: 
  - Three-step workflow (end → end → thickness)
  - Enhanced preview rendering with accurate capsule outline using manual arc segments
  - Perpendicular vector calculations for precise thickness visualization
  - Creates path-based shapes using fromVertices physics for proper orientation
  - Thickness calculation based on perpendicular distance from center line
  - Manual semicircle rendering ensures outward-curving ends
  
- **PathTool**: 
  - Multi-point workflow with dynamic point addition
  - Path closing detection (click first point when ≥3 points)
  - Visual feedback for closing opportunity with red highlight
  - Automatic path string generation with intelligent scale factor calculation
  - Maintains original drawn size with scale factor preservation (caps at 300px for reasonable dimensions)
  - Creates path category shapes with decomposition support and proper vertex storage
  
- **Visual Polish**: Enhanced drawing state feedback and dimension displays

## System Behavior

### Event Loop Prevention
The editor implements several mechanisms to prevent infinite event loops:
- **Canvas Resize**: Dimensions are checked before resizing, ResizeObserver callbacks are debounced (100ms delay), and logical pixels are used instead of physical pixels for coordinate calculations
- **React Components**: EditorManager is excluded from dependency arrays, local variables track manager instances, and single initialization is enforced on mount
- **Screw Interactions**: Event subscriptions in EditorManager trigger needsRender flags for immediate visual feedback

### Coordinate System Management
- **Canvas Scaling**: Context is scaled by device pixel ratio (DPR) for high-DPI displays
- **Logical vs Physical Pixels**: Canvas buffer uses physical pixels while all drawing operations use logical pixels
- **Debug Rendering**: Physics body vertices are transformed to account for canvas scaling
- **Proper Clearing**: Canvas clearing and background filling use logical dimensions to match viewport
- **Container Sizing**: Canvas container accounts for padding when calculating available space

### System Lifecycle
- **Debug Logging**: Controlled by DEBUG_SYSTEM_LIFECYCLE flag in BaseSystem
- **Physics Initialization**: PhysicsWorld is created but remains inactive until simulation starts
- **Resource Cleanup**: Event subscriptions and physics bodies are properly disposed on system destruction

### UI/UX Design
- **Layout Management**: 
  - Full-width toolbar at top of editor
  - Canvas area and property panel side-by-side below toolbar
  - Canvas area has 8px padding with inset border effect
  - Property panel fixed at 300px width with no overlap
- **Visual Accessibility**: Theme-based text colors provide high contrast readability for both light and dark modes
- **Canvas Interaction**: High-DPI display support with precise coordinate handling
- **CSS Architecture**: Border properties use explicit longhand syntax to avoid conflicts
- **Color Consistency**: Blue shapes (#007bff) and red screws maintained throughout all modes
- **Canvas Background**: Light grey (#e9ecef) background for optimal shape visibility in both light and dark modes, applied programmatically during render
- **Interaction States**: Screw manipulation is disabled during active physics simulation
- **Theme Integration**: All UI elements adapt to system-preferred color scheme automatically
- **UI Simplification**: Streamlined simulation controls with intuitive toggle button design
- **Visual Definition**: Inset box shadow on canvas area provides subtle depth and separation

### Performance Architecture
- **Conditional Rendering**: needsRender flag prevents unnecessary canvas updates
- **Event Throttling**: Resize events are debounced to maintain performance
- **Simplified Physics**: Editor uses basic rectangle physics bodies for preview rendering
- **Spatial Optimization**: Screw click detection uses optimized coordinate calculations
- **Unified Positioning**: Single calculation method for both screw placement and indicators reduces computational overhead
- **High-DPI Support**: Proper handling of device pixel ratio for canvas scaling and coordinate transformations

## Development Guidelines

### Code Organization
- **Event-Driven**: All systems communicate via events
- **Type Safety**: Comprehensive TypeScript typing with proper event type annotations
- **Error Handling**: Robust error handling and user feedback
- **Testing**: Unit tests for critical editor functionality

### Performance Considerations
- **Efficient Rendering**: Optimize canvas updates for smooth editing
- **Memory Management**: Proper cleanup of physics bodies and constraints
- **Responsive UI**: Maintain 60fps during active editing
- **File Operations**: Async file operations with progress feedback
- **Event Loop Prevention**: Careful management of event subscriptions to prevent infinite loops

### Documentation
- **Keep Updated**: Maintain this document as features evolve
- **Event Flow**: Update editor_event_flow.md with changes
- **Code Comments**: Comprehensive documentation of editor-specific logic
- **User Guide**: Eventually create user-facing documentation

## Current Implementation Status

### ✅ Phase 1 - Complete Shape Editor (Fully Implemented)
- **Complete Shape Editor Interface**: Fully functional editor at `/editor` route with comprehensive functionality
- **File Management**: Load/save JSON shape definitions with drag & drop support and validation
- **Property Editing**: Dynamic forms with real-time validation and random value generation
- **Screw Placement System**: Visual indicators and interactive screw manipulation for all placement strategies
- **Physics Simulation**: Full Matter.js constraint-based physics with realistic screw behavior and proper reset
- **Constraint Physics**: Multi-screw stability, single-screw pivoting, no-screw falling with accurate positioning
- **Visual Design**: Consistent blue/red color scheme maintained throughout editor and physics modes
- **Responsive Layout**: Fixed scrollbar issues, proper overflow handling, and high-DPI display support
- **Event System**: Started with 27 events, proper error handling and state management
- **Interaction Management**: Smart interaction blocking during physics simulation with visual feedback
- **Reset Functionality**: Physics simulation reset properly restores shapes to original positions with event-driven updates
- **Dark Mode Support**: Complete UI theming with automatic system preference detection and consistent canvas backgrounds
- **Screw Position Alignment**: Placement indicators and actual screws use identical strategy-based positioning logic
- **Streamlined UI**: Icon-based controls, organized toolbar groups, toast notifications, and improved visual hierarchy

### ✅ Phase 2A, 2B & 2C - Complete Shape Creation System (Fully Implemented)
- **Extended Event System**: Grown from 27 to 39 events with 12 new Phase 2 events
- **Grid System**: Fully functional grid with configurable size, visibility toggle, and snap-to-grid
- **Drawing Tool Architecture**: Modular tool system with BaseTool abstract class and tool manager
- **Drawing State Management**: Complete session tracking and multi-step workflow support
- **Mode Switching**: Clean separation between "edit" mode (Phase 1) and "create" mode (Phase 2)
- **Complete Drawing Tools**: All 5 creation tools implemented and functional:
  - **CircleTool**: Center → radius workflow with real-time preview
  - **RectangleTool**: Corner → corner workflow with dimension validation
  - **PolygonTool**: Center → radius workflow with interactive mouse wheel control for sides (3-12)
  - **CapsuleTool**: Three-step workflow (end → end → thickness)
  - **PathTool**: Multi-point workflow with path closing detection
- **Preview System**: Real-time preview rendering with consistent styling across all tools
- **UI Integration**: ToolPalette in toolbar, GridControls in property panel, DrawingOverlay for feedback
- **Coordinate System**: Proper grid snapping and high-DPI coordinate transformation
- **Shape Generation**: All tools create proper ShapeDefinition objects for seamless integration

### ✅ Phase 2C - Advanced Tools (Completed)
- **PolygonTool**: Configurable sides with center → radius workflow - fully implemented with mouse wheel support
- **CapsuleTool**: Three-step workflow (end → end → thickness) - fully implemented with enhanced preview rendering
- **PathTool**: Multi-point workflow with path closing detection - fully implemented
- **Visual Polish**: Enhanced drawing state feedback and dimension displays - implemented
- **Tool Integration**: All tools registered and working with existing event system
- **Rendering Improvements**: Fixed polygon type detection and capsule orientation preservation

### 🔄 Future Enhancements (Optional)
- **Advanced Shape Creation**: Vertex editing and shape modification tools
- **Export Enhancements**: Multiple format support and batch operations
- **PolygonTool UI**: Property panel control for configuring polygon sides count

## Phase 2 Architecture Details

### Grid System Architecture
The grid system provides visual guidance and coordinate snapping for precise shape creation:
- **GridManager**: Central system managing grid state, rendering, and coordinate transformation
- **GridControls**: React component providing UI for grid configuration in property panel
- **Event Integration**: Grid events seamlessly integrate with drawing tools for real-time updates
- **Performance**: Efficient dot rendering only draws visible grid points within canvas bounds

### Drawing Tool System
The drawing tool architecture follows a modular, extensible design:
- **BaseTool**: Abstract class providing common functionality for all drawing tools
- **Tool Lifecycle**: activate → drawing states → complete/cancel → deactivate
- **State Machine**: Each tool implements its own state machine for multi-step workflows
- **Preview System**: Real-time visual feedback during drawing operations
- **Event Flow**: Tools emit events at each stage for proper system coordination

### Mode Management
Clean separation between editing and creation modes:
- **Edit Mode**: Phase 1 functionality - screw manipulation, property editing, physics simulation
- **Create Mode**: Phase 2 functionality - shape drawing with selected tool
- **Mode Switching**: 
  - Automatic based on tool selection (SelectTool → edit, others → create)
  - Manual via clickable mode indicator in header (toggles between modes)
  - Editor starts in create mode with CircleTool selected
  - Switches to edit mode when file is loaded or shape is created
  - Toggle disabled during physics simulation for safety
- **UI Adaptation**: Interface elements enable/disable based on current mode

### Coordinate System Integration
Proper coordinate handling across all systems:
- **Grid Snapping**: Optional coordinate transformation through GridManager
- **High-DPI Support**: Canvas scaling properly handled in all drawing operations
- **Event Coordinates**: All mouse events transformed to logical canvas coordinates
- **Preview Rendering**: Consistent coordinate system for preview overlays

### Interactive Input Handling
Enhanced user interaction across all drawing tools:
- **Mouse Wheel Support**: PolygonTool responds to scroll events for dynamic sides adjustment (3-12 range)
- **Keyboard Controls**: ESC cancellation support for all drawing operations
- **Click Workflows**: Multi-step drawing processes with visual state feedback
- **Real-time Preview**: Immediate visual response to all user input including wheel events

---

*This design document serves as the technical blueprint for the Shape Editor. It describes the current implementation state and system architecture.*