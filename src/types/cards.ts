import type { PokeType, StatusId } from './pokemon';
import type { WeatherKind } from './combat';

export type BallTier = 'poke' | 'great' | 'ultra' | 'master';

export type CardKind = 'ATK' | 'SKL' | 'PWR' | 'BALL';

/**
 * Canonical Gen-IV move category — selects which stat pair the damage formula reads.
 * Physical → atk/def, special → spAtk/spDef. Status covers every non-damaging card
 * (SKL / PWR / BALL). The HGSS icon at `public/sprites/move-category/<category>.png`
 * renders on the card so the player sees the split at a glance. See wiki/cards.md.
 */
export type MoveCategory = 'physical' | 'special' | 'status';

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
  category: MoveCategory;
  /**
   * The card's effects hold **base** values (base damage, base stacks/turns). The on-card
   * description is generated live from these — substituting the *computed* value for the
   * current matchup — so the text always matches what the card will actually do. See
   * `selectCardLines`.
   */
  effects: Effect[];
}
