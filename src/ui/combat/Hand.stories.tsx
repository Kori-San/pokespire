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

const meta = {
  title: 'Combat/Hand',
  component: Hand,
  args: {
    hand: openingHand,
    views: openingHand.map((id) => viewFor(id)),
    onPlay: fn(),
  },
  // Hand is intrinsically a fan: rotated cards at the edges extend ~80px above
  // the component's own box, and hover lifts the active card another 28px. In the
  // real scene `.handArea` is anchored to `.scene`'s bottom edge and the fan
  // breathes upward into the play field. Here we replicate that headroom with a
  // story-only decorator so the rotated tops + hover lift aren't clipped — the
  // padding is the *story environment*, not part of the component contract.
  decorators: [
    (Story) => (
      <div style={{ paddingTop: 140, paddingBottom: 16 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Hand>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Canonical opening hand — five mixed-type cards, all affordable. */
export const Default: Story = {};

/** Mid-turn after spending energy — some cards become unaffordable (grayscaled,
 *  un-hoverable lift). Distinct visual state, kept as its own story. */
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
