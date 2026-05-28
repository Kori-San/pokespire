import type { CardDef, CombatState, StatusId, WeatherKind } from '@/types';
import { CARDS } from '@/data/cards';
import { calcCaptureChance } from './capture';
import { calcDamage, type DamageBreakdown } from './damage';

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
      effectiveness: effectivenessOf(breakdown),
      stab: breakdown.stab > 1,
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

/** Structured description line for a card effect — translated at the UI layer (no strings here). */
export type EffectLine =
  | { kind: 'damage'; value: number }
  | { kind: 'block'; value: number }
  | { kind: 'heal'; value: number }
  | { kind: 'draw'; count: number }
  | { kind: 'applyStatus'; status: StatusId; stacks: number; self: boolean }
  | { kind: 'energy'; value: number }
  | { kind: 'weather'; weather: WeatherKind }
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
      case 'energy':
        lines.push({ kind: 'energy', value: e.amount });
        break;
      case 'weather':
        lines.push({ kind: 'weather', weather: e.weather });
        break;
      case 'capture':
        lines.push({ kind: 'capture', percent: view.capturePercent ?? 0 });
        break;
    }
  }
  return lines;
}
