# Inventory redesign — deck = moves, items live outside

## Context

The MVP plan put **everything** in the deck: attacks, captures, healing,
stat-buffs. Playtesting the storyboard surfaced a few tensions:

1. **Capture-spam decks.** A deck full of Pokéballs trivialises encounters
   — the player just chains catches until the enemy team empties and wins
   without ever damaging anything. The deckbuilder breaks when one card
   type ends combat outright.
2. **Healing as a card cheapens healing.** When `RECOVER` is just one of
   thirty cards in your deck, it's not a _resource you spent gold to
   prepare_ — it's RNG. Pokémon's identity has always been "I planned to
   bring 3 Hyper Potions for this gym", not "I drew a Hyper Potion this
   turn, lucky me."
3. **The 6v6 action economy.** At full party size the player needs ~6
   defensive actions just to survive 6 enemy intents per turn — before
   thinking about offense. With 3 energy and 5 cards that's frustration,
   not strategy.
4. **Universal starter deck doesn't teach the starter.** Whether you pick
   Charmander or Squirtle, your hand looks identical at turn 1. The
   starter choice should _feel_ different.

The redesign separates **moves** (deckbuilder layer) from **inventory**
(meta layer). The deck is what your Pokémon _do_; the inventory is what
your trainer _carries_. Both grow over a run, on parallel decision tracks
that intersect at the post-battle reward prompt.

## Locked decisions

