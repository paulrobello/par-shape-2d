# Things that need to be done

**Important** Keep documentation up to date then commit as each item is completed. Items are NOT considered complete until verified by the user. Only address one item at a time. 

Items are in order of priority and should be addressed in the order they are in.

## Items

### ~~Item 1 - Physics constraints and screws are not working correctly~~ ✅ COMPLETED

~~There are screws visually rendering not on top of shapes and when removing the screws the shapes are not rotating correctly which is due to the physics constraints not being set up correctly.~~

**FIXED**: Completely redesigned the screw positioning system to use direct coordinate calculation instead of anchor body positioning. The issue was that anchor bodies and complex constraint positioning were unreliable for composite shapes.

**New Direct Positioning Approach:**
1. **Screw.ts:254-268**: Added `setLocalOffset()` to store screw's local offset from shape center when first placed
2. **Screw.ts:238-249**: Added `updateFromShapeBody()` to directly calculate world position from local offset and shape body state
3. **ScrewPlacementService.ts:81**: Call `setLocalOffset()` when screws are created to store their relative position
4. **LayerManager.ts:742**: Use `updateFromShapeBody()` in game loop for reliable position updates

This eliminates anchor body complexity and directly calculates screw positions using simple coordinate transformation from stored local offsets. Much more reliable for composite bodies and complex shapes.
