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
 * A Pokémon's vendored BW sprite with a name + level chip below. Resolves via
 * `pokemon.speciesSlug` against the generated `SPRITE_INDEX` (animated → static
 * fallback inside the resolver). Display name flows through the `pokemonNames:`
 * locale namespace so the FR build renders Salamèche / Bulbizarre / etc.
 *
 * The `onError` retry tracks which specific URL failed so the component recovers
 * automatically when the Pokémon changes — we never get stuck on missingno after one
 * bad load.
 */
export function PokemonSprite({ pokemon, facing = 'front' }: PokemonSpriteProps) {
  const { t } = useTranslation();
  const displayName = t(`pokemonNames:${pokemon.speciesSlug}`, { defaultValue: pokemon.name });
  const intended = spriteUrl(pokemon.speciesSlug, { facing, shiny: pokemon.shiny });
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const src = failedSrc === intended ? FALLBACK_SPRITE : intended;

  return (
    <figure className={styles.figure}>
      <img
        className={styles.sprite}
        src={src}
        alt={displayName}
        onError={() => {
          setFailedSrc(intended);
        }}
      />
      <figcaption className={styles.nameplate}>
        <span className={styles.name}>{displayName}</span>
        <span className={styles.level}>{t('mon.level', { level: pokemon.level })}</span>
      </figcaption>
    </figure>
  );
}
