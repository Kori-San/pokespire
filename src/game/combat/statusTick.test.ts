import { describe, expect, it } from 'vitest';
import type { Combatant, StatusInstance } from '@/types';
import { EMPTY_STAGES } from '@/types';
import { applyStatus } from '@/data/statuses';
import { tickStatuses } from './statusTick';

function mon(statuses: StatusInstance[], hp = 100): Combatant {
  return {
    speciesId: 0,
    name: 'test',
    speciesSlug: 'test',
    types: ['normal'],
    level: 5,
    baseStats: { hp: 100, atk: 50, def: 50, spAtk: 50, spDef: 50, spd: 50 },
    catchRate: 45,
    shiny: false,
    maxHp: 100,
    hp,
    block: 0,
    statuses,
    stages: { ...EMPTY_STAGES },
    recharge: 0,
  };
}

describe('tickStatuses', () => {
  it('burn deals damage per stack and then decays', () => {
    const { combatant, damage } = tickStatuses(mon([{ id: 'burn', stacks: 3 }]));
    expect(damage).toBe(6);
    expect(combatant.hp).toBe(94);
    expect(combatant.statuses).toEqual([{ id: 'burn', stacks: 2 }]);
  });

  it('weak decays without dealing damage', () => {
    const { combatant, damage } = tickStatuses(mon([{ id: 'weak', stacks: 1 }]));
    expect(damage).toBe(0);
    expect(combatant.statuses).toEqual([]);
  });

  it('never reduces HP below zero', () => {
    const { combatant } = tickStatuses(mon([{ id: 'burn', stacks: 9 }], 5));
    expect(combatant.hp).toBe(0);
  });
});

describe('applyStatus', () => {
  it('adds a new status', () => {
    expect(applyStatus([], 'burn', 2)).toEqual([{ id: 'burn', stacks: 2 }]);
  });

  it('merges stacks into an existing status', () => {
    expect(applyStatus([{ id: 'burn', stacks: 2 }], 'burn', 3)).toEqual([
      { id: 'burn', stacks: 5 },
    ]);
  });
});
