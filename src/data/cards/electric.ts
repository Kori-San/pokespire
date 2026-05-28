import type { CardDef } from '@/types';

export const ELECTRIC_CARDS: CardDef[] = [
  {
    id: 'thunderShock',
    name: 'THUNDER SHOCK',
    type: 'electric',
    cost: 1,
    kind: 'ATK',
    category: 'special',
    effects: [{ kind: 'damage', amount: 8 }],
  },
];
