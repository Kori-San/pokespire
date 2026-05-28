import { describe, expect, it } from 'vitest';
import type { Combatant } from '@/types';
import { EMPTY_STAGES } from '@/types';
import { rollIntent } from './intent';

const enemy: Combatant = {
  speciesId: 19,
  name: 'Rattata',
  types: ['normal'],
  level: 10,
  baseStats: { hp: 30, atk: 56, def: 35, spAtk: 25, spDef: 35, spd: 72 },
  catchRate: 255,
  shiny: false,
  maxHp: 30,
  hp: 30,
  block: 0,
  statuses: [],
  stages: { ...EMPTY_STAGES },
};

describe('rollIntent', () => {
  it('attacks on a low roll, scaling with level', () => {
    const intent = rollIntent(enemy, () => 0.1);
    expect(intent.kind).toBe('attack');
    const amount = intent.kind === 'attack' ? intent.amount : 0;
    expect(amount).toBeGreaterThan(0);
  });

  it('defends on a mid roll', () => {
    expect(rollIntent(enemy, () => 0.8).kind).toBe('defend');
  });

  it('applies a status on a high roll', () => {
    const intent = rollIntent(enemy, () => 0.95);
    expect(intent.kind).toBe('status');
  });

  it('is deterministic for the same roll', () => {
    expect(rollIntent(enemy, () => 0.1)).toEqual(rollIntent(enemy, () => 0.1));
  });
});
