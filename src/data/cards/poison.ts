import type { CardDef } from '@/types';

export const POISON_CARDS: CardDef[] = [
  {
    id: 'sludgeBomb',
    name: 'SLUDGE BOMB',
    type: 'poison',
    cost: 2,
    kind: 'ATK',
    category: 'special',
    rarity: 'uncommon',
    effects: [{ kind: 'damage', amount: 18 }],
  },
  {
    id: 'poisonJab',
    name: 'POISON JAB',
    type: 'poison',
    cost: 2,
    kind: 'ATK',
    category: 'physical',
    rarity: 'uncommon',
    effects: [{ kind: 'damage', amount: 16 }],
  },
  {
    id: 'coil',
    name: 'COIL',
    type: 'poison',
    cost: 1,
    kind: 'SKL',
    category: 'status',
    rarity: 'rare',
    effects: [
      { kind: 'stat', target: 'self', stat: 'atk', stages: 1 },
      { kind: 'stat', target: 'self', stat: 'def', stages: 1 },
    ],
  },
];
