import type { Meta, StoryObj } from '@storybook/react-vite';
import { EnergyPip } from './EnergyPip';

const meta = {
  title: 'Primitives/EnergyPip',
  component: EnergyPip,
  args: { lit: true },
  parameters: { backgrounds: { value: 'dark' } },
} satisfies Meta<typeof EnergyPip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Lit: Story = {};
export const Empty: Story = { args: { lit: false } };
