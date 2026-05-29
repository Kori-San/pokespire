import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComputedCardView } from '@/game/combat/selectors';
import { CARDS, STARTER_DECK } from '@/data/cards';
import { fn } from 'storybook/test';
import { Hand } from './Hand';

function viewFor(cardId: string, opts: { affordable?: boolean } = {}): ComputedCardView {
  const card = CARDS[cardId];
  if (!card) throw new Error(`Unknown card id: ${cardId}`);
  const dmg = card.effects.find((e) => e.kind === 'damage' || e.kind === 'lifesteal');
  const cap = card.effects.find((e) => e.kind === 'capture');
  return {
    cardId,
    cost: card.cost,
    affordable: opts.affordable ?? true,
    ...(dmg && {
      damage: {
        value: dmg.amount,
        effectiveness: 'neutral',
        stab: false,
        tooltip: `${String(dmg.amount)} base`,
      },
    }),
    ...(cap?.kind === 'capture' && { capturePercent: 42 }),
  };
}

const openingHand = STARTER_DECK.slice(0, 5);
const openingViews = openingHand.map((id) => viewFor(id));

const meta = {
  title: 'Combat/Hand',
  component: Hand,
  args: { hand: openingHand, views: openingViews, onPlay: fn() },
  parameters: { backgrounds: { value: 'grass' } },
} satisfies Meta<typeof Hand>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Opening: Story = {};

export const SingleCard: Story = {
  args: { hand: ['ember'], views: [viewFor('ember')] },
};

export const FiveTypes: Story = {
  args: {
    hand: ['ember', 'waterGun', 'vineWhip', 'thunderShock', 'pokeBall'],
    views: ['ember', 'waterGun', 'vineWhip', 'thunderShock', 'pokeBall'].map((id) => viewFor(id)),
  },
};

export const SomeUnaffordable: Story = {
  args: {
    hand: ['tackle', 'doubleKick', 'greatBall', 'hyperBeam'],
    views: [
      viewFor('tackle', { affordable: true }),
      viewFor('doubleKick', { affordable: false }),
      viewFor('greatBall', { affordable: false }),
      viewFor('hyperBeam', { affordable: false }),
    ],
  },
};

export const ReadOnly: StoryObj<typeof Hand> = {
  args: { hand: openingHand, views: openingViews },
};
