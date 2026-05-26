import type { OrbTier } from '@/types';

/** Orb tier multipliers. Master is special-cased to a guaranteed catch. */
export const ORB_MULTIPLIER: Record<OrbTier, number> = {
  orb: 1,
  great: 1.5,
  ultra: 2,
  master: Infinity,
};

export const SHINY_CATCH_BONUS = 5;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export interface CaptureParams {
  hp: number;
  maxHp: number;
  orbTier: OrbTier;
  /** Normalized species catch rate in [0,1] (PokéAPI's 0–255 divided by 255). */
  catchRate?: number;
  shiny?: boolean;
}

/** Capture chance in [0,1]. Rises as HP drops; 0 at full HP for non-master orbs. */
export function calcCaptureChance({
  hp,
  maxHp,
  orbTier,
  catchRate = 0.4,
  shiny = false,
}: CaptureParams): number {
  if (orbTier === 'master') return 1;
  const missing = maxHp > 0 ? 1 - hp / maxHp : 1;
  const shinyBonus = shiny ? SHINY_CATCH_BONUS : 1;
  return clamp01(missing * ORB_MULTIPLIER[orbTier] * catchRate * shinyBonus);
}

/** Resolve a capture attempt with an injected RNG (a function returning [0,1)). */
export function rollCapture(chance: number, rng: () => number): boolean {
  return rng() < chance;
}
