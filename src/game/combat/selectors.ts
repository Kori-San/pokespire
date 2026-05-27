import type { CombatState } from '@/types';
import { CARDS } from '@/data/cards';
import { calcCaptureChance } from './capture';
import { calcDamage, type DamageBreakdown } from './damage';

export type EffectivenessTier = 'super' | 'stab' | 'neutral' | 'resisted' | 'immune';

export interface ComputedDamage {
  value: number;
  tier: EffectivenessTier;
  tooltip: string;
}

export interface ComputedCardView {
  cardId: string;
  cost: number;
  affordable: boolean;
  damage?: ComputedDamage;
  capturePercent?: number;
}

function tierOf(b: DamageBreakdown): EffectivenessTier {
  if (b.immune) return 'immune';
  if (b.rawEff >= 2) return 'super';
  if (b.rawEff < 1) return 'resisted';
  return b.stab > 1 ? 'stab' : 'neutral';
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
  const card = CARDS[id];
  const attacker = state.team[state.activeIndex];
  if (!card || !attacker) return null;

  const view: ComputedCardView = {
    cardId: id,
    cost: card.cost,
    affordable: state.energy >= card.cost,
  };

  const dmg = card.effects.find((e) => e.kind === 'damage');
  if (dmg?.kind === 'damage') {
    const breakdown = calcDamage({
      amount: dmg.amount,
      cardType: card.type,
      attacker,
      defender: state.enemy,
      weather: state.weather,
    });
    view.damage = {
      value: breakdown.final,
      tier: tierOf(breakdown),
      tooltip: buildTooltip(breakdown),
    };
  }

  const cap = card.effects.find((e) => e.kind === 'capture');
  if (cap?.kind === 'capture') {
    view.capturePercent = Math.round(
      calcCaptureChance({
        hp: state.enemy.hp,
        maxHp: state.enemy.maxHp,
        ballTier: cap.ballTier,
        catchRate: state.enemy.catchRate,
        shiny: state.enemy.shiny,
      }) * 100,
    );
  }

  return view;
}

/** Computed views for every card in hand (index-aligned). */
export function selectHandViews(state: CombatState): ComputedCardView[] {
  return state.hand.map((_, i) => selectComputedCardView(state, i)).filter((v) => v !== null);
}
