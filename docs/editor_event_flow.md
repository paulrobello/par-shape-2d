# Shape Editor - Event Flow Documentation

> **Note**: This document describes the current event-driven architecture of the Shape Editor. 
> It should contain factual descriptions of event flows and system communication, not change logs or development history. 
> When updating, describe the current event behavior and architecture, not what was added or modified.

## Overview

The Shape Editor follows the same event-driven architecture pattern as the main game, ensuring consistency and maintainability. All editor systems communicate through a centralized EventBus with type-safe event definitions.

## Event Categories

### File Management Events (6 events)
| Event Type | Purpose | Emitters | Subscribers | Status |
|------------|---------|----------|-------------|--------|
| `editor:file:load:requested` | Request to load shape file | FileManager | FileManager | ✅ Active |
| `editor:file:load:completed` | File load successful | FileManager | EditorState, EditorManager | ✅ Active |
| `editor:file:load:failed` | File load error | FileManager | None | ✅ Active |
| `editor:file:save:requested` | Request to save shape file | FileManager | FileManager | ✅ Active |
| `editor:file:save:completed` | File save successful | FileManager | EditorManager | ✅ Active |
| `editor:file:validation:failed` | Shape validation error | FileManager | None | ✅ Active |

### Property Management Events (4 events)
| Event Type | Purpose | Emitters | Subscribers | Status |
|------------|---------|----------|-------------|--------|
| `editor:property:changed` | Property value updated | PropertyPanel, PropertyManager, ShapeEditorManager | PropertyManager, EditorState | ✅ Active |
| `editor:property:validated` | Property validation result | PropertyManager | None | ✅ Active |
| `editor:property:random:requested` | Generate random values | PropertyPanel | PropertyManager | ✅ Active |
| `editor:property:reset:requested` | Reset to default values | PropertyPanel | PropertyManager | ✅ Active |

### Shape Management Events (5 events)
| Event Type | Purpose | Emitters | Subscribers | Status |
|------------|---------|----------|-------------|--------|
| `editor:shape:created` | New shape instance created | EditorState | ShapeEditorManager, EditorManager, PropertyManager | ✅ Active |
| `editor:shape:updated` | Shape properties modified | EditorState | ShapeEditorManager, EditorManager, PropertyManager, PhysicsSimulator | ✅ Active |
| `editor:shape:destroyed` | Shape instance removed | EditorState | ShapeEditorManager, EditorManager, PropertyManager | ✅ Active |
| `editor:shape:selected` | Shape selected for editing | None | None | ⚠️ Defined but unused |
| `editor:shape:preview:updated` | Shape preview refresh needed | PhysicsSimulator | EditorManager | ✅ Active |

### Screw Management Events (4 events)
| Event Type | Purpose | Emitters | Subscribers | Status |
|------------|---------|----------|-------------|--------|
| `editor:screw:placement:updated` | Screw positions recalculated | ShapeEditorManager | EditorManager | ✅ Active |
| `editor:screw:added` | Screw added at clicked position | ShapeEditorManager | ShapeEditorManager, EditorManager | ✅ Active |
| `editor:screw:removed` | Screw removed from clicked position | ShapeEditorManager | ShapeEditorManager, EditorManager | ✅ Active |
| `editor:screw:strategy:changed` | Screw placement strategy modified | None | None | ⚠️ Defined but unused |

### Physics Simulation Events (7 events)
| Event Type | Purpose | Emitters | Subscribers | Status |
|------------|---------|----------|-------------|--------|
| `editor:physics:start:requested` | Start physics simulation | SimulationControls | PhysicsSimulator, EditorState, ShapeEditorManager | ✅ Active |
| `editor:physics:pause:requested` | Pause physics simulation | SimulationControls | PhysicsSimulator, EditorState | ✅ Active |
| `editor:physics:reset:requested` | Reset physics simulation | SimulationControls | PhysicsSimulator, EditorState, ShapeEditorManager | ✅ Active |
| `editor:physics:step:completed` | Physics step completed | PhysicsSimulator | None | ✅ Active |
| `editor:physics:debug:toggled` | Debug view toggle | PlaygroundArea, SimulationControls | ShapeEditorManager, EditorManager, EditorState | ✅ Active |
| `editor:physics:simulation:shape:requested` | Request shape data for simulation | PhysicsSimulator | ShapeEditorManager | ✅ Active |
| `editor:physics:simulation:shape:provided` | Provide shape data for simulation | ShapeEditorManager | PhysicsSimulator | ✅ Active |

