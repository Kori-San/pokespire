# Shops & economy

## Gold

`RunState.inventory.gold`. Sources: battle rewards (scaled by enemy tier), Amulet Coin
held item (+30%), some map events. Gold is per-run (resets each run).

## Shops

Spawn on ~30% of `shop` nodes (shops appear ~2× per run). Stock is generated in
`data/shops.ts` from a random selection:

| Category         | Qty | Notes                                                                |
| ---------------- | --- | -------------------------------------------------------------------- |
| Cards            | 3   | Buy adds to deck.                                                    |
| Evolution stones | 1–2 | Fire / Water / Thunder / Leaf / Moon / Linking Cord.                 |
| Held items       | 2   | From the v0 item set.                                                |
| Berries          | 2   | Cheaper than items.                                                  |
| Attractor (Lure) | 1   | Biases next floor's encounters toward a type. Persistent until used. |
| Card removal     | 1   | Remove a card from your deck. Price climbs each use this run.        |

Attractors connect to [encounters.md](encounters.md); the A5 Encounter-Targeting unlock is
a separate meta-level biasing tool.
