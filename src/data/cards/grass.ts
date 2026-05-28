import type { CardDef } from '@/types';

export const GRASS_CARDS: CardDef[] = [
  {
    id: 'vineWhip',
    name: 'VINE WHIP',
    type: 'grass',
    cost: 1,
    kind: 'ATK',
    category: 'physical',
    rarity: 'uncommon',
    effects: [{ kind: 'damage', amount: 9 }],
  },
  {
    id: 'energyBall',
    name: 'ENERGY BALL',
    type: 'grass',
    cost: 2,
    kind: 'ATK',
    category: 'special',
    rarity: 'uncommon',
    effects: [
      { kind: 'damage', amount: 18 },
      { kind: 'stat', target: 'foe', stat: 'spDef', stages: -1 },
    ],
  },
  {
    id: 'leafBlade',
    name: 'LEAF BLADE',
    type: 'grass',
    cost: 2,
    kind: 'ATK',
    category: 'physical',
    rarity: 'rare',
    effects: [{ kind: 'damage', amount: 20 }],
  },
  {
    id: 'growth',
    name: 'GROWTH',
    type: 'grass',
    cost: 1,
    kind: 'SKL',
    category: 'status',
    rarity: 'uncommon',
    effects: [
      { kind: 'stat', target: 'self', stat: 'atk', stages: 1 },
      { kind: 'stat', target: 'self', stat: 'spAtk', stages: 1 },
    ],
  },
];
