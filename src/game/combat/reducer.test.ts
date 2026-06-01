import { describe, expect, it } from 'vitest';
import type { Combatant, CombatState, PokeType } from '@/types';
import { EMPTY_STAGES, activeEnemyOf } from '@/types';
import { STARTER_DECK } from '@/data/cards';
import { combatReducer, createCombat, handSizeFor, maxEnergyFor } from './reducer';

function mon(overrides: Partial<Combatant> = {}): Combatant {
  return {
    speciesId: 1,
    name: 'mon',
    speciesSlug: 'mon',
    types: ['normal'] as PokeType[],
    level: 10,
    baseStats: { hp: 100, atk: 75, def: 75, spAtk: 75, spDef: 75, spd: 75 },
    catchRate: 45,
    shiny: false,
    maxHp: 100,
    hp: 100,
    block: 0,
    statuses: [],
    stages: { ...EMPTY_STAGES },
    recharge: 0,
    ...overrides,
  };
}

// Default fixture uses a 1-mon team so legacy switch / energy assertions stay
// readable. Tests that need a bigger team override `team` explicitly + dial
// energy/maxEnergy from `maxEnergyFor(teamSize)`.
const SOLO_ENERGY = maxEnergyFor(1);
const SOLO_HAND = handSizeFor(1);

function state(overrides: Partial<CombatState> = {}): CombatState {
  return {
    team: [mon()],
    activeIndex: 0,
    enemies: [mon({ name: 'foe', speciesId: 2 })],
    enemyActiveIndex: 0,
    enemyIntent: { kind: 'attack', amount: 10, targetIndex: 0 },
    energy: SOLO_ENERGY,
    maxEnergy: SOLO_ENERGY,
    hand: [],
    draw: [],
    discard: [],
    exhaust: [],
    turn: 1,
    weather: null,
    rngState: 123,
    outcome: 'ongoing',
    enemyActed: false,
    comboDiscount: 'inactive',
    log: [],
    ...overrides,
  };
}

describe('createCombat', () => {
  it('deals an opening hand and sets up the turn', () => {
    const s = createCombat({ team: [mon()], enemy: mon(), deck: STARTER_DECK, seed: 7 });
    expect(s.hand).toHaveLength(SOLO_HAND);
    expect(s.energy).toBe(SOLO_ENERGY);
    expect(s.outcome).toBe('ongoing');
    expect(s.enemyIntent).toBeDefined();
    expect(s.turn).toBe(1);
  });

  it('scales hand size + max energy with team size', () => {
    const sixMon = Array.from({ length: 6 }, (_, i) => mon({ name: `m${String(i)}` }));
    const s = createCombat({ team: sixMon, enemy: mon(), deck: STARTER_DECK, seed: 7 });
    expect(s.hand).toHaveLength(8); // 5 + ⌊6/2⌋
    expect(s.energy).toBe(8); // min(8, 2 + 6)
    expect(s.maxEnergy).toBe(8);
  });

  it('is deterministic for the same seed', () => {
    const a = createCombat({ team: [mon()], enemy: mon(), deck: STARTER_DECK, seed: 7 });
    const b = createCombat({ team: [mon()], enemy: mon(), deck: STARTER_DECK, seed: 7 });
    expect(a).toEqual(b);
  });
});

describe('combatReducer — PLAY_CARD', () => {
  it('plays a damage card, paying energy and hurting the enemy', () => {
    const s = state({ hand: ['tackle'] });
    const out = combatReducer(s, { type: 'PLAY_CARD', handIndex: 0 });
    expect(out.energy).toBe(SOLO_ENERGY - 1);
    expect(activeEnemyOf(out).hp).toBeLessThan(100);
    expect(out.hand).toEqual([]);
    expect(out.discard).toEqual(['tackle']);
  });

  it('refuses a card the player cannot afford', () => {
    const s = state({ hand: ['doubleKick'], energy: 1 });
    const out = combatReducer(s, { type: 'PLAY_CARD', handIndex: 0 });
    expect(out).toBe(s);
  });

  it('exhausts BALL cards on play (one-shot, not redrawable this combat)', () => {
    const s = state({ hand: ['pokeBall'] });
    const out = combatReducer(s, { type: 'PLAY_CARD', handIndex: 0 });
    expect(out.exhaust).toEqual(['pokeBall']);
    expect(out.discard).toEqual([]);
  });

  it('exhausts ITEM cards on play', () => {
    const s = state({ hand: ['potion'], team: [mon({ hp: 50 })] });
    const out = combatReducer(s, { type: 'PLAY_CARD', handIndex: 0 });
    expect(out.exhaust).toEqual(['potion']);
    expect(out.discard).toEqual([]);
  });
});

