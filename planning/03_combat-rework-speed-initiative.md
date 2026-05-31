# Combat rework — speed-based interleaved initiative

Epoch-scale change to the combat engine. Today's combat is StS-side-based (your turn → enemy turn) with a single enemy. The target is BG3-style **interleaved initiative**: every actor — your 1–6 mons and the enemy's 1–6 mons — gets a turn in speed order, the player sees the queue ahead of time, and cards / intents target specific mons.

## Why

- **6v6 needs targeting.** "Enemy attacks for 7" is meaningless once there are 6 allies to hit.
- **Speed is currently cosmetic.** With interleaved initiative it becomes the spine of every fight — Paralyze, Tailwind, Trick Room all start to matter.
- **Cards stay simple, resolution gets deep.** Players still pick cards in any order during their actor's turn; the strategic depth comes from the _order of turns_, not from queuing card plays.
- **Player request, lifted verbatim from the conversation:** "speed based initiative ... where you know the precise order of execution and just feel your pokémons attacks / cards ... a banger dare i say."

## Locked decisions

| Area                         | Decision                                                                                                                                                                                                                         |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Initiative model             | Speed-based **interleaved** — each actor takes its own turn, sorted by `effectiveSpeed(mon)`. Not side-based.                                                                                                                    |
| Initiative recomputation     | At the **start of each round** (round = "every alive actor has taken one turn"). Mid-round speed changes affect the _next_ round, not the current one.                                                                           |
| Player actor turn            | Refill energy → draw → play cards (any order, energy permitting) → end-turn. Bench mons don't take card turns — only the active one acts.                                                                                        |
| Enemy actor turn             | Executes its current `Intent` against its target, then **rolls its next intent** (so the next round's queue already previews what every enemy will do).                                                                          |
| Switching                    | Card-play. Switching counts as the active mon's action; the switched-in mon doesn't get a fresh turn this round. It picks up the slot in initiative the next round under its OWN speed.                                          |
| Energy                       | Refills to `maxEnergy` at the start of the **active mon's turn**, not at the start of the round. Energy is shared across all your mons within a single active-turn play.                                                         |
| Targeting                    | Required for: (a) ATK cards (default = enemy's current `activeIndex`, can pick another), (b) BLOCK/heal/buff cards (default = self, can pick a bench ally), (c) every enemy `Intent` (must specify the ally index it's hitting). |
| Type-effectiveness recompute | Already per-card-per-target via `selectComputedCardView`; just grows a `targetSpeciesId` input.                                                                                                                                  |
| Damage formula               | Unchanged. Damage is computed against the actual target, not the active.                                                                                                                                                         |
| Status timing                | Statuses still tick at end of turn — but it's now the **actor's** end-of-turn, not the side's. Burn on Charmander ticks when Charmander's turn ends.                                                                             |
| Outcomes                     | `win` when all foe mons fainted, `lose` when all ally mons fainted. Outcome check after every faint, not just at end of side.                                                                                                    |

## Data model changes

### `CombatState`

```ts
export interface CombatState {
  // ── Teams ─────────────────────────────────────────────────────────────────
  team: Combatant[]; // player team (1–6)
  enemies: Combatant[]; // foe team (1–6) — was a single `enemy`
  playerActiveIndex: number; // which ally is "in front" for card defaults
  enemyActiveIndex: number; // which foe is "in front" for default targeting

  // ── Initiative ────────────────────────────────────────────────────────────
  /** Queue of actors for the current round, in speed order. Re-rolled each round. */
  initiative: ActorRef[];
  /** Index into `initiative` — points at the actor whose turn it CURRENTLY is. */
  currentTurn: number;
  /** Round counter (was `turn`). +1 each time `currentTurn` wraps past the queue. */
  round: number;

  // ── Per-enemy intents ────────────────────────────────────────────────────
  /** Indexed by `enemies[i]`. Each carries `targetIndex` (which ally it's hitting). */
  intents: Intent[];

  // ── Hand / piles (unchanged) ─────────────────────────────────────────────
  energy: number;
  maxEnergy: number;
  hand: string[];
  draw: string[];
  discard: string[];
  exhaust: string[];

  // ── Environment (unchanged) ──────────────────────────────────────────────
  weather: Weather | null;
  rngState: number;
  outcome: CombatOutcome;
  log: string[];

  // ── Carry-over flags ─────────────────────────────────────────────────────
  freeSwitch: boolean; // unchanged
  // `enemyActed` is GONE — turn-by-turn flow makes it irrelevant
}

export type ActorRef =
  | { side: 'ally'; index: number } // -> state.team[index]
  | { side: 'enemy'; index: number }; // -> state.enemies[index]
```

### `Intent` — grows a target

```ts
export type Intent =
  | { kind: 'attack'; amount: number; targetIndex: number } // index into player.team
  | { kind: 'defend'; amount: number; targetIndex: number } // can buff own bench
  | { kind: 'status'; status: StatusInstance; targetIndex: number };
```

### `Effect` — gains a target hint on attacks / buffs

```ts
type Effect =
  | { kind: 'damage'; amount: number; target?: 'foe-active' | 'foe-picked' | 'foe-all'; ... }
  | { kind: 'block';  amount: number; target?: 'self' | 'ally-picked' }
  | { kind: 'heal';   amount: number; target?: 'self' | 'ally-picked' }
  | ...
```

The default-target behaviour keeps existing card data valid; only cards that _want_ a picker need to opt in.

### `CombatAction`

```ts
export type CombatAction =
  | { type: 'PLAY_CARD'; handIndex: number; targetRef?: ActorRef } // target picker
  | { type: 'SWITCH'; teamIndex: number }
  | { type: 'END_TURN' } // ends current actor's turn
  | { type: 'ENEMY_ACT' } // engine-internal: drive the next enemy turn
  | { type: 'ROLL_INITIATIVE' }; // engine-internal: start of round
```

## UI changes

### Turn-order tracker (new)

Top of the stage, between the topbar and the relic strip. Horizontal strip of 1-12 actor portraits in speed order:

```
TURN ORDER  ▸ [Pidgey 18] [Charmander 65] [Rattata 72] [Squirtle 43] [Mewtwo 130] …
                  ▲ now
```

- Each chip = mini portrait + speed value (greyed once that actor has acted this round).
- Foe portraits red-tinted, ally portraits blue-tinted.
- The **current** actor is enlarged + cyan-glowed.
- Tooltip on a portrait: full stat block, current statuses, and the _queued intent_ (for foes) or "your turn" (for the active ally).
- Drives off `state.initiative` + `state.currentTurn` — pure render.

### Intent badge + target arrow

The existing `<IntentBadge>` above an enemy gets a small arrow / wire pointing at the ally it's targeting (via `state.team[intent.targetIndex]`'s screen position). When you hover the enemy, the targeted ally's HP bar pulses red — bidirectional read.

