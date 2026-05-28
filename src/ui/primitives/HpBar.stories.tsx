import type { Meta, StoryObj } from '@storybook/react-vite';
import { HpBar } from './HpBar';

const meta = {
  title: 'Primitives/HpBar',
  component: HpBar,
  args: { hp: 80, maxHp: 100 },
  parameters: { backgrounds: { value: 'dark' } },
} satisfies Meta<typeof HpBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const High: Story = {};
export const Mid: Story = { args: { hp: 40, maxHp: 100 } };
export const Low: Story = { args: { hp: 12, maxHp: 100 } };
export const Empty: Story = { args: { hp: 0, maxHp: 100 } };
