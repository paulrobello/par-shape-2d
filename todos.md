# Things that need to be done

**Important** Keep documentation up to date then commit as each item is completed. Items are NOT considered complete until verified by the user. Only address one item at a time. 

Items are in order of priority and should be addressed in the order they are in.

## Items

### Item 1 - Refactor Verification ✅ COMPLETED

A massive refactor of `GameManager.ts` was done to reduce its size.
The refactor broke many system and reimplemented others.
Look throughout the game code base and shared library, for anything noted as TODO, needs to be implemented or needs to be verified.
Also look for duplicated code that can be removed and or moved to the shared library.

**Verification Results:**
- ✅ GameManager refactor successfully split into modular managers
- ✅ All manager modules properly implemented and working
- ✅ No broken imports or dependencies found
- ✅ Event flow between managers verified
- ✅ Lint and build pass without errors

**Duplicate Code Removed:**
- ✅ Removed obsolete `ScrewCollisionUtils.ts` (functionality already in shared)
- ✅ Removed duplicate color utilities from game (now uses shared ColorTheme)

**Remaining Optimizations (Lower Priority):**
- Refactor game's ShapeRenderer to extend shared implementation
- Consolidate EventLogger implementations (game version is more feature-rich)
- Move EventDebugger to shared utilities for editor use