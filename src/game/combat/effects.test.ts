import { describe, expect, it } from 'vitest';
import type { CardDef, Combatant, CombatState, Effect, PokeType } from '@/types';
import { applyEffect } from './effects';

function mon(overrides: Partial<Combatant> = {}): Combatant {
  return {
    speciesId: 1,
    name: 'mon',
    types: ['normal'],
    level: 10,
    baseStats: { hp: 100, atk: 75, def: 75, spAtk: 75, spDef: 75, spd: 75 },
    catchRate: 45,
    shiny: false,
    maxHp: 100,
    hp: 100,
    block: 0,
    statuses: [],
    ...overrides,
  };
}

function state(overrides: Partial<CombatState> = {}): CombatState {
  return {
    team: [mon()],
    activeIndex: 0,
    enemy: mon({ name: 'foe', speciesId: 2 }),
    enemyIntent: { kind: 'attack', amount: 5 },
    energy: 3,
    maxEnergy: 3,
    hand: [],
    draw: [],
    discard: [],
    exhaust: [],
    turn: 1,
    weather: null,
    rngState: 1,
    outcome: 'ongoing',
    log: [],
    ...overrides,
  };
}

const card = (type: PokeType, ...effects: Effect[]): CardDef => ({
  id: 'c',
  name: 'C',
  type,
  cost: 1,
  kind: 'ATK',
  category: 'physical',
  rarity: 'common',
  effects,
});

const rng = (v: number) => () => v;

describe('applyEffect', () => {
  it('damage reduces enemy HP after block absorption', () => {
    const s = state({ enemy: mon({ name: 'foe', block: 5 }) });
    const out = applyEffect(s, { kind: 'damage', amount: 10 }, card('fire'), rng(0));
    expect(out.enemy.block).toBe(0);
    expect(out.enemy.hp).toBeLessThan(100);
    expect(out.outcome).toBe('ongoing');
  });

  it('damage that drops enemy to 0 sets outcome win', () => {
    const s = state({ enemy: mon({ name: 'foe', hp: 1 }) });
    const out = applyEffect(s, { kind: 'damage', amount: 50 }, card('fire'), rng(0));
    expect(out.enemy.hp).toBe(0);
    expect(out.outcome).toBe('win');
  });

  it('block adds to the active combatant', () => {
    const out = applyEffect(state(), { kind: 'block', amount: 8 }, card('normal'), rng(0));
    expect(out.team[0]?.block).toBe(8);
  });

  it('heal is capped at max HP', () => {
    const s = state({ team: [mon({ hp: 95 })] });
    const out = applyEffect(s, { kind: 'heal', amount: 20 }, card('normal'), rng(0));
    expect(out.team[0]?.hp).toBe(100);
  });

  it('draw moves cards from draw to hand', () => {
    const s = state({ draw: ['a', 'b', 'c'] });
    const out = applyEffect(s, { kind: 'draw', count: 2 }, card('normal'), rng(0));
    expect(out.hand).toEqual(['a', 'b']);
  });

  it('applyStatus hits the foe or self', () => {
    const foe = applyEffect(
      state(),
      { kind: 'applyStatus', target: 'foe', status: 'burn', stacks: 2 },
      card('fire'),
      rng(0),
    );
    expect(foe.enemy.statuses).toEqual([{ id: 'burn', stacks: 2 }]);

    const self = applyEffect(
      state(),
      { kind: 'applyStatus', target: 'self', status: 'weak', stacks: 1 },
      card('normal'),
      rng(0),
    );
    expect(self.team[0]?.statuses).toEqual([{ id: 'weak', stacks: 1 }]);
  });

  it('energy now increases the energy pool', () => {
    const out = applyEffect(
      state(),
      { kind: 'energy', amount: 2, when: 'now' },
      card('normal'),
      rng(0),
    );
    expect(out.energy).toBe(5);
  });

  it('weather sets the active weather', () => {
    const out = applyEffect(
      state(),
      { kind: 'weather', weather: 'rain', turns: 4 },
      card('water'),
      rng(0),
    );
    expect(out.weather).toEqual({ kind: 'rain', turnsLeft: 4 });
  });

  it('capture succeeds or fails based on the roll', () => {
    const s = state({ enemy: mon({ name: 'foe', hp: 5 }) });
    const caught = applyEffect(s, { kind: 'capture', ballTier: 'ultra' }, card('normal'), rng(0));
    expect(caught.outcome).toBe('captured');

    const missed = applyEffect(
      s,
      { kind: 'capture', ballTier: 'poke' },
      card('normal'),
      rng(0.999),
    );
    expect(missed.outcome).toBe('ongoing');
  });
});
