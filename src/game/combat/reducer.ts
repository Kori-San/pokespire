import type { CombatAction, Combatant, CombatState } from '@/types';
import { EMPTY_STAGES, effectiveSpeed, isIncapacitated } from '@/types';
import { CARDS, exhaustsOnPlay } from '@/data/cards';
import { applyStatus } from '@/data/statuses';
import { rngFrom, type SeededRng } from '@/game/run/rng';
import { applyEffect } from './effects';
import { drawCards, shuffle } from './deck';
import { rollIntent } from './intent';
import { tickStatuses } from './statusTick';

export const HAND_SIZE = 5;
export const START_ENERGY = 3;
export const SWITCH_COST = 1;

function activeOf(state: CombatState): Combatant {
  const mon = state.team[state.activeIndex];
  if (!mon) throw new Error('No active combatant');
  return mon;
}

function setActiveMon(state: CombatState, next: Combatant): CombatState {
  return {
    ...state,
    team: state.team.map((mon, i) => (i === state.activeIndex ? next : mon)),
  };
}

export interface CreateCombatOptions {
  team: Combatant[];
  enemy: Combatant;
  deck: string[];
  seed: number;
}

/** Build a fresh combat: shuffle the deck, draw the opening hand, roll the first intent. */
export function createCombat(opts: CreateCombatOptions): CombatState {
  const rng = rngFrom(opts.seed);
  const shuffled = shuffle(opts.deck, rng.next);
  const piles = drawCards({ draw: shuffled, hand: [], discard: [] }, HAND_SIZE, rng.next);
  const fresh: CombatState = {
    team: opts.team,
    activeIndex: 0,
    enemy: opts.enemy,
    enemyIntent: rollIntent(opts.enemy, rng.next),
    energy: START_ENERGY,
    maxEnergy: START_ENERGY,
    hand: piles.hand,
    draw: piles.draw,
    discard: piles.discard,
    exhaust: [],
    turn: 1,
    weather: null,
    rngState: rng.state,
    outcome: 'ongoing',
    enemyActed: false,
    freeSwitch: false,
    log: [],
  };
  return maybeEnemyGoesFirst(fresh, rng);
}

export function combatReducer(state: CombatState, action: CombatAction): CombatState {
  if (state.outcome !== 'ongoing') return state;
  switch (action.type) {
    case 'PLAY_CARD':
      return playCard(state, action.handIndex);
    case 'SWITCH':
      return switchTo(state, action.teamIndex);
    case 'END_TURN':
      return endTurn(state);
  }
}

function playCard(state: CombatState, handIndex: number): CombatState {
  const id = state.hand[handIndex];
  if (id === undefined) return state;
  const card = CARDS[id];
  if (!card || state.energy < card.cost) return state;

  const exhausts = exhaustsOnPlay(card);
  const rng = rngFrom(state.rngState);
  let s: CombatState = {
    ...state,
    energy: state.energy - card.cost,
    hand: state.hand.filter((_, i) => i !== handIndex),
    discard: exhausts ? state.discard : [...state.discard, id],
    exhaust: exhausts ? [...state.exhaust, id] : state.exhaust,
  };
  for (const effect of card.effects) {
    s = applyEffect(s, effect, card, rng.next);
    if (s.outcome !== 'ongoing') break;
  }
  return { ...s, rngState: rng.state };
}

function switchTo(state: CombatState, teamIndex: number): CombatState {
  if (teamIndex === state.activeIndex) return state;
  const target = state.team[teamIndex];
  if (!target || target.hp <= 0) return state;
  // A pending freeSwitch (U-Turn-style) waives the energy cost for this one switch.
  const cost = state.freeSwitch ? 0 : SWITCH_COST;
  if (state.energy < cost) return state;
  // Outgoing mon loses block and resets stat-stages (canon: stages don't persist on bench).
  const team = state.team.map((mon, i) =>
    i === state.activeIndex ? { ...mon, block: 0, stages: { ...EMPTY_STAGES } } : mon,
  );
  return {
    ...state,
    team,
    activeIndex: teamIndex,
    energy: state.energy - cost,
    freeSwitch: false,
  };
}

