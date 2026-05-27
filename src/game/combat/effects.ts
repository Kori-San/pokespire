import type { CardDef, Combatant, CombatState, Effect } from '@/types';
import { applyStatus } from '@/data/statuses';
import { calcCaptureChance, rollCapture } from './capture';
import { calcDamage } from './damage';
import { drawCards } from './deck';

function activeOf(state: CombatState): Combatant {
  const mon = state.team[state.activeIndex];
  if (!mon) throw new Error('No active combatant');
  return mon;
}

function setActive(state: CombatState, next: Combatant): CombatState {
  return {
    ...state,
    team: state.team.map((mon, i) => (i === state.activeIndex ? next : mon)),
  };
}

/**
 * Apply a single card effect to the combat state. Pure — returns a new state. The reducer
 * pays energy, iterates `card.effects`, then resolves discard/turn flow around this.
 */
export function applyEffect(
  state: CombatState,
  effect: Effect,
  card: CardDef,
  rng: () => number,
): CombatState {
  switch (effect.kind) {
    case 'damage': {
      const { final } = calcDamage({
        amount: effect.amount,
        cardType: card.type,
        attacker: activeOf(state),
        defender: state.enemy,
        weather: state.weather,
      });
      const absorbed = Math.min(state.enemy.block, final);
      const hp = Math.max(0, state.enemy.hp - (final - absorbed));
      const enemy = { ...state.enemy, block: state.enemy.block - absorbed, hp };
      return { ...state, enemy, outcome: hp <= 0 ? 'win' : state.outcome };
    }
    case 'block': {
      const a = activeOf(state);
      return setActive(state, { ...a, block: a.block + effect.amount });
    }
    case 'heal': {
      const a = activeOf(state);
      return setActive(state, { ...a, hp: Math.min(a.maxHp, a.hp + effect.amount) });
    }
    case 'draw': {
      const piles = drawCards(
        { draw: state.draw, hand: state.hand, discard: state.discard },
        effect.count,
        rng,
      );
      return { ...state, ...piles };
    }
    case 'applyStatus': {
      if (effect.target === 'self') {
        const a = activeOf(state);
        return setActive(state, {
          ...a,
          statuses: applyStatus(a.statuses, effect.status, effect.stacks),
        });
      }
      return {
        ...state,
        enemy: {
          ...state.enemy,
          statuses: applyStatus(state.enemy.statuses, effect.status, effect.stacks),
        },
      };
    }
    case 'energy': {
      if (effect.when === 'now') return { ...state, energy: state.energy + effect.amount };
      return state;
    }
    case 'weather': {
      return { ...state, weather: { kind: effect.weather, turnsLeft: effect.turns } };
    }
    case 'capture': {
      const chance = calcCaptureChance({
        hp: state.enemy.hp,
        maxHp: state.enemy.maxHp,
        ballTier: effect.ballTier,
        catchRate: state.enemy.catchRate,
        shiny: state.enemy.shiny,
      });
      return rollCapture(chance, rng) ? { ...state, outcome: 'captured' } : state;
    }
  }
}
