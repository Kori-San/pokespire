import type { CardDef } from '@/types';
import { NORMAL_CARDS } from './normal';
import { FIRE_CARDS } from './fire';
import { WATER_CARDS } from './water';
import { GRASS_CARDS } from './grass';
import { ELECTRIC_CARDS } from './electric';
import { ICE_CARDS } from './ice';
import { FIGHTING_CARDS } from './fighting';
import { POISON_CARDS } from './poison';
import { GROUND_CARDS } from './ground';
import { FLYING_CARDS } from './flying';
import { PSYCHIC_CARDS } from './psychic';
import { BUG_CARDS } from './bug';
import { ROCK_CARDS } from './rock';
import { GHOST_CARDS } from './ghost';
import { DRAGON_CARDS } from './dragon';
import { DARK_CARDS } from './dark';
import { STEEL_CARDS } from './steel';
import { FAIRY_CARDS } from './fairy';
import { BALL_CARDS } from './balls';
import { ITEM_CARDS } from './items';

/**
 * The whole pool, indexed by card id. Per-type files are the source of truth;
 * this module just merges them so consumers can look up `CARDS[id]` without
 * caring which file a card lives in. See [wiki/cards.md](../../../wiki/cards.md).
 *
 * Type-flavored cards (ATK/SKL/PWR) live in `<type>.ts`. BALL and ITEM kinds
 * have their own files since they don't belong to a Pokémon type.
 */
export const CARDS: Record<string, CardDef> = Object.fromEntries(
  [
    ...NORMAL_CARDS,
    ...FIRE_CARDS,
    ...WATER_CARDS,
    ...GRASS_CARDS,
    ...ELECTRIC_CARDS,
    ...ICE_CARDS,
    ...FIGHTING_CARDS,
    ...POISON_CARDS,
    ...GROUND_CARDS,
    ...FLYING_CARDS,
    ...PSYCHIC_CARDS,
    ...BUG_CARDS,
    ...ROCK_CARDS,
    ...GHOST_CARDS,
    ...DRAGON_CARDS,
    ...DARK_CARDS,
    ...STEEL_CARDS,
    ...FAIRY_CARDS,
    ...BALL_CARDS,
    ...ITEM_CARDS,
  ].map((c) => [c.id, c]),
);

/** The universal opening deck — same for every starter, spanning multiple types. */
export const STARTER_DECK: string[] = [
  'tackle',
  'tackle',
  'quickAttack',
  'ember',
  'waterGun',
  'vineWhip',
  'thunderShock',
  'harden',
  'growl',
  'focusEnergy',
  'pokeBall',
];
