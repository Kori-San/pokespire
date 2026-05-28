import type { CardDef } from '@/types';

export const FIRE_CARDS: CardDef[] = [
  {
    id: 'ember',
    name: 'EMBER',
    type: 'fire',
    cost: 1,
    kind: 'ATK',
    category: 'special',
    effects: [
      { kind: 'damage', amount: 8 },
      { kind: 'applyStatus', target: 'foe', status: 'burn', stacks: 1 },
    ],
  },
  {
    id: 'sunnyDay',
    name: 'SUNNY DAY',
    type: 'fire',
    cost: 1,
    kind: 'SKL',
    category: 'status',
    effects: [{ kind: 'weather', weather: 'sun', turns: 4 }],
  },
];
