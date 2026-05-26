# TypeScript

## Compiler

`strict` is on, plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
`noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`. Do not weaken these.

## Rules

- **No `any`.** Use `unknown` + narrowing, generics, or a precise type. ESLint enforces this.
- **Validate external data with zod.** Everything from PokéAPI or a loaded save file passes through a zod schema before entering app state. Internal data (our own `cards.ts`, etc.) is trusted and typed directly.
- **`noUncheckedIndexedAccess` consequences.** `array[i]` and index-signature access (including CSS-module classes) are `T | undefined`. Handle the `undefined`, don't `!` it away in game logic. For UI components that forward a className/style, declare the prop as `string | undefined` so `exactOptionalPropertyTypes` accepts a possibly-undefined CSS-module class.
- **`import type`** for type-only imports (required by `verbatimModuleSyntax`).
- **Discriminated unions** for actions, effects, and node types — switch on the `kind`/`type` tag with an exhaustive `default: never` check.
- **Branded types** for IDs where confusion is likely (`DexId`, `CardId`).
- **Path alias** `@/` → `src/`.

## Comments

Write comments **only** when they earn their place: to explain something hard or
unintuitive, or to record information that isn't obvious from the code itself (a hidden
constraint, a subtle invariant, a balance rationale, a workaround for a specific bug).

- **Never restate the code.** `// loops over the team` above a `for` loop, or a JSDoc that
  just renames the component, is noise — delete it. Good names replace those comments.
- Prefer a clear name or a small function over a comment that explains a confusing one.
- The damage/capture formulas and the type chart are the exception: a short note tying a
  constant back to its design rationale (and the `wiki/` doc) is worth keeping.
