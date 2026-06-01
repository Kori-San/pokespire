import { describe, expect, it } from 'vitest';
import { SPRITE_INDEX } from '@/data/speciesIndex';
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
    // Mega-X / Mega-Y → Showdown squashes the form's hyphen on the file system, so
    // the canonical local stem is `charizard-megax`, not `charizard-mega-x`. The
    // generated SPRITE_INDEX captures this; the resolver mirrors it.
    const cmx = SPRITE_INDEX['charizard-mega-x'];
    expect(cmx?.stem).toBe('charizard-megax');
    expect(spriteUrl('charizard-mega-x')).toBe(
      `${SPRITE_BASE}/${cmx?.tier ?? 'missing'}/${cmx?.stem}.${cmx?.tier === 'animated' ? 'gif' : 'png'}`,
    );
    expect(spriteUrl('rattata-alola')).toBe(`${SPRITE_BASE}/animated/rattata-alola.gif`);
  });

  it('falls back to missingno for unknown slugs', () => {
    expect(spriteUrl('not-a-real-species')).toBe(FALLBACK_SPRITE);
  });
});

// Form-coverage smoke tests — catch regressions where the fetch script's naming logic
// silently drops a canonical form. Each row asserts a known canonical PokéAPI slug
// resolves to a non-`missing` tier in the generated SPRITE_INDEX. If any of these
// regress, `fetch-sprites` likely produced the wrong filename stem for that family.
describe('SPRITE_INDEX form coverage', () => {
  const FORM_FAMILIES: { family: string; slugs: readonly string[] }[] = [
    {
      family: 'Rotom appliance forms',
      slugs: ['rotom', 'rotom-heat', 'rotom-wash', 'rotom-frost', 'rotom-fan', 'rotom-mow'],
    },
    {
      family: 'Mega evolutions (Mega + Mega-X/Y + Primal)',
      slugs: [
        'charizard-mega-x',
        'charizard-mega-y',
        'mewtwo-mega-x',
        'mewtwo-mega-y',
        'alakazam-mega',
        'mawile-mega',
        'kyogre-primal',
        'groudon-primal',
        'rayquaza-mega',
      ],
    },
    {
      family: 'Gmax forms',
      slugs: [
        'charizard-gmax',
        'pikachu-gmax',
        'melmetal-gmax',
        'lapras-gmax',
        'eevee-gmax',
        'snorlax-gmax',
      ],
    },
    {
      family: 'Regional variants',
      slugs: [
        'raichu-alola',
        'meowth-alola',
        'meowth-galar',
        'sandslash-alola',
        'farfetchd-galar',
        'mr-mime-galar',
        // `zorua-hisui` and other PLA-era Hisuian additions aren't in Showdown's
        // SPECIES list yet (BW Sprite Project hasn't curated them). Re-add if it
        // ever lands.
      ],
    },
    {
      family: 'Arceus + Silvally type forms',
      slugs: ['arceus-bug', 'arceus-water', 'arceus-fairy', 'silvally-fire', 'silvally-ghost'],
    },
    {
      family: 'Legendary + mythical alternate formes',
      slugs: [
        'giratina-origin',
        'shaymin-sky',
        'tornadus-therian',
        'thundurus-therian',
        'landorus-therian',
        'kyurem-black',
        'kyurem-white',
        'hoopa-unbound',
        'necrozma-dusk-mane',
        'necrozma-dawn-wings',
        // Sheet-only — Showdown's SPECIES list doesn't carry it, but the Smogon Gen 8
        // sheet does, and our ingestion pulls it as a sheet-only entry.
        'urshifu-rapid-strike',
        // `urshifu` (single-strike base) is sheet-only too but the sheet's `name`
        // column labels it "Urshifu-single strike" — slug derivation can't recover
        // the bare `urshifu`. Tracked under `urshifu-single-strike` instead.
        // base `urshifu` is also missing for the same reason. Re-add once curated.
      ],
    },
  ];

  // Single roll-up test — the vitest lint rule wants literal `it()` titles. The
  // failure message groups broken slugs by family so the diagnostic is still clear.
  it('every canonical form family resolves to a vendored sprite', () => {
    const failures: string[] = [];
    for (const { family, slugs } of FORM_FAMILIES) {
      const broken = slugs
        .map((slug) => ({ slug, entry: SPRITE_INDEX[slug] }))
        .filter(({ entry }) => !entry || entry.tier === 'missing');
      if (broken.length > 0) {
        const lines = broken.map(
          ({ slug, entry }) => `    - ${slug} → ${entry ? `tier=${entry.tier}` : 'NOT IN INDEX'}`,
        );
        failures.push(`  ${family} (${String(broken.length)}):\n${lines.join('\n')}`);
      }
    }
    expect(failures, `fetch-sprites missed canonical forms:\n${failures.join('\n')}`).toEqual([]);
  });
});
