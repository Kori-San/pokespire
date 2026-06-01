import type { PokeType, StatusId } from './pokemon';
import type { Stat, TerrainKind, WeatherKind } from './combat';

export type BallTier = 'poke' | 'great' | 'ultra' | 'master';

/**
 * Canonical Pokémon-card categories. Deck-eligible kinds only — `BALL` and `ITEM`
 * were removed in the inventory redesign (Pokéballs / Potions / X-Items / Berries
 * now live in `RunState.inventory`, see [planning/05_inventory-redesign.md]).
 * The `capture` and `heal` Effect kinds are kept: capture is invoked by the
 * post-battle prompt, heal is used by canonical healing moves (Recover, …).
 */
export type CardKind = 'ATK' | 'SKL' | 'PWR';

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
  /**
   * In-combat Mega Evolution. Looks up the active mon's first canonical Mega forme in
   * the pokedex and swaps `speciesSlug` + `types` + `baseStats` (preserving hp, block,
   * statuses, stages, recharge). No-op when the active mon has no Mega forme — the
   * affordability check in `selectComputedCardView` greys the card out in that case.
   * Dual-Mega species (Charizard, Mewtwo) take the first forme listed in `otherFormes`;
   * a Mega-X / Mega-Y picker lands when the relic family ships.
   */
  | { kind: 'megaEvolve' }
  /**
   * Gen-IX Terastallization. Sets the active mon's effective type to `teraType`
   * for the rest of combat — STAB now keys off the Tera type instead of the
   * original. Canon "Tera Boost": if the move's type matches BOTH the Tera type
   * AND one of the mon's original types, STAB is ×2 instead of ×1.5. Once per
   * battle (enforced by `exhaust: true`). No revert; persists until combat ends.
   */
  | { kind: 'terastallize'; teraType: PokeType }
  /**
   * Gen-VIII Dynamax. Active mon enters a 3-turn dynamax state — `maxHp` is doubled
   * (canon: "Points de Vie doublés"), the difference is healed into `hp`, and if the
   * species has a Gigantamax forme (`forme: 'Gmax'` in pokedex) the `speciesSlug` swaps
   * to that visual. While dynamaxed every hand card is mapped at render/play time to
   * its Max-Move equivalent (per-type `MAX_MOVES[card.type]` for ATKs, universal
   * `MAX_GUARD` for SKL/PWR). End-of-turn ticks `turnsLeft`; on revert `maxHp` returns
   * to pre-dynamax and `hp` clamps. Canon: once per battle — wired via `exhaust: true`
   * on the card. No-op if the active mon is already dynamaxed.
   */
  | { kind: 'dynamax' }
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
  /**
   * Single-use for **this combat** — the card leaves for the exhaust pile on play
   * instead of the discard pile. Canon mapping: Mega Evolution (once per battle),
   * Z-Moves, signature ultimates. Kind-based routing (BALL / ITEM) still applies
   * automatically; this opt-in flag lets ATK / SKL / PWR cards exhaust too without
   * misrepresenting their kind. Surfaces as the `Exhaust` keyword chip.
   */
  exhaust?: boolean;
  /**
   * Cosmetic theme override for the card's visual treatment — replaces the type-tint
   * border / banner with a curated palette. Reserved for trans-type meta-mechanics that
   * sit outside the 18-type colour wheel:
   *   - `mega`    — rainbow conic border + hue-rotate shimmer, mirrors canonical Mega
   *                 Evolution iconography.
   *   - `dynamax` — magenta/pink radial pulse with a deep-purple inner shade, mirrors
   *                 the Gen-VIII Dynamax aura.
   *   - `tera`    — TYPE-coloured crystal facets (light + dark stops mixed off
   *                 `--card-type`) with a soft twinkle and an outer glow in the
   *                 same hue. Each Tera card reads as a gem of its tera type.
   * The `type` field still drives STAB calculations even when a theme is set — the
   * card just *looks* off-type. Optional; absence falls through to the default
   * type-tint chrome.
   */
  theme?: 'mega' | 'dynamax' | 'tera';
}
