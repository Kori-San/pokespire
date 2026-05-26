import type { PokeType, StatusId } from './pokemon';
import type { WeatherKind } from './combat';

export type BallTier = 'poke' | 'great' | 'ultra' | 'master';

export type CardKind = 'ATK' | 'SKL' | 'PWR' | 'BALL';

export type Effect =
  | { kind: 'damage'; amount: number }
  | { kind: 'block'; amount: number }
  | { kind: 'heal'; amount: number }
  | { kind: 'draw'; count: number }
  | { kind: 'applyStatus'; target: 'self' | 'foe'; status: StatusId; stacks: number }
  | { kind: 'energy'; amount: number; when: 'now' | 'nextTurn' }
  | { kind: 'weather'; weather: WeatherKind; turns: number }
  | { kind: 'capture'; ballTier: BallTier };

export interface CardDef {
  id: string;
  name: string;
  type: PokeType;
  cost: number;
  kind: CardKind;
  effects: Effect[];
  text: string;
}
