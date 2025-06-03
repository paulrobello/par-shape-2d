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
│   ├── EditorManager.ts     # Main editor orchestrator
│   ├── EditorState.ts       # Editor state management
│   └── EditorEventBus.ts    # Editor-specific event bus
├── systems/
│   ├── ShapeEditorManager.ts    # Shape creation and modification
│   ├── PropertyManager.ts       # Form property management
│   ├── FileManager.ts           # File I/O operations
│   └── PhysicsSimulator.ts      # Physics testing system
├── events/
│   ├── EditorEventTypes.ts      # Editor event definitions
│   └── EditorEventFlow.md       # Event flow documentation
├── components/
│   ├── forms/                   # Property editing forms
│   ├── canvas/                  # Canvas-related components
│   └── controls/                # UI control components
└── utils/
    ├── FileUtils.ts             # File operation utilities
    ├── ValidationUtils.ts       # Shape validation
    └── EditorConstants.ts       # Editor configuration
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
- **Smart Dimension Handling**: Width/height inputs automatically disabled for radius-based shapes (circles, polygons)
- **Dynamic Screw Placement Controls**: Input fields shown/hidden based on selected placement strategy
- **Auto-Population of Defaults**: Strategy-specific fields automatically populated with appropriate defaults when strategy changes
- **Intelligent Random Generation**: Random values respect min/max relationships and strategy-specific relevance

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
  - **Corners**: Cross pattern for circles, corner positions for rectangles (configurable margin)
  - **Perimeter**: Evenly distributed around shape perimeter (configurable point count and margin)
  - **Grid**: Grid pattern inside shape boundaries (configurable spacing)
  - **Custom**: User-defined positions from JSON configuration (canvas-based editing)
  - **Capsule**: Strategic positions for capsule-shaped objects (configurable end margin)
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
- **File Controls**: Combined drag & drop and click-to-browse interface with hover feedback
- **Simulation Controls**: Single toggle button for Start/Pause and separate Reset button for physics testing
- **Canvas Interaction**: 
  - Click to add/remove screws at placement indicators
  - Double-click to toggle debug mode
  - Visual help text for user guidance
- **Property Panel**: Collapsible sections with form controls for all shape properties
- **Responsive Design**: 
  - Fixed horizontal scrollbar issues, proper overflow handling
  - Canvas properly sized within its container accounting for padding
  - High-DPI display support with correct coordinate transformations
- **Accessibility**: High contrast text and clear visual indicators

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
- **Event System Optimization**:
  - Screw placement updates bypass property change events to prevent shape regeneration
  - Selective event emission prevents unwanted dimension changes during screw manipulation
  - Coordinate transformations handle canvas-to-shape-relative position conversion properly

### Screw Placement System
- **Strategy Pattern**: Modular algorithms for different placement strategies
- **Visual Feedback**: Dashed gray indicators show valid positions in real-time
- **Coordinate System**: Logical pixel coordinates for high-DPI display support
- **Interactive Tools**: Click-based add/remove with precise hit detection (15px radius)
- **Event-Driven Updates**: All screw changes trigger re-render events for immediate feedback
- **Strategy Calculations**: Algorithm implementations for corners, perimeter, grid, custom, and capsule strategies
- **Positioning Consistency**: Screw positions and indicators use identical strategy-based calculation logic

### Physics Integration
- **Isolated PhysicsWorld**: Editor has its own PhysicsWorld instance with proper boundaries
- **On-Demand Simulation**: Physics only runs when user starts simulation
- **Constraint System**: Real Matter.js constraints between screws and shape bodies
- **Anchor Bodies**: Static anchor points created at screw positions for constraint attachment
- **Dynamic Bodies**: Physics shapes with realistic mass, friction, and damping properties
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

## Phase 2 Considerations

### Shape Creation Tools
- **Drawing Tools**: Direct shape creation and editing
- **Grid System**: Snap-to-grid with configurable size
- **Vertex Editing**: Manual vertex manipulation for path shapes
- **Shape Templates**: Pre-built shape starting points

