import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Combatant } from '@/types';
import { EMPTY_STAGES } from '@/types';
import { fn } from 'storybook/test';
import { PartyBar } from './PartyBar';

function fakeMon(overrides: Partial<Combatant> = {}): Combatant {
  return {
    speciesId: 1,
    name: 'Bulbasaur',
    types: ['grass'],
    level: 5,
    baseStats: { hp: 45, atk: 49, def: 49, spAtk: 65, spDef: 65, spd: 45 },
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

const charmander = fakeMon({ speciesId: 4, name: 'Charmander', types: ['fire'] });
const squirtle = fakeMon({ speciesId: 7, name: 'Squirtle', types: ['water'], hp: 18 });
const pikachu = fakeMon({ speciesId: 25, name: 'Pikachu', types: ['electric'], hp: 6 });
const rattata = fakeMon({ speciesId: 19, name: 'Rattata', types: ['normal'], hp: 0 });
const team: Combatant[] = [charmander, squirtle, pikachu, rattata];

const meta = {
  title: 'Primitives/PartyBar',
  component: PartyBar,
  args: { team, activeIndex: 0, onSwitch: fn() },
  parameters: { backgrounds: { value: 'sky' } },
} satisfies Meta<typeof PartyBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Solo: Story = { args: { team: [charmander], activeIndex: 0 } };
export const SixMons: Story = {
  args: {
    team: [
      ...team,
      fakeMon({ speciesId: 133, name: 'Eevee', types: ['normal'] }),
      fakeMon({ speciesId: 16, name: 'Pidgey', types: ['normal', 'flying'] }),
    ],
    activeIndex: 1,
  },
};
/** Bench tiles disabled (no `onSwitch`) — useful for screens where switching isn't legal. */
export const ReadOnly: StoryObj<typeof PartyBar> = {
  args: { team, activeIndex: 0 },
};
