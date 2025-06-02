# Shape Editor - Event Flow Documentation

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
| `editor:screw:placement:updated` | Screw positions recalculated | ShapeEditorManager | PlaygroundArea |
| `editor:screw:added` | Screw added (custom strategy) | PlaygroundArea | ShapeEditorManager |
| `editor:screw:removed` | Screw removed (custom strategy) | PlaygroundArea | ShapeEditorManager |
| `editor:screw:strategy:changed` | Screw placement strategy modified | PropertyManager | ShapeEditorManager |

### Physics Simulation Events
| Event Type | Purpose | Emitters | Subscribers |
|------------|---------|----------|-------------|
| `editor:physics:start:requested` | Start physics simulation | SimulationControls | PhysicsSimulator |
| `editor:physics:pause:requested` | Pause physics simulation | SimulationControls | PhysicsSimulator |
| `editor:physics:reset:requested` | Reset physics simulation | SimulationControls | PhysicsSimulator |
| `editor:physics:step:completed` | Physics step completed | PhysicsSimulator | PlaygroundArea |
| `editor:physics:debug:toggled` | Debug view toggle | SimulationControls | PlaygroundArea |

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

### Screw Interaction Flow (Custom Strategy)
```
User clicks on shape → PlaygroundArea calculates click position
    ↓
PlaygroundArea → editor:screw:added/removed
    ↓
ShapeEditorManager updates screw positions in shape definition
    ↓
ShapeEditorManager → editor:screw:placement:updated
    ↓
PlaygroundArea re-renders screws at new positions
    ↓
PropertyManager updates form to reflect new screw configuration
```

### Physics Simulation Flow
```
User clicks Play → SimulationControls → editor:physics:start:requested
    ↓
PhysicsSimulator creates physics world and bodies
    ↓
PhysicsSimulator starts animation loop
    ↓
Each frame: PhysicsSimulator → editor:physics:step:completed
    ↓
PlaygroundArea updates shape positions based on physics
    ↓
Canvas re-renders with physics-updated positions
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

*This document tracks the event-driven architecture of the Shape Editor. It should be updated as new events are added or event flows are modified.*