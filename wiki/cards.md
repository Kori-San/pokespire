# Cards

Data-driven; **no per-card branching in the reducer**. Adding a card edits the data files
under [`../src/data/cards/`](../src/data/cards/) (and rarely `data/effects.ts`), never
`reducer.ts`.

```ts
type Effect =
  | { kind: 'damage'; amount: number }
  | { kind: 'block'; amount: number }
  | { kind: 'heal'; amount: number }
  | { kind: 'draw'; count: number }
  | { kind: 'applyStatus'; target: 'self' | 'foe'; status: StatusId; stacks: number }
  | { kind: 'stat'; target: 'self' | 'foe'; stat: Stat; stages: number }
  | { kind: 'energy'; amount: number; when: 'now' | 'nextTurn' }
  | { kind: 'weather'; weather: WeatherKind; turns: number }
  | { kind: 'capture'; ballTier: BallTier };

interface CardDef {
  id: string; // i18n key (e.g. card.names.tackle)
  name: string; // fallback when no translation
  type: PokeType; // canonical Pokémon type — drives STAB + effectiveness on damage cards
  cost: number;
  kind: 'ATK' | 'SKL' | 'PWR' | 'BALL' | 'ITEM';
  category: 'physical' | 'special' | 'status';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic';
  effects: Effect[]; // base values; on-card text is generated live from these
}
```

The card **never carries a description string** — `selectCardLines` derives line
descriptors from `effects` with computed values, then `Card.tsx` translates them. Adding
a 300th damage card costs zero new translation strings; the eight `card.lines.*` templates
in [`../src/locales/<lang>/cards.json`](../src/locales/en/) cover everything.

## Design rules

- **Type-flavored, not Pokémon-locked.** A card has one of the 18 types; any mon can play it. STAB rewards matching the active mon's type → the switch lever.
- **STAB applies to damage only.** A Flying-type using REST does not heal more; a Water-type using PROTECT does not block harder. STAB lives in `damage.ts`, not in the heal/block/buff paths. See [combat-formula.md](combat-formula.md).
- **Universal starter deck.** All starters begin with the same ~10-card multi-type deck — switch-to-STAB tension exists from turn 1.
- **Printed `amount` reads at L5-ish baseline.** The damage formula scales by level / stats / STAB / effectiveness at play time; the Card UI shows the computed result.
- **TM cards:** a subset can be played from hand OR consumed permanently to add a copy to the deck.
- **Consumables are cards, equipment is not.** Poké Balls, Potions, X Attack → BALL/ITEM kind cards in your deck. Choice Band, Leftovers, Sitrus Berry, Fire Stone → team inventory only, sold by shops. See [held-items-and-berries.md](held-items-and-berries.md) and [shops-and-economy.md](shops-and-economy.md).

## Kinds

| Kind   | Description                                                | Examples                                 | Border tint           |
| ------ | ---------------------------------------------------------- | ---------------------------------------- | --------------------- |
| `ATK`  | Damage-dealing moves                                       | Tackle, Ember, Hydro Pump                | `--type-${type}`      |
| `SKL`  | Non-damaging Pokémon moves (block, heal, draw, stat-buffs) | Harden, Recover, Swords Dance, Sunny Day | `--type-${type}`      |
| `PWR`  | Persistent passives (turn-on, last the battle)             | Focus Energy, Light Screen               | `--type-${type}`      |
| `BALL` | Capture cards                                              | Poké Ball, Great Ball, Ultra Ball        | `--card-ball` (red)   |
| `ITEM` | Generic consumables that aren't canonical Pokémon moves    | Potion, Super Potion, X Attack, Repel    | `--card-item` (amber) |

`BALL` and `ITEM` ignore `card.type` for the visual border — they're not Pokémon-typed —
but the `type` field stays on the model (used by lures, archetype counters, etc.).

## Categories (physical / special / status)

Canonical Gen-IV split — what stat the damage formula reads.

| Category   | Uses                    | When                                                                  |
| ---------- | ----------------------- | --------------------------------------------------------------------- |
| `physical` | `atk` / `def` stats     | Most contact moves: Tackle, Vine Whip, Double Kick                    |
| `special`  | `spAtk` / `spDef` stats | Most ranged-element moves: Ember, Water Gun, Thunder Shock, Confusion |
| `status`   | No stats; no damage     | All SKL / PWR / BALL / ITEM cards                                     |

Source of truth is PokéAPI `damage_class`. The HGSS category icons live at
`public/sprites/move-category/{physical,special,status}.png` (vendored from Bulbapedia)
and render as a small banner glyph on each card.

## Rarity (tied to canonical PP)

Pokémon move PP and Pokespire card rarity express the same idea — **the rarer it is, the
fewer times you should be able to use it.** We map directly:

| Rarity     | Canonical PP | Cards (examples)                                            | Offer rate   |
| ---------- | ------------ | ----------------------------------------------------------- | ------------ |
| `common`   | 30 – 40      | Tackle, Ember, Water Gun, Quick Attack                      | High         |
| `uncommon` | 20 – 25      | Flamethrower, Surf, Earthquake, Aerial Ace                  | Mid          |
| `rare`     | 10 – 15      | Fire Blast, Swords Dance, Dragon Dance, Calm Mind           | Low          |
| `epic`     | 5            | Hyper Beam, Mega Evolve, Dynamax, signature legendary moves | Curated-only |

- **Battle rewards** roll on these weights; epic almost never offered randomly.
- **Shop drafts** may stock 1 rare + 2 lower tiers.
- **Boss rewards** elevate the floor (uncommon-minimum).
- **Epic** cards are usually quest-gated or single-copy-per-run.

Rarity is a soft contract — not every Pokespire card has a direct canonical move. New
cards declare a rarity by gameplay impact, sanity-checked against the PP-equivalent.

## Pool plan

~15 in G2 → ~30 by G4 → final 60–100 across all 18 types by G8, with a balance pass each
step. The pool file layout mirrors design intent:

```
src/data/cards/
├── normal.ts · fire.ts · water.ts · …  (18 type-flavored files: ATK/SKL/PWR)
├── balls.ts                            (BALL kind: poke/great/ultra/master)
├── items.ts                            (ITEM kind: potions, X stats, repels, …)
└── index.ts                            (merges into CARDS Record, exports STARTER_DECK)
```

Balancing the fire pool = open `fire.ts`. Adding a Mega/Dynamax card = `items.ts`.
