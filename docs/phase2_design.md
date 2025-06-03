# Phase 2 Shape Editor - Comprehensive Design Document

> **Note**: This document outlines the design and implementation strategy for Phase 2 of the Shape Editor, which adds shape creation capabilities to the existing Phase 1 editing functionality.

## Overview

Phase 2 extends the Shape Editor with comprehensive shape creation tools, enabling users to draw and build shapes directly within the editor rather than only editing existing shapes. This phase maintains the established event-driven architecture while adding new drawing workflows, grid systems, and visual feedback mechanisms.

## Architecture Extension

### Design Principles for Phase 2
- **Backward Compatibility**: All Phase 1 functionality must remain intact
- **Event-Driven Consistency**: Extend existing event architecture without disruption
- **Mode-Based Operation**: Clear separation between editing (Phase 1) and creation (Phase 2) modes
- **Tool-Based Workflow**: Modular drawing tools with consistent interaction patterns
- **Real-Time Feedback**: Immediate visual feedback throughout all drawing operations

### System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Phase 2 Extensions                       │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Tool Palette  │  Grid Controls  │   Drawing Overlays      │
├─────────────────┴─────────────────┴─────────────────────────┤
│                 Extended Editor UI                          │
├─────────────────────────────────────────────────────────────┤
│ DrawingToolMgr │ GridManager │ ShapeBuilder │ DrawingState  │
├─────────────────────────────────────────────────────────────┤
│                Extended Event Bus (39 events)               │
├─────────────────────────────────────────────────────────────┤
│              Existing Phase 1 Systems                       │
│   Editor Manager │ Shape Editor │ Property Mgr │ Physics    │
├─────────────────────────────────────────────────────────────┤
│            Shared Game Systems (Unchanged)                  │
│     ShapeRenderer │ PhysicsWorld │ Shape entities           │
└─────────────────────────────────────────────────────────────┘
```

## New Systems Architecture

### 1. DrawingToolManager
**Purpose**: Central coordinator for drawing tool selection and mode management
**Responsibilities**:
- Tool selection and activation
- Mode switching between editing and creation
- Drawing operation coordination
- Integration with existing editor systems

### 2. GridManager  
**Purpose**: Grid display, configuration, and coordinate snapping
**Responsibilities**:
- Grid rendering with configurable size and visibility
- Coordinate snapping calculations
- Grid state management
- Integration with all drawing tools

### 3. ShapeBuilder
**Purpose**: Convert drawing tool input into valid shape definitions
**Responsibilities**:
- Geometry calculation for each shape type
- Shape definition validation
- Coordinate transformation and normalization
- Integration with existing shape system

### 4. DrawingStateManager
**Purpose**: State machine management for multi-step drawing workflows
**Responsibilities**:
- Drawing state tracking for each tool
- Progress validation and error handling
- ESC cancellation support
- User feedback coordination

## Drawing Tool Workflows

### Tool-Specific Implementation Details

#### 1. Circle Tool (Radius-Based)
```
State Flow:
┌─────────────┐    Mouse Click    ┌─────────────┐    Mouse Click    ┌─────────────┐
│   Waiting   │ ──────────────→   │   Setting   │ ──────────────→   │  Complete   │
│ for Center  │    (set center)   │   Radius    │   (set radius)    │    Shape    │
└─────────────┘                   └─────────────┘                   └─────────────┘
                                         │                                  │
                                         ▼                                  ▼
                                   Show preview                        Create shape
                                   circle from                         definition
                                   center to mouse
```

**Implementation Steps**:
1. User selects Circle tool from palette
2. Click 1: Capture center point (with grid snapping if enabled)
3. Mouse move: Show preview circle from center to current mouse position
4. Click 2: Set radius and create circle shape definition
5. ESC: Cancel operation at any step

#### 2. Rectangle Tool (Corner-Based)
```
State Flow:
┌─────────────┐    Mouse Click    ┌─────────────┐    Mouse Click    ┌─────────────┐
│   Waiting   │ ──────────────→   │   Setting   │ ──────────────→   │  Complete   │
│ for Corner  │   (first corner)  │   Second    │  (second corner)  │    Shape    │
└─────────────┘                   └─────────────┘                   └─────────────┘
                                         │                                  │
                                         ▼                                  ▼
                                   Show preview                        Create shape
                                   rectangle from                      definition
                                   corner to mouse
