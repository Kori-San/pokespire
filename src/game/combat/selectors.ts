import type { CardDef, Combatant, CombatState, Stat, StatusId, WeatherKind } from '@/types';
import { activeEnemyOf } from '@/types';
import { CARDS } from '@/data/cards';
import { MAX_GUARD, MAX_MOVES } from '@/data/cards/maxMoves';
import { GMAX_MOVES } from '@/data/cards/gmaxMoves';
import { calcCaptureChance } from './capture';
import { calcDamage, type DamageBreakdown } from './damage';
import { hasMegaForm } from './effects';

/**
 * The card a Pokémon ACTUALLY plays in the current state. While the active mon is
 * dynamaxed, every hand card maps to its Max equivalent:
 *   - ATKs match-typed to the species' G-Max signature (if the species has one) → G-Max card
 *   - All other ATKs → `MAX_MOVES[card.type]`
 *   - SKL / PWR → `MAX_GUARD`
 * When the active mon isn't dynamaxed, the card passes through unchanged. The Dynamax
 * card itself is never mapped (you play it once to enter the state).
 */
export function effectiveCardFor(card: CardDef, active: Combatant): CardDef {
  if (!active.dynamax) return card;
  // The Dynamax card itself stays as-is — it's how the state was entered.
  if (card.effects.some((e) => e.kind === 'dynamax')) return card;
  // G-Max signature: replaces match-type ATKs for the base species.
  const gmax = GMAX_MOVES[active.dynamax.prevSlug];
  if (gmax && card.kind === 'ATK' && card.type === gmax.matchType) return gmax.card;
  // Generic Max moves.
  if (card.kind === 'ATK') return MAX_MOVES[card.type];
  if (card.kind === 'SKL' || card.kind === 'PWR') return MAX_GUARD;
  return card;
}

/** Type-effectiveness magnitude — drives the damage number's color/vibe. Independent of STAB. */
export type Effectiveness = 'super' | 'neutral' | 'resisted' | 'immune';

export interface ComputedDamage {
  value: number;
  effectiveness: Effectiveness;
  /** Same-Type Attack Bonus active — drives the card's reinforced type border. */
  stab: boolean;
  tooltip: string;
}

export interface ComputedCardView {
  cardId: string;
  cost: number;
  affordable: boolean;
  damage?: ComputedDamage;
  capturePercent?: number;
}

function effectivenessOf(b: DamageBreakdown): Effectiveness {
  if (b.immune) return 'immune';
  if (b.rawEff >= 2) return 'super';
  if (b.rawEff < 1) return 'resisted';
  return 'neutral';
}

function buildTooltip(b: DamageBreakdown): string {
  const parts = [`${b.base} base`];
  if (b.stab !== 1) parts.push(`×${b.stab} STAB`);
  parts.push(`×${b.rawEff} type`);
  if (b.weatherMod !== 1) parts.push(`×${b.weatherMod} weather`);
  if (b.weakMod !== 1) parts.push(`×${b.weakMod} WEAK`);
  parts.push(`×${b.levelScale.toFixed(2)} lvl`);
  parts.push(`×${b.atkScale.toFixed(2)} atk`);
  parts.push(`×${b.defScale.toFixed(2)} def`);
  return `${parts.join(' ')} = ${b.final}`;
}

/**
 * Live view of a hand card for the current matchup: affordability, the computed damage
 * (value + effectiveness tier + breakdown tooltip), and/or capture %. Recompute whenever
 * the active mon, enemy, weather, or statuses change.
 */
