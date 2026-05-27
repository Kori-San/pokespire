# Pokespire — MVP Plan (revised together)

## Context

**Pokespire** is a non-commercial, web-deployable Pokémon fan-game: a Slay-the-Spire-style roguelike deckbuilder where you pick a captured Pokémon as your starter, traverse a branching map, fight card-based battles, and capture more Pokémon to grow your team. Up to 6 mons in a team; switching costs 1 energy mid-turn; STAB + 18-type effectiveness make the switch decision the core lever. Saves locally (IndexedDB); the goal is "play anywhere" like Pokerogue.

This is the **living plan** for the current build, kept up to date during the session to keep a trace of everything decided and done. The prior agent's draft now lives at [00_initial-architecture-plan.md](00_initial-architecture-plan.md) (+ handoff at [01_agent-handoff.md](01_agent-handoff.md)) — a **starting point, not a contract**; this plan supersedes it where they diverge. Differences from the prior plan:

- **Levels and XP are first-class.** Every team member has a level (start L5, real Gen XP curves per species). Damage formula references level and species base stats.
- **Live card-damage display** with effectiveness tags + tooltip breakdown.
- **Starter taxonomy** is richer: 5 always-available starters + capture-based unlocks + special-mon solo-mode.
- **Special mons** (legendaries/mythicals now; paradox/Gmax/mega later) appear as run final bosses; catch one and it unlocks as a **solo-only** starter. Solo mode is also a toggle for any regular mon.
- **Initial team = 1 (the starter).** You grow it via captures during the run.
- **Bigger systems scope:** shinies, held items, berries, weather, shops + economy, Ascension ladder (endless past A20), FR/EN i18n, full PWA. All folded into the v0 MVP.
- **Epoch-based roadmap** (v0 MVP → v1+), tracked in `TODO.md` + `CHANGELOG.md` — not rigid sequential versions.

## Locked decisions

| Area                 | Decision                                                                                                                                                                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tech stack           | Vite + React 18 + TypeScript + Zustand + Dexie + CSS Modules. No router. Pure React+CSS (no PixiJS in v1; revisit if combat feel needs juice).                                                                                                    |
| Deployment           | Vercel static SPA (`vite build` → `dist/`). Zero-cost, zero-server. Works the same on Netlify / Cloudflare Pages.                                                                                                                                 |
| PWA                  | Full PWA in v1 via `vite-plugin-pwa`. Service worker caches sprites + PokéAPI responses for offline play. Manifest enables "Install to Home Screen." Per-user private cache (origin-scoped).                                                      |
| Testing              | Vitest + React Testing Library, ESLint (flat, type-checked) + Prettier. Optional GitHub Actions CI.                                                                                                                                               |
| Git hooks            | Husky + lint-staged. **pre-commit** runs lint-staged (Prettier + ESLint on staged files) **and** the full Vitest suite. No pre-push hook.                                                                                                         |
| Git workflow         | Commits use **gitmoji** + are **atomic/isolated** (one task = one commit). See [rules/git-workflow.md](../rules/git-workflow.md).                                                                                                                 |
| i18n                 | French + English from day 1 via `react-i18next`. All UI strings in `src/locales/{en,fr}.json`. Architecture supports adding languages later.                                                                                                      |
| Versioning model     | No rigid v1/v2. Work is grouped into **epochs**: **v0 = MVP** (full playable loop), v1 = "Pokémon enhancement" (more gens / special forms), v2+ = further epochs. Tasks tracked in repo-root `TODO.md`; shipped changes logged in `CHANGELOG.md`. |
| Docs                 | `rules/` = technical standards, `wiki/` = game design (both living). `planning/` = numbered plans (`NN_name.md`), kept updated during each session. `CLAUDE.md` = working agreement for the AI agent.                                             |
| File naming          | Root-level meta files are CAPITALISED (`README.md`, `LICENSE`, `CHANGELOG.md`, `TODO.md`, `CLAUDE.md`). Topic docs under `rules/`, `wiki/` stay lowercase.                                                                                        |
| Roster               | Gen 1 (151) in v1; architecture scales to all 1025.                                                                                                                                                                                               |
| Sprites              | Gen 5 BW animated. PokéAPI primary, Smogon Sprite Project fallback, local placeholder last.                                                                                                                                                       |
| Cards                | ~60-100 curated, type-flavored, NOT Pokémon-locked. Universal starter deck.                                                                                                                                                                       |
| Saves                | IndexedDB via Dexie. Schema designed for future cloud sync. Downloadable export/import in v1.                                                                                                                                                     |
| UI chrome            | GBA-era: white textbox + blue rounded tube border, sky/grass backdrop, Pixelify Sans + Press Start 2P.                                                                                                                                            |
| Type chart           | All 18 real Pokémon types. Hardcoded 18×18 matrix; immunity clamped to ×0.25 floor so cards still chip.                                                                                                                                           |
| **Balance baseline** | **Regular up-to-6 team mode at Ascension 0** is the tuning target. Solo legendary and higher Ascensions are intentionally harder challenge content.                                                                                               |
| **Ascension system** | 20 levels of stacking difficulty modifiers, unlocked by beating the previous level. Composes with solo-legendary mode.                                                                                                                            |

## Core systems

### Levels & XP

- Every team member: `{ speciesId, level, currentXp, growthRate, currentHp, statuses[] }`.
- Starting level: **L5** for everyone (starter and captures).
- Capture level: matches the **enemy's level at time of capture**.
- Growth rates: **all 6 real Pokémon curves** (slow, medium-slow, medium-fast, fast, erratic, fluctuating). Per-species, sourced from PokéAPI `/pokemon-species/{id}.growth_rate`.
- XP award: scaled by enemy level/tier. Active mon gets full share; bench gets ~50%. Bosses give a large lump. Formula (Gen 1-ish): `xp = floor((baseYield × enemyLevel) / 7)`.
- **Per-run only.** Levels reset each run. Captured Dex and unlocked starters persist in meta; combat power does not. (This is more Slay-the-Spire than Pokerogue.)

