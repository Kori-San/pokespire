import { describe, expect, it } from 'vitest';
import { rngFrom } from './rng';

describe('rngFrom', () => {
  it('produces values in [0, 1)', () => {
    const rng = rngFrom(12345);
    for (let i = 0; i < 100; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('is deterministic for the same seed', () => {
    const a = rngFrom(42);
    const b = rngFrom(42);
    const seqA = [a.next(), a.next(), a.next()];
    const seqB = [b.next(), b.next(), b.next()];
    expect(seqA).toEqual(seqB);
  });

  it('different seeds diverge', () => {
    const a = rngFrom(1);
    const b = rngFrom(2);
    expect(a.next()).not.toBe(b.next());
  });

  it('resumes the exact sequence from a persisted state', () => {
    const a = rngFrom(999);
    a.next();
    a.next();
    const saved = a.state;
    const continuedA = [a.next(), a.next()];

    const resumed = rngFrom(saved);
    const continuedB = [resumed.next(), resumed.next()];
    expect(continuedB).toEqual(continuedA);
  });
});
