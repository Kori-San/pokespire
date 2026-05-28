# Design overview

## North star

> A non-commercial Pokémon fan-game, in web technologies, so people can play anywhere
> and save their progress — like Pokerogue. A Slay-the-Spire-style roguelike deckbuilder
> where the team-switch decision is the heart of combat.

## Pillars

1. **The switch is the lever.** Cards are type-flavored but not Pokémon-locked. Your deck carries cards of many types; landing STAB and good type matchups means switching the active Pokémon. 18-type effectiveness makes every fight a positioning puzzle.
2. **A growing collection.** Capture wild Pokémon, level them, evolve them, complete the Pokédex. Captures unlock new starters across runs.
3. **Readable depth.** Type math is intimidating — so cards show their _computed_ damage for the current matchup (STAB, effectiveness, level, item, weather all pre-applied), with effectiveness tags and a breakdown tooltip.
4. **Earned challenge.** Regular up-to-6 teams at Ascension 0 is the balance baseline. Solo legendaries and the Ascension ladder are opt-in difficulty for mastery.
5. **Real Pokémon mechanics, deckbuilder spine.** The math IS the math: STAB, type effectiveness, physical/special split, stat stages, speed turn-order, real capture formula. Where canon doesn't fit a deckbuilder (Mega Stones, Trade evolutions), Pokespire substitutes one clear rule (Mega/Dynamax are cards; trades become Linking Cord stones) rather than diverging into something un-Pokémon. New mechanics added on top — Ascensions, rarity tied to PP, universal starter deck — keep the same flavor. The test for any rule: would a Pokémon player feel at home? If not, find the rule that does.

## Core loop

Pick a starter (L5) → traverse a branching map → card battles (switch for STAB, whittle + capture wild mons) → earn XP, cards, gold, items → evolve mid-run → beat the boss → run ends, meta updates (Dex, unlocked starters, Ascension). Repeat, climbing Ascensions and completing the Dex.

## Scope

- **v0 (MVP):** Gen 1 (151), full combat + run loop + persistence + items/weather/shops + special-mon solo mode + Ascension ladder + FR/EN + PWA.
- **Later:** more gens, special forms (paradox/Gmax/mega), friendship meta, cloud sync. See [`../TODO.md`](../TODO.md).

## Locked tech

Vite + React 18 + TypeScript + Zustand + Dexie + CSS Modules, no router. PWA, FR/EN i18n, Vercel static deploy. Saves in IndexedDB with a schema shaped for future cloud sync.
