import type { CSSProperties } from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import type { CardDef, PokeType } from '@/types';
import { keywordsOf } from '@/data/cards';
import { selectCardLines, type ComputedCardView, type EffectLine } from '@/game/combat/selectors';
import { cx } from '@/ui/cx';
import {
  KEYWORD_VISUAL,
  chipKey,
  keywordLabel,
  keywordTooltipDesc,
  keywordTooltipName,
} from './keywords';
import { KwIcon } from './KwIcon';
import styles from './Card.module.css';

/** Energy ceiling visualised on every card; the deck cannot print costs above this. */
const ENERGY_SLOTS = 3;

/**
 * The card's accent color — always the active Pokémon-type tint. The BALL / ITEM
 * special-cases went away with the inventory redesign (those cards no longer exist;
 * captures + consumables live in `RunState.inventory`). Trans-type meta cards (Mega,
 * Dynamax) use the `theme` field to override the tint chrome entirely.
 */
function tintVar(type: PokeType): string {
  return `var(--type-${type})`;
}

interface CardProps {
  card: CardDef;
  view: ComputedCardView;
  onPlay?: (() => void) | undefined;
}

/**
 * A hand card. Name + description are localized via `react-i18next` (`cardNames:*`,
 * `cards:lines.*`); the description's numbers are computed live for the current
 * matchup, so the text always matches what the card does.
 *
 * Keywords (`Exhaust.`, `STAB`, `Super effective`, `Burn 2`, `Lifesteal 75%`, `Crit +1`,
 * `Recoil 33%`, …) print under the description as bold chips with a pixelarticons icon
 * each. Hovering the card reveals a glossary tooltip to its right with each keyword's
 * full definition.
 */
export function Card({ card, view, onPlay }: CardProps) {
  const { t } = useTranslation();
  const lines = selectCardLines(card, view);
  // Each effect renders on its own line (empty strings skip — `applyStatus` and `weather`
  // surface via the keyword chip below instead of inline body text).
  const renderedLines = lines.map((line) => renderLine(line, t)).filter((s) => s.length > 0);
  const name = t(`cardNames:${card.id}`, { defaultValue: card.name });
  const keywords = keywordsOf(card, {
    ...(view.damage?.stab !== undefined && { stab: view.damage.stab }),
    ...(view.damage?.effectiveness && { effectiveness: view.damage.effectiveness }),
  });
  // Density bucket — shrinks the body font so chip-heavy cards still fit the locked
  // height. Mid kicks in for mildly busy cards (Shell Smash's 5 stat-changes fit
  // comfortably here); dense is reserved for truly stuffed effect+keyword stacks.
  const totalLines = lines.length + keywords.length;
  const density = totalLines >= 7 ? 'dense' : totalLines >= 4 ? 'mid' : 'normal';
  // Banner density follows title length — long move names (ELECTRIC TERRAIN) drop a step.
  const bannerDensity = name.length >= 14 ? 'dense' : name.length >= 11 ? 'mid' : 'normal';

  // Tooltip is a SIBLING of the card button (not a child) so the disabled card's
  // `filter: grayscale(...)` can't cascade onto it — CSS filters affect every
  // descendant and can't be "undone" on a child. The thin `.cardWrap` span gives
  // the tooltip a positioning context the card itself can't provide (the disabled
  // filter would still cascade if the tooltip were inside the button), and works
  // identically inside the Hand's `.slot` or in standalone stories.
  return (
    <span className={styles.cardWrap}>
      <button
        type="button"
        className={cx(styles.card, !view.affordable && styles.disabled)}
        style={{ '--card-type': tintVar(card.type) } as CSSProperties}
        data-theme={card.theme}
        disabled={!view.affordable}
        onClick={onPlay}
      >
        <span className={styles.banner} data-density={bannerDensity}>
          {name}
        </span>
        {/* Cost sits directly under the banner — it's the first decision-info
         *  ("can I afford this?"), so adjacency to the title cuts scanning time
         *  in half. Pips are inlined (not the EnergyBar primitive) so each one
         *  can `flex: 1` and fill the full card width — the cost reads at a glance
         *  from across the screen instead of squinting at three tiny chips. */}
        <span
          className={styles.cost}
          role="img"
          aria-label={`Cost ${String(card.cost)} of ${String(ENERGY_SLOTS)}`}
        >
          {Array.from({ length: ENERGY_SLOTS }, (_, i) => (
            <span
              key={i}
              className={cx(styles.costPip, i < card.cost && styles.costPipLit)}
              aria-hidden
            />
          ))}
        </span>
        <div className={styles.body} data-density={density}>
          {renderedLines.map((line, i) => (
            <span key={`line-${String(i)}`} className={styles.bodyLine}>
              {line}
            </span>
          ))}
          {keywords.length > 0 && (
            <span className={styles.keywords}>
              {keywords.map((k) => {
                const v = KEYWORD_VISUAL[k.id];
                return (
                  <span key={chipKey(k)} className={cx(styles.keyword, styles[`kw_${k.id}`])}>
                    <KwIcon visual={v} className={styles.kwIcon} />
                    {keywordLabel(k, t)}
                  </span>
                );
              })}
            </span>
          )}
        </div>
        <hr className={styles.footerDivider} />
        <span className={styles.footer}>
          <img
            className={styles.categoryIcon}
            src={`/sprites/move-category/${card.category}.png`}
            alt={card.category}
          />
        </span>
      </button>
      {keywords.length > 0 && (
        <span className={styles.tooltip} role="tooltip">
          {keywords.map((k, i) => {
            const v = KEYWORD_VISUAL[k.id];
            return (
              <span key={chipKey(k)}>
                {i > 0 && <hr className={styles.tooltipDivider} />}
                <span className={styles.tooltipEntry}>
                  <span className={styles.tooltipLabel}>
                    <KwIcon visual={v} className={styles.kwIcon} />
                    {keywordTooltipName(k, t)}
                  </span>
                  <span className={styles.tooltipDesc}>{keywordTooltipDesc(k, t)}</span>
                </span>
              </span>
            );
          })}
        </span>
      )}
    </span>
  );
}

function renderLine(line: EffectLine, t: TFunction): string {
  switch (line.kind) {
    case 'damage':
      return t('cards:lines.damage', { value: line.value });
    case 'lifesteal':
      // Lifesteal's "recover X HP" rider becomes the Lifesteal keyword chip — only the
      // damage portion stays as inline description text.
      return t('cards:lines.damage', { value: line.value });
    case 'block':
      return t('cards:lines.block', { value: line.value });
    case 'heal':
      return t('cards:lines.heal', { value: line.value });
    case 'draw':
      return t('cards:lines.draw', { count: line.count });
    case 'applyStatus':
      // The status name + stacks now live on the keyword chip below; inline description
      // text would just duplicate it.
      return '';
    case 'stat': {
      const stat = t(`cards:stat.${line.stat}`);
      const stages = Math.abs(line.stages);
      const direction = line.stages > 0 ? 'Raise' : 'Lower';
      const target = line.self ? 'Self' : 'Foe';
      return t(`cards:lines.stat${direction}${target}`, { stat, stages });
    }
    case 'energy':
      return t('cards:lines.energy', { value: line.value });
    case 'weather':
      // Weather state now surfaces via the Weather keyword chip — inline description would
      // duplicate the same data.
      return '';
    case 'megaEvolve':
      // Unreachable — `selectCardLines` no longer emits a `megaEvolve` line (the keyword
      // chip carries the full description). Kept as a typesafe branch in case future code
      // pushes one back.
      return '';
    case 'capture':
      return t('cards:lines.capture', { percent: line.percent });
  }
}
