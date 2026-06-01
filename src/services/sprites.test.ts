import { describe, expect, it } from 'vitest';
import { FALLBACK_SPRITE, SPRITE_BASE, spriteUrl } from './sprites';

// Real entries from the generated `speciesIndex.ts` — these tests double as smoke
// tests for the SPRITE_INDEX map being well-populated.
describe('spriteUrl', () => {
  it('builds the front animated path by default, keyed by speciesSlug', () => {
    expect(spriteUrl('charmander')).toBe(`${SPRITE_BASE}/animated/charmander.gif`);
  });

  it('builds the back animated path', () => {
    expect(spriteUrl('charmander', { facing: 'back' })).toBe(
      `${SPRITE_BASE}/animated-back/charmander.gif`,
    );
  });

  it('builds shiny + back-shiny variants', () => {
    expect(spriteUrl('charmander', { shiny: true })).toBe(
      `${SPRITE_BASE}/animated-shiny/charmander.gif`,
    );
    expect(spriteUrl('charmander', { facing: 'back', shiny: true })).toBe(
      `${SPRITE_BASE}/animated-back-shiny/charmander.gif`,
    );
  });

  it("respects the species' female-distinct flag when honouring the female option", () => {
    // Pikachu has a visually distinct female sprite (heart-shaped tail tip) — Showdown
    // ships `pikachu-f.gif`. SPRITE_INDEX flags `female: true` for it.
    expect(spriteUrl('pikachu', { female: true })).toBe(`${SPRITE_BASE}/animated/pikachu-f.gif`);
    // Bulbasaur is not visually dimorphic — the female flag is ignored.
    expect(spriteUrl('bulbasaur', { female: true })).toBe(`${SPRITE_BASE}/animated/bulbasaur.gif`);
  });

  it('keeps distinct paths for alternate forms of the same species', () => {
    expect(spriteUrl('charizard-mega-x')).toBe(`${SPRITE_BASE}/animated/charizard-mega-x.gif`);
    expect(spriteUrl('rattata-alola')).toBe(`${SPRITE_BASE}/animated/rattata-alola.gif`);
  });

  it('falls back to missingno for unknown slugs', () => {
    expect(spriteUrl('not-a-real-species')).toBe(FALLBACK_SPRITE);
  });
});
