# Things that need to be done

**Important** Keep documentation up to date then commit as each item is completed. Items are NOT considered complete until verified by the user. Only address one item at a time. 

Items are in order of priority and should be addressed in the order they are in.

## Items

### ~~Item 1 - Physics constraints and screws are not working correctly~~ ✅ COMPLETED

~~There are screws visually rendering not on top of shapes and when removing the screws the shapes are not rotating correctly which is due to the physics constraints not being set up correctly.~~

**FIXED**: The issue was that screw positions were not being synchronized with physics bodies during the game loop. Applied the following comprehensive fixes:

1. **Screw.ts:237**: Added `updateFromAnchorBody()` method to synchronize screw position with its anchor body
2. **LayerManager.ts:739-744**: Integrated screw position updates into the main game loop alongside shape position updates
3. **PhysicsBodyFactory.ts:334**: Enhanced constraint creation with proper anchor body positioning at exact screw positions
4. **ScrewPhysicsService.ts:280-302**: Improved position update logic with better coordinate transformations

The fix ensures that screws update their visual positions from their physics anchor bodies every frame, just like shapes update from their physics bodies. This maintains proper synchronization between physics simulation and visual rendering.