### Damage formula

```
final = round(
  card.amount                               // printed damage on card
  × stab                                    // 1.25 if card.type ∈ attacker.types else 1.0
  × eff                                     // 18×18 chart; immunity → 0.25 floor
  × weakMod                                 // status modifier hooks (BURN/WEAK/etc.)
  × levelScale(lvl)                         // 0.5 + lvl × 0.05  →  L5=0.75, L20=1.50, L50=3.00
  × clamp(attacker.baseAtk / 75, 0.7, 1.5)  // species attack flavor
  × clamp(75 / defender.baseDef, 0.7, 1.5)  // species defense flavor
)
// 75 ≈ Gen 1 average atk/def baseline
```

Deterministic (no random factor) so seeded runs are exactly reproducible. Lives in `src/game/combat/damage.ts` as a pure function.

### Evolutions

- **Triggers (Gen 1 only in v1):**
  - **Level-up evolutions** auto-fire when a team member reaches the canonical level (Charmander → Charmeleon at L16, etc.).
  - **Stone evolutions** (Vulpix, Eevee, Growlithe, Pikachu, Staryu, Clefairy, Nidorina/Nidorino, Gloom, Poliwhirl) require an **Evolution Stone** picked up from a rare map reward node. Player applies it to a chosen team member.
  - **Trade evolutions** (Kadabra, Machoke, Graveler, Haunter) → re-routed in v1 to a **"Linking Cord" stone** behaviorally identical to other stones. Avoids "trade" mechanic entirely.
- Evolution data sourced from PokéAPI `/evolution-chain/{id}` at build/preload time, cached.
- **Gen 1 evolution forms only.** Eevee → Vaporeon/Jolteon/Flareon ✓. Espeon/Umbreon/Sylveon arrive when Gen 2+ ships. Onix stops at Onix (no Steelix in v1).

### Starter selection

- **Always-available (5):** Bulbasaur, Charmander, Squirtle, Pikachu, Eevee. Shown on StarterSelect from session 1.
- **Unlockable regular starters:** Any **base-form** Pokémon captured in any prior run unlocks as a starter forever (Pidgey, Caterpie, Rattata, etc.). Evolved forms (Charizard, Venusaur, etc.) NEVER selectable — only reachable via in-run evolution.
- **Special Pokémon (solo-only):** legendaries, mythicals (_fabuleux_), and — in later gens — paradox / Gmax / mega-evolution forms are **solo-team-only** starters. The unlock is simply: **catch it, play it.** No dex-completion gate.
  - **How you catch one:** a run's **final boss can be a special Pokémon** (random chance). Beat it, then attempt the catch (low catch rate). Catching it unlocks it as a solo starter permanently.
  - For Gen 1 v1 that's: **Articuno, Zapdos, Moltres, Mewtwo** (legendaries) + **Mew** (mythical). Paradox/Gmax/Mega arrive with later gens via the same solo-only rule.
- **Solo mode is a general toggle.** Any regular Pokémon can _also_ be played solo as a self-imposed challenge (toggle on StarterSelect), not just special mons. Solo runs (special or self-imposed):
  - Team size capped at 1.
  - Switch mechanic disabled (no switch button, no 1-energy switch cost).
  - Captures during the run go to **dex only**, never join the team.
- **DexScreen on starter pick:** shows each starter's evolution line so the player understands what they're committing to.

### Cards

Data-driven, no per-card branching in the reducer.

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

**Universal starter deck.** All starters begin with the SAME ~10-card deck spanning multiple types. The Squirtle player has Ember cards from turn 1 → switch-to-STAB tension is built into the opening hand.

### Live card-damage display (key UX requirement)

Cards render **computed final damage/heal/capture% for the current matchup**, not the printed base. Implemented in `src/game/combat/selectors.ts` as `selectComputedCardView(state, cardIdx) → { computedAmount, effectivenessTier, tooltipBreakdown }`.

**Effectiveness tiers** (text color + small tag):
| Tier | Trigger | Treatment |
| --- | --- | --- |
| SUPER | eff ≥ 2.0 | bright green + "SUPER" tag |
| Effective | 1.5 ≤ eff < 2.0 | green + ↑ |
| STAB | STAB only, eff = 1.0 | yellow + "STAB" |
| Neutral | eff = 1.0, no STAB | default white |
| Resisted | 0.5 ≤ eff < 1.0 | gray + ↓ |
| Immune | eff = 0 (clamped to 0.25 floor visually but flagged) | red "0" + "NO EFFECT" tag, card desaturated, still playable as no-op |

**Tooltip breakdown** on hover/hold: `"10 base × 1.25 STAB × 2.0 SUPER × 1.5 levelScale × 1.2 atkScale = 45"`.

**Recomputes on:** SWITCH active mon, enemy intent change (different target type for AoE later), status applied (BURN/WEAK), level-up mid-battle (rare but possible).

### Ascension system

Endgame difficulty climb modeled on Slay-the-Spire's Ascensions. Each level adds **one stacking modifier**; all lower-level modifiers remain active. Players unlock the next level by beating the boss at the current level. Tracked in `meta.ascensionProgress: { regular: number, soloLegendary: Record<dexId, number> }` — separate progress for each solo legendary so beating Mewtwo on A5 doesn't unlock A6 for Articuno.

**Proposed modifier table (subject to balancing playtest):**

