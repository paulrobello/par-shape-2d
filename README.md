# PAR Shape 2D

## About
This is a 2D physics game where you must remove screws from shapes in order clear them from the screen.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.


## Gameplay

### Getting Started

* The game displays a start screen with clear instructions on the objective and controls
* **Click or tap anywhere on the start screen to begin** - auto-start has been disabled for better user control
* The start screen provides essential gameplay information:
  - 🎯 **Objective:** Remove screws to clear all container boxes
  - 🔧 Tap screws to remove them from shapes
  - 🎨 Screws fly to matching colored containers
  - ⚠️ Blocked screws will shake - remove blocking shapes first
  - 🎯 **Smart Selection:** All screws have full touch radius with slight preference for actionable screws
  - 🏆 Fill all containers to complete the level

### Core Gameplay

* The objective is to clear all container boxes by filling them with screws of the corresponding color.
* All game rendering takes place in an HTML Canvas element.

## HUD Layout

* The top of the canvas contains a comprehensive HUD (Heads-Up Display) that includes all UI elements:
  * **Progress Bar** (Line 1): Shows current screw collection progress and percentage complete
  * **Screws Remaining** (Line 2): Displays count of screws still to be collected
  * **Level Number** (Line 3): Current level being played
  * **Current Score** (Line 4): Score for the current level
  * **Container Boxes** (Line 5): Set of up to 4 colored container boxes with 1-3 holes each
  * **Holding Holes** (Line 6): Row of 5 temporary storage holes for unmatched screws
  * **Menu Button**: Located in top-right corner for game controls
* The HUD dynamically calculates its height based on content and extends to the bottom of holding holes plus 5px margin
* After completing a level, increment the level number and reset the current level score to 0 and generate a new playing area.

## Container Boxes

* Container boxes are positioned in the HUD area and serve as collection targets for screws
* The number of holes in each container box is determined by the number of screws remaining of the corresponding color in all shapes (across all layers, visible or not) and holding holes, up to 3 holes maximum.
* Each container box has a color and is associated with a specific screw color.
* When a screw is removed, it flies to the container box that matches its color, that has an empty hole and has the most holes filled.
* When a container box is full, it should fade out over 500ms (0.5 seconds). 
* Each screw removed with the container box adds to the screw progress tracking and adds to the current level score. If the level is completed, the score is added to the game total score.
* When a container box is removed a new container box if needed should fade in at the same position with color selected from screw colors that are in visible shapes or holding holes only.

## Holding Holes

* Holding holes are located in the HUD area below container boxes
* Row of 5 empty holding holes that are used to hold screws that get removed from shapes but do not match any of the container boxes.
* When a new container box is added, if any screws are in the holding holes, they should be moved to the new container box if it has an empty hole that matches their color.
* When all holding holes are full, the player has 5 seconds to try and free up a holding hole or they loose the game and must restart the current level.
* Screws when moving to a holding hole or container box should reserve their target hole so no other screws can move to that hole.

## Shape Area

* Below the HUD is the shape area which starts immediately after the holding holes
* The shape area is a stack of layers that contain shapes.
* Each level has 10 or more layers but only 4 are visible at a time.
* The number of layers is computed as 10 + floor((level - 1) / 3).
* 6 shapes are loaded into each layer.
* 1 to 10 screws are loaded into each shape depending on shape and size.
* Shapes physics only interact with the layer they are in.
* The screws in the shape should not overlap with each other or the edge of the shape itself. Use appropriate margins from the edge of the shape or other screws for optimal placement.
* When all screws are removed from a shape, it is allowed to fall from the screen and is removed from the layer once off-screen.
* All shapes in a layer should have the same tint to indicate they are part of the same layer.
* Shapes should have a solid border with a translucent inner area to allow the player to see the shapes behind them.
* Shapes can be any of the following: circle, capsule, arrow, chevron, star, triangle, square, rectangle, pentagon, hexagon, heptagon, octagon, horseshoe (currently disabled).
* Shapes when placed in the layer should not overlap.
* A screw can not be removed if it is blocked by a shape in a layer that is visually in front of its layer, using precise geometric collision detection.
* Screws from any visible layer can be removed as long as they are not blocked.
* Screws should be randomly colored but must be one of the following colors: pink, red, green, blue, light blue, yellow, purple, orange, or brown.
* If a blocked screw is clicked, it should shake to indicate it cannot be removed.
* When all shapes are removed from a layer, if there are any more layers remaining the next layer should fade in and the player can continue removing screws from shapes.
* All layers should be generated at start of the level so the total number of screws and number of each color of screw in the level is known.

