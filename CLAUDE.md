# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Development Commands

- `npm run build` - Build for production (use this to verify changes)
- `npm run lint` - Check code quality
- `npm run dev` - Start dev server (don't run this, it hangs)
- `npm start` - Start production server (don't run this, it hangs)

## Code Style

- Use proper TypeScript types, avoid `any` and `unknown`
- Check for existing shared functionality before creating new features
- Use shared utilities: DebugLogger, HapticUtils, ANIMATION_CONSTANTS, UI_CONSTANTS
- Add debug logging behind DEBUG_CONFIG gates
- Prefer shared resources for game/editor common functionality

## Workflow

- **Important:** Run `npm run lint && npm run build` after code changes. You do not need to run lint and build for documentation changes.
- ALWAYS update documentation when making architectural or event related changes
- Commit changes with descriptive messages
- Use `uv run` for Python scripts

## Project Overview

2D physics puzzle game with shape editor built on Next.js, TypeScript, and Matter.js. Features event-driven architecture with shared utilities framework.

**Core Architecture:**
- Event-driven system with 120+ game events, 40+ editor events
- Shared utilities in `src/shared/` (rendering, animation, haptics, debugging)
- Matter.js physics with poly-decomp-es
- Mobile-optimized UI with dynamic HUD system and full viewport canvas coverage

## Documentation

- `docs/game_architecture.md` - Detailed system documentation
- `docs/game_event_flows.md` & `docs/editor_event_flows.md` - Event flows
- `docs/MatterJs_docs/` - Physics API reference
