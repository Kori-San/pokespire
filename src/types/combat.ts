import type { BaseStats, PokeType, StatusInstance } from './pokemon';

export type WeatherKind = 'sun' | 'rain' | 'sand' | 'hail';

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
  maxHp: number;
  hp: number;
  block: number;
  statuses: StatusInstance[];
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
  log: string[];
}

export type CombatAction =
  | { type: 'PLAY_CARD'; handIndex: number }
  | { type: 'SWITCH'; teamIndex: number }
  | { type: 'END_TURN' };
