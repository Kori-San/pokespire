import type { StatusId, StatusInstance } from '@/types';

export interface StatusDef {
  id: StatusId;
  name: string;
  /** End-of-turn damage to the holder, per stack. */
  tickDamagePerStack: number;
}

export const STATUS_DEFS: Record<StatusId, StatusDef> = {
  burn: { id: 'burn', name: 'Burn', tickDamagePerStack: 2 },
  poison: { id: 'poison', name: 'Poison', tickDamagePerStack: 3 },
  weak: { id: 'weak', name: 'Weak', tickDamagePerStack: 0 },
  sleep: { id: 'sleep', name: 'Sleep', tickDamagePerStack: 0 },
  paralyze: { id: 'paralyze', name: 'Paralyze', tickDamagePerStack: 0 },
  freeze: { id: 'freeze', name: 'Freeze', tickDamagePerStack: 0 },
};

/** Merge `amount` stacks of `id` into a status list (immutably). */
export function applyStatus(
  statuses: StatusInstance[],
  id: StatusId,
  amount: number,
): StatusInstance[] {
  const existing = statuses.find((s) => s.id === id);
  if (existing) {
    return statuses.map((s) => (s.id === id ? { ...s, stacks: s.stacks + amount } : s));
  }
  return [...statuses, { id, stacks: amount }];
}
