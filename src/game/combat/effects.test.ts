import { describe, expect, it } from 'vitest';
import type { CardDef, Combatant, CombatState, Effect, PokeType } from '@/types';
import { EMPTY_STAGES, activeEnemyOf } from '@/types';
import { applyEffect } from './effects';

function mon(overrides: Partial<Combatant> = {}): Combatant {
  return {
    speciesId: 1,
    name: 'mon',
    speciesSlug: 'mon',
    types: ['normal'],
    level: 10,
    baseStats: { hp: 100, atk: 75, def: 75, spAtk: 75, spDef: 75, spd: 75 },
    catchRate: 45,
    shiny: false,
    maxHp: 100,
    hp: 100,
    block: 0,
    statuses: [],
    stages: { ...EMPTY_STAGES },
    recharge: 0,
    ...overrides,
  };
}

function state(overrides: Partial<CombatState> = {}): CombatState {
  return {
    team: [mon()],
    activeIndex: 0,
    enemies: [mon({ name: 'foe', speciesId: 2 })],
    enemyActiveIndex: 0,
    enemyIntent: { kind: 'attack', amount: 5, targetIndex: 0 },
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
    enemyActed: false,
    freeSwitch: false,
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
    const s = state({ enemies: [mon({ name: 'foe', block: 5 })] });
    const out = applyEffect(s, { kind: 'damage', amount: 10 }, card('fire'), rng(0));
    expect(activeEnemyOf(out).block).toBe(0);
    expect(activeEnemyOf(out).hp).toBeLessThan(100);
    expect(out.outcome).toBe('ongoing');
  });

  it('damage that drops enemy to 0 sets outcome win', () => {
    const s = state({ enemies: [mon({ name: 'foe', hp: 1 })] });
    const out = applyEffect(s, { kind: 'damage', amount: 50 }, card('fire'), rng(0));
    expect(activeEnemyOf(out).hp).toBe(0);
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
    expect(activeEnemyOf(foe).statuses).toEqual([{ id: 'burn', stacks: 2 }]);

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

  it('stat raises self or foe stages, clamped to [-6, +6]', () => {
    const up = applyEffect(
      state(),
      { kind: 'stat', target: 'self', stat: 'atk', stages: 2 },
      card('normal'),
      rng(0),
    );
    expect(up.team[0]?.stages.atk).toBe(2);

    const stacked = applyEffect(
      up,
      { kind: 'stat', target: 'self', stat: 'atk', stages: 6 },
      card('normal'),
      rng(0),
    );
    expect(stacked.team[0]?.stages.atk).toBe(6);

    const down = applyEffect(
      state(),
      { kind: 'stat', target: 'foe', stat: 'def', stages: -1 },
      card('normal'),
      rng(0),
    );
    expect(activeEnemyOf(down).stages.def).toBe(-1);
  });

  it('damage rolls a crit at the active mon stages.crit chance', () => {
    // rng(0.99) sits above the default 1/16 crit chance — base case lands without a crit.
    const base = applyEffect(state(), { kind: 'damage', amount: 10 }, card('fire'), rng(0.99));
    const baseDealt = 100 - base.enemies[0]!.hp;

    // Boost crit to +4 → guaranteed crit at any roll.
    const buffed = state({
      team: [
        mon({
          stages: { hp: 0, atk: 0, def: 0, spAtk: 0, spDef: 0, spd: 0, crit: 4 },
        }),
      ],
    });
    const critted = applyEffect(buffed, { kind: 'damage', amount: 10 }, card('fire'), rng(0.99));
    const critDealt = 100 - critted.enemies[0]!.hp;
    expect(critDealt).toBeGreaterThan(baseDealt);
  });

  it('move-inherent critBoost adds to the active mon stages.crit just for this hit', () => {
    // Base case: rng above 1/16 → no crit, no critBoost.
    const base = applyEffect(state(), { kind: 'damage', amount: 10 }, card('fire'), rng(0.2));
    const baseDealt = 100 - base.enemies[0]!.hp;
    // Same roll, but critBoost +4 → always crits.
    const boosted = applyEffect(
      state(),
      { kind: 'damage', amount: 10, critBoost: 4 },
      card('fire'),
      rng(0.2),
    );
    const boostedDealt = 100 - boosted.enemies[0]!.hp;
    expect(boostedDealt).toBeGreaterThan(baseDealt);
    // Persistent crit stage on the active mon is unchanged — the boost was per-hit only.
    expect(boosted.team[0]?.stages.crit).toBe(0);
  });

  it('recoilPercent damages the attacker for percent of damage dealt', () => {
    const s = state({ team: [mon({ hp: 100 })] });
    const out = applyEffect(
      s,
      { kind: 'damage', amount: 20, recoilPercent: 33 },
      card('fire'),
      rng(0.99),
    );
    const dealt = 100 - out.enemies[0]!.hp;
    const recoil = 100 - (out.team[0]?.hp ?? 0);
    expect(recoil).toBe(Math.round(dealt * 0.33));
  });

  it('lifesteal deals damage and heals user for percent of the dealt amount', () => {
    const s = state({ team: [mon({ hp: 50 })] });
    const out = applyEffect(
      s,
      { kind: 'lifesteal', amount: 20, percent: 50 },
      card('normal'),
      rng(0.99),
    );
    const dealt = 100 - out.enemies[0]!.hp;
    const healed = (out.team[0]?.hp ?? 0) - 50;
    // 50% of dealt damage, rounded.
    expect(healed).toBe(Math.round(dealt * 0.5));
    expect(out.team[0]?.hp).toBeLessThanOrEqual(100);
  });

  it('capture succeeds or fails based on the roll', () => {
    const s = state({ enemies: [mon({ name: 'foe', hp: 5 })] });
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
