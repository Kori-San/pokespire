import type { Combatant, MoveCategory, PokeType, Weather } from '@/types';
import { typeEffectiveness } from '@/data/typeChart';

export const STAB_MULTIPLIER = 1.25;
export const IMMUNITY_FLOOR = 0.25;
export const WEAK_MULTIPLIER = 0.75;
const STAT_BASELINE = 75;
const STAT_CLAMP_MIN = 0.7;
const STAT_CLAMP_MAX = 1.5;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export const levelScale = (level: number) => 0.5 + level * 0.05;
export const atkScale = (baseAtk: number) =>
  clamp(baseAtk / STAT_BASELINE, STAT_CLAMP_MIN, STAT_CLAMP_MAX);
export const defScale = (baseDef: number) =>
  clamp(STAT_BASELINE / baseDef, STAT_CLAMP_MIN, STAT_CLAMP_MAX);

export function weatherMultiplier(cardType: PokeType, weather: Weather | null): number {
  if (!weather) return 1;
  switch (weather.kind) {
    case 'sun':
      if (cardType === 'fire') return 1.5;
      if (cardType === 'water') return 0.5;
      return 1;
    case 'rain':
      if (cardType === 'water') return 1.5;
      if (cardType === 'fire') return 0.5;
      return 1;
    case 'sand':
      return cardType === 'rock' || cardType === 'ground' || cardType === 'steel' ? 1.2 : 1;
    case 'hail':
      return cardType === 'ice' ? 1.2 : 1;
  }
}

export interface DamageBreakdown {
  base: number;
  stab: number;
  /** Raw type multiplier the player sees (0 means immune). */
  rawEff: number;
  /** Effectiveness used in the math (immunities floored so cards still chip). */
  eff: number;
  immune: boolean;
  weakMod: number;
  weatherMod: number;
  itemMod: number;
  levelScale: number;
  atkScale: number;
  defScale: number;
  final: number;
}

export interface DamageParams {
  amount: number;
  cardType: PokeType;
  /**
   * Selects which stat pair the formula reads. `physical` → attacker.atk / defender.def;
   * `special` → attacker.spAtk / defender.spDef. `status` cards don't deal damage and
   * never reach this function — but the type is permitted so callers can pass `card.category`
   * directly without narrowing.
   */
  category: MoveCategory;
  attacker: Combatant;
  defender: Combatant;
  weather?: Weather | null;
  /** Held-item post-multiplier (Part 5); defaults to 1. */
  itemMod?: number;
}

export function calcDamage({
  amount,
  cardType,
  category,
  attacker,
  defender,
  weather = null,
  itemMod = 1,
}: DamageParams): DamageBreakdown {
  const stab = attacker.types.includes(cardType) ? STAB_MULTIPLIER : 1;
  const rawEff = typeEffectiveness(cardType, defender.types);
  const immune = rawEff === 0;
  const eff = immune ? IMMUNITY_FLOOR : rawEff;
  const weakMod = attacker.statuses.some((s) => s.id === 'weak') ? WEAK_MULTIPLIER : 1;
  const weatherMod = weatherMultiplier(cardType, weather);
  const lvl = levelScale(attacker.level);
  const atkStat = category === 'special' ? attacker.baseStats.spAtk : attacker.baseStats.atk;
  const defStat = category === 'special' ? defender.baseStats.spDef : defender.baseStats.def;
  const atk = atkScale(atkStat);
  const def = defScale(defStat);

  const product = amount * stab * eff * weakMod * weatherMod * itemMod * lvl * atk * def;
  const final = amount > 0 ? Math.max(1, Math.round(product)) : 0;

  return {
    base: amount,
    stab,
    rawEff,
    eff,
    immune,
    weakMod,
    weatherMod,
    itemMod,
    levelScale: lvl,
    atkScale: atk,
    defScale: def,
    final,
  };
}
