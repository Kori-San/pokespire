import { describe, expect, it } from 'vitest';
import { calcCaptureChance, rollCapture } from './capture';

describe('calcCaptureChance', () => {
  it('keeps a small but non-zero chance at full HP (like the real games)', () => {
    const chance = calcCaptureChance({ hp: 100, maxHp: 100, ballTier: 'poke', catchRate: 45 });
    expect(chance).toBeGreaterThan(0);
    expect(chance).toBeLessThan(0.1);
  });

  it('rises as HP drops', () => {
    const full = calcCaptureChance({ hp: 100, maxHp: 100, ballTier: 'poke', catchRate: 45 });
    const low = calcCaptureChance({ hp: 1, maxHp: 100, ballTier: 'poke', catchRate: 45 });
    expect(low).toBeGreaterThan(full);
  });

  it('higher ball tiers raise the chance', () => {
    const poke = calcCaptureChance({ hp: 20, maxHp: 100, ballTier: 'poke', catchRate: 45 });
    const great = calcCaptureChance({ hp: 20, maxHp: 100, ballTier: 'great', catchRate: 45 });
    const ultra = calcCaptureChance({ hp: 20, maxHp: 100, ballTier: 'ultra', catchRate: 45 });
    expect(great).toBeGreaterThan(poke);
    expect(ultra).toBeGreaterThan(great);
  });

  it('the shiny bonus raises the chance', () => {
    const normal = calcCaptureChance({ hp: 50, maxHp: 100, ballTier: 'poke', catchRate: 45 });
    const shiny = calcCaptureChance({
      hp: 50,
      maxHp: 100,
      ballTier: 'poke',
      catchRate: 45,
      shiny: true,
    });
    expect(shiny).toBeGreaterThan(normal);
  });

  it('a high catch rate at low HP approaches a guaranteed catch', () => {
    const chance = calcCaptureChance({ hp: 1, maxHp: 100, ballTier: 'ultra', catchRate: 255 });
    expect(chance).toBe(1);
  });

  it('Master Ball always succeeds, even at full HP', () => {
    expect(calcCaptureChance({ hp: 100, maxHp: 100, ballTier: 'master' })).toBe(1);
  });
});

describe('rollCapture', () => {
  it('succeeds when the roll is below the chance', () => {
    expect(rollCapture(0.5, () => 0.1)).toBe(true);
    expect(rollCapture(0.5, () => 0.9)).toBe(false);
  });
});
