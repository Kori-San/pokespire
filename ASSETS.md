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
for two diagonal mounds (one mon per side), which fights our 1–6 vs 1–6 scene.

| Path                                  | Source                                               | Refresh |
| ------------------------------------- | ---------------------------------------------------- | ------- |
| `public/sprites/bg/meadow-midday.png` | Authored by [@Kori-San](https://github.com/Kori-San) | manual  |
| `public/sprites/bg/meadow-dawn.png`   | Authored by [@Kori-San](https://github.com/Kori-San) | manual  |
| `public/sprites/bg/meadow-sunset.png` | Authored by [@Kori-San](https://github.com/Kori-San) | manual  |
| `public/sprites/bg/meadow-night.png`  | Authored by [@Kori-San](https://github.com/Kori-San) | manual  |

v0 only ships the meadow biome (four time-of-day variants). Future biomes append to
`src/data/battleBackgrounds.ts` as their assets are generated.

## Held-item icons

24×24 item icons from the Pokémon Showdown CDN, used by the relic strip on the battle stage.

| Path                                   | Source                                                                                                     | Refresh |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------- |
| `public/sprites/items/leftovers.png`   | [Pokémon Showdown — `leftovers.png`](https://play.pokemonshowdown.com/sprites/itemicons/leftovers.png)     | manual  |
| `public/sprites/items/flame-plate.png` | [Pokémon Showdown — `flame-plate.png`](https://play.pokemonshowdown.com/sprites/itemicons/flame-plate.png) | manual  |
| `public/sprites/items/choice-band.png` | [Pokémon Showdown — `choice-band.png`](https://play.pokemonshowdown.com/sprites/itemicons/choice-band.png) | manual  |
| `public/sprites/items/leppa-berry.png` | [Pokémon Showdown — `leppa-berry.png`](https://play.pokemonshowdown.com/sprites/itemicons/leppa-berry.png) | manual  |
| `public/sprites/items/poke-ball.png`   | [Pokémon Showdown — `poke-ball.png`](https://play.pokemonshowdown.com/sprites/itemicons/poke-ball.png)     | manual  |

Refresh: re-download from the URLs above into `public/sprites/items/`. Track new items
by adding a row here in the same commit that introduces the file.

## Fallback sprites

| Path                                    | Source                                                                                       | Refresh |
| --------------------------------------- | -------------------------------------------------------------------------------------------- | ------- |
| `public/sprites/fallback/missingno.gif` | _Missingno Sprite_ by [RetroNC](https://www.deviantart.com/retronc) on DeviantArt — fan work | manual  |

Served by the sprite resolver when a species/form has no vendored animated sprite.

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
