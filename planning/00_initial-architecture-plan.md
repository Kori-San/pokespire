# Pokespire — MVP Architecture Plan

> **⚠️ SUPERSEDED — historical record.** This is the prior agent's draft. The living plan is
> [02_mvp-plan.md](02_mvp-plan.md). Kept for traceability; do not build from this directly.

> **HANDOFF FILE.** This file IS the handoff. The author is starting a new session and will re-enter plan mode to re-read this. Everything a fresh agent needs to take over is in this document. Read it top to bottom before doing anything. If `/tmp/pokespire-design/` still exists, also read those source files — critical excerpts are inlined below as backup in case `/tmp` was wiped.

---

## Handoff — what the next agent must know

**Working directory:** `/home/kori/pokespire` — empty repo, only LICENSE (presumably MIT) and a 2-line README saying _"Pokémon based Rogue-like and Deck-builder"_. Branch: `main`. Clean working tree at handoff.

**Project intent in one paragraph.** Pokespire is a **non-commercial Pokémon fan-game**: a web-deployable Slay-the-Spire-style roguelike deckbuilder where you pick a captured Pokémon as your starter, traverse a branching map, fight battles with a card-based combat system, and capture more Pokémon to grow your collection. Up to 6 Pokémon in your team during a run; switching costs 1 energy mid-turn; STAB and full 18-type effectiveness make the switch decision the core lever. Saves locally (IndexedDB); the goal is "play anywhere" like Pokerogue.

**Key decisions already locked with the user** (do NOT re-litigate without checking):

- Tech stack: Vite + React 18 + TypeScript + Zustand + Dexie + CSS Modules. No router in v1.
- Roster: **Gen 1 (151)** in v1, architecture supports all 1025.
- Sprites: **Gen 5 Black & White animated** style for ALL Pokémon for visual uniformity. Primary source PokéAPI (`sprites.versions['generation-v']['black-white'].animated.front_default`), fallback Smogon Sprite Project.
- Card model: **curated, type-flavored, NOT Pokémon-locked.** ~60-100 hand-designed cards spanning all 18 Pokémon types + NORMAL. Example tension: base deck has Ember cards even with a Squirtle starter → player switches to a Fire teammate to land STAB.
- Saves: IndexedDB (via Dexie) only in v1, schema designed for future cloud sync (UUIDs, `updatedAt`, `schemaVersion`).
- UI chrome: GBA-era — white textbox with blue rounded tube border, sky/grass battle backdrop, Pixelify Sans + Press Start 2P fonts. Visual reference is the design prototype.

**Where the design context lives:**

- `/tmp/pokespire-design/` — extracted handoff bundle from Claude Design with the visual prototype. **READ THIS IF IT STILL EXISTS.** Key files:
  - `pokespire/README.md` — handoff instructions from the design tool.
  - `pokespire/chats/chat1.md` — full back-and-forth showing how the user iterated the design (started GameBoy DMG, pivoted to GBA-era full color, then added switching + STAB + capture %). Read this for _intent_.
  - `pokespire/project/Pokespire.html` — host file showing screen layout dimensions.
  - `pokespire/project/src/data.js` — palette tokens (PAL), original creatures/enemies, cards, type chart, damage/capture formulas. Note: design used 6 original types (Ember/Tide/Flora/Spark/Mind/Umbra) — real game uses all 18 Pokémon types instead.
  - `pokespire/project/src/combat.jsx` — full reference CombatScene (576 lines). Visual + interaction target.
  - `pokespire/project/src/screens.jsx`, `ui.jsx`, `design-canvas.jsx` — title/map/dex/reward layouts and UI primitives.
- If `/tmp` was wiped, the cached gzipped tar of that bundle is at `/home/kori/.claude/projects/-home-kori-pokespire/42192713-2bf4-4a7b-9a82-3bc67a82336a/tool-results/webfetch-1779745549603-52xfpg.bin` — `gunzip -c <path> | tar -x` to re-extract.
- The original URL `https://api.anthropic.com/v1/design/h/6ySVSdNlrpMKaNzZWbZF_A?open_file=Pokespire.html` returns gzipped tar; WebFetch can't decode it on its own — you'll need to gunzip the cached `.bin` (which was already auto-saved during this session).

