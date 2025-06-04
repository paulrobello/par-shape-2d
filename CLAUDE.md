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

## Workflow

- **Important:** After changes to code are complete verify them with `npm run lint && npm run build`, fix any errors found. Note you only need to run lint and build after code changes not documentation changes.
- Always update any documentation affected by changes.
- Always update documentation after lint and build passes and before commiting changes
- Commit the changes to the current branch with an applicable commit message.


## Architecture Overview

This is a 2D physics puzzle game built with Next.js, TypeScript, and Matter.js. The game follows a **clean event-driven architecture** with complete decoupling between systems for optimal maintainability and testing.

It has 2 parts, the game itself and a shape editor. The editor includes comprehensive dark mode support with automatic system preference detection, proper physics simulation reset functionality, aligned screw placement indicators, streamlined UI controls, and a complete shape creation system with drawing tools.

## Shared Architecture

The codebase features a **comprehensive shared utilities framework** that eliminates code duplication and provides a robust foundation for all functionality:

```
src/shared/
├── strategies/        # Screw placement strategy consolidation
├── physics/          # Physics engine consolidation  
├── validation/       # Data validation consolidation
├── utils/            # Constants and configuration consolidation
└── rendering/        # Rendering utilities consolidation
```

This shared architecture was built through a systematic 5-phase refactor that eliminated over 2,000 lines of duplicate code while maintaining zero breaking changes and complete TypeScript type safety.

## Physics

**Physics** are provided by the Matter.js library with poly-decomp-es for accurate physics simulation.

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

## Shape Editor

The Shape Editor includes a fully implemented drawing system for creating new shapes with all advanced tools. The UI features icon-based controls with organized groupings, toast notifications for user feedback, and a streamlined toolbar without the Select tool.