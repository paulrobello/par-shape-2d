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
- **Load**: Drag & drop JSON files or file picker
- **Save**: Download edited shapes as JSON files
- **Validation**: Comprehensive shape definition validation
- **Error Handling**: Clear feedback for invalid files
- **Global Drag Prevention**: Window-level drag & drop handling to prevent browser default behavior

### 2. Property Editing Panel
- **Dynamic Forms**: Form fields adapt to selected shape type
- **Value Ranges**: Input validation based on shape constraints
- **Random Generation**: Generate random values within valid ranges
- **Real-time Updates**: Changes immediately update the playground
- **Collapsible Sections**: Organized property groups for better UX
- **High Contrast UI**: Dark gray text on white backgrounds for accessibility

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
  - **Corners**: Cross pattern for circles, corner positions for rectangles
  - **Perimeter**: Evenly distributed around shape perimeter (configurable point count)
  - **Grid**: Grid pattern inside shape boundaries with configurable spacing
  - **Custom**: User-defined positions from JSON configuration
  - **Capsule**: Strategic positions for capsule-shaped objects
- **Real-time Feedback**: Indicators hide when screws are placed at those positions
- **Interactive Editing**: Click empty indicators to add screws, click existing screws to remove

### 5. Physics Simulation
- **Simulation Controls**: Start/Pause/Reset physics simulation with proper state management
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
- **Layout**: Three-panel layout with toolbar, main canvas, and property sidebar
- **File Controls**: Drag & drop file loading with clear feedback
- **Simulation Controls**: Start/Pause/Reset buttons for physics testing
- **Canvas Interaction**: 
  - Click to add/remove screws at placement indicators
  - Double-click to toggle debug mode
  - Visual help text for user guidance
- **Property Panel**: Collapsible sections with form controls for all shape properties
- **Responsive Design**: Fixed horizontal scrollbar issues, proper overflow handling
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

### Shape Definition Editing
- **Type-Safe Forms**: TypeScript interfaces ensure form validity
- **Dynamic Validation**: Real-time validation based on shape type
- **Constraint Enforcement**: Min/max values, aspect ratios, etc.
- **JSON Serialization**: Maintain compatibility with game format
- **Simplified Shape Creation**: Editor uses simplified shape rendering for preview
- **Consistent Color Scheme**: Blue shapes (#007bff) and red screws for visual clarity

### Screw Placement System
- **Strategy Pattern**: Modular algorithms for different placement strategies
- **Visual Feedback**: Dashed gray indicators show valid positions in real-time
- **Coordinate System**: Logical pixel coordinates for high-DPI display support
- **Interactive Tools**: Click-based add/remove with precise hit detection (15px radius)
- **Event-Driven Updates**: All screw changes trigger re-render events for immediate feedback
- **Strategy Calculations**: Algorithm implementations for corners, perimeter, grid, custom, and capsule strategies

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

### Canvas Rendering
- **Shared Renderer**: Use game's ShapeRenderer for consistency
- **Multi-Layer Rendering**: Shape → Screws → Indicators → Debug overlays
- **High-DPI Support**: Proper scaling for retina displays
- **Editor Overlays**: Additional UI elements for editing context
- **Responsive Design**: Adaptive canvas sizing with debounced resize handling
- **Debug Modes**: Toggle between normal and debug rendering
- **Render Optimization**: Conditional rendering with needsRender flag
- **Coordinate Translation**: Proper handling of logical vs physical pixels

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

### System Lifecycle
- **Debug Logging**: Controlled by DEBUG_SYSTEM_LIFECYCLE flag in BaseSystem
- **Physics Initialization**: PhysicsWorld is created but remains inactive until simulation starts
- **Resource Cleanup**: Event subscriptions and physics bodies are properly disposed on system destruction

### UI/UX Design
- **Layout Management**: Main container uses `width: 100%` with `overflow: hidden`, sidebar has `minWidth` to prevent shrinking
- **Visual Accessibility**: Dark gray text colors (#212529, #495057) provide high contrast readability
- **Canvas Interaction**: High-DPI display support with precise coordinate handling
- **CSS Architecture**: Border properties use explicit longhand syntax to avoid conflicts
- **Color Consistency**: Blue shapes (#007bff) and red screws maintained throughout all modes
- **Interaction States**: Screw manipulation is disabled during active physics simulation

### Performance Architecture
- **Conditional Rendering**: needsRender flag prevents unnecessary canvas updates
- **Event Throttling**: Resize events are debounced to maintain performance
- **Simplified Physics**: Editor uses basic rectangle physics bodies for preview rendering
- **Spatial Optimization**: Screw click detection uses optimized coordinate calculations

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
- **Complete Shape Editor Interface**: Fully functional editor at `/editor` route
- **File Management**: Load/save JSON shape definitions with drag & drop support
- **Property Editing**: Dynamic forms with validation and real-time updates
- **Screw Placement System**: Visual indicators and interactive screw manipulation for all placement strategies
- **Physics Simulation**: Full Matter.js constraint-based physics with realistic screw behavior
- **Constraint Physics**: Multi-screw stability, single-screw pivoting, no-screw falling
- **Visual Design**: Consistent blue/red color scheme maintained throughout editor and physics
- **Responsive Layout**: Fixed scrollbar issues, proper overflow handling
- **Event System**: Comprehensive event-driven architecture with 70+ event types
- **Interaction Management**: Smart interaction blocking during physics simulation

### 🔄 In Progress / Foundation
- **Debug Tools**: Canvas debugging with physics body visualization (can be enhanced)
- **Performance**: Optimized rendering with conditional updates
- **Advanced Physics**: Foundation ready for complex constraint scenarios

### 📋 Phase 2 Roadmap
- **Advanced Shape Creation**: Direct drawing tools and vertex editing
- **Enhanced Physics**: Full constraint testing and animation preview
- **Collaboration Features**: Shape sharing and community integration

---

*This design document serves as the technical blueprint for the Shape Editor. It describes the current implementation state and system architecture.*