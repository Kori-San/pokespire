# Legal & credits

Pokespire is a **non-commercial fan project**. Not affiliated with, endorsed by, or
sponsored by Nintendo, Game Freak, or The Pokémon Company. Pokémon names, sprites, and
related assets are © their respective owners.

## Runtime-fetched assets (not licensed by us)

- **PokéAPI** (pokeapi.co) — data and sprites. Licensed CC-BY-SA 4.0. Credit required in-game (Credits screen) and in README: _"Data and sprites via PokéAPI (pokeapi.co)."_
- **Smogon Sprite Project** — community, non-commercial sprite fallback. Credit + link in Credits.

No binaries from official ROMs are bundled. All Pokémon assets are fetched at runtime from
the credited sources and cached locally per-user.

## Bundled assets we ship

- **Fonts:** Press Start 2P and Pixelify Sans, both SIL Open Font License (OFL 1.1). License files in `public/fonts/` (`OFL-PressStart2P.txt`, `OFL-PixelifySans.txt`).
- **UI chrome / tokens:** neutral GBA-era styling, no IP assets.
- **Missingno fallback sprite** (`public/sprites/fallback/missingno.gif`) — fan work by RetroNC (DeviantArt).

## Code & asset tracking

Code is under the repo `LICENSE`. The committed-asset registry — paths, sources, licenses,
refresh commands — lives in [`../ASSETS.md`](../ASSETS.md) and is updated **in the same commit**
as the asset itself, never deferred.