### Card target picker

When the player plays an ATK card with `target: 'foe-picked'` (or BLOCK/heal/buff with `'ally-picked'`):

- Card highlights, hand greys
- Eligible targets get a "click me" pulse
- Click target → card resolves
- ESC cancels

Default-targeted cards (current behaviour) skip the picker entirely.

### Active indicator stays

The wiggling pokéball on each side's "active" slot still tracks `playerActiveIndex` / `enemyActiveIndex`. It's the _default target_ indicator now, not "the only one that exists."

## Implementation order

**Workflow rule for the whole epoch:** every UI piece ships as a **standalone component with its own Storybook stories first**, covering edge cases (empty, 1 actor, full 6v6, mid-turn, post-faint, etc.). Only after the component reads correctly in isolation does it get wired into `BattleStage` and the live reducer. No "preview by running the full app" — that's how layout bugs hide.

Each group below splits cleanly into **(A) standalone component + stories** → **(B) integration**. Engine groups (C1, C3, C7, C8) ship the data-model change first with reducer tests, then any UI mounts on top.

| Group                                       | Scope                                                                                                                                                                                                                                                                                                                                                                                                                        | Done signal                                                                                                                     |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **C1 — Multi-enemy data model**             | Migrate `enemy → enemies[]`. Add `enemyActiveIndex`. Update all selectors / reducer paths. UI keeps showing one enemy (renders `state.enemies[enemyActiveIndex]`).                                                                                                                                                                                                                                                           | All existing tests still pass. Stories render identically.                                                                      |
| **C2 — Per-enemy intents w/ target**        | **(A)** New `<EnemyIntentLine>` storybook component: an intent badge wired to an arrow / line pointing at the target ally slot. Stories: 1 enemy / 6 enemies, attack-target / defend-self / status-target, multi-enemy converging on the same ally. **(B)** Reducer wiring: `intents: Intent[]`, each grows `targetIndex`; apply damage to `team[intent.targetIndex]`. PartyCluster + BattleStage wire up the new component. | Storybook shows the targeting arrows correctly in isolation; multi-enemy battle in BattleStage routes damage to the right ally. |
| **C3 — Initiative queue + per-actor turns** | **(A)** Pure engine: add `initiative`, `currentTurn`, `round` to `CombatState`; new actions `ROLL_INITIATIVE`, `ENEMY_ACT`; reducer tests for queue ordering, paralyze-halving, ties, faint-mid-round. No UI work — verified entirely via reducer unit tests. **(B)** No UI integration in this group; the tracker UI lands in C4.                                                                                           | Unit tests cover 1v1, 2v2, 6v6, paralyze, faint-skips-actor. 1v1 fight in the existing UI still works identically.              |
| **C4 — Turn-order tracker UI**              | **(A)** New `<TurnTracker>` component + stories: 1-actor, 6-actor, 12-actor, current-actor highlight, acted-greyed-out, paralyze-half-speed indicator, hover tooltip on a portrait. Driven purely from props (no reducer hookup). **(B)** Mount in BattleStage, reading `state.initiative` + `state.currentTurn`.                                                                                                            | Tracker eyeballed in isolation across all listed scenarios; in BattleStage it visibly updates as turns advance.                 |
| **C5 — Card target picker**                 | **(A)** New `<TargetPicker>` overlay component + stories: "select an enemy" mode (eligible foes pulse), "select an ally" mode, ESC cancels, hover highlight, multi-target preview (e.g. "all foes"). Driven by props (a target spec + an `onPick` callback). **(B)** `PLAY_CARD` grows `targetRef`; cards opt into target modes; Hand wires the picker on card click.                                                        | Picker stories work standalone; in BattleStage a new "Helping Hand" card lands +block on the chosen bench ally.                 |
| **C6 — Switching consumes a card play**     | **(A)** No new standalone component (uses existing card / cluster UI); add stories showing switch mid-round leaves the new mon out of initiative until next round. **(B)** Reducer wiring: switch sets `team[playerActiveIndex]` swap; current actor's turn ends after the switch resolves; new mon enters next round's initiative under its own speed.                                                                      | Story: switch mid-round → new active mon doesn't get a turn this round, picks up next round.                                    |
| **C7 — Status timing per-actor**            | Status ticks move from end-of-side to end-of-actor's-turn. `statusTick.ts` becomes per-actor. Bench mons' statuses still tick once at end of round (per "Open questions"). Reducer-only change with new unit tests; no UI work.                                                                                                                                                                                              | Burn on Charmander ticks when Charmander's turn ends, NOT when the side ends.                                                   |
| **C8 — Win/lose check per faint**           | Outcome check fires every time HP hits 0 on any mon. Reducer-only change with tests.                                                                                                                                                                                                                                                                                                                                         | A "kill the player's last mon mid-round" story flips to `lose` immediately.                                                     |