### UI State Events (3 events)
| Event Type | Purpose | Emitters | Subscribers | Status |
|------------|---------|----------|-------------|--------|
| `editor:panel:toggled` | Panel visibility changed | None | None | ⚠️ Defined but unused |
| `editor:mode:changed` | Editor mode switched | None | EditorState | ⚠️ Defined but unused |
| `editor:canvas:resized` | Canvas dimensions changed | EditorManager | ShapeEditorManager, PhysicsSimulator | ✅ Active |

### Drawing Tool Events (8 events) - Phase 2
| Event Type | Purpose | Emitters | Subscribers | Status |
|------------|---------|----------|-------------|--------|
| `editor:tool:selected` | Drawing tool changed | ToolPalette, DrawingToolManager, BaseTool | DrawingToolManager, EditorManager, DrawingOverlay, ToolPalette | ✅ Active |
| `editor:drawing:started` | Drawing operation began | BaseTool | DrawingStateManager, EditorManager | ✅ Active |
| `editor:drawing:progress` | Drawing step completed | BaseTool | DrawingStateManager, EditorManager | ✅ Active |
| `editor:drawing:preview:updated` | Preview needs update | BaseTool | EditorManager | ✅ Active |
| `editor:drawing:completed` | Shape creation finished | BaseTool | DrawingStateManager, EditorManager | ✅ Active |
| `editor:drawing:cancelled` | Drawing cancelled | BaseTool | DrawingStateManager, EditorManager | ✅ Active |
| `editor:drawing:mode:changed` | Edit/create mode switch | DrawingToolManager, SelectTool | EditorManager | ✅ Active |
| `editor:drawing:state:changed` | Drawing state updated | BaseTool | DrawingStateManager, DrawingOverlay | ✅ Active |

### Grid System Events (4 events) - Phase 2
| Event Type | Purpose | Emitters | Subscribers | Status |
|------------|---------|----------|-------------|--------|
| `editor:grid:toggled` | Grid visibility changed | GridControls, GridManager | GridManager, EditorManager, GridControls | ✅ Active |
| `editor:grid:size:changed` | Grid size modified | GridControls, GridManager | GridManager, EditorManager, GridControls | ✅ Active |
| `editor:grid:snap:toggled` | Grid snapping toggled | GridControls, GridManager | GridManager, GridControls | ✅ Active |
| `editor:grid:coordinate:snapped` | Coordinate was snapped | GridManager | None (informational) | ✅ Active |

### Error Events (3 events)
| Event Type | Purpose | Emitters | Subscribers | Status |
|------------|---------|----------|-------------|--------|
| `editor:error:validation` | Shape validation error | ShapeEditorManager | EditorManager | ✅ Active |
| `editor:error:physics` | Physics simulation error | PhysicsSimulator | EditorManager | ✅ Active |
| `editor:error:file` | File operation error | FileManager | EditorManager | ✅ Active |

## Event Flow Diagrams

### File Loading Flow
```
User drops file → FileControls → editor:file:load:requested
    ↓
FileManager validates and parses JSON
    ↓
FileManager → editor:file:load:completed (if valid)
    ↓
EditorState updates current shape definition
    ↓
PropertyManager → editor:property:changed (populate forms)
    ↓
ShapeEditorManager → editor:shape:created
    ↓
PlaygroundArea renders shape preview
```

