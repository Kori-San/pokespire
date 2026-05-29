export const POKE_TYPES = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
] as const;

export type PokeType = (typeof POKE_TYPES)[number];

export interface BaseStats {
  hp: number;
  atk: number;
  def: number;
  spAtk: number;
  spDef: number;
  spd: number;
}

export type GrowthRate =
  | 'slow'
  | 'medium-slow'
  | 'medium-fast'
  | 'fast'
  | 'erratic'
  | 'fluctuating';

/**
 * Status effects that can stick to a Combatant. Stacks behave per status:
 *   - `burn`, `poison`: tick damage at end of turn proportional to stacks; decay 1/turn.
 *   - `weak`: ×0.75 multiplier on damage dealt while present; decay 1/turn.
 *   - `sleep`, `freeze`: the holder skips its action while present; decay 1/turn. Foe-only
 *     in v0 — player-side card play stays interactive even if the active mon is hit
 *     by one of these.
 *   - `paralyze`: halves the holder's effective speed (turn-order). Decay 1/turn. Foe-only.
 */
export type StatusId = 'burn' | 'weak' | 'poison' | 'sleep' | 'paralyze' | 'freeze';

export interface StatusInstance {
  id: StatusId;
  stacks: number;
}
