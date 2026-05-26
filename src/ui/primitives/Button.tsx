import type { ButtonHTMLAttributes } from 'react';
import { cx } from '@/ui/cx';
import styles from './Button.module.css';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost';
};

export function Button({ variant = 'primary', className, ...rest }: ButtonProps) {
  return <button className={cx(styles.button, styles[variant], className)} {...rest} />;
}
