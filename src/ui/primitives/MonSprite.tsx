import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Combatant } from '@/types';
import { FALLBACK_SPRITE, spriteUrl, type Facing } from '@/services/sprites';
import styles from './MonSprite.module.css';

interface MonSpriteProps {
  mon: Combatant;
  /** `front` for an opposing mon, `back` for the player's active. Default `front`. */
  facing?: Facing;
}

/**
 * A Pokémon's vendored BW-animated sprite with a name + level chip below. Falls back to
 * the missingno GIF if the species/form has no asset on disk yet. Uses `mon.name`
 * lowercased as the form id — fine for Gen 1 base forms; multi-form species (mega / Gmax
 * / regional) will need a `formId` field on Combatant when those land.
 *
 * The fallback strategy tracks which specific URL failed so the component recovers
 * automatically when the mon changes — we never get stuck on missingno after one bad load.
 */
export function MonSprite({ mon, facing = 'front' }: MonSpriteProps) {
  const { t } = useTranslation();
  const intended = spriteUrl(mon.name.toLowerCase(), { facing, shiny: mon.shiny });
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const src = failedSrc === intended ? FALLBACK_SPRITE : intended;

  return (
    <figure className={styles.figure}>
      <img
        className={styles.sprite}
        src={src}
        alt={mon.name}
        onError={() => {
          setFailedSrc(intended);
        }}
      />
      <figcaption className={styles.nameplate}>
        <span className={styles.name}>{mon.name}</span>
        <span className={styles.level}>{t('mon.level', { level: mon.level })}</span>
      </figcaption>
    </figure>
  );
}
