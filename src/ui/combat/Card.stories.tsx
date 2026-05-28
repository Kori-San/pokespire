import type { Meta, StoryObj } from '@storybook/react-vite';
import type {
  BallTier,
  CardDef,
  CardKind,
  Effect,
  MoveCategory,
  PokeType,
  Rarity,
  StatusId,
  WeatherKind,
} from '@/types';
import { POKE_TYPES } from '@/types';
import { CARDS } from '@/data/cards';
import type { ComputedCardView, Effectiveness } from '@/game/combat/selectors';
import { Card } from './Card';

const ember: CardDef = {
  id: 'ember',
  name: 'EMBER',
  type: 'fire',
  cost: 1,
  kind: 'ATK',
  category: 'special',
  rarity: 'uncommon',
  effects: [
    { kind: 'damage', amount: 8 },
    { kind: 'applyStatus', target: 'foe', status: 'burn', stacks: 1 },
  ],
};

const pokeBall: CardDef = {
  id: 'pokeBall',
  name: 'POKÉ BALL',
  type: 'normal',
  cost: 1,
  kind: 'BALL',
  category: 'status',
  rarity: 'common',
  effects: [{ kind: 'capture', ballTier: 'poke' }],
};

const damageView: ComputedCardView = {
  cardId: 'ember',
  cost: 1,
  affordable: true,
  damage: {
    value: 12,
    effectiveness: 'neutral',
    stab: true,
    tooltip: '8 base ×1.25 STAB ×1.0 lvl = 12',
  },
};

