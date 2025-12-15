# Repository Guidelines

## Project Structure & Module Organization
- `src/app` – Next.js App Router pages, layout, and global styles.
- `src/components` – UI components (e.g., `game/GameCanvas.tsx`).
- `src/game` – Game core, systems, events, and utilities (Matter.js).
- `src/editor` – Shape editor mode (tools, managers, UI).
- `src/shared` – Shared constants, types, and helpers.
- `docs` – Architecture, event flows, migration notes.
- `test_shapes` – JSON fixtures used for manual testing.
- `public` – Static assets.  `scripts/` – Dev utilities (e.g., `size_report.js`).

## Build, Test, and Development Commands
- `npm run dev` – Start local dev server (Turbopack) on 0.0.0.0. Note: in headless/CI, `dev`/`start` can hang; validate via lint+build.
- `npm run build` – Production build. Run after changes to verify.
- `npm start` – Serve production build (local usage only).
- `npm run lint` – ESLint (Next core‑web‑vitals + TS). Fix before PR.
- `node scripts/size_report.js` – Generate `size_report.md` for `src/` sizes.
- `uv run count_console_logs.py` – Example Python utility execution (uses `uv`).

## Coding Style & Naming Conventions
- TypeScript (strict), 2‑space indent; avoid `any`/`unknown`.
- ESLint via `eslint.config.mjs`; fix before PR.
- Imports: `@/*` alias (`tsconfig.json`). Prefer named exports; keep files focused.
- Naming: components PascalCase; APIs/vars `camelCase`; constants `UPPER_SNAKE_CASE`.
- Shared utilities: use `DebugLogger`, `HapticUtils`, `ANIMATION_CONSTANTS`, `UI_CONSTANTS`; gate logs behind `DEBUG_CONFIG`. Check `src/shared` before adding new helpers.
- Events: type new events and document them in `docs/`.

## Testing Guidelines
- No formal test runner yet. Use manual scenarios + fixtures in `test_shapes/`.
- Run dev, enable debug: press `D`. Useful keys: `C` (complete), `G` (game over),
  `R` (restart), `Shift+Click` (force screw removal).
- If adding tests, colocate as `*.test.ts` next to the module and keep pure logic
  under `src/shared` or `src/game/utils` for easy coverage later.

## Commit & Pull Request Guidelines
- Use Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:` (see history).
  Example: `feat(editor): add grid snapping to draw tool`.
- Before opening a PR: run `npm run lint && npm run build`.
- PRs must include: concise description, linked issues (`Closes #123`),
  screenshots/video for UI, manual test steps, and linter clean.
- Update docs for architectural or event changes (`docs/*`). Keep PRs small and focused.

## Security & Configuration Tips
- `next.config.ts` has `allowedDevOrigins`; update cautiously and justify changes.
- Avoid large binaries in Git; place lightweight assets in `public/` and reference them.

## Architecture Notes
- Event‑driven design (120+ game, 40+ editor events) with shared utilities in `src/shared/`; physics via Matter.js + `poly-decomp-es`.
- Mobile canvas uses actual viewport (`100vw × 100vh`) with robust device detection and correct render ordering (HUD then shapes/screws).