**Storybook discipline:** stories live next to the component (`<Component>.stories.tsx`), use the existing `@storybook/react-vite` setup, and cover the edge-case matrix listed above. No story = no merge for the (A) half of each group.

## Migration safety

- Each group is a discrete PR; engine stays compilable between groups.
- Tests: extend `combat/reducer.test.ts` and `combat/initiative.test.ts` (new). Snapshot of the initiative queue before/after key actions.
- Storybook: new `BattleStage` stories per group (`2v2-speed-test`, `targeted-block`, `switch-mid-round`, etc).
- Card data: every existing card stays valid because new fields (target hints) are optional and default to today's behaviour.
- `combat.test.ts` integration: a couple of full-fight smoke tests at the end of C8 to lock the loop.

## Open questions (defer until we hit the relevant group)

- **Initiative ties.** Two mons with identical speed → tiebreaker rule? Proposed: random (seeded), with a stat-stages tiebreak before random. Decide at C3.
- **Trick Room / Tailwind cards.** When? Probably C3 alongside the queue, since manipulating the queue is the whole point.
- **AoE / multi-target damage.** Already present in card data (e.g. "Rip and Tear: deal 7 to a random enemy twice"); the picker mode needs a `foe-random` variant. Decide at C5.
- **Bench-attack cards.** Cards that hit a non-active foe — does the picker allow `foe-picked` always, or only when the card explicitly opts in? Probably opt-in. Decide at C5.
- **Status decay timing on bench mons.** Bench mons don't take turns — do their statuses decay anyway? Proposed: yes, at end of round, one tick. Otherwise a benched paralyzed mon never recovers. Decide at C7.

## Session progress log

- **2026-05-31** — Plan drafted, no code yet. Implementation order C1-C8 locked. Open questions parked for their respective groups.
