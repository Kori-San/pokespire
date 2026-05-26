import type { CSSProperties, ReactNode } from 'react';
import { cx } from '@/ui/cx';
import styles from './Box.module.css';

interface BoxProps {
  children: ReactNode;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

export function Box({ children, className, style }: BoxProps) {
  return (
    <div className={cx(styles.box, className)} style={style}>
      {children}
    </div>
  );
}
