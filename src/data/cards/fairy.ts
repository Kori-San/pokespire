import type { CardDef } from '@/types';

export const FAIRY_CARDS: CardDef[] = [
  {
    id: 'moonblast',
    name: 'MOONBLAST',
    type: 'fairy',
    cost: 2,
    kind: 'ATK',
    category: 'special',
    rarity: 'uncommon',
    effects: [
      { kind: 'damage', amount: 19 },
      { kind: 'stat', target: 'foe', stat: 'spAtk', stages: -1 },
    ],
  },
  {
    id: 'playRough',
    name: 'PLAY ROUGH',
    type: 'fairy',
    cost: 2,
    kind: 'ATK',
    category: 'physical',
    rarity: 'uncommon',
    effects: [
      { kind: 'damage', amount: 18 },
      { kind: 'stat', target: 'foe', stat: 'atk', stages: -1 },
    ],
  },
  {
    id: 'mistyTerrain',
    name: 'MISTY TERRAIN',
    type: 'fairy',
    cost: 1,
    kind: 'SKL',
    category: 'status',
    rarity: 'epic',
    effects: [{ kind: 'terrain', terrain: 'misty', turns: 4 }],
  },
  {
    id: 'drainingKiss',
    name: 'DRAINING KISS',
    type: 'fairy',
    cost: 1,
    kind: 'ATK',
    category: 'special',
    rarity: 'rare',
    effects: [{ kind: 'lifesteal', amount: 10, percent: 75 }],
  },
];
