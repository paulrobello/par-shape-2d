# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Important:** This file is for guidance not for change logs or implementation details. Keep update high level.

## Development Commands

- `npm run build` - Build the project for production (use this instead of `npm run dev` to check your work)
- `npm run lint` - Run ESLint to check code quality
- `npm run dev` - Start the dev server (dont run this, it hangs)
- `npm start` - Start the production server after building (dont run this, it hangs)

## Code style

- Avoid using types `any` and `unknown`
- Always try to use proper types or type unions
- Try not to duplicate code, if multiple areas could benefit for some functionality reason about how it could best be shared.

## Debug Logging

The game includes a debug logging system controlled by `DEBUG_CONFIG` in `src/game/utils/Constants.ts`. To enable specific debug logs:

```typescript
export const DEBUG_CONFIG = {
  enableVerboseLogging: false,      // General verbose logging
  logContainerRendering: false,     // Container/hole rendering details
  logScrewPlacement: false,         // Screw placement in containers/holes
  logPhysicsStateChanges: false,    // Physics state transitions
  logShapeDestruction: false,       // Shape destruction details
  logPhysicsUpdates: false,         // Physics world updates (🔧 Physics Update: messages)
};
```

Set any flag to `true` to enable that category of logging. This helps debug specific issues without flooding the console.

## Debug Mode

Debug mode can be activated in three ways:
1. Press the 'D' key
2. Click the "Debug Mode" button in the menu overlay (hamburger menu)
3. Click the "Debug" button below the canvas (desktop only)

When debug mode is active:
- **Enhanced Shape Rendering**: Shows physics body outlines, decomposed parts for path-based shapes, and shape information
- **Path-Based Shapes**: Displays each decomposed physics part in different colors with labels (P0, P1, etc.)
- **Debug Info Panel**: Shows game statistics on the canvas
- **Debug Info Below Canvas**: Displays detailed system information (desktop only)

All three methods of toggling debug mode are synchronized and work identically.

## Game Controls

### Restart Functionality
The game can be restarted using multiple methods:
1. **'R' key** - Quick restart during gameplay
2. **"Restart" button** in the menu overlay (hamburger menu)
3. **"Restart" button** below the canvas (desktop only)
4. **"Start Game" button** when game is over - acts as restart

All restart methods provide comprehensive cleanup:
- Clears all screws and physics constraints
- Clears all layers and shapes
- Resets containers and holding holes
- Cancels any active game over countdown
- Stops the red pulsing border effect
- Provides a clean slate for the new game

### Other Controls
- **'S' key** - Save game state manually
- **'G' key** - Trigger game over (testing)
- **'I' key** - Show save data info
- **'C' key** - Clear save data

## Workflow

- **Important:** After changes to code are complete verify them with `npm run lint && npm run build`, fix any errors found.
- Update any documentation effected by the changes.
- Commit the changes to current branch with an applicable commit message.

## Architecture Overview

This is a 2D physics puzzle game built with Next.js, TypeScript, and Matter.js. The game follows a **clean event-driven architecture** with complete decoupling between systems for optimal maintainability and testing.

**Event-Driven Communication:**

**Core Systems (All Event-Driven):**
- `GameManager` - Input handling and rendering coordination
- `GameState` - State management, scoring, and persistence
- `PhysicsWorld` - Matter.js wrapper with autonomous physics management
- `LayerManager` - Layer system with depth-based rendering
- `ScrewManager` - Screw logic, constraints, and animations
- `SystemCoordinator` - System lifecycle management
- `EventFlowValidator` - Debug monitoring and performance tracking
- `ShapeRegistry` - Manages JSON-based shape definitions
- `ShapeLoader` - Loads and validates shape configurations

**System Foundation:**
- `BaseSystem` - Abstract base class providing event-aware functionality to all systems
- `EventBus` - Singleton event system with priority handling and comprehensive debugging
- All systems extend BaseSystem and communicate exclusively through events

**Key Architecture Benefits:**
- **Complete Decoupling:** No direct system dependencies or circular references
- **Enhanced Testability:** Systems can be tested in complete isolation
- **Improved Maintainability:** Changes to one system don't affect others
- **Comprehensive Debugging:** Event flow monitoring and validation throughout
- **Clean Code:** Eliminates complex parameter passing and state management
- **Data-Driven Shapes:** Shape definitions loaded from JSON files for easy modification

