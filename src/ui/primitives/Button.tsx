import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost';
};

export function Button({ variant = 'primary', className, ...rest }: ButtonProps) {
  const cls = [styles.button, styles[variant], className].filter(Boolean).join(' ');
  return <button className={cls} {...rest} />;
}
