# CLAUDE.md — working agreement

Guidance for any AI agent (Claude Code) working in this repo. Read this first.

## What this project is

**Pokespire** — a non-commercial, web-deployable Pokémon fan-game: a Slay-the-Spire-style
roguelike deckbuilder. Pick a captured Pokémon starter, traverse a branching map, fight
card battles, capture more Pokémon. The team-switch (for STAB + 18-type effectiveness) is
the core decision. Local saves (IndexedDB), PWA, "play anywhere" like Pokerogue.

## Where things live

- **`planning/`** — numbered plans (`NN_descriptive-name.md`). **When a plan is approved** (e.g. on exiting plan mode), it is immediately **numbered + renamed descriptively and moved into `planning/`**, then **kept alive for the entire session** — updated in place as decisions are made and tasks land (see the plan's own Session progress log). It is never left to go stale. The highest-numbered plan is the current living one; lower numbers are superseded history (banner-flagged).
- **`rules/`** — technical standards (how we build). Normative; follow them.
- **`wiki/`** — game design & theorycraft (why the game works this way).
- **`TODO.md`** — epoch-grouped task list. **`CHANGELOG.md`** — shipped changes (Keep a Changelog).
- **`src/`** — app code. See `rules/` for layering (pure game logic → Zustand → React).

## Conventions (do these without being asked)

### Git

- Commit messages use **gitmoji** (`✨`, `🐛`, `📦`, `💄`, `✅`, `📝`, `🔧`, …).
- Commits are **atomic and isolated** — **one task = one commit** (each `TODO.md` checkbox is a commit); config/deps separate from features.
- Only commit when the user asks. Never `--no-verify`.

### Hooks

- Husky `pre-commit` runs **lint-staged (Prettier + ESLint)**, then **`tsc` typecheck**, then the **full Vitest suite**. All must pass. No pre-push hook.

### Files & docs

- Root-level meta files are **CAPITALISED** (`README.md`, `LICENSE`, `CHANGELOG.md`, `TODO.md`, `CLAUDE.md`). Topic docs in `rules/`/`wiki/` stay lowercase.
- **Task workflow:** todo → done → **delete the task's line from `TODO.md`** → **append an entry to `CHANGELOG.md`**. Don't leave checked-off items in `TODO.md`; git history + `CHANGELOG.md` are the record. Keep the living plan (`planning/02_mvp-plan.md`) updated as you go.
- **No stray temp files.** Generated assets are committed; the scripts/throwaway that made them are not. Flag any placeholder asset in `TODO.md` so it gets replaced.
- **Asset tracking:** every committed binary asset (`public/sprites/**`, `public/fonts/**`, etc.) gets a row in [`ASSETS.md`](ASSETS.md) with its source URL, license, and refresh command — updated in **the same commit** that adds the asset, never deferred.

### Code

- Game logic is **pure & deterministic** (seeded RNG, no `Math.random`/`Date.now`/DOM in `src/game/`). Data-driven: new cards/items/statuses edit data files, not the reducer.
- Strict TypeScript (no `any`; zod at external boundaries). i18n every user-facing string (FR + EN). See `rules/typescript.md`, `rules/components.md`, `rules/state-management.md`.
- **Comments only when they earn it** — explain hard/unintuitive things or non-obvious info; never restate the code. See `rules/typescript.md` § Comments.

## Build / test commands

- `npm run dev` — app dev server (:5173). `npm run storybook` — component gallery (:6006). `npm run dev:all` — both at once (labeled).
- `npm run build` — typecheck + production build. `npm run typecheck` — `tsc` only.
- `npm test` — Vitest once. `npm run lint` — ESLint. `npm run format` — Prettier.

## Roadmap

Epoch-based: **v0 = MVP** (the named parts in `TODO.md`), then v1+ (more gens, special
forms, friendship meta, cloud sync). Currently in the **scaffold** part.
