import type { CombatAction, Combatant, CombatState } from '@/types';
import {
  EMPTY_STAGES,
  activeEnemyOf,
  effectiveSpeed,
  isIncapacitated,
  withActiveEnemy,
} from '@/types';
import { CARDS, exhaustsOnPlay } from '@/data/cards';
import { applyStatus } from '@/data/statuses';
import { rngFrom, type SeededRng } from '@/game/run/rng';
import { applyEffect, dynamaxCombatant, megaEvolveCombatant } from './effects';
import { drawCards, shuffle } from './deck';
import { rollIntent } from './intent';
import { effectiveCardFor } from './selectors';
import { tickStatuses } from './statusTick';

const BASE_HAND_SIZE = 5;
const BASE_MAX_ENERGY = 2; // teamSize 1 → 3; teamSize 6 → 8 (capped by MAX_ENERGY_CEILING)
const MAX_ENERGY_CEILING = 8;

/** Hand size scales with team — 5 base, +1 every 2 mons. Solo=5, full party=8. */
export function handSizeFor(teamSize: number): number {
  return BASE_HAND_SIZE + Math.floor(teamSize / 2);
}

/** Max energy scales with team — +1 per mon, capped at 8. Solo=3, full party=8. */
export function maxEnergyFor(teamSize: number): number {
  return Math.min(MAX_ENERGY_CEILING, BASE_MAX_ENERGY + teamSize);
}

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

/** Build a fresh combat: shuffle the deck, draw the opening hand, roll the first intent.
 *  The `enemy` input is wrapped into a single-element `enemies[]` — single-enemy fights
 *  stay the v0 default until multi-foe content lands. */