|                       | Decision                                                                                                                                                                                                                                                                               |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------- | ------------------------------------------------------------------------------------------- |
| **Deck contents**     | Moves only — attacks, statuses, weather, terrain, switch combos, stat-buffs, healing-moves. **No** Pokéballs, **no** Potions, **no** X-Items, **no** Berries.                                                                                                                          |
| **Inventory**         | Pokéballs (4 tiers), Potions (4 tiers), X-Items (Attack/Defend/Speed/Hit), Berries (Sitrus/Lum/Chesto/Liechi). Counted, finite, restocked at shops.                                                                                                                                    |
| **Healing in combat** | Only via canonical healing **moves** (Recover, Soft-Boiled, Synthesis, Moonlight, Roost, Slack Off, …). All `kind: 'ITEM'` healing cards become consumables instead.                                                                                                                   |
| **Captures**          | Always a **post-battle choice**, never a card. Player picks: (a) card reward, (b) capture attempt on one of the fought mons (consumes 1 ball), (c) item pickup.                                                                                                                        |
| **Switch cost**       | **Free, always.** No 1-energy tax. Stat stages still reset; block still drops. The strategic cost is what you _give up_ (active mon's stages, momentum), not energy.                                                                                                                   |
| **Switch combos**     | New per-card flag `comboDiscount: true` (replaces `freeSwitch`). When a card with this flag resolves and the player then switches, the _new_ active mon's first card this turn costs 1 less energy. So U-Turn / Volt Switch / Flip Turn = "hit and run, your bench mon strikes cheap." |
| **Hand size**         | `5 + ⌊team.length / 2⌋` → 1 mon=5, 2=6, 3=6, 4=7, 5=7, 6=8.                                                                                                                                                                                                                            |
| **Max energy**        | `min(8, 2 + team.length)` → 1=3, 2=4, 3=5, 4=6, 5=7, 6=8. Relics push past 8 later.                                                                                                                                                                                                    |
| **Starter deck**      | Per-species: 5 Tackle + 5 Protect + 5 type-and-stat-flavour cards. Identical "core" across all starters; 5 cards vary by `(primaryType, archetype)`.                                                                                                                                   |
| **Archetype**         | One of `phys-atk                                                                                                                                                                                                                                                                       | spec-atk | phys-def | spec-def`, picked by `max(baseStats.atk, baseStats.spAtk, baseStats.def, baseStats.spDef)`. |
| **Starter deck size** | 15 cards total. With hand `5+⌊team/2⌋`, solo-mode draws 33% per turn; full-party with captures pulling deck to ~25 still cycles in ~3 turns. Matches STS's 10-card / 5-draw ratio.                                                                                                     |

## Data model

### `RunState.inventory`

```ts
// src/types/run.ts (new file or extend existing)
export interface Inventory {
  // Capture consumables — picked at end of battle when the reward chosen is "try to capture".
  balls: {
    poke: number; // starts: 5
    great: number; // starts: 0
    ultra: number; // starts: 0
    master: number; // starts: 0
  };
  // Healing consumables — used in-combat from a side menu, or at rest sites.
  potions: {
    potion: number; // restore 20 hp,  cost 50
    super: number; // restore 50 hp,  cost 150
    hyper: number; // restore 200 hp, cost 500
    max: number; // full restore,   cost 1500
  };
  // Stat-stage boosters — used in-combat from a side menu. One stage to the
  // active mon. Lasts the battle.
  xItems: {
    attack: number;
    defend: number;
    speed: number;
    hit: number; // crit stage
  };
  // Berries — equipped on a held-item slot OR auto-trigger if held in pouch.
  // Schema TBD when held-items lands; for v0 they live in inventory as counts.
  berries: {
    sitrus: number;
    lum: number;
    chesto: number;
    liechi: number;
  };
  gold: number; // starts: 50
}
```

Starter inventory: `{ balls: { poke: 5, …0 }, potions: { potion: 2, …0 }, xItems: 0×4, berries: 0×4, gold: 50 }`.

### `CardDef` — kind narrowing

```ts
// Before:
type CardKind = 'ATK' | 'SKL' | 'PWR' | 'BALL' | 'ITEM';
// After:
type CardKind = 'ATK' | 'SKL' | 'PWR';
```

Drop the `BALL` + `ITEM` kinds. The matching cards (Pokéball, Potion, X-Attack, …) leave the card pool entirely — they live in inventory now.

`Effect` keeps `capture` and `heal` shapes for use by:

- `heal` — still used by canonical healing moves (Recover, Soft-Boiled, etc.) and by the in-combat "use potion" inventory action.
- `capture` — used by the post-battle capture-attempt flow (not by any card any more).

`exhaustsOnPlay()` and `EXHAUST_KINDS` simplify — without BALL/ITEM there are no auto-exhaust cards. (Specific cards can still mark themselves `ephemeral: true`.)

### Starter-deck DSL

```ts
// src/data/starterDeck.ts (new)
import type { CardDef, PokeType } from '@/types';
import type { SpeciesEntry } from '@/data/pokedex';

type Archetype = 'phys-atk' | 'spec-atk' | 'phys-def' | 'spec-def';

const TYPE_FLAVOUR: Record<PokeType, Record<Archetype, string[]>> = {
  fire:     { 'phys-atk': [...], 'spec-atk': ['ember','ember','ember','sunnyDay','flamethrower'],
              'phys-def': [...], 'spec-def': [...] },
  water:    { 'spec-atk': ['waterGun','waterGun','waterGun','rainDance','surf'], … },
  grass:    { 'spec-atk': ['vineWhip-special','vineWhip-special','vineWhip-special','grassyTerrain','energyBall'], … },
  // … one row per type
};

export function archetypeOf(species: SpeciesEntry): Archetype {
  const s = species.baseStats;
  const best = Math.max(s.atk, s.spAtk, s.def, s.spDef);
  if (best === s.atk) return 'phys-atk';
  if (best === s.spAtk) return 'spec-atk';
  if (best === s.def) return 'phys-def';
  return 'spec-def';
}

export function starterDeckFor(species: SpeciesEntry): string[] {
  const archetype = archetypeOf(species);
  const flavour = TYPE_FLAVOUR[species.types[0]][archetype];
  return [
    'tackle','tackle','tackle','tackle','tackle',
    'protect','protect','protect','protect','protect',
    ...flavour,  // 5 cards
  ];
}
```

The base `tackle` (Normal-type physical attack, common) and `protect` (Normal-type block, common) come from the existing pool. The 5-card flavour slot is the per-starter variance.

### Hand-size + energy scaling

```ts
// src/game/combat/reducer.ts
const BASE_HAND_SIZE = 5;
const BASE_MAX_ENERGY = 2; // team_size 1 → 2 + 1 = 3 starting energy
const MAX_ENERGY_CEILING = 8;

export function handSizeFor(teamSize: number): number {
  return BASE_HAND_SIZE + Math.floor(teamSize / 2);
}

export function maxEnergyFor(teamSize: number): number {
  return Math.min(MAX_ENERGY_CEILING, BASE_MAX_ENERGY + teamSize);
}
```

Called from `createCombat` (initial state) and `startTurn` (refill at turn start). The `maxEnergy` on `CombatState` becomes the _computed_ value at combat start; relics later mutate it via combat-time effects.

### `comboDiscount` mechanic

```ts
// types/combat.ts CombatState
// REMOVE:
freeSwitch: boolean;
// ADD:
/**
 * Set when a card with `comboDiscount: true` resolves. When the player then
 * switches active mons this turn, the *new* active mon's first card play this
 * turn is discounted by 1 energy (floor 0). Consumed on first discounted play.
 * Reset at end of turn. U-Turn / Volt Switch / Flip Turn use this.
 */
comboDiscount: 'pending' | 'armed-for-next-card' | 'inactive';
```

Flow:

- Card with `comboDiscount: true` resolves → `state.comboDiscount = 'pending'`.
- Player switches active mon → `state.comboDiscount = 'armed-for-next-card'`.
- Player plays a card → if `armed-for-next-card`, deduct `max(0, card.cost - 1)` instead of `card.cost`; set to `'inactive'`.
- End of turn → `'inactive'`.

In the `applyEffect` for `freeSwitch` (renamed `comboDiscount` effect):

```ts
case 'comboDiscount':
  return { ...state, comboDiscount: 'pending' };
```

In `switchTo`:

```ts
if (state.comboDiscount === 'pending') {
  next.comboDiscount = 'armed-for-next-card';
}
```

In `playCard`:

```ts
const discount = state.comboDiscount === 'armed-for-next-card' ? 1 : 0;
const cost = Math.max(0, card.cost - discount);
// … pay `cost`, set comboDiscount to 'inactive' if discount applied
```

## UI changes

### Energy bar relocation

`EnergyBar` currently sits in the `.leftCluster` (bottom-left of the scene). Move it inside (or directly above) the `.handArea` so it reads alongside the hand — same visual group as "what can I afford this turn."

Layout sketch:

```
┌──────────────────────────────────────────────────┐
│ topbar                                           │
├──────────────────────────────────────────────────┤
│                                                  │
│   [enemy cluster]            [player cluster]    │
│                                                  │
│                                                  │
│ [relics]              [⚡⚡⚡⚡⚡⚡⚡⚡]    [piles + end] │
│                       [fanned hand of 5-8]       │
└──────────────────────────────────────────────────┘
```

The pip strip of energy gauges sits _centered above_ the hand-arc, no longer a left-pillar widget. The left cluster becomes deck-pile-only (or just deletes — piles already on the right).

### Post-battle reward overlay

New modal screen between combat-end and map-resume:

```
┌──────────────────────────────────────┐
│  Victory!                            │
│                                      │
│  Choose your reward:                 │
│                                      │
│  [ Add a card to your deck ]         │
│      → opens 1-of-3 card draft       │
│                                      │
│  [ Try to capture a foe ]            │
│      → list of mons you fought,      │
│        pick one, pick a ball tier    │
│        from your inventory           │
│                                      │
│  [ Pick up a held item ]             │
│      → 1-of-3 item draft             │
└──────────────────────────────────────┘
```

Implementation lands when the run loop does. For v0 demo we hardcode "always offer all three, no decisions matter past the storyboard". The decision logic is straightforward; the visual + transition will need iteration.

### In-combat inventory side menu

A new toggleable panel for using consumables mid-fight (potions, X-items, berries). Closed by default; opens via a button next to End Turn. Selecting an item consumes one count + applies the effect to the active mon (no card draw, no energy cost, but counts as the player's "main action" this turn — to be balanced).

**Deferred to its own commit** — the inventory state can land first, the menu UI follows.

## Card-pool audit (the part that's actually work)

To feed the starter DSL across the 5 always-available starters we need at minimum:

| Type               | spec-atk row needed                                                                                                                                                                                                | phys-atk row needed                    | def archetype                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- | ---------------------------------------------------------------------------- |
| Fire (Charmander)  | ✓ Ember, Sunny Day, Flamethrower exist                                                                                                                                                                             | — Charmander isn't phys-atk by stats   | —                                                                            |
| Water (Squirtle)   | partial — need a third spec-low-cost (already: Water Gun)                                                                                                                                                          | —                                      | ✓ (def-best: Withdraw, Protect) — Squirtle's actually **phys-def** archetype |
| Grass (Bulbasaur)  | **gap**: only Vine Whip exists and it's _physical_, not special. Need a low-cost special Grass move (e.g., "RAZOR LEAF spec"). Or accept the mismatch and use Vine Whip even though it doesn't match the archetype | ✓ Vine Whip                            | ✓                                                                            |
| Electric (Pikachu) | ✓ Thunder Shock, Charge Beam                                                                                                                                                                                       | ✓ Quick Attack (priority), Wild Charge | —                                                                            |
| Normal (Eevee)     | —                                                                                                                                                                                                                  | ✓ Tackle, Quick Attack, Extreme Speed  | — Eevee's actually spec-def-heavy (95 spDef) → need a Normal spec-def kit    |

**Audit deliverable:** `npm run audit-coverage`-style script that prints, per always-available starter, what cards its `starterDeckFor()` would emit, AND flags any starter where the flavour pool isn't deep enough (e.g., "Bulbasaur spec-atk needs ≥3 special-grass commons, has 0"). Fix gaps by adding 5-10 new common cards to the pool.

## Implementation sequencing

Each phase ends with `npm run typecheck && npm run lint && npm test` green + a commit.

1. **Engine: switch + discount + scaling.**
   `reducer.ts` strips switch energy, renames `freeSwitch` → `comboDiscount`, adds `handSizeFor` / `maxEnergyFor`. Tests updated. ~1h.
2. **Engine: inventory + drop BALL/ITEM card kinds.**
   `CardKind` narrows. `RunState.inventory` shape lands. `data/cards/balls.ts` + `items.ts` deleted (or just removed from the index). Locales for those cards deleted. Story fixtures patched. ~1h.
3. **Starter-deck DSL.**
   `src/data/starterDeck.ts` with `TYPE_FLAVOUR` table + `archetypeOf` + `starterDeckFor`. `STARTER_DECK` constant becomes `starterDeckFor(charmander)` (or whatever default the StarterSelect uses). Tests cover all 5 always-available starters. ~1.5h.
4. **Card-pool audit + gap-filling.**
   New `audit-starter-decks` script. Adds ~5-10 cards to fill the worst gaps (low-cost special Grass, Normal spec-def utility, etc.). ~1h.
5. **UI: energy bar above hand.**
   `BattleStage.module.css` + `BattleStage.tsx` refactor. Energy pip strip becomes a flex item directly above `.handArea`. ~30min.
6. **Post-battle reward overlay (stub).**
   Bare modal with three buttons that wire to (a) console.log card-draft, (b) console.log capture-attempt, (c) console.log item-pickup. No decision logic, no animations. Just the surface. ~1h.

After (6) we have everything to _play_ a redesigned battle end-to-end at 6v6 with 8 energy and the new starter decks. The actual reward-screen content (card drafts, item pools, capture odds) lives in subsequent commits.

## Verification

- `npm run dev` → StarterSelect → pick Charmander → battle opens with hand size 5, max energy 3 (solo). Hand renders `[5 tackle, 5 protect, 3 ember, 1 sunnyDay, 1 flamethrower]`.
- Same flow with Eevee → archetype `phys-atk` (since Eevee's atk 55 > spAtk 45 > def 50 > spDef 65… wait 65 > 55, so spec-def!). Hand renders the Normal spec-def kit instead. Confirms the DSL routes by stat correctly.
- Add a captured Pidgey → team size 2 → next combat: hand size 6, max energy 4. Confirms scaling.
- Play U-Turn → switch to Squirtle → next card costs 1 less than printed. Confirms combo discount.
- End-of-battle modal offers card / capture / item — pick capture → list of fought mons → pick one → ball tier dropdown.
- 96/96+ existing tests still pass.

## Out of scope (deferred)

- **Held items as combat-time effect hooks** — the inventory schema for berries exists, but tying "Sitrus in pouch auto-triggers when HP ≤ 50%" needs the per-mon held-item slot data, which is itself a separate epoch.
- **Shop pricing** — listed in the Inventory section as canon prices, but the shop screen + gold flow isn't built.
- **Audit script for starter coverage** — useful but not strictly required for v0 demo if we hand-verify the 5 starters.
- **PP Plus / max-energy relic** — relic system itself doesn't exist yet.
- **TM cards** — the canonical "play OR consume to add" mechanic from the MVP plan. Compatible with the new design — TMs are just `ATK/SKL` cards with a `teachable: true` flag. Defer to its own commit.

## How this fits

This redesign rewrites the MVP plan's "Universal starter deck" and "ORB cards" sections. Once committed, `planning/02_mvp-plan.md` gets a banner pointing to this doc as the current canon for the deck / inventory / starter / capture surfaces.
