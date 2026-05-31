import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Combatant } from '@/types';
import { FALLBACK_SPRITE, spriteUrl, type Facing } from '@/services/sprites';
import styles from './PokemonSprite.module.css';

interface PokemonSpriteProps {
  pokemon: Combatant;
  /** `front` for an opposing Pokémon, `back` for the player's active. Default `front`. */
  facing?: Facing;
}

/**
 * A Pokémon's vendored BW-animated sprite with a name + level chip below. Falls back to
 * the missingno GIF if the species/form has no asset on disk yet. Uses `pokemon.name`
 * lowercased as the form id — fine for Gen 1 base forms; multi-form species (mega / Gmax
 * / regional) will need a `formId` field on Combatant when those land.
 *
 * The fallback strategy tracks which specific URL failed so the component recovers
 * automatically when the Pokémon changes — we never get stuck on missingno after one
 * bad load.
 */
export function PokemonSprite({ pokemon, facing = 'front' }: PokemonSpriteProps) {
  const { t } = useTranslation();
  const intended = spriteUrl(pokemon.name.toLowerCase(), { facing, shiny: pokemon.shiny });
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const src = failedSrc === intended ? FALLBACK_SPRITE : intended;

  return (
    <figure className={styles.figure}>
      <img
        className={styles.sprite}
        src={src}
        alt={pokemon.name}
        onError={() => {
          setFailedSrc(intended);
        }}
      />
      <figcaption className={styles.nameplate}>
        <span className={styles.name}>{pokemon.name}</span>
        <span className={styles.level}>{t('mon.level', { level: pokemon.level })}</span>
      </figcaption>
    </figure>
  );
}
