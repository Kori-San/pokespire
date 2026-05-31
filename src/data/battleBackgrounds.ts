/**
 * Battle backgrounds, split into three orthogonal axes:
 *
 *   - **biome**: the place (currently only `meadow`; future biomes add entries here)
 *   - **time**:  dawn / midday / sunset / night — one bg image per (biome, time) pair
 *   - **weather**: an OPTIONAL transparent PNG layered over the bg (rain / sun / sand /
 *     hail / clear). Assets land later — `weatherOverlayUrl()` returns undefined until
 *     the file exists at the expected path. `clear` means "no overlay".
 *
 * Splitting the axes lets BattleStage take three independent props (and exposes three
 * Storybook controls) instead of one mashed-up id per combination.
 */

export const BIOMES = ['meadow'] as const;
export type Biome = (typeof BIOMES)[number];

export const TIMES_OF_DAY = ['dawn', 'midday', 'sunset', 'night'] as const;
export type TimeOfDay = (typeof TIMES_OF_DAY)[number];

/** `clear` = no overlay; the other four match the weather cards' kinds. */
export const WEATHERS = ['clear', 'sun', 'rain', 'sand', 'hail'] as const;
export type Weather = (typeof WEATHERS)[number];

export function backgroundUrl(biome: Biome, time: TimeOfDay): string {
  return `/sprites/bg/${biome}-${time}.png`;
}

/**
 * Returns the transparent overlay URL for a given weather, or `undefined` when no
 * overlay should be painted (the `clear` weather, or assets not yet shipped). The
 * BattleStage just doesn't render the overlay div when this is undefined.
 */
export function weatherOverlayUrl(weather: Weather): string | undefined {
  if (weather === 'clear') return undefined;
  return `/sprites/bg/weather-${weather}.png`;
}
