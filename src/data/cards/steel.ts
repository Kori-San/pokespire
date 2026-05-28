import type { CardDef } from '@/types';

export const STEEL_CARDS: CardDef[] = [
  {
    id: 'flashCannon',
    name: 'FLASH CANNON',
    type: 'steel',
    cost: 2,
    kind: 'ATK',
    category: 'special',
    rarity: 'uncommon',
    effects: [
      { kind: 'damage', amount: 16 },
      { kind: 'stat', target: 'foe', stat: 'spDef', stages: -1 },
    ],
  },
  {
    id: 'ironHead',
    name: 'IRON HEAD',
    type: 'steel',
    cost: 2,
    kind: 'ATK',
    category: 'physical',
    rarity: 'uncommon',
    effects: [{ kind: 'damage', amount: 16 }],
  },
  {
    id: 'ironDefense',
    name: 'IRON DEFENSE',
    type: 'steel',
    cost: 1,
    kind: 'SKL',
    category: 'status',
    rarity: 'rare',
    effects: [{ kind: 'stat', target: 'self', stat: 'def', stages: 2 }],
  },
];