function endTurn(state: CombatState): CombatState {
  const rng = rngFrom(state.rngState);
  // Discard the remaining hand, then tick the active mon's statuses (e.g. BURN).
  let s: CombatState = { ...state, discard: [...state.discard, ...state.hand], hand: [] };
  s = tickActiveStatuses(s);
  s = resolveFaints(s);
  if (s.outcome !== 'ongoing') return { ...s, rngState: rng.state };

  // Enemy acts on its telegraphed intent — UNLESS it already went first at turn start.
  if (!s.enemyActed) {
    s = enemyAct(s);
    s = resolveFaints(s);
    if (s.outcome !== 'ongoing') return { ...s, rngState: rng.state };
  }

  const enemyTick = tickStatuses(s.enemy);
  s = { ...s, enemy: enemyTick.combatant };
  if (s.enemy.hp <= 0) return { ...s, outcome: 'win', rngState: rng.state };

  // Start the player's next turn.
  s = startTurn(s, rng);
  return { ...s, rngState: rng.state };
}

function tickActiveStatuses(state: CombatState): CombatState {
  const { combatant } = tickStatuses(activeOf(state));
  return setActiveMon(state, combatant);
}

function enemyAct(state: CombatState): CombatState {
  // Sleep / freeze lock the action this turn — intent is wasted, status still ticks at
  // end of turn so the duration counts down even on skipped turns.
  if (isIncapacitated(state.enemy)) return state;
  const intent = state.enemyIntent;
  switch (intent.kind) {
    case 'attack': {
      const a = activeOf(state);
      const absorbed = Math.min(a.block, intent.amount);
      const hp = Math.max(0, a.hp - (intent.amount - absorbed));
      return setActiveMon(state, { ...a, block: a.block - absorbed, hp });
    }
    case 'defend':
      return { ...state, enemy: { ...state.enemy, block: state.enemy.block + intent.amount } };
    case 'status': {
      const a = activeOf(state);
      return setActiveMon(state, {
        ...a,
        statuses: applyStatus(a.statuses, intent.status.id, intent.status.stacks),
      });
    }
  }
}

function resolveFaints(state: CombatState): CombatState {
  const active = state.team[state.activeIndex];
  if (active && active.hp > 0) return state;
  const aliveIndex = state.team.findIndex((mon) => mon.hp > 0);
  if (aliveIndex === -1) return { ...state, outcome: 'lose' };
  return { ...state, activeIndex: aliveIndex };
}

function startTurn(state: CombatState, rng: SeededRng): CombatState {
  const team = state.team.map((mon, i) => (i === state.activeIndex ? { ...mon, block: 0 } : mon));
  const piles = drawCards(
    { draw: state.draw, hand: state.hand, discard: state.discard },
    HAND_SIZE,
    rng.next,
  );
  const next: CombatState = {
    ...state,
    team,
    energy: state.maxEnergy,
    enemyIntent: rollIntent(state.enemy, rng.next),
    ...piles,
    turn: state.turn + 1,
    enemyActed: false,
    freeSwitch: false,
  };
  return maybeEnemyGoesFirst(next, rng);
}

/**
 * If the enemy is faster than the active mon, execute its telegraphed intent immediately
 * at the start of the turn (before the player can play any cards), and mark `enemyActed`
 * so the end-of-turn flow skips its enemy phase. Ties go to the player.
 */
function maybeEnemyGoesFirst(state: CombatState, rng: SeededRng): CombatState {
  if (effectiveSpeed(state.enemy) <= effectiveSpeed(activeOf(state))) {
    return { ...state, rngState: rng.state, enemyActed: false };
  }
  let s = enemyAct(state);
  s = resolveFaints(s);
  return { ...s, rngState: rng.state, enemyActed: true };
}
