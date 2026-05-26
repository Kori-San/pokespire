# Cards

Data-driven; **no per-card branching in the reducer**. Adding a card edits `data/cards.ts`
(and rarely `data/effects.ts`), never `reducer.ts`.

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

## Design rules

- **Type-flavored, not Pokémon-locked.** A card has one of the 18 types; any mon can play it. STAB rewards matching the active mon's type → the switch lever.
- **Universal starter deck.** All starters begin with the same ~10-card, multi-type deck, so switch-to-STAB tension exists from turn 1.
- **Printed `amount` reads at L5-ish baseline.** The damage formula scales it by level/stats/STAB/eff at play time; the card UI shows the computed result.
- **TM cards:** a subset can be played from hand OR consumed permanently to add a copy to the deck.
- **ORB cards** perform capture (tiers: orb/great/ultra/master).
- **Weather cards** (SUNNY DAY etc.) set battle weather — see [weather.md](weather.md).

## Pool plan

~15 in G2 → ~30 by G4 → final 60–100 across all 18 types by G8, with a balance pass each step.
Maintain the working pool + balance log here as it grows.
