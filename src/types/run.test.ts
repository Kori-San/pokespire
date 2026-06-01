import { describe, expect, it } from 'vitest';
import { freshInventory } from './run';

describe('freshInventory', () => {
  it('starts the trainer with 5 Poké Balls + 2 standard Potions + 50 gold', () => {
    const inv = freshInventory();
    expect(inv.balls.poke).toBe(5);
    expect(inv.balls.great).toBe(0);
    expect(inv.balls.ultra).toBe(0);
    expect(inv.balls.master).toBe(0);
    expect(inv.potions.potion).toBe(2);
    expect(inv.potions.super).toBe(0);
    expect(inv.gold).toBe(50);
  });

  it("returns a fresh object each call so state mutations don't bleed between runs", () => {
    const a = freshInventory();
    const b = freshInventory();
    a.balls.poke = 999;
    expect(b.balls.poke).toBe(5);
  });
});