const meta = {
  title: 'Combat/Card',
  component: Card,
  args: { card: ember, view: damageView },
  parameters: { backgrounds: { value: 'grass' } },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Attack: Story = {};
export const Unaffordable: Story = { args: { view: { ...damageView, affordable: false } } };
export const CaptureBall: Story = {
  args: {
    card: pokeBall,
    view: { cardId: 'pokeBall', cost: 1, affordable: true, capturePercent: 42 },
  },
};

const CARD_KINDS = ['ATK', 'SKL', 'PWR', 'BALL', 'ITEM'] as const satisfies readonly CardKind[];
const CATEGORIES = ['physical', 'special', 'status'] as const satisfies readonly MoveCategory[];
const RARITIES = ['common', 'uncommon', 'rare', 'epic'] as const satisfies readonly Rarity[];
const EFFECT_KINDS = [
  'damage',
  'block',
  'heal',
  'draw',
  'applyStatus',
  'energy',
  'weather',
  'capture',
] as const satisfies readonly Effect['kind'][];
const STATUSES = ['burn', 'weak'] as const satisfies readonly StatusId[];
const WEATHERS = ['sun', 'rain', 'sand', 'hail'] as const satisfies readonly WeatherKind[];
const BALL_TIERS = ['poke', 'great', 'ultra', 'master'] as const satisfies readonly BallTier[];
const EFFECTIVENESS = [
  'super',
  'neutral',
  'resisted',
  'immune',
] as const satisfies readonly Effectiveness[];

interface PlaygroundArgs {
  id: string;
  name: string;
  type: PokeType;
  cost: number;
  kind: CardKind;
  category: MoveCategory;
  rarity: Rarity;
  effect: Effect['kind'];
  amount: number;
  count: number;
  stacks: number;
  status: StatusId;
  applyToSelf: boolean;
  weather: WeatherKind;
  turns: number;
  ballTier: BallTier;
  energyWhen: 'now' | 'nextTurn';
  riderBurn: boolean;
  affordable: boolean;
  computedDamage: number;
  effectiveness: Effectiveness;
  stab: boolean;
  capturePercent: number;
}

/**
 * Flat-controls workbench: set every card field from the Controls panel and watch the
 * rendered card update live. Use this to prototype new card data before adding it to
 * `src/data/cards.ts`.
 */
export const Playground: StoryObj<PlaygroundArgs> = {
  args: {
    id: 'ember',
    name: 'EMBER',
    type: 'fire',
    cost: 1,
    kind: 'ATK',
    category: 'special',
    rarity: 'uncommon',
    effect: 'damage',
    amount: 8,
    count: 1,
    stacks: 1,
    status: 'burn',
    applyToSelf: false,
    weather: 'sun',
    turns: 4,
    ballTier: 'poke',
    energyWhen: 'now',
    riderBurn: true,
    affordable: true,
    computedDamage: 12,
    effectiveness: 'neutral',
    stab: true,
    capturePercent: 42,
  },
  argTypes: {
    id: { control: 'text', description: 'i18n key — falls back to `name` if no translation' },
    name: { control: 'text' },
    type: { control: 'select', options: POKE_TYPES },
    cost: { control: { type: 'number', min: 0, max: 3, step: 1 } },
    kind: { control: 'select', options: CARD_KINDS },
    category: { control: 'inline-radio', options: CATEGORIES },
    rarity: { control: 'inline-radio', options: RARITIES },
    effect: { control: 'select', options: EFFECT_KINDS },
    amount: { control: { type: 'number', min: 0, max: 50, step: 1 } },
    count: { control: { type: 'number', min: 1, max: 5, step: 1 } },
    stacks: { control: { type: 'number', min: 1, max: 5, step: 1 } },
    status: { control: 'select', options: STATUSES },
    applyToSelf: { control: 'boolean' },
    weather: { control: 'select', options: WEATHERS },
    turns: { control: { type: 'number', min: 1, max: 8, step: 1 } },
    ballTier: { control: 'select', options: BALL_TIERS },
    energyWhen: { control: 'inline-radio', options: ['now', 'nextTurn'] },
    riderBurn: {
      control: 'boolean',
      description: 'Add a "1 BURN to foe" rider after the primary effect',
    },
    affordable: { control: 'boolean' },
    computedDamage: { control: { type: 'number', min: 0, max: 99, step: 1 } },
    effectiveness: { control: 'inline-radio', options: EFFECTIVENESS },
    stab: { control: 'boolean' },
    capturePercent: { control: { type: 'number', min: 0, max: 100, step: 1 } },
  },
  render: (args) => {
    const effects: Effect[] = [buildEffect(args)];
    if (args.riderBurn && args.effect === 'damage') {
      effects.push({ kind: 'applyStatus', target: 'foe', status: 'burn', stacks: 1 });
    }
    const card: CardDef = {
      id: args.id,
      name: args.name,
      type: args.type,
      cost: args.cost,
      kind: args.kind,
      category: args.category,
      rarity: args.rarity,
      effects,
    };
    const view: ComputedCardView = {
      cardId: args.id,
      cost: args.cost,
      affordable: args.affordable,
      ...(args.effect === 'damage' && {
        damage: {
          value: args.computedDamage,
          effectiveness: args.effectiveness,
          stab: args.stab,
          tooltip: `${args.amount} base × … = ${args.computedDamage}`,
        },
      }),
      ...(args.effect === 'capture' && { capturePercent: args.capturePercent }),
    };
    return <Card card={card} view={view} />;
  },
};

function buildEffect(a: PlaygroundArgs): Effect {
  switch (a.effect) {
    case 'damage':
      return { kind: 'damage', amount: a.amount };
    case 'block':
      return { kind: 'block', amount: a.amount };
    case 'heal':
      return { kind: 'heal', amount: a.amount };
    case 'draw':
      return { kind: 'draw', count: a.count };
    case 'applyStatus':
      return {
        kind: 'applyStatus',
        target: a.applyToSelf ? 'self' : 'foe',
        status: a.status,
        stacks: a.stacks,
      };
    case 'energy':
      return { kind: 'energy', amount: a.amount, when: a.energyWhen };
    case 'weather':
      return { kind: 'weather', weather: a.weather, turns: a.turns };
    case 'capture':
      return { kind: 'capture', ballTier: a.ballTier };
  }
}

/**
 * The full starter pool from `src/data/cards.ts`, side-by-side. Useful for spotting layout
 * regressions across every type tint, kind badge, cost, and effect mix in a single glance.
 */
export const Gallery: StoryObj = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: 16,
        padding: 16,
      }}
    >
      {Object.values(CARDS).map((card) => {
        const dmg = card.effects.find((e) => e.kind === 'damage');
        const cap = card.effects.find((e) => e.kind === 'capture');
        const view: ComputedCardView = {
          cardId: card.id,
          cost: card.cost,
          affordable: true,
          ...(dmg?.kind === 'damage' && {
            damage: {
              value: dmg.amount,
              effectiveness: 'neutral',
              stab: false,
              tooltip: `${dmg.amount} base`,
            },
          }),
          ...(cap?.kind === 'capture' && { capturePercent: 50 }),
        };
        return <Card key={card.id} card={card} view={view} />;
      })}
    </div>
  ),
};
