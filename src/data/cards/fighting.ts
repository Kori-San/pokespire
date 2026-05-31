import type { CardDef } from '@/types';

export const FIGHTING_CARDS: CardDef[] = [
  {
    id: 'doubleKick',
    name: 'DOUBLE KICK',
    type: 'fighting',
    cost: 2,
    kind: 'ATK',
    category: 'physical',
    rarity: 'common',
    // Canon Double Kick = 2 hits. Each hit rolls crit independently — high crit chains
    // can spike the total. Per-hit base is halved so the average damage stays close to
    // the previous single-hit balance.
    effects: [{ kind: 'damage', amount: 7, hits: 2 }],
  },
  {
    id: 'machPunch',
    name: 'MACH PUNCH',
    type: 'fighting',
    cost: 0,
    kind: 'ATK',
    category: 'physical',
    rarity: 'common',
    priority: 1,
    effects: [{ kind: 'damage', amount: 5 }],
  },
  {
    id: 'closeCombat',
    name: 'CLOSE COMBAT',
    type: 'fighting',
    cost: 3,
    kind: 'ATK',
    category: 'physical',
    rarity: 'rare',
    effects: [
      { kind: 'damage', amount: 26 },
      { kind: 'stat', target: 'self', stat: 'def', stages: -1 },
      { kind: 'stat', target: 'self', stat: 'spDef', stages: -1 },
    ],
  },
  {
    id: 'drainPunch',
    name: 'DRAIN PUNCH',
    type: 'fighting',
    cost: 2,
    kind: 'ATK',
    category: 'physical',
    rarity: 'rare',
    effects: [{ kind: 'lifesteal', amount: 16, percent: 50 }],
  },
  {
    id: 'bulkUp',
    name: 'BULK UP',
    type: 'fighting',
    cost: 1,
    kind: 'SKL',
    category: 'status',
    rarity: 'rare',
    effects: [
      { kind: 'stat', target: 'self', stat: 'atk', stages: 1 },
      { kind: 'stat', target: 'self', stat: 'def', stages: 1 },
    ],
  },
];
