import type { Meta, StoryObj } from '@storybook/react-vite';
import { POKE_TYPES } from '@/types';
import { TypeChip } from './TypeChip';

const meta = {
  title: 'Primitives/TypeChip',
  component: TypeChip,
  args: { type: 'fire' },
} satisfies Meta<typeof TypeChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Fire: Story = {};
export const Water: Story = { args: { type: 'water' } };

export const AllTypes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxWidth: 320 }}>
      {POKE_TYPES.map((t) => (
        <TypeChip key={t} type={t} />
      ))}
    </div>
  ),
};