### Advanced Features
- **Multi-shape Testing**: Test multiple shapes simultaneously
- **Animation Preview**: Preview shape animations and physics
- **Export Options**: Multiple export formats and options
- **Collaboration**: Share and import community shapes

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

### ✅ Completed Features
- **Complete Shape Editor Interface**: Fully functional editor at `/editor` route with comprehensive functionality
- **File Management**: Load/save JSON shape definitions with drag & drop support and validation
- **Property Editing**: Dynamic forms with real-time validation and random value generation
- **Screw Placement System**: Visual indicators and interactive screw manipulation for all placement strategies
- **Physics Simulation**: Full Matter.js constraint-based physics with realistic screw behavior and proper reset
- **Constraint Physics**: Multi-screw stability, single-screw pivoting, no-screw falling with accurate positioning
- **Visual Design**: Consistent blue/red color scheme maintained throughout editor and physics modes
- **Responsive Layout**: Fixed scrollbar issues, proper overflow handling, and high-DPI display support
- **Event System**: Comprehensive event-driven architecture with 70+ event types and proper error handling
- **Interaction Management**: Smart interaction blocking during physics simulation with visual feedback
- **Reset Functionality**: Physics simulation reset properly restores shapes to original positions with event-driven updates
- **Dark Mode Support**: Complete UI theming with automatic system preference detection and consistent canvas backgrounds
- **Screw Position Alignment**: Placement indicators and actual screws use identical strategy-based positioning logic
- **Streamlined UI**: Combined start/pause controls with single toggle button interface for better usability

### 🔄 In Progress / Foundation
- **Debug Tools**: Canvas debugging with physics body visualization (can be enhanced)
- **Performance**: Optimized rendering with conditional updates
- **Advanced Physics**: Foundation ready for complex constraint scenarios

### 📋 Phase 2 Roadmap
- **Advanced Shape Creation**: Direct drawing tools and vertex editing
- **Enhanced Physics**: Full constraint testing and animation preview
- **Collaboration Features**: Shape sharing and community integration

## Recent Improvements Summary

The Shape Editor has undergone significant enhancements for improved usability and consistency:

### **UI/UX Improvements**
- **Dark Mode Integration**: Automatic system preference detection with comprehensive theming
- **Canvas Background**: Consistent light grey background for optimal shape visibility in all modes
- **Streamlined Controls**: 
  - Combined start/pause simulation controls into intuitive toggle button
  - Unified file loading interface - drop zone serves as both drag target and clickable button
- **Visual Consistency**: Unified color scheme across all editor components and themes
- **Layout Redesign**: Full-width toolbar with side-by-side canvas and property panel layout
- **Visual Polish**: Added inset border effect around canvas area for better visual definition
- **Interactive Feedback**: Drop zone highlights on hover with smooth transitions

### **Functional Fixes**
- **Physics Reset**: Proper shape position restoration to original locations after simulation reset
- **Screw Alignment**: Fixed indicator positioning to match actual screw locations using unified calculation logic
- **Theme Application**: Immediate theme setting during initialization to prevent visual flashing
- **Debug Rendering**: Fixed physics body debug outlines to properly align with shapes on high-DPI displays
- **Coordinate Systems**: Corrected canvas coordinate transformations for proper shape positioning

### **Technical Architecture**
- **Event-Driven Design**: Comprehensive 70+ event system with proper error handling and state management
- **Performance Optimization**: Unified positioning calculations and conditional rendering for efficiency
- **Code Consistency**: Single source of truth for screw positioning logic across indicators and actual placements
- **High-DPI Support**: Proper handling of device pixel ratio throughout rendering pipeline
- **Container Management**: Canvas sizing properly accounts for container padding and layout structure

---

*This design document serves as the technical blueprint for the Shape Editor. It describes the current implementation state and system architecture.*