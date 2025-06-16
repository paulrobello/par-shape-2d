# Refactoring Documentation

This document records significant refactoring changes made to the PAR Shape 2D codebase to improve architecture, performance, and maintainability.

## Event System Refactoring

### Event Naming Convention Standardization

**Problem**: Inconsistent event naming with mixed use of underscores and colons made the event system harder to understand and maintain.

**Solution**: Standardized all events to use colon separators following the pattern `domain:action` or `domain:subdomain:action`.

**Changes Made**:
- `level_score:updated` → `level:score:updated`
- `total_score:updated` → `total:score:updated`
- `game_state:request` → `game:state:request`
- `container_state:request` → `container:state:request`
- `holding_hole_state:request` → `holding:hole:state:request`
- `game_state:restore` → `game:state:restore`
- `container_state:restore` → `container:state:restore`
- `holding_hole_state:restore` → `holding:hole:state:restore`

**Benefits**:
- Consistent, predictable event names
- Easier to understand event hierarchy
- Better alignment with industry standards

### Shared Event Bus Implementation

**Problem**: Duplicate event handling code between game and editor systems.

**Solution**: Created `SharedEventBus` as a core foundation that both game and editor extend.

**Key Features**:
- Priority-based event processing
- Loop detection with contextual keys (threshold: 50)
- Performance monitoring and metrics
- Comprehensive debugging capabilities
- Event history tracking (limited to 1000 entries)

**Benefits**:
- Eliminated code duplication
- Consistent event handling across systems
- Built-in performance monitoring
- Better debugging capabilities

## Race Condition Fixes

### Container Replacement Race Condition

**Problem**: Container replacement used `setTimeout()` which created race conditions where containers could be removed or indices could change during the fade delay.

**Solution**: 
- Moved replacement logic to animation update cycle in `ContainerManager.updateContainerAnimations()`
- Added `containersBeingProcessed` Set to prevent duplicate processing
- Replacement now triggers when fade-out animation completes

**Benefits**:
- Eliminated timing-based race conditions
- More reliable container management
- Predictable replacement behavior

### Physics Constraint Race Condition

**Problem**: Physics constraints were removed immediately when screw collection started, but screw state (`isBeingCollected`) wasn't set until later, creating a window for duplicate clicks.

**Solution**: Made screw collection atomic by moving physics constraint removal inside the state-setting operation.

**Changes**:
- Modified `ScrewManager.startScrewCollection()` to handle physics atomically
- Added validation in `ScrewEventHandler` to prevent duplicate clicks
- Ensured state changes and physics operations happen together

**Benefits**:
- Eliminated duplicate screw collection
- More reliable physics state management
- Cleaner error prevention

### Screw Physics State Management Fix

**Problem**: Physics service was not properly accounting for screws in containers (`isInContainer` state) when determining if shapes should become dynamic.

**Root Cause**: 
- Screws have multiple states: `isBeingCollected`, `isInContainer`, `isCollected`
- Physics service only filtered out some states, missing `isInContainer`

**Solution**: Updated all screw filtering logic to properly exclude `isInContainer` screws:
- Fixed `removeConstraintOnly()` screw counting
- Fixed `updateShapeConstraints()` for single-screw scenarios
- Fixed `checkForStuckShapes()` detection logic
- Updated constraint stiffness for better physics behavior

**Benefits**:
- Shapes correctly become dynamic with 1 screw
- More natural physics behavior
- Accurate screw state tracking

## Ownership Transfer System

### Screw Ownership Implementation

**Problem**: Complex cleanup logic when shapes were destroyed, with race conditions around screw disposal.

**Solution**: Implemented comprehensive ownership transfer system with single owner principle.

**Key Features**:
- Each screw has exactly one owner: `shape`, `container`, or `holding_hole`
- Ownership transfers immediately when operations begin
- Only current owner can delete/destroy screws
- Clean disposal logic based on ownership

**Benefits**:
- Eliminated race conditions during cleanup
- Simplified disposal logic
- Clear data ownership model
- Better debugging with ownership tracking

## Shared Utilities Framework

### EventEmissionUtils

**Problem**: Duplicate event creation code throughout the codebase.

**Solution**: Created `EventEmissionUtils` for standardized event creation.

**Features**:
- Automatic timestamp addition
- Consistent completion event patterns
- Type-safe event creation helpers

### StateValidationUtils

**Problem**: Inconsistent validation patterns across different systems.

**Solution**: Created `StateValidationUtils` for unified validation.

**Features**:
- System validation helpers
- Game state validation
- Screw and container validation
- Atomic validation operations

### DebugLogger

**Problem**: Inconsistent debug logging made troubleshooting difficult.

**Solution**: Created `DebugLogger` for consistent logging.

**Features**:
- Conditional logging based on debug flags
- Standardized formatting with emojis
- Consistent log levels and categories

## Proactive Container Management

### Container Planning System

