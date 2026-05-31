import { useTranslation } from 'react-i18next';
import type { CombatAction, CombatState } from '@/types';
import { selectHandViews } from '@/game/combat/selectors';
import { Button } from '@/ui/primitives/Button';
import { EnergyBar } from '@/ui/primitives/EnergyBar';
import {
  backgroundUrl,
  weatherOverlayUrl,
  type Biome,
  type TimeOfDay,
  type Weather,
} from '@/data/battleBackgrounds';
import type { HeldItemId } from '@/data/heldItems';
import { BattleTopBar } from './BattleTopBar';
import { Hand } from './Hand';
import { PartyCluster } from './PartyCluster';
import { PilePill } from './PilePill';
import { RelicStrip } from './RelicStrip';
import styles from './BattleStage.module.css';

interface BattleStageProps {
  state: CombatState;
  /**
   * Single dispatcher for every reducer action — keeps the contract narrow and matches
   * what the live Zustand-bound CombatScreen will hand down. Optional so stories can
   * render the stage statically.
   */
  dispatch?: (action: CombatAction) => void;
  /** Biome of the encounter — picks the underlying battlefield bg image. */
  biome?: Biome;
  /** Time of day — picks the day/dusk/night variant of the same biome. */
  time?: TimeOfDay;
  /**
   * Active weather. `clear` (default) paints no overlay; the other kinds layer a
   * transparent PNG over the bg. Assets land later — the overlay is suppressed
   * when `weatherOverlayUrl(weather)` is undefined.
   */
  weather?: Weather;
  /** Held items the player has picked up this run. Empty by default. */
  relics?: readonly HeldItemId[];
}

const POTION_SLOT_COUNT = 3;
const DEFAULT_RELICS: readonly HeldItemId[] = ['leftovers', 'flamePlate', 'choiceBand'];

/**
 * StS-shaped combat stage with two mirrored 6-slot party clusters over a Showdown
 * biome background. The reducer still owns a single `enemy`; the right cluster
 * renders that mon in slot 0 with the rest as placeholders, ready for the future
 * multi-enemy data-model change without UI churn.
 */
export function BattleStage({
  state,
  dispatch,
  biome = 'meadow',
  time = 'midday',
  weather = 'clear',
  relics = DEFAULT_RELICS,
}: BattleStageProps) {
  const { t } = useTranslation();
  const activePokemon = state.team[state.activeIndex] ?? null;
  const handViews = selectHandViews(state);
  const isOver = state.outcome !== 'ongoing';

  const playCard = dispatch
    ? (handIndex: number) => {
        dispatch({ type: 'PLAY_CARD', handIndex });
      }
    : undefined;
  const switchTo = dispatch
    ? (teamIndex: number) => {
        dispatch({ type: 'SWITCH', teamIndex });
      }
    : undefined;
  const endTurn = dispatch
    ? () => {
        dispatch({ type: 'END_TURN' });
      }
    : undefined;

  // Right-side cluster reads the full enemy team — single-foe v0 still ships as a 1-element
  // `enemies[]`, multi-foe content (C2+) will just populate more entries.
  const enemyTeam = state.enemies;

  // Potion + relic slots are placeholder for v0 (no consumables / held-items data yet).
  // Render empty slots so the layout reads correctly the moment data lands.
  const potions = Array.from<string | null>({ length: POTION_SLOT_COUNT }).fill(null);
  const weatherOverlay = weatherOverlayUrl(weather);
  return (
    <div
      className={styles.stage}
      role="region"
      aria-label={t('combat.stage', { defaultValue: 'Combat' })}
      style={{ backgroundImage: `url(${backgroundUrl(biome, time)})` }}
    >
      {weatherOverlay && (
        <div
          className={styles.weatherOverlay}
          style={{ backgroundImage: `url(${weatherOverlay})` }}
          data-weather={weather}
          aria-hidden
        />
      )}
      <BattleTopBar active={activePokemon} gold={0} potions={potions} />

      {/* One scene below the topbar holds every widget — clusters, relics, hand,
       *  piles, energy, end-turn — all positioned against the same box. The bg
       *  image (set on .stage) shows through everywhere. */}
      <div className={styles.scene}>
        <div
          className={styles.relicStripWrap}
          aria-label={t('combat.relics', { defaultValue: 'Relics' })}
        >
          <RelicStrip relics={relics} />
        </div>

        <div className={styles.playerSide}>
          <PartyCluster
            team={state.team}
            activeIndex={state.activeIndex}
            side="left"
            // Compute per-slot "I'm being targeted" counts from the active enemy
            // intent's targetIndex. defend self-applies → no ally is targeted.
            // Multi-foe targeting will sum across `state.intents[]` once C2 (B)
            // grows the per-enemy intent array.
            targetedBy={state.team.map((_, i) =>
              state.enemyIntent.kind !== 'defend' && state.enemyIntent.targetIndex === i ? 1 : 0,
            )}
            {...(switchTo && !isOver && { onSwitch: switchTo })}
          />
        </div>

        <div className={styles.enemySide}>
          <PartyCluster
            team={enemyTeam}
            activeIndex={state.enemyActiveIndex}
            side="right"
            // Per-slot intents. C1 still ships a single `enemyIntent` on the state —
            // surface it on the active foe; C2 (B) will replace this with an
            // index-aligned `state.intents` array (one per enemy).
            intents={enemyTeam.map((_, i) =>
              i === state.enemyActiveIndex ? state.enemyIntent : undefined,
            )}
            // Target for the foe's intent — default to the player's active mon
            // until intents grow an explicit `targetIndex` (C2 B). Each badge then
            // surfaces the targeted ally's mini sprite so the player sees who's
            // about to be hit at a glance.
            intentTargets={enemyTeam.map((_, i) =>
              i === state.enemyActiveIndex ? (activePokemon ?? undefined) : undefined,
            )}
          />
        </div>

        {/* Left HUD pillar — energy pips above the deck pile, bottom-left corner. */}
        <div className={styles.leftCluster}>
          <EnergyBar
            current={state.energy}
            max={state.maxEnergy}
            ariaLabel={t('combat.energy', {
              current: state.energy,
              max: state.maxEnergy,
            })}
          />
          <PilePill kind="draw" count={state.draw.length} label={t('combat.drawPile')} />
        </div>

        <div className={styles.handArea}>
          <Hand
            hand={state.hand}
            views={handViews}
            {...(playCard && !isOver && { onPlay: playCard })}
          />
        </div>

        {/* Right HUD pillar — exhaust + discard piles paired with turn badge +
         *  End Turn button in a 2×2 grid, bottom-right corner. */}
        <div className={styles.rightCluster}>
          <PilePill
            kind="exhaust"
            count={state.exhaust.length}
            label={t('combat.exhaustPile', { count: state.exhaust.length })}
          />
          <span className={styles.turnBadge}>
            {t('combat.turn', { defaultValue: 'Turn {{n}}', n: state.turn })}
          </span>
          <PilePill kind="discard" count={state.discard.length} label={t('combat.discardPile')} />
          <Button
            className={styles.endTurnButton}
            variant="primary"
            onClick={endTurn}
            disabled={!endTurn || isOver}
          >
            {t('combat.endTurn')}
          </Button>
        </div>
      </div>
    </div>
  );
}
