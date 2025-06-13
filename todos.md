# Things that need to be done

**Important** You must follow the TODO rules below.

## Rules
- Just because lint and build pass does not mean an item is complete. 
- Items should only be marked complete when the user has stated they are complete.
- Only address one item at a time.
- When the user says the item is complete, you can mark it as complete and commit the changes.
- Items are in order of priority and should be addressed in the order they are presented.

## Items

- Item 1: The screw transfer / collection system is not working correctly.
  - Read the `README.md` and `game_event_flows.md` to understand how the system is supposed to work.
  - Do a full audit of the entire event system and ensure `game_event_flows.md` is up to date.
  - Do a full audit of logic flows for all systems / aspects of the game and update `game_logic_flows.md`. Create Mermaid diagrams where appropriate.
  - Once all the system have been audited and the documentation is up to date, fix any bugs / race conditions / logic flow issues found focusing first on the screw transfer / collection system.
  - Update documentation as needed when bugs are fixed.