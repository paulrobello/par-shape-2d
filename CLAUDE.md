# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run build` - Build the project for production (use this instead of `npm run dev` to check your work)
- `npm run lint` - Run ESLint to check code quality
- `npm run dev` - Start the dev server (dont run this, it hangs)
- `npm start` - Start the production server after building (dont run this, it hangs)

**Important:** always use `npm run lint && npm run build` to check your work.

## Architecture Overview

This is a 2D physics puzzle game built with Next.js, TypeScript, and Matter.js. The game follows a **clean event-driven architecture** with complete decoupling between systems for optimal maintainability and testing.

**Event-Driven Communication:**
- **72 Event Types** covering all system interactions across 11 categories
- **148 Event Emissions** and **62 Event Subscriptions** across all systems  
- **Centralized EventBus** with priority handling, loop detection, and performance monitoring
- **Type-Safe Events** with comprehensive TypeScript definitions

**Core Systems (All Event-Driven):**
- `GameManager` - Input handling and rendering coordination (12 emissions, 18 subscriptions)
- `GameState` - State management, scoring, and persistence (53 emissions, 10 subscriptions)
- `PhysicsWorld` - Matter.js wrapper with autonomous physics management (4 emissions, 9 subscriptions)
- `LayerManager` - Layer system with depth-based rendering (26 emissions, 7 subscriptions)
- `ScrewManager` - Screw logic, constraints, and animations (51 emissions, 12 subscriptions)
- `SystemCoordinator` - System lifecycle management (1 emission, 0 subscriptions)
- `EventFlowValidator` - Debug monitoring and performance tracking (1 emission, 15 subscriptions)

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

## Game Mechanics Implementation

**Layer System:** Progressive layer count per level (10+ layers), 4 visible at once, with lazy generation for performance. Each layer has a unique `depthIndex` for rendering order and physics separation. Layer count increases by 1 every 3 levels (levels 1-3: 10 layers, 4-6: 11 layers, etc.). New layers fade in over 1 second with an ease-in-out animation curve using `globalAlpha` during rendering.

**Screw Blocking:** Screws can only be removed if not blocked by shapes in front layers. The blocking detection uses shape geometry intersection with screw positions.

**Container System:** 4 containers with 3 holes each. Containers have white backgrounds with colored borders matching their screw color. When full, containers fade out over 0.5 seconds, then replacement containers fade in over 0.5 seconds with new colors based on active screws on screen.

**Holding Holes:** 5 holding holes with light grey circular backgrounds. When all are full, a pulsing red border appears around the canvas edge as a warning (1 pulse/second).

**Auto-Transfer System:** Screws automatically transfer from holding holes to matching containers when:
- A screw finishes moving to a holding hole and a matching container is available
- A new container appears that matches screws already in holding holes
- Uses reservation system to prevent multiple screws targeting same container hole

**Smart Touch Selection:** For mobile, the game prioritizes screws that match available container colors, then falls back to closest screw within touch radius (30px mobile, 15px desktop).

**Blocked Screw Feedback:** When blocked screws are clicked, they play a small shake animation to provide visual feedback that they cannot be removed.

**Scoring System:** 10 points per screw removed from shapes (regardless of destination). Score is based on core gameplay mechanic of removing screws, not container placement. HUD displays "Level Score" and "Grand Total" for clarity.

**Shape Sizes:** Shapes are 87.5% larger than original design for improved visibility and gameplay. This includes rectangles (75-150 base size), squares (90-158), circles (45-90 radius), triangles (56-101 radius), and stars (56-90 radius).

**Shape Placement:** Advanced deterministic placement system with zero overlaps:
- **3-Phase Algorithm**: Spiral pattern → Grid-based → Corner placement (no random fallback)
- **Retry System**: 5 attempts with progressively smaller shapes (15% size reduction per retry)
- **Minimum Separation**: 30px between shape centers with strict collision detection
- **Deterministic Positioning**: Sorted grid positions by distance from preferred location
- **Overlap Prevention**: Enhanced algorithm ensures no shape overlaps within layers
- **Minimal Fallback**: Creates 20px circle only if all placement attempts fail

**Screw Placement:** Advanced multi-stage placement algorithm with shape-specific positioning:
- **Smart Positioning**: Corners, edge centers, and shape center as fallback positions
- **Minimum Separation**: 48px between screws (4x screw radius) for optimal spacing
- **Area-Based Limits**: Dynamic screw count based on shape size (1-6 screws max)
- **Overlap Prevention**: Sophisticated algorithm ensures proper screw spacing
- **Shape-Specific Logic**: Different placement strategies for each shape type
- **Fallback System**: Graceful degradation for small shapes with limited space

## Mobile Optimizations

The game uses responsive canvas scaling with virtual game dimensions that scale to screen size. Touch handling prevents default browser behaviors and includes haptic feedback integration.

**Smart Touch Selection**: For mobile, the game prioritizes screws that match available container colors, then falls back to closest screw within touch radius (30px mobile, 15px desktop).

**Responsive Animations**: All fade animations work seamlessly across mobile and desktop with optimized performance.

## Code style

- Avoid using types `any` and `unknown`
- Always try to use proper types or type unions
- Try not to duplicate code, if multiple areas could benefit for some functionality reason about how it could best be shared.

## Save System

Full game state persistence using local storage, including:
- Matter.js physics bodies (serialized with position, velocity, constraints)
- Layer manager state with all active layers
- Screw animation states
- Container and holding hole contents

The game automatically resumes saved states on page load with proper physics body recreation.

## Matter.js Integration

**Physics Integration** uses collision groups to separate layers. Screws are implemented as Matter.js constraints between shapes and anchor points. The physics world includes sleep management to wake unsupported shapes and prevent floating objects.

**Enhanced Physics Properties:**
- **Reduced Air Friction**: 10x reduction in air friction (0.0005) for maximum natural swinging motion
- **Lower Constraint Damping**: Reduced from 0.1 to 0.02 for more realistic physics behavior
- **Gravity-Only Forces**: Manual forces removed when screws are removed - only gravity applies for natural motion
- **Shape Border Rendering**: Fixed rendering order to prevent border thickness changes when screws are removed

## Debug Features

- Debug mode (D key) shows physics outlines and performance metrics
- Save data inspection (I key) shows complete save structure
- Various debug commands (R: restart, G: game over, S: force save, C: clear save)

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

This prevents context overflow errors and ensures screenshots can be properly analyzed.

**Current State:**
- All systems now use the event-driven architecture
- Original tightly-coupled code has been removed
- Build passes successfully with no TypeScript errors
- Event system provides comprehensive debugging capabilities
- **Enhanced Physics**: 10x reduced air friction and lower damping for natural motion
- **Container Animations**: Smooth 0.5s fade-out/fade-in transitions when containers are replaced
- **Layer Fade-In**: New layers fade in over 1 second with ease-in-out curve
- **Improved Shape Placement**: Deterministic algorithm prevents shape overlapping within layers
- **Visual Polish**: Fixed shape border rendering and container fade opacity handling
- **Responsive Canvas**: Canvas dimensions dynamically adapt to viewport size
- **Fixed Screw Animations**: Screws now animate to correct container hole positions on all screen sizes
- **Uniform Rendering**: All screws use constants from UI_CONSTANTS for consistent appearance
- Ready for production use

