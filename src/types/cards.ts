import type { PokeType, StatusId } from './pokemon';
import type { Stat, TerrainKind, WeatherKind } from './combat';

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
   * Plain damage. Optional move modifiers:
   *   - `critBoost`: move-inherent +N crit stage for this hit only (`Crit +N` chip).
   *   - `recoilPercent`: self-damage as % of total dealt (`Recoil N%` chip).
   *   - `hits`: canon multi-hit moves (Double Kick = 2, Bullet Seed = 2–5 modeled as 3).
   *     The damage formula runs `hits` times, each rolling crit independently; STAB /
   *     effectiveness multipliers carry once per hit (they don't change between hits).
   *   - `recharge`: turns the attacker is locked out of attack cards AFTER this hit
   *     resolves. Canon: every recharge move (Hyper Beam, Giga Impact, Frenzy Plant,
   *     Blast Burn, Hydro Cannon, Roar of Time) is exactly 1 turn — the keyword chip
   *     is therefore label-only, the number lives on the data so we can vary it later
   *     if a future epoch ever introduces a multi-turn recharge.
   */
  | {
      kind: 'damage';
      amount: number;
      critBoost?: number;
      recoilPercent?: number;
      hits?: number;
      recharge?: number;
    }
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
  /**
   * Block (Bouclier). `scope` defaults to `self` — only the active mon shields up.
   * `column` extends the block to every ally sharing the active mon's cluster column
   * (front column = team[0..2], back column = team[3..5]). Used by Wide-Guard-style
   * canon moves that protect more than just the lead.
   */
  | { kind: 'block'; amount: number; scope?: 'self' | 'column' }
  | { kind: 'heal'; amount: number }
  | { kind: 'draw'; count: number }
  | { kind: 'applyStatus'; target: 'self' | 'foe'; status: StatusId; stacks: number }
  /**
   * Bump a stat by N stages, on either side. `scope` is only meaningful when
   * `target: 'self'` — `column` extends the bump to every ally on the active mon's
   * cluster column (canonical Tailwind-style team buffs). Default scope = `self`
   * (just the active mon).
   */
  | {
      kind: 'stat';
      target: 'self' | 'foe';
      stat: Stat;
      stages: number;
      scope?: 'self' | 'column';
    }
  | { kind: 'energy'; amount: number; when: 'now' | 'nextTurn' }
  | { kind: 'weather'; weather: WeatherKind; turns: number }
  /**
   * Battlefield terrain — Gen-VI canon. Like weather it sets a passive battlefield
   * state for N turns; full engine implementation lands later. Cards still print
   * the `Terrain` keyword chip + tooltip describing the effect.
   */
  | { kind: 'terrain'; terrain: TerrainKind; turns: number }
  /**
   * Marks the next SWITCH this turn as free of its 1-energy cost. Canon U-Turn / Volt
   * Switch / Flip Turn play after a hit-and-run damage effect and let the player rotate
   * out without paying the switch tax this turn.
   */
  | { kind: 'freeSwitch' }
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
  /**
   * Canon move priority — `+1` (Quick Attack, Aqua Jet, Bullet Punch …), `+2` (Extreme
   * Speed), `+3` (Fake Out), down to `-6` (Trick Room). In the speed-based initiative
   * system priority is the primary sort key: higher priority resolves first regardless
   * of the user's Speed; ties fall back to Speed. Omitted = priority 0 (default canon).
   * Surfaces as the `Priority +N` keyword chip.
   */
  priority?: number;
  /**
   * Single-use for the entire run, not just this combat. When the combat ends, an
   * ephemeral card that was played leaves the run's deck permanently. Reserved for
   * legendary tier (Master Ball, Max Potion). Surfaces as the `Ephemeral` keyword chip.
   *
   * NOTE: full run-scope removal needs RunState wiring (handled when the post-combat
   * resolve step lands). Per-combat exhaust already applies via BALL/ITEM routing.
   */
  ephemeral?: boolean;
}
