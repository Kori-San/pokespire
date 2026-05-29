import type { Meta, StoryObj } from '@storybook/react-vite';
import type {
  BallTier,
  CardDef,
  CardKind,
  Effect,
  MoveCategory,
  PokeType,
  Rarity,
  Stat,
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
    tooltip: '8 base ×1.5 STAB ×1.0 lvl = 12',
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
  'lifesteal',
  'block',
  'heal',
  'draw',
  'applyStatus',
  'stat',
  'energy',
  'weather',
  'terrain',
  'freeSwitch',
  'capture',
] as const satisfies readonly Effect['kind'][];
const STATUSES = ['burn', 'weak'] as const satisfies readonly StatusId[];
const STATS = ['atk', 'def', 'spAtk', 'spDef', 'spd', 'crit'] as const satisfies readonly Stat[];
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
  lifestealPercent: number;
  count: number;
  stacks: number;
  status: StatusId;
  stat: Stat;
  stages: number;
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
    lifestealPercent: 50,
    count: 1,
    stacks: 1,
    status: 'burn',
    stat: 'atk',
    stages: 2,
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
    lifestealPercent: { control: { type: 'number', min: 0, max: 100, step: 5 } },
    count: { control: { type: 'number', min: 1, max: 5, step: 1 } },
    stacks: { control: { type: 'number', min: 1, max: 5, step: 1 } },
    status: { control: 'select', options: STATUSES },
    stat: { control: 'select', options: STATS },
    stages: { control: { type: 'number', min: -6, max: 6, step: 1 } },
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
    case 'lifesteal':
      return { kind: 'lifesteal', amount: a.amount, percent: a.lifestealPercent };
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
    case 'stat':
      return {
        kind: 'stat',
        target: a.applyToSelf ? 'self' : 'foe',
        stat: a.stat,
        stages: a.stages,
      };
    case 'energy':
      return { kind: 'energy', amount: a.amount, when: a.energyWhen };
    case 'weather':
      return { kind: 'weather', weather: a.weather, turns: a.turns };
    case 'terrain':
      // Storybook control doesn't expose terrain kind today; default to electric.
      return { kind: 'terrain', terrain: 'electric', turns: a.turns };
    case 'freeSwitch':
      return { kind: 'freeSwitch' };
    case 'capture':
      return { kind: 'capture', ballTier: a.ballTier };
  }
}

/**
 * Side-by-side scenarios that exercise every keyword chip the system can render — and
 * combinations players will actually meet in combat. Each card here is constructed inline
 * so the story stays decoupled from the live pool (renaming Ember tomorrow can't break it).
 */
