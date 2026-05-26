# Progression — levels, XP, evolution, starters

## Levels & XP

- Every team member: `{ speciesId, level, currentXp, growthRate, currentHp, statuses[], equippedItem? }`.
- **Everyone starts at L5.** Captured mons join at the **enemy's level** at capture time.
- **Per-run only:** levels reset each run. The Dex and unlocked starters persist; combat power does not. (More Slay-the-Spire than Pokerogue.)
- **Growth rates:** all 6 real Pokémon curves (slow / medium-slow / medium-fast / fast / erratic / fluctuating), per species from PokéAPI `growth_rate`. A legendary on the _slow_ curve levels noticeably slower than a starter — a key balance lever.
- **XP award:** scaled by enemy level/tier. Active mon full share; bench ~50% (reduced by Ascension). Bosses give a lump. `xp = floor((baseYield × enemyLevel) / 7)`.

XP-curve targets: a starter run climbs ~L5 → ~L25 over a 15-floor map; a solo legendary
climbs slower (slow curve + no bench share).

## Evolution

- **Level-up evolutions** auto-fire at the canonical level (Charmander → Charmeleon @ L16).
- **Stone evolutions** (Vulpix, Eevee, Growlithe, Pikachu, Staryu, Clefairy, Nidorina/Nidorino, Gloom, Poliwhirl…) need a stone from a rare reward node or shop.
- **Trade evolutions** (Kadabra, Machoke, Graveler, Haunter) → re-routed to a **Linking Cord** stone; no trade mechanic.
- **Gen 1 forms only** in v0. Eevee → Vaporeon/Jolteon/Flareon; Gen 2+ eeveelutions arrive later. Onix stops at Onix.
- **Move-learning on evolve:** an overlay offers a **1-of-3 card draft** (biased to the evolved form's type); pick one to add to the deck, or skip. A power spike at the evolution moment.

## Starters

- **Always-available (5):** Bulbasaur, Charmander, Squirtle, Pikachu, Eevee.
- **Unlockable:** any **base-form** species captured in a prior run becomes a selectable starter forever. Evolved forms are never selectable — reached only via in-run evolution.
- **Special mons (solo-only):** see [legendaries.md](legendaries.md).
- StarterSelect shows each candidate's **evolution line** so you know what you're committing to, plus a Shiny toggle if unlocked.
