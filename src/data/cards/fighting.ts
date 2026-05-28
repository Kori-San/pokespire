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
];
