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
];
