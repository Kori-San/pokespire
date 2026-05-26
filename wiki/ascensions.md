# Ascensions

Endgame difficulty ladder modeled on Slay-the-Spire. Each level adds **one stacking
modifier**; beating the boss at the current level unlocks the next. Progress is tracked
per mode in `meta.ascensionProgress` (regular, and separately per solo legendary).

**Balance baseline = regular up-to-6 team at A0.** Everything below is layered on top.

| A   | Modifier (stacks)                                                     |
| --- | --------------------------------------------------------------------- |
| 0   | Baseline. Team cap 6.                                                 |
| 1   | Battle rewards −10%.                                                  |
| 2   | Bench XP share 50% → 35%.                                             |
| 3   | Elites +15% HP.                                                       |
| 4   | First floor has a forced elite.                                       |
| 5   | Capture rate ×0.85. **Unlocks Encounter Targeting.**                  |
| 6   | Stone reward nodes 30% rarer.                                         |
| 7   | Enemies +1 attack tier.                                               |
| 8   | **Team cap 5.**                                                       |
| 9   | Status decay slower (BURN +1 turn).                                   |
| 10  | Starter deck loses its weakest card.                                  |
| 11  | **Bench XP share 35% → 20%.**                                         |
| 12  | Card reward draft 1-of-2.                                             |
| 13  | Turn-1 energy −1.                                                     |
| 14  | **Team cap 4.**                                                       |
| 15  | Enemy type-effectiveness floor lifted (their NORMAL hits your GHOST). |
| 16  | Switch costs 2 energy.                                                |
| 17  | **Bench XP share 20% → 10%.**                                         |
| 18  | **Team cap 3.** Bosses gain a 2nd phase.                              |
| 19  | XP gain −15%.                                                         |
| 20  | **Bench XP share → 0%.** Final boss → "Champion" variant.             |
| 21+ | **Endless:** +8% enemy HP & +5% enemy damage per level, uncapped.     |

## Encounter Targeting (A5 unlock)

Preselect up to **5 species + 1 boss** to bias their spawn weights upward — helps Dex
completion. **No guarantees**; it nudges weighted tables. Stored in
`meta.settings.encounterTargets`. Works in regular and solo runs.

## Philosophy

A0–A5 casual ceiling; A10+ committed; A20 mastery. Solo legendary ≈ A8–A10 difficulty
even at A0, and composes with Ascensions ("Mewtwo solo on A15"). The table is a first
draft — revisit with playtest data (watch A15 for fun-vs-frustration).
