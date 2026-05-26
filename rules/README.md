# Rules — technical standards

These documents define **how we build** Pokespire: coding standards, architecture
invariants, and best practices. They are normative — code review should reference them.

Game design and theorycraft live separately in [`../wiki/`](../wiki/).

## Index

- [testing.md](testing.md) — what to test, how, coverage expectations.
- [components.md](components.md) — React component design, SOLID, composition.
- [state-management.md](state-management.md) — Zustand patterns, pure-reducer invariants.
- [typescript.md](typescript.md) — strict mode, no `any`, zod at boundaries.
- [css-modules.md](css-modules.md) — styling conventions, tokens, mobile-first.
- [data-loading.md](data-loading.md) — PokéAPI client, retry, caching.
- [pwa.md](pwa.md) — service worker scope and cache strategies.
- [git-workflow.md](git-workflow.md) — branches, commits, hooks.

## Core principles

1. **Game logic is pure.** The combat reducer and damage/capture math take state in and return state out — no `Math.random`, no `Date.now()`, no DOM. RNG is injected from a seed.
2. **Data-driven, not code-driven.** Adding a card/item/status edits a data file, never the reducer.
3. **Strict types end-to-end.** `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` are on. External data is validated with zod at the boundary.
4. **Determinism.** Same seed + same inputs → same run. This is what makes saves resumable and bugs reproducible.
