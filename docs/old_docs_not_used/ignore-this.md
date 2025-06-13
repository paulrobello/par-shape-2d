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
* If the user requests you take a screenshot of the app, use the BrowserMCP server to navigate to the app URL **Important** WAIT for the user to tell you to proceed then take a screenshot.

## Screenshots

When taking screenshots using the Browser MCP server: **Only take a screenshot if the user requests it**


## Shape Editor

The Shape Editor includes a fully implemented drawing system for creating new shapes with all advanced tools. The UI features icon-based controls with organized groupings, toast notifications for user feedback, and a streamlined toolbar without the Select tool.