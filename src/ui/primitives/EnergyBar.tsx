import { EnergyPip } from './EnergyPip';
import styles from './EnergyBar.module.css';

interface EnergyBarProps {
  /** Number of pips to light up (first N from the left). */
  current: number;
  /** Total slot count rendered. */
  max: number;
  /** Optional `aria-label` override; defaults to `"Energy {current} of {max}"`. */
  ariaLabel?: string;
}

/**
 * `max` slanted pips in a row, the first `current` lit. Drives card-cost display in the
 * hand (`current = card.cost`, `max = ENERGY_SLOTS`) and remaining-energy in the combat
 * HUD (`current = state.energy`, `max = state.maxEnergy`).
 */
export function EnergyBar({ current, max, ariaLabel }: EnergyBarProps) {
  return (
    <span
      role="img"
      aria-label={ariaLabel ?? `Energy ${String(current)} of ${String(max)}`}
      className={styles.row}
    >
      {Array.from({ length: max }, (_, i) => (
        <EnergyPip key={i} lit={i < current} />
      ))}
    </span>
  );
}
