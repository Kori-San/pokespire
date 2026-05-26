import { describe, expect, it } from 'vitest';
import { calcCaptureChance, rollCapture } from './capture';

describe('calcCaptureChance', () => {
  it('is 0 at full HP for a normal orb', () => {
    expect(calcCaptureChance({ hp: 100, maxHp: 100, orbTier: 'orb' })).toBe(0);
  });

  it('rises as HP drops', () => {
    const chance = calcCaptureChance({ hp: 10, maxHp: 100, orbTier: 'orb', catchRate: 0.4 });
    expect(chance).toBeCloseTo(0.36, 5);
  });

  it('higher orb tiers raise the chance', () => {
    const orb = calcCaptureChance({ hp: 10, maxHp: 100, orbTier: 'orb', catchRate: 0.4 });
    const great = calcCaptureChance({ hp: 10, maxHp: 100, orbTier: 'great', catchRate: 0.4 });
    expect(great).toBeGreaterThan(orb);
  });

  it('shiny bonus clamps at 1', () => {
    const chance = calcCaptureChance({
      hp: 30,
      maxHp: 100,
      orbTier: 'orb',
      catchRate: 0.4,
      shiny: true,
    });
    expect(chance).toBe(1);
  });

  it('master orb always succeeds, even at full HP', () => {
    expect(calcCaptureChance({ hp: 100, maxHp: 100, orbTier: 'master' })).toBe(1);
  });
});

describe('rollCapture', () => {
  it('succeeds when the roll is below the chance', () => {
    expect(rollCapture(0.5, () => 0.1)).toBe(true);
    expect(rollCapture(0.5, () => 0.9)).toBe(false);
  });
});