```

**Implementation Steps**:
1. User selects Rectangle tool from palette  
2. Click 1: Capture first corner point (with grid snapping if enabled)
3. Mouse move: Show preview rectangle from first corner to current mouse position
4. Click 2: Set second corner and create rectangle shape definition
5. ESC: Cancel operation at any step

#### 3. Polygon Tool (Radius-Based)
```
State Flow:
┌─────────────┐    Mouse Click    ┌─────────────┐    Mouse Click    ┌─────────────┐
│   Waiting   │ ──────────────→   │   Setting   │ ──────────────→   │  Complete   │
│ for Center  │    (set center)   │   Radius    │   (set radius)    │    Shape    │
└─────────────┘                   └─────────────┘                   └─────────────┘
                                         │                                  │
                                         ▼                                  ▼
                                   Show preview                        Create shape
                                   polygon from                        definition
                                   center to mouse                     (use current
                                                                      sides setting)
```

**Implementation Steps**:
1. User selects Polygon tool from palette
2. Property panel shows sides count input (3-12 range)
3. Click 1: Capture center point (with grid snapping if enabled)
4. Mouse move: Show preview polygon from center to current mouse position
5. Click 2: Set radius and create polygon shape definition using current sides count
6. ESC: Cancel operation at any step

#### 4. Capsule Tool (Three-Step Process)
```
State Flow:
┌─────────────┐    Mouse Click    ┌─────────────┐    Mouse Click    ┌─────────────┐    Mouse Click    ┌─────────────┐
│   Waiting   │ ──────────────→   │   Setting   │ ──────────────→   │   Setting   │ ──────────────→   │  Complete   │
│  for Start  │   (first end)     │   End Point │   (second end)    │  Thickness  │  (thickness)      │    Shape    │
└─────────────┘                   └─────────────┘                   └─────────────┘                   └─────────────┘
                                         │                                  │                                  │
                                         ▼                                  ▼                                  ▼
                                   Show preview                        Show preview                        Create shape
                                   line from start                     capsule with                        definition
                                   to mouse                           current thickness
```

**Implementation Steps**:
1. User selects Capsule tool from palette
2. Click 1: Capture first end point (with grid snapping if enabled)
3. Mouse move: Show preview line from first end to current mouse position
4. Click 2: Set second end point
5. Mouse move: Show preview capsule with thickness based on distance from line
6. Click 3: Set thickness and create capsule shape definition
7. ESC: Cancel operation at any step

#### 5. Path Tool (Multi-Point Process)
```
State Flow:
┌─────────────┐    Mouse Click    ┌─────────────┐    Mouse Click    ┌─────────────┐    Click First   ┌─────────────┐
│   Waiting   │ ──────────────→   │   Adding    │ ──────────────→   │   Adding    │ ──────────────→  │  Complete   │
│ for Start   │   (first point)   │    Points   │    (next point)   │    Points   │     Point        │    Shape    │
└─────────────┘                   └─────────────┘                   └─────────────┘                  └─────────────┘
                                         │              ▲                   │                                 │
                                         ▼              │                   ▼                                 ▼
                                   Show preview     Continue adding      Show preview                     Create shape
                                   line from last   more points         line from last                   definition
                                   point to mouse   (repeat cycle)      point to mouse                   (close path)