### Property Editing Flow
```
User changes form field → PropertyPanel → editor:property:changed
    ↓
PropertyManager validates new value
    ↓
PropertyManager → editor:property:validated (success/error)
    ↓
If valid: PropertyManager updates shape definition
    ↓
ShapeEditorManager → editor:shape:updated
    ↓
PlaygroundArea → editor:shape:preview:updated
    ↓
Canvas re-renders with updated shape
```

### Screw Interaction Flow (All Strategies)
```
User clicks on canvas → PlaygroundArea captures coordinates (logical pixels)
    ↓
PlaygroundArea → EditorManager.handleCanvasClick
    ↓
ShapeEditorManager calculates hit detection (15px radius)
    ↓
If clicking existing screw: ShapeEditorManager → editor:screw:removed
If clicking empty space: ShapeEditorManager → editor:screw:added
    ↓
ShapeEditorManager updates screw array and emits placement update
    ↓
ShapeEditorManager → editor:screw:placement:updated
    ↓
EditorManager → needsRender = true (triggers canvas re-render)
    ↓
Canvas re-renders with updated screws and placement indicators
```

### Physics Simulation Flow
```
User clicks Start → SimulationControls → editor:physics:start:requested
    ↓
ShapeEditorManager tracks simulation state (disables screw interaction)
    ↓
PhysicsSimulator → editor:physics:simulation:shape:requested
    ↓
ShapeEditorManager → editor:physics:simulation:shape:provided (shape + screw data)
    ↓
PhysicsSimulator creates:
  - Dynamic physics body for shape (with proper mass/friction)
  - Static anchor bodies at screw positions
  - Matter.js constraints between shape and anchors
    ↓
All bodies and constraints added to PhysicsWorld
    ↓
Each frame: PhysicsSimulator updates physics simulation
  - Multiple screws: Shape held stable by constraints
  - Single screw: Shape pivots around constraint point
  - No screws: Shape falls due to gravity
    ↓
PhysicsSimulator renders physics shapes with consistent colors (blue/red)
    ↓
EditorManager → needsRender = true (triggers canvas re-render)
    ↓
Canvas shows realistic physics behavior based on screw configuration
```

### Random Value Generation Flow
```
User clicks Random → PropertyPanel → editor:property:random:requested
    ↓
PropertyManager generates random values within shape constraints
    ↓
PropertyManager → editor:property:changed (for each property)
    ↓
ShapeEditorManager → editor:shape:updated
    ↓
PlaygroundArea → editor:shape:preview:updated
    ↓
PropertyPanel updates form fields with new values
```

## Comprehensive Event System Audit

### Total Event Definitions: 39 event types (Extended from 27 in Phase 1)
- **File Events**: 6 events for loading, saving, and validation
- **Property Events**: 4 events for form management and validation
- **Shape Events**: 5 events for shape lifecycle and preview updates
- **Screw Events**: 4 events for placement indicators and interactive manipulation
- **Physics Events**: 7 events for simulation control and data transfer
- **UI Events**: 3 events for panel states and canvas interactions
- **Drawing Tool Events**: 8 events for shape creation workflows (Phase 2)
- **Grid System Events**: 4 events for grid management (Phase 2)
- **Error Events**: 3 events for comprehensive error handling

### Phase 2 Event Implementation
**✅ Active Phase 2 Events (12/12)**: All new events are actively used across all drawing tools
- Drawing events coordinate tool selection, drawing progress, and shape creation for all 6 tools
- Grid events manage visibility, size, snapping, and coordinate transformation
- Mode switching events handle transitions between edit and create modes
- All Phase 2C tools (PolygonTool, CapsuleTool, PathTool) fully integrated with event system

### Event Implementation Analysis
**✅ Active Events (35/39)**: Events that are both emitted and subscribed to
**⚠️ Unused Events (4/39)**: Events defined in types but never emitted:
- `editor:shape:selected` (reserved for future multi-shape selection)
- `editor:screw:strategy:changed` (handled through property system)
- `editor:panel:toggled` (UI panels always visible)
- `editor:mode:changed` (replaced by `editor:drawing:mode:changed` in Phase 2)

