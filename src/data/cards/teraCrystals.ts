import type { CardDef, PokeType } from '@/types';
import { POKE_TYPES } from '@/types';

/**
 * Gen-IX Terastallization — one card per Pokémon type. Playing a Tera card locks the
 * active mon's `tera.type` to that type for the rest of combat (no revert; once per
 * battle via `exhaust: true`).
 *
 * Canon Tera Boost (`damage.ts`):
 *   - Tera type matches card type AND was in the mon's original types → STAB ×2.
 *   - Tera type matches card type but was NOT in originals → STAB ×1.5.
 *   - Tera type doesn't match card type → no STAB (the mon counts as ONLY its Tera type).
 *
 * Same `theme: 'tera'` for all 18 cards; the card's `type` field drives the chrome tint
 * (Tera Fire = orange gem, Tera Water = blue gem, …), the theme adds the crystal facet
 * border + twinkle so the whole family reads as gems. Rarity is `rare` (not `epic`) —
 * 18 distinct cards in the pool, so individual drops should be a bit easier than
 * Mega / Dynamax to compensate.
 */
function teraCardOf(type: PokeType): CardDef {
  const cap = type.charAt(0).toUpperCase() + type.slice(1);
  return {
    id: `tera${cap}`,
    name: `TERA ${type.toUpperCase()}`,
    type,
    cost: 2,
    kind: 'SKL',
    category: 'status',
    rarity: 'rare',
    theme: 'tera',
    exhaust: true,
    effects: [{ kind: 'terastallize', teraType: type }],
  };
}

export const TERA_CARDS: CardDef[] = POKE_TYPES.map(teraCardOf);
