import { useTranslation } from 'react-i18next';
import type { Intent } from '@/types';
import { cx } from '@/ui/cx';
import styles from './IntentBadge.module.css';

interface IntentBadgeProps {
  intent: Intent;
}

/**
 * Telegraphed enemy action shown above the foe sprite — Slay-the-Spire-style. Color-coded
 * by kind so the player reads "I'm about to take 12 damage" / "they're blocking 8" /
 * "BURN incoming" at a glance.
 */
export function IntentBadge({ intent }: IntentBadgeProps) {
  const { t } = useTranslation();
  switch (intent.kind) {
    case 'attack':
      return (
        <span className={cx(styles.badge, styles.attack)}>
          <span className={styles.label}>{t('intent.attack')}</span>
          <span className={styles.value}>{intent.amount}</span>
        </span>
      );
    case 'defend':
      return (
        <span className={cx(styles.badge, styles.defend)}>
          <span className={styles.label}>{t('intent.defend')}</span>
          <span className={styles.value}>{intent.amount}</span>
        </span>
      );
    case 'status':
      return (
        <span className={cx(styles.badge, styles.status)}>
          <span className={styles.label}>{t(`cards:status.${intent.status.id}`)}</span>
          <span className={styles.value}>+{intent.status.stacks}</span>
        </span>
      );
  }
}
