# Shape Editor - Technical Design Document

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

## Phase 1 Features

### 1. Shape File Management
- **Load**: Drag & drop JSON files or file picker
- **Save**: Download edited shapes as JSON files
- **Validation**: Comprehensive shape definition validation
- **Error Handling**: Clear feedback for invalid files

### 2. Property Editing Panel
- **Dynamic Forms**: Form fields adapt to selected shape type
- **Value Ranges**: Input validation based on shape constraints
- **Random Generation**: Generate random values within valid ranges
- **Real-time Updates**: Changes immediately update the playground

### 3. Playground Area
- **Shape Preview**: Real-time rendering using game's ShapeRenderer
- **Screw Visualization**: Show screw placement based on strategy
- **Interactive Screws**: Click to add/remove screws (custom strategy only)
- **Debug View**: Toggle physics body and constraint visualization

### 4. Physics Simulation
- **Simulation Controls**: Play/Pause/Reset physics simulation
- **Constraint Testing**: Test screw constraints and shape behavior
- **Real-time Physics**: Live physics updates using game's PhysicsWorld
- **Debug Physics**: Visualize physics bodies, constraints, and forces

## Event System

### Editor Event Categories
1. **File Events**: Load, save, validation
2. **Property Events**: Form changes, value updates
3. **Shape Events**: Creation, modification, preview updates
4. **Simulation Events**: Physics start/stop/reset
5. **UI Events**: Panel toggles, mode changes

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

### Physics Integration
- **Shared Systems**: Use game's PhysicsWorld and constraint system
- **Isolated Testing**: Physics simulation in controlled environment
- **Debug Visualization**: Custom rendering for physics debugging
- **Performance**: Efficient physics updates for responsive editing

### Canvas Rendering
- **Shared Renderer**: Use game's ShapeRenderer for consistency
- **Editor Overlays**: Additional UI elements for editing context
- **Responsive Design**: Adaptive canvas sizing for editor layout
- **Debug Modes**: Toggle between normal and debug rendering

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

## Development Guidelines

### Code Organization
- **Event-Driven**: All systems communicate via events
- **Type Safety**: Comprehensive TypeScript typing
- **Error Handling**: Robust error handling and user feedback
- **Testing**: Unit tests for critical editor functionality

### Performance Considerations
- **Efficient Rendering**: Optimize canvas updates for smooth editing
- **Memory Management**: Proper cleanup of physics bodies and constraints
- **Responsive UI**: Maintain 60fps during active editing
- **File Operations**: Async file operations with progress feedback

### Documentation
- **Keep Updated**: Maintain this document as features evolve
- **Event Flow**: Update editor_event_flow.md with changes
- **Code Comments**: Comprehensive documentation of editor-specific logic
- **User Guide**: Eventually create user-facing documentation

---

*This design document serves as the technical blueprint for the Shape Editor. It should be updated as the implementation evolves and new features are added.*