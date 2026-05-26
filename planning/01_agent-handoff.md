# Pokespire — Agent Handoff

> **⚠️ SUPERSEDED — historical record.** The living plan is [02_mvp-plan.md](02_mvp-plan.md).
> Kept for traceability; references to `PLAN.md`/`HANDOFF.md` paths below are pre-reorg.

> This file is a pointer for any AI agent (or human) picking up Pokespire mid-flight. **The full plan lives at [`PLAN.md`](PLAN.md) in the repo root** — read it top to bottom before doing anything. This file is a one-page summary so you don't get lost if you found the repo first.
>
> **New machine? Resuming from another computer?** Just `git pull` and read `PLAN.md` + `HANDOFF.md`. If you want plan mode to treat `PLAN.md` as its working plan, ask the agent to load it at the start of the session — Claude's plan mode otherwise creates a fresh plan file each time.

## What this project is

**Pokespire** — a non-commercial Pokémon fan-game. Slay-the-Spire-style roguelike deckbuilder. Pick a captured Pokémon as your starter, traverse a branching map, fight card-based battles, capture more Pokémon to grow your collection. Up to 6 in your team; switching mid-battle costs 1 energy; STAB + full 18-type effectiveness make switching the core decision. Web-only, plays anywhere, local saves like Pokerogue.

## Where to read what

| File                                                                      | Purpose                                                                                                          |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| [`PLAN.md`](PLAN.md)                                                      | **THE PLAN.** Tech stack, folder layout, data shapes, milestones, verification plan, legal notes. Start here.    |
| `design-reference/chats/chat1.md`                                         | Full chat with the design tool that shows how the user arrived at the current design — read for tone and intent. |
| `design-reference/project/Pokespire.html`                                 | Host file for the visual prototype (screen dimensions).                                                          |
| `design-reference/project/src/data.js`                                    | Palette tokens (`PAL`), formulas, sample cards. Port palette to `src/styles/tokens.css`.                         |
| `design-reference/project/src/combat.jsx`                                 | Reference combat scene — visual + interaction target (DO NOT literally port; rebuild data-driven).               |
| `design-reference/project/src/screens.jsx`, `ui.jsx`, `design-canvas.jsx` | Other screens + UI primitives.                                                                                   |

## Locked decisions (do NOT re-litigate without checking with the user)

- **Tech stack:** Vite + React 18 + TypeScript + Zustand + Dexie + CSS Modules. No router in v1.
- **Roster:** Gen 1 (151) in v1; architecture supports all 1025.
- **Sprites:** Gen 5 **Black & White animated** style for ALL Pokémon. Primary source PokéAPI; fallback Smogon Sprite Project.
- **Cards:** ~60-100 curated, type-flavored, **NOT Pokémon-locked**. Switching for STAB is the central strategic lever.
- **Saves:** IndexedDB (via Dexie) in v1; schema designed for future cloud sync.
- **UI chrome:** GBA-era — white textbox with blue rounded tube border, sky/grass backdrop, Pixelify Sans + Press Start 2P fonts.
- **Type system:** All 18 Pokémon types (the design prototype used 6 originals — that was a design-tool IP safety choice, not the real game's spec).

## Pre-MVP additions (required before launch, not deferred)

1. **Pokémon base stats must affect damage** (PokéAPI `/pokemon/{id}.stats`). Final formula TBD with user — see plan.
2. **Evolutions** — PokéAPI `/evolution-chain/{id}`. Trigger mechanism (XP / item / HP milestone) TBD with user.
3. **Downloadable save file** (export + import JSON) in v1 — ship in M3 alongside Dexie persistence.

## Suggested next-agent first turn

1. Enter plan mode (the user typically triggers this themselves).
2. Read the full plan at [`PLAN.md`](PLAN.md).
3. Skim `design-reference/chats/chat1.md` and `design-reference/project/src/combat.jsx`.
4. Confirm with the user whether the three pre-MVP additions reshuffle milestones or just expand M3/M5.
5. Resolve the **stat-based damage formula** and **evolution trigger** open questions before starting M2.
6. Exit plan mode and begin M1 (scaffold + tokens.css).

## Repo state at handoff

- `LICENSE` — present (project license).
- `README.md` — 2 lines, intentionally neutral / non-branded.
- `design-reference/` — copy of the design tool's handoff bundle. NOT shipping code; can be gitignored or kept as documentation.
- No source files yet — greenfield.

---

_Handoff written 2026-05-26. The user will re-enter plan mode at the start of the next session to re-read context._
