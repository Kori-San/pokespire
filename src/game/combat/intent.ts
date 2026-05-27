import type { Combatant, Intent } from '@/types';

/**
 * Pick the enemy's next telegraphed intent. Simple weighted AI for the vertical slice:
 * mostly attacks (damage scales with level), sometimes defends or applies WEAK.
 * RNG is injected so the reducer stays deterministic.
 */
export function rollIntent(enemy: Combatant, rng: () => number): Intent {
  const roll = rng();
  if (roll < 0.7) {
    const amount = Math.round(4 + enemy.level * 0.6);
    return { kind: 'attack', amount };
  }
  if (roll < 0.85) {
    return { kind: 'defend', amount: 5 + Math.round(enemy.level * 0.3) };
  }
  return { kind: 'status', status: { id: 'weak', stacks: 1 } };
}
