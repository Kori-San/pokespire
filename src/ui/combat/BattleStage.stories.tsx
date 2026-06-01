import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Combatant, CombatState } from '@/types';
import { EMPTY_STAGES } from '@/types';
import { STARTER_DECK } from '@/data/cards';
import { BIOMES, TIMES_OF_DAY, WEATHERS } from '@/data/battleBackgrounds';
import { createCombat } from '@/game/combat/reducer';
import { fn } from 'storybook/test';
import { BattleStage } from './BattleStage';

function pokemon(overrides: Partial<Combatant> = {}): Combatant {
  return {
    speciesId: 4,
    name: 'Charmander',
    speciesSlug: 'charmander',
    types: ['fire'],
    level: 5,
    baseStats: { hp: 39, atk: 52, def: 43, spAtk: 60, spDef: 50, spd: 65 },
    catchRate: 45,
    shiny: false,
    maxHp: 30,
    hp: 30,
    block: 0,
    statuses: [],
    stages: { ...EMPTY_STAGES },
    recharge: 0,
    ...overrides,
  };
}

// Canonical 6v6 opening — six allies that span gens + form variants to exercise
// sprite resolution + i18n: Gen-5 starter, Gen-1 mid-evo, Gen-6 Mega form, Gen-3
// single-type, Gen-6 dual-type, and a Rotom appliance form (Gen-4).
const tepig = pokemon({
  speciesId: 498,
  name: 'Tepig',
  speciesSlug: 'tepig',
  types: ['fire'],
  statuses: [
    { id: 'burn', stacks: 1 },
    { id: 'weak', stacks: 1 },
  ],
});
const pidgeotto = pokemon({
  speciesId: 17,
  name: 'Pidgeotto',
  speciesSlug: 'pidgeotto',
  types: ['normal', 'flying'],
});
const mawileMega = pokemon({
  speciesId: 303,
  name: 'Mawile-Mega',
  speciesSlug: 'mawile-mega',
  types: ['steel', 'fairy'],
});
const absol = pokemon({
  speciesId: 359,
  name: 'Absol',
  speciesSlug: 'absol',
  types: ['dark'],
});
const greninja = pokemon({
  speciesId: 658,
  name: 'Greninja',
  speciesSlug: 'greninja',
  types: ['water', 'dark'],
});
const rotomFrost = pokemon({
  speciesId: 479,
  name: 'Rotom-Frost',
  speciesSlug: 'rotom-frost',
  types: ['electric', 'ice'],
});

const rattata = pokemon({
  speciesId: 19,
  name: 'Rattata',
  speciesSlug: 'rattata',
  types: ['normal'],
  baseStats: { hp: 30, atk: 56, def: 35, spAtk: 25, spDef: 35, spd: 72 },
  catchRate: 255,
  maxHp: 28,
  hp: 28,
});
const spearow = pokemon({
  speciesId: 21,
  name: 'Spearow',
  speciesSlug: 'spearow',
  types: ['normal', 'flying'],
  baseStats: { hp: 40, atk: 60, def: 30, spAtk: 31, spDef: 31, spd: 70 },
  maxHp: 26,
  hp: 26,
});
const zubat = pokemon({
  speciesId: 41,
  name: 'Zubat',
  speciesSlug: 'zubat',
  types: ['poison', 'flying'],
  baseStats: { hp: 40, atk: 45, def: 35, spAtk: 30, spDef: 40, spd: 55 },
  maxHp: 25,
  hp: 25,
});
const ekans = pokemon({
  speciesId: 23,
  name: 'Ekans',
  speciesSlug: 'ekans',
  types: ['poison'],
  baseStats: { hp: 35, atk: 60, def: 44, spAtk: 40, spDef: 54, spd: 55 },
  maxHp: 27,
  hp: 27,
});
const sandshrew = pokemon({
  speciesId: 27,
  name: 'Sandshrew',
  speciesSlug: 'sandshrew',
  types: ['ground'],
  baseStats: { hp: 50, atk: 75, def: 85, spAtk: 20, spDef: 30, spd: 40 },
  maxHp: 32,
  hp: 32,
});
const machop = pokemon({
  speciesId: 66,
  name: 'Machop',
  speciesSlug: 'machop',
  types: ['fighting'],
  baseStats: { hp: 70, atk: 80, def: 50, spAtk: 35, spDef: 35, spd: 35 },
  maxHp: 35,
  hp: 35,
});

const canonical: CombatState = {
  ...createCombat({
    team: [tepig, pidgeotto, mawileMega, absol, greninja, rotomFrost],
    enemy: rattata,
    deck: STARTER_DECK,
    seed: 7,
  }),
  enemies: [rattata, spearow, zubat, ekans, sandshrew, machop],
};

const meta = {
  title: 'Combat/BattleStage',
  component: BattleStage,
  args: {
    state: canonical,
    dispatch: fn(),
    biome: 'meadow',
    time: 'midday',
    weather: 'clear',
  },
  // Biome / time / weather are the bg axes — exposed as select controls instead of
  // one story per combination. WEATHERS includes `clear` (no overlay) so the same
  // control toggles "no weather" without a separate story.
  argTypes: {
    biome: { control: { type: 'select' }, options: BIOMES },
    time: { control: { type: 'select' }, options: TIMES_OF_DAY },
    weather: { control: { type: 'select' }, options: WEATHERS },
  },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof BattleStage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Canonical mid-fight state: 6v6, an enemy telegraphing an attack on the active
 *  ally, statuses already on the player's lead. Tweak biome / time / weather via
 *  the Controls panel — no per-variant stories needed. */
export const Default: Story = {};

/** End-state — the player won; UI locks to non-interactive. */
export const Victory: Story = {
  args: {
    state: {
      ...canonical,
      outcome: 'win',
      enemies: canonical.enemies.map((e) => ({ ...e, hp: 0 })),
    },
  },
};

/** End-state — the player lost. */
export const Defeat: Story = {
  args: {
    state: {
      ...canonical,
      outcome: 'lose',
      team: canonical.team.map((m) => ({ ...m, hp: 0 })),
    },
  },
};

/** Legendary boss encounter — single Mewtwo at high HP, drives the bg/weather pick
 *  for "final-room" vibes. The Solo-mon mode lands later (G6); for now this just
 *  exercises the single-foe layout against the full-team layout above. */
export const LegendaryFoe: Story = {
  args: {
    state: createCombat({
      team: [tepig, pidgeotto, mawileMega, absol, greninja, rotomFrost],
      enemy: pokemon({
        speciesId: 150,
        name: 'Mewtwo',
        speciesSlug: 'mewtwo',
        types: ['psychic'],
        level: 70,
        baseStats: { hp: 106, atk: 110, def: 90, spAtk: 154, spDef: 90, spd: 130 },
        catchRate: 3,
        maxHp: 320,
        hp: 320,
      }),
      deck: STARTER_DECK,
      seed: 1,
    }),
    time: 'night',
  },
};
