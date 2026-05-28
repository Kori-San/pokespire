import { describe, expect, it } from 'vitest';
import type { BaseStats, Combatant, PokeType, StatusInstance, Weather } from '@/types';
import { calcDamage } from './damage';

const stats = (atk: number, def: number): BaseStats => ({
  hp: 45,
  atk,
  def,
  spAtk: atk,
  spDef: def,
  spd: 50,
});

function mon(
  types: PokeType[],
  level: number,
  baseStats: BaseStats,
  statuses: StatusInstance[] = [],
): Combatant {
  return {
    speciesId: 0,
    name: 'test',
    types,
    level,
    baseStats,
    catchRate: 45,
    shiny: false,
    maxHp: 100,
    hp: 100,
    block: 0,
    statuses,
  };
}

describe('calcDamage', () => {
  it('lands ~printed value for a STAB hit at L5 (baseline)', () => {
    const r = calcDamage({
      amount: 10,
      cardType: 'fire',
      category: 'special',
      attacker: mon(['fire'], 5, stats(52, 43)),
      defender: mon(['normal'], 5, stats(56, 35)),
    });
    expect(r.stab).toBe(1.25);
    expect(r.final).toBe(10);
  });

  it('scales up with level', () => {
    const r = calcDamage({
      amount: 10,
      cardType: 'fire',
      category: 'special',
      attacker: mon(['fire'], 10, stats(52, 43)),
      defender: mon(['normal'], 10, stats(56, 35)),
    });
    expect(r.final).toBe(13);
  });

  it('stacks STAB and super-effective', () => {
    const r = calcDamage({
      amount: 10,
      cardType: 'fire',
      category: 'special',
      attacker: mon(['fire'], 5, stats(52, 43)),
      defender: mon(['grass', 'poison'], 5, stats(49, 49)),
    });
    expect(r.rawEff).toBe(2);
    expect(r.final).toBe(20);
  });

  it('a high-attack legendary out-hits a starter without STAB', () => {
    const r = calcDamage({
      amount: 10,
      cardType: 'fire',
      category: 'special',
      attacker: mon(['psychic'], 5, stats(110, 90)),
      defender: mon(['normal'], 5, stats(56, 35)),
    });
    expect(r.stab).toBe(1);
    expect(r.final).toBe(17);
  });

  it('floors immunities so a card still chips, and flags immune', () => {
    const r = calcDamage({
      amount: 10,
      cardType: 'normal',
      category: 'physical',
      attacker: mon(['normal'], 5, stats(56, 35)),
      defender: mon(['ghost', 'poison'], 5, stats(60, 60)),
    });
    expect(r.rawEff).toBe(0);
    expect(r.immune).toBe(true);
    expect(r.eff).toBe(0.25);
    expect(r.final).toBeGreaterThanOrEqual(1);
  });

  it('applies WEAK to the attacker', () => {
    const base = calcDamage({
      amount: 20,
      cardType: 'fire',
      category: 'special',
      attacker: mon(['fire'], 10, stats(80, 80)),
      defender: mon(['normal'], 10, stats(60, 60)),
    });
    const weak = calcDamage({
      amount: 20,
      cardType: 'fire',
      category: 'special',
      attacker: mon(['fire'], 10, stats(80, 80), [{ id: 'weak', stacks: 1 }]),
      defender: mon(['normal'], 10, stats(60, 60)),
    });
    expect(weak.weakMod).toBe(0.75);
    expect(weak.final).toBeLessThan(base.final);
  });

  it('boosts fire and damps water under sun', () => {
    const sun: Weather = { kind: 'sun', turnsLeft: 4 };
    const fire = calcDamage({
      amount: 10,
      cardType: 'fire',
      category: 'special',
      attacker: mon(['fire'], 10, stats(60, 60)),
      defender: mon(['normal'], 10, stats(60, 60)),
      weather: sun,
    });
    const water = calcDamage({
      amount: 10,
      cardType: 'water',
      category: 'special',
      attacker: mon(['water'], 10, stats(60, 60)),
      defender: mon(['normal'], 10, stats(60, 60)),
      weather: sun,
    });
    expect(fire.weatherMod).toBe(1.5);
    expect(water.weatherMod).toBe(0.5);
  });

  it('returns 0 for a zero-amount card', () => {
    const r = calcDamage({
      amount: 0,
      cardType: 'fire',
      category: 'special',
      attacker: mon(['fire'], 5, stats(52, 43)),
      defender: mon(['normal'], 5, stats(56, 35)),
    });
    expect(r.final).toBe(0);
  });

  it('special cards read spAtk / spDef, physical read atk / def', () => {
    const attacker = mon(['fire'], 10, {
      hp: 45,
      atk: 50,
      def: 50,
      spAtk: 130,
      spDef: 50,
      spd: 50,
    });
    const defender = mon(['normal'], 10, {
      hp: 45,
      atk: 50,
      def: 130,
      spAtk: 50,
      spDef: 50,
      spd: 50,
    });
    const special = calcDamage({
      amount: 20,
      cardType: 'fire',
      category: 'special',
      attacker,
      defender,
    });
    const physical = calcDamage({
      amount: 20,
      cardType: 'fire',
      category: 'physical',
      attacker,
      defender,
    });
    // special sees attacker.spAtk (high) and defender.spDef (low) → bigger number
    expect(special.final).toBeGreaterThan(physical.final);
  });
});
