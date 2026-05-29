import type { BaseStats, PokeType, StatusInstance } from './pokemon';

export type WeatherKind = 'sun' | 'rain' | 'sand' | 'hail';

/**
 * Battle terrains — Gen-VI canon. Like weather, each kind boosts moves of its matching
 * type and applies a passive effect (Electric Terrain blocks sleep, Grassy heals grounded
 * mons, Misty blocks status, Psychic blocks priority). Surface only for now: full engine
 * implementation lands when the effect kind goes beyond `weather`-style state.
 */
export type TerrainKind = 'electric' | 'grassy' | 'misty' | 'psychic';

/**
 * Anything a stat-stage card can target. The five real species stats from `BaseStats`
 * plus `'crit'` — Pokespire's only non-species stage, used by crit-rate cards (Focus
 * Energy-flavored). `hp` is included via `keyof BaseStats` for shape-symmetry but no
 * card ships an hp-stage effect.
 *
 * Accuracy / evasion are intentionally absent — Pokespire is deterministic-hit (cards
 * always land), so those stages would be dead code.
 */
export type Stat = keyof BaseStats | 'crit';

/** Combat-scope stage counters, one per `Stat`. Reset on switch-out and at combat end. */
export type StatStages = Record<Stat, number>;

export const EMPTY_STAGES: StatStages = {
  hp: 0,
  atk: 0,
  def: 0,
  spAtk: 0,
  spDef: 0,
  spd: 0,
  crit: 0,
};

/** Canonical multiplier for an atk/def/spAtk/spDef/spd stage. `0 → ×1.0`, `+2 → ×2.0`, `-1 → ×0.67`, etc. */
export function stageMultiplier(stage: number): number {
  const s = Math.max(-6, Math.min(6, stage));
  return s >= 0 ? (2 + s) / 2 : 2 / (2 - s);
}

/**
 * Probability of a critical hit at the given crit-stage. Simpler than canon's table:
 * `0 → 1/16` (6.25%), `+1 → 1/8`, `+2 → 1/4`, `+3 → 1/2`, `+4 or higher → guaranteed`.
 * On a crit, damage is multiplied by `CRIT_MULTIPLIER` (1.5×, Gen VI+ style).
 */
export function critChance(stage: number): number {
  const s = Math.max(0, Math.min(4, stage));
  if (s >= 4) return 1;
  return [1 / 16, 1 / 8, 1 / 4, 1 / 2][s] ?? 1 / 16;
}

export const CRIT_MULTIPLIER = 1.5;

/**
 * A Combatant's speed with stat-stages AND status folded in — used for turn-order
 * comparison. Paralyze halves the result (canon).
 */
export function effectiveSpeed(mon: Combatant): number {
  let speed = mon.baseStats.spd * stageMultiplier(mon.stages.spd);
  if (mon.statuses.some((s) => s.id === 'paralyze')) speed *= 0.5;
  return speed;
}

/** True when the mon's action is locked this turn by sleep or freeze. */
export function isIncapacitated(mon: Combatant): boolean {
  return mon.statuses.some((s) => s.id === 'sleep' || s.id === 'freeze');
}

export interface Weather {
  kind: WeatherKind;
  turnsLeft: number;
}

export interface Combatant {
  speciesId: number;
  name: string;
  types: PokeType[];
  level: number;
  baseStats: BaseStats;
  /** Species capture rate, 0–255 (PokéAPI `capture_rate`). Used by the capture roll. */
  catchRate: number;
  shiny: boolean;
  maxHp: number;
  hp: number;
  block: number;
  statuses: StatusInstance[];
  /** Active-mon stat stages. Reset to all-zero on switch-out and at combat end (canon). */
  stages: StatStages;
}

export type Intent =
  | { kind: 'attack'; amount: number }
  | { kind: 'defend'; amount: number }
  | { kind: 'status'; status: StatusInstance };

export type CombatOutcome = 'ongoing' | 'win' | 'lose' | 'captured';

export interface CombatState {
  team: Combatant[];
  activeIndex: number;
  enemy: Combatant;
  enemyIntent: Intent;
  energy: number;
  maxEnergy: number;
  hand: string[];
  draw: string[];
  discard: string[];
  exhaust: string[];
  turn: number;
  weather: Weather | null;
  rngState: number;
  outcome: CombatOutcome;
  /**
   * True when the enemy was faster than the active mon this turn and already executed its
   * intent at turn start (before the player could play any cards). The end-of-turn flow
   * then skips the enemy phase so the enemy still acts exactly once per turn.
   */
  enemyActed: boolean;
  /**
   * When true, the NEXT SWITCH this turn skips its 1-energy cost. Set by `freeSwitch`
   * effect cards (U-Turn, Volt Switch, …); consumed by the reducer's switch path. Resets
   * at end of turn — the bonus never carries into the next turn.
   */
  freeSwitch: boolean;
  log: string[];
}

export type CombatAction =
  | { type: 'PLAY_CARD'; handIndex: number }
  | { type: 'SWITCH'; teamIndex: number }
  | { type: 'END_TURN' };
