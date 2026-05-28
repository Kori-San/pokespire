import type { CardDef } from '@/types';

export const FIGHTING_CARDS: CardDef[] = [
  {
    id: 'doubleKick',
    name: 'DOUBLE KICK',
    type: 'fighting',
    cost: 2,
    kind: 'ATK',
    category: 'physical',
    rarity: 'common',
    effects: [{ kind: 'damage', amount: 14 }],
  },
  {
    id: 'closeCombat',
    name: 'CLOSE COMBAT',
    type: 'fighting',
    cost: 3,
    kind: 'ATK',
    category: 'physical',
    rarity: 'rare',
    effects: [
      { kind: 'damage', amount: 26 },
      { kind: 'stat', target: 'self', stat: 'def', stages: -1 },
      { kind: 'stat', target: 'self', stat: 'spDef', stages: -1 },
    ],
  },
  {
    id: 'bulkUp',
    name: 'BULK UP',
    type: 'fighting',
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
