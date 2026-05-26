import type { CSSProperties, ReactNode } from 'react';
import styles from './Box.module.css';

interface BoxProps {
  children: ReactNode;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

export function Box({ children, className, style }: BoxProps) {
  return (
    <div className={className ? `${styles.box} ${className}` : styles.box} style={style}>
      {children}
    </div>
  );
}
