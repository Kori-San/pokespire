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

/**
 * Active dynamax state on a Combatant. Captured at activation time so the engine can
 * fully restore the mon when the 3-turn window expires:
 *   - `turnsLeft`    — countdown, ticked once per end-of-turn. Revert at 0.
 *   - `gmax`         — true when the species had a `forme: 'Gmax'` and we swapped to it.
 *   - `prevSlug`     — pre-dynamax `speciesSlug` (used to restore on revert).
 *   - `prevTypes`    — pre-dynamax `types`.
 *   - `prevBaseStats`— pre-dynamax `baseStats`.
 *   - `prevMaxHp`    — pre-dynamax `maxHp`. Current hp clamps to this on revert.
 */
export interface DynamaxState {
  turnsLeft: number;
  gmax: boolean;
  prevSlug: string;
  prevTypes: PokeType[];
  prevBaseStats: BaseStats;
  prevMaxHp: number;
}

export interface Combatant {
  speciesId: number;
  /**
   * PokéAPI-style species slug — the identity key used by `SPRITE_INDEX` (sprite
   * resolution) and `pokemonNames:` locale lookups. Hyphenated form: `'bulbasaur'`,
   * `'mr-mime'`, `'nidoran-f'`, `'charizard-mega-x'`, `'pokestar-smeargle'`.
   */
  speciesSlug: string;
  /**
   * English display name. Acts as a fallback when no localized `pokemonNames:` entry
   * exists for the active language. UI surfaces should prefer
   * `t('pokemonNames:' + speciesSlug, { defaultValue: name })`.
   */
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
  /**
   * Turns left where this Pokémon CANNOT play attack cards — canon Recharge state
   * triggered by Hyper Beam / Giga Impact / Blast Burn. Tied to the Pokémon, not the
   * slot: switching out doesn't reset it. Decrements at end of turn. `0` = free to
   * attack. Status-kind cards (SKL/PWR/BALL/ITEM) play normally during Recharge.
   */
  recharge: number;
  /**
   * Canon Gen-VIII Dynamax state. `null`/`undefined` = not dynamaxed (default). When
   * set, the mon is in its 3-turn dynamax window: `maxHp` is the doubled value, the
   * `DynamaxState` carries the pre-dynamax fields to restore on revert. Hand cards
   * map to their Max-Move equivalents while this is non-null. Optional for fixture
   * compatibility — every helper uses a truthy check.
   */
  dynamax?: DynamaxState | null;
  /**
   * Canon Gen-IX Terastallization. `null`/`undefined` = not terastallized. When set,
   * the mon's effective type for STAB is `tera.type`. No revert — persists until
   * combat ends. Canon Tera Boost: if a played card's type matches both `tera.type`
   * AND one of the mon's original types, STAB is ×2 instead of ×1.5 (see
   * `calcDamage`). Once per battle; the Tera card enforces with `exhaust: true`.
   */
  tera?: TeraState | null;
}

/** Stored on a Combatant once Terastallization is active for the rest of combat. */
export interface TeraState {
  type: PokeType;
}

/**
 * Telegraphed enemy action for the next turn.
 *
 * `attack` and `status` MUST carry a `targetIndex` — an action that hits or
 * applies a condition can't exist without something to hit or condition. The
 * index refers to `state.team[targetIndex]` (the ally being targeted).
 *
 * `defend`, `megaEvolve`, and `dynamax` self-apply — the enemy is buffing or
 * transforming itself, so there's no separate target index.
 */
export type Intent =
  | { kind: 'attack'; amount: number; targetIndex: number }
  | { kind: 'defend'; amount: number }
  | { kind: 'status'; status: StatusInstance; targetIndex: number }
  /**
   * Boss-tier intent: the enemy will Mega Evolve next turn. Applies the same
   * transform as the player's Mega Evolve card — swaps speciesSlug / types /
   * baseStats to the first Mega forme. No-op if the species has none.
   */
  | { kind: 'megaEvolve' }
  /**
   * Boss-tier intent: the enemy will Dynamax next turn — HP doubled, 3-turn
   * window, Gmax sprite swap if available. Same `DynamaxState` machinery as
   * the player side.
   */
  | { kind: 'dynamax' };

export type CombatOutcome = 'ongoing' | 'win' | 'lose' | 'captured';

export interface CombatState {
  team: Combatant[];
  activeIndex: number;
  /**
   * Foe team — 1–6 mons. Single-enemy fights still ship as `enemies: [foo]` until the
   * multi-enemy content lands. `enemyActiveIndex` is the foe that's "in front" for default
   * card targeting (Pokémon-canon: the visible opponent). Cards/intents can target other
   * foes via explicit index (C2 of the combat-rework plan).
   */
  enemies: Combatant[];
  enemyActiveIndex: number;
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
   * Switch-combo discount state machine. Switching is now always free; this flag
   * tracks the U-Turn-class "hit and run" payoff instead.
   *
   *   - `'inactive'` (default) — nothing in flight.
   *   - `'pending'`            — a comboDiscount-flagged card just resolved
   *                              (U-Turn / Volt Switch / Flip Turn). Waiting for the
   *                              player to switch active mons this turn.
   *   - `'armed-for-next-card'`— the player switched while `'pending'`. The next
   *                              card played this turn costs 1 less energy
   *                              (floor 0). Consumed on first paid play.
   *
   * Reset to `'inactive'` at end of turn — combo never carries between turns.
   */
  comboDiscount: 'inactive' | 'pending' | 'armed-for-next-card';
  log: string[];
}

export type CombatAction =
  | { type: 'PLAY_CARD'; handIndex: number }
  | { type: 'SWITCH'; teamIndex: number }
  | { type: 'END_TURN' };

/** The foe currently in front — the default target for cards and intents. Throws if the
 *  enemy team is empty, which only ever happens once `outcome` is already `'win'` and the
 *  state is no longer being acted on. */
export function activeEnemyOf(state: CombatState): Combatant {
  const enemy = state.enemies[state.enemyActiveIndex];
  if (!enemy) throw new Error('No active enemy');
  return enemy;
}

/**
 * The cluster column of a given team index. Matches PartyCluster's slot map: team[0..2]
 * sit on the front (mid/top/bot of col 1), team[3..5] on the back (col 0). Wide-Guard-
 * style column effects iterate every ally with the same column as the active mon.
 */
export type Column = 'front' | 'back';
export function columnOf(teamIndex: number): Column {
  return teamIndex < 3 ? 'front' : 'back';
}

/** Return a new state with the active enemy replaced by `mutator(activeEnemy)`. Centralised
 *  so callers don't have to remember the immutable-array splice each time. */
export function withActiveEnemy(
  state: CombatState,
  mutator: (enemy: Combatant) => Combatant,
): CombatState {
  return {
    ...state,
    enemies: state.enemies.map((e, i) => (i === state.enemyActiveIndex ? mutator(e) : e)),
  };
}
