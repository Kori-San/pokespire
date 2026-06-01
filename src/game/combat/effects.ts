import type { CardDef, Combatant, CombatState, Effect, PokeType, StatStages } from '@/types';
import { activeEnemyOf, columnOf, critChance, CRIT_MULTIPLIER, withActiveEnemy } from '@/types';
import { applyStatus } from '@/data/statuses';
import { POKEDEX } from '@/data/pokedex';
import { calcCaptureChance, rollCapture } from './capture';
import { calcDamage } from './damage';
import { drawCards } from './deck';

/** First canonical Mega forme of a species (forme name starts with "Mega"), or null. */
function firstMegaFormeOf(speciesSlug: string): string | null {
  const sp = POKEDEX[speciesSlug];
  if (!sp) return null;
  for (const other of sp.otherFormes) {
    const candidate = POKEDEX[other];
    if (candidate?.forme?.startsWith('Mega')) return other;
  }
  return null;
}

/** True when the species has at least one canonical Mega forme — drives card affordability. */
export function hasMegaForm(speciesSlug: string): boolean {
  return firstMegaFormeOf(speciesSlug) !== null;
}

/**
 * Canonical Gigantamax forme of a species, or null. Tries `otherFormes` first; the
 * generated pokedex doesn't always cross-link Gmax forms back from the base species
 * (e.g. `charizard.otherFormes` lists the two Megas but omits `charizard-gmax`), so
 * we fall back to the convention `{slug}-gmax`.
 */
function gmaxFormeOf(speciesSlug: string): string | null {
  const sp = POKEDEX[speciesSlug];
  if (sp) {
    for (const other of sp.otherFormes) {
      if (POKEDEX[other]?.forme === 'Gmax') return other;
    }
  }
  const direct = `${speciesSlug}-gmax`;
  if (POKEDEX[direct]?.forme === 'Gmax') return direct;
  return null;
}

/** True when the species has a Gigantamax forme — drives the Gmax sprite swap on dynamax. */
export function hasGmaxForm(speciesSlug: string): boolean {
  return gmaxFormeOf(speciesSlug) !== null;
}

/**
 * Apply Mega Evolution to a Combatant: swap speciesSlug / name / types / baseStats to the
 * first canonical Mega forme. No-op if the species has none. Shared between the player-side
 * `megaEvolve` Effect handler and the enemy-side `megaEvolve` Intent.
 */
export function megaEvolveCombatant(mon: Combatant): Combatant {
  const megaSlug = firstMegaFormeOf(mon.speciesSlug);
  if (!megaSlug) return mon;
  const mega = POKEDEX[megaSlug];
  if (!mega) return mon;
  return {
    ...mon,
    speciesSlug: megaSlug,
    name: mega.displayName,
    types: mega.types,
    baseStats: mega.baseStats,
  };
}

/**
 * Apply Terastallization to a Combatant: locks `tera.type` for the rest of combat (no
 * revert). No-op if the mon is already terastallized. Shared between the player-side
 * `terastallize` Effect handler and any future enemy-side intent.
 */
export function terastallizeCombatant(mon: Combatant, teraType: PokeType): Combatant {
  if (mon.tera) return mon;
  return { ...mon, tera: { type: teraType } };
}

/**
 * Apply Dynamax to a Combatant: double maxHp (healing the gained capacity), swap to the
 * Gigantamax forme if the species has one, and stash pre-dynamax fields in `DynamaxState`
 * for the end-of-turn revert. No-op if the mon is already dynamaxed. Shared between the
 * player-side `dynamax` Effect handler and the enemy-side `dynamax` Intent.
 */
export function dynamaxCombatant(mon: Combatant): Combatant {
  if (mon.dynamax) return mon;
  const newMaxHp = mon.maxHp * 2;
  const gain = newMaxHp - mon.maxHp;
  const gSlug = gmaxFormeOf(mon.speciesSlug);
  const gForm = gSlug ? POKEDEX[gSlug] : null;
  return {
    ...mon,
    ...(gForm && gSlug ? { speciesSlug: gSlug, name: gForm.displayName, types: gForm.types } : {}),
    maxHp: newMaxHp,
    hp: mon.hp + gain,
    dynamax: {
      turnsLeft: 3,
      gmax: gForm !== null,
      prevSlug: mon.speciesSlug,
      prevTypes: mon.types,
      prevBaseStats: mon.baseStats,
      prevMaxHp: mon.maxHp,
    },
  };
}

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
 * Deal `recoilPercent`% of `dealt` as self-damage to the attacker. No-op when the
 * percent is missing or 0. Used by Brave Bird, Flare Blitz, Wood Hammer, Wild Charge,
 * Double-Edge — moves where the trade is "high power for self-cost".
 */
