# Complete Screw Count Fix

## Problem Evolution
1. First issue: "Screws remaining: 0" displayed but screws were visible
2. Second issue: After first fix, HUD showed "Screws remaining: 0" at level start
3. Third issue: After second fix, HUD stayed at "Screws remaining: ..."

## Root Causes
1. **Timing Issue**: LayerManager was counting screws from `shape.getAllScrews()` but the shapes' screw arrays might be empty due to async timing
2. **Premature Progress Events**: ProgressTracker was emitting events with 0 screws before actual count was ready
3. **Data Source Mismatch**: LayerManager tracked screw counts from events but still used `shape.getAllScrews()` for color collection

## Complete Solution

### 1. LayerManager Changes
Added comprehensive screw tracking from events:
```typescript
// Track both count and actual screw data
screwCountsByShape?: Map<string, number>;
screwsByShape?: Map<string, { id: string; color: ScrewColor }[]>;
```

When handling `shape:screws:ready`:
```typescript
// Store count
this.state.screwCountsByShape.set(shape.id, screws.length);
// Store screw data
this.state.screwsByShape.set(shape.id, screws.map(s => ({ id: s.id, color: s.color })));
```

Use tracked data for counting and color collection:
```typescript
// For counting
const screwCount = this.state.screwCountsByShape?.get(shape.id) ?? shape.getAllScrews().length;

// For colors
const screwsData = this.state.screwsByShape?.get(layerShape.id) || [];
```

### 2. ProgressTracker Changes
Prevent premature progress events:
```typescript
// Only emit progress if we have a valid total screw count
if (currentTotalScrews > 0) {
  this.calculateAndEmitProgress();
}
```

### 3. GameRenderManager Changes
Show loading state instead of 0:
```typescript
const screwsText = totalScrews > 0 
  ? `Screws remaining: ${screwsRemaining}` 
  : 'Screws remaining: ...';
```

## Event Flow
1. Level starts
2. Shapes are created and physics bodies added
3. ScrewManager generates screws and emits `shape:screws:ready` with screw data
4. LayerManager tracks this data (count and colors)
5. When all shapes ready, LayerManager counts using tracked data
6. Emits `total:screw:count:set` with correct count
7. ProgressTracker updates and emits progress
8. HUD updates from "..." to actual count

## Result
- No more "0" display when screws exist
- No premature "0" at level start
- Proper loading state ("...") until count is ready
- Accurate screw counting using event data