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