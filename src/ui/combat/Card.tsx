import type { CSSProperties } from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import type { CardDef, CardKind, PokeType } from '@/types';
import { keywordsOf, type Keyword } from '@/data/cards';
import { selectCardLines, type ComputedCardView, type EffectLine } from '@/game/combat/selectors';
import { EnergyBar } from '@/ui/primitives/EnergyBar';
import { cx } from '@/ui/cx';
import styles from './Card.module.css';

/** Energy ceiling visualised on every card; the deck cannot print costs above this. */
const ENERGY_SLOTS = 3;

/**
 * Per-keyword glyph + tint. Icons resolve through the global registry loaded once at
 * startup via `src/ui/icons.ts` — Dinkie Icons for expressive pixel art (fire / blood /
 * biohazard / sparkles / sleeping-face / hourglass), pixelarticons for neutral chips,
 * streamline-pixel for weather glyphs.
 *
 * Colors are picked to clear WCAG AA contrast (≥ 4.5:1) against the white card body.
 */
const KEYWORD_VISUAL: Record<Keyword['id'], { icon: string; color: string }> = {
  exhaust: { icon: 'dinkie-icons:hourglass-with-flowing-sand', color: '#b45309' },
  ephemeral: { icon: 'dinkie-icons:ghost', color: '#6366f1' },
  switch: { icon: 'pixelarticons:switch', color: '#1f2937' },
  stab: { icon: 'dinkie-icons:sparkles', color: '#2563eb' },
  super: { icon: 'pixelarticons:chevron-up', color: '#16a34a' },
  resisted: { icon: 'pixelarticons:shield', color: '#475569' },
  immune: { icon: 'pixelarticons:shield-off', color: '#991b1b' },
  lifesteal: { icon: 'dinkie-icons:drop-of-blood', color: '#991b1b' },
  crit: { icon: 'pixelarticons:bullseye', color: '#b45309' },
  recoil: { icon: 'pixelarticons:undo', color: '#1f2937' },
  burn: { icon: 'dinkie-icons:fire', color: '#e0500f' },
  poison: { icon: 'dinkie-icons:biohazard', color: '#7c3aed' },
  weak: { icon: 'pixelarticons:trending-down', color: '#475569' },
  sleep: { icon: 'dinkie-icons:sleeping-face', color: '#1d4ed8' },
  paralyze: { icon: 'pixelarticons:zap', color: '#a16207' },
  freeze: { icon: 'pixelarticons:cloud', color: '#0e7490' },
  weather: { icon: 'streamline-pixel:weather-cloud-sun-fine', color: '#374151' },
  terrain: { icon: 'dinkie-icons:snow-capped-mountain', color: '#374151' },
};

/**
 * The card's accent color. BALL and ITEM sit outside the 18-type palette (red / amber)
 * so capture and consumable cards read as their own category at a glance; everything
 * else inherits the active Pokémon-type tint.
 */