**Inlined essentials** (so this plan is self-contained):

`PAL` palette tokens from `data.js` — **preserve verbatim** as `src/styles/tokens.css` custom properties:

```
boxBg #f8f8f8 · boxBgAlt #e8eef8 · boxBorder #283058 · boxBorderHi #5878a8 · boxBorderLo #101830
textDark #282838 · textMid #585878 · textLight #f8f8f8
skyTop #7cc4ec · skyBot #bfe4f8 · skyHorizon #fdd9b5
grass #74c850 · grassDark #3c8c34 · grassLight #a8e070
earth #c89460 · earthDark #8c5028 · platform #d0a06c · platformDk #8c5828
hpHigh #58d048 · hpMid #f8c020 · hpLow #e84050 · hpBg #383850
```

Reference combat formulas from `data.js` — port to TypeScript in `src/game/combat/damage.ts` and `capture.ts`:

```js
// Damage: cardType vs attackerType (STAB) × cardType vs defenderType (effectiveness)
const stab = cardType === attackerType ? 1.25 : 1;
const eff = MATCHUPS[cardType]?.[defenderType] ?? 1; // 18×18 chart in v1
// Capture % at given HP ratio:
const missing = 1 - hp / maxHp;
const k = orbId === 'greatorb' ? 1.5 : 1.0;
const chance = clamp(missing * k, 0, 1);
```

Reference card shape from prototype (we keep the structure, replace per-card `id` branching with data-driven `effects[]`):

```js
{ id:'cinderlash', name:'CINDERLASH', type:'EMBER', cost:2, kind:'ATK', dmg:11, text:'Deal 11 damage.\nApply 1 BURN.' }
```

**Conversation context the next agent should know:**

- The user is iterating quickly and decisive. They want concise answers and clear options.
- The user already answered 3 multi-question rounds: scope (end-to-end MVP architecture, local saves designed for cloud later), roster (Gen 1 v1, all gens later, Gen 5 BW animated sprites), card model (curated type-flavored cards not Pokémon-locked, Smogon project as fallback for missing sprites).
- The user explicitly added three pre-MVP requirements at handoff time — see **Pre-MVP additions** section below.
- The user said: "non-commercial fan-game, in web technologies to allow people to play anywhere and save their progress like pokerogue does" — that quote is the north star.
- Plan was assembled with help of a Plan subagent. The architecture is solid; next agent should not redo Phase 1/2 from scratch — verify against this plan, ask the user any remaining clarifying questions, then exit plan mode.

**What to do first** (suggested next-agent flow):

