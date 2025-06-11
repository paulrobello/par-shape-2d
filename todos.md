# Things that need to be done

**Important** Keep documentation up to date then commit as each item is completed. Items are NOT considered complete until verified by the user. Only address one item at a time. 

Items are in order of priority and should be addressed in the order they are in.

## Items

### ~~Item 1 - Physics constraints and screws are not working correctly~~ ✅ COMPLETED

~~There are screws visually rendering not on top of shapes and when removing the screws the shapes are not rotating correctly which is due to the physics constraints not being set up correctly.~~

**FIXED**: The issue was that screw positions were not being synchronized with physics bodies during the game loop. Applied the following fixes:

1. **ScrewManager.ts:205**: Added `this.physicsService.updateScrewPositions()` to the update loop to synchronize screw visual positions with physics bodies every frame
2. **PhysicsBodyFactory.ts:334**: Enhanced constraint creation with proper anchor body positioning 
3. **ScrewPhysicsService.ts:280-302**: Improved position update logic with better coordinate transformations

Screws now render in correct positions relative to their physics bodies and shapes rotate properly when screws are removed.
