import { describe, expect, it } from 'vitest';
import { POKE_TYPES } from '@/types';
import { TYPE_CHART, typeEffectiveness } from './typeChart';

describe('typeEffectiveness', () => {
  it('returns 1 for a neutral matchup', () => {
    expect(typeEffectiveness('fire', ['normal'])).toBe(1);
  });

  it('returns 2 for super-effective', () => {
    expect(typeEffectiveness('fire', ['grass'])).toBe(2);
  });

  it('returns 0.5 for resisted', () => {
    expect(typeEffectiveness('fire', ['water'])).toBe(0.5);
  });

  it('returns 0 for an immunity', () => {
    expect(typeEffectiveness('normal', ['ghost'])).toBe(0);
    expect(typeEffectiveness('electric', ['ground'])).toBe(0);
  });

  it('multiplies across dual types (4x and 0.25x)', () => {
    expect(typeEffectiveness('water', ['ground', 'rock'])).toBe(4);
    expect(typeEffectiveness('grass', ['fire', 'flying'])).toBe(0.25);
  });

  it('zeroes out when either defending type is immune', () => {
    expect(typeEffectiveness('normal', ['rock', 'ghost'])).toBe(0);
  });
});

describe('TYPE_CHART integrity', () => {
  it('has an entry for every one of the 18 attacking types', () => {
    for (const t of POKE_TYPES) {
      expect(TYPE_CHART[t]).toBeDefined();
    }
  });

  it('only references valid defending types', () => {
    const valid = new Set<string>(POKE_TYPES);
    for (const atk of POKE_TYPES) {
      for (const def of Object.keys(TYPE_CHART[atk])) {
        expect(valid.has(def)).toBe(true);
      }
    }
  });
});