function applyRecoil(
  state: CombatState,
  attacker: Combatant,
  dealt: number,
  recoilPercent: number | undefined,
): CombatState {
  if (!recoilPercent || dealt <= 0) return state;
  const recoil = Math.round((dealt * recoilPercent) / 100);
  const hp = Math.max(0, attacker.hp - recoil);
  return setActive(state, { ...attacker, hp });
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
      // Multi-hit canon moves (Double Kick = 2, Triple Axel = 3, …): the damage formula
      // resolves once per hit, each rolling crit independently. STAB / type-eff don't
      // change between hits (same attacker × defender × card type), so we compute the
      // base `final` once. Defender HP / block tick down per hit, so a KO mid-flurry
      // ends the loop early via the `hp <= 0` exit.
      const hits = Math.max(1, effect.hits ?? 1);
      const { final } = calcDamage({
        amount: effect.amount,
        cardType: card.type,
        category: card.category,
        attacker,
        defender: activeEnemyOf(state),
        weather: state.weather,
      });
      let s = state;
      let totalDealt = 0;
      for (let i = 0; i < hits; i++) {
        const defender = activeEnemyOf(s);
        if (defender.hp <= 0) break;
        // critBoost is a per-hit bump on TOP of the attacker's persistent crit stage —
        // Stone Edge / Frost Breath / Slash-style move-inherent high-crit moves.
        const crit = rng() < critChance(attacker.stages.crit + (effect.critBoost ?? 0));
        const dealt = crit ? Math.round(final * CRIT_MULTIPLIER) : final;
        const absorbed = Math.min(defender.block, dealt);
        const hp = Math.max(0, defender.hp - (dealt - absorbed));
        totalDealt += dealt;
        s = withActiveEnemy({ ...s, outcome: hp <= 0 ? 'win' : s.outcome }, (e) => ({
          ...e,
          block: e.block - absorbed,
          hp,
        }));
      }
      const afterRecoil = applyRecoil(s, attacker, totalDealt, effect.recoilPercent);
      // Recharge (Hyper Beam / Giga Impact / Blast Burn …): lock ATK cards on this
      // Pokémon until the end of the next turn. `effect.recharge` is the number of
      // turn windows to lock — Hyper Beam = 2 (rest of THIS turn + all of NEXT turn,
      // since the counter ticks once at end of this turn). Tied to the Pokémon, not
      // the slot — survives a switch.
      if (effect.recharge && effect.recharge > 0) {
        const updated = afterRecoil.team[afterRecoil.activeIndex];
        if (updated) {
          return setActive(afterRecoil, { ...updated, recharge: effect.recharge });
        }
      }
      return afterRecoil;
    }
    case 'lifesteal': {
      const attacker = activeOf(state);
      const defender = activeEnemyOf(state);
      const { final } = calcDamage({
        amount: effect.amount,
        cardType: card.type,
        category: card.category,
        attacker,
        defender,
        weather: state.weather,
      });
      const crit = rng() < critChance(attacker.stages.crit + (effect.critBoost ?? 0));
      const dealt = crit ? Math.round(final * CRIT_MULTIPLIER) : final;
      const absorbed = Math.min(defender.block, dealt);
      const hp = Math.max(0, defender.hp - (dealt - absorbed));
      // Heal scales with the rolled `dealt` so STAB / super-effective / crit all amplify the
      // restoration too. Block still trims HP damage but not the heal, by design.
      const healed = Math.round((dealt * effect.percent) / 100);
      const healedAttacker = {
        ...attacker,
        hp: Math.min(attacker.maxHp, attacker.hp + healed),
      };
      const stepped: CombatState = withActiveEnemy(
        { ...state, outcome: hp <= 0 ? 'win' : state.outcome },
        (e) => ({ ...e, block: e.block - absorbed, hp }),
      );
      const withHeal = setActive(stepped, healedAttacker);
      return applyRecoil(withHeal, healedAttacker, dealt, effect.recoilPercent);
    }
    case 'block': {
      // `column` (Wide-Guard-style) shields every ally on the active mon's column;
      // `self` (default) shields only the active mon.
      if (effect.scope === 'column') {
        const activeCol = columnOf(state.activeIndex);
        return {
          ...state,
          team: state.team.map((mon, i) =>
            columnOf(i) === activeCol ? { ...mon, block: mon.block + effect.amount } : mon,
          ),
        };
      }
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
      return withActiveEnemy(state, (e) => ({
        ...e,
        statuses: applyStatus(e.statuses, effect.status, effect.stacks),
      }));
    }
    case 'stat': {
      if (effect.target === 'self') {
        // `column` (Tailwind-style team buff) bumps the stat on every ally in the
        // active mon's column; default `self` only touches the active mon.
        if (effect.scope === 'column') {
          const activeCol = columnOf(state.activeIndex);
          return {
            ...state,
            team: state.team.map((mon, i) =>
              columnOf(i) === activeCol
                ? { ...mon, stages: bumpStage(mon.stages, effect.stat, effect.stages) }
                : mon,
            ),
          };
        }
        const a = activeOf(state);
        return setActive(state, { ...a, stages: bumpStage(a.stages, effect.stat, effect.stages) });
      }
      return withActiveEnemy(state, (e) => ({
        ...e,
        stages: bumpStage(e.stages, effect.stat, effect.stages),
      }));
    }
    case 'energy': {
      if (effect.when === 'now') return { ...state, energy: state.energy + effect.amount };
      return state;
    }
    case 'weather': {
      return { ...state, weather: { kind: effect.weather, turnsLeft: effect.turns } };
    }
    case 'terrain': {
      // Terrain has no state-side field yet — full engine implementation comes later.
      // The card still surfaces its Terrain keyword chip via `keywordsOf`.
      return state;
    }
    case 'freeSwitch': {
      // Effect kind keeps its data-side name (`freeSwitch`) for now — touching every
      // card data file gets folded into a later phase. The runtime behaviour now
      // arms the switch-combo discount state machine instead of waiving a switch
      // energy cost (switching is always free).
      return { ...state, comboDiscount: 'pending' };
    }
    case 'megaEvolve': {
      return setActive(state, megaEvolveCombatant(activeOf(state)));
    }
    case 'dynamax': {
      return setActive(state, dynamaxCombatant(activeOf(state)));
    }
    case 'terastallize': {
      return setActive(state, terastallizeCombatant(activeOf(state), effect.teraType));
    }
    case 'capture': {
      const target = activeEnemyOf(state);
      const chance = calcCaptureChance({
        hp: target.hp,
        maxHp: target.maxHp,
        ballTier: effect.ballTier,
        catchRate: target.catchRate,
        shiny: target.shiny,
      });
      return rollCapture(chance, rng) ? { ...state, outcome: 'captured' } : state;
    }
  }
}
