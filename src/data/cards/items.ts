import type { CardDef } from '@/types';

/**
 * Generic consumables that aren't canonical Pokémon moves — POTION, X ATTACK,
 * REPEL, MEGA EVOLVE, DYNAMAX, … Visually flagged by the `--card-item` border
 * (potion amber) regardless of `card.type`. Empty for now; items land as the
 * pool grows.
 */
export const ITEM_CARDS: CardDef[] = [];