### Event Usage Statistics
- **Total Event Emissions**: 75+ instances across 18 files (increased with Phase 2C tools)
- **Total Event Subscriptions**: 50+ instances across 9 systems
- **Most Active Phase 2 Events**: 
  - `editor:drawing:preview:updated` (continuous during drawing for all 6 tools)
  - `editor:tool:selected` (mode and UI updates)
  - `editor:grid:coordinate:snapped` (every mouse move with grid snap)
  - `editor:drawing:progress` (multi-step tools like CapsuleTool and PathTool)
  - `editor:drawing:state:changed` (state machine updates for complex workflows)

### Key Architecture Benefits
1. **Complete Decoupling**: No direct system dependencies
2. **Type Safety**: All 39 events have TypeScript interfaces
3. **Event Priority**: Critical events (errors) have higher priority
4. **Loop Prevention**: Event loop detection and prevention mechanisms
5. **Real-time Updates**: Immediate visual feedback through event-driven rendering
6. **Extensibility**: Easy to add new events and systems (proven by Phase 2)
7. **Mode Isolation**: Clean separation between Phase 1 and Phase 2 functionality

### Performance Considerations
- **Conditional Rendering**: Events trigger needsRender flag only when necessary
- **Event Debouncing**: Canvas resize events are debounced to prevent performance issues
- **Efficient Hit Detection**: Screw interaction uses optimized coordinate calculations
- **Memory Management**: Proper event subscription cleanup on system destruction
- **Grid Optimization**: Grid renders only visible dots within canvas bounds
- **Preview Throttling**: Drawing preview updates are optimized for smooth performance


## Event Dependencies

### Critical Event Chains
1. **File Load Chain**: `editor:file:load:requested` → `editor:file:load:completed` → `editor:property:changed` → `editor:shape:created`
2. **Property Edit Chain**: `editor:property:changed` → `editor:property:validated` → `editor:shape:updated` → `editor:shape:preview:updated`
3. **Physics Chain**: `editor:physics:start:requested` → physics loop → `editor:physics:step:completed` → visual updates
4. **Screw Edit Chain**: `editor:screw:added` → `editor:screw:placement:updated` → `editor:property:changed`

### Event Priority Levels
- **CRITICAL**: File operations, validation errors
- **HIGH**: Property changes, shape updates
- **NORMAL**: UI updates, preview refreshes
- **LOW**: Debug events, non-essential updates

## System Communication Matrix

| System | Events Emitted (Count) | Events Subscribed (Count) |
|--------|-------|------------|
| **EditorManager** | `editor:canvas:resized` (1) | 14 events: All error events, file operations, shape lifecycle, physics control, screw manipulation |
| **EditorState** | `editor:shape:created`, `editor:shape:updated`, `editor:shape:destroyed` (4) | 7 events: File load, property changes, physics control, mode changes |
| **FileManager** | File operations, validation (7) | `editor:file:load:requested`, `editor:file:save:requested` (2) |
| **PropertyManager** | `editor:property:validated`, `editor:property:changed` (3) | 6 events: Shape lifecycle, property changes, random/reset requests |
| **ShapeEditorManager** | Shape lifecycle, screw placement, physics data (12) | 10 events: Shape lifecycle, canvas resize, debug toggle, screw interactions, physics control |
| **PhysicsSimulator** | Physics steps, simulation state, errors (7) | 6 events: Physics control, shape updates, canvas resize, shape data provision |
| **PlaygroundArea** | `editor:physics:debug:toggled` (1) | None |
| **SimulationControls** | Physics control events (3) | None |
| **PropertyPanel** | Property change events (3) | None |

### Event Flow Patterns
- **One-way Communication**: UI components (PropertyPanel, SimulationControls, PlaygroundArea) only emit events
- **Bidirectional Communication**: Core systems (EditorManager, EditorState, FileManager, PropertyManager, ShapeEditorManager, PhysicsSimulator) both emit and subscribe
- **Event Aggregation**: EditorManager subscribes to most events for centralized coordination

## Performance Considerations