| A       | Modifier (stacks with previous)                                                                                                                                                    |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0       | Baseline. Regular team (cap 6), no modifiers.                                                                                                                                      |
| 1       | Battle rewards reduced 10%.                                                                                                                                                        |
| 2       | Bench XP share 50% → 35%.                                                                                                                                                          |
| 3       | Elite enemies +15% HP.                                                                                                                                                             |
| 4       | First floor includes a forced elite.                                                                                                                                               |
| 5       | Capture rate baseline ×0.85.                                                                                                                                                       |
| 6       | Stone reward nodes appear 30% less often.                                                                                                                                          |
| 7       | All enemies +1 base attack stat tier.                                                                                                                                              |
| 8       | **Team cap reduced to 5.**                                                                                                                                                         |
| 9       | Status decay slower (BURN lasts +1 turn).                                                                                                                                          |
| 10      | Starter deck loses its weakest card.                                                                                                                                               |
| 11      | **Bench XP share 35% → 20%.**                                                                                                                                                      |
| 12      | Reward node card draft is 1-of-2 instead of 1-of-3.                                                                                                                                |
| 13      | Energy regen -1 on turn 1.                                                                                                                                                         |
| 14      | **Team cap reduced to 4.**                                                                                                                                                         |
| 15      | Type-effectiveness floor lifted for enemies (their NORMAL cards do full vs your GHOST team — pain).                                                                                |
| 16      | Switch cost becomes 2 energy.                                                                                                                                                      |
| 17      | **Bench XP share 20% → 10%.**                                                                                                                                                      |
| 18      | **Team cap reduced to 3.** Bosses gain a 2nd phase (50% HP threshold heals + buffs).                                                                                               |
| 19      | XP gain -15%.                                                                                                                                                                      |
| 20      | **Bench XP share → 0%.** Final boss replaced with stronger "Champion" tier variant.                                                                                                |
| **21+** | **Endless scaling.** No new named modifiers — each level adds a flat increment: **+8% enemy HP and +5% enemy damage per level above 20, uncapped.** For score/leaderboard chasers. |

**A5 unlock — Encounter Targeting.** At Ascension 5 (regular mode), unlock a pre-run **target list**: preselect up to **5 species + 1 boss** to _bias_ their spawn chances upward (helps Pokédex completion). **No guarantees** — it nudges the weighted encounter tables, doesn't force spawns. Stored in `meta.settings.encounterTargets`. Applies to both regular and solo runs.

**Balance philosophy:** A0-A5 is the realistic ceiling for casual players. A10+ is for committed regulars. A20 is the "I've mastered this game" endgame. Solo legendary mode is balanced like A8-A10 difficulty even at A0 — so "Mewtwo solo A0" ≈ "regular team A10" in raw difficulty.

### Progression mathematics (illustrative)

Worked numbers so the formula is concrete and balancing has anchors. Card: "EMBER LASH" — `type: FIRE, cost: 1, kind: ATK, dmg: 10, text: "Deal 10."` Defender: neutral baseline (def 75, type RATTATA = NORMAL).

| Attacker                   | Lvl      | Match              | levelScale | atkScale | defScale | STAB                  | eff                  | final  |
| -------------------------- | -------- | ------------------ | ---------- | -------- | -------- | --------------------- | -------------------- | ------ |
| Charmander (atk 52, FIRE)  | 5        | Rattata (def 35)   | 0.75       | 0.70     | 1.50     | 1.25                  | 1.0                  | **10** |
| Charmander                 | 10       | Rattata            | 1.00       | 0.70     | 1.50     | 1.25                  | 1.0                  | **13** |
| Charmeleon (atk 64, FIRE)  | 16       | Onix (def 160)     | 1.30       | 0.85     | 0.70     | 1.25                  | 0.5 (rock×)          | **5**  |
| Charizard (atk 84, FIRE)   | 36       | Onix (def 160)     | 2.30       | 1.12     | 0.70     | 1.25                  | 0.5                  | **13** |
| Charmander                 | 5        | Bulbasaur (def 49) | 0.75       | 0.70     | 1.50     | 1.25                  | 2.0 (super vs grass) | **20** |
| Pikachu (atk 55, ELECTRIC) | 5        | Rattata            | 0.75       | 0.73     | 1.50     | 1.0 (no STAB on FIRE) | 1.0                  | **8**  |
| Mewtwo (atk 110, PSYCHIC)  | 5 (solo) | Rattata            | 0.75       | 1.47     | 1.50     | 1.0 (no STAB on FIRE) | 1.0                  | **17** |

**Reads:**

- Charmander L5 STAB → ~10 baseline (card prints "10," lands for 10). Healthy.
- Same Charmander vs Bulbasaur → ~20 (STAB + super-effective). Strong because two multipliers stack — desired.
- Vs Onix (resists fire + bulky), even an evolved L16 Charmeleon does 5. Forces switch decision.
- Charizard at L36 finally hits Onix for 13 — late-run progression feels earned.
- Mewtwo L5 with a non-STAB FIRE card still hits harder than a starter (17 vs 8) — legendary baseline. With a STAB PSYCHIC card it'd hit even harder.

**XP curve targets:**

- A starter run climbs ~5 → ~25 over a 15-floor map (~+1.3 levels per floor average).
- A solo Mewtwo run climbs ~5 → ~18 over the same map (slow curve + no bench means lower XP throughput).
- First evolution (Charmander L16) reached around floor 8-9 of a 15-floor run — feels like a mid-run power spike.

### Capture

- **ORB cards** in hand (orb, great orb, ultra orb, master orb — descending availability, ascending success rate).
- Playing an ORB: `chance = clamp(missingHpRatio × tierMultiplier × speciesCatchRate, 0, 1)`.
- Success → mon joins team at the enemy's current level with full HP and no statuses.
- **Team at 6 + capture succeeds:** modal — "Team full. Release someone to make room, or skip the capture." Captured species still recorded in dex either way.
- **Solo-legendary mode:** captures go to dex only.

