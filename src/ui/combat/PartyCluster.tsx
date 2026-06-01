import type { Combatant, Intent } from '@/types';
import { PokemonSlot } from './PokemonSlot';
import styles from './PartyCluster.module.css';

interface PartyClusterProps {
  /** 1–6 mons. The cluster always reserves 6 slot positions; missing slots render nothing. */
  team: readonly Combatant[];
  activeIndex: number;
  side: 'left' | 'right';
  /**
   * Player-side slots are switch-able. When omitted (enemy side, or read-only stories),
   * slots aren't clickable but tooltips still work so the player can scout the foe.
   */
  onSwitch?: (teamIndex: number) => void;
  /**
   * Per-slot enemy intents. Index-aligned with `team` — `intents[i]` is the intent for
   * the foe at `team[i]`. Used only on the enemy cluster. Each slot self-renders its
   * badge above its sprite (see PokemonSlot's `intent` prop), so the cluster just
   * threads them through.
   */
  intents?: readonly (Intent | undefined)[];
  /**
   * Per-slot intent targets — index-aligned with `team`, so `intentTargets[i]` is the
   * ally Combatant that `intents[i]` will hit. Pre-resolved by the parent (BattleStage)
   * from the ally team via `intent.targetIndex` (or `playerActiveIndex` as the v0
   * default). PokemonSlot forwards this to IntentBadge so the badge shows the target's
   * mini sprite.
   */
  intentTargets?: readonly (Combatant | undefined)[];
  /**
   * Per-slot "this ally is being targeted by N foes this turn" counts. Index-aligned
   * with `team`. Used only on the player cluster. PokemonSlot turns this into a red
   * pulsing outline (+ a count chip when N ≥ 2).
   */
  targetedBy?: readonly number[];
}

/**
 * Diagonal-staircase party cluster. Slot positions follow the user's paint sketch:
 *
 *   `[1] [2]`         ← row 1 (top): slight forward shift
 *   ` [5] [4]`        ← row 2 (mid): rearward (no shift)
 *   `  [6] [3]`       ← row 3 (bot): full forward shift (most forward)
 *
 * `team[i]` maps to slot `(i + 1)`. The right (enemy) cluster is the 180°-rotated
 * mirror of the player layout — that automatically swaps the "most forward" row
 * from bottom (player) to top (enemy), matching the design direction
 * "their first row is most forwarded, third is 2nd most forwarded".
 */

// Slot footprint — sprite (96 sq) + HP bar (~14) + room for an enemy intent
// badge floating above (~22) on enemy clusters. Width is the slot width's
// natural footprint; height is what we need to clear so neighbouring rows'
// intent badges + HP bars don't crash into each other.
const SLOT_W = 100;
const SLOT_H = 130;

// Within-row gap between col 0 and col 1.
const COL_GAP = 20;
const COL0_X = 0;
const COL1_X = SLOT_W + COL_GAP; // 120

// Row Y positions — rows breathe apart so adjacent sprites don't visually glue
// together. Stride matches SLOT_H so a row's HP bar / intent badge sits cleanly
// above the next row's sprite.
const ROW_Y = [0, 130, 260] as const;

// Per-row "forward" shift (toward the enemy for player; mirrored for enemy).
//   row 1 (top): slight forward
//   row 2 (mid): no shift
//   row 3 (bot): full forward — the most forward row for the player
const ROW_SHIFT = [20, 0, 40] as const;

// Slot-to-grid mapping (player side, viewed front-on):
//
//   slot 4 (team[3])     slot 2 (team[1])     ← row 1 (top)
//        slot 5 (team[4])    slot 1 (team[0]) ← row 2 (mid)  team[0] = active centre
//   slot 6 (team[5])     slot 3 (team[2])     ← row 3 (bot)
//
// `team[0]` lands at the front-centre slot (mid-right) so the active mon reads
// as the focal point. Remaining slots fan out around it. Enemy positions are
// the 180° mirror of this map (derived below) — slot 1 ends up at the enemy's
// mid-left, opposite the player's active.
const PLAYER_POSITIONS: readonly { x: number; y: number }[] = [
  { x: COL1_X + ROW_SHIFT[1], y: ROW_Y[1] }, // slot 1: mid-right (team[0] active)
  { x: COL1_X + ROW_SHIFT[0], y: ROW_Y[0] }, // slot 2: top-right
  { x: COL1_X + ROW_SHIFT[2], y: ROW_Y[2] }, // slot 3: bot-right
  { x: COL0_X + ROW_SHIFT[0], y: ROW_Y[0] }, // slot 4: top-left
  { x: COL0_X + ROW_SHIFT[1], y: ROW_Y[1] }, // slot 5: mid-left
  { x: COL0_X + ROW_SHIFT[2], y: ROW_Y[2] }, // slot 6: bot-left
];

// Cluster bounds — widest x + slot, tallest y + slot.
export const CLUSTER_W = COL1_X + ROW_SHIFT[2] + SLOT_W; // 260
export const CLUSTER_H = ROW_Y[2] + SLOT_H; // 390

// Enemy slots = 180° rotation of player slots about the cluster centre. This
// automatically lifts the "most forward" row from bottom to top of the cluster
// and inverts the row shifts to lean leftward (toward the player).
const ENEMY_POSITIONS: readonly { x: number; y: number }[] = PLAYER_POSITIONS.map((p) => ({
  x: CLUSTER_W - SLOT_W - p.x,
  y: CLUSTER_H - SLOT_H - p.y,
}));

export function PartyCluster({
  team,
  activeIndex,
  side,
  onSwitch,
  intents,
  intentTargets,
  targetedBy,
}: PartyClusterProps) {
  const positions = side === 'left' ? PLAYER_POSITIONS : ENEMY_POSITIONS;

  // Sort by y so back-row slots are earlier in the DOM and front-row slots paint
  // on top via document order. We deliberately do NOT set `z-index` on slotWraps:
  // any non-auto z-index here would bubble up to the stage's root stacking context
  // and shadow sibling tooltips (relic strip, etc.) that should always sit on top.
  const slots = positions
    .map((pos, i) => ({ pos, i, mon: team[i] ?? null }))
    .filter((s): s is { pos: typeof s.pos; i: number; mon: Combatant } => s.mon !== null)
    .sort((a, b) => a.pos.y - b.pos.y);

  return (
    <div className={styles.cluster} data-side={side}>
      {slots.map(({ pos, i, mon }) => (
        <div key={i} className={styles.slotWrap} style={{ left: pos.x, top: pos.y }}>
          <PokemonSlot
            pokemon={mon}
            active={i === activeIndex}
            // Chevron is a "your turn / your front-line" affordance — only the player
            // sees it. Enemy active just sits there.
            showActiveIndicator={side === 'left'}
            // Card-style side tooltips: player cluster's hover-info flies right into
            // the empty centre of the field; enemy cluster's flies left. Saves the
            // vertical space the default `top` placement used.
            tooltipPlacement={side === 'left' ? 'right' : 'left'}
            {...(intents?.[i] !== undefined && { intent: intents[i] })}
            {...(intentTargets?.[i] !== undefined && { intentTarget: intentTargets[i] })}
            {...(targetedBy?.[i] !== undefined && { targetedBy: targetedBy[i] })}
            {...(onSwitch
              ? {
                  onClick: () => {
                    onSwitch(i);
                  },
                }
              : {})}
          />
        </div>
      ))}
    </div>
  );
}
