# CLAUDE.md — working agreement

Guidance for any AI agent (Claude Code) working in this repo. Read this first.

## What this project is

**Pokespire** — a non-commercial, web-deployable Pokémon fan-game: a Slay-the-Spire-style
roguelike deckbuilder. Pick a captured Pokémon starter, traverse a branching map, fight
card battles, capture more Pokémon. The team-switch (for STAB + 18-type effectiveness) is
the core decision. Local saves (IndexedDB), PWA, "play anywhere" like Pokerogue.

## Where things live

- **`planning/`** — numbered plans (`NN_name.md`). `02_mvp-plan.md` is the **living plan**; keep it updated _during_ each session to trace decisions and progress. Lower numbers are superseded history.
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

- Husky `pre-commit` runs **lint-staged (Prettier + ESLint)** then the **full Vitest suite**. Both must pass. No pre-push hook.

### Files & docs

- Root-level meta files are **CAPITALISED** (`README.md`, `LICENSE`, `CHANGELOG.md`, `TODO.md`, `CLAUDE.md`). Topic docs in `rules/`/`wiki/` stay lowercase.
- Update the living plan, `TODO.md`, and `CHANGELOG.md` as part of doing the work — not as an afterthought.
- **No stray temp files.** Generated assets are committed; the scripts/throwaway that made them are not. Flag any placeholder asset in `TODO.md` so it gets replaced.

### Code

- Game logic is **pure & deterministic** (seeded RNG, no `Math.random`/`Date.now`/DOM in `src/game/`). Data-driven: new cards/items/statuses edit data files, not the reducer.
- Strict TypeScript (no `any`; zod at external boundaries). i18n every user-facing string (FR + EN). See `rules/typescript.md`, `rules/components.md`, `rules/state-management.md`.
- **Comments only when they earn it** — explain hard/unintuitive things or non-obvious info; never restate the code. See `rules/typescript.md` § Comments.

## Build / test commands

- `npm run dev` — dev server. `npm run build` — typecheck + production build.
- `npm test` — Vitest once. `npm run lint` — ESLint. `npm run format` — Prettier.

## Roadmap

Epoch-based: **v0 = MVP** (the named parts in `TODO.md`), then v1+ (more gens, special
forms, friendship meta, cloud sync). Currently in the **scaffold** part.
