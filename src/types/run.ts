import type { BallTier } from './cards';

/**
 * The trainer's persistent **inventory** — meta-layer counters that survive across
 * combats and get touched at shops and post-battle prompts. Distinct from the deck
 * (which is moves only): captures, healing, X-Items and berries are RESOURCES the
 * trainer prepares ahead of time, not RNG-shuffled cards.
 *
 * See [planning/05_inventory-redesign.md](../../planning/05_inventory-redesign.md)
 * for the design rationale (capture-spam decks, healing-as-RNG, action economy at
 * 6v6). Schema is flat-counters for now — when held-items land in v1, berries
 * migrate to a per-mon held slot and this shape gains a `heldItems` field.
 */
export interface Inventory {
  /** Capture consumables. Picked at end of battle when the reward chosen is "try to capture". */
  balls: Record<BallTier, number>;
  /**
   * Healing consumables — used in-combat from a side menu, or at rest sites. Restore
   * amounts: 20 / 50 / 200 / full. Buyable at shops.
   */
  potions: {
    potion: number;
    super: number;
    hyper: number;
    max: number;
  };
  /**
   * Stat-stage boosters — used in-combat from a side menu, one stage to the active mon,
   * lasts the battle. `hit` is the crit-stage booster (canonical "Dire Hit" / "Critik+").
   */
  xItems: {
    attack: number;
    defend: number;
    speed: number;
    hit: number;
  };
  /**
   * Berries — counted in the trainer's pouch for v0. When held-items lands in v1,
   * these will move to a per-mon held-item slot.
   */
  berries: {
    sitrus: number;
    lum: number;
    chesto: number;
    liechi: number;
  };
  /** Currency for shop purchases. */
  gold: number;
}

/**
 * Fresh-run inventory — Day-0 trainer kit. 5 Poké Balls + 2 standard Potions + 50 gold;
 * no rare items yet (those drop / get bought through the run).
 */
export function freshInventory(): Inventory {
  return {
    balls: { poke: 5, great: 0, ultra: 0, master: 0 },
    potions: { potion: 2, super: 0, hyper: 0, max: 0 },
    xItems: { attack: 0, defend: 0, speed: 0, hit: 0 },
    berries: { sitrus: 0, lum: 0, chesto: 0, liechi: 0 },
    gold: 50,
  };
}