1. Re-enter plan mode (user said they'll trigger this).
2. Read this entire plan file.
3. If `/tmp/pokespire-design/` exists, skim `chat1.md` for tone and `combat.jsx` for the visual target. If not, the inlined excerpts above are sufficient.
4. Confirm with the user whether to incorporate the **Pre-MVP additions** into M1-M5 milestones or treat them as M5.5 / pre-launch polish (they affect the data layer and combat math, especially "stats matter").
5. Either ExitPlanMode and start M1, or clarify any leftover ambiguity (e.g. exact stat-based damage formula) first.

---

## Pre-MVP additions (added by user at handoff)

These three items were called out as **required before MVP launch**, not deferred:

1. **Pokémon stats must matter.** PokéAPI exposes base stats (hp, attack, defense, special-attack, special-defense, speed) at `/pokemon/{id}.stats`. v1 currently uses only `hp` as a flat number per species. Pre-MVP: incorporate at least attack/defense scaling into `calcDamage` — likely a simplified Gen-style formula such as `final = round(cardBase × (atkStat/baseAtk) × stab × eff × (baseDef/defStat))`, with a clamp range so a 130-base-atk Pokémon isn't 10× more lethal than a 40-base-atk one. **Open design question for the user**: should this be a proper Pokémon damage formula, or a tuned multiplier (e.g. `0.7 + stat/200`)? Decide before M2 ships, because it ripples into every card balance pass.
2. **Evolutions.** PokéAPI provides evolution chains at `/evolution-chain/{id}` (referenced from `/pokemon-species/{id}.evolution_chain`). Pre-MVP design: how do captured Pokémon evolve? Options to surface to the user — (a) post-battle level/XP threshold, (b) explicit "Evolution Stone" reward node on the map, (c) auto-evolve at predefined HP milestones. Affects RunState (need to track evolution progress), DexScreen (show pre/post-evo entries), and starter-select (do unlocked starters include their evolutions automatically?). **Add an `evolution` slice to RunState and a `CapturedEntry.evolutionStage` field in `meta.capturedDex`.**
3. **Downloadable save file in v1** (not deferred). Add `services/db/export.ts` and `import.ts`: serialize the entire `meta` store + active `runs` entry to a single JSON blob, trigger a browser download via `Blob` + `URL.createObjectURL`. Import via `<input type="file">` with schema-version checking; reject unknown future versions. This is the "play anywhere" affordance until cloud sync ships — users move saves between devices manually. **Add to M3** (Persistence & dex) instead of treating as stretch.

---

## Context

**Pokespire** is a non-commercial, web-deployable Pokémon fan-game: a Slay-the-Spire-style roguelike deckbuilder where every card is an ability, your starter is a captured Pokémon, and the core decision each turn is which of your 6 team members should hold the active slot (STAB + type effectiveness make switching a real lever).

The repo at `/home/kori/pokespire` currently has only a LICENSE and a 2-line README. A prior design pass (handoff bundle at `/tmp/pokespire-design/`) iterated on the visuals and combat feel using original creatures — we adopt that visual language, but pivot the data layer to real Pokémon via PokéAPI. v1 ships **Gen 1 (151)** with architecture that scales to all 1025. All sprites use **Gen 5 Black & White animated** style for a uniform look. UI chrome stays GBA-era (white textboxes with the blue rounded tube border, sky/grass battle backdrop, Pixelify Sans + Press Start 2P).

Saves are local-only in IndexedDB, but the schema is shaped now so a cloud-sync layer can be added later without refactoring.

---

## Tech stack

**Vite + React 18 + TypeScript + Zustand + Dexie + CSS Modules.**

- **Vite** — fast static-deployable SPA, zero-config for our scope.
- **React 18** — matches the design prototype's component model.
- **TypeScript** — non-negotiable for a data-driven card game.
- **Zustand** — ~1KB store, lets the combat reducer stay a pure function.
- **Dexie** — tiny IndexedDB wrapper with clean versioning/migration.
- **CSS Modules + a `tokens.css`** — palette tokens from the design prototype become CSS custom props; no styling framework.

No router in v1 — a `screen` enum in the store drives a single top-level `<App/>` switch.

---

## Repo layout

```
pokespire/
├── index.html
├── vite.config.ts · tsconfig.json · package.json
├── public/
│   ├── fonts/                       # self-hosted Press Start 2P + Pixelify Sans (OFL)
│   └── sprites/fallback/            # local "unknown" placeholder
└── src/
    ├── main.tsx · App.tsx
    ├── styles/{tokens.css, global.css}
    ├── data/
    │   ├── cards.ts                 # ~60-100 curated CardDef[]
    │   ├── typeChart.ts             # 18×18 multiplier matrix (hardcoded)
    │   ├── statuses.ts              # StatusDef registry
    │   ├── effects.ts               # EffectHandler registry (keyed by effect.kind)
    │   ├── enemies.ts               # enemy roster + intent tables
    │   └── pokedex.gen1.ts          # 151 entries: dexId, name, types, baseHp
    ├── types/                       # shared TS types
    ├── game/
    │   ├── combat/
    │   │   ├── reducer.ts           # pure (state, action) => state
    │   │   ├── actions.ts           # discriminated union of actions
    │   │   ├── damage.ts            # calcDamage(card, attacker, defender, statuses)
    │   │   ├── capture.ts           # calcCaptureChance, rollCapture
    │   │   ├── intent.ts            # enemy AI
    │   │   ├── statusTick.ts
    │   │   └── selectors.ts         # derived UI data (live dmg preview, capture%)
    │   ├── map/{generate.ts, resolve.ts}
    │   ├── run/{state.ts, rng.ts}   # seeded mulberry32 for resumable runs
    │   └── rules/starter.ts
    ├── services/
    │   ├── pokeapi.ts               # typed client (fetch + zod parse + retry)
    │   ├── sprites.ts               # resolveSprite chain
    │   ├── cries.ts
    │   └── db/{schema.ts, meta.ts, runs.ts, cache.ts}
    ├── store/{index.ts, runSlice.ts, metaSlice.ts}
    └── ui/
        ├── primitives/              # Box, Button, HpBar, TypeChip, Nameplate
        ├── combat/                  # BattleStage, Hand, Card, PartyBar, IntentBadge, FloatText
        ├── map/ · dex/
        └── screens/                 # Title, StarterSelect, Map, Combat, Reward, Dex, GameOver
```

---

## Data layer

**PokéAPI** — lazy fetch on first encounter, persist to Dexie `cache` store with 30-day TTL. Endpoints: `/pokemon/{id}` (sprites, types, stats), `/pokemon-species/{id}` (dex#, flavor). The 18 `/type/{id}` responses are NOT used at runtime — the type chart is hardcoded to avoid boot-time round-trips. Optional "Preload Gen 1" toggle in settings for offline play.

**Sprite resolver** (`services/sprites.ts`):

```ts
resolveSprite(dexId: number, facing: 'front' | 'back'): Promise<string>
// 1. cache hit → return
// 2. PokeAPI sprites.versions['generation-v']['black-white'].animated[`${facing}_default`]
// 3. Smogon Sprite Project fallback (covers Gen 6+ later, slug-based URL)
// 4. /sprites/fallback/unknown.png
```

**Card shape** — fully data-driven; no per-card branching in the reducer:

```ts
type Effect =
  | { kind: 'damage'; amount: number }
  | { kind: 'block'; amount: number }
  | { kind: 'heal'; amount: number }
  | { kind: 'draw'; count: number }
  | { kind: 'applyStatus'; target: 'self' | 'foe'; status: StatusId; stacks: number }
  | { kind: 'energy'; amount: number; when: 'now' | 'nextTurn' }
  | { kind: 'capture'; orbTier: 'orb' | 'great' | 'ultra' | 'master' };

interface CardDef {
  id: string;
  name: string;
  type: PokeType;
  cost: number;
  kind: 'ATK' | 'SKL' | 'PWR' | 'ORB';
  effects: Effect[];
  text: string;
}
```

Cards are type-flavored (one of the 18 Pokémon types) but **not Pokémon-locked** — the strategic tension is that your base deck may carry Ember cards even with a Squirtle starter, so you'd switch to a Fire teammate to land STAB. Adding a new card never touches `reducer.ts` — only `cards.ts` and (rarely) `effects.ts`.

**Type chart** — hardcoded constant `TYPE_CHART: Record<PokeType, Partial<Record<PokeType, number>>>`. Immunities stored as `0`; `calcDamage` clamps to a configurable floor (`ZERO_IMMUNITY_FLOOR = 0.25`) so cards still chip rather than feel broken.

---

## Combat engine

`reducer(state, action) → state` — pure, no `Math.random` or `setTimeout` inside. RNG is injected from `RunState.seed` via a seeded `mulberry32` so runs are deterministic and resumable. Animation/FX state lives in a **separate** `combatFxSlice` populated by side-effect middleware watching dispatches — never mix game state with float-text timers.

**Actions:** `START_TURN | PLAY_CARD(handIdx) | SWITCH(teamIdx) | END_TURN | ENEMY_ACT | TICK_STATUSES(phase) | END_COMBAT(outcome)`.

**Damage:**

```ts
calcDamage(card, attacker, defender, statuses): {
  raw: number; stab: number; eff: number; weak: number; final: number;
}
// final = round(card.amount × stab × eff × weakModifier)
// STAB ×1.25 when card.type ∈ attacker.types
// Block subtraction is the reducer's job; this stays pure math.
```

**Statuses** — registry entries declare lifecycle hooks (`onTurnStart`, `onTurnEnd`, `modifyOutgoingDamage`, `modifyIncomingDamage`). BURN/WEAK ship in v1; POISON/PARALYZE/SLEEP are one entry each in `statuses.ts` later.

**Switch** — free action mid-turn for 1 energy. Outgoing creature's block resets to 0; persistent statuses follow the creature. Enemy intent does NOT re-roll on switch.

---

## Map / run state

`generateMap(seed, opts)` produces a layered DAG: ~15 rows × 1-4 nodes per row, fixed boss at top. Algorithm: place row nodes, draw 6 random monotonic paths root→boss, union the edges. Node types: `battle | elite | event | shop | rest | boss`. **MVP ships `battle | elite | boss` fully; `event | shop | rest` resolve to a stub "reward" node** — explicit hooks exist but content lands post-MVP.

```ts
interface RunState {
  id: string;
  seed: number;
  schemaVersion: number;
  updatedAt: number;
  team: TeamMember[]; // up to 6, each with HP + persistent statuses
  deck: string[];
  draw: string[];
  discard: string[];
  exhaust: string[];
  map: MapGraph;
  currentNodeId: string;
  visitedNodeIds: string[];
  combat?: CombatState; // present only mid-battle
  rewardsPending?: RewardOffer;
}
```

Serialization is plain `JSON.stringify` — nothing references DOM or functions.

---

## Save system

Dexie database `pokespire`, version 1, three stores:

- **`meta`** (key `'singleton'`) — `{ schemaVersion, capturedDex, unlockedStarters, settings, history }`.
- **`runs`** (key `id`) — full `RunState`; at most one with `active: true`.
- **`cache`** (key URL) — `{ url, payload, fetchedAt, ttlMs }` for PokéAPI responses.

Why IndexedDB over localStorage: BW animated GIFs cached as blobs blow past the 5MB ceiling fast. Dexie's `db.version(n).upgrade(tx => ...)` gives a clean migration story. Every record carries `id: crypto.randomUUID()` and `updatedAt: Date.now()` so a future Supabase/Firestore sync can do last-write-wins without schema churn. Unknown `schemaVersion` on load → refuse and prompt export.

---

## Milestones

**M1 — Scaffold & tokens.** `npm run dev` shows TitleScreen with correct fonts, palette, and "NEW GAME" button. Vite + TS + ESLint + Zustand wired. No game logic.

**M2 — Combat vertical slice.** TitleScreen → hardcoded battle: Charmander starter vs Rattata, ~15 cards including ORB, fake 6-mon team for switch testing, no map, no persistent save. STAB, type effectiveness, BURN, WEAK, capture %, enemy intent all functional. Sprites pulled live from PokéAPI with in-memory cache. **Done when:** win + capture + faint flows all reach an "End of Demo" overlay correctly.

**M3 — Persistence & dex.** Dexie schema live; captures survive reload; DexScreen lists captured Pokémon with BW front sprite + cry playback; settings persist; sprite cache survives reload.

**M4 — Map & run loop.** StarterSelect → MapScreen with generated DAG → battle nodes resolve → RewardScreen offers 1-of-3 cards → back to map → boss → run end → meta updates. Run state serialized on every node transition; "Resume" button on TitleScreen restores mid-combat exactly (seeded RNG).

**M5 — Full Gen 1 content & polish.** All 151 species available as enemies/team via `pokedex.gen1.ts`; expanded enemy roster + intent tables; final ~60-100 card pool; Smogon fallback verified; mobile layout works at 360px width; in-game credits screen.

**M6 (stretch) — Hooks for later.** Empty-but-typed scaffolding for `shop | event | rest` resolvers, `relics` slice on RunState, and a `services/db/sync.ts` interface (no impl). Out of MVP scope but seams exist.

---

## Critical files

- `src/data/cards.ts` — single source of truth for card content. Effect-array shape determines whether new cards can be added without touching code.
- `src/data/effects.ts` — effect-handler registry. This is what eliminates the `card.id === 'cinderlash'` antipattern from the design prototype ([reference: combat.jsx:166-167](file:///tmp/pokespire-design/pokespire/project/src/combat.jsx)).
- `src/data/typeChart.ts` — hardcoded 18×18 matrix; the correctness anchor for STAB/effectiveness.
- `src/game/combat/reducer.ts` — pure reducer; the correctness anchor for the whole game.
- `src/services/sprites.ts` — sprite resolver chain; the BW-animated aesthetic stands or falls here.
- `src/services/db/schema.ts` — Dexie versioning; getting day-1 schema right saves painful migrations.
- `src/styles/tokens.css` — palette tokens from the design prototype's `PAL` object (`/tmp/pokespire-design/pokespire/project/src/data.js` lines 5-33) — preserve verbatim.

---

## Legal & non-commercial safety

- README states: non-commercial fan project, not affiliated with Nintendo / Game Freak / The Pokémon Company; Pokémon names and sprites © their owners.
- **PokéAPI** data is CC-BY-SA 4.0 → credit "Data and sprites via PokéAPI (pokeapi.co)" in in-game Credits + README.
- **Smogon Sprite Project** is community / non-commercial → credit + link in Credits.
- **Fonts** Press Start 2P and Pixelify Sans are OFL → self-host from `/public/fonts/`, ship `OFL.txt`.
- **No bundled binaries from official ROMs.** All Pokémon assets are fetched at runtime from the credited APIs. Only neutral UI chrome ships in-repo.
- Keep current LICENSE for code; add an `ASSETS.md` clarifying runtime-fetched assets are not licensed by us.

---

## Verification plan

- **M1:** `npm run dev`, open `http://localhost:5173`, TitleScreen renders with `#283058` borders and Press Start 2P logo. DevTools console clean.
- **M2:** NEW GAME → CombatScene appears. Play an EMBER card while active is FIRE-type → expect STAB ×1.25 badge. Switch to a WATER teammate, play same card → expect ×1 (no STAB). Reduce enemy <40% HP → play CAPTURE ORB → capture overlay matches `calcCaptureChance` output. END TURN → BURN ticks visibly.
- **M3:** Capture a Pokémon, hard-reload, open DexScreen → entry present with sprite + cry. DevTools → Application → IndexedDB → `pokespire` shows populated `meta` and `cache`.
- **M4:** Start run, advance 3 nodes, reload mid-combat, click RESUME on TitleScreen → identical HP/energy/hand/intent restored (proves seeded RNG). Beat boss → run cleared from `runs`, `RunSummary` appended to `meta.history`.
- **M5:** Generate 50 runs in a dev script to surface map edge cases. Force-load a Pokémon known to be missing from PokéAPI BW animated → verify Smogon fallback fires in Network tab.

---

## Out of scope for v1 (deferred, design hooks only)

- Cloud sync / accounts (interface defined, no impl).
- Shops, events, rest sites with real content (resolvers stubbed).
- Relics / Slay-the-Spire passives (typed slice exists, unused).
- Audio music (cries only in v1; BGM later).
- Gens 2-9 (sprite resolver already handles them; data files added incrementally).
- Multiplayer / leaderboards.
