# Things that need to be done

**Important** Keep documentation up to date then commit as each item is completed. Items are NOT considered complete until verified by the user. Only address one item at a time. 

Items are in order of priority and should be addressed in the order they are in.

## Items

### ~~Item 1 - Physics constraints and screws are not working correctly~~ ✅ COMPLETED

~~There are screws visually rendering not on top of shapes and when removing the screws the shapes are not rotating correctly which is due to the physics constraints not being set up correctly.~~

**FIXED**: Updated PhysicsBodyFactory.createScrewConstraint and ScrewPhysicsService.updateScrewPositions to properly handle constraint positioning and coordinate transformations, especially for composite bodies. Screws now render in correct positions and physics constraints work properly for rotation behavior.
