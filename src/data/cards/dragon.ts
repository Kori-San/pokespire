import type { CardDef } from '@/types';

export const DRAGON_CARDS: CardDef[] = [
  {
    id: 'dragonPulse',
    name: 'DRAGON PULSE',
    type: 'dragon',
    cost: 2,
    kind: 'ATK',
    category: 'special',
    rarity: 'uncommon',
    effects: [{ kind: 'damage', amount: 17 }],
  },
  {
    id: 'dragonClaw',
    name: 'DRAGON CLAW',
    type: 'dragon',
    cost: 2,
    kind: 'ATK',
    category: 'physical',
    rarity: 'uncommon',
    effects: [{ kind: 'damage', amount: 16 }],
  },
  {
    id: 'dragonDance',
    name: 'DRAGON DANCE',
    type: 'dragon',
    cost: 1,
    kind: 'SKL',
    category: 'status',
    rarity: 'rare',
    effects: [
      { kind: 'stat', target: 'self', stat: 'atk', stages: 1 },
      { kind: 'stat', target: 'self', stat: 'spd', stages: 1 },
    ],
  },
];
