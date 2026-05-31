import type { ReactNode } from 'react';
import { Icon } from '@iconify/react';
import styles from './PilePill.module.css';

type PileKind = 'draw' | 'discard' | 'exhaust';

interface PilePillProps {
  kind: PileKind;
  count: number;
  label: string;
  onClick?: () => void;
}

/**
 * Bottom-corner pile pill (draw / discard / exhaust). Tweaks the icon per `kind`:
 * - **draw**: copy / "stack of pages" — reads as the draw deck.
 * - **discard**: skull (the "cemetery" — StS player vernacular).
 * - **exhaust**: trash (consumed-for-the-fight cards).
 */
export function PilePill({ kind, count, label, onClick }: PilePillProps) {
  const clickable = onClick !== undefined;

  return (
    <button
      type="button"
      className={`${styles.pill} ${clickable ? styles.clickable : ''}`}
      onClick={onClick}
      disabled={!clickable}
      aria-label={`${label}: ${count}`}
    >
      <span className={styles.label}>{label}</span>
      {iconFor(kind)}
      <span className={styles.count}>{count}</span>
    </button>
  );
}

function iconFor(kind: PileKind): ReactNode {
  switch (kind) {
    case 'draw':
      return <Icon icon="pixelarticons:copy" className={styles.icon} />;
    case 'discard':
      return <Icon icon="pixelarticons:skull" className={styles.icon} />;
    case 'exhaust':
      return <Icon icon="pixelarticons:trash" className={styles.icon} />;
  }
}
