# Screw Count Fix

## Problem
- "Screws remaining: 0" displayed despite visible screws on shapes
- Container generation was incorrect due to 0 screw count

## Root Cause
The LayerManager was counting screws by calling `shape.getAllScrews().length`, but due to event timing, the shapes' screw arrays might have been empty when the count was performed, even though the `shape:screws:ready` event contained the correct screw data.

## Solution
Modified LayerManager to:

1. **Track screw counts from events**: Added `screwCountsByShape` Map to LayerManagerState
2. **Store counts when received**: In `handleShapeScrewsReady`, store the screw count from the event
3. **Use tracked counts**: When calculating total screws, use the stored count instead of calling `shape.getAllScrews()`

## Changes Made

### 1. Added to LayerManagerState interface:
```typescript
screwCountsByShape?: Map<string, number>; // shapeId -> number of screws (from event)
```

### 2. In handleShapeScrewsReady:
```typescript
// Track screw counts per shape from the event
if (!this.state.screwCountsByShape) {
  this.state.screwCountsByShape = new Map();
}
this.state.screwCountsByShape.set(shape.id, screws.length);
```

### 3. Updated screw counting logic:
```typescript
// Use tracked screw count from event, fallback to shape.getAllScrews() if not available
const screwCount = this.state.screwCountsByShape?.get(shape.id) ?? shape.getAllScrews().length;
```

### 4. Initialize and clear the map:
- Initialize in constructor: `screwCountsByShape: new Map()`
- Clear on level reset: `this.state.screwCountsByShape?.clear()`

## Result
The screw count is now accurately tracked from the event data, preventing the timing issue where shapes might not have their screws array populated when the count is performed.