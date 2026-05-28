import type { CardDef } from '@/types';

export const GHOST_CARDS: CardDef[] = [
  {
    id: 'shadowBall',
    name: 'SHADOW BALL',
    type: 'ghost',
    cost: 2,
    kind: 'ATK',
    category: 'special',
    rarity: 'uncommon',
    effects: [
      { kind: 'damage', amount: 16 },
      { kind: 'stat', target: 'foe', stat: 'spDef', stages: -1 },
    ],
  },
  {
    id: 'shadowClaw',
    name: 'SHADOW CLAW',
    type: 'ghost',
    cost: 1,
    kind: 'ATK',
    category: 'physical',
    rarity: 'rare',
    effects: [
      { kind: 'damage', amount: 12 },
      { kind: 'stat', target: 'self', stat: 'crit', stages: 1 },
    ],
  },
];
