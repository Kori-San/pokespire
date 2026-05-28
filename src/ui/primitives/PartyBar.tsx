import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Combatant } from '@/types';
import { FALLBACK_SPRITE, spriteUrl } from '@/services/sprites';
import { HpBar } from './HpBar';
import { cx } from '@/ui/cx';
import styles from './PartyBar.module.css';

interface PartyBarProps {
  team: Combatant[];
  activeIndex: number;
  /** When provided, bench tiles become clickable to dispatch a SWITCH. Active and fainted tiles stay static. */
  onSwitch?: (teamIndex: number) => void;
}

/**
 * The 1-to-6-mon party strip. The active mon gets a tint-ring, fainted mons go grayscale,
 * and bench mons clickable when `onSwitch` is wired up.
 */
export function PartyBar({ team, activeIndex, onSwitch }: PartyBarProps) {
  return (
    <div className={styles.bar} role="list" aria-label="Team">
      {team.map((mon, i) => (
        <PartyTile
          key={`${String(mon.speciesId)}-${String(i)}`}
          mon={mon}
          active={i === activeIndex}
          {...(onSwitch && {
            onClick: () => {
              onSwitch(i);
            },
          })}
        />
      ))}
    </div>
  );
}

interface PartyTileProps {
  mon: Combatant;
  active: boolean;
  onClick?: () => void;
}

function PartyTile({ mon, active, onClick }: PartyTileProps) {
  const { t } = useTranslation();
  const fainted = mon.hp <= 0;
  const intended = spriteUrl(mon.name.toLowerCase(), { facing: 'front', shiny: mon.shiny });
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const src = failedSrc === intended ? FALLBACK_SPRITE : intended;
  const interactive = !!onClick && !active && !fainted;
  const label = `${mon.name} ${t('mon.level', { level: mon.level })}`;

  const inner = (
    <>
      <img
        className={styles.sprite}
        src={src}
        alt={mon.name}
        onError={() => {
          setFailedSrc(intended);
        }}
      />
      <HpBar hp={mon.hp} maxHp={mon.maxHp} />
    </>
  );

  const className = cx(styles.tile, active && styles.active, fainted && styles.fainted);

  if (interactive) {
    return (
      <button type="button" className={className} onClick={onClick} aria-label={label}>
        {inner}
      </button>
    );
  }
  return (
    <div className={className} role="listitem" aria-label={label}>
      {inner}
    </div>
  );
}
