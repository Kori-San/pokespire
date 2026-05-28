import { describe, expect, it } from 'vitest';
import type { Combatant, CombatState, PokeType } from '@/types';
import { selectComputedCardView, selectHandViews } from './selectors';

function mon(types: PokeType[], overrides: Partial<Combatant> = {}): Combatant {
  return {
    speciesId: 1,
    name: 'mon',
    types,
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
    team: [mon(['fire']), mon(['water'])],
    activeIndex: 0,
    enemy: mon(['grass'], { name: 'foe' }),
    enemyIntent: { kind: 'attack', amount: 5 },
    energy: 3,
    maxEnergy: 3,
    hand: ['ember'],
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

describe('selectComputedCardView', () => {
  it('flags STAB and super-effectiveness separately, and computes the value', () => {
    // Fire EMBER from a Fire mon vs a Grass foe → STAB (border cue) + super (number cue).
    const view = selectComputedCardView(state(), 0);
    expect(view?.damage?.effectiveness).toBe('super');
    expect(view?.damage?.stab).toBe(true);
    expect(view?.damage?.value).toBeGreaterThan(8);
    expect(view?.damage?.tooltip).toContain('= ');
  });

  it('recomputes when the active mon changes (switch)', () => {
    const asFire = selectComputedCardView(state({ activeIndex: 0 }), 0);
    const asWater = selectComputedCardView(state({ activeIndex: 1 }), 0);
    // Water mon loses STAB on a Fire card → lower value than the Fire mon.
    expect(asWater?.damage?.value).toBeLessThan(asFire?.damage?.value ?? 0);
  });

  it('flags immunity', () => {
    const s = state({
      team: [mon(['normal'])],
      enemy: mon(['ghost'], { name: 'foe' }),
      hand: ['tackle'],
    });
    const view = selectComputedCardView(s, 0);
    expect(view?.damage?.effectiveness).toBe('immune');
  });

  it('computes capture % for ball cards', () => {
    const s = state({ hand: ['pokeBall'], enemy: mon(['grass'], { name: 'foe', hp: 10 }) });
    const view = selectComputedCardView(s, 0);
    expect(view?.capturePercent).toBeGreaterThan(0);
    expect(view?.damage).toBeUndefined();
  });

  it('marks unaffordable cards', () => {
    const view = selectComputedCardView(state({ energy: 0 }), 0);
    expect(view?.affordable).toBe(false);
  });
});

describe('selectHandViews', () => {
  it('returns a view per hand card', () => {
    const views = selectHandViews(state({ hand: ['ember', 'tackle', 'pokeBall'] }));
    expect(views).toHaveLength(3);
  });
});