### Flavor systems (v1 scope expansions)

**Shinies.** Each wild encounter rolls a `1/256` shiny chance (vs canonical 1/8192 — keep it special but reachable). Shinies have:

- Alt-color BW animated sprite (PokéAPI provides `*_shiny_*` URLs).
- **Catch rate ×5** vs the species's normal catch rate.
- First shiny capture per species records `meta.unlockedShinies: dexId[]`.
- StarterSelect shows a "Shiny" toggle for any unlocked species — selecting it just swaps the sprite (no stat differences). Pure cosmetic vanity reward.

**Held items.** Each team member can equip ONE held item. Equip/swap at rest sites and shops. Items registered in `data/heldItems.ts` with lifecycle hooks similar to status registry (`onTurnStart | onCardPlay | onDamageTaken | onCapture | onSwitchIn`). Starter v1 set:
| Item | Effect |
| --- | --- |
| **Choice Band** | +30% damage on ATK cards; can only play cards of one type per battle (locked on first card played). |
| **Leftovers** | Heal 6% max HP at start of each turn this mon is active. |
| **Focus Sash** | First lethal hit leaves you at 1 HP. Consumed on trigger. |
| **Charcoal** (and Mystic Water / Magnet / etc.) | +20% damage on cards of matching type. One per type. |
| **Lucky Egg** | +50% XP gain for this mon. |
| **Quick Claw** | 25% chance per turn: gain +1 energy this turn. |
| **Amulet Coin** | Gold rewards from this run +30% while equipped. |
| **Eviolite** | +50% defense scaling, but only works on non-fully-evolved species. |

`TeamMember` gains `equippedItem?: ItemId`. Effects compose with damage formula via post-multipliers and with status hooks via the existing tick pipeline.

**Berries (consumable subset of held items).** Auto-trigger on condition, single-use, replaced with empty slot after firing:
| Berry | Auto-trigger | Effect |
| --- | --- | --- |
| **Sitrus Berry** | HP drops below 50% | Restore 30% max HP. |
| **Lum Berry** | Any status applied | Cleanse all statuses. |
| **Chesto Berry** | Sleep applied | Cleanse Sleep. |
| **Liechi Berry** | HP drops below 25% | +30% damage for the rest of battle. |

**Weather.** New CombatState field: `weather?: { kind: 'sun'|'rain'|'sand'|'hail'|null, turnsLeft: number }`. Four cards (SUNNY DAY, RAIN DANCE, SANDSTORM, HAIL) — SKL type, cost 1, apply weather for 4 turns. While active:
| Weather | Effect |
| --- | --- |
| **Sun** | FIRE ×1.5, WATER ×0.5. |
| **Rain** | WATER ×1.5, FIRE ×0.5. |
| **Sandstorm** | ROCK/GROUND/STEEL deal +20%. Non-R/G/S take 5 chip dmg at end of turn. |
| **Hail** | ICE deal +20%. Non-ICE take 5 chip dmg at end of turn. |

Weather is computed in `damage.ts` as another multiplier and ticks chip-dmg in `statusTick.ts`. Stacks with STAB and effectiveness.

**Shops.** Spawn on ~30% of `shop` nodes (which appear ~2x per run). Each shop offers a random stock:
| Stock category | Quantity | Notes |
| --- | --- | --- |
| **Cards** | 3 cards from card pool | Buy adds to deck. |
| **Evolution stones** | 1-2 stones | Fire / Water / Thunder / Leaf / Moon / Linking Cord. |
| **Held items** | 2 items | From `heldItems.ts` set. |
| **Berries** | 2 berries | Cheaper than held items. |
| **Attractors (Lures)** | 1 lure | Biases next floor's encounters toward a chosen type. Persistent until used. |
| **Card removal** | 1 slot | Pay to remove a card from your deck (StS classic). Price climbs each use this run. |

Gold tracking added to `RunState.inventory.gold: number`. Sources: battle rewards (scaled by enemy tier), Amulet Coin held item, certain map events.

**Additional flavor mechanics — confirmed for v0:**

- **Daycare rest nodes.** Rest sites give a choice: full heal active mon, OR bench mons gain ~15% level worth of XP (daycare flavor). Forces tradeoffs.
- **TM cards.** A subset of cards labeled as "TM" can be played from hand OR consumed permanently to add a copy to your deck. Echoes the canonical TM system; offers card-economy decisions.
- **Move-learning on evolution.** When a team member evolves mid-run, an overlay shows **3 candidate cards biased to the evolved form's type**; player picks 1 to add to the deck permanently, or skips. A power-spike reward tied to the evolution moment. Implemented in `evolution/trigger.ts` → emits a `MOVE_LEARN_OFFER` that the UI resolves.

**Deferred to a future epoch (noted, not built in v0):**

- **Friendship meta.** `meta.capturedDex[dexId].friendship` ticking per battle won with a species active, with cosmetic flair + small capped damage bonus at thresholds. Revisit in v1+; logged in `TODO.md` under a future epoch.

### Combat engine

`reducer(state, action) → state` — pure, no `Math.random` or `setTimeout` inside. RNG injected from `RunState.seed` via seeded mulberry32 so runs are deterministic and resumable.

**Actions:** `START_TURN | PLAY_CARD(handIdx) | SWITCH(teamIdx) | END_TURN | ENEMY_ACT | TICK_STATUSES(phase) | RESOLVE_CAPTURE | END_COMBAT(outcome)`.

Animation/FX state lives in a separate `combatFxSlice` populated by middleware watching dispatches — never mix game state with float-text timers.

### Map / run state

