import type { ReactNode } from 'react';
import styles from './Tooltip.module.css';

export type TooltipPlacement = 'top' | 'bottom' | 'bottomLeft' | 'bottomRight' | 'left' | 'right';

interface TooltipProps {
  /** Tooltip content. Pass JSX for richer layouts (e.g. status chips, stat grids). */
  content: ReactNode;
  /** Side of the trigger the bubble pops out of. Defaults to `top`. */
  placement?: TooltipPlacement;
  /** The hoverable trigger. */
  children: ReactNode;
  /** Optional class to merge onto the wrapper (e.g. when the trigger needs to be a block). */
  className?: string | undefined;
}

/**
 * CSS-only tooltip primitive — wraps a trigger and a popover bubble in a relative
 * container, shown on `:hover` / `:focus-within` of the wrapper. Lives at
 * `z-index: 999` so it clears the topbar (10), bottom strip (5), and slot indicators
 * (~210) site-wide.
 *
 * Doesn't use React Portal: clipping by an ancestor with `overflow: hidden`
 * (e.g. the 16:9 stage frame) still applies. For edge-of-screen tooltips, pick
 * a placement that points away from the clipped edge.
 */
export function Tooltip({ content, placement = 'top', children, className }: TooltipProps) {
  const wrapClass = [styles.wrap, className].filter(Boolean).join(' ');
  return (
    <span className={wrapClass}>
      {children}
      <span className={`${styles.bubble} ${styles[placement]}`} role="tooltip">
        {content}
      </span>
    </span>
  );
}
