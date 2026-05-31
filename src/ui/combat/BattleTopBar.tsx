import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import type { Combatant } from '@/types';
import { FALLBACK_SPRITE, spriteUrl } from '@/services/sprites';
import styles from './BattleTopBar.module.css';

interface BattleTopBarProps {
  active: Combatant | null;
  gold: number;
  /** Potion slots, fixed-length 3 for v0. `null` = empty. Real potion data lands later. */
  potions: readonly (string | null)[];
  onSettings?: () => void;
}

/**
 * Persistent strip at the top of the battle stage. Mirrors StS's top-left HUD
 * (portrait + HP + gold + potions). Turn counter + exhaust pile live on the
 * bottom strip now, so the topbar's right side only carries the settings cog.
 */
export function BattleTopBar({ active, gold, potions, onSettings }: BattleTopBarProps) {
  const { t } = useTranslation();

  return (
    <header className={styles.topBar}>
      <div className={styles.left}>
        <ActivePortrait active={active} />
        {active && <ActiveStats active={active} />}
        <span className={styles.gold}>
          <Icon icon="pixelarticons:coin" className={styles.goldIcon} aria-hidden />
          {gold}
        </span>
        {/* Consumable potion slots sit next to the gold pill — fixed-count inventory
         *  (StS pattern). Empty slots show a desaturated Leppa Berry as a "berries
         *  / TMs go here" placeholder so the affordance reads without needing a
         *  hover-tooltip. */}
        <div className={styles.potions}>
          {potions.map((p, i) => (
            <div
              // Index-keyed because slot identity is positional (slot 0/1/2), not value.
              key={i}
              className={styles.potionSlot}
              data-filled={p !== null}
              aria-label={p ?? t('combat.emptyPotion', { defaultValue: 'Empty potion slot' })}
            >
              {p !== null ? (
                <Icon icon="pixelarticons:potion" className={styles.potionIcon} aria-hidden />
              ) : (
                <img
                  className={styles.potionPlaceholder}
                  src="/sprites/items/leppa-berry.png"
                  alt=""
                  aria-hidden
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.spacer} aria-hidden />

      <div className={styles.right}>
        <button
          type="button"
          className={styles.settings}
          onClick={onSettings}
          disabled={!onSettings}
          aria-label={t('common.settings', { defaultValue: 'Settings' })}
        >
          <Icon icon="pixelarticons:settings-cog" className={styles.settingsIcon} aria-hidden />
        </button>
      </div>
    </header>
  );
}

function ActivePortrait({ active }: { active: Combatant | null }) {
  const [failed, setFailed] = useState<string | null>(null);
  if (!active) return <div className={styles.portraitFrame} aria-hidden />;

  const intended = spriteUrl(active.name.toLowerCase(), { facing: 'front', shiny: active.shiny });
  const src = failed === intended ? FALLBACK_SPRITE : intended;
  return (
    <div className={styles.portraitFrame}>
      <img
        className={styles.portrait}
        src={src}
        alt={active.name}
        onError={() => {
          setFailed(intended);
        }}
      />
    </div>
  );
}

function ActiveStats({ active }: { active: Combatant }) {
  const { t } = useTranslation();
  const ratio = active.maxHp > 0 ? Math.max(0, Math.min(1, active.hp / active.maxHp)) : 0;
  const tier = ratio > 0.5 ? 'high' : ratio > 0.2 ? 'mid' : 'low';
  return (
    <div className={styles.activeInfo}>
      <span className={styles.activeName}>
        {active.name} · {t('mon.level', { level: active.level })}
      </span>
      <div className={styles.activeHpRow}>
        <div className={styles.activeHpBar}>
          <div
            className={styles.activeHpFill}
            data-tier={tier}
            style={{ width: `${ratio * 100}%` }}
          />
        </div>
        <span className={styles.activeHpLabel}>
          {active.hp}/{active.maxHp}
        </span>
      </div>
    </div>
  );
}
