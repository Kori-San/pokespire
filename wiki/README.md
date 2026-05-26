# Wiki — game design & theorycraft

The **living design bible** for Pokespire. Why the game works the way it does, the
math behind it, and balance reasoning. Technical standards live in [`../rules/`](../rules/).

## Index

- [design-overview.md](design-overview.md) — north star, pillars, core loop.
- [combat-formula.md](combat-formula.md) — damage/capture math, worked examples.
- [progression.md](progression.md) — levels, XP curves, evolution, starters.
- [ascensions.md](ascensions.md) — difficulty ladder + reasoning.
- [legendaries.md](legendaries.md) — special mons, solo mode, unlock flow.
- [shinies.md](shinies.md) — rates, catch bonus, UI.
- [held-items-and-berries.md](held-items-and-berries.md) — item registry + effects.
- [weather.md](weather.md) — four weathers, type interactions.
- [shops-and-economy.md](shops-and-economy.md) — gold flow, stock, prices.
- [cards.md](cards.md) — card design rules + pool.
- [encounters.md](encounters.md) — enemy roster, intents, attractors.
- [legal-and-credits.md](legal-and-credits.md) — PokéAPI / Smogon / OFL credits.

> Numbers here are the **design intent**; the implementation in `src/data/` is the source
> of truth for shipped values. When they drift, update this wiki in the same change.
