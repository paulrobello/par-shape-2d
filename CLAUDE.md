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

## Workflow

- **Important:** After changes to code are complete verify them with `npm run lint && npm run build`, fix any errors found.
- Update any documentation affected by the changes.
- Commit the changes to the current branch with an applicable commit message.
- Always update documentation after lint and build passes and before commiting changes

## Architecture Overview

This is a 2D physics puzzle game built with Next.js, TypeScript, and Matter.js. The game follows a **clean event-driven architecture** with complete decoupling between systems for optimal maintainability and testing.

It has 2 parts, the game itself and a shape editor. The editor includes comprehensive dark mode support with automatic system preference detection, proper physics simulation reset functionality, aligned screw placement indicators, streamlined UI controls, and a complete shape creation system with drawing tools.

## Matter.js Integration

**Physics Integration** uses collision groups to separate layers. Screws are implemented as Matter.js constraints between shapes and anchor points. The physics world includes sleep management to wake unsupported shapes and prevent floating objects.

**Complex Shapes**: Path-based shapes (arrow, chevron, star, horseshoe) use `Bodies.fromVertices()` with poly-decomp-es for accurate physics simulation. Original vertices are preserved separately for rendering to maintain visual accuracy.

## Documentation and References

**Matter.js Documentation:** Comprehensive Matter.js API documentation is available in `docs/MatterJs_docs/` covering all physics engine components including Bodies, Engine, World, Constraints, Collision detection, and more. Refer to these docs when implementing physics features.

**Important:** Always update the documentation when changes are made to architecture, events, or logic.

## Technical Design Documents

A comprehensive technical design documents are available in the `docs` docs which provide:

- Detailed architecture breakdown with system diagrams
- Complete file structure mapping with functionality descriptions
- In-depth game mechanics documentation
- Technical implementation details and decisions
- Performance considerations and optimizations
- Mobile support strategies

**Important:** When making architectural changes to the codebase, always update the design documents to reflect the current implementation.

**Important:** When making changes to event systems, always update the event_flow document to reflect the current implementation.

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

## Shape Editor - Complete Phase 2 Drawing System

The Shape Editor includes a fully implemented drawing system for creating new shapes with all advanced tools:

### Drawing Architecture
- **Tool-based System**: Modular architecture with `BaseTool` abstract class for all drawing tools
- **State Management**: Multi-step drawing workflows managed by tool-specific state machines
- **Grid System**: Configurable grid with visibility toggle and snap-to-grid functionality
- **Preview System**: Real-time preview rendering with consistent styling across all tools
- **Mode Switching**: Clean separation between "edit" mode (Phase 1) and "create" mode (Phase 2)

### Event System Extension
The editor event system has been extended from 27 to 39 events to support drawing operations:
- **Drawing Tool Events**: Tool selection, drawing state changes, preview updates
- **Grid System Events**: Grid visibility, size changes, snap toggle, coordinate snapping

### Implemented Drawing Tools (Complete)
- **SelectTool**: Default tool that activates "edit" mode for Phase 1 functionality
- **CircleTool**: Center → radius workflow with real-time preview
- **RectangleTool**: Corner → corner workflow with minimum size validation
- **PolygonTool**: Center → radius workflow with configurable sides (3-12 range)
- **CapsuleTool**: Three-step workflow (end → end → thickness) with complex preview
- **PathTool**: Multi-point workflow with path closing detection and visual feedback

### Working with Drawing Tools
When implementing new drawing tools:
1. Extend `BaseTool` abstract class and implement all required methods
2. Use the tool's state machine to manage multi-step workflows
3. Emit appropriate events at each drawing stage
4. Leverage `PreviewRenderer` utility for consistent visual feedback
5. Integrate with `GridManager` for coordinate snapping
6. Register the tool with `DrawingToolManager`

### Coordinate System
- All drawing operations use logical canvas coordinates
- Grid snapping is applied through `GridManager.snapToGrid()`
- High-DPI displays are properly handled with coordinate transformation
- Preview rendering uses consistent coordinate system across all tools

### Dimension Handling
- **Dual Format Support**: Dimensions can be either `number` (fixed) or `{min, max}` (random)
- **PropertyPanel Logic**: Automatically adapts form fields based on dimension type and data format
- **Type Conversion**: Switching between fixed/random automatically converts values with sensible defaults
- **Form Field Behavior**: Fixed dimensions show single input, random dimensions show min/max inputs
- **Value Validation**: All dimension changes respect min/max constraints and shape-specific rules