import type { CSSProperties } from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import type { CardDef } from '@/types';
import { selectCardLines, type ComputedCardView, type EffectLine } from '@/game/combat/selectors';
import { EnergyBar } from '@/ui/primitives/EnergyBar';
import { cx } from '@/ui/cx';
import styles from './Card.module.css';

/** Energy ceiling visualised on every card; the deck cannot print costs above this. */
const ENERGY_SLOTS = 3;

interface CardProps {
  card: CardDef;
  view: ComputedCardView;
  onPlay?: (() => void) | undefined;
}

/**
 * A hand card. Name + description are localized via `react-i18next` (`cardNames:*`,
 * `cards:lines.*`, `cards:status.*`, `cards:weather.*`); the description's numbers are
 * computed live for the current matchup, so the text always matches what the card does.
 */
export function Card({ card, view, onPlay }: CardProps) {
  const { t } = useTranslation();
  const lines = selectCardLines(card, view);
  const description = lines.map((line) => renderLine(line, t)).join(' ');
  const name = t(`cardNames:${card.id}`, { defaultValue: card.name });

  return (
    <button
      type="button"
      className={cx(styles.card, !view.affordable && styles.disabled)}
      style={{ '--card-type': `var(--type-${card.type})` } as CSSProperties}
      disabled={!view.affordable}
      onClick={onPlay}
      title={view.damage?.tooltip}
    >
      <span className={styles.banner}>{name}</span>
      <p className={styles.body}>{description}</p>
      <span className={styles.footer}>
        <EnergyBar
          current={card.cost}
          max={ENERGY_SLOTS}
          ariaLabel={`Cost ${String(card.cost)} of ${String(ENERGY_SLOTS)}`}
        />
        <img
          className={styles.categoryIcon}
          src={`/sprites/move-category/${card.category}.png`}
          alt={card.category}
        />
      </span>
    </button>
  );
}

function renderLine(line: EffectLine, t: TFunction): string {
  switch (line.kind) {
    case 'damage':
      return t('cards:lines.damage', { value: line.value });
    case 'block':
      return t('cards:lines.block', { value: line.value });
    case 'heal':
      return t('cards:lines.heal', { value: line.value });
    case 'draw':
      return t('cards:lines.draw', { count: line.count });
    case 'applyStatus': {
      const status = t(`cards:status.${line.status}`);
      const key = line.self ? 'cards:lines.applyStatusSelf' : 'cards:lines.applyStatus';
      return t(key, { stacks: line.stacks, status });
    }
    case 'energy':
      return t('cards:lines.energy', { value: line.value });
    case 'weather': {
      const weather = t(`cards:weather.${line.weather}`);
      return t('cards:lines.weather', { weather });
    }
    case 'capture':
      return t('cards:lines.capture', { percent: line.percent });
  }
}
