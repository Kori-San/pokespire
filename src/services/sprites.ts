export const SPRITE_BASE = '/sprites/pokemon';
export const FALLBACK_SPRITE = '/sprites/fallback/missingno.gif';

export type Facing = 'front' | 'back';

export interface SpriteOptions {
  facing?: Facing;
  shiny?: boolean;
  female?: boolean;
}

/**
 * Local path to a vendored sprite, keyed by **formId** (e.g. `charmander`,
 * `charizard-mega-x`, `rattata-alola`) so each form of a species resolves to its own
 * asset. Files are downloaded once by `scripts/fetch-pokedex.mjs` and served by us — no
 * runtime PokéAPI. If a file is missing the <img> should fall back to {@link FALLBACK_SPRITE}.
 */
export function spriteUrl(formId: string, options: SpriteOptions = {}): string {
  const { facing = 'front', shiny = false, female = false } = options;
  const variant = `${facing}${shiny ? '-shiny' : ''}${female ? '-female' : ''}`;
  return `${SPRITE_BASE}/${variant}/${formId}.gif`;
}
