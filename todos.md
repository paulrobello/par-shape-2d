# Things that need to be done

**Important** Keep documentation up to date then commit as each item is completed. Items are NOT considered complete until verified by the user. Only address one item at a time. 

Items are in order of priority and should be addressed in the order they are in.

## Items

### Item 1 - Invisible shapes and their screws

There is a situation where towards the end of a level there are no more shapes on the screen however the progress area shows there are still screws to be collected.

There are 10 layers and only the first 4 are visible at first, as the user clears layers more hidden layers are reviled.

The debug shows there is 1 active layer remaining with active shapes and screws however nothing is visible.

This means that their are shapes that are not being rendered or are being placed outside the visible area.

Please investigate shape creation/placement/rendering and look for why the remaining shapes are not visible.