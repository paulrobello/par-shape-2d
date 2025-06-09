# Things that need to be done

**Important** Keep documentation up to date then commit as each item is completed. Items are NOT considered complete until verified by the user. Only address one item at a time. 

Items are in order of priority and should be addressed in the order they are in.

## Items

### ✅ Item 1 - Final layer visibility issue (COMPLETED)

**Issue**: There was a situation where towards the end of a level there were no more shapes on the screen however the progress area showed there were still screws to be collected. The final layer would not become visible despite being marked as active.

**Root Cause**: The Layer class had automatic visibility overrides in `updateIndex()` and `updateVisibility()` methods that conflicted with LayerManager's explicit visibility control. When layers were removed and indices updated, these methods would override the fade-in state set by `showNextHiddenLayer()`.

**Solution**: 
- **Removed automatic visibility overrides** in `Layer.updateIndex()` and deprecated `Layer.updateVisibility()`
- **Enhanced layer creation** so all layers support fade-in animations for consistent behavior
- **LayerManager maintains full control** over visibility decisions without interference from Layer class
- **Initial layers start with full opacity** (fade complete) while hidden layers start ready for fade-in

**Result**: Final layer now properly fades in with working physics through normal visibility flow. All layers now support consistent fade-in animations.