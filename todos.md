# Things that need to be done

**Important** Keep documentation up to date then commit as each item is completed. Items are NOT considered complete until verified by the user. Only address one item at a time. 

Items are in order of priority and should be addressed in the order they are in.

## Items

### ~~Item 1 - Physics constraints and screws are not working correctly~~ ✅ COMPLETED

~~There are screws visually rendering not on top of shapes and when removing the screws the shapes are not rotating correctly which is due to the physics constraints not being set up correctly.~~

**FIXED**: The core issue was a systematic mismatch between shape render positions (`shape.position`) and physics body positions (`shape.body.position`). When the last screw was removed and physics enabled, shapes would "jump" or disappear because they were being rendered at outdated positions.

**Root Cause**: `shape.updateFromBody()` was only called for composite shapes, but ALL shapes need position synchronization when physics state changes.

**Comprehensive Fix Applied:**
1. **ScrewPhysicsService.ts:346**: Added `shape.updateFromBody()` in `makeShapeDynamic()` after physics state change
2. **ScrewPhysicsService.ts:394**: Added `shape.updateFromBody()` in `makeShapePartiallyDynamic()` after physics state change  
3. **ScrewPhysicsService.ts:222**: Call `shape.updateFromBody()` for ALL shapes during constraint recreation, not just composite
4. **ShapeFactory.ts:170**: Call `shape.updateFromBody()` for ALL shapes after creation, not just composite
5. **ScrewPlacementService.ts:165**: Call `shape.updateFromBody()` for ALL shapes before screw calculation
6. **ScrewPlacementService.ts:104**: Call `shape.updateFromBody()` for ALL shapes after physics configuration

**Also implemented direct screw positioning** using local offsets to eliminate anchor body positioning issues for better reliability.

This ensures `shape.position` always matches `shape.body.position`, preventing visual jumping when physics state transitions occur.
