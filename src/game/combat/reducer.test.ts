import { describe, expect, it } from 'vitest';
import type { Combatant, CombatState, PokeType } from '@/types';
import { EMPTY_STAGES } from '@/types';
import { STARTER_DECK } from '@/data/cards';
import { combatReducer, createCombat, HAND_SIZE, START_ENERGY } from './reducer';

function mon(overrides: Partial<Combatant> = {}): Combatant {
  return {
    speciesId: 1,
    name: 'mon',
    types: ['normal'] as PokeType[],
    level: 10,
    baseStats: { hp: 100, atk: 75, def: 75, spAtk: 75, spDef: 75, spd: 75 },
    catchRate: 45,
    shiny: false,
    maxHp: 100,
    hp: 100,
    block: 0,
    statuses: [],
    stages: { ...EMPTY_STAGES },
    ...overrides,
  };
}

function state(overrides: Partial<CombatState> = {}): CombatState {
  return {
    team: [mon()],
    activeIndex: 0,
    enemy: mon({ name: 'foe', speciesId: 2 }),
    enemyIntent: { kind: 'attack', amount: 10 },
    energy: START_ENERGY,
    maxEnergy: START_ENERGY,
    hand: [],
    draw: [],
    discard: [],
    exhaust: [],
    turn: 1,
    weather: null,
    rngState: 123,
    outcome: 'ongoing',
    log: [],
    ...overrides,
  };
}

describe('createCombat', () => {
  it('deals an opening hand and sets up the turn', () => {
    const s = createCombat({ team: [mon()], enemy: mon(), deck: STARTER_DECK, seed: 7 });
    expect(s.hand).toHaveLength(HAND_SIZE);
    expect(s.energy).toBe(START_ENERGY);
    expect(s.outcome).toBe('ongoing');
    expect(s.enemyIntent).toBeDefined();
    expect(s.turn).toBe(1);
  });

  it('is deterministic for the same seed', () => {
    const a = createCombat({ team: [mon()], enemy: mon(), deck: STARTER_DECK, seed: 7 });
    const b = createCombat({ team: [mon()], enemy: mon(), deck: STARTER_DECK, seed: 7 });
    expect(a).toEqual(b);
  });
});

describe('combatReducer — PLAY_CARD', () => {
  it('plays a damage card, paying energy and hurting the enemy', () => {
    const s = state({ hand: ['tackle'] });
    const out = combatReducer(s, { type: 'PLAY_CARD', handIndex: 0 });
    expect(out.energy).toBe(START_ENERGY - 1);
    expect(out.enemy.hp).toBeLessThan(100);
    expect(out.hand).toEqual([]);
    expect(out.discard).toEqual(['tackle']);
  });

  it('refuses a card the player cannot afford', () => {
    const s = state({ hand: ['doubleKick'], energy: 1 });
    const out = combatReducer(s, { type: 'PLAY_CARD', handIndex: 0 });
    expect(out).toBe(s);
  });
});

describe('combatReducer — SWITCH', () => {
  it('switches active, pays energy, and resets the outgoing block', () => {
    const s = state({ team: [mon({ block: 6 }), mon({ name: 'b' })] });
    const out = combatReducer(s, { type: 'SWITCH', teamIndex: 1 });
    expect(out.activeIndex).toBe(1);
    expect(out.energy).toBe(START_ENERGY - 1);
    expect(out.team[0]?.block).toBe(0);
  });

  it('will not switch to a fainted teammate', () => {
    const s = state({ team: [mon(), mon({ name: 'b', hp: 0 })] });
    const out = combatReducer(s, { type: 'SWITCH', teamIndex: 1 });
    expect(out).toBe(s);
  });

  it('resets the outgoing mon stat-stages to zero on switch-out', () => {
    const s = state({
      team: [mon({ stages: { ...EMPTY_STAGES, atk: 4, crit: 2 } }), mon({ name: 'b' })],
    });
    const out = combatReducer(s, { type: 'SWITCH', teamIndex: 1 });
    expect(out.team[0]?.stages).toEqual(EMPTY_STAGES);
  });
});

describe('combatReducer — END_TURN', () => {
  it('lets the enemy act, then redraws and resets energy', () => {
    const s = state({
      hand: ['tackle'],
      draw: Array<string>(10).fill('tackle'),
      energy: 0,
      enemyIntent: { kind: 'attack', amount: 12 },
    });
    const out = combatReducer(s, { type: 'END_TURN' });
    expect(out.team[0]?.hp).toBeLessThan(100);
    expect(out.hand).toHaveLength(HAND_SIZE);
    expect(out.energy).toBe(START_ENERGY);
    expect(out.turn).toBe(2);
  });

  it('ends in a loss when the last mon faints', () => {
    const s = state({
      team: [mon({ hp: 5 })],
      enemyIntent: { kind: 'attack', amount: 50 },
    });
    const out = combatReducer(s, { type: 'END_TURN' });
    expect(out.outcome).toBe('lose');
  });
});

describe('combatReducer — guards & determinism', () => {
  it('is a no-op once combat is over', () => {
    const s = state({ outcome: 'win', hand: ['tackle'] });
    expect(combatReducer(s, { type: 'PLAY_CARD', handIndex: 0 })).toBe(s);
  });

  it('produces identical results for identical inputs', () => {
    const a = state({ draw: Array<string>(10).fill('tackle') });
    const b = state({ draw: Array<string>(10).fill('tackle') });
    expect(combatReducer(a, { type: 'END_TURN' })).toEqual(combatReducer(b, { type: 'END_TURN' }));
  });
});