- `generateMap(seed)` produces a layered DAG: ~15 rows × 1-4 nodes, fixed boss at top.
- Node types: `battle | elite | event | shop | rest | boss | legendary`.
- **MVP scope:** `battle | elite | boss` fully resolve. `event | shop | rest` resolve to stub "reward" nodes (hooks exist; content lands post-v1). `legendary` nodes only appear in legendary-unlock runs (TBD which milestone).
- `RunState` is plain JSON-serializable, no DOM refs, no functions.

```ts
interface RunState {
  id: string;
  seed: number;
  schemaVersion: number;
  updatedAt: number;
  starterMode: 'regular' | 'soloLegendary';
  team: TeamMember[]; // 1-6 mons, each with HP/level/XP/statuses
  deck: string[];
  draw: string[];
  discard: string[];
  exhaust: string[];
  map: MapGraph;
  currentNodeId: string;
  visitedNodeIds: string[];
  combat?: CombatState; // present only mid-battle
  rewardsPending?: RewardOffer;
  inventory: { stones: StoneId[] }; // evolution stones held
}
```

### Save system

Dexie database `pokespire`, version 1, three stores:

- **`meta`** (key `'singleton'`) — `{ schemaVersion, capturedDex, unlockedStarters, settings, history }`.
  - `capturedDex`: `Record<dexId, { firstCaughtAt, highestLevelEver, timesCaught, evolvedForms[] }>`.
  - `unlockedStarters`: `dexId[]` (base forms only).
- **`runs`** (key `id`) — full `RunState`; at most one with `active: true`.
- **`cache`** (key URL) — `{ url, payload, fetchedAt, ttlMs }` for PokéAPI responses (30-day TTL).

Why IndexedDB: BW animated GIFs as blobs blow past localStorage's 5MB. Dexie versioning gives clean migration.

**Downloadable save:** `services/db/export.ts` serializes meta + active run to a JSON blob, triggers browser download via `Blob` + `URL.createObjectURL`. Import via `<input type="file">` with `schemaVersion` check; reject unknown future versions.

Every record carries `id: crypto.randomUUID()` and `updatedAt: Date.now()` so cloud sync can do last-write-wins later.

## Repo layout

```
pokespire/
├── index.html · vite.config.ts · tsconfig*.json · package.json
├── eslint.config.js · .prettierrc.json     # flat ESLint + Prettier (test/lint config in vite.config.ts)
├── .husky/                          # pre-commit → lint-staged + vitest
├── CLAUDE.md                        # working agreement for the AI agent
├── README.md · LICENSE
├── TODO.md                          # epoch-grouped task list (v0 MVP, then v1+)
├── CHANGELOG.md                     # shipped changes log (Keep a Changelog format)
├── planning/                        # numbered plans, kept updated each session
│   ├── 00_initial-architecture-plan.md   # prior agent draft (superseded)
│   ├── 01_agent-handoff.md               # prior handoff (superseded)
│   └── 02_mvp-plan.md                    # THIS living plan
├── public/
│   ├── fonts/                       # self-hosted Press Start 2P + Pixelify Sans (OFL)
│   ├── sprites/fallback/            # local placeholder
│   └── manifest.webmanifest         # PWA manifest
├── rules/                           # technical rules, coding standards, best practices
│   ├── README.md                    # how to use these rules
│   ├── testing.md                   # Vitest patterns, what to test, coverage targets
│   ├── components.md                # React component design, SOLID, composition
│   ├── state-management.md          # Zustand patterns, pure-reducer invariants, selectors
│   ├── typescript.md                # strict mode, no `any`, branded types, zod boundaries
│   ├── css-modules.md               # naming, tokens, accessibility, mobile-first
│   ├── data-loading.md              # PokéAPI patterns, retry, zod validation, cache TTL
│   ├── pwa.md                       # service worker scope, cache strategies, update flow
│   └── git-workflow.md              # branch naming, commit format, PR checklist
├── wiki/                            # game design + theorycraft docs (living document)
│   ├── README.md                    # how to navigate the wiki
│   ├── design-overview.md           # north star, pillars, target experience
│   ├── combat-formula.md            # the math, worked examples, balance notes
│   ├── cards.md                     # card design rules, full pool, balancing log
│   ├── progression.md               # levels, XP curves, evolution, friendship
│   ├── ascensions.md                # modifier table, reasoning, playtest notes
│   ├── legendaries.md               # boss specs, solo mode, unlock flow
│   ├── shinies.md                   # rates, catch bonus, UI treatment
│   ├── held-items-and-berries.md    # item registry, effects, balance
│   ├── weather.md                   # 4 weathers, type interactions
│   ├── shops-and-economy.md         # gold flow, stock, prices
│   ├── encounters.md                # enemy roster, intent tables, attractor mechanics
│   └── legal-and-credits.md         # PokéAPI / Smogon / OFL credits
└── src/
    ├── main.tsx · App.tsx
    ├── locales/{en.json, fr.json} · i18n.ts   # react-i18next setup, FR + EN
    ├── styles/{tokens.css, global.css}
    ├── data/
    │   ├── cards.ts                 # ~60-100 CardDef[]
    │   ├── typeChart.ts             # 18×18 matrix
    │   ├── statuses.ts              # StatusDef registry
    │   ├── effects.ts               # EffectHandler registry
    │   ├── enemies.ts               # enemy roster + intent tables
    │   ├── pokedex.gen1.ts          # 151 species: dexId, name, types, baseStats, growthRate
    │   ├── growthCurves.ts          # 6 XP→level formulas
    │   ├── evolutions.gen1.ts       # trigger table per species
    │   ├── legendaryBosses.ts       # Mewtwo/Articuno/Zapdos/Moltres/Mew configs
    │   ├── heldItems.ts             # held-item registry with lifecycle hooks
    │   ├── berries.ts               # consumable berries (subset of items)
    │   ├── weather.ts               # weather effects + chip damage
    │   ├── ascensions.ts            # A0-A20 modifier table
    │   └── shops.ts                 # shop stock generation
    ├── types/                       # shared TS types
    ├── game/
    │   ├── combat/
    │   │   ├── reducer.ts           # pure (state, action) → state
    │   │   ├── actions.ts
    │   │   ├── damage.ts            # calcDamage(card, attacker, defender, statuses, weather, items)
    │   │   ├── capture.ts           # calcCaptureChance, rollCapture (shiny x5)
    │   │   ├── intent.ts            # enemy AI
    │   │   ├── statusTick.ts        # status + weather + held-item ticks
    │   │   └── selectors.ts         # selectComputedCardView + others
    │   ├── xp/{level.ts, award.ts}  # XP↔level conversion, post-battle distribution
    │   ├── evolution/trigger.ts     # check & apply evolutions + move-learning draft
    │   ├── map/{generate.ts, resolve.ts}
    │   ├── run/{state.ts, rng.ts, modifiers.ts}  # seeded RNG + Ascension modifier application
    │   └── rules/starter.ts         # starter taxonomy + unlock checks
    ├── services/
    │   ├── pokeapi.ts               # typed client (fetch + zod parse + retry)
    │   ├── sprites.ts               # resolver chain (normal + shiny variants)
    │   ├── cries.ts
    │   ├── pwa.ts                   # service worker registration + update prompt
    │   └── db/{schema.ts, meta.ts, runs.ts, cache.ts, export.ts, import.ts}
    ├── store/{index.ts, runSlice.ts, metaSlice.ts, fxSlice.ts}
    └── ui/
        ├── primitives/              # Box, Button, HpBar, TypeChip, Nameplate, EffectTag
        ├── combat/                  # BattleStage, Hand, Card, PartyBar, IntentBadge, FloatText, DmgTooltip, WeatherIndicator
        ├── map/ · dex/ · shop/
        └── screens/                 # Title, StarterSelect, Map, Combat, Reward, Shop, Dex, GameOver
```

