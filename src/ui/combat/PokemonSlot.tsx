import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import type { Combatant, Intent } from '@/types';
import { FALLBACK_SPRITE, spriteUrl } from '@/services/sprites';
import { IntentBadge } from '@/ui/primitives/IntentBadge';
import { type TooltipPlacement } from '@/ui/primitives/Tooltip';
import { KEYWORD_VISUAL, keywordLabel, keywordTooltipDesc, keywordTooltipName } from './keywords';
import styles from './PokemonSlot.module.css';

interface PokemonSlotProps {
  pokemon: Combatant | null;
  /**
   * Highlights the slot — currently only the player side renders the bouncing-chevron
   * indicator (the enemy's "active" mon is implicit from the lone-foe layout / future
   * targeting affordance), so this also controls whether the chevron shows.
   */
  active?: boolean;
  /** Suppresses the chevron even when `active` — used for enemy-side slots. */
  showActiveIndicator?: boolean;
  /**
   * If provided, the slot becomes a button. Only wired for player-side, non-active,
   * non-fainted mons — the parent decides who can be switched in.
   */
  onClick?: () => void;
  /**
   * Enemy-side: telegraph what this mon is about to do. Rendered as an IntentBadge
   * pinned above the sprite. Undefined on ally slots and on bench enemies with no
   * pending action.
   */
  intent?: Intent;
  /**
   * Enemy-side: who the intent will hit / status. Passed to the IntentBadge so the
   * badge can show the target's mini sprite. Undefined for defend (foe targets self).
   */
  intentTarget?: Combatant;
  /**
   * Ally-side: how many enemy intents this turn target this mon. > 0 paints a red
   * pulsing outline around the slot; > 1 also surfaces a small count chip in the
   * corner. Undefined / 0 = no target indicator.
   */
  targetedBy?: number;
  /**
   * Where the hover tooltip pops out relative to the slot. Defaults to `top`.
   * PartyCluster sets this per-side so the player cluster's tooltips fly to
   * the right (into the empty centre field) and the enemy cluster's fly to the
   * left — like card tooltips, saves the vertical space the `top` placement ate. */
  tooltipPlacement?: TooltipPlacement;
}

/**
 * One cell of the diagonal-staircase cluster. Sprite + mini HP bar floating on the
 * battlefield bg (no frame, StS-style). Hover anywhere on the slot reveals a
 * Tooltip with the mon's level, types, the 6 base stats, and any active statuses.
 */