## Shape System

**JSON-Based Shape Definitions**: All shapes are defined in JSON files located in `src/data/shapes/`. This allows for easy modification and addition of new shapes without changing code.

**Shape Categories**:
- **Basic**: Circle
- **Polygons**: Triangle, Square, Rectangle, Pentagon, Hexagon, Heptagon, Octagon
- **Paths**: Arrow, Chevron, Star, Horseshoe
- **Composite**: Capsule

**Adding New Shapes**:
1. Create a JSON file in the appropriate category folder
2. Define shape properties: dimensions, physics, rendering, screw placement
3. Set `"enabled": true` in the JSON file to enable the shape
4. The shape will automatically be available in the game

**Shape Definition Structure**:
- `enabled`: Boolean flag to enable/disable the shape in the game
- `dimensions`: Size and scaling parameters
- `physics`: How the physics body is created
- `rendering`: Visual appearance configuration
- `screwPlacement`: Strategy for placing screws (corners, perimeter, custom)

**Polygon System**: Unified polygon handling for all geometric shapes (3-8 sides). Square and rectangle are now implemented as 4-sided polygons, simplifying the shape logic. All polygon vertices are calculated using the formula `(i * Math.PI * 2) / sides + (Math.PI / sides)` to match Matter.js's default orientation, ensuring consistent behavior across rendering, screw placement, and physics interactions.
- `visual`: Border width, transparency, hole support
- `behavior`: Single screw dynamics, rotation settings

## Matter.js Integration

**Physics Integration** uses collision groups to separate layers. Screws are implemented as Matter.js constraints between shapes and anchor points. The physics world includes sleep management to wake unsupported shapes and prevent floating objects.

**Complex Shapes**: Path-based shapes (arrow, chevron, star, horseshoe) use `Bodies.fromVertices()` with poly-decomp-es for accurate physics simulation. Original vertices are preserved separately for rendering to maintain visual accuracy.

## Documentation and References

**Reference Images:** The `docs/` folder contains reference images (`sample.jpeg`) showing the desired mobile and desktop game appearance for UI/UX implementation guidance.

**Matter.js Documentation:** Comprehensive Matter.js API documentation is available in `docs/MatterJs_docs/` covering all physics engine components including Bodies, Engine, World, Constraints, Collision detection, and more. Refer to these docs when implementing physics features.

**Important:** Always update the documentation when changes are made to architecture, events, or logic.

## Technical Design Documents

A comprehensive technical design document is available at `project_design.md` which provides:

- Detailed architecture breakdown with system diagrams
- Complete file structure mapping with functionality descriptions
- In-depth game mechanics documentation
- Technical implementation details and decisions
- Performance considerations and optimizations
- Mobile support strategies

**Important:** When making architectural changes to the codebase, always update `project_design.md` to reflect the current implementation.

**Important:** `project_design.md` should be read in to help understand and locate the code you need to work on. It provides a high-level overview of the architecture, file structure, and key components of the game.

A comprehensive design document for the event system is available at `event_flow.md` which provides:

- A full breakdown of all events their emitters and subscribers

**Important:** When making changes to the event system, always update `event_flow.md` to reflect the current implementation.

**Important:** `event_flow.md` should be read in to help understand and locate the code you need to work on related to eventing.

## Webserver

* The app is running in a dev server at url http://localhost:3000/
* If the user requests you take a screenshot of the app, use the Selenium MCP server to navigate to the app URL wait for the user to tell you to proceed then take a screenshot and save it to the project root as screenshot.png.

## Selenium MCP Screenshot Best Practices

When taking screenshots using the Selenium MCP server:
1. **Only take a screenshot if the user requests it**
2. **Always save screenshots to a file first** using the `outputPath` parameter
3. **Never directly read the screenshot data** from the MCP response as it can cause context size issues

Example workflow:
```
1. mcp__selenium__take_screenshot with outputPath: "/path/to/screenshot.png"
2. Read file_path: "/path/to/screenshot.png"
```
