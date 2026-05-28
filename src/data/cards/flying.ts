import type { CardDef } from '@/types';

export const FLYING_CARDS: CardDef[] = [
  {
    id: 'gust',
    name: 'GUST',
    type: 'flying',
    cost: 1,
    kind: 'ATK',
    category: 'special',
    rarity: 'common',
    effects: [{ kind: 'damage', amount: 8 }],
  },
];