## Physics

* This project uses [Matter.js](https://brm.io/matter-js/) for physics simulation.
* Read the docs located in `./docs/MatterJs_docs` to fully understand how to use the physics engine.
* Shapes are rigid bodies with low friction and can collide with each other in their layer.
* Screws are constraints that are attached to the shapes and can be removed by the player.
* Screws should only interact with the shape they are attached to.
* If a shapes only has one screw in it, the shape is allowed rotate around the screw.

## Animation

* **Screw Collection**: Smooth sine-wave easing for screw movement using ANIMATION_CONSTANTS.collection (800ms)
* **Screw Spinning**: Enhanced rotation effects during collection with constant velocity
* **Blocked Screw Feedback**: Configurable shake animation using ANIMATION_CONSTANTS.shake (300ms duration, 8 oscillations, 3px amplitude) with alternating horizontal/vertical movement
* **Haptic Integration**: HapticUtils patterns synchronized with animations for enhanced feedback
* **Progress Bar**: Smooth animated transitions with configurable easing functions from EasingFunctions
* **Container Transitions**: Professional fade in/out animations using ANIMATION_CONSTANTS.container.fadeDuration (500ms)
* **Level Completion Effects**: Spectacular burst and sparkle animation system:
  - **Duration**: ANIMATION_CONSTANTS.levelCompletion.burstDuration (5.5 seconds) - optimized to fade out before 6s overlay
  - **Burst Particles**: 25 optimized radial particles with easeOutCubic motion and single-layer glow effects
  - **Sparkle Effects**: 50 performance-optimized twinkling particles with random positioning and phase offsets
  - **Wave Text Animation**: Large green "COMPLETE" text with per-letter wave motion (48px font, 20px amplitude)
  - **Timing Phases**: Staggered fade-out (text: 4.5s, sparkles: 5.0s, burst: 5.5s) for clean overlay transition
  - **Performance**: Single-layer glow rendering and early opacity culling for smooth 60fps animation
  - **Trigger**: Automatically starts when last container box is removed
  - **Haptic Feedback**: Extended celebration pattern for level completion
* **Visual Polish**: Enhanced shadows, glows, and rounded corners throughout UI

## Graphics

* Use HTML Canvas for rendering the game.
* Layers should be rendered back to front so the transparency of shapes allows the player to see the shapes behind them.
* Shapes should be rendered with a solid border and a translucent inner area.
* Generate the shape graphics using a combination of HTML Canvas drawing functions.
* Select points on the shapes for screw holes based on the shape type and size. Draw small transparent circles with solid borders at these points to represent the screw holes.
* Screws should be rendered as small circles with a solid color and a small border. They should also have have a little x in the center to represent the screw head.

## Mobile Support

* **Full Viewport Canvas**: Dynamic canvas sizing that fills entire mobile viewport without gaps
  - **CSS Viewport Units**: Canvas uses `100vw × 100vh` for complete screen coverage
  - **Dynamic Virtual Dimensions**: Virtual coordinate system adapts to actual mobile screen size
  - **1:1 Rendering**: Optimized 1:1 pixel mapping on mobile for best performance
  - **No Empty Space**: Eliminates gaps at top/bottom of mobile screens
* **Start Screen Interaction**: Touch-friendly start screen with tap-to-start functionality and responsive font sizing
* **Touch Controls**: Optimized touch events with intelligent multi-touch screw selection
* **Smart Screw Selection**: All screws respond within full touch radius; slight preference for non-blocked screws when very close
* **Container Priority Selection**: When multiple screws are in touch area, prioritizes screws matching available container colors
* **Adaptive Touch Radius**: Consistent interaction radius (30px for mobile, 15px for desktop) for all screws
* **Dynamic HUD Layout**: HUD automatically calculates height based on content for optimal mobile compatibility
  - Progress bar, text, containers, and holding holes all contained within HUD area
  - Shape area starts immediately after HUD with proper margin
  - Maximizes available gameplay space on mobile devices
  - **Mobile-Optimized Background**: HUD and shape areas fill entire canvas height
* **Haptic Feedback**: Comprehensive vibration feedback system via HapticUtils:
  - **Success**: 50ms vibration for screw removal
  - **Blocked**: 50ms vibration for blocked screw attempts  
  - **Container Filled**: [100, 50, 100] celebration pattern
  - **Level Complete**: [100, 50, 100, 50, 150] extended celebration
  - **Game Over**: [200, 100, 200] distinct pattern
* **Mobile Menu System**: Canvas-rendered menu accessible via HUD menu button
  - Tap anywhere on the paused overlay to resume gameplay
  - Clear visual instructions for mobile users
* **Responsive Design**: Scales perfectly across all screen sizes and orientations
* **One-Handed Play**: Optimized for single-handed mobile gameplay
* **Robust Device Detection**: Uses both screen width and user agent detection for reliable mobile identification

## Technical Architecture

This project features a **clean event-driven architecture** with comprehensive shared utilities:

### Core Systems
- **Event-Driven Design**: 120+ game events, 40+ editor events with complete type safety
- **Modular Architecture**: Clean separation between GameManager modules for maintainability
- **Physics Integration**: Matter.js with proper pause/resume, boundaries, and precise geometric collision detection
- **Shared Framework**: Comprehensive shared utilities framework including:
  - **HapticUtils**: Centralized haptic feedback for mobile devices
  - **DebugLogger**: Structured debug logging with conditional output
  - **ANIMATION_CONSTANTS**: Centralized animation timing configuration
  - **UI_CONSTANTS**: Consistent input radius and interface values

### Key Features
- **Mobile-First**: Complete touch support with intelligent multi-selection
- **Professional UI**: Modern button styling, shadows, highlights, and responsive design
- **Animation System**: 24+ easing functions with smooth transitions throughout
- **Rendering Engine**: Multi-layer canvas system with rounded polygons and visual effects
- **Physics Pause**: Proper game pause when menu is shown - physics simulation actually stops

### Dual Modes
- **Game Mode**: Full physics puzzle gameplay with progressive difficulty and React overlay start screen
- **Shape Editor**: Comprehensive creation tools with real-time physics simulation

### User Experience
- **Professional Onboarding**: React overlay start screen with clear game instructions and objectives
- **User-Initiated Gameplay**: Click-to-start functionality replaces auto-start for better user control
- **Cross-Platform Design**: Start screen optimized for both desktop click and mobile tap interactions
- **Mobile Optimized**: Responsive typography and proper z-index layering for full mobile compatibility

The architecture ensures scalability, maintainability, and professional polish throughout.

## Debug Mode

Debug mode provides developers with testing tools and visual feedback:

### Enabling Debug Mode
- Press **D** to toggle debug mode on/off
- Debug mode shows additional information in the debug panel
- Debug instructions appear in the pause menu when enabled

### Debug Keys (only work when debug mode is enabled)
- **C** - Complete Level: Triggers the level completion sequence immediately  
- **G** - Game Over: Triggers the game over sequence
- **R** - Restart: Restarts the current level
- **Shift + Click** - Force Screw Removal: Bypasses collision detection to remove any screw

### Debug Features
- Visual debug panel showing game state information
- Collision detection bypass for testing
- Event flow logging (when enabled in DEBUG_CONFIG)
- Level completion effects logging (DEBUG_CONFIG.logLevelCompletionEffects)
- Performance monitoring and metrics
- Comprehensive debug flags for all system components

## Development

```bash
npm install          # Install dependencies
npm run build        # Build for production
npm run lint         # Check code quality
npm run dev          # Start development server
```

## More Information 

* Read all files in the `docs` folder including looking at any images
* Check `CLAUDE.md` for development guidelines and patterns
