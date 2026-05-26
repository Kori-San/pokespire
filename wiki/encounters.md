# Encounters

## Map

`generateMap(seed)` builds a layered DAG: ~15 rows × 1–4 nodes, fixed boss on top.
Node types: `battle | elite | event | shop | rest | boss | legendary`.

**v0 scope:** `battle | elite | boss` fully resolve. `event | rest` are reward stubs
(hooks exist; content later). `shop` is implemented (see [shops-and-economy.md](shops-and-economy.md)).
`legendary` = a run's final boss rolling a special mon (see [legendaries.md](legendaries.md)).

## Enemy roster & intents

Enemies are Gen 1 species with type-appropriate intent tables in `data/enemies.ts`.
Intent is telegraphed (attack / buff / status) so the player can plan switches. Enemy
intent does **not** re-roll when you switch.

## Encounter biasing

Two independent tools nudge which wild Pokémon appear (both adjust weighted tables, neither guarantees):

- **Attractors / Lures** (in-run, from shops) — bias the _next floor_ toward a chosen type.
- **Encounter Targeting** (meta, A5 unlock) — preselect 5 species + 1 boss to bias spawns across a run, to help Dex completion.

## Rest nodes (daycare)

Rest sites offer a choice: full-heal the active mon, **or** grant bench mons ~15% of a
level's XP (daycare). A real tradeoff between survival and growth.