export const KeywordShowcase: StoryObj = {
  parameters: { controls: { disable: true } },
  render: () => {
    interface Scenario {
      title: string;
      card: CardDef;
      view: ComputedCardView;
    }

    function scenario(title: string, card: CardDef, view: ComputedCardView): Scenario {
      return { title, card, view };
    }

    function dmgView(
      base: number,
      eff: Effectiveness,
      stab: boolean,
      multiplier: number,
    ): ComputedCardView {
      const value = Math.max(1, Math.round(base * multiplier));
      return {
        cardId: 'demo',
        cost: 1,
        affordable: true,
        damage: { value, effectiveness: eff, stab, tooltip: `${String(base)} base` },
      };
    }

    const base = (overrides: Partial<CardDef>): CardDef => ({
      id: 'demo',
      name: 'DEMO',
      type: 'fire',
      cost: 1,
      kind: 'ATK',
      category: 'special',
      rarity: 'uncommon',
      effects: [{ kind: 'damage', amount: 10 }],
      ...overrides,
    });

    const scenarios: Scenario[] = [
      // ── Effectiveness tiers ───────────────────────────────────────────────────────
      scenario(
        'STAB only',
        base({ id: 'ember', name: 'EMBER', effects: [{ kind: 'damage', amount: 10 }] }),
        dmgView(10, 'neutral', true, 1.5),
      ),
      scenario(
        'STAB + SUPER',
        base({ id: 'ember', name: 'EMBER', effects: [{ kind: 'damage', amount: 10 }] }),
        dmgView(10, 'super', true, 1.5 * 2),
      ),
      scenario(
        'STAB + RESISTED',
        base({ id: 'ember', name: 'EMBER', effects: [{ kind: 'damage', amount: 10 }] }),
        dmgView(10, 'resisted', true, 1.5 * 0.5),
      ),
      scenario(
        'STAB + IMMUNE',
        base({ id: 'ember', name: 'EMBER', effects: [{ kind: 'damage', amount: 10 }] }),
        dmgView(10, 'immune', true, 1.5 * 0.25),
      ),
      scenario(
        'No STAB, SUPER',
        base({ id: 'demo', name: 'WRONG TYPE', effects: [{ kind: 'damage', amount: 10 }] }),
        dmgView(10, 'super', false, 2),
      ),

      // ── Single-keyword examples ──────────────────────────────────────────────────
      scenario(
        'Burn rider',
        base({
          id: 'ember',
          name: 'EMBER',
          effects: [
            { kind: 'damage', amount: 8 },
            { kind: 'applyStatus', target: 'foe', status: 'burn', stacks: 1 },
          ],
        }),
        dmgView(8, 'neutral', true, 1.5),
      ),
      scenario(
        'Poison rider',
        base({
          id: 'poisonJab',
          name: 'POISON JAB',
          type: 'poison',
          category: 'physical',
          effects: [
            { kind: 'damage', amount: 12 },
            { kind: 'applyStatus', target: 'foe', status: 'poison', stacks: 2 },
          ],
        }),
        dmgView(12, 'neutral', false, 1),
      ),
      scenario(
        'Crit +1',
        base({
          id: 'stoneEdge',
          name: 'STONE EDGE',
          type: 'rock',
          category: 'physical',
          cost: 3,
          rarity: 'rare',
          effects: [{ kind: 'damage', amount: 22, critBoost: 1 }],
        }),
        dmgView(22, 'neutral', false, 1),
      ),
      scenario(
        'Recoil 33%',
        base({
          id: 'braveBird',
          name: 'BRAVE BIRD',
          type: 'flying',
          category: 'physical',
          cost: 3,
          rarity: 'rare',
          effects: [{ kind: 'damage', amount: 26, recoilPercent: 33 }],
        }),
        dmgView(26, 'neutral', false, 1),
      ),
      scenario(
        'Lifesteal 75%',
        base({
          id: 'drainingKiss',
          name: 'DRAINING KISS',
          type: 'fairy',
          rarity: 'rare',
          effects: [{ kind: 'lifesteal', amount: 10, percent: 75 }],
        }),
        dmgView(10, 'neutral', false, 1),
      ),
      scenario(
        'Switch',
        base({
          id: 'uTurn',
          name: 'U-TURN',
          type: 'bug',
          category: 'physical',
          cost: 2,
          rarity: 'rare',
          effects: [{ kind: 'damage', amount: 14 }, { kind: 'freeSwitch' }],
        }),
        dmgView(14, 'neutral', false, 1),
      ),
      scenario(
        'Sleep status',
        base({
          id: 'spore',
          name: 'SPORE',
          type: 'grass',
          kind: 'SKL',
          category: 'status',
          cost: 2,
          rarity: 'epic',
          effects: [{ kind: 'applyStatus', target: 'foe', status: 'sleep', stacks: 3 }],
        }),
        { cardId: 'spore', cost: 2, affordable: true },
      ),
      scenario(
        'Paralyze status',
        base({
          id: 'thunderWave',
          name: 'THUNDER WAVE',
          type: 'electric',
          kind: 'SKL',
          category: 'status',
          rarity: 'rare',
          effects: [{ kind: 'applyStatus', target: 'foe', status: 'paralyze', stacks: 3 }],
        }),
        { cardId: 'thunderWave', cost: 1, affordable: true },
      ),

      // ── Stacked keywords ─────────────────────────────────────────────────────────
      scenario(
        'STAB + Crit + Recoil',
        base({
          id: 'flareBlitz',
          name: 'FLARE BLITZ',
          category: 'physical',
          cost: 3,
          rarity: 'rare',
          effects: [
            { kind: 'damage', amount: 26, critBoost: 1, recoilPercent: 33 },
            { kind: 'applyStatus', target: 'foe', status: 'burn', stacks: 1 },
          ],
        }),
        dmgView(26, 'neutral', true, 1.5),
      ),
      scenario(
        'STAB + SUPER + Lifesteal',
        base({
          id: 'gigaDrain',
          name: 'GIGA DRAIN',
          type: 'grass',
          cost: 2,
          rarity: 'rare',
          effects: [{ kind: 'lifesteal', amount: 16, percent: 50 }],
        }),
        dmgView(16, 'super', true, 1.5 * 2),
      ),
      scenario(
        'Quad-stack chaos',
        base({
          id: 'demo',
          name: 'CHAOS PUNCH',
          type: 'fighting',
          category: 'physical',
          cost: 3,
          rarity: 'epic',
          effects: [
            { kind: 'lifesteal', amount: 20, percent: 50, critBoost: 2, recoilPercent: 25 },
            { kind: 'applyStatus', target: 'foe', status: 'burn', stacks: 2 },
          ],
        }),
        dmgView(20, 'super', true, 1.5 * 2),
      ),

      // ── Card-kind aura: Exhaust ──────────────────────────────────────────────────
      scenario(
        'Exhaust (BALL)',
        base({
          id: 'ultraBall',
          name: 'ULTRA BALL',
          type: 'normal',
          kind: 'BALL',
          category: 'status',
          cost: 2,
          rarity: 'rare',
          effects: [{ kind: 'capture', ballTier: 'ultra' }],
        }),
        { cardId: 'ultraBall', cost: 2, affordable: true, capturePercent: 62 },
      ),
      scenario(
        'Exhaust (ITEM)',
        base({
          id: 'hyperPotion',
          name: 'HYPER POTION',
          type: 'normal',
          kind: 'ITEM',
          category: 'status',
          cost: 2,
          rarity: 'rare',
          effects: [{ kind: 'heal', amount: 60 }],
        }),
        { cardId: 'hyperPotion', cost: 2, affordable: true },
      ),

      // ── Unaffordable + disabled treatment ────────────────────────────────────────
      scenario(
        'Unaffordable',
        base({ id: 'doubleKick', name: 'DOUBLE KICK', cost: 2, category: 'physical' }),
        { ...dmgView(14, 'neutral', false, 1), affordable: false },
      ),
    ];

    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 24,
          padding: 16,
        }}
      >
        {scenarios.map((s) => (
          <div key={s.title} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 8,
                color: 'var(--text-light)',
                textAlign: 'center',
                letterSpacing: '0.5px',
              }}
            >
              {s.title}
            </div>
            <Card card={s.card} view={s.view} />
          </div>
        ))}
      </div>
    );
  },
};

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
        const dmg = card.effects.find((e) => e.kind === 'damage' || e.kind === 'lifesteal');
        const cap = card.effects.find((e) => e.kind === 'capture');
        const view: ComputedCardView = {
          cardId: card.id,
          cost: card.cost,
          affordable: true,
          ...(dmg && {
            damage: {
              value: dmg.amount,
              effectiveness: 'neutral',
              stab: false,
              tooltip: `${String(dmg.amount)} base`,
            },
          }),
          ...(cap?.kind === 'capture' && { capturePercent: 50 }),
        };
        return <Card key={card.id} card={card} view={view} />;
      })}
    </div>
  ),
};