function tintVar(kind: CardKind, type: PokeType): string {
  if (kind === 'BALL') return 'var(--card-ball)';
  if (kind === 'ITEM') return 'var(--card-item)';
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
  // Density bucket — shrinks font so chip-heavy cards still fit the locked height.
  const totalLines = lines.length + keywords.length;
  const density = totalLines >= 5 ? 'dense' : totalLines >= 3 ? 'mid' : 'normal';
  // Banner density follows title length — long move names (ELECTRIC TERRAIN) drop a step.
  const bannerDensity = name.length >= 14 ? 'dense' : name.length >= 11 ? 'mid' : 'normal';

  return (
    <button
      type="button"
      className={cx(styles.card, !view.affordable && styles.disabled)}
      style={{ '--card-type': tintVar(card.kind, card.type) } as CSSProperties}
      disabled={!view.affordable}
      onClick={onPlay}
    >
      <span className={styles.banner} data-density={bannerDensity}>
        {name}
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
                  <Icon icon={v.icon} className={styles.kwIcon} style={{ color: v.color }} />
                  {keywordLabel(k, t)}
                </span>
              );
            })}
          </span>
        )}
      </div>
      <span className={styles.footer}>
        <EnergyBar
          current={card.cost}
          max={ENERGY_SLOTS}
          ariaLabel={`Cost ${String(card.cost)} of ${String(ENERGY_SLOTS)}`}
        />
        <img
          className={styles.categoryIcon}
          src={`/sprites/move-category/${card.category}.png`}
          alt={card.category}
        />
      </span>
      {keywords.length > 0 && (
        <span className={styles.tooltip} role="tooltip">
          {keywords.map((k, i) => {
            const v = KEYWORD_VISUAL[k.id];
            return (
              <span key={chipKey(k)}>
                {i > 0 && <hr className={styles.tooltipDivider} />}
                <span className={styles.tooltipEntry}>
                  <span className={styles.tooltipLabel}>
                    <Icon icon={v.icon} className={styles.kwIcon} style={{ color: v.color }} />
                    {keywordTooltipName(k, t)}
                  </span>
                  <span className={styles.tooltipDesc}>{keywordTooltipDesc(k, t)}</span>
                </span>
              </span>
            );
          })}
        </span>
      )}
    </button>
  );
}

/** Stable React key per keyword instance (some chips can repeat — e.g. self+foe statuses). */
function chipKey(k: Keyword): string {
  switch (k.id) {
    case 'burn':
    case 'poison':
    case 'weak':
    case 'sleep':
    case 'paralyze':
    case 'freeze':
      return `${k.id}-${k.self ? 'self' : 'foe'}`;
    default:
      return k.id;
  }
}

/**
 * Interpolation params for both the chip label and the tooltip desc lookup. Status
 * keywords also pass `count` so i18next can switch `_one` vs `_other` plural forms
 * (e.g. "1 turn" vs "3 turns" on Sleep).
 */
function keywordParams(k: Keyword): Record<string, number> {
  switch (k.id) {
    case 'lifesteal':
      return { percent: k.percent };
    case 'crit':
      return { boost: k.boost };
    case 'recoil':
      return { percent: k.percent };
    case 'burn':
    case 'poison':
    case 'weak':
    case 'sleep':
    case 'paralyze':
    case 'freeze':
      return { stacks: k.stacks, count: k.stacks };
    case 'weather':
    case 'terrain':
      return { turns: k.turns };
    default:
      return {};
  }
}

function keywordLabel(k: Keyword, t: TFunction): string {
  // Weather + terrain pick a nested sub-key from the kind (sun/rain/sand/hail or
  // electric/grassy/misty/psychic) — one chip per variant, distinct prose per variant.
  if (k.id === 'weather') {
    const name = t(`cards:keyword.weather.kind.${k.weather}.name`);
    return t('cards:keyword.weather.label', { name, turns: k.turns });
  }
  if (k.id === 'terrain') {
    const name = t(`cards:keyword.terrain.kind.${k.terrain}.name`);
    return t('cards:keyword.terrain.label', { name, turns: k.turns });
  }
  return t(`cards:keyword.${k.id}.label`, keywordParams(k));
}

/** Tooltip heading per keyword — weather/terrain show the active kind's specific name. */
function keywordTooltipName(k: Keyword, t: TFunction): string {
  if (k.id === 'weather') return t(`cards:keyword.weather.kind.${k.weather}.name`);
  if (k.id === 'terrain') return t(`cards:keyword.terrain.kind.${k.terrain}.name`);
  return t(`cards:keyword.${k.id}.name`);
}

/** Tooltip body per keyword — weather/terrain show only the active kind's rule. */
function keywordTooltipDesc(k: Keyword, t: TFunction): string {
  if (k.id === 'weather') return t(`cards:keyword.weather.kind.${k.weather}.desc`);
  if (k.id === 'terrain') return t(`cards:keyword.terrain.kind.${k.terrain}.desc`);
  return t(`cards:keyword.${k.id}.desc`, keywordParams(k));
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
    case 'capture':
      return t('cards:lines.capture', { percent: line.percent });
  }
}
