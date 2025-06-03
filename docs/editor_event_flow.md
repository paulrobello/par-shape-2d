# Shape Editor - Event Flow Documentation

> **Note**: This document describes the current event-driven architecture of the Shape Editor. 
> It should contain factual descriptions of event flows and system communication, not change logs or development history. 
> When updating, describe the current event behavior and architecture, not what was added or modified.

## Overview

The Shape Editor follows the same event-driven architecture pattern as the main game, ensuring consistency and maintainability. All editor systems communicate through a centralized EventBus with type-safe event definitions.

## Event Categories

### File Management Events
| Event Type | Purpose | Emitters | Subscribers |
|------------|---------|----------|-------------|
| `editor:file:load:requested` | Request to load shape file | FileControls | FileManager |
| `editor:file:load:completed` | File load successful | FileManager | EditorState, PropertyManager |
| `editor:file:load:failed` | File load error | FileManager | EditorManager |
| `editor:file:save:requested` | Request to save shape file | FileControls | FileManager |
| `editor:file:save:completed` | File save successful | FileManager | EditorManager |
| `editor:file:validation:failed` | Shape validation error | FileManager | EditorManager |

### Property Management Events
| Event Type | Purpose | Emitters | Subscribers |
|------------|---------|----------|-------------|
| `editor:property:changed` | Property value updated | PropertyPanel | PropertyManager, ShapeEditorManager |
| `editor:property:validated` | Property validation result | PropertyManager | PropertyPanel |
| `editor:property:random:requested` | Generate random values | PropertyPanel | PropertyManager |
| `editor:property:reset:requested` | Reset to default values | PropertyPanel | PropertyManager |

### Shape Management Events
| Event Type | Purpose | Emitters | Subscribers |
|------------|---------|----------|-------------|
| `editor:shape:created` | New shape instance created | ShapeEditorManager | PlaygroundArea, PhysicsSimulator |
| `editor:shape:updated` | Shape properties modified | ShapeEditorManager | PlaygroundArea, PhysicsSimulator |
| `editor:shape:destroyed` | Shape instance removed | ShapeEditorManager | PlaygroundArea, PhysicsSimulator |
| `editor:shape:selected` | Shape selected for editing | PlaygroundArea | PropertyManager |
| `editor:shape:preview:updated` | Shape preview refresh needed | ShapeEditorManager | PlaygroundArea |

### Screw Management Events
| Event Type | Purpose | Emitters | Subscribers |
|------------|---------|----------|-------------|
| `editor:screw:placement:updated` | Screw positions recalculated | ShapeEditorManager | PlaygroundArea, EditorManager |
| `editor:screw:added` | Screw added at clicked position | ShapeEditorManager | ShapeEditorManager, EditorManager |
| `editor:screw:removed` | Screw removed from clicked position | ShapeEditorManager | ShapeEditorManager, EditorManager |
| `editor:screw:strategy:changed` | Screw placement strategy modified | PropertyManager | ShapeEditorManager |

### Physics Simulation Events
| Event Type | Purpose | Emitters | Subscribers |
|------------|---------|----------|-------------|
| `editor:physics:start:requested` | Start physics simulation | SimulationControls | PhysicsSimulator |
| `editor:physics:pause:requested` | Pause physics simulation | SimulationControls | PhysicsSimulator |
| `editor:physics:reset:requested` | Reset physics simulation | SimulationControls | PhysicsSimulator |
| `editor:physics:step:completed` | Physics step completed | PhysicsSimulator | EditorManager |
| `editor:physics:debug:toggled` | Debug view toggle | PlaygroundArea | ShapeEditorManager, PhysicsSimulator |
| `editor:physics:simulation:shape:requested` | Request shape data for simulation | PhysicsSimulator | ShapeEditorManager |
| `editor:physics:simulation:shape:provided` | Provide shape data for simulation | ShapeEditorManager | PhysicsSimulator |

### UI State Events
| Event Type | Purpose | Emitters | Subscribers |
|------------|---------|----------|-------------|
| `editor:panel:toggled` | Panel visibility changed | EditorManager | PropertyPanel |
| `editor:mode:changed` | Editor mode switched | EditorManager | All systems |
| `editor:canvas:resized` | Canvas dimensions changed | PlaygroundArea | ShapeEditorManager |

### Error Events
| Event Type | Purpose | Emitters | Subscribers |
|------------|---------|----------|-------------|
| `editor:error:validation` | Shape validation error | PropertyManager, FileManager | EditorManager |
| `editor:error:physics` | Physics simulation error | PhysicsSimulator | EditorManager |
| `editor:error:file` | File operation error | FileManager | EditorManager |

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

## Event System Summary

### Total Events: 70+ event types
- **File Events**: 6 events for loading, saving, and validation
- **Property Events**: 8 events for form management and validation
- **Shape Events**: 10 events for shape lifecycle and preview updates
- **Screw Events**: 8 events for placement indicators and interactive manipulation
- **Physics Events**: 12 events for simulation control and data transfer
- **UI Events**: 6 events for panel states and canvas interactions
- **Error Events**: 6 events for comprehensive error handling

### Key Architecture Benefits
1. **Complete Decoupling**: No direct system dependencies
2. **Type Safety**: All events have TypeScript interfaces
3. **Event Priority**: Critical events (errors) have higher priority
4. **Loop Prevention**: Event loop detection and prevention mechanisms
5. **Real-time Updates**: Immediate visual feedback through event-driven rendering
6. **Extensibility**: Easy to add new events and systems

### Performance Considerations
- **Conditional Rendering**: Events trigger needsRender flag only when necessary
- **Event Debouncing**: Canvas resize events are debounced to prevent performance issues
- **Efficient Hit Detection**: Screw interaction uses optimized coordinate calculations
- **Memory Management**: Proper event subscription cleanup on system destruction


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

| System | Emits | Subscribes |
|--------|-------|------------|
| **EditorManager** | UI state, error handling | All error events, system status |
| **FileManager** | File operations, validation | File requests |
| **PropertyManager** | Property validation, random generation | Property changes, reset requests |
| **ShapeEditorManager** | Shape lifecycle, screw placement | Property changes, screw interactions |
| **PhysicsSimulator** | Physics steps, simulation state | Physics control requests |
| **PlaygroundArea** | Screw interactions, canvas events | Shape updates, physics steps |

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

---

*This document describes the event-driven architecture of the Shape Editor and should be updated when event flows or system communication patterns change.*