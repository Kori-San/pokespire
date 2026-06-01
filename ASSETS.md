# Assets

Origin, license, and refresh procedure for every binary asset committed to this repo.
Pokespire is a **non-commercial fan project**; Pokémon-related assets belong to their
owners (Nintendo / Game Freak / The Pokémon Company).

See [`wiki/legal-and-credits.md`](wiki/legal-and-credits.md) for the player-facing
in-game credits text.

## Move-category icons

The BW battle-UI physical / special / status banner icons shown on every damage card.
Plus an `undefined` blank used as the base layer for custom categories (BALL / ITEM /
buff) — the matching item icon from Showdown's `itemicons/` set is overlaid on top.

| Path                                        | Source                                                                                                | Refresh |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------- |
| `public/sprites/move-category/physical.png` | [Pokémon Showdown — `Physical.png`](https://play.pokemonshowdown.com/sprites/categories/Physical.png) | manual  |
| `public/sprites/move-category/special.png`  | [Pokémon Showdown — `Special.png`](https://play.pokemonshowdown.com/sprites/categories/Special.png)   | manual  |
| `public/sprites/move-category/status.png`   | [Pokémon Showdown — `Status.png`](https://play.pokemonshowdown.com/sprites/categories/Status.png)     | manual  |

Three 32×14 PNGs. Refresh: re-download from the URLs above into
`public/sprites/move-category/`. BALL / ITEM cards fall back to `status.png`.

## Battle backgrounds

Custom battlefield backgrounds for each biome — pixel art, 16:9, no characters, wide
open foreground compatible with the StS-style multi-mon cluster layout. Vendored
locally instead of pulling Showdown's CDN bgs because Showdown's are composition-baked
for two diagonal mounds (one mon per side), which fights our 1-6 vs 1-6 scene.

| Path                                  | Source                                               | Refresh |
| ------------------------------------- | ---------------------------------------------------- | ------- |
| `public/sprites/bg/meadow-midday.png` | Authored by [@Kori-San](https://github.com/Kori-San) | manual  |
| `public/sprites/bg/meadow-dawn.png`   | Authored by [@Kori-San](https://github.com/Kori-San) | manual  |
| `public/sprites/bg/meadow-sunset.png` | Authored by [@Kori-San](https://github.com/Kori-San) | manual  |
| `public/sprites/bg/meadow-night.png`  | Authored by [@Kori-San](https://github.com/Kori-San) | manual  |

v0 only ships the meadow biome (four time-of-day variants). Future biomes append to
`src/data/battleBackgrounds.ts` as their assets land.

## Pokémon sprites + items + trainers (vendored from Pokémon Showdown)

Three scripts vendor the bulk of the runtime asset payload — sprites, species stats,
localized names. The shipped app reads only local files, never hits Showdown or PokéAPI.

| Path                                              | Source                                                                                                | Refresh                 |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------- |
| `public/sprites/pokemon/animated[-back][-shiny]/` | [Pokémon Showdown — `gen5ani` buckets](https://play.pokemonshowdown.com/sprites/gen5ani/)             | `npm run fetch-sprites` |
| `public/sprites/pokemon/static[-back][-shiny]/`   | [Pokémon Showdown — `gen5` buckets](https://play.pokemonshowdown.com/sprites/gen5/)                   | `npm run fetch-sprites` |
| `public/sprites/pokemon/fallback/missingno.gif`   | _Missingno Sprite_ by [RetroNC](https://www.deviantart.com/retronc) on DeviantArt — fan work          | manual                  |
| `public/sprites/items/*.png`                      | [Pokémon Showdown — `itemicons/`](https://play.pokemonshowdown.com/sprites/itemicons/)                | `npm run fetch-sprites` |
| `public/sprites/trainers/*.png`                   | [Pokémon Showdown — `trainers/`](https://play.pokemonshowdown.com/sprites/trainers/)                  | `npm run fetch-sprites` |
| `src/data/pokedex.ts`                             | [Showdown `data/pokedex.json`](https://play.pokemonshowdown.com/data/pokedex.json) + PokéAPI gap-fill | `npm run fetch-pokedex` |
| `src/data/speciesIndex.ts`                        | [Showdown `sprites/index.js`](https://play.pokemonshowdown.com/sprites/index.js)                      | `npm run fetch-sprites` |
| `src/locales/{en,fr}/pokemonNames.json`           | [PokéAPI](https://pokeapi.co/) `/pokemon-species/{id}/names`                                          | `npm run fetch-pokedex` |

The sprite resolver ([`src/services/sprites.ts`](src/services/sprites.ts)) reads
`SPRITE_INDEX` and resolves each species to the best-available local file:
**animated > static > missingno**. We stay strictly in the BW art style (no HOME
3D-render mixing) — if a species lacks both the animated GIF and static PNG, it
falls through to `missingno.gif` rather than swapping aesthetics.

Coverage at last fetch: **1240 species** indexed (Gen 1-8 + Pokestar Studios + canon
form variants; CAP and Gen 9 filtered out). Animated tier covers ~82%, static fallback
~11%, missing ~7% (mostly Gen-8 Galarian forms with no community sprite yet). Run
`npm run audit-coverage` for a current per-species report.

`fetch-sprites` also consults four [Smogon BW Sprite Project](https://docs.google.com/spreadsheets/d/1Gn0UORn-unvcbUeQhQdEBz0ADNcH49BZZqQ1dpXm9eo/)
tracker sheets and downloads any community sprite Showdown's CDN hasn't synced yet —
gap-closing happens automatically.

Licence: Showdown sprites are community-contributed under the [Smogon BW Sprite
Project's published terms](https://www.smogon.com/forums/threads/3669764/) (free
non-commercial use). PokéAPI data is [CC-BY-SA 4.0](https://pokeapi.co/about).

## Fonts

| Path                                | Family         | License                   | Source                                                           |
| ----------------------------------- | -------------- | ------------------------- | ---------------------------------------------------------------- |
| `public/fonts/OFL-PressStart2P.txt` | Press Start 2P | SIL Open Font License 1.1 | [Google Fonts](https://fonts.google.com/specimen/Press+Start+2P) |
| `public/fonts/OFL-PixelifySans.txt` | Pixelify Sans  | SIL Open Font License 1.1 | [Google Fonts](https://fonts.google.com/specimen/Pixelify+Sans)  |

OFL allows redistribution and use; we self-host the `.woff2` files alongside the `OFL.txt`
license file as required.

## In-game credit obligations

The Credits screen (G8) must surface every asset source listed above and below as it
grows. The repo `LICENSE` covers code only; asset rights belong to their owners.
