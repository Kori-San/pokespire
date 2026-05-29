import type { CardDef } from '@/types';
import { NORMAL_CARDS } from './normal';
import { FIRE_CARDS } from './fire';
import { WATER_CARDS } from './water';
import { GRASS_CARDS } from './grass';
import { ELECTRIC_CARDS } from './electric';
import { ICE_CARDS } from './ice';
import { FIGHTING_CARDS } from './fighting';
import { POISON_CARDS } from './poison';
import { GROUND_CARDS } from './ground';
import { FLYING_CARDS } from './flying';
import { PSYCHIC_CARDS } from './psychic';
import { BUG_CARDS } from './bug';
import { ROCK_CARDS } from './rock';
import { GHOST_CARDS } from './ghost';
import { DRAGON_CARDS } from './dragon';
import { DARK_CARDS } from './dark';
import { STEEL_CARDS } from './steel';
import { FAIRY_CARDS } from './fairy';
import { BALL_CARDS } from './balls';
import { ITEM_CARDS } from './items';

/**
 * The whole pool, indexed by card id. Per-type files are the source of truth;
 * this module just merges them so consumers can look up `CARDS[id]` without
 * caring which file a card lives in. See [wiki/cards.md](../../../wiki/cards.md).
 *
 * Type-flavored cards (ATK/SKL/PWR) live in `<type>.ts`. BALL and ITEM kinds
 * have their own files since they don't belong to a Pokémon type.
 */
export const CARDS: Record<string, CardDef> = Object.fromEntries(
  [
    ...NORMAL_CARDS,
    ...FIRE_CARDS,
    ...WATER_CARDS,
    ...GRASS_CARDS,
    ...ELECTRIC_CARDS,
    ...ICE_CARDS,
    ...FIGHTING_CARDS,
    ...POISON_CARDS,
    ...GROUND_CARDS,
    ...FLYING_CARDS,
    ...PSYCHIC_CARDS,
    ...BUG_CARDS,
    ...ROCK_CARDS,
    ...GHOST_CARDS,
    ...DRAGON_CARDS,
    ...DARK_CARDS,
    ...STEEL_CARDS,
    ...FAIRY_CARDS,
    ...BALL_CARDS,
    ...ITEM_CARDS,
  ].map((c) => [c.id, c]),
);

/**
 * Cards that leave for the exhaust pile when played (StS-style one-shot per combat).
 * Source of truth for both the reducer's routing AND the card UI's `(Exhausts.)` tag —
 * keep them in sync.
 */
const EXHAUST_KINDS = new Set<CardDef['kind']>(['BALL', 'ITEM']);

/** True when a card should leave for the exhaust pile on play instead of the discard. */
export function exhaustsOnPlay(card: CardDef): boolean {
  return EXHAUST_KINDS.has(card.kind);
}

/** True when the card vanishes from the RUN's deck after use (one-shot-per-run). */
export function isEphemeral(card: CardDef): boolean {
  return card.ephemeral === true;
}

/**
 * Glossary tags surfaced on the card body and explained in the on-hover tooltip. Each
 * variant carries its own parameters so the chip can print live values (`Burn 2`,
 * `Lifesteal 75%`, `Crit +2`, `Recoil 33%`). Adding a new keyword: extend the union,
 * derive it in `keywordsOf`, add the icon to `KEYWORD_ICONS` in Card.tsx, and add the
 * `cards:keyword.<id>.{label,desc}` locale entries.
 */
import type { TerrainKind, WeatherKind } from '@/types';

export type Keyword =
  | { id: 'exhaust' }
  | { id: 'ephemeral' }
  | { id: 'switch' }
  | { id: 'stab' }
  | { id: 'super' }
  | { id: 'resisted' }
  | { id: 'immune' }
  | { id: 'lifesteal'; percent: number }
  | { id: 'crit'; boost: number }
  | { id: 'recoil'; percent: number }
  | { id: 'burn'; stacks: number; self: boolean }
  | { id: 'poison'; stacks: number; self: boolean }
  | { id: 'weak'; stacks: number; self: boolean }
  | { id: 'sleep'; stacks: number; self: boolean }
  | { id: 'paralyze'; stacks: number; self: boolean }
  | { id: 'freeze'; stacks: number; self: boolean }
  | { id: 'weather'; weather: WeatherKind; turns: number }
  | { id: 'terrain'; terrain: TerrainKind; turns: number };

/**
 * View-derived signals the UI passes to `keywordsOf` so STAB and the type-effectiveness
 * tiers can surface as keyword chips alongside per-card mechanics. Caller can omit it
 * for static gallery rendering — no STAB / effectiveness chip will appear in that case.
 */
export interface KeywordContext {
  stab?: boolean;
  effectiveness?: 'super' | 'neutral' | 'resisted' | 'immune';
}

/** Keywords that apply to `card`, in render order. */
export function keywordsOf(card: CardDef, ctx: KeywordContext = {}): Keyword[] {
  const k: Keyword[] = [];

  // Ephemeral subsumes exhaust — gone-forever is strictly stronger than gone-this-combat,
  // so we don't double up the chips on Master Ball / Max Potion.
  if (isEphemeral(card)) k.push({ id: 'ephemeral' });
  else if (exhaustsOnPlay(card)) k.push({ id: 'exhaust' });

  if (ctx.stab) k.push({ id: 'stab' });
  if (ctx.effectiveness === 'super') k.push({ id: 'super' });
  else if (ctx.effectiveness === 'resisted') k.push({ id: 'resisted' });
  else if (ctx.effectiveness === 'immune') k.push({ id: 'immune' });

  for (const e of card.effects) {
    if ((e.kind === 'damage' || e.kind === 'lifesteal') && e.critBoost) {
      k.push({ id: 'crit', boost: e.critBoost });
    }
    if ((e.kind === 'damage' || e.kind === 'lifesteal') && e.recoilPercent) {
      k.push({ id: 'recoil', percent: e.recoilPercent });
    }
    if (e.kind === 'lifesteal') k.push({ id: 'lifesteal', percent: e.percent });
    if (e.kind === 'freeSwitch') k.push({ id: 'switch' });
    if (e.kind === 'weather') k.push({ id: 'weather', weather: e.weather, turns: e.turns });
    if (e.kind === 'terrain') k.push({ id: 'terrain', terrain: e.terrain, turns: e.turns });
    if (e.kind === 'applyStatus') {
      k.push({
        id: e.status,
        stacks: e.stacks,
        self: e.target === 'self',
      });
    }
  }

  return k;
}

/** The universal opening deck — same for every starter, spanning multiple types. */
export const STARTER_DECK: string[] = [
  'tackle',
  'tackle',
  'quickAttack',
  'ember',
  'waterGun',
  'vineWhip',
  'thunderShock',
  'harden',
  'growl',
  'focusEnergy',
  'pokeBall',
];
