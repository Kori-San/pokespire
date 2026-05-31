import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import type { Combatant } from '@/types';
import { EMPTY_STAGES } from '@/types';
import { PokemonSlot } from './PokemonSlot';

function pokemon(overrides: Partial<Combatant> = {}): Combatant {
  return {
    speciesId: 4,
    name: 'Charmander',
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

const charmander = pokemon();
const rattata = pokemon({
  speciesId: 19,
  name: 'Rattata',
  types: ['normal'],
  maxHp: 28,
  hp: 28,
  statuses: [{ id: 'poison', stacks: 1 }],
});

const meta = {
  title: 'Combat/PokemonSlot',
  component: PokemonSlot,
  args: { pokemon: charmander, active: false, showActiveIndicator: true, targetedBy: 0 },
  argTypes: {
    active: { control: 'boolean' },
    showActiveIndicator: { control: 'boolean' },
    targetedBy: { control: { type: 'number', min: 0, max: 6, step: 1 } },
    tooltipPlacement: {
      control: { type: 'select' },
      options: ['top', 'bottom', 'left', 'right', 'bottomLeft', 'bottomRight'],
    },
  },
  parameters: { backgrounds: { value: 'grass' } },
  // Slot footprint is ~100×100 but the hover tooltip group flies ~280 px to the
  // side and the intent badge sits ~24 px above. Padding is story-environment
  // headroom, not part of the slot itself — in BattleStage the cluster + scene
  // provide this naturally.
  decorators: [
    (Story) => (
      <div style={{ padding: '48px 320px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PokemonSlot>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Player-side slot — toggle `active`, `targetedBy`, `onClick` via Controls to flip
 *  through every canonical ally state (active w/ chevron, bench w/ click, targeted
 *  w/ red pulse + count chip). */
export const Ally: Story = {
  args: {
    pokemon: pokemon({
      statuses: [
        { id: 'burn', stacks: 2 },
        { id: 'weak', stacks: 1 },
      ],
    }),
    active: true,
    onClick: fn(),
  },
};

/** Enemy-side slot — chevron suppressed, intent telegraph above the sprite, target
 *  mini-sprite inside the badge. Swap intent kind via Controls (`object` control)
 *  to compare attack / status; defend self-applies and shouldn't carry a target. */
export const Enemy: Story = {
  args: {
    pokemon: rattata,
    showActiveIndicator: false,
    intent: { kind: 'attack', amount: 7, targetIndex: 0 },
    intentTarget: charmander,
  },
};

/** Fainted ally — grayscaled, not switchable. Distinct enough to warrant its own
 *  story since `pokemon.hp` is nested and awkward to flip via the Controls panel. */
export const Fainted: Story = {
  args: { pokemon: pokemon({ hp: 0 }) },
};
