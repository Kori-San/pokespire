import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Combatant } from '@/types';
import { EMPTY_STAGES } from '@/types';
import { MonSprite } from './MonSprite';

function fakeMon(overrides: Partial<Combatant> = {}): Combatant {
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
    ...overrides,
  };
}

const meta = {
  title: 'Primitives/MonSprite',
  component: MonSprite,
  args: { mon: fakeMon() },
  parameters: { backgrounds: { value: 'grass' } },
} satisfies Meta<typeof MonSprite>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Back: Story = { args: { facing: 'back' } };
export const Shiny: Story = { args: { mon: fakeMon({ shiny: true }) } };
export const HighLevel: Story = { args: { mon: fakeMon({ level: 50 }) } };
export const Legendary: Story = {
  args: {
    mon: fakeMon({
      speciesId: 150,
      name: 'Mewtwo',
      types: ['psychic'],
      level: 70,
      baseStats: { hp: 106, atk: 110, def: 90, spAtk: 154, spDef: 90, spd: 130 },
      catchRate: 3,
    }),
  },
};
export const MissingnoFallback: Story = {
  args: { mon: fakeMon({ name: 'NotASpecies' }) },
};
