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

The game features enhanced visual polish including configurable screw rotation animations (1-1.5 rotations per second), clean 4-point cross design, rounded polygon corners, and professional UI styling throughout.

## Shared Architecture

The codebase features a **comprehensive shared utilities framework** that eliminates code duplication and provides a robust foundation for all functionality:

```
src/shared/
├── utils/
│   ├── EasingFunctions.ts     # Comprehensive easing library with 24+ functions
│   ├── AnimationUtils.ts      # Animation state management and utilities
│   └── ...
├── styles/
│   ├── ButtonStyles.ts        # Polished button styling system
│   └── ...
└── rendering/
    ├── core/
    │   └── GeometryRenderer.ts # Enhanced with shadows and rounded corners
    └── ...
```

### Shared Event System

The **shared event system** (`src/shared/events/`) provides a unified, high-performance event infrastructure used by both game and editor:

- **SharedEventBus**: Core event bus with priority handling, loop detection, and performance tracking
- **BaseEventTypes**: Common event interfaces for physics, shapes, validation, and file operations
- **EventUtils**: Utilities for debugging, performance monitoring, and event flow analysis

### Shared Utilities Framework

The shared utilities provide comprehensive functionality:

- **EasingFunctions**: 24+ professional easing functions with type-safe enums and presets
- **ScrewRenderer**: Enhanced screw visualization with configurable rotation speeds and clean design
- **GeometryRenderer**: Advanced shape rendering with rounded polygon corners and visual effects
- **Constants**: Centralized configuration including animation speeds and rendering parameters

Both game and editor extend this shared foundation with their domain-specific events while reusing all common infrastructure. This eliminates duplicate event handling code and ensures consistent behavior across the application.

**Event Naming Convention**: All events follow `domain:action` or `domain:subdomain:action` format with colon separators (e.g., `screw:clicked`, `physics:body:added`, `editor:shape:created`).

## Animation & Polish System

The game features a **comprehensive animation and polish system** that provides smooth, professional-quality visual effects:

### Easing Functions Library (`src/shared/utils/EasingFunctions.ts`)

- **24+ easing functions** including cubic, back, elastic, bounce, and more
- **Type-safe** with `EasingFunctionName` enum for compile-time checking
- **Preset configurations** for common use cases (UI, game, physics animations)
- **Composite easing** support for complex multi-stage animations
- **Utility functions** for interpolation and custom easing creation

### Enhanced Button Styling (`src/shared/styles/ButtonStyles.ts`)

- **Modern visual effects**: shadows, highlights, gradients, hover states
- **Consistent design system** across all UI components
- **Multiple variants**: primary, secondary, success, danger, warning, info
- **Size options**: small, medium, large with proper touch targets
- **Accessibility-friendly** with proper focus indicators and contrast
- **Both inline styles and Tailwind classes** for maximum flexibility

### Canvas Rendering Polish (`src/shared/rendering/core/GeometryRenderer.ts`)

- **Enhanced shadow effects** with customizable blur, color, and offset
- **Glow effects** with multi-layer rendering for depth
- **Advanced rounded polygon system** with sophisticated quadratic curve algorithms
  - Full support for complex polygons (hexagons, octagons, stars, arrows, etc.)
  - Smart edge length detection to prevent over-rounding
  - Dual rendering paths: canvas drawing and Path2D generation
  - Debug controls via `DEBUG_CONFIG.logPolygonRounding`
- **Automatic corner radius** defaults: rectangles (4px), polygons (4px), previews (12px)
- **Performance optimized** with proper context management and batched operations

### Screw Animation System (`src/game/entities/Screw.ts`)

- **Spinning rotation effects** during collection and transfer with constant velocity
- **Smooth sine easing** for natural slow-fast-slow movement without overshoot
- **Precise targeting** ensures screws stop exactly at their destination holes
- **Visual feedback** with enhanced shadows and glows for active screws
- **Rotation state tracking** for proper rendering and physics integration

## Shape Rendering Architecture

The game uses a **multi-layered shape rendering system** that ensures consistent visual quality across all shape types:

### Rendering Pipeline
1. **Shape Entity** (`src/game/entities/Shape.ts`) - Generates rounded Path2D objects via `getPath2D()`
2. **Game ShapeRenderer** (`src/game/rendering/ShapeRenderer.ts`) - Converts game shapes to renderable format
3. **Shared ShapeRenderer** (`src/shared/rendering/components/ShapeRenderer.ts`) - Applies transforms and rendering
4. **GeometryRenderer** (`src/shared/rendering/core/GeometryRenderer.ts`) - Low-level shape drawing with polish

### Shape Type Support
- **Standard shapes**: circle, rectangle, polygon, capsule with automatic rounding
- **Named polygons**: triangle, pentagon, hexagon, heptagon, octagon
- **Custom shapes**: arrow, chevron, star, horseshoe with vertex-based rendering
- **All shapes** support rounded corners with appropriate radius values (10-12px)

### Key Features
- **Consistent corner rounding** across all polygon types
- **Physics-aware rendering** that matches Matter.js body vertices
- **Transform-based positioning** for optimal performance
- **Debug visualization** for development and troubleshooting

## Physics

**Physics** are provided by the Matter.js library with poly-decomp-es for accurate physics simulation.

## Screw Ownership System

The game implements a **robust ownership transfer system** for screws that ensures data integrity and prevents race conditions:

- **Single Owner Principle**: Each screw has exactly one owner at any time (`shape`, `container`, or `holding_hole`)
- **Immediate Ownership Transfer**: Ownership transfers when operations begin (not when animations complete)
- **Deletion Protection**: Only the current owner can delete/destroy a screw
- **Clean Architecture**: Eliminates complex cleanup logic through clear ownership rules

## Event Architecture

The game uses **120+ game events** and **40+ editor events** with comprehensive type safety. Key event flows include:

- **Game**: Screw removal flow, container management, level progression, physics integration, ownership transfers
- **Editor**: Shape creation, file management, physics simulation, drawing tools

See `docs/game_event_flows.md` and `docs/editor_event_flows.md` for detailed event flows and architectural decisions.

## Documentation and References

**Matter.js Documentation:** Comprehensive Matter.js API documentation is available in `docs/MatterJs_docs/` covering all physics engine components including Bodies, Engine, World, Constraints, Collision detection, and more. Refer to these docs when implementing physics features.

**Event Flow Documentation:** Complete event system documentation with mermaid diagrams in `docs/game_event_flows.md` and `docs/editor_event_flows.md`.

**Important:** Always update the documentation when changes are made to architecture, events, or logic.

