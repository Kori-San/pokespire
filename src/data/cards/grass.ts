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
];
