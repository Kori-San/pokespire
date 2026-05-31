import { describe, expect, it } from 'vitest';
import type { Combatant, CombatState, PokeType } from '@/types';
import { EMPTY_STAGES, activeEnemyOf } from '@/types';
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
    enemyIntent: { kind: 'attack', amount: 10, targetIndex: 0 },
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
    enemyActed: false,
    freeSwitch: false,
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
    expect(activeEnemyOf(out).hp).toBeLessThan(100);
    expect(out.hand).toEqual([]);
    expect(out.discard).toEqual(['tackle']);
  });

  it('refuses a card the player cannot afford', () => {
    const s = state({ hand: ['doubleKick'], energy: 1 });
    const out = combatReducer(s, { type: 'PLAY_CARD', handIndex: 0 });
    expect(out).toBe(s);
  });

  it('exhausts BALL cards on play (one-shot, not redrawable this combat)', () => {
    const s = state({ hand: ['pokeBall'] });
    const out = combatReducer(s, { type: 'PLAY_CARD', handIndex: 0 });
    expect(out.exhaust).toEqual(['pokeBall']);
    expect(out.discard).toEqual([]);
  });

  it('exhausts ITEM cards on play', () => {
    const s = state({ hand: ['potion'], team: [mon({ hp: 50 })] });
    const out = combatReducer(s, { type: 'PLAY_CARD', handIndex: 0 });
    expect(out.exhaust).toEqual(['potion']);
    expect(out.discard).toEqual([]);
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

  it('a pending freeSwitch waives the 1-energy switch cost (consumed once)', () => {
    const s = state({
      team: [mon(), mon({ name: 'b' }), mon({ name: 'c' })],
      energy: 0,
      freeSwitch: true,
    });
    const out = combatReducer(s, { type: 'SWITCH', teamIndex: 1 });
    expect(out.activeIndex).toBe(1);
    expect(out.energy).toBe(0);
    // Bonus consumed — the next switch this turn pays the normal cost.
    expect(out.freeSwitch).toBe(false);
    const next = combatReducer(out, { type: 'SWITCH', teamIndex: 2 });
    expect(next.activeIndex).toBe(1);
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
      enemyIntent: { kind: 'attack', amount: 12, targetIndex: 0 },
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
      enemyIntent: { kind: 'attack', amount: 50, targetIndex: 0 },
    });
    const out = combatReducer(s, { type: 'END_TURN' });
    expect(out.outcome).toBe('lose');
  });
});

describe('combatReducer — sleep / freeze / paralyze', () => {
  it('a sleeping enemy skips its intent and the sleep stack decays at end of turn', () => {
    const s = state({
      enemies: [mon({ name: 'foe', statuses: [{ id: 'sleep', stacks: 2 }] })],
      enemyIntent: { kind: 'attack', amount: 50, targetIndex: 0 },
    });
    const out = combatReducer(s, { type: 'END_TURN' });
    expect(out.team[0]?.hp).toBe(100);
    expect(activeEnemyOf(out).statuses.find((x) => x.id === 'sleep')?.stacks).toBe(1);
  });

  it('a frozen enemy skips its intent (same lock as sleep)', () => {
    const s = state({
      enemies: [mon({ name: 'foe', statuses: [{ id: 'freeze', stacks: 1 }] })],
      enemyIntent: { kind: 'attack', amount: 50, targetIndex: 0 },
    });
    const out = combatReducer(s, { type: 'END_TURN' });
    expect(out.team[0]?.hp).toBe(100);
  });

  it('paralyze halves the enemy effective speed so the player is faster again', () => {
    const fastEnemy = mon({
      name: 'fast',
      baseStats: { hp: 100, atk: 75, def: 75, spAtk: 75, spDef: 75, spd: 100 },
      statuses: [{ id: 'paralyze', stacks: 3 }],
    });
    const slowerPlayer = mon({
      baseStats: { hp: 100, atk: 75, def: 75, spAtk: 75, spDef: 75, spd: 60 },
    });
    const s = createCombat({
      team: [slowerPlayer],
      enemy: fastEnemy,
      deck: STARTER_DECK,
      seed: 1,
    });
    // Enemy base 100 × paralyze 0.5 = 50, player 60 — player faster, enemy doesn't act first.
    expect(s.enemyActed).toBe(false);
  });
});

describe('combatReducer — speed turn-order', () => {
  it('lets the enemy act before the player when faster (createCombat)', () => {
    const slowPlayer = mon({
      baseStats: { hp: 100, atk: 75, def: 75, spAtk: 75, spDef: 75, spd: 20 },
    });
    const fastEnemy = mon({
      name: 'fast',
      baseStats: { hp: 100, atk: 75, def: 75, spAtk: 75, spDef: 75, spd: 200 },
    });
    // Pin the seed so the first rolled intent is an attack — see rollIntent thresholds.
    const s = createCombat({
      team: [slowPlayer],
      enemy: fastEnemy,
      deck: STARTER_DECK,
      seed: 1,
    });
    expect(s.enemyActed).toBe(true);
    // Faster enemy has already done SOMETHING — either chipped the player, raised its block, or
    // applied a status — depending on the seeded intent roll.
    const acted =
      (s.team[0]?.hp ?? 0) < 100 ||
      activeEnemyOf(s).block > 0 ||
      (s.team[0]?.statuses.length ?? 0) > 0;
    expect(acted).toBe(true);
  });

  it('skips the end-of-turn enemy phase when it already acted at turn start', () => {
    const slow = mon({ baseStats: { hp: 100, atk: 75, def: 75, spAtk: 75, spDef: 75, spd: 20 } });
    const fast = mon({
      name: 'fast',
      baseStats: { hp: 100, atk: 75, def: 75, spAtk: 75, spDef: 75, spd: 200 },
    });
    const s = state({
      team: [slow],
      enemies: [fast],
      enemyActed: true,
      enemyIntent: { kind: 'attack', amount: 50, targetIndex: 0 },
    });
    const out = combatReducer(s, { type: 'END_TURN' });
    // Without the skip, a 50-damage hit would land here; with it, the player only takes the
    // hit from the NEW intent rolled for the next turn (since enemy is still faster).
    // We assert the player's hp didn't drop by the full 50 + 50 (~ both intents).
    expect(out.team[0]?.hp).toBeGreaterThan(0);
  });

  it('keeps the canonical turn order when the player is faster', () => {
    const fastPlayer = mon({
      baseStats: { hp: 100, atk: 75, def: 75, spAtk: 75, spDef: 75, spd: 200 },
    });
    const slowEnemy = mon({
      name: 'slow',
      baseStats: { hp: 100, atk: 75, def: 75, spAtk: 75, spDef: 75, spd: 20 },
    });
    const s = createCombat({
      team: [fastPlayer],
      enemy: slowEnemy,
      deck: STARTER_DECK,
      seed: 1,
    });
    expect(s.enemyActed).toBe(false);
    expect(s.team[0]?.hp).toBe(100);
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
