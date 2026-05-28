import type { Meta, StoryObj } from '@storybook/react-vite';
import { EnergyBar } from './EnergyBar';

const meta = {
  title: 'Primitives/EnergyBar',
  component: EnergyBar,
  args: { current: 2, max: 3 },
  parameters: { backgrounds: { value: 'dark' } },
} satisfies Meta<typeof EnergyBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Free: Story = { args: { current: 0, max: 3 } };
export const Full: Story = { args: { current: 3, max: 3 } };
export const OnePoint: Story = { args: { current: 1, max: 3 } };