export function selectComputedCardView(
  state: CombatState,
  handIndex: number,
): ComputedCardView | null {
  const id = state.hand[handIndex];
  if (id === undefined) return null;
  const rawCard = CARDS[id];
  const attacker = state.team[state.activeIndex];
  if (!rawCard || !attacker) return null;
  // Dynamax substitutes the hand card with its Max / G-Max equivalent. Every downstream
  // step (cost, damage preview, affordability, keyword chips, description lines) reads
  // from the effective card so the UI accurately reflects what will actually play.
  const card = effectiveCardFor(rawCard, attacker);

  // Recharge (Hyper-Beam-style): per-mon counter locks ATK cards while > 0. Status /
  // Ball / Item plays still work. Folds into `affordable: false` so the UI greys ATK
  // cards out the same way an unpayable cost would.
  const rechargeBlocksAttack = attacker.recharge > 0 && card.kind === 'ATK';
  // Mega Evolution is gated on the active mon having a canonical Mega forme — a Pikachu
  // can't mega-evolve, so the card greys out the same way an unpayable cost would.
  const megaBlocked =
    card.effects.some((e) => e.kind === 'megaEvolve') && !hasMegaForm(attacker.speciesSlug);
  // Dynamax greys out when the active mon is already dynamaxed — once-per-battle is
  // enforced by `exhaust: true` on the card AND by this affordability check (in case the
  // player owns more than one Dynamax card via a relic).
  const dynamaxBlocked =
    card.effects.some((e) => e.kind === 'dynamax') && Boolean(attacker.dynamax);
  const view: ComputedCardView = {
    // The effective card's id — the Hand renders `CARDS[view.cardId]`, so during a
    // dynamax window it'll show the Max / G-Max card name + theme + chips while the
    // underlying `state.hand[handIndex]` still holds the raw id (so the original card
    // returns to the deck after revert).
    cardId: card.id,
    cost: card.cost,
    affordable:
      state.energy >= card.cost && !rechargeBlocksAttack && !megaBlocked && !dynamaxBlocked,
  };

  // Default target for live preview: the foe currently in front. C5 will let cards target
  // other foes explicitly; for now the preview always reflects the active enemy.
  const defender = activeEnemyOf(state);

  // Both `damage` and `lifesteal` go through the same formula for live display — find
  // either, pick the first one (cards in our pool only ever have one damage-shaped effect).
  const dmg = card.effects.find((e) => e.kind === 'damage' || e.kind === 'lifesteal');
  if (dmg) {
    const breakdown = calcDamage({
      amount: dmg.amount,
      cardType: card.type,
      category: card.category,
      attacker,
      defender,
      weather: state.weather,
    });
    view.damage = {
      value: breakdown.final,
      effectiveness: effectivenessOf(breakdown),
      stab: breakdown.stab > 1,
      tooltip: buildTooltip(breakdown),
    };
  }

  const cap = card.effects.find((e) => e.kind === 'capture');
  if (cap?.kind === 'capture') {
    view.capturePercent = Math.round(
      calcCaptureChance({
        hp: defender.hp,
        maxHp: defender.maxHp,
        ballTier: cap.ballTier,
        catchRate: defender.catchRate,
        shiny: defender.shiny,
      }) * 100,
    );
  }

  return view;
}

/** Computed views for every card in hand (index-aligned). */
export function selectHandViews(state: CombatState): ComputedCardView[] {
  return state.hand.map((_, i) => selectComputedCardView(state, i)).filter((v) => v !== null);
}

/** Structured description line for a card effect — translated at the UI layer (no strings here). */
export type EffectLine =
  | { kind: 'damage'; value: number }
  | { kind: 'lifesteal'; value: number; heal: number; percent: number }
  | { kind: 'block'; value: number }
  | { kind: 'heal'; value: number }
  | { kind: 'draw'; count: number }
  | { kind: 'applyStatus'; status: StatusId; stacks: number; self: boolean }
  | { kind: 'stat'; stat: Stat; stages: number; self: boolean }
  | { kind: 'energy'; value: number }
  | { kind: 'weather'; weather: WeatherKind }
  | { kind: 'megaEvolve' }
  | { kind: 'capture'; percent: number };

/**
 * Description descriptors for a card's effects, with **live computed** values pulled from
 * the view (damage value, capture %). Pure — no i18n. The UI layer translates each line
 * via `react-i18next` so the text matches the active language; see Card.tsx.
 */
export function selectCardLines(card: CardDef, view: ComputedCardView): EffectLine[] {
  const lines: EffectLine[] = [];
  for (const e of card.effects) {
    switch (e.kind) {
      case 'damage':
        lines.push({ kind: 'damage', value: view.damage?.value ?? e.amount });
        break;
      case 'lifesteal': {
        const value = view.damage?.value ?? e.amount;
        const heal = Math.round((value * e.percent) / 100);
        lines.push({ kind: 'lifesteal', value, heal, percent: e.percent });
        break;
      }
      case 'block':
        lines.push({ kind: 'block', value: e.amount });
        break;
      case 'heal':
        lines.push({ kind: 'heal', value: e.amount });
        break;
      case 'draw':
        lines.push({ kind: 'draw', count: e.count });
        break;
      case 'applyStatus':
        lines.push({
          kind: 'applyStatus',
          status: e.status,
          stacks: e.stacks,
          self: e.target === 'self',
        });
        break;
      case 'stat':
        lines.push({
          kind: 'stat',
          stat: e.stat,
          stages: e.stages,
          self: e.target === 'self',
        });
        break;
      case 'energy':
        lines.push({ kind: 'energy', value: e.amount });
        break;
      case 'weather':
        lines.push({ kind: 'weather', weather: e.weather });
        break;
      case 'megaEvolve':
        // The Mega Evolve keyword chip below covers this completely — no inline
        // description line so we don't duplicate "Méga-Évolue. / Méga-Évolue." in
        // the body.
        break;
      case 'capture':
        lines.push({ kind: 'capture', percent: view.capturePercent ?? 0 });
        break;
    }
  }
  return lines;
}
