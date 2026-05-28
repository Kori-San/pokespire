import type { CardDef } from '@/types';

/**
 * Capture cards — drawn from the deck like any other card, but resolve into a
 * capture roll instead of damage. Visually flagged by the `--card-ball` border
 * (Poké Ball red) regardless of `card.type`. Catch chance climbs with tier:
 * Poké (×1) < Great (×1.5) < Ultra (×2) < Master (guaranteed).
 */
export const BALL_CARDS: CardDef[] = [
  {
    id: 'pokeBall',
    name: 'POKÉ BALL',
    type: 'normal',
    cost: 1,
    kind: 'BALL',
    category: 'status',
    rarity: 'common',
    effects: [{ kind: 'capture', ballTier: 'poke' }],
  },
  {
    id: 'greatBall',
    name: 'GREAT BALL',
    type: 'normal',
    cost: 2,
    kind: 'BALL',
    category: 'status',
    rarity: 'uncommon',
    effects: [{ kind: 'capture', ballTier: 'great' }],
  },
  {
    id: 'ultraBall',
    name: 'ULTRA BALL',
    type: 'normal',
    cost: 2,
    kind: 'BALL',
    category: 'status',
    rarity: 'rare',
    effects: [{ kind: 'capture', ballTier: 'ultra' }],
  },
  {
    id: 'masterBall',
    name: 'MASTER BALL',
    type: 'normal',
    cost: 3,
    kind: 'BALL',
    category: 'status',
    rarity: 'epic',
    effects: [{ kind: 'capture', ballTier: 'master' }],
  },
];
