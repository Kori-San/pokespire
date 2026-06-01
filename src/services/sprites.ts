import { SPRITE_INDEX } from '@/data/speciesIndex';

export const SPRITE_BASE = '/sprites/pokemon';
export const FALLBACK_SPRITE = '/sprites/pokemon/fallback/missingno.gif';

export type Facing = 'front' | 'back';

export interface SpriteOptions {
  facing?: Facing;
  shiny?: boolean;
  /**
   * Request the female-distinct variant. Only honoured when `SPRITE_INDEX[slug].female`
   * is true (Showdown ships a separate `${stem}f` file for that species). Otherwise the
   * default sprite is returned regardless — most species are not visually dimorphic.
   */
  female?: boolean;
}

/**
 * Local path to a vendored Showdown sprite, keyed by **speciesSlug** (PokéAPI-style:
 * `bulbasaur`, `mr-mime`, `charizard-mega-x`, `pokestar-smeargle`).
 *
 * Tier picked at vendor time (see `scripts/fetch-sprites.mjs`):
 *   - `animated` → `pokemon/animated[-back][-shiny]/<stem>.gif`
 *   - `static`   → `pokemon/static[-back][-shiny]/<stem>.png` (same BW aesthetic, just a still)
 *   - `missing`  → falls back to `FALLBACK_SPRITE`
 *
 * Pure local paths — zero runtime network. Unknown slugs degrade to the missingno
 * placeholder gracefully.
 */
export function spriteUrl(speciesSlug: string, options: SpriteOptions = {}): string {
  const entry = SPRITE_INDEX[speciesSlug];
  if (!entry || entry.tier === 'missing') return FALLBACK_SPRITE;
  const { facing = 'front', shiny = false, female = false } = options;
  const useFemale = female && entry.female;
  const stem = useFemale ? `${entry.stem}-f` : entry.stem;
  const backSuffix = facing === 'back' ? '-back' : '';
  const shinySuffix = shiny ? '-shiny' : '';
  const ext = entry.tier === 'animated' ? 'gif' : 'png';
  return `${SPRITE_BASE}/${entry.tier}${backSuffix}${shinySuffix}/${stem}.${ext}`;
}
