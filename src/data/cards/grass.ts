import type { CardDef } from '@/types';

export const GRASS_CARDS: CardDef[] = [
  {
    id: 'vineWhip',
    name: 'VINE WHIP',
    type: 'grass',
    cost: 1,
    kind: 'ATK',
    category: 'physical',
    effects: [{ kind: 'damage', amount: 9 }],
  },
];
