import type { CardDef, PokeType } from '@/types';

/**
 * Gen-VIII signature G-Max moves. Per pokepedia canon: when a species with a Gigantamax
 * forme dynamaxes, its same-type attack cards become the species-specific G-Max move
 * instead of the generic `MAX_MOVES[type]`. Off-type cards still go through the generic
 * Max table (a Gmaxed Charizard's Aerial Ace becomes Max Airstream, not Fournaise G-Max).
 *
 * Keyed by **base** species slug (`charizard`, not `charizard-gmax`) — the lookup at
 * runtime fires while the active mon's `speciesSlug` is already swapped to the Gmax form,
 * so we read from `combatant.dynamax.prevSlug` to find the matching entry.
 *
 * Base damage is bumped to 22 (vs 18 for generic Max moves) to keep the species-signature
 * feel rewarding without dwarfing the typed Max secondaries. Each carries a stronger /
 * thematic secondary.
 */
const GMAX_DAMAGE = 22;

export interface GmaxMove {
  /** The type of cards this G-Max replaces — usually the species' primary type. */
  matchType: PokeType;
  card: CardDef;
}

export const GMAX_MOVES: Record<string, GmaxMove> = {
  charizard: {
    matchType: 'fire',
    card: {
      id: 'gmaxWildfire',
      name: 'G-MAX WILDFIRE',
      type: 'fire',
      cost: 1,
      kind: 'ATK',
      category: 'special',
      rarity: 'epic',
      theme: 'dynamax',
      effects: [
        { kind: 'damage', amount: GMAX_DAMAGE },
        // Canon: residual burn each turn for 4 turns. Map to 4 stacks of Burn.
        { kind: 'applyStatus', target: 'foe', status: 'burn', stacks: 4 },
      ],
    },
  },
  pikachu: {
    matchType: 'electric',
    card: {
      id: 'gmaxVoltCrash',
      name: 'G-MAX VOLT CRASH',
      type: 'electric',
      cost: 1,
      kind: 'ATK',
      category: 'special',
      rarity: 'epic',
      theme: 'dynamax',
      effects: [
        { kind: 'damage', amount: GMAX_DAMAGE },
        // Canon: paralyzes the foe.
        { kind: 'applyStatus', target: 'foe', status: 'paralyze', stacks: 3 },
      ],
    },
  },
  snorlax: {
    matchType: 'normal',
    card: {
      id: 'gmaxReplenish',
      name: 'G-MAX REPLENISH',
      type: 'normal',
      cost: 1,
      kind: 'ATK',
      category: 'physical',
      rarity: 'epic',
      theme: 'dynamax',
      effects: [
        { kind: 'damage', amount: GMAX_DAMAGE },
        // Canon: "restores consumed Berries". Map to a chunky self-heal — same vibe of
        // recovery while smashing the foe.
        { kind: 'heal', amount: 15 },
      ],
    },
  },
  gengar: {
    matchType: 'ghost',
    card: {
      id: 'gmaxTerror',
      name: 'G-MAX TERROR',
      type: 'ghost',
      cost: 1,
      kind: 'ATK',
      category: 'special',
      rarity: 'epic',
      theme: 'dynamax',
      effects: [
        { kind: 'damage', amount: GMAX_DAMAGE },
        // Canon: prevents the foe from switching. No switch-lock engine yet — map to a
        // hefty Speed cut so the foe can't reliably go first the next turn (rough proxy).
        { kind: 'stat', target: 'foe', stat: 'spd', stages: -2 },
      ],
    },
  },
  corviknight: {
    matchType: 'flying',
    card: {
      id: 'gmaxWindRage',
      name: 'G-MAX WIND RAGE',
      type: 'flying',
      cost: 1,
      kind: 'ATK',
      category: 'physical',
      rarity: 'epic',
      theme: 'dynamax',
      effects: [
        { kind: 'damage', amount: GMAX_DAMAGE },
        // Canon: scrubs the field of terrain / hazards. No-hazard engine yet — give the
        // user a Speed bump as the "fresh sky" proxy.
        { kind: 'stat', target: 'self', stat: 'spd', stages: 1 },
      ],
    },
  },
};

export const GMAX_CARDS: CardDef[] = Object.values(GMAX_MOVES).map((g) => g.card);
