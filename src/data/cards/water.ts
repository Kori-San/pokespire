import type { CardDef } from '@/types';

export const WATER_CARDS: CardDef[] = [
  {
    id: 'waterGun',
    name: 'WATER GUN',
    type: 'water',
    cost: 1,
    kind: 'ATK',
    category: 'special',
    rarity: 'uncommon',
    effects: [{ kind: 'damage', amount: 9 }],
  },
  {
    id: 'withdraw',
    name: 'WITHDRAW',
    type: 'water',
    cost: 1,
    kind: 'SKL',
    category: 'status',
    rarity: 'common',
    effects: [{ kind: 'block', amount: 9 }],
  },
  {
    id: 'rainDance',
    name: 'RAIN DANCE',
    type: 'water',
    cost: 1,
    kind: 'SKL',
    category: 'status',
    rarity: 'epic',
    effects: [{ kind: 'weather', weather: 'rain', turns: 4 }],
  },
];