**Problem**: Containers were only created reactively after filled containers were removed, causing delays.

**Solution**: Implemented proactive container management with `ContainerPlanner`.

**Key Components**:
- `ContainerPlanner` utility for optimal container calculation
- Event-driven updates on layer changes
- Throttled updates (1-second) to prevent excessive recalculation
- Conservative updates that only add missing containers

**Benefits**:
- Containers ready before users need them
- Reduced player frustration
- More intelligent container selection
- Better resource utilization

### Container Replacement Timing Fix

**Problem**: Container replacement calculations were happening after the 500ms fade animation completed, creating race conditions where screws could be placed in holding holes during the fade delay.

**Solution**: Create replacement containers with fade-in animation immediately after the previous container's fade-out completes.

**Timing Flow**:
1. Container filled → Mark for removal → Start fade-out animation (500ms)
2. After fade-out completes → Remove container physically  
3. **IMMEDIATELY** create replacement containers with fade-in animation (500ms)
4. Replacement containers become fully visible

**Benefits**:
- Eliminates race conditions during fade animations
- Containers ready BEFORE users need them
- Seamless visual transitions with no gaps
- Better player experience with predictable container availability

### Fixed-Slot Container System

**Problem**: When containers were removed, all containers to the right would shift left, causing jarring visual effects and making replacement containers appear at unpredictable positions.

**Solution**: Implement a fixed 4-slot positioning system where containers maintain their visual positions.

**Key Features**:
- **4 Fixed Slots**: Containers have predetermined positions regardless of how many are active
- **Slot Preservation**: When a container is removed, its slot remains empty until needed
- **Vacant Slot Usage**: New containers appear in the first available vacant slot  
- **No Shifting**: Existing containers never change position when others are removed

**Implementation**:
- `containerSlots[]` array tracks which slots are occupied
- `getContainers()` returns only non-null containers in slot order
- Positioning calculated for all 4 slots, not just filled ones
- Container lookup by color instead of index for reliability

**Benefits**:
- **Stable Visual Layout**: No unexpected position changes
- **Intuitive Replacement**: Containers appear exactly where previous ones were
- **Smoother Animations**: Only fade in/out, no sliding movements
- **Better UX**: Players can predict where containers will appear

### Container Identification Fix

**Problem**: Near the end of levels, containers would stop being removed when full due to index mismatches between events and the slot system.

**Root Cause**: 
- `containerIndex` in events referred to original array positions
- With slot system, containers might not be in sequential positions
- `orderedContainers[event.containerIndex]` could return `undefined`

**Solution**: Find containers by color and status instead of relying on potentially invalid indices.

**Implementation**:
```typescript
// OLD: Index-based lookup (unreliable)
const container = orderedContainers[event.containerIndex];

// NEW: Color-based lookup (reliable)
const container = this.containers.find(c => 
  c.color === event.color && 
  c.isFull && 
  !c.isMarkedForRemoval
);
```

**Benefits**:
- **Reliable Removal**: Containers always removed when full, even near level end
- **Index Consistency**: Events use calculated visual indices from slot positions
- **Robust Logic**: Works with any container arrangement in slots

## Performance Optimizations

### Event System Optimizations

- Limited event history to 1000 entries for memory management
- Loop detection prevents infinite event chains
- Priority-based processing for critical events
- Throttled high-frequency events

### Physics Optimizations

- Layer-based collision groups reduce computation
- Optimized constraint removal for immediate shape falling
- Dormant body management for inactive shapes
- Adjusted constraint stiffness for natural movement

### Memory Management

- Automatic cleanup of completed animations
- Physics body removal for off-screen shapes
- Event subscription cleanup on system destruction
- Bounded memory usage with automatic limits

## Architectural Improvements

### Single Responsibility Principle

**Problem**: Multiple systems trying to determine level completion.

**Solution**: Made `ProgressTracker` the sole authority for level completion.

**Benefits**:
- Clear separation of concerns
- No competing completion logic
- Easier to reason about game flow
- Single source of truth

### Event-Driven Architecture

**Problem**: Direct system dependencies made testing and modification difficult.

**Solution**: Complete system decoupling through events.

**Benefits**:
- Systems can be tested in isolation
- Easy to add new features
- Hot-swappable systems
- Better maintainability

## Summary

These refactoring efforts have transformed the codebase from a tightly-coupled system with race conditions into a robust, event-driven architecture with clear ownership models and comprehensive shared utilities. The improvements have resulted in:

- **Better Performance**: Optimized event handling and physics processing
- **Higher Reliability**: Eliminated race conditions and state corruption
- **Improved Maintainability**: Clear separation of concerns and shared utilities
- **Enhanced Developer Experience**: Better debugging and consistent patterns
- **Scalable Architecture**: Easy to extend and modify

Each refactoring was driven by specific problems encountered during development and resulted in measurable improvements to code quality and system reliability.