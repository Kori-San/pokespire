import type { PokeType, StatusId } from './pokemon';
import type { Stat, WeatherKind } from './combat';

export type BallTier = 'poke' | 'great' | 'ultra' | 'master';

export type CardKind = 'ATK' | 'SKL' | 'PWR' | 'BALL' | 'ITEM';

/**
 * Pokespire rarity tied to canonical move PP — the rarer it is, the fewer times
 * canon lets you use it.
 *   - `common`   ↔ 30–40 PP (Tackle, Ember, Water Gun, Gust)
 *   - `uncommon` ↔ 20–25 PP (Flamethrower, Surf, Calm Mind)
 *   - `rare`     ↔ 10–15 PP (Fire Blast, Swords Dance, Dragon Dance)
 *   - `epic`     ↔  5  PP   (Hyper Beam, Recover, Sunny Day, Mega Evolve, Dynamax)
 * Drives reward-table offer rates. See wiki/cards.md § Rarity.
 */
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic';

/**
 * Canonical Gen-IV move category — selects which stat pair the damage formula reads.
 * Physical → atk/def, special → spAtk/spDef. Status covers every non-damaging card
 * (SKL / PWR / BALL). The HGSS icon at `public/sprites/move-category/<category>.png`
 * renders on the card so the player sees the split at a glance. See wiki/cards.md.
 */
export type MoveCategory = 'physical' | 'special' | 'status';

export type Effect =
  /**
   * Plain damage. `critBoost` (move-inherent +N crit stage for this hit only) and
   * `recoilPercent` (self-damage % of dealt) are optional move modifiers — see the
   * `Crit +N` / `Recoil N%` keywords.
   */
  | { kind: 'damage'; amount: number; critBoost?: number; recoilPercent?: number }
  /**
   * Damage + percent-of-damage heal in one effect. The full damage formula runs (STAB,
   * type-eff, stat-stages, crit roll), then the attacker heals `percent`% of the final
   * dealt amount. `critBoost` and `recoilPercent` apply same as on plain damage.
   */
  | {
      kind: 'lifesteal';
      amount: number;
      percent: number;
      critBoost?: number;
      recoilPercent?: number;
    }
  | { kind: 'block'; amount: number }
  | { kind: 'heal'; amount: number }
  | { kind: 'draw'; count: number }
  | { kind: 'applyStatus'; target: 'self' | 'foe'; status: StatusId; stacks: number }
  | { kind: 'stat'; target: 'self' | 'foe'; stat: Stat; stages: number }
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
  rarity: Rarity;
  /**
   * The card's effects hold **base** values (base damage, base stacks/turns). The on-card
   * description is generated live from these — substituting the *computed* value for the
   * current matchup — so the text always matches what the card will actually do. See
   * `selectCardLines`.
   */
  effects: Effect[];
}
