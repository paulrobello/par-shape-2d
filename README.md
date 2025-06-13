# PAR Shape 2D

## About
This is a 2D physics game where you must remove screws from shapes in order clear them from the screen.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.


## Gameplay

* The objective is to clear all container boxes by filling them with screws of the corresponding color.
* All game rendering takes place in an HTML Canvas element.
* The top of the canvas has a HUD.
* The first line of the HUD should be a progress bar that shows the current screw progress and percent complete.
* The 2nd line of the HUD should have screws remaining count.
* The 3rd line of the HUD should be level number
* The 4th line of the HUD should have the current level score
* After completing a level, increment the level number and reset the current level score to 0 and generate a new playing area.
* Below the 4th line of the HUD is a set of 4 container boxes each with 1 to 3 holes in them.
* The number of holes in each container box is determined by the number of screws remaining of the corresponding color in both shapes and holding holes up to 3.
* Each container box has a color and is associated with a specific screw color.
* When a screw is removed, it flies to the container box that matches its color, that has an empty hole and has the most holes filled.
* When a container box is full, it should delay for 1 second then fade out. 
* Each screw removed with the container box adds to the screw progress tracking and adds to the current level score. If the level is completed, the score is added to the game total score.
* When a container box is removed a new container box if needed should fade in with random color selected from screw colors that are in visible shapes or holding holes.
* Under the row of container boxes is a row of 5 empty holding holes that are used to hold screws that get removed from shapes but do not match any of the container boxes.
* When a new container box is added, if any screws are in the holding holes, they should be moved to the new container box if it has an empty hole that matches their color.
* When all holding holes are full, the player has 5 seconds to try and free up a holding hole or they loose the game and must restart the current level.
* Screws when moving to a holding hole or container box should reserve their target hole so no other screws can move to that hole.
* Under the row of holding holes is shape area
* The shape area is a stack of layers that contain shapes.
* Each level has 10 or more layers but only 4 are visible at a time.
* The number of layers is computed as 10 + floor(level number / 3).
* 6 shapes are loaded into each layer.
* 1 to 10 screws are loaded into each shape depending on shape and size.
* Shapes physics only interact with the layer they are in.
* The screws in the shape should not overlap with each other or the edge of the shape itself. Use a margin of 5 pixels from the edge of the shape or other screws.
* When all screws are removed from a shape, it is allowed to fall from the screen and is removed from the layer once off-screen.
* All shapes in a layer should have the same tint to indicate they are part of the same layer.
* Shapes should have a solid border with a translucent inner area to allow the player to see the shapes behind them.
* Shapes can be any of the following: rectangle, square, circle, polygon, capsule, star, arrow, chevron, horseshoe.
* Shapes when placed in the layer should not overlap.
* A screw can not be removed if it is even partially blocked by a shape in a layer that is visually in front of its layer.
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

* Screws should fly to their destination container box or holding hole when removed.
* If a blocked screw is clicked, it should shake to indicate it cannot be removed.
* The shake animation lasts 300ms with alternating horizontal/vertical oscillations.
* Mobile devices provide haptic feedback (50ms vibration) when blocked screws are clicked.
* The progress bar should animate smoothly when updated.

## Graphics

* Use HTML Canvas for rendering the game.
* Layers should be rendered back to front so the transparency of shapes allows the player to see the shapes behind them.
* Shapes should be rendered with a solid border and a translucent inner area.
* Generate the shape graphics using a combination of HTML Canvas drawing functions.
* Select points on the shapes for screw holes based on the shape type and size. Draw small transparent circles with solid borders at these points to represent the screw holes.
* Screws should be rendered as small circles with a solid color and a small border. They should also have have a little x in the center to represent the screw head.

## Mobile Support

* The game should be playable on mobile devices.
* Use touch events to allow the player to remove screws by tapping on them.
* If more than 1 unblocked screws are within the touch area, select the screw that matches the color of the container box that has an empty hole.
* Ensure the game is responsive and works well on different screen sizes.
* Use a mobile-friendly UI for the game controls and information display.
* Ensure the game is playable with one hand, as the player may need to hold their device with one hand while playing.
* Haptic feedback should be provided when a screw is removed or a container box is filled.

## Technical Architecture

This project features a comprehensive shared utilities framework that provides:

- **Event-driven architecture** with complete system decoupling
- **Shared utilities ecosystem** eliminating code duplication across game and editor
- **TypeScript type safety** throughout the entire codebase
- **Comprehensive physics integration** with Matter.js
- **Advanced rendering system** with multi-mode support
- **Robust validation framework** for all data operations

The architecture includes both a gameplay mode and a shape editor for creating custom shapes.

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