```

**Implementation Steps**:
1. User selects Path tool from palette
2. Click 1: Capture first point (with grid snapping if enabled)
3. Mouse move: Show preview line from last point to current mouse position
4. Click N: Add point and continue path
5. Click on first point: Close path and create shape definition
6. ESC: Cancel operation at any step

### Tool Selection and State Management

#### Select Tool (Default - Phase 1 Behavior)
- Maintains all existing Phase 1 functionality
- Enables screw placement interaction
- Enables physics simulation controls
- Disables drawing mode

#### Drawing Tools (Phase 2 Behavior)
- Disables screw placement interaction
- Disables physics simulation during drawing
- Enables drawing mode with tool-specific workflows
- Shows drawing state indicators

## Grid System Implementation

### Grid Features
- **Toggle Control**: On/off checkbox in property panel
- **Size Configuration**: Dropdown with preset sizes (5px, 10px, 20px, 50px)
- **Visual Rendering**: Small dots (1-2px) with low opacity
- **Coordinate Snapping**: Optional snapping to grid intersections
- **Performance Optimization**: Only render visible grid points

### Grid Rendering Strategy
```typescript
// Grid rendering approach
class GridManager {
  renderGrid(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) {
    // Calculate visible grid bounds
    // Render dots at grid intersections
    // Use low opacity for subtle appearance
  }
  
  snapToGrid(point: Point): Point {
    // Round coordinates to nearest grid intersection
    // Return snapped coordinates
  }
}
```

### Grid Integration
- **All Drawing Tools**: Coordinates pass through grid snapping when enabled
- **Preview Rendering**: Preview shapes snap to grid during creation
- **Final Shapes**: Completed shapes use grid-aligned coordinates
- **Visual Feedback**: Grid dots should not interfere with shape visibility

## Event System Extensions

### New Event Categories

#### 7. Drawing Tool Events (8 events)
| Event Type | Purpose | Emitters | Subscribers |
|------------|---------|----------|-------------|
| `editor:tool:selected` | Drawing tool selection changed | ToolPalette | DrawingToolManager, EditorManager |
| `editor:drawing:started` | Drawing operation initiated | DrawingTool | DrawingStateManager, EditorManager |
| `editor:drawing:progress` | Drawing step completed | DrawingTool | DrawingStateManager, PreviewRenderer |
| `editor:drawing:preview:updated` | Preview shape needs update | DrawingTool | DrawingOverlay, EditorManager |
| `editor:drawing:completed` | Shape creation finished | DrawingTool | ShapeBuilder, EditorState |
| `editor:drawing:cancelled` | ESC pressed or cancelled | DrawingTool | DrawingStateManager, EditorManager |
| `editor:drawing:mode:changed` | Switch edit/create modes | DrawingToolManager | EditorManager, UI Components |
| `editor:drawing:state:changed` | Drawing state machine update | DrawingStateManager | DrawingOverlay, EditorManager |

#### 8. Grid System Events (4 events)
| Event Type | Purpose | Emitters | Subscribers |
|------------|---------|----------|-------------|
| `editor:grid:toggled` | Grid visibility toggled | GridControls | GridManager, EditorManager |
| `editor:grid:size:changed` | Grid size modified | GridControls | GridManager, EditorManager |
| `editor:grid:snap:toggled` | Grid snapping enabled/disabled | GridControls | GridManager, DrawingTools |
| `editor:grid:coordinate:snapped` | Coordinate snapped to grid | GridManager | DrawingTools |

### Event Flow Integration

#### Shape Creation Flow
```
User selects drawing tool → editor:tool:selected
    ↓
DrawingToolManager → editor:drawing:mode:changed (to creation mode)
    ↓
User starts drawing → editor:drawing:started
    ↓
Each mouse move → editor:drawing:preview:updated
    ↓
Each drawing step → editor:drawing:progress
    ↓
Shape completed → editor:drawing:completed
    ↓
ShapeBuilder creates definition → editor:shape:created (existing Phase 1 event)
    ↓
Existing Phase 1 flow continues (property panel, preview, etc.)
```

#### Grid Integration Flow
```
User enables grid → editor:grid:toggled
    ↓
GridManager starts rendering grid dots
    ↓