describe('combatReducer — SWITCH', () => {
  it('switches active, never costs energy, and resets the outgoing block', () => {
    const s = state({ team: [mon({ block: 6 }), mon({ name: 'b' })] });
    const out = combatReducer(s, { type: 'SWITCH', teamIndex: 1 });
    expect(out.activeIndex).toBe(1);
    // Switch is free — energy unchanged.
    expect(out.energy).toBe(SOLO_ENERGY);
    expect(out.team[0]?.block).toBe(0);
  });

  it('will not switch to a fainted teammate', () => {
    const s = state({ team: [mon(), mon({ name: 'b', hp: 0 })] });
    const out = combatReducer(s, { type: 'SWITCH', teamIndex: 1 });
    expect(out).toBe(s);
  });

  it('arms the next-card discount when switching after a comboDiscount card resolved', () => {
    // Pretend U-Turn just resolved → comboDiscount === 'pending'. Switch → armed.
    const s = state({
      team: [mon(), mon({ name: 'b' }), mon({ name: 'c' })],
      comboDiscount: 'pending',
      hand: ['tackle'], // tackle costs 1
    });
    const switched = combatReducer(s, { type: 'SWITCH', teamIndex: 1 });
    expect(switched.activeIndex).toBe(1);
    expect(switched.comboDiscount).toBe('armed-for-next-card');
    // Now play tackle — should pay 0 energy (1 base - 1 discount).
    const played = combatReducer(switched, { type: 'PLAY_CARD', handIndex: 0 });
    expect(played.energy).toBe(switched.energy); // no energy spent
    expect(played.comboDiscount).toBe('inactive'); // discount consumed
  });

  it('switch alone (no pending discount) leaves the combo machine unchanged', () => {
    const s = state({ team: [mon(), mon({ name: 'b' })] });
    expect(s.comboDiscount).toBe('inactive');
    const out = combatReducer(s, { type: 'SWITCH', teamIndex: 1 });
    expect(out.comboDiscount).toBe('inactive');
  });

  it('resets the outgoing mon stat-stages to zero on switch-out', () => {
    const s = state({
      team: [mon({ stages: { ...EMPTY_STAGES, atk: 4, crit: 2 } }), mon({ name: 'b' })],
    });
    const out = combatReducer(s, { type: 'SWITCH', teamIndex: 1 });
    expect(out.team[0]?.stages).toEqual(EMPTY_STAGES);
  });
});

