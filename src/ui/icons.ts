import { addCollection, addIcon } from '@iconify/react';
import pixelarticonsCollection from '@iconify-json/pixelarticons/icons.json';
import dinkieIconsCollection from '@iconify-json/dinkie-icons/icons.json';
import streamlinePixelCollection from '@iconify-json/streamline-pixel/icons.json';

/**
 * Register every icon collection we use once at startup. Each `<Icon icon="<set>:foo" />`
 * after this reads from the registry with zero network — bundled, offline-friendly.
 * Import this file as a side effect from `main.tsx` (real app) AND from
 * `.storybook/preview.ts` (story playback).
 *
 * Collections:
 *   - pixelarticons   — neutral mono-pixel set; shields, arrows, generic chips.
 *   - dinkie-icons    — chunkier expressive pixels with built-in palette (fire, blood,
 *     biohazard, sparkles, sleeping-face, hourglass-with-flowing-sand).
 *   - streamline-pixel — weather pixels for cards/HUDs that surface weather.
 */
addCollection(pixelarticonsCollection);
addCollection(dinkieIconsCollection);
addCollection(streamlinePixelCollection);

/**
 * One-off custom icons. Registered under the `local:` prefix so they slot into the
 * same `<Icon icon="local:..." />` API as the rest of the registry. Use this for
 * tiny purpose-built glyphs that don't justify a whole collection.
 *
 *   - `local:triangle-up` — the canonical Pokémon "not very effective" symbol.
 *     Pixel-stepped pyramid, fills via `currentColor` so the keyword tint applies.
 */
addIcon('local:triangle-up', {
  body: '<path fill="currentColor" d="M10 4h4v2h2v2h2v2h2v2h2v4H2v-4h2v-2h2V8h2V6h2V4z"/>',
  width: 24,
  height: 24,
});
