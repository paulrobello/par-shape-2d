# Things that need to be done

**Important** You must follow the TODO rules below.

## TODO Rules

- Just because lint and build pass does not mean an item is complete.
- Only address one item at a time.
- Items are in order of priority and should be addressed in the order they are presented.
- This game is not yet released and backwards compatability is not required. Do not create legacy compatability related logic, and remove any legacy compatability code that is no longer needed.

## Items

- Read `README.md` to understand the project requirements and specifications.
- Read `docs/game_event_flows.md` to understand the game event flow.
- Read `docs/game_architecture.md` to understand the game architecture.
- Create a refactor.md file to document any significant refactoring changes made to the codebase.
- Audit the codebase for any missing features or incomplete implementations based on the project requirements and specifications.
- Look for redundant or duplicate code that can be refactored, removed or moved to the shared library.
- Update or add comments and documentation to improve code clarity and maintainability.
- Update the documentation in the `docs` folder to ensure it is accurate and up-to-date.
- run `node scripts/size_report.js` from the root of the project to generate a size report. **Important:** Only run this after all code changes are complete and documentation has been updated.
- Commit the changes with a clear and concise commit message that describes the changes made. **Important:** Only commit after the documentation has been updated and size report has been run.