describe('combatReducer — END_TURN', () => {
  it('lets the enemy act, then redraws and resets energy', () => {
    const s = state({
      hand: ['tackle'],
      draw: Array<string>(10).fill('tackle'),
      energy: 0,
      enemyIntent: { kind: 'attack', amount: 12, targetIndex: 0 },
    });
    const out = combatReducer(s, { type: 'END_TURN' });
    expect(out.team[0]?.hp).toBeLessThan(100);
    expect(out.hand).toHaveLength(SOLO_HAND);
    expect(out.energy).toBe(SOLO_ENERGY);
    expect(out.turn).toBe(2);
  });

  it('ends in a loss when the last mon faints', () => {
    const s = state({
      team: [mon({ hp: 5 })],
      enemyIntent: { kind: 'attack', amount: 50, targetIndex: 0 },
    });
    const out = combatReducer(s, { type: 'END_TURN' });
    expect(out.outcome).toBe('lose');
  });

  it('ticks dynamax turnsLeft each turn; reverts at 0 and clamps hp to original maxHp', () => {
    // Active mon mid-dynamax with 1 turn left. Ending the turn should revert it.
    const s = state({
      team: [
        mon({
          speciesSlug: 'charizard-gmax',
          maxHp: 200,
          hp: 180,
          dynamax: {
            turnsLeft: 1,
            gmax: true,
            prevSlug: 'charizard',
            prevTypes: ['fire', 'flying'] as PokeType[],
            prevBaseStats: { hp: 78, atk: 84, def: 78, spAtk: 109, spDef: 85, spd: 100 },
            prevMaxHp: 100,
          },
        }),
      ],
      enemyIntent: { kind: 'defend', amount: 0 },
      hand: [],
      draw: Array<string>(10).fill('tackle'),
    });
    const out = combatReducer(s, { type: 'END_TURN' });
    const after = out.team[0]!;
    expect(after.dynamax).toBeNull();
    expect(after.speciesSlug).toBe('charizard');
    expect(after.maxHp).toBe(100);
    // hp clamps to the lower original max — 180 was over the original cap.
    expect(after.hp).toBe(100);
  });

  it("an enemy 'megaEvolve' intent transforms the active enemy on end-of-turn", () => {
    const s = state({
      enemies: [
        mon({
          name: 'Charizard',
          speciesSlug: 'charizard',
          types: ['fire', 'flying'] as PokeType[],
          baseStats: { hp: 78, atk: 84, def: 78, spAtk: 109, spDef: 85, spd: 100 },
        }),
      ],
      enemyIntent: { kind: 'megaEvolve' },
      draw: Array<string>(10).fill('tackle'),
    });
    const out = combatReducer(s, { type: 'END_TURN' });
    expect(out.enemies[0]?.speciesSlug).toBe('charizard-mega-x');
    expect(out.team[0]?.hp).toBe(100); // no damage taken — Mega is self-apply
  });

  it("an enemy 'dynamax' intent doubles the foe's maxHp and ticks down each turn", () => {
    const s = state({
      enemies: [
        mon({
          name: 'Pikachu',
          speciesSlug: 'pikachu',
          maxHp: 80,
          hp: 80,
        }),
      ],
      enemyIntent: { kind: 'dynamax' },
      draw: Array<string>(10).fill('tackle'),
    });
    // Turn 1: enemy dynamaxes.
    const t1 = combatReducer(s, { type: 'END_TURN' });
    expect(t1.enemies[0]?.maxHp).toBe(160);
    expect(t1.enemies[0]?.speciesSlug).toBe('pikachu-gmax');
    // Turn 1 already consumed one tick at end-of-turn (the dynamax was applied this same
    // end-of-turn, then the tick fires on the next end-of-turn). turnsLeft starts at 3.
    expect(t1.enemies[0]?.dynamax?.turnsLeft).toBe(3);
  });

  it('dynamax with turnsLeft > 1 just decrements, no revert', () => {
    const s = state({
      team: [
        mon({
          dynamax: {
            turnsLeft: 3,
            gmax: false,
            prevSlug: 'mon',
            prevTypes: ['normal'] as PokeType[],
            prevBaseStats: { hp: 100, atk: 75, def: 75, spAtk: 75, spDef: 75, spd: 75 },
            prevMaxHp: 100,
          },
          maxHp: 200,
          hp: 200,
        }),
      ],
      enemyIntent: { kind: 'defend', amount: 0 },
      draw: Array<string>(10).fill('tackle'),
    });
    const out = combatReducer(s, { type: 'END_TURN' });
    expect(out.team[0]?.dynamax?.turnsLeft).toBe(2);
    expect(out.team[0]?.maxHp).toBe(200);
  });
});

describe('combatReducer — sleep / freeze / paralyze', () => {
  it('a sleeping enemy skips its intent and the sleep stack decays at end of turn', () => {
    const s = state({
      enemies: [mon({ name: 'foe', statuses: [{ id: 'sleep', stacks: 2 }] })],
      enemyIntent: { kind: 'attack', amount: 50, targetIndex: 0 },
    });
    const out = combatReducer(s, { type: 'END_TURN' });
    expect(out.team[0]?.hp).toBe(100);
    expect(activeEnemyOf(out).statuses.find((x) => x.id === 'sleep')?.stacks).toBe(1);
  });

  it('a frozen enemy skips its intent (same lock as sleep)', () => {
    const s = state({
      enemies: [mon({ name: 'foe', statuses: [{ id: 'freeze', stacks: 1 }] })],
      enemyIntent: { kind: 'attack', amount: 50, targetIndex: 0 },
    });
    const out = combatReducer(s, { type: 'END_TURN' });
    expect(out.team[0]?.hp).toBe(100);
  });

  it('paralyze halves the enemy effective speed so the player is faster again', () => {
    const fastEnemy = mon({
      name: 'fast',
      baseStats: { hp: 100, atk: 75, def: 75, spAtk: 75, spDef: 75, spd: 100 },
      statuses: [{ id: 'paralyze', stacks: 3 }],
    });
    const slowerPlayer = mon({
      baseStats: { hp: 100, atk: 75, def: 75, spAtk: 75, spDef: 75, spd: 60 },
    });
    const s = createCombat({
      team: [slowerPlayer],
      enemy: fastEnemy,
      deck: STARTER_DECK,
      seed: 1,
    });
    // Enemy base 100 × paralyze 0.5 = 50, player 60 — player faster, enemy doesn't act first.
    expect(s.enemyActed).toBe(false);
  });
});