### High-Frequency Events
- `editor:physics:step:completed` - During physics simulation
- `editor:property:changed` - During active form editing
- `editor:shape:preview:updated` - Real-time shape updates

### Optimization Strategies
1. **Event Batching**: Batch rapid property changes
2. **Debouncing**: Debounce form input events
3. **Selective Updates**: Only update affected canvas regions
4. **Physics Throttling**: Limit physics update frequency

### Memory Management
- Automatic event subscription cleanup
- Physics body disposal on shape destruction
- Canvas resource management
- Form validation caching

## Error Handling

### Error Event Propagation
All systems emit specific error events that bubble up to EditorManager for centralized handling:

```
System Error → Specific Error Event → EditorManager → User Notification
```

### Error Categories
1. **Validation Errors**: Invalid shape properties, constraint violations
2. **File Errors**: Parse failures, invalid JSON, missing properties
3. **Physics Errors**: Simulation failures, constraint issues
4. **UI Errors**: Canvas rendering issues, form validation

## Debug and Development

### Event Monitoring
- Built-in event logging and debugging
- Event flow visualization tools
- Performance monitoring for high-frequency events
- Event history tracking for debugging

### Development Events
- `editor:debug:event:logged` - Event debugging information
- `editor:debug:performance:measured` - Performance metrics
- `editor:debug:state:dumped` - System state snapshots

## Event Implementation Details

### File Locations
**Event Definitions**: `/src/editor/events/EditorEventTypes.ts` (27 interfaces)
**Event Bus**: `/src/editor/core/EditorEventBus.ts` (Singleton pattern)
**Base System**: `/src/editor/core/BaseEditorSystem.ts` (Subscribe/emit methods)

### Event Emitters by File
- **PropertyManager.ts**: 3 events (property validation, random generation, reset)
- **PhysicsSimulator.ts**: 7 events (physics simulation, errors, shape requests)
- **FileManager.ts**: 7 events (file operations, validation)
- **ShapeEditorManager.ts**: 12 events (shape lifecycle, screw management)
- **EditorState.ts**: 4 events (shape state changes)
- **EditorManager.ts**: 1 event (canvas resize)
- **PlaygroundArea.tsx**: 1 event (debug toggle)
- **SimulationControls.tsx**: 3 events (physics control)
- **PropertyPanel.tsx**: 3 events (property changes)

### Event Subscribers by System
- **EditorManager**: 14 subscriptions (centralized error handling, UI coordination)
- **ShapeEditorManager**: 10 subscriptions (shape management, screw interaction)
- **EditorState**: 7 subscriptions (state management, mode changes)
- **PhysicsSimulator**: 6 subscriptions (physics control, shape updates)
- **PropertyManager**: 6 subscriptions (property management)
- **FileManager**: 2 subscriptions (file operations)

### Event System Optimizations

**Screw Placement Event Optimization**: Custom screw placement operations bypass the standard property change event chain to prevent unwanted shape regeneration:

- **Standard Flow**: Property changes → `editor:property:changed` → `EditorState` → `editor:shape:updated` → Shape regeneration
- **Optimized Flow**: Screw placement → Direct shape definition update → `editor:screw:placement:updated` → UI refresh only

This prevents shape dimension changes when adding/removing screws, maintaining stable geometry during screw manipulation.

**Strategy Default Population**: When strategy changes occur, missing parameters are automatically populated with appropriate defaults based on existing shape file configurations without triggering full shape regeneration.

**Coordinate System Handling**: Custom strategy screw placement properly converts between canvas coordinates and shape-relative coordinates to ensure accurate positioning.

### Unused Event Types
The following 4 events are defined in `EditorEventTypes.ts` but never emitted:
1. `editor:shape:selected` - Shape selection functionality not implemented
2. `editor:screw:strategy:changed` - Strategy changes handled via property system
3. `editor:panel:toggled` - Panel visibility not dynamically controlled
4. `editor:mode:changed` - Mode changes not implemented in current version

---

*This document describes the event-driven architecture of the Shape Editor based on comprehensive codebase analysis. Last updated: December 2025*