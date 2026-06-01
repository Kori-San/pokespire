import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import type { Combatant } from '@/types';
import { EMPTY_STAGES } from '@/types';
import { PartyCluster } from './PartyCluster';

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

const charmander = pokemon({ statuses: [{ id: 'burn', stacks: 1 }] });
const squirtle = pokemon({ speciesId: 7, name: 'Squirtle', types: ['water'] });
const bulbasaur = pokemon({ speciesId: 1, name: 'Bulbasaur', types: ['grass', 'poison'] });
const pikachu = pokemon({ speciesId: 25, name: 'Pikachu', types: ['electric'] });
const eevee = pokemon({ speciesId: 133, name: 'Eevee', types: ['normal'] });
const pidgey = pokemon({ speciesId: 16, name: 'Pidgey', types: ['normal', 'flying'] });

const rattata = pokemon({
  speciesId: 19,
  name: 'Rattata',
  speciesSlug: 'rattata',
  types: ['normal'],
  maxHp: 28,
  hp: 28,
});
const spearow = pokemon({
  speciesId: 21,
  name: 'Spearow',
  speciesSlug: 'spearow',
  types: ['normal', 'flying'],
  maxHp: 26,
  hp: 26,
});
const zubat = pokemon({ speciesId: 41, name: 'Zubat', types: ['poison', 'flying'] });
const ekans = pokemon({
  speciesId: 23,
  name: 'Ekans',
  speciesSlug: 'ekans',
  types: ['poison'],
  statuses: [{ id: 'paralyze', stacks: 1 }],
});
const sandshrew = pokemon({ speciesId: 27, name: 'Sandshrew', types: ['ground'] });
const machop = pokemon({ speciesId: 66, name: 'Machop', types: ['fighting'] });

const allyTeam = [charmander, squirtle, bulbasaur, pikachu, eevee, pidgey];
const foeTeam = [rattata, spearow, zubat, ekans, sandshrew, machop];

const meta = {
  title: 'Combat/PartyCluster',
  component: PartyCluster,
  args: {
    team: allyTeam,
    activeIndex: 0,
    side: 'left',
    onSwitch: fn(),
    // Canonical "one ally taking heat from two foes" — flip via Controls to compare
    // spread targeting, fully-untargeted, etc.
    targetedBy: [2, 0, 0, 0, 0, 0],
  },
  argTypes: {
    side: { control: { type: 'inline-radio' }, options: ['left', 'right'] },
    activeIndex: { control: { type: 'number', min: 0, max: 5, step: 1 } },
  },
  parameters: { backgrounds: { value: 'grass' } },
  // The cluster's own box is 260×230, but per-slot tooltips fly to the side
  // (~280 px of stats bubble + keyword column). In the scene that lives in
  // `.scene`'s empty centre field; in isolation we mimic the same headroom with
  // generous side padding so tooltips render in full — story-environment CSS,
  // never part of the component itself.
  decorators: [
    (Story) => (
      <div style={{ padding: '32px 320px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PartyCluster>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Full player party — six slots, active glow on slot 0, one ally targeted (×2 chip). */
export const Player: Story = {};

/** Full enemy party — every foe telegraphs an intent with the targeted ally's mini
 *  sprite. Defend self-targets so no sprite. Onclick is suppressed (enemies aren't
 *  switchable). */
export const Enemy: Story = {
  args: {
    team: foeTeam,
    side: 'right',
    intents: [
      { kind: 'attack', amount: 9, targetIndex: 0 },
      { kind: 'defend', amount: 8 },
      { kind: 'attack', amount: 5, targetIndex: 1 },
      { kind: 'status', status: { id: 'burn', stacks: 2 }, targetIndex: 0 },
      { kind: 'attack', amount: 12, targetIndex: 2 },
      { kind: 'attack', amount: 6, targetIndex: 0 },
    ],
    intentTargets: [charmander, undefined, squirtle, charmander, bulbasaur, charmander],
  },
};
