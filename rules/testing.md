# Testing

Runner: **Vitest** + **React Testing Library** (jsdom). Setup in `src/test/setup.ts`.

## What to test (priority order)

1. **Pure game logic — exhaustively.** `damage.ts`, `capture.ts`, `reducer.ts`, `typeChart.ts`, `growthCurves.ts`, evolution triggers, map generation. These are the correctness anchors; table-driven tests with worked examples from the wiki.
2. **Determinism.** Same seed + action list → identical state. A regression here breaks save/resume.
3. **Selectors.** Live computed card damage matches the formula across STAB / super / immune cases.
4. **Components — behavior, not markup.** Query by role/text (as a user would), assert behavior. Don't snapshot styling.

## Conventions

- Test files: `*.test.ts(x)` colocated with the unit.
- Name tests by behavior: `it('applies STAB when card type matches attacker')`.
- Prefer real implementations over mocks; only mock true boundaries (network in `pokeapi.ts`).
- A bug fix ships with a test that fails before the fix.

## Commands

- `npm test` — run once (CI / pre-push).
- `npm run test:watch` — watch mode during development.
