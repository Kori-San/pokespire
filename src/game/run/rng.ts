export interface SeededRng {
  /** Next float in [0, 1). */
  next: () => number;
  /** Current internal state — persist this to resume the exact sequence. */
  readonly state: number;
}

/**
 * mulberry32 PRNG that exposes its internal state, so a run can store `rngState`,
 * resume later, and reproduce the exact sequence. Deterministic by construction.
 */
export function rngFrom(seed: number): SeededRng {
  let a = seed >>> 0;
  return {
    next() {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    get state() {
      return a >>> 0;
    },
  };
}
