import { cx } from '@/ui/cx';
import styles from './EnergyPip.module.css';

interface EnergyPipProps {
  lit: boolean;
}

/**
 * A single GBA-flavored slanted energy bar. `lit = true` → electric yellow, `lit = false`
 * → gray placeholder. Used on hand cards to print cost and in the combat HUD to print
 * remaining energy this turn.
 */
export function EnergyPip({ lit }: EnergyPipProps) {
  return <span aria-hidden="true" className={cx(styles.pip, lit && styles.lit)} />;
}
