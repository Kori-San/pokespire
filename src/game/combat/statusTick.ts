import type { Combatant } from '@/types';
import { STATUS_DEFS } from '@/data/statuses';

export interface StatusTickResult {
  combatant: Combatant;
  damage: number;
}

/**
 * End-of-turn status resolution: applies tick damage (e.g. BURN) to the holder,
 * then decays every status by one stack and drops any that reach zero.
 */
export function tickStatuses(c: Combatant): StatusTickResult {
  let damage = 0;
  for (const s of c.statuses) {
    damage += STATUS_DEFS[s.id].tickDamagePerStack * s.stacks;
  }
  const hp = Math.max(0, c.hp - damage);
  const statuses = c.statuses
    .map((s) => ({ ...s, stacks: s.stacks - 1 }))
    .filter((s) => s.stacks > 0);
  return { combatant: { ...c, hp, statuses }, damage };
}
