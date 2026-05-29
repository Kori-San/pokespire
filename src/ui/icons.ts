import { addCollection } from '@iconify/react';
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
