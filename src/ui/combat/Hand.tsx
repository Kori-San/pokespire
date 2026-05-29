import type { CSSProperties } from 'react';
import type { ComputedCardView } from '@/game/combat/selectors';
import { CARDS } from '@/data/cards';
import { Card } from './Card';
import styles from './Hand.module.css';

interface HandProps {
  /** Card ids in the player's hand, in the order they were drawn. */
  hand: string[];
  /** Computed views for each hand card — parallel to `hand`, index-aligned. */
  views: ComputedCardView[];
  /** When provided, clicking a card dispatches PLAY_CARD with its hand index. */
  onPlay?: (handIndex: number) => void;
}

/** Degrees between adjacent cards — linear in slot offset. */
const ROT_STEP_DEG = 7;
/** Vertical drop per *squared* slot offset — center stays high, edges curve downward. */
const DROP_STEP_PX = 8;

/**
 * The player's hand fanned StS-style — center card stays straight and highest, edges
 * tilt outward and drop along a parabolic arc as if held in a real hand. Each card pivots
 * from its own bottom-center, so the tilt splays the tops outward while the bases hold
 * the curve. `views` carries the precomputed matchup numbers from `selectHandViews(state)`;
 * click-to-play dispatches PLAY_CARD via the optional `onPlay(handIndex)` prop.
 */
export function Hand({ hand, views, onPlay }: HandProps) {
  const center = (hand.length - 1) / 2;
  return (
    <div className={styles.hand} role="list" aria-label="Hand">
      {hand.map((cardId, i) => {
        const card = CARDS[cardId];
        const view = views[i];
        if (!card || !view) return null;
        const handler = onPlay
          ? () => {
              onPlay(i);
            }
          : undefined;
        const off = i - center;
        const rot = off * ROT_STEP_DEG;
        const drop = off * off * DROP_STEP_PX;
        const slotStyle = {
          '--rot': `${String(rot)}deg`,
          '--drop': `${String(drop)}px`,
          zIndex: i,
        } as CSSProperties;
        return (
          <div
            key={`${cardId}-${String(i)}`}
            className={styles.slot}
            role="listitem"
            style={slotStyle}
          >
            <Card card={card} view={view} onPlay={handler} />
          </div>
        );
      })}
    </div>
  );
}