## Critical files (correctness anchors)

- [src/data/cards.ts](src/data/cards.ts) — single source of truth for card content.
- [src/data/typeChart.ts](src/data/typeChart.ts) — hardcoded 18×18; STAB/effectiveness correctness.
- [src/data/growthCurves.ts](src/data/growthCurves.ts) — all 6 real Pokémon XP formulas.
- [src/data/evolutions.gen1.ts](src/data/evolutions.gen1.ts) — Gen 1 evolution triggers (level + stone routes).
- [src/game/combat/reducer.ts](src/game/combat/reducer.ts) — pure reducer; whole-game correctness anchor.
- [src/game/combat/damage.ts](src/game/combat/damage.ts) — the formula above.
- [src/game/combat/selectors.ts](src/game/combat/selectors.ts) — live card-damage view selector.
- [src/services/sprites.ts](src/services/sprites.ts) — resolver chain; BW-animated aesthetic stands or falls here.
- [src/services/db/schema.ts](src/services/db/schema.ts) — Dexie versioning; day-1 schema correctness saves painful migrations.
- [src/styles/tokens.css](src/styles/tokens.css) — palette ported verbatim from the design prototype's `PAL` object (local-only reference in `tmp/design-reference`, not committed).

## Roadmap (epoch-based, not rigid versions)

Work is grouped into **epochs**, each with its own task list maintained in repo-root [`TODO.md`](TODO.md). Shipped changes are logged in [`CHANGELOG.md`](CHANGELOG.md) (Keep-a-Changelog format). **v0 = the MVP**: a complete, fun, playable game. The task _groups_ below seed `TODO.md` — they're a build order, not hard sequential gates; reorder freely as long as dependencies hold.

### v0 — MVP (the playable loop)

The build order below respects dependencies (scaffold → combat → persistence → run loop → systems → endgame → polish). Each part becomes a section in `TODO.md`.

