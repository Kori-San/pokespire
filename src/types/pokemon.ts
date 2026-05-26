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

export type StatusId = 'burn' | 'weak';

export interface StatusInstance {
  id: StatusId;
  stacks: number;
}
