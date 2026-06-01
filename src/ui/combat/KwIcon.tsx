import type { CSSProperties } from 'react';
import { Icon } from '@iconify/react';
import type { KeywordVisual } from './keywords';

/**
 * Render a keyword's glyph. Picks an `<img>` for PNG-backed visuals (Mega mark, etc.)
 * and an Iconify `<Icon>` for the monochrome glyphs. Shared by every chip surface so
 * the icon-vs-image branch stays in one place — Card body chips, Card tooltip rows,
 * PokemonSlot status chips, standalone KeywordChip.
 */
export function KwIcon({
  visual,
  className,
}: {
  visual: KeywordVisual;
  className?: string | undefined;
}) {
  if ('image' in visual) {
    // `height: auto` overrides the consumer's `1.1em` square so non-square pixels
    // (the 21×15 dmax.png, future marks) keep their natural aspect ratio.
    return (
      <img src={visual.image} alt="" className={className} aria-hidden style={{ height: 'auto' }} />
    );
  }
  const style: CSSProperties = { color: visual.color };
  return <Icon icon={visual.icon} className={className} style={style} />;
}
