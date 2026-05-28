import type { CardDef } from '@/types';

export const GROUND_CARDS: CardDef[] = [
  {
    id: 'earthquake',
    name: 'EARTHQUAKE',
    type: 'ground',
    cost: 3,
    kind: 'ATK',
    category: 'physical',
    rarity: 'uncommon',
    effects: [{ kind: 'damage', amount: 22 }],
  },
  {
    id: 'earthPower',
    name: 'EARTH POWER',
    type: 'ground',
    cost: 2,
    kind: 'ATK',
    category: 'special',
    rarity: 'uncommon',
    effects: [
      { kind: 'damage', amount: 18 },
      { kind: 'stat', target: 'foe', stat: 'spDef', stages: -1 },
    ],
  },
];
