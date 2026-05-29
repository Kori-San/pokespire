import type { CardDef } from '@/types';

export const DARK_CARDS: CardDef[] = [
  {
    id: 'darkPulse',
    name: 'DARK PULSE',
    type: 'dark',
    cost: 2,
    kind: 'ATK',
    category: 'special',
    rarity: 'uncommon',
    effects: [{ kind: 'damage', amount: 16 }],
  },
  {
    id: 'crunch',
    name: 'CRUNCH',
    type: 'dark',
    cost: 2,
    kind: 'ATK',
    category: 'physical',
    rarity: 'uncommon',
    effects: [
      { kind: 'damage', amount: 16 },
      { kind: 'stat', target: 'foe', stat: 'def', stages: -1 },
    ],
  },
  {
    id: 'nightSlash',
    name: 'NIGHT SLASH',
    type: 'dark',
    cost: 1,
    kind: 'ATK',
    category: 'physical',
    rarity: 'rare',
    effects: [{ kind: 'damage', amount: 12, critBoost: 1 }],
  },
  {
    id: 'nastyPlot',
    name: 'NASTY PLOT',
    type: 'dark',
    cost: 1,
    kind: 'SKL',
    category: 'status',
    rarity: 'rare',
    effects: [{ kind: 'stat', target: 'self', stat: 'spAtk', stages: 2 }],
  },
];
