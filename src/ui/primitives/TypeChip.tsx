import type { PokeType } from '@/types';
import styles from './TypeChip.module.css';

interface TypeChipProps {
  type: PokeType;
}

export function TypeChip({ type }: TypeChipProps) {
  return (
    <span className={styles.chip} style={{ background: `var(--type-${type})` }}>
      {type.toUpperCase()}
    </span>
  );
}
