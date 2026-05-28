import type { CardDef } from '@/types';

export const PSYCHIC_CARDS: CardDef[] = [
  {
    id: 'confusion',
    name: 'CONFUSION',
    type: 'psychic',
    cost: 1,
    kind: 'ATK',
    category: 'special',
    rarity: 'uncommon',
    effects: [{ kind: 'damage', amount: 9 }],
  },
];
