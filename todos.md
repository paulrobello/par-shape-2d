# Things that need to be done

**Important** You must follow the TODO rules below.

## TODO Rules

- Just because lint and build pass does not mean an item is complete. 
- Items should only be marked complete when the user has stated they are complete.
- Only address one item at a time.
- When the user says the item is complete, you can mark it as complete and commit the changes.
- Items are in order of priority and should be addressed in the order they are presented.
- This game is not yet released and backwards compatability is not required Do not create legacy compatability related logic, and remove any legacy compatability code that is no longer needed.
- Read `README.md` to understand the project requirements and specifications.
- Read `game_event_flow.md` to understand the game event flow.
- Read `game_architecture.md` to understand the game architecture.

## Items

- Item 1: new layers should fade in behind existing visible layers, current they are just appearing in front of existing layers.
- Item 3: screw blocking overlap seems to only be using bounding boxes for shapes which is not accurate enough, bounding box can be used as a first pass optimization but it should be using the physics body shapes to determine if the screw is blocked or not.
- Item 2: when the last of the container boxes are removed and no new ones are needed, they are leaving the screws on the screen even after the container box is gone.
