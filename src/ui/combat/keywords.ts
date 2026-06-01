import type { TFunction } from 'i18next';
import type { Keyword } from '@/data/cards';

/**
 * Per-keyword glyph. Two flavours:
 *   - `{ icon, color }` — Iconify glyph (pixelarticons / dinkie-icons / streamline-pixel /
 *     `local:*`) tinted via `currentColor`. The default for monochrome chips.
 *   - `{ image }` — local PNG path (e.g. `/sprites/misc/mega.png`), painted as an `<img>`.
 *     Reserved for canonical multi-colour glyphs that don't translate to monochrome (the
 *     Mega Evolution mark, future Dynamax / Tera marks).
 *
 * Icons resolve through the global registry loaded once at startup via `src/ui/icons.ts`.
 * Shared across Card chips, PokemonSlot status chips, and the standalone KeywordChip.
 */
export type KeywordVisual = { icon: string; color: string } | { image: string };

export const KEYWORD_VISUAL: Record<Keyword['id'], KeywordVisual> = {
  exhaust: { icon: 'dinkie-icons:hourglass-with-flowing-sand', color: '#b45309' },
  ephemeral: { icon: 'dinkie-icons:ghost', color: '#6366f1' },
  switch: { icon: 'pixelarticons:switch', color: '#1f2937' },
  priority: { icon: 'pixelarticons:speed-fast', color: '#dc2626' },
  stab: { icon: 'dinkie-icons:sparkles', color: '#2563eb' },
  // Canonical Pokémon type-effectiveness iconography: ◎ for super effective, △ for
  // not very effective, ✕ for no effect.
  super: { icon: 'pixelarticons:bullseye', color: '#16a34a' },
  resisted: { icon: 'local:triangle-up', color: '#475569' },
  immune: { icon: 'pixelarticons:close', color: '#991b1b' },
  lifesteal: { icon: 'dinkie-icons:drop-of-blood', color: '#991b1b' },
  crit: { icon: 'pixelarticons:bullseye-arrow', color: '#b45309' },
  recoil: { icon: 'pixelarticons:undo', color: '#1f2937' },
  recharge: { icon: 'pixelarticons:battery-charging', color: '#475569' },
  multihit: { icon: 'pixelarticons:layers', color: '#0d9488' },
  burn: { icon: 'dinkie-icons:fire', color: '#e0500f' },
  poison: { icon: 'dinkie-icons:biohazard', color: '#7c3aed' },
  weak: { icon: 'pixelarticons:trending-down', color: '#475569' },
  sleep: { icon: 'dinkie-icons:sleeping-face', color: '#1d4ed8' },
  paralyze: { icon: 'pixelarticons:zap', color: '#a16207' },
  freeze: { icon: 'pixelarticons:cloud', color: '#0e7490' },
  weather: { icon: 'streamline-pixel:weather-cloud-sun-fine', color: '#374151' },
  terrain: { icon: 'dinkie-icons:snow-capped-mountain', color: '#374151' },
  // Canonical Mega Evolution mark from Pokémon Showdown's misc sprite bucket — the
  // multi-colour swirl reads as "mega" instantly to anyone who's seen Gen-VI canon, no
  // monochrome substitute does it justice. Source: see ASSETS.md.
  megaEvolve: { image: '/sprites/misc/mega.png' },
  // Canon Gen-VIII Dynamax mark — reworked from Cobblemon's battle-gimmick-max sprite.
  // Pink starburst silhouette; the colour identity carries Dynamax instantly.
  dynamax: { image: '/sprites/misc/dmax.png' },
};

/** Stable React key per keyword instance (some chips can repeat — e.g. self+foe statuses). */
export function chipKey(k: Keyword): string {
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
export function keywordParams(k: Keyword): Record<string, number> {
  switch (k.id) {
    case 'lifesteal':
      return { percent: k.percent };
    case 'crit':
      return { boost: k.boost };
    case 'recoil':
      return { percent: k.percent };
    case 'priority':
      return { level: k.level };
    case 'multihit':
      return { hits: k.hits, count: k.hits };
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

export function keywordLabel(k: Keyword, t: TFunction): string {
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
export function keywordTooltipName(k: Keyword, t: TFunction): string {
  if (k.id === 'weather') return t(`cards:keyword.weather.kind.${k.weather}.name`);
  if (k.id === 'terrain') return t(`cards:keyword.terrain.kind.${k.terrain}.name`);
  return t(`cards:keyword.${k.id}.name`);
}

/** Tooltip body per keyword — weather/terrain show only the active kind's rule. */
export function keywordTooltipDesc(k: Keyword, t: TFunction): string {
  if (k.id === 'weather') return t(`cards:keyword.weather.kind.${k.weather}.desc`);
  if (k.id === 'terrain') return t(`cards:keyword.terrain.kind.${k.terrain}.desc`);
  return t(`cards:keyword.${k.id}.desc`, keywordParams(k));
}
