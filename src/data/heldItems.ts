/**
 * Held-item registry — the StS-equivalent of "relics" in Pokespire.
 *
 * UI-only for now: the icon + display name + tooltip description are wired,
 * but no engine effects fire yet. When the combat reducer grows item lifecycle
 * hooks (`onTurnEnd`, `onCardPlay`, `onSwitchIn`, …) each entry below will
 * also point at the effect implementation.
 */
export interface HeldItemDef {
  id: HeldItemId;
  /** Asset basename under `public/sprites/items/{slug}.png`. */
  slug: string;
}

export type HeldItemId = 'leftovers' | 'flamePlate' | 'choiceBand';

export const HELD_ITEMS: Record<HeldItemId, HeldItemDef> = {
  leftovers: { id: 'leftovers', slug: 'leftovers' },
  flamePlate: { id: 'flamePlate', slug: 'flame-plate' },
  choiceBand: { id: 'choiceBand', slug: 'choice-band' },
};

export function heldItemIconUrl(id: HeldItemId): string {
  const def = HELD_ITEMS[id];
  return `/sprites/items/${def.slug}.png`;
}
