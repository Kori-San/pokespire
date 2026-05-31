import { useTranslation } from 'react-i18next';
import type { Combatant, Intent } from '@/types';
import { spriteUrl } from '@/services/sprites';
import { cx } from '@/ui/cx';
import styles from './IntentBadge.module.css';

interface IntentBadgeProps {
  intent: Intent;
  /**
   * Who the foe is about to hit / buff. When set, the badge shows the target's mini
   * sprite so the player reads "Rattata is about to bite *Charmander*" in one glance.
   * Omitted for defend-self (foe is targeting itself / no separate target sprite needed).
   */
  target?: Combatant;
}

/**
 * Telegraphed enemy action shown above the foe sprite — Slay-the-Spire-style. Color-coded
 * by kind so the player reads "I'm about to take 12 damage" / "they're blocking 8" /
 * "BURN incoming" at a glance. When `target` is provided, the targeted mon's mini sprite
 * sits next to the value so multi-enemy fights make "who is being hit" obvious.
 */
export function IntentBadge({ intent, target }: IntentBadgeProps) {
  const { t } = useTranslation();
  const targetSprite =
    target && intent.kind !== 'defend' ? (
      <img
        className={styles.target}
        src={spriteUrl(target.name.toLowerCase(), { facing: 'front', shiny: target.shiny })}
        alt={target.name}
        aria-label={`Target: ${target.name}`}
      />
    ) : null;

  switch (intent.kind) {
    case 'attack':
      return (
        <span className={cx(styles.badge, styles.attack)}>
          <span className={styles.label}>{t('intent.attack')}</span>
          <span className={styles.value}>{intent.amount}</span>
          {targetSprite}
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
          {targetSprite}
        </span>
      );
  }
}
