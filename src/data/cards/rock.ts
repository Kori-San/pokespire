import type { CardDef } from '@/types';

export const ROCK_CARDS: CardDef[] = [
  {
    id: 'powerGem',
    name: 'POWER GEM',
    type: 'rock',
    cost: 2,
    kind: 'ATK',
    category: 'special',
    rarity: 'uncommon',
    effects: [{ kind: 'damage', amount: 16 }],
  },
  {
    id: 'stoneEdge',
    name: 'STONE EDGE',
    type: 'rock',
    cost: 3,
    kind: 'ATK',
    category: 'physical',
    rarity: 'rare',
    effects: [
      { kind: 'damage', amount: 22 },
      { kind: 'stat', target: 'self', stat: 'crit', stages: 1 },
    ],
  },
  {
    id: 'sandstorm',
    name: 'SANDSTORM',
    type: 'rock',
    cost: 1,
    kind: 'SKL',
    category: 'status',
    rarity: 'epic',
    effects: [{ kind: 'weather', weather: 'sand', turns: 4 }],
  },
  {
    id: 'rockPolish',
    name: 'ROCK POLISH',
    type: 'rock',
    cost: 1,
    kind: 'SKL',
    category: 'status',
    rarity: 'rare',
    effects: [{ kind: 'stat', target: 'self', stat: 'spd', stages: 2 }],
  },
];