User adjusts grid size → editor:grid:size:changed
    ↓
GridManager updates dot spacing
    ↓
During drawing: Mouse coordinates → GridManager.snapToGrid() → editor:grid:coordinate:snapped
    ↓
Drawing tools use snapped coordinates for all operations
```

## User Interface Extensions

### Tool Palette Component
**Location**: Added to existing toolbar area
**Layout**: Horizontal row of tool buttons
**Tools**: Select, Circle, Polygon, Rectangle, Square, Capsule, Path
**Behavior**: 
- Single selection (radio button pattern)
- Visual highlighting for active tool
- Tooltips for each tool
- Default to Select tool on editor load

### Grid Controls Component  
**Location**: New section in existing property panel
**Controls**:
- Grid enabled checkbox
- Grid size dropdown (5px, 10px, 20px, 50px)
- Snap to grid checkbox
**Behavior**:
- Always visible (not shape-type dependent)
- Settings persist across editor sessions
- Real-time grid updates

### Drawing Overlay Component
**Location**: Canvas overlay layer
**Purpose**: Provide drawing state feedback
**Content**:
- Instruction text ("Click to set center", "Click to set radius", etc.)
- Current drawing step indicator
- ESC cancellation reminder
**Behavior**:
- Only visible during active drawing operations
- Updates based on current drawing state
- Fades in/out smoothly

### Canvas Interaction Enhancements
**Cursor Changes**: Different cursors for each tool (crosshair, pointer, etc.)
**Preview Rendering**: Dashed lines and translucent fills for preview shapes
**Visual Feedback**: Hover effects and click feedback
**Mode Indicators**: Clear visual indication of current mode (edit vs create)

## File Structure Extensions

### New Directory Structure
```
src/editor/
├── systems/
│   ├── DrawingToolManager.ts      # Tool selection and mode management
│   ├── GridManager.ts             # Grid display and snapping
│   ├── ShapeBuilder.ts            # Convert drawing input to shape definitions
│   └── DrawingStateManager.ts     # State machine for drawing workflows
├── drawing/
│   ├── tools/
│   │   ├── BaseTool.ts           # Abstract base class for all drawing tools
│   │   ├── SelectTool.ts         # Default selection tool (Phase 1 behavior)
│   │   ├── CircleTool.ts         # Circle drawing implementation
│   │   ├── PolygonTool.ts        # Polygon drawing implementation
│   │   ├── RectangleTool.ts      # Rectangle/Square drawing implementation
│   │   ├── CapsuleTool.ts        # Capsule drawing implementation
│   │   └── PathTool.ts           # Path-based shape drawing implementation
│   ├── states/
│   │   ├── DrawingState.ts       # Base drawing state interface
│   │   ├── ToolStates.ts         # State definitions for each tool type
│   │   └── StateMachine.ts       # State machine implementation
│   └── utils/
│       ├── CoordinateUtils.ts    # Grid snapping and coordinate helpers
│       ├── PreviewRenderer.ts    # Preview shape rendering utilities
│       ├── GeometryBuilder.ts    # Shape geometry construction helpers
│       └── ValidationUtils.ts    # Drawing validation and error checking
└── components/
    ├── ToolPalette.tsx           # Tool selection UI component
    ├── GridControls.tsx          # Grid configuration UI component
    └── DrawingOverlay.tsx        # Canvas overlay for drawing feedback
```

### Integration with Existing Files
**Modified Files**:
- `EditorEventTypes.ts`: Add 12 new event type definitions
- `EditorManager.ts`: Integrate drawing tool coordination
- `PropertyPanel.tsx`: Add GridControls component
- `EditorCanvas.tsx`: Add DrawingOverlay component
- `page.tsx`: Add ToolPalette to toolbar

**Unchanged Files**: 
- All Phase 1 functionality remains in existing files
- No breaking changes to current event system
- Existing shape editing workflows unmodified

## Technical Implementation Details

### BaseTool Abstract Class
```typescript
abstract class BaseTool {
  abstract name: string;
  abstract cursor: string;
  
