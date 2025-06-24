# Screw HUD Display Fix

## Problem
When a level starts, the HUD displayed "Screws remaining: 0" before the actual screw count was determined.

## Root Cause
The event flow was:
1. `level:started` event fires
2. ProgressTracker resets state (totalScrews = 0) and emits `progress:updated` 
3. GameRenderManager shows "Screws remaining: 0"
4. Later, `total:screw:count:set` fires with actual count
5. UI updates to show correct count

## Solution
Made two changes to prevent showing misleading "0" count:

### 1. ProgressTracker Change
Don't emit progress updates when totalScrews is 0 at level start:
```typescript
// Only emit progress if we have a valid total screw count
// Otherwise wait for total:screw:count:set event
if (currentTotalScrews > 0) {
  // Emit the reset progress
  this.calculateAndEmitProgress();
}
```

### 2. GameRenderManager Change
Show "..." instead of "0" when we don't have the actual count yet:
```typescript
// Don't show 0 if we haven't received the actual screw count yet
// This prevents showing "Screws remaining: 0" at level start before screws are generated
const screwsText = totalScrews > 0 
  ? `Screws remaining: ${screwsRemaining}` 
  : 'Screws remaining: ...';
```

## Result
- At level start, HUD shows "Screws remaining: ..." 
- Once screws are generated and counted, it updates to show the actual count
- No more misleading "0" display