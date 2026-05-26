import type { BallTier } from '@/types';

/** Ball catch-rate bonus (Gen III/IV). Master Ball is special-cased to a guaranteed catch. */
export const BALL_BONUS: Record<BallTier, number> = {
  poke: 1,
  great: 1.5,
  ultra: 2,
  master: Infinity,
};

/** Shininess isn't a catch factor in the real games, but Pokespire makes shinies easier. */
export const SHINY_CATCH_BONUS = 5;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Per-shake success probability from the modified catch rate `a` (Gen III/IV):
 * b = 1048560 / (16711680 / a)^(1/4); the ball catches if all four shakes pass.
 */
function shakeProbability(a: number): number {
  if (a <= 0) return 0;
  const b = 1048560 / Math.pow(16711680 / a, 0.25);
  return clamp01(b / 65536);
}

export interface CaptureParams {
  hp: number;
  maxHp: number;
  ballTier: BallTier;
  /** Species catch rate, 0–255 (PokéAPI `capture_rate`). */
  catchRate?: number;
  shiny?: boolean;
  /** Status bonus (sleep/freeze ×2.5, paralysis/burn/poison ×1.5); default 1. */
  statusBonus?: number;
}

/**
 * Real-formula capture chance in [0,1]. The HP term keeps a small chance even at full HP,
 * rising as HP drops; higher ball tiers, the shiny bonus, and status all raise it.
 */
export function calcCaptureChance({
  hp,
  maxHp,
  ballTier,
  catchRate = 45,
  shiny = false,
  statusBonus = 1,
}: CaptureParams): number {
  if (ballTier === 'master') return 1;
  const safeMax = Math.max(1, maxHp);
  const shinyBonus = shiny ? SHINY_CATCH_BONUS : 1;
  const a =
    (((3 * safeMax - 2 * Math.max(0, hp)) * catchRate * BALL_BONUS[ballTier] * shinyBonus) /
      (3 * safeMax)) *
    statusBonus;
  if (a >= 255) return 1;
  const perShake = shakeProbability(a);
  return clamp01(perShake ** 4);
}

/** Resolve a capture attempt with an injected RNG (a function returning [0,1)). */
export function rollCapture(chance: number, rng: () => number): boolean {
  return rng() < chance;
}
