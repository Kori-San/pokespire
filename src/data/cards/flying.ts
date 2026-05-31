import type { CardDef } from '@/types';

export const FLYING_CARDS: CardDef[] = [
  {
    id: 'gust',
    name: 'GUST',
    type: 'flying',
    cost: 1,
    kind: 'ATK',
    category: 'special',
    rarity: 'common',
    effects: [{ kind: 'damage', amount: 8 }],
  },
  {
    id: 'braveBird',
    name: 'BRAVE BIRD',
    type: 'flying',
    cost: 3,
    kind: 'ATK',
    category: 'physical',
    rarity: 'rare',
    effects: [{ kind: 'damage', amount: 26, recoilPercent: 33 }],
  },
  {
    id: 'aerialAce',
    name: 'AERIAL ACE',
    type: 'flying',
    cost: 1,
    kind: 'ATK',
    category: 'physical',
    rarity: 'uncommon',
    effects: [{ kind: 'damage', amount: 11 }],
  },
  {
    id: 'tailwind',
    name: 'TAILWIND',
    type: 'flying',
    cost: 1,
    kind: 'SKL',
    category: 'status',
    rarity: 'rare',
    // Canon: a tailwind buff covers your side of the field — every ally on the active
    // mon's column gets +1 SPD. We give a single stage (not +2) because the buff now
    // spreads across up to 3 mons instead of stacking on one.
    effects: [{ kind: 'stat', target: 'self', stat: 'spd', stages: 1, scope: 'column' }],
  },
];
