# Things that need to be done

**Important** You must follow the TODO rules below.

## TODO Rules

- Just because lint and build pass does not mean an item is complete. 
- Items should only be marked complete when the user has stated they are complete.
- Only address one item at a time.
- When the user says the item is complete, you can mark it as complete and commit the changes.
- Items are in order of priority and should be addressed in the order they are presented.

## Items

- Item 1: Audit and fix logic flows and event system and update documentation
  - Read the `README.md`, `game_architecture.md`, and `game_event_flows.md` to understand how the system is supposed to work.
  - If you see any discrepancies between the documentation and the code, fix the code.
  - When updating documentation create Mermaid diagrams where appropriate.
  - Do a full audit of the entire event system and ensure `game_event_flows.md` is up to date.
  - Do a full audit of logic flows for all systems / aspects of the game and update `game_architecture.md`.
  - Fix any bugs / race conditions / logic flow issues found.
  - If you find duplicate code, refactor it into a shared utility.
  - Look for "TODO's" / "FIXME's" / "Needs to be implemented" comments in the code and address them.
  - **IMPORTANT** Update documentation as needed when bugs are fixed or logic is changed.