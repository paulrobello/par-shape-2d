# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run build` - Build the project for production (use this instead of `npm run dev` to check your work)
- `npm run lint` - Run ESLint to check code quality
- `npm run dev` - Start the dev server (dont run this, it hangs)
- `npm start` - Start the production server after building (dont run this, it hangs)

## Architecture Overview

This is a 2D physics puzzle game built with Next.js, TypeScript, and Matter.js. The game follows a layered architecture:

**Core Systems:**
- `GameManager` - Central orchestrator handling input, rendering, and game state transitions
- `GameState` - Manages score, level progression, containers, and local storage persistence
- `PhysicsWorld` - Matter.js wrapper with game-specific physics behavior
- `LayerManager` - Handles the layer system with depth-based rendering and visibility culling

**Entity System:**
- `Layer` - Contains shapes with depth ordering and fade effects
- `Shape` - Game objects with Matter.js physics bodies and screw attachment points
- `Screw` - Removable constraints that hold shapes in place

**Rendering Pipeline:**
- Canvas-based rendering with responsive scaling
- Back-to-front layer rendering with transparency
- Procedural shape generation with screw hole placement
- Smart coordinate transformation for mobile/desktop

## Game Mechanics Implementation

**Layer System:** 10 layers per level, 4 visible at once, with lazy generation for performance. Each layer has a unique `depthIndex` for rendering order and physics separation.

**Screw Blocking:** Screws can only be removed if not blocked by shapes in front layers. The blocking detection uses shape geometry intersection with screw positions.

**Container System:** 4 containers with 3 holes each. When full, containers are marked for removal with a 0.75s delay, then replaced with new colors based on active screws on screen.

**Smart Touch Selection:** For mobile, the game prioritizes screws that match available container colors, then falls back to closest screw within touch radius (30px mobile, 15px desktop).

## Mobile Optimizations

The game uses responsive canvas scaling with virtual game dimensions that scale to screen size. Touch handling prevents default browser behaviors and includes haptic feedback integration.

## Save System

Full game state persistence using local storage, including:
- Matter.js physics bodies (serialized with position, velocity, constraints)
- Layer manager state with all active layers
- Screw animation states
- Container and holding hole contents

The game automatically resumes saved states on page load with proper physics body recreation.

## Matter.js Integration

Physics bodies use collision groups to separate layers. Screws are implemented as Matter.js constraints between shapes and anchor points. The physics world includes sleep management to wake unsupported shapes and prevent floating objects.

## Debug Features

- Debug mode (D key) shows physics outlines and performance metrics
- Save data inspection (I key) shows complete save structure
- Various debug commands (R: restart, G: game over, S: force save, C: clear save)

## Documentation and References

**Reference Images:** The `docs/` folder contains reference images (`sample.jpeg`) showing the desired mobile and desktop game appearance for UI/UX implementation guidance.

**Matter.js Documentation:** Comprehensive Matter.js API documentation is available in `docs/MatterJs_docs/` covering all physics engine components including Bodies, Engine, World, Constraints, Collision detection, and more. Refer to these docs when implementing physics features.

## Technical Design Document

A comprehensive technical design document is available at `project_design.md` which provides:

- Detailed architecture breakdown with system diagrams
- Complete file structure mapping with functionality descriptions
- In-depth game mechanics documentation
- Technical implementation details and decisions
- Performance considerations and optimizations
- Mobile support strategies

**Important:** When making architectural changes to the codebase, always update `project_design.md` to reflect the current implementation. This ensures the design document remains an accurate reference for the system architecture and helps maintain consistency across development iterations.

**Important:** `project_design.md` should be read in to help unstand and locate the code you need to work on. It provides a high-level overview of the architecture, file structure, and key components of the game.

## Webserver

* The app is running in a dev server at url http://localhost:3000/
* If the user requests you take a screenshot of the app, use the Selenium MCP server to navigate to the app URL wait for the user to tell you to proceed then take a screenshot and save it to the project root as screenshot.png.

## Selenium MCP Screenshot Best Practices

When taking screenshots using the Selenium MCP server:

1. **Always save screenshots to a file first** using the `outputPath` parameter
2. **Never directly read the screenshot data** from the MCP response as it can cause context size issues

Example workflow:
```
1. mcp__selenium__take_screenshot with outputPath: "/path/to/screenshot.png"
2. Read file_path: "/path/to/screenshot.png"
```

This prevents context overflow errors and ensures screenshots can be properly analyzed.