  abstract onActivate(): void;
  abstract onDeactivate(): void;
  abstract onMouseDown(point: Point): void;
  abstract onMouseMove(point: Point): void;
  abstract onMouseUp(point: Point): void;
  abstract onKeyDown(key: string): void;
  abstract render(ctx: CanvasRenderingContext2D): void;
}
```

### State Machine Implementation
```typescript
interface DrawingState {
  name: string;
  canProgress: boolean;
  nextStates: string[];
  onEnter?(): void;
  onExit?(): void;
  onMouseClick?(point: Point): void;
  onMouseMove?(point: Point): void;
  onCancel?(): void;
}
```

### Grid Snapping Algorithm
```typescript
class GridManager {
  snapToGrid(point: Point): Point {
    if (!this.snapEnabled) return point;
    
    return {
      x: Math.round(point.x / this.gridSize) * this.gridSize,
      y: Math.round(point.y / this.gridSize) * this.gridSize
    };
  }
}
```

### Preview Rendering Strategy
```typescript
class PreviewRenderer {
  renderPreview(ctx: CanvasRenderingContext2D, tool: BaseTool) {
    ctx.save();
    ctx.setLineDash([5, 5]);  // Dashed lines
    ctx.globalAlpha = 0.7;    // Translucent
    ctx.strokeStyle = '#007bff'; // Consistent blue
    
    tool.render(ctx);  // Tool-specific preview rendering
    
    ctx.restore();
  }
}
```

## Implementation Phases

### Phase 2A - Foundation (Week 1-2)
**Priority 1 - Core Infrastructure**:
1. **Grid System Implementation**
   - Create GridManager system
   - Implement grid rendering with dots
   - Add GridControls UI component
   - Implement coordinate snapping functionality

2. **Drawing Tool Architecture**
   - Create BaseTool abstract class
   - Implement DrawingToolManager system
   - Create ToolPalette UI component
   - Implement tool selection and mode switching

3. **State Management**
   - Create DrawingStateManager system
   - Implement state machine for drawing workflows
   - Add drawing mode indicators
   - Implement ESC cancellation handling

4. **Event System Extension**
   - Add 12 new event types to EditorEventTypes.ts
   - Update EditorManager for tool coordination
   - Implement event flow for drawing operations

**Deliverables**:
- Grid system fully functional
- Tool selection UI working
- Mode switching between edit/create
- Basic drawing state management

### Phase 2B - Basic Tools (Week 2-3)  
**Priority 2 - Simple Drawing Tools**:
1. **SelectTool Implementation**
   - Maintain all Phase 1 functionality
   - Ensure backward compatibility
   - Handle mode switching properly

2. **CircleTool Implementation**
   - Two-step workflow (center → radius)
   - Real-time preview during creation
   - Grid snapping integration
   - Shape definition generation

3. **RectangleTool Implementation**
   - Two-step workflow (corner → corner)
   - Real-time preview during creation
   - Grid snapping integration
   - Support both rectangle and square modes

4. **Preview System**
   - Implement PreviewRenderer utility
   - Add preview overlay rendering
   - Integrate with canvas rendering pipeline

**Deliverables**:
- SelectTool maintains Phase 1 functionality
- CircleTool and RectangleTool fully functional
- Preview system working for basic shapes
- Grid snapping working with all tools

### Phase 2C - Advanced Tools (Week 3-4)
**Priority 3 - Complex Drawing Tools**:
1. **PolygonTool Implementation**
   - Two-step workflow with configurable sides
   - Integration with property panel for sides count
   - Real-time preview with correct geometry
   - Grid snapping support

2. **CapsuleTool Implementation**
   - Three-step workflow (end → end → thickness)
   - Complex preview rendering for capsule shape
   - Proper geometry calculation
   - Integration with existing capsule shape definitions

3. **PathTool Implementation**
   - Multi-point workflow with dynamic point addition
   - Path closing detection (click on first point)
   - Complex preview rendering for paths in progress
   - Proper path validation and shape generation

4. **Visual Polish**
   - Enhanced drawing state indicators
   - Improved user feedback throughout workflows
   - Cursor changes for different tools
   - Visual consistency across all tools

**Deliverables**:
- All drawing tools fully functional
- Complete shape creation workflows
- Polished user experience
- Comprehensive testing completed

## Quality Assurance Strategy

### Testing Requirements
1. **Unit Tests**: Each drawing tool and system component
2. **Integration Tests**: Tool switching and mode changes
3. **User Experience Tests**: Complete drawing workflows
4. **Performance Tests**: Grid rendering and preview updates
5. **Compatibility Tests**: Phase 1 functionality unchanged

### Error Handling
1. **Invalid Shapes**: Proper validation and user feedback
2. **Edge Cases**: Handling of degenerate shapes and edge conditions
3. **State Corruption**: Recovery from invalid drawing states
4. **Performance Issues**: Graceful degradation under load

### Performance Considerations
1. **Grid Rendering**: Efficient dot rendering for large grids
2. **Preview Updates**: Optimized real-time preview rendering  
3. **Memory Management**: Proper cleanup of drawing state
4. **Canvas Operations**: Optimized coordinate transformations

## Success Criteria

### Functional Success Criteria
- [ ] All Phase 1 functionality remains intact and unaffected
- [ ] All 5 drawing tools work with their specified workflows
- [ ] Grid system provides smooth snapping and visual feedback
- [ ] Shape creation integrates seamlessly with existing editing flow
- [ ] ESC cancellation works at all points in drawing workflows
- [ ] Preview rendering provides clear real-time feedback

### Technical Success Criteria  
- [ ] Event-driven architecture maintained and extended cleanly
- [ ] No performance degradation from Phase 1 baseline
- [ ] Comprehensive error handling for all edge cases
- [ ] Code coverage >90% for all new components
- [ ] Documentation updated to reflect new functionality

### User Experience Success Criteria
- [ ] Intuitive tool selection and workflow progression
- [ ] Clear visual feedback throughout all drawing operations
- [ ] Smooth transition between editing and creation modes
- [ ] Consistent visual design with Phase 1 interface
- [ ] Responsive performance during active drawing

## Risk Mitigation

### Technical Risks
1. **Performance Degradation**: Mitigated by efficient rendering and state management
2. **Event System Complexity**: Mitigated by careful event design and testing
3. **Canvas Coordinate Issues**: Mitigated by robust coordinate transformation utilities
4. **Memory Leaks**: Mitigated by proper resource cleanup and state management

### User Experience Risks
1. **Complex Workflows**: Mitigated by clear visual feedback and instructions
2. **Tool Confusion**: Mitigated by intuitive tool selection and mode indicators
3. **Learning Curve**: Mitigated by progressive disclosure and helpful UI
4. **Performance Issues**: Mitigated by optimization and testing

### Integration Risks
1. **Phase 1 Breakage**: Mitigated by comprehensive compatibility testing
2. **Event Conflicts**: Mitigated by careful event namespace design
3. **State Interference**: Mitigated by proper mode separation
4. **Rendering Conflicts**: Mitigated by layered rendering approach

## Future Extensibility

### Phase 3 Considerations
Phase 2 architecture should support future enhancements:
- Additional drawing tools (ellipse, star, custom polygons)
- Advanced editing features (vertex manipulation, shape morphing)
- Collaborative editing capabilities
- Export/import of drawing templates
- Animation preview for physics testing

### Architecture Flexibility
The event-driven, tool-based architecture provides:
- Easy addition of new drawing tools
- Extensible grid system for advanced snapping
- Flexible state management for complex workflows
- Modular rendering system for new visual features

---

*This comprehensive design document provides the blueprint for implementing Phase 2 of the Shape Editor. It maintains the high-quality, event-driven architecture established in Phase 1 while adding powerful shape creation capabilities.*