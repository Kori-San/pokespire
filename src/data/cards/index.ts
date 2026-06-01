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
import { SPECIAL_CARDS } from './special';
import { MAX_CARDS } from './maxMoves';
import { GMAX_CARDS } from './gmaxMoves';
import { TERA_CARDS } from './teraCrystals';

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
    ...SPECIAL_CARDS,
    ...TERA_CARDS,
    // Synthetic Max / G-Max cards — never in reward pools or starter decks, but
    // registered here so the reducer / selectors can resolve their ids when the active
    // mon is dynamaxed and `effectiveCardFor` swaps in the Max equivalent.
    ...MAX_CARDS,
    ...GMAX_CARDS,
  ].map((c) => [c.id, c]),
);

/**
 * True when a card should leave for the exhaust pile on play (StS-style one-shot per
 * combat). Now driven entirely by the per-card `exhaust` flag — the kind-based routing
 * (BALL / ITEM) went away with the inventory redesign.
 */
export function exhaustsOnPlay(card: CardDef): boolean {
  return card.exhaust === true;
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
  | { id: 'megaEvolve' }
  | { id: 'dynamax' }
  | { id: 'tera' }
  | { id: 'stab' }
  | { id: 'super' }
  | { id: 'resisted' }
  | { id: 'immune' }
  | { id: 'priority'; level: number }
  | { id: 'lifesteal'; percent: number }
  | { id: 'crit'; boost: number }
  | { id: 'recoil'; percent: number }
  | { id: 'recharge' }
  | { id: 'multihit'; hits: number }
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

  // 1) Card-defining mechanics first — these chips ARE the card (Mega Evolve, Dynamax,
  //    Terastallize). Player should see them at a glance before scanning meta tags.
  for (const e of card.effects) {
    if (e.kind === 'megaEvolve') k.push({ id: 'megaEvolve' });
    if (e.kind === 'dynamax') k.push({ id: 'dynamax' });
    if (e.kind === 'terastallize') k.push({ id: 'tera' });
  }

  // 2) Canon move priority — turn-order signal sits up top so it reads before secondary chips.
  if (card.priority && card.priority !== 0) k.push({ id: 'priority', level: card.priority });

  // 3) Matchup chips — situational signals derived from the live view.
  if (ctx.stab) k.push({ id: 'stab' });
  if (ctx.effectiveness === 'super') k.push({ id: 'super' });
  else if (ctx.effectiveness === 'resisted') k.push({ id: 'resisted' });
  else if (ctx.effectiveness === 'immune') k.push({ id: 'immune' });

  // 4) Effect riders — secondary mechanics surfaced from the card's effects.
  for (const e of card.effects) {
    if ((e.kind === 'damage' || e.kind === 'lifesteal') && e.critBoost) {
      k.push({ id: 'crit', boost: e.critBoost });
    }
    if ((e.kind === 'damage' || e.kind === 'lifesteal') && e.recoilPercent) {
      k.push({ id: 'recoil', percent: e.recoilPercent });
    }
    // Multi-hit canon moves (Double Kick = 2, Triple Axel = 3, Bullet Seed = 3 …) and
    // Recharge (Hyper Beam / Giga Impact / Blast Burn) are damage-effect riders, so
    // their chips only surface on `damage` effects.
    if (e.kind === 'damage' && e.hits && e.hits > 1) {
      k.push({ id: 'multihit', hits: e.hits });
    }
    if (e.kind === 'damage' && e.recharge && e.recharge > 0) {
      k.push({ id: 'recharge' });
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

  // 5) Meta tags last — Exhaust / Ephemeral describe what happens to the card AFTER play.
  //    Ephemeral subsumes exhaust (gone-forever > gone-this-combat) so we only emit one.
  if (isEphemeral(card)) k.push({ id: 'ephemeral' });
  else if (exhaustsOnPlay(card)) k.push({ id: 'exhaust' });

  return k;
}

/**
 * StS-style **keyword cross-references**: when a keyword's description body mentions
 * another keyword (e.g. Tera's desc references STAB), this table pulls that second
 * keyword's full definition into the card's tooltip glossary too — the player gets
 * the chained explanation without leaving the hover.
 *
 * Restricted to **parameterless** keyword ids so the renderer can construct each
 * referenced `Keyword` from just the id. Status / priority / lifesteal-style
 * keywords carry per-instance numbers and aren't safe to reference this way.
 */
export type ReferenceableKeyword =
  | 'exhaust'
  | 'ephemeral'
  | 'switch'
  | 'megaEvolve'
  | 'dynamax'
  | 'tera'
  | 'stab'
  | 'super'
  | 'resisted'
  | 'immune'
  | 'recharge';

export const KEYWORD_REFS: Partial<Record<Keyword['id'], readonly ReferenceableKeyword[]>> = {
  // Tera's desc mentions STAB — so hovering a Tera card also surfaces the STAB rule
  // (the player learns Tera's Tera-Boost interaction without needing a second hover).
  tera: ['stab'],
};

/**
 * The full keyword list for the **tooltip glossary** — the body chips from `keywordsOf`
 * plus their referenced keywords (deduped). Body chips render unchanged via `keywordsOf`;
 * this function only adds entries to the right-side glossary stack.
 */
export function tooltipKeywordsOf(card: CardDef, ctx: KeywordContext = {}): Keyword[] {
  const base = keywordsOf(card, ctx);
  // Interleave each keyword's cross-refs immediately after it, so the referenced
  // keyword sits next to the parent that mentions it (Tera → STAB → … → Exhaust).
  // Dedup via the running `seen` set so the same ref doesn't surface twice.
  const out: Keyword[] = [];
  const seen = new Set<string>();
  for (const k of base) {
    if (!seen.has(k.id)) {
      out.push(k);
      seen.add(k.id);
    }
    for (const refId of KEYWORD_REFS[k.id] ?? []) {
      if (seen.has(refId)) continue;
      seen.add(refId);
      out.push({ id: refId });
    }
  }
  return out;
}

/**
 * The opening deck for every run until Phase 3 replaces this with a per-species starter
 * DSL (see [planning/05_inventory-redesign.md]). Captures now live in the trainer's
 * inventory (`RunState.inventory.balls`), so the deck is moves-only — Phase 2 drops the
 * `pokeBall` line that used to seed every deck with a capture card.
 */
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
];