| Part                                               | Scope                                                                                                                                                                                                                                                                                                                       | "Done" signal                                                                                                                                                               |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scaffold + PWA + i18n** ✅ build/lint/test green | Vite + TS + Vitest + ESLint + Prettier + Husky/lint-staged + Zustand + Dexie + `vite-plugin-pwa` + `react-i18next` (FR/EN). `rules/` + `wiki/` + `planning/` + `CLAUDE.md` + `TODO.md` + `CHANGELOG.md` seeded.                                                                                                             | `npm run dev` → TitleScreen with correct fonts, `#283058` borders, "NEW GAME". SW registers, manifest installable, language toggle works. _(Browser verification pending.)_ |
| **Combat vertical slice**                          | Hardcoded Charmander (L5) vs Rattata. ~15 cards incl. ORB + 1 weather card. Fake 6-mon team for switch testing. Full damage formula (weather + held-item hooks present). Live computed card display + tags + tooltip. BURN/WEAK, capture %, enemy intent. Sprites live from PokéAPI.                                        | Win / capture / faint flows all reach an end-of-demo overlay; STAB/eff/immune visuals correct on switch.                                                                    |
| **Persistence + dex + shinies**                    | Dexie schema; captures survive reload; DexScreen (BW sprite + cry + evolution-line viz + shiny indicator); shiny roll (1/256) + catch ×5 + unlock recording; settings persist; sprite cache survives reload; save export/import w/ schema-version check.                                                                    | Capture → reload → dex entry present; export downloads JSON, import restores; IndexedDB populated.                                                                          |
| **Run loop + XP + evolutions**                     | StarterSelect (5 default + captured base-forms + solo toggle) → map DAG → battles → XP (active full / bench 50%, real growth curves) → evolutions at canonical levels → **move-learn 1-of-3 draft on evolve** → stone reward nodes → 1-of-3 card rewards → boss → run end → meta updates. Mid-combat resume via seeded RNG. | Advance 3 nodes, reload mid-combat, RESUME restores exactly; Charmander→Charmeleon at L16 triggers move-learn draft.                                                        |
| **Items, weather, shops, economy**                 | Held-item registry (v0 set) + berries (auto-trigger) + weather cards (damage + chip tick) + shop nodes (cards/stones/items/berries/lures/card-removal) + gold in `RunState.inventory` + daycare rest option + TM cards.                                                                                                     | Equip item changes computed damage; weather shifts type math; shop purchase mutates deck/inventory; lure biases next-floor encounters.                                      |
| **Special mons + solo mode**                       | Run final boss can be a Gen 1 legendary/mythical (Articuno/Zapdos/Moltres/Mewtwo/Mew). Beat + catch (low rate) → unlocks solo starter. Solo mode (special or self-imposed): team cap 1, no switch, captures dex-only.                                                                                                       | Defeat Mewtwo → catch roll → Mewtwo selectable as solo starter; solo run has no switch button.                                                                              |
| **Ascension ladder**                               | A0-20 named modifiers + A21+ endless scaling as a `RunModifiers` slice applied to map gen, enemy stats, reward tables, team cap, XP share, combat. Per-mode `meta.ascensionProgress`. **A5 Encounter-Targeting** unlock (5 species + 1 boss spawn bias).                                                                    | Beat A0 → A1 unlocks; A8 caps team at 5; A5 unlocks target list; A21 applies flat scaling.                                                                                  |
| **Full content + polish**                          | All 151 species; full enemy roster + intent tables; final ~60-100 card pool; Smogon fallback verified; mobile 360px; credits screen; ASSETS.md; FR/EN strings complete; balance pass.                                                                                                                                       | A full Gen 1 run is playable, localized, mobile-friendly, balanced at A0.                                                                                                   |

### Future epochs (seeded in `TODO.md`, not built in v0)

- **v1 — Pokémon enhancement:** Gens 2-9 data (resolver already handles sprites), special forms (paradox / Gmax / mega-evolution, all solo-only), more legendaries/mythicals, expanded card pool.
- **v1+ — Friendship meta:** per-species friendship ticking + cosmetic flair + small capped damage bonus.
- **Future hooks (typed, no impl in v0):** event/rest content beyond stubs, relics/passives slice, cloud-sync interface, multiplayer/leaderboards, BGM (cries only in v0).

## Session progress log

A running trace of what's actually been built (keep appending; pair with `CHANGELOG.md`).

### 2026-05-26 — Session 1 (scaffold)

