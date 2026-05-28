import { describe, expect, it } from 'vitest';
import { SPRITE_BASE, spriteUrl } from './sprites';

describe('spriteUrl', () => {
  it('builds the front path by default, keyed by formId', () => {
    expect(spriteUrl('charmander')).toBe(`${SPRITE_BASE}/front/charmander.gif`);
  });

  it('builds the back path', () => {
    expect(spriteUrl('charmander', { facing: 'back' })).toBe(`${SPRITE_BASE}/back/charmander.gif`);
  });

  it('builds shiny and female variants', () => {
    expect(spriteUrl('charmander', { shiny: true })).toBe(
      `${SPRITE_BASE}/front-shiny/charmander.gif`,
    );
    expect(spriteUrl('pikachu', { facing: 'back', shiny: true, female: true })).toBe(
      `${SPRITE_BASE}/back-shiny-female/pikachu.gif`,
    );
  });

  it('keeps distinct paths for alternate forms of the same species', () => {
    expect(spriteUrl('charizard-mega-x')).toBe(`${SPRITE_BASE}/front/charizard-mega-x.gif`);
    expect(spriteUrl('rattata-alola')).toBe(`${SPRITE_BASE}/front/rattata-alola.gif`);
  });
});