export function createCombat(opts: CreateCombatOptions): CombatState {
  const rng = rngFrom(opts.seed);
  const shuffled = shuffle(opts.deck, rng.next);
  const handSize = handSizeFor(opts.team.length);
  const maxEnergy = maxEnergyFor(opts.team.length);
  const piles = drawCards({ draw: shuffled, hand: [], discard: [] }, handSize, rng.next);
  const fresh: CombatState = {
    team: opts.team,
    activeIndex: 0,
    enemies: [opts.enemy],
    enemyActiveIndex: 0,
    enemyIntent: rollIntent(opts.enemy, rng.next),
    energy: maxEnergy,
    maxEnergy,
    hand: piles.hand,
    draw: piles.draw,
    discard: piles.discard,
    exhaust: [],
    turn: 1,
    weather: null,
    rngState: rng.state,
    outcome: 'ongoing',
    enemyActed: false,
    comboDiscount: 'inactive',
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
  const raw = CARDS[id];
  const attacker = state.team[state.activeIndex];
  if (!raw || !attacker) return state;
  // Resolve the effective card — while the active mon is dynamaxed, this swaps the
  // raw card for its Max / G-Max equivalent so the reducer applies Max effects.
  const card = effectiveCardFor(raw, attacker);
  // Switch-combo discount: U-Turn-class card → switch → next card costs 1 less.
  const discount = state.comboDiscount === 'armed-for-next-card' ? 1 : 0;
  const cost = Math.max(0, card.cost - discount);
  if (state.energy < cost) return state;
  // Recharge: per-mon counter locks ATK cards while > 0. Hyper Beam sets it to 2 so
  // the lockout covers the rest of this turn + all of next turn (ticks at end of turn).
  if (attacker.recharge > 0 && card.kind === 'ATK') return state;

  const exhausts = exhaustsOnPlay(card);
  const rng = rngFrom(state.rngState);
  let s: CombatState = {
    ...state,
    energy: state.energy - cost,
    hand: state.hand.filter((_, i) => i !== handIndex),
    discard: exhausts ? state.discard : [...state.discard, id],
    exhaust: exhausts ? [...state.exhaust, id] : state.exhaust,
    // Burn the discount once consumed; otherwise leave state alone (a `pending`
    // discount stays pending if the player plays a card before switching).
    comboDiscount: discount > 0 ? 'inactive' : state.comboDiscount,
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
  // Outgoing mon loses block and resets stat-stages (canon: stages don't persist on bench).
  const team = state.team.map((mon, i) =>
    i === state.activeIndex ? { ...mon, block: 0, stages: { ...EMPTY_STAGES } } : mon,
  );
  return {
    ...state,
    team,
    activeIndex: teamIndex,
    // Promote a pending combo-discount into armed-for-the-next-card. Switching after
    // any other state keeps the machine where it was (free switches don't consume it).
    comboDiscount: state.comboDiscount === 'pending' ? 'armed-for-next-card' : state.comboDiscount,
  };
}

function endTurn(state: CombatState): CombatState {
  const rng = rngFrom(state.rngState);
  // Discard the remaining hand, then tick the active mon's statuses (e.g. BURN).
  let s: CombatState = { ...state, discard: [...state.discard, ...state.hand], hand: [] };
  // Recharge tick — every team mon that's recharging loses 1 turn (clamped at 0). Bench
  // mons tick too: canon-faithful since the recharge is tied to the Pokémon, not the
  // slot. Hyper Beam → 1 turn of "no attacks" the turn after the hit lands.
  s = {
    ...s,
    team: s.team.map((mon) => ({ ...mon, recharge: Math.max(0, mon.recharge - 1) })),
  };
  // Dynamax tick — every mon (team AND enemy side) in dynamax loses 1 turn. At 0,
  // revert: restore pre-dynamax slug / types / baseStats / maxHp, clamp hp to the
  // (lower) original max. Bench mons tick too (canon: the dynamax timer doesn't
  // pause on switch).
  s = {
    ...s,
    team: s.team.map((mon) => tickDynamax(mon)),
    enemies: s.enemies.map((mon) => tickDynamax(mon)),
  };
  s = tickActiveStatuses(s);
  s = resolveFaints(s);
  if (s.outcome !== 'ongoing') return { ...s, rngState: rng.state };

  // Enemy acts on its telegraphed intent — UNLESS it already went first at turn start.
  if (!s.enemyActed) {
    s = enemyAct(s);
    s = resolveFaints(s);
    if (s.outcome !== 'ongoing') return { ...s, rngState: rng.state };
  }

  const enemyTick = tickStatuses(activeEnemyOf(s));
  s = withActiveEnemy(s, () => enemyTick.combatant);
  if (activeEnemyOf(s).hp <= 0) return { ...s, outcome: 'win', rngState: rng.state };

  // Start the player's next turn.
  s = startTurn(s, rng);
  return { ...s, rngState: rng.state };
}

/**
 * Decrement a mon's `dynamax.turnsLeft` by 1 — when it reaches 0, revert all the
 * pre-dynamax fields (slug / types / baseStats / maxHp) and clamp `hp` to the (lower)
 * original max. No-op when the mon isn't dynamaxed.
 */
function tickDynamax(mon: Combatant): Combatant {
  if (!mon.dynamax) return mon;
  const next = mon.dynamax.turnsLeft - 1;
  if (next > 0) {
    return { ...mon, dynamax: { ...mon.dynamax, turnsLeft: next } };
  }
  return {
    ...mon,
    speciesSlug: mon.dynamax.prevSlug,
    types: mon.dynamax.prevTypes,
    baseStats: mon.dynamax.prevBaseStats,
    maxHp: mon.dynamax.prevMaxHp,
    hp: Math.min(mon.hp, mon.dynamax.prevMaxHp),
    dynamax: null,
  };
}

function tickActiveStatuses(state: CombatState): CombatState {
  const { combatant } = tickStatuses(activeOf(state));
  return setActiveMon(state, combatant);
}

function enemyAct(state: CombatState): CombatState {
  // Sleep / freeze lock the action this turn — intent is wasted, status still ticks at
  // end of turn so the duration counts down even on skipped turns.
  const enemy = activeEnemyOf(state);
  if (isIncapacitated(enemy)) return state;
  const intent = state.enemyIntent;
  switch (intent.kind) {
    case 'attack': {
      // Route damage to the targeted ally. `targetIndex` falls back to the active
      // mon if the targeted slot is fainted (canon: hit lands on whoever's in front).
      const idx =
        state.team[intent.targetIndex] && (state.team[intent.targetIndex]?.hp ?? 0) > 0
          ? intent.targetIndex
          : state.activeIndex;
      const target = state.team[idx];
      if (!target) return state;
      const absorbed = Math.min(target.block, intent.amount);
      const hp = Math.max(0, target.hp - (intent.amount - absorbed));
      return {
        ...state,
        team: state.team.map((mon, i) =>
          i === idx ? { ...mon, block: mon.block - absorbed, hp } : mon,
        ),
      };
    }
    case 'defend':
      return withActiveEnemy(state, (e) => ({ ...e, block: e.block + intent.amount }));
    case 'status': {
      // Same targeting fallback as attack — fainted slot routes to the active mon.
      const idx =
        state.team[intent.targetIndex] && (state.team[intent.targetIndex]?.hp ?? 0) > 0
          ? intent.targetIndex
          : state.activeIndex;
      const target = state.team[idx];
      if (!target) return state;
      return {
        ...state,
        team: state.team.map((mon, i) =>
          i === idx
            ? {
                ...mon,
                statuses: applyStatus(mon.statuses, intent.status.id, intent.status.stacks),
              }
            : mon,
        ),
      };
    }
    case 'megaEvolve':
      // Self-applied — transform the active enemy. No-op if no Mega forme exists.
      return withActiveEnemy(state, megaEvolveCombatant);
    case 'dynamax':
      // Self-applied — HP×2, 3-turn window, Gmax sprite swap if available. The bench
      // tick in `endTurn` already covers the enemy's dynamax revert via `tickDynamax`.
      return withActiveEnemy(state, dynamaxCombatant);
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
    handSizeFor(state.team.length),
    rng.next,
  );
  const next: CombatState = {
    ...state,
    team,
    energy: state.maxEnergy,
    enemyIntent: rollIntent(activeEnemyOf(state), rng.next),
    ...piles,
    turn: state.turn + 1,
    enemyActed: false,
    comboDiscount: 'inactive',
  };
  return maybeEnemyGoesFirst(next, rng);
}

/**
 * If the enemy is faster than the active mon, execute its telegraphed intent immediately
 * at the start of the turn (before the player can play any cards), and mark `enemyActed`
 * so the end-of-turn flow skips its enemy phase. Ties go to the player.
 */
function maybeEnemyGoesFirst(state: CombatState, rng: SeededRng): CombatState {
  if (effectiveSpeed(activeEnemyOf(state)) <= effectiveSpeed(activeOf(state))) {
    return { ...state, rngState: rng.state, enemyActed: false };
  }
  let s = enemyAct(state);
  s = resolveFaints(s);
  return { ...s, rngState: rng.state, enemyActed: true };
}
