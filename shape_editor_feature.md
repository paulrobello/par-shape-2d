# Shape editor for par-shape-2d

## Overview

New route in nextjs app mounted at /editor

This route will be a sub app that will provide shape editing capabilities.

## Architecture

- TS files should be in or under the editor folder.
- Any code in the game typescript can be referenced or if there is some functionality that could moved to a shared folder to reduce duplication of code refactor as needed.
- An event base approach to keep systems decoupled as much as possible is prefered as this is the way the game is implemented and a good practice.

## Phase 1
- Create an editor_design.md document and keep it up to date with all architectural changes.
- Create an editor_event_flow.md document and keep it up to date with all event related changes.
### Functionality
- Save and Load JSON shape files and edit their properties. (Allow for drag and drop of shape json files to load, and download on save)
- Right side panel that allows for editing of the shapes properties using form elements applicable to the currently selected shape type.
- A playground area that will allow the shape to be generated and rendered as it would be in the game.
- There should be options to generate random values in the ranges specified by the shape definition or manually specify value in valid ranges.
- There should also be an option place screws in available screw slots, screw color does not matter, lets use red.
- If screw strategy is set to custom it should allow the adding and removing of screw slots by clicking on the shape in the playground.
- Simulation options for enabling physics to see how the shape handles screw constraints. Along with ability to pause / resume / reset world and shape.
- The playground should also have a debug view to visualize physics bodies and constraints

## Phase 2
### Functionality
- Allow for creating and editing shapes
- Depending on shape mode circle, polygon, etc provide shapes and tools to draw / build shapes for the game.
- Allow enabling snap to grid with configurable grid size (use small dots to render grid rather than lines)