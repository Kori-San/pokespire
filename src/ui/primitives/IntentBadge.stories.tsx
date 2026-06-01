import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Combatant, Intent } from '@/types';
import { EMPTY_STAGES } from '@/types';
import { IntentBadge } from './IntentBadge';

const target: Combatant = {
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
};

const meta = {
  title: 'Primitives/IntentBadge',
  component: IntentBadge,
  args: { intent: { kind: 'attack', amount: 12, targetIndex: 0 } satisfies Intent, target },
  parameters: { backgrounds: { value: 'grass' } },
} satisfies Meta<typeof IntentBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Attack telegraph — value + target mini-sprite (the foe's about to hit Charmander). */
export const Attack: Story = {};

/** Defend telegraph — value only, the foe self-buffs so no target sprite. */
export const Defend: Story = {
  args: { intent: { kind: 'defend', amount: 8 } },
};

/** Status telegraph — stacks + status icon + target mini-sprite. */
export const Status: Story = {
  args: {
    intent: { kind: 'status', status: { id: 'burn', stacks: 2 }, targetIndex: 0 },
  },
};

/** Mega Evolve telegraph — boss-tier; rainbow bar + mega mark + "MEGA" label. */
export const MegaEvolve: Story = {
  args: { intent: { kind: 'megaEvolve' } },
};

/** Dynamax telegraph — boss-tier; magenta bar + dmax mark + "DYNAMAX" label. */
export const Dynamax: Story = {
  args: { intent: { kind: 'dynamax' } },
};
