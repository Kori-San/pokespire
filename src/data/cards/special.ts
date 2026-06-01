import type { CardDef } from '@/types';

/**
 * Trans-type meta cards — these are NOT Normal-type cards even though their `type` field
 * is `'normal'` for STAB-formula symmetry. They sit in their own bucket so future relics
 * that boost the NORMAL_CARDS pool (Tackle / Hyper Voice / etc.) don't accidentally
 * touch Mega Evolution / Dynamax / future Z-Move / Tera cards.
 *
 * Visual identity comes from the `theme` field (`'mega'` rainbow conic border, `'dynamax'`
 * magenta aura) — see `Card.module.css`. Every card here is `exhaust: true` (canon: once
 * per battle for Mega Evolution, Dynamax, and Z-Moves) and epic rarity (reward / shop
 * tier only, never in the starter deck).
 */
export const SPECIAL_CARDS: CardDef[] = [
  {
    id: 'megaEvolve',
    name: 'MEGA EVOLVE',
    // Theme override paints the rainbow chrome; `type` only feeds the STAB formula —
    // Mega Evolution isn't a damaging card so STAB is moot.
    type: 'normal',
    cost: 2,
    kind: 'SKL',
    category: 'status',
    rarity: 'epic',
    theme: 'mega',
    // Canon mapping: Mega Evolution is once per battle (the trainer's Mega Stone activates
    // a single time per fight), so the card exhausts on play instead of being ephemeral
    // (which would burn the card from the run deck).
    exhaust: true,
    effects: [{ kind: 'megaEvolve' }],
  },
  {
    id: 'dynamax',
    name: 'DYNAMAX',
    // Same rationale as Mega — theme overrides the visual; `type: 'normal'` is just the
    // STAB scaffold (unused here, no damage effect).
    type: 'normal',
    cost: 2,
    kind: 'SKL',
    category: 'status',
    rarity: 'epic',
    theme: 'dynamax',
    // Canon: "utilisable une seule fois par combat" — once per battle, exhausts on play.
    exhaust: true,
    effects: [{ kind: 'dynamax' }],
  },
];