describe('combatReducer — speed turn-order', () => {
  it('lets the enemy act before the player when faster (createCombat)', () => {
    const slowPlayer = mon({
      baseStats: { hp: 100, atk: 75, def: 75, spAtk: 75, spDef: 75, spd: 20 },
    });
    const fastEnemy = mon({
      name: 'fast',
      baseStats: { hp: 100, atk: 75, def: 75, spAtk: 75, spDef: 75, spd: 200 },
    });
    // Pin the seed so the first rolled intent is an attack — see rollIntent thresholds.
    const s = createCombat({
      team: [slowPlayer],
      enemy: fastEnemy,
      deck: STARTER_DECK,
      seed: 1,
    });
    expect(s.enemyActed).toBe(true);
    // Faster enemy has already done SOMETHING — either chipped the player, raised its block, or
    // applied a status — depending on the seeded intent roll.
    const acted =
      (s.team[0]?.hp ?? 0) < 100 ||
      activeEnemyOf(s).block > 0 ||
      (s.team[0]?.statuses.length ?? 0) > 0;
    expect(acted).toBe(true);
  });

  it('skips the end-of-turn enemy phase when it already acted at turn start', () => {
    const slow = mon({ baseStats: { hp: 100, atk: 75, def: 75, spAtk: 75, spDef: 75, spd: 20 } });
    const fast = mon({
      name: 'fast',
      baseStats: { hp: 100, atk: 75, def: 75, spAtk: 75, spDef: 75, spd: 200 },
    });
    const s = state({
      team: [slow],
      enemies: [fast],
      enemyActed: true,
      enemyIntent: { kind: 'attack', amount: 50, targetIndex: 0 },
    });
    const out = combatReducer(s, { type: 'END_TURN' });
    // Without the skip, a 50-damage hit would land here; with it, the player only takes the
    // hit from the NEW intent rolled for the next turn (since enemy is still faster).
    // We assert the player's hp didn't drop by the full 50 + 50 (~ both intents).
    expect(out.team[0]?.hp).toBeGreaterThan(0);
  });

  it('keeps the canonical turn order when the player is faster', () => {
    const fastPlayer = mon({
      baseStats: { hp: 100, atk: 75, def: 75, spAtk: 75, spDef: 75, spd: 200 },
    });
    const slowEnemy = mon({
      name: 'slow',
      baseStats: { hp: 100, atk: 75, def: 75, spAtk: 75, spDef: 75, spd: 20 },
    });
    const s = createCombat({
      team: [fastPlayer],
      enemy: slowEnemy,
      deck: STARTER_DECK,
      seed: 1,
    });
    expect(s.enemyActed).toBe(false);
    expect(s.team[0]?.hp).toBe(100);
  });
});

describe('combatReducer — guards & determinism', () => {
  it('is a no-op once combat is over', () => {
    const s = state({ outcome: 'win', hand: ['tackle'] });
    expect(combatReducer(s, { type: 'PLAY_CARD', handIndex: 0 })).toBe(s);
  });

  it('produces identical results for identical inputs', () => {
    const a = state({ draw: Array<string>(10).fill('tackle') });
    const b = state({ draw: Array<string>(10).fill('tackle') });
    expect(combatReducer(a, { type: 'END_TURN' })).toEqual(combatReducer(b, { type: 'END_TURN' }));
  });
});