export function PokemonSlot({
  pokemon,
  active = false,
  showActiveIndicator = true,
  onClick,
  intent,
  intentTarget,
  targetedBy = 0,
  tooltipPlacement = 'top',
}: PokemonSlotProps) {
  const { t } = useTranslation();
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  // Empty slots render nothing — no frame, no placeholder.
  if (!pokemon) return null;

  const fainted = pokemon.hp <= 0;
  const clickable = onClick !== undefined && !active && !fainted;
  const displayName = t(`pokemonNames:${pokemon.speciesSlug}`, { defaultValue: pokemon.name });
  const intended = spriteUrl(pokemon.speciesSlug, { facing: 'front', shiny: pokemon.shiny });
  const src = failedSrc === intended ? FALLBACK_SPRITE : intended;

  const hpRatio = pokemon.maxHp > 0 ? Math.max(0, Math.min(1, pokemon.hp / pokemon.maxHp)) : 0;
  const hpTier = hpRatio > 0.5 ? 'high' : hpRatio > 0.2 ? 'mid' : 'low';

  const classes = [
    styles.slot,
    active ? styles.active : '',
    fainted ? styles.fainted : '',
    clickable ? styles.clickable : '',
    targetedBy > 0 ? styles.targeted : '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleClick = clickable ? onClick : undefined;
  const role = clickable ? 'button' : undefined;
  const tabIndex = clickable ? 0 : undefined;

  // Hover anywhere on `.tooltipWrap` shows BOTH the stats bubble AND one
  // separate keyword bubble per status — stacked in a column to the right of
  // the stats bubble. Same pattern as cards (stats panel + glossary column),
  // but each keyword is its own physically-separate bubble.
  return (
    <span className={styles.tooltipWrap} data-placement={tooltipPlacement}>
      <div
        className={classes}
        onClick={handleClick}
        role={role}
        tabIndex={tabIndex}
        aria-label={displayName}
      >
        {/* Enemy intent telegraph — pinned above the sprite. Carries the target
         *  Combatant so the badge can show the targeted ally's mini sprite. */}
        {intent && (
          <div className={styles.intentSlot} aria-hidden>
            <IntentBadge intent={intent} {...(intentTarget && { target: intentTarget })} />
          </div>
        )}
        <div className={styles.spriteWrap}>
          <img
            className={styles.sprite}
            src={src}
            alt={displayName}
            onError={() => {
              setFailedSrc(intended);
            }}
          />
          {pokemon.statuses.length > 0 && (
            <div className={styles.statusRow}>
              {pokemon.statuses.map((s) => (
                <span
                  key={s.id}
                  className={styles.statusChip}
                  data-status={s.id}
                  aria-label={t(`status.${s.id}.name`, { defaultValue: s.id })}
                >
                  {s.id.charAt(0).toUpperCase()}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className={styles.hpRow}>
          {/* Active indicator: real flex sibling of the bar+label column, not an
           * absolute overlay. TODO: once the capture system tracks
           * `caughtWith: BallTier`, swap the src to that ball's icon
           * (great-ball / ultra-ball / master-ball …). Default is poke-ball. */}
          {active && showActiveIndicator && (
            <img
              className={styles.activeIndicator}
              src="/sprites/items/poke-ball.png"
              alt=""
              aria-hidden
            />
          )}
          <div className={styles.hpStack}>
            <div className={styles.hpBar}>
              <div
                className={styles.hpFill}
                data-tier={hpTier}
                style={{ width: `${hpRatio * 100}%` }}
              />
            </div>
            <span className={styles.hpLabel}>
              {pokemon.hp}/{pokemon.maxHp}
            </span>
            {/* ×N chip when 2+ foes target this ally — absolute on `.hpStack`,
             *  pinned to the HP bar's top-right corner with a slight overhang
             *  above the bar. The bar itself has `overflow: hidden` (for the
             *  hpFill clip), so the chip lives on its parent instead. */}
            {targetedBy > 1 && (
              <span
                className={styles.targetedCount}
                aria-label={`Targeted by ${String(targetedBy)} foes`}
              >
                ×{targetedBy}
              </span>
            )}
          </div>
        </div>
      </div>
      {/* Tooltip group — stats bubble + a separate bubble per status keyword.
       *  All siblings of the slot inside `.tooltipWrap`, all fading in together
       *  on `.tooltipWrap:hover`. Stats bubble sits closest to the slot; the
       *  keyword bubbles stack in a column further out. */}
      <span className={styles.tooltipGroup}>
        <span className={styles.statsBubble} role="tooltip">
          <span className={styles.tooltipTitle}>
            {displayName} · {t('mon.level', { level: pokemon.level })}
          </span>
          <span className={styles.tooltipTypes}>
            {pokemon.types.map((type) => (
              <span
                key={type}
                className={styles.tooltipType}
                style={{ background: `var(--type-${type})` }}
              >
                {t(`type.${type}`, { defaultValue: type })}
              </span>
            ))}
          </span>
          {/* Two stat columns: physical (HP/ATK/DEF) | special (SP.ATK/SP.DEF/SPD). */}
          <span className={styles.tooltipStats}>
            <span className={styles.tooltipStatLabel}>HP</span>
            <span>{pokemon.baseStats.hp}</span>
            <span className={styles.tooltipStatLabel}>SP.ATK</span>
            <span>{pokemon.baseStats.spAtk}</span>

            <span className={styles.tooltipStatLabel}>ATK</span>
            <span>{pokemon.baseStats.atk}</span>
            <span className={styles.tooltipStatLabel}>SP.DEF</span>
            <span>{pokemon.baseStats.spDef}</span>

            <span className={styles.tooltipStatLabel}>DEF</span>
            <span>{pokemon.baseStats.def}</span>
            <span className={styles.tooltipStatLabel}>SPD</span>
            <span>{pokemon.baseStats.spd}</span>
          </span>
          {pokemon.statuses.length > 0 && (
            <span className={styles.tooltipStatuses}>
              {pokemon.statuses.map((s) => {
                const v = KEYWORD_VISUAL[s.id];
                return (
                  <span key={s.id} className={styles.tooltipStatusChip}>
                    <Icon
                      icon={v.icon}
                      className={styles.tooltipStatusIcon}
                      style={{ color: v.color }}
                      aria-hidden
                    />
                    {keywordLabel({ id: s.id, stacks: s.stacks, self: false }, t)}
                  </span>
                );
              })}
            </span>
          )}
        </span>
        {pokemon.statuses.length > 0 && (
          <span className={styles.keywordColumn}>
            {pokemon.statuses.map((s) => {
              const v = KEYWORD_VISUAL[s.id];
              const k = { id: s.id, stacks: s.stacks, self: false } as const;
              return (
                <span key={s.id} className={styles.keywordBubble} role="tooltip">
                  <span className={styles.tooltipGlossaryLabel}>
                    <Icon
                      icon={v.icon}
                      className={styles.tooltipStatusIcon}
                      style={{ color: v.color }}
                      aria-hidden
                    />
                    {keywordTooltipName(k, t)}
                  </span>
                  <span className={styles.tooltipGlossaryDesc}>{keywordTooltipDesc(k, t)}</span>
                </span>
              );
            })}
          </span>
        )}
      </span>
    </span>
  );
}
