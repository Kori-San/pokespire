import type { CardDef, Combatant, CombatState, Effect, StatStages } from '@/types';
import { critChance, CRIT_MULTIPLIER } from '@/types';
import { applyStatus } from '@/data/statuses';
import { calcCaptureChance, rollCapture } from './capture';
import { calcDamage } from './damage';
import { drawCards } from './deck';

const STAGE_MIN = -6;
const STAGE_MAX = 6;

function bumpStage(stages: StatStages, stat: keyof StatStages, delta: number): StatStages {
  const next = Math.max(STAGE_MIN, Math.min(STAGE_MAX, stages[stat] + delta));
  return { ...stages, [stat]: next };
}

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
      const attacker = activeOf(state);
      const { final } = calcDamage({
        amount: effect.amount,
        cardType: card.type,
        category: card.category,
        attacker,
        defender: state.enemy,
        weather: state.weather,
      });
      const crit = rng() < critChance(attacker.stages.crit);
      const dealt = crit ? Math.round(final * CRIT_MULTIPLIER) : final;
      const absorbed = Math.min(state.enemy.block, dealt);
      const hp = Math.max(0, state.enemy.hp - (dealt - absorbed));
      const enemy = { ...state.enemy, block: state.enemy.block - absorbed, hp };
      return { ...state, enemy, outcome: hp <= 0 ? 'win' : state.outcome };
    }
    case 'lifesteal': {
      const attacker = activeOf(state);
      const { final } = calcDamage({
        amount: effect.amount,
        cardType: card.type,
        category: card.category,
        attacker,
        defender: state.enemy,
        weather: state.weather,
      });
      const crit = rng() < critChance(attacker.stages.crit);
      const dealt = crit ? Math.round(final * CRIT_MULTIPLIER) : final;
      const absorbed = Math.min(state.enemy.block, dealt);
      const hp = Math.max(0, state.enemy.hp - (dealt - absorbed));
      const enemy = { ...state.enemy, block: state.enemy.block - absorbed, hp };
      // Heal scales with the rolled `dealt` so STAB / super-effective / crit all amplify the
      // restoration too. Block still trims HP damage but not the heal, by design.
      const healed = Math.round((dealt * effect.percent) / 100);
      const healedAttacker = {
        ...attacker,
        hp: Math.min(attacker.maxHp, attacker.hp + healed),
      };
      const stepped: CombatState = {
        ...state,
        enemy,
        outcome: hp <= 0 ? 'win' : state.outcome,
      };
      return setActive(stepped, healedAttacker);
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
    case 'stat': {
      if (effect.target === 'self') {
        const a = activeOf(state);
        return setActive(state, { ...a, stages: bumpStage(a.stages, effect.stat, effect.stages) });
      }
      return {
        ...state,
        enemy: {
          ...state.enemy,
          stages: bumpStage(state.enemy.stages, effect.stat, effect.stages),
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
