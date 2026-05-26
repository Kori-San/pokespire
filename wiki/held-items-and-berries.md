# Held items & berries

Each team member equips **one** held item. Items live in `data/heldItems.ts` with
lifecycle hooks (`onTurnStart | onCardPlay | onDamageTaken | onCapture | onSwitchIn`).
`TeamMember.equippedItem?: ItemId`. Effects compose with the damage formula as post-multipliers.

## v0 held-item set

| Item                                 | Effect                                                                           |
| ------------------------------------ | -------------------------------------------------------------------------------- |
| Choice Band                          | +30% damage on ATK cards; locks to one card type per battle (set by first card). |
| Leftovers                            | Heal 6% max HP at the start of each turn this mon is active.                     |
| Focus Sash                           | First lethal hit leaves 1 HP. Consumed.                                          |
| Charcoal / Mystic Water / Magnet / … | +20% damage on cards of the matching type. One per type.                         |
| Lucky Egg                            | +50% XP for this mon.                                                            |
| Quick Claw                           | 25%/turn: +1 energy this turn.                                                   |
| Amulet Coin                          | Gold rewards +30% while equipped.                                                |
| Eviolite                             | +50% defense scaling, only for non-fully-evolved species.                        |

## Berries (consumable subset)

Auto-trigger on a condition, single-use, then the slot empties.

| Berry        | Trigger            | Effect                      |
| ------------ | ------------------ | --------------------------- |
| Sitrus Berry | HP < 50%           | Restore 30% max HP.         |
| Lum Berry    | Any status applied | Cleanse all statuses.       |
| Chesto Berry | Sleep applied      | Cleanse Sleep.              |
| Liechi Berry | HP < 25%           | +30% damage rest of battle. |

Acquired from shops, rare reward nodes, occasional drops.
