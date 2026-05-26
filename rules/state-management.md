# State management

## Layers

1. **Pure game logic** (`src/game/`) — plain functions: `reducer(state, action) => state`, `calcDamage(...)`, etc. No React, no Zustand, no side effects, no RNG except an injected seeded generator.
2. **Zustand stores** (`src/store/`) — hold app/UI state and the current run/meta. Stores call into the pure logic and persist results.
3. **Side-effect middleware** — animation/FX, sound, and persistence react to dispatched actions. Never put timers or float-text state inside the reducer.

## Invariants

- The combat reducer is **pure and deterministic**. Given the same `RunState.seed` and action sequence, it always produces the same result. This is what makes mid-combat save/resume exact.
- RNG comes from a seeded `mulberry32` stored on `RunState`. Never call `Math.random()` in game logic.
- **FX state is separate** from game state (`fxSlice`). Combat truth never depends on whether an animation has finished.
- Serialization is plain `JSON.stringify` — state holds no functions, class instances, or DOM refs.

## Selectors

Derived UI data (live computed card damage, capture %) lives in `selectors.ts` as pure
functions of state. Components subscribe to slices, not the whole store, to limit re-renders.
