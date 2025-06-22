# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Important:** This file is for guidance not for change logs or implementation details. Keep updates high level.

## Development Commands

- `npm run build` - Build the project for production (use this instead of `npm run dev` to check your work)
- `npm run lint` - Run ESLint to check code quality
- `npm run dev` - Start the dev server (dont run this, it hangs)
- `npm start` - Start the production server after building (dont run this, it hangs)

## Code style

- Avoid using types `any` and `unknown`
- Always try to use proper types or type unions
- Try not to duplicate code, if multiple areas could benefit for some functionality reason about how it could best be shared.
- **Important:** Before creating any new functionality for the game or editor check that it does not already exist as shared functionality. If the functionality would be beneficial to both game and editor then create it as a shared resource.
- Always add debug logging behind a DEBUG_CONFIG gate using DebugLogger utility methods
- Use shared constants (ANIMATION_CONSTANTS, UI_CONSTANTS) instead of hardcoded values
- Use HapticUtils for all haptic feedback instead of direct navigator.vibrate calls

## Workflow

- **Important:** After changes to code are complete verify them with `npm run lint && npm run build`, fix any errors found. Note you only need to run lint and build after code changes not documentation changes.
- Always update any documentation affected by changes.
- Always update documentation after lint and build passes and before commiting changes
- Commit the changes to the current branch with an applicable commit message.
- Use `uv run` to run python scripts directly.


## Architecture Overview

This is a 2D physics puzzle game built with Next.js, TypeScript, and Matter.js. The game follows a **clean event-driven architecture** with complete decoupling between systems for optimal maintainability and testing.

It has 2 parts: the game itself and a shape editor. Both share common infrastructure and use the same event-driven patterns.

**Key Systems:**
- **Event-Driven Architecture**: 120+ game events, 40+ editor events with type safety
- **Shared Utilities Framework**: Common rendering, animation, and utility functions
- **Physics Integration**: Matter.js with poly-decomp-es for accurate simulation
- **Mobile Support**: Multi-touch selection, haptic feedback, responsive UI

See `docs/game_architecture.md` for detailed system documentation.

## Shared Architecture

The codebase features a **comprehensive shared utilities framework** (`src/shared/`) that eliminates code duplication:

- **Event System**: Unified event bus with priority handling and performance tracking
- **Rendering**: GeometryRenderer with shadows, rounded corners, and visual effects
- **Animation**: 24+ easing functions, ANIMATION_CONSTANTS, and animation utilities
- **Haptic Feedback**: HapticUtils for consistent mobile vibration patterns
- **Debug Logging**: DebugLogger with structured conditional logging methods
- **Styling**: Consistent button and UI component styling
- **Input Handling**: UI_CONSTANTS for consistent touch/mouse interaction radii
- **Utilities**: Math, constants, and common functionality

**Event Naming Convention**: All events follow `domain:action` format with colon separators.

See `docs/game_architecture.md` for detailed shared system documentation.

## Visual Systems

The game features professional visual polish with:

- **Animation System**: 24+ easing functions, smooth transitions, screw rotation effects
- **Rendering Pipeline**: Multi-layered shape rendering with shadows and rounded corners
- **UI Styling**: Consistent button design system with accessibility support
- **Canvas Effects**: Enhanced shadows, glows, and visual feedback

See `docs/game_architecture.md` for detailed rendering and animation system documentation.

## Core Game Systems

- **Physics**: Matter.js with poly-decomp-es for accurate collision detection and simulation
- **Collision Detection**: Advanced two-phase system with precise geometric accuracy for all shape types
- **Shape System**: Multi-layered rendering pipeline supporting all polygon types with rounded corners
- **Screw Management**: Robust ownership system preventing race conditions and ensuring data integrity
- **Container System**: Intelligent hole placement and screw collection logic

See `docs/game_architecture.md` for detailed system documentation.

## Event Architecture

The game uses **120+ game events** and **40+ editor events** with comprehensive type safety for:
- Screw removal flow and ownership transfers
- Container management and level progression
- Shape creation and file management
- Physics integration and simulation control

See `docs/game_event_flows.md` and `docs/editor_event_flows.md` for detailed event flows.

## Documentation References

- **Architecture**: `docs/game_architecture.md` - Detailed system documentation
- **Event Flows**: `docs/game_event_flows.md` and `docs/editor_event_flows.md` - Event system diagrams
- **Matter.js API**: `docs/MatterJs_docs/` - Physics engine reference
- **Refactoring Log**: `refactor.md` - Documentation of significant refactoring changes and improvements

**Important:** Always update documentation when changes are made to architecture, events, or logic.