- Approved this plan; locked the conventions captured in the tables above.
- **Scaffold complete (build + lint + test green):**
  - Vite + React 18 + TS project; strict tsconfig (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`), `@/` path alias.
  - Tooling: flat ESLint (type-checked) + Prettier + Vitest/RTL (jsdom). Husky `pre-commit` → lint-staged + `npm test`.
  - Self-hosted OFL fonts (Press Start 2P, Pixelify Sans) + license files; `tokens.css` (PAL palette verbatim + 18 type colors) + `global.css`.
  - PWA via `vite-plugin-pwa` (autoUpdate, runtime CacheFirst for PokéAPI + sprite origins); manifest + placeholder icons.
  - i18n via `react-i18next` (FR + EN) + language toggle.
  - TitleScreen (GBA chrome, Box/Button/LanguageToggle primitives) + smoke test.
  - Docs: `rules/` (8 files), `wiki/` (13 files), `TODO.md`, `CHANGELOG.md`, this `planning/` set, `CLAUDE.md`.
  - Placeholder assets flagged in `TODO.md` (PWA icons, fallback sprite, text logo).
- Committed as 10 atomic gitmoji commits. Moved the design-reference bundle to gitignored `tmp/`.
- Replaced the FR/EN text toggle with a **globe button → flag dropdown** (UK/France, autonym labels).
- **Conventions added mid-session:** task workflow is **done → delete TODO line → append CHANGELOG**; comments only when non-obvious; `tmp/` for local-only scratch; machine-specific tooling stays out of committed files entirely.
- **Pending:** browser verification (needs user — dev server render, SW registration, install prompt, flag dropdown).

### 2026-05-27 — Session 2 (combat vertical slice)

- Building Part 2: type system + 18×18 chart, deterministic damage/capture math, statuses (BURN/WEAK), data-driven cards/effects, pure combat reducer, live computed card view, enemy intent, PokéAPI/sprite services, and the BattleStage UI with switch + end-of-demo overlay.
- **Pure combat-math core done (all tested, committed):**
  - Shared domain types (`src/types/`): `PokeType` (18), base stats, growth rates, statuses, card/effect shapes, combat state/actions.
  - `data/typeChart.ts` — 18×18 modern chart + `typeEffectiveness`.
  - `game/combat/damage.ts` — deterministic formula (STAB, eff w/ chip floor, level + stat scaling, WEAK/weather/item hooks) returning a full breakdown for the live display.
  - `game/combat/capture.ts` — **real Gen III/IV capture formula** with real ball names (Poké/Great/Ultra/Master); slight chance at full HP, shiny ×5.
  - `data/statuses.ts` + `game/combat/statusTick.ts` — BURN/WEAK, `applyStatus`, end-of-turn tick + decay.
- **Decision (this session):** capture uses the authentic Gen III/IV formula and real ball terminology (FR: Super/Hyper Ball), not a simplified model.
- **Mid-session infra hardening (committed):** Storybook 10 + stories + `dev:all`; ESLint bumped to strict + stylistic type-checked, plus Storybook/Vitest/i18next plugins; autoprefixer + browserslist; Vitest v8 coverage (report-only); knip; commitlint (gitmoji `commit-msg` hook); pre-commit now also typechecks. CI as **three separate workflows** (🔍 static-checks, 🧪 tests+coverage, 🏗️ build) + Dependabot, in the project's run-name/section format. `.claude/settings.json` permission guardrails (plan-mode default; deny push/force/reset/clean/secret reads); `.gitignore` resectioned.
- **Combatant** now carries `catchRate` (0–255) + `shiny`; capture uses the **real Gen III/IV formula** (small chance at full HP).
- **Card engine layer done (tested, committed):** `deck.ts` (seeded shuffle + draw with discard reshuffle), `effects.ts` (`applyEffect` — pure executor for damage/block/heal/draw/status/energy/weather/capture), `data/cards.ts` (~18 starter cards incl. weather + ball cards + a universal `STARTER_DECK`).
- **Card numbers:** `effects[].amount` is the single source of truth (base value); the on-screen number is **computed live** by the upcoming `selectComputedCardView` + Card UI (not the static `text`, which is just rules flavor).
- **Next:** enemy intent → pure reducer (PLAY_CARD/SWITCH/END_TURN/ENEMY_ACT/status ticks) → live `selectComputedCardView` → PokéAPI/sprite services → BattleStage UI (switch + end-of-demo overlay). SpeciesDef deferred to persistence/run-loop.

## Open / TBD (resolve before the relevant task group)

- **Card pool content.** ~60-100 cards balanced across 18 types. Start with ~15 in the combat slice, expand to ~30 by the run-loop part, finalize to 60-100 by the polish part. Balance pass needed each step.
- **Status registry beyond BURN/WEAK.** Probably POISON/PARALYZE/SLEEP for v0 — confirm during the combat slice.
- **XP base yields per species.** Use PokéAPI `base_experience` directly, or override per species for balance? Decide in the run-loop part.
- **Legendary-as-boss spawn rate.** What chance does a run's final boss roll a special mon? Flat %, or rises with Ascension / dex progress? Decide in the special-mons part.
- **Ascension modifier table** — A0-20 table is a first draft. Real balance needs playtest data; revisit in the Ascension part. Watch pinch points (e.g. A15 "type-floor lifted") for fun-vs-frustration.
- **Balancing pass cadence.** Tuning sprints after the run-loop part and the Ascension part to lock formula constants, XP yields, capture rates, modifier impacts.

## Verification plan

- **Scaffold.** `npm run dev`, open `http://localhost:5173`, TitleScreen renders with `#283058` borders and Press Start 2P logo. Language toggle swaps FR/EN. DevTools: service worker registered, manifest detected, console clean.
- **Combat slice.** NEW GAME → CombatScene. Play a FIRE card while active is FIRE-type → card shows yellow "STAB" tag and computed number includes ×1.25. Switch to a WATER teammate → same card shows neutral white number, no STAB tag. Play a NORMAL card vs a GHOST enemy → card shows red "0" + "NO EFFECT", desaturated. Reduce enemy <40% HP → play ORB → capture overlay matches `calcCaptureChance`. END TURN → BURN ticks visibly.
- **Persistence.** Capture a Pokémon, hard-reload, open DexScreen → entry with sprite + cry + evolution-line viz. Trigger a shiny encounter (force RNG) → shiny sprite + ×5 catch rate; capture records `unlockedShinies`. Export save → JSON downloads; clear storage → import → state restored. IndexedDB shows populated `meta` + `cache`.
- **Run loop.** Start run, advance 3 nodes, win battles, observe level-ups + Charmander → Charmeleon at L16 with a 1-of-3 move-learn draft. Reload mid-combat, RESUME → identical HP/energy/hand/intent/level/XP (proves seeded RNG). Stone-reward node → apply to Eevee → Vaporeon. Beat boss → run cleared, `RunSummary` in `meta.history`.
- **Items & shops.** Equip Choice Band → computed card damage rises ×1.3 and locks to one type. Play RAIN DANCE → WATER cards ×1.5, FIRE ×0.5, weather indicator counts down. Buy a card at a shop → deck grows, gold deducted. Use a Fire Lure → next floor's encounters skew FIRE.
- **Special mons.** Force a run's final boss to be Mewtwo → defeat → catch roll. New run → Mewtwo selectable as a solo starter → team size 1, no switch button, captures dex-only. Toggle solo on a regular mon → same restrictions apply.
- **Ascension.** Beat A0 → A1 unlocks. Confirm A8 caps team at 5, A14 at 4. Reach A5 → Encounter-Targeting list available; select 5 species + 1 boss → spawn weights shift. A21 → flat enemy HP/damage scaling applies.
- **Polish.** Dev script generates 50 runs to surface map edge cases. Force a Pokémon with no PokéAPI BW animated sprite → Smogon fallback fires in Network tab. Resize to 360px → layout holds. All visible strings localized in FR + EN.

## Legal & non-commercial safety

- README states: non-commercial fan project, not affiliated with Nintendo / Game Freak / The Pokémon Company; Pokémon names and sprites © their owners.
- **PokéAPI** data is CC-BY-SA 4.0 → credit "Data and sprites via PokéAPI (pokeapi.co)" in in-game Credits + README.
- **Smogon Sprite Project** is community / non-commercial → credit + link in Credits.
- **Fonts** Press Start 2P and Pixelify Sans are OFL → self-host from `/public/fonts/`, ship `OFL.txt`.
- No bundled binaries from official ROMs. Pokémon assets fetched at runtime from credited APIs.
- Keep current LICENSE for code; add `ASSETS.md` clarifying runtime-fetched assets are not licensed by us.
