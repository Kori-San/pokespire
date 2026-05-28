import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Intent } from '@/types';
import { IntentBadge } from './IntentBadge';

const meta = {
  title: 'Primitives/IntentBadge',
  component: IntentBadge,
  args: { intent: { kind: 'attack', amount: 12 } satisfies Intent },
  parameters: { backgrounds: { value: 'grass' } },
} satisfies Meta<typeof IntentBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Attack: Story = {};
export const HeavyAttack: Story = { args: { intent: { kind: 'attack', amount: 24 } } };
export const Defend: Story = { args: { intent: { kind: 'defend', amount: 8 } } };
export const StatusBurn: Story = {
  args: { intent: { kind: 'status', status: { id: 'burn', stacks: 2 } } },
};
export const StatusWeak: Story = {
  args: { intent: { kind: 'status', status: { id: 'weak', stacks: 1 } } },
};
