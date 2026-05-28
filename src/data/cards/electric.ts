import type { CardDef } from '@/types';

export const ELECTRIC_CARDS: CardDef[] = [
  {
    id: 'thunderShock',
    name: 'THUNDER SHOCK',
    type: 'electric',
    cost: 1,
    kind: 'ATK',
    category: 'special',
    rarity: 'common',
    effects: [{ kind: 'damage', amount: 8 }],
  },
  {
    id: 'thunderbolt',
    name: 'THUNDERBOLT',
    type: 'electric',
    cost: 2,
    kind: 'ATK',
    category: 'special',
    rarity: 'uncommon',
    effects: [{ kind: 'damage', amount: 18 }],
  },
  {
    id: 'chargeBeam',
    name: 'CHARGE BEAM',
    type: 'electric',
    cost: 1,
    kind: 'ATK',
    category: 'special',
    rarity: 'common',
    effects: [
      { kind: 'damage', amount: 10 },
      { kind: 'stat', target: 'self', stat: 'spAtk', stages: 1 },
    ],
  },
];
