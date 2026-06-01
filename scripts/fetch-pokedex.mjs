// Vendor Pokémon species data + localized names into the repo.
//
// PRIMARY SOURCE: Pokémon Showdown's competitive pokedex
//   https://play.pokemonshowdown.com/data/pokedex.json
// gives us baseStats, types, abilities, evolution chain, height/weight, color,
// eggGroups, genderRatio, gen, tier, isNonstandard, and form metadata.
//
// GAP-FILL: PokéAPI's species endpoint
//   https://pokeapi.co/api/v2/pokemon-species/{id}
// gives us the three fields Showdown lacks: catch_rate, growth_rate,
// base_experience — plus localized display names per language.
//
// HAND-AUTHORED: Pokestar Studios mons (Showdown has stats, but no catch /
// growth / xp) get sensible boss-content defaults: catchRate 3, growthRate slow.
//
// FILTERS:
//   - Drop CAP (Smogon Create-A-Pokémon) — `isNonstandard === 'CAP'`
//   - Drop Gen 9 (no BW sprites for it yet) — `gen === 9`
//
// OUTPUTS (all vendored into git):
//   - src/data/pokedex.ts                    — keyed by speciesSlug (PokéAPI-style)
//   - src/locales/en/pokemonNames.json
//   - src/locales/fr/pokemonNames.json
//
// USAGE:
//   npm run fetch-pokedex                    full run
//   npm run fetch-pokedex -- --dry-run       report only
//   npm run fetch-pokedex -- --langs=en,fr   default locales (also: --langs=en,fr,es,de,it,ja)
//   npm run fetch-pokedex -- --force         ignore cache, re-pull everything
//   npm run fetch-pokedex -- --only=bulbasaur,charmander
//
// The shipped PWA never calls either API at runtime. This script is the only
// place external HTTP happens; the rest is vendored.
import { mkdir, writeFile, readFile, access } from 'node:fs/promises';

const SHOWDOWN_POKEDEX = 'https://play.pokemonshowdown.com/data/pokedex.json';
const POKEAPI = 'https://pokeapi.co/api/v2';
const OUT_DATA = 'src/data/pokedex.ts';
const OUT_LOCALES_DIR = 'src/locales';
const CACHE_DIR = 'node_modules/.cache/pokeapi';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FORCE = args.includes('--force');
const onlyArg = args.find((a) => a.startsWith('--only='))?.split('=')[1];
const langsArg = args.find((a) => a.startsWith('--langs='))?.split('=')[1] ?? 'en,fr';
const LANGS = langsArg.split(',').map((l) => l.trim()).filter(Boolean);
const ONLY = onlyArg ? new Set(onlyArg.split(',').map((s) => s.trim())) : null;

// Pokestar mons aren't in PokéAPI; canon HP/stats from Showdown stay, but capture
// + curve become "boss tier" defaults per the plan.
const POKESTAR_DEFAULTS = {
  catchRate: 3,
  growthRate: 'slow',
  baseExperience: 200,
};

// PokéAPI's growth_rate name → our canon name.
const GROWTH_RATE_MAP = {
  slow: 'slow',
  medium: 'medium-fast',
  fast: 'fast',
  'medium-slow': 'medium-slow',
  'slow-then-very-fast': 'erratic',
  'fast-then-very-slow': 'fluctuating',
};

// PokéAPI language code → our locale key. Add rows here when adding locales.
const LANG_CODE = {
  en: 'en',
  fr: 'fr',
  es: 'es',
  de: 'de',
  it: 'it',
  ja: 'ja-Hrkt', // PokéAPI splits Japanese into ja (kanji) + ja-Hrkt (hiragana/katakana)
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function withRetry(fn, label, retries = 3) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i === retries) break;
      await sleep(400 * (i + 1));
    }
  }
  throw new Error(`${label} failed: ${String(lastErr)}`);
}

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/** GET JSON with on-disk cache. PokéAPI is permissive but we don't hammer it. */
async function cachedJson(url) {
  const cacheKey = url.replace(/[^a-z0-9]+/gi, '_');
  const cachePath = `${CACHE_DIR}/${cacheKey}.json`;
  if (!FORCE && (await fileExists(cachePath))) {
    return JSON.parse(await readFile(cachePath, 'utf8'));
  }
  const data = await withRetry(async () => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return res.json();
  }, url);
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(cachePath, JSON.stringify(data));
  return data;
}

/**
 * Convert a Showdown display name into a PokéAPI-shaped slug.
 *   "Mr. Mime"           → "mr-mime"
 *   "Nidoran-F"          → "nidoran-f"
 *   "Farfetch'd"         → "farfetchd"
 *   "Ho-Oh"              → "ho-oh"
 *   "Type: Null"         → "type-null"
 *   "Tapu Koko"          → "tapu-koko"
 *   "Charizard-Mega-X"   → "charizard-mega-x"
 *   "Farfetch'd-Galar"   → "farfetchd-galar"
 *   "Pokestar UFO-2"     → "pokestar-ufo-2"
 */
function pokeApiSlug(name) {
  return name
    .toLowerCase()
    .replace(/['’.]/g, '') // strip apostrophes, periods (Mr. → Mr; Farfetch'd → Farfetchd)
    .replace(/:/g, '') // strip colons (Type: Null → Type Null)
    .replace(/\s+/g, '-') // spaces → hyphens
    .replace(/-+/g, '-'); // collapse double hyphens just in case
}

const sleepyAbilityKeys = ['0', '1', 'H', 'S']; // Showdown ordering — 0 primary, 1 secondary, H hidden, S signature

function abilitiesOf(entry) {
  const out = { primary: '', secondary: undefined, hidden: undefined };
  const a = entry.abilities ?? {};
  if (a['0']) out.primary = a['0'];
  if (a['1']) out.secondary = a['1'];
  if (a.H) out.hidden = a.H;
  return out;
}

function genderRatioOf(entry) {
  const g = entry.genderRatio;
  if (!g) return 'genderless';
  return { male: g.M ?? 0, female: g.F ?? 0 };
}

function isPokestar(entry) {
  return entry.tags?.includes('Pokestar') || entry.name.startsWith('Pokestar');
}

function isCap(entry) {
  return entry.isNonstandard === 'CAP';
}

function isLegendaryOf(entry) {
  // Showdown tags include "Restricted Legendary", "Sub-Legendary", "Mythical"
  const tags = entry.tags ?? [];
  return tags.includes('Restricted Legendary') || tags.includes('Sub-Legendary');
}

function isMythicalOf(entry) {
  return (entry.tags ?? []).includes('Mythical');
}

/**
 * Pick a localized name from PokéAPI's species `names` array.
 * Falls back to English if the requested language has no entry.
 */
function nameInLang(speciesData, langKey) {
  const lang = LANG_CODE[langKey] ?? langKey;
  const hit = (speciesData.names ?? []).find((n) => n.language?.name === lang);
  if (hit) return hit.name;
  // Fallback: English
  const en = (speciesData.names ?? []).find((n) => n.language?.name === 'en');
  return en?.name ?? speciesData.name ?? '';
}

async function main() {
  console.log('fetch-pokedex: reading Showdown pokedex.json…');
  const showdown = await cachedJson(SHOWDOWN_POKEDEX);

  const allEntries = Object.entries(showdown);
  // Filter Gen 9 by National Dex number (Showdown's `gen` field is unreliable — null for
  // most entries). Paldea species start at #906. Paldean regional forms of older mons
  // keep their base num, so they slip through this filter and rely on sprite fallback
  // to handle their (probably missing) sprite gracefully.
  let kept = allEntries.filter(
    ([key, e]) =>
      !isCap(e) &&
      e.num !== undefined &&
      key !== 'missingno' && // glitch mon with the non-canon "Bird" type
      // num <= 0 covers Pokestar (negative nums) — they pass through, num > 0 keeps real mons.
      (e.num <= 0 || e.num < 906),
  );
  if (ONLY) {
    kept = kept.filter(([key, e]) => ONLY.has(key) || ONLY.has(pokeApiSlug(e.name)));
  }
  console.log(
    `  ${allEntries.length} Showdown entries → kept ${kept.length} (dropped CAP + Gen 9${ONLY ? ' + --only filter' : ''})`,
  );

  const localized = Object.fromEntries(LANGS.map((l) => [l, /** @type {Record<string, string>} */ ({})]));
  const speciesById = new Map(); // dexId → species PokéAPI cache
  const pokemonById = new Map(); // dexId → pokemon PokéAPI cache (for base_experience)

  /**
   * Species endpoint: localized names, catch_rate, growth_rate.
   * Returns null for Pokestar (num < 0) — caller uses defaults.
   */
  async function pokeApiSpecies(num) {
    if (num <= 0 || num > 1025) return null;
    if (speciesById.has(num)) return speciesById.get(num);
    try {
      const data = await cachedJson(`${POKEAPI}/pokemon-species/${num}/`);
      speciesById.set(num, data);
      return data;
    } catch (err) {
      console.warn(`\n  WARN: PokéAPI species/${num} failed: ${String(err)}`);
      speciesById.set(num, null);
      return null;
    }
  }

  /** Pokémon endpoint: base_experience lives here, not on /pokemon-species/. */
  async function pokeApiPokemon(num) {
    if (num <= 0 || num > 1025) return null;
    if (pokemonById.has(num)) return pokemonById.get(num);
    try {
      const data = await cachedJson(`${POKEAPI}/pokemon/${num}/`);
      pokemonById.set(num, data);
      return data;
    } catch (err) {
      pokemonById.set(num, null);
      return null;
    }
  }

  /** @type {{ slug: string; data: object }[]} */
  const merged = [];
  let i = 0;
  for (const [showdownKey, entry] of kept) {
    i++;
    const slug = pokeApiSlug(entry.name);
    const pokestar = isPokestar(entry);
    const species = pokestar ? null : await pokeApiSpecies(entry.num);
    const pokemon = pokestar ? null : await pokeApiPokemon(entry.num);

    const catchRate = pokestar ? POKESTAR_DEFAULTS.catchRate : (species?.capture_rate ?? 45);
    const growthRate = pokestar
      ? POKESTAR_DEFAULTS.growthRate
      : (GROWTH_RATE_MAP[species?.growth_rate?.name] ?? 'medium-fast');
    const baseExperience = pokestar ? POKESTAR_DEFAULTS.baseExperience : (pokemon?.base_experience ?? 0);

    // Build the localized names per requested language. For Pokestar we just reuse the
    // English name across all langs.
    for (const lang of LANGS) {
      localized[lang][slug] = species ? nameInLang(species, lang) : entry.name;
    }

    merged.push({
      slug,
      data: {
        speciesSlug: slug,
        showdownKey,
        dexId: entry.num,
        generation: entry.gen ?? 0,
        displayName: entry.name,
        baseSpecies: entry.baseSpecies ?? null,
        baseForme: entry.baseForme ?? null,
        forme: entry.forme ?? null,
        // Showdown ships types in TitleCase ("Grass"); our PokeType union is lowercase.
        types: (entry.types ?? []).map((t) => t.toLowerCase()),
        baseStats: {
          hp: entry.baseStats?.hp ?? 0,
          atk: entry.baseStats?.atk ?? 0,
          def: entry.baseStats?.def ?? 0,
          spAtk: entry.baseStats?.spa ?? 0,
          spDef: entry.baseStats?.spd ?? 0,
          spd: entry.baseStats?.spe ?? 0,
        },
        abilities: abilitiesOf(entry),
        heightM: entry.heightm ?? 0,
        weightKg: entry.weightkg ?? 0,
        color: entry.color ?? null,
        eggGroups: entry.eggGroups ?? [],
        genderRatio: genderRatioOf(entry),
        catchRate,
        growthRate,
        baseExperience,
        tier: entry.tier ?? null,
        isLegendary: isLegendaryOf(entry),
        isMythical: isMythicalOf(entry),
        isPokestar: pokestar,
        isCosmetic: Boolean(entry.isCosmeticForme),
        prevo: entry.prevo ? pokeApiSlug(entry.prevo) : null,
        evos: (entry.evos ?? []).map(pokeApiSlug),
        evoLevel: entry.evoLevel ?? null,
        evoItem: entry.evoItem ?? null,
        evoCondition: entry.evoCondition ?? null,
        evoMove: entry.evoMove ?? null,
        evoRegion: entry.evoRegion ?? null,
        evoType: entry.evoType ?? null,
        canGigantamax: Boolean(entry.canGigantamax),
        otherFormes: (entry.otherFormes ?? []).map(pokeApiSlug),
        cosmeticFormes: (entry.cosmeticFormes ?? []).map(pokeApiSlug),
      },
    });

    if (i % 25 === 0 || i === kept.length) {
      process.stdout.write(`\r  ${i}/${kept.length}  ${entry.name.padEnd(28)}   `);
    }
  }

  console.log('\n');

  if (DRY_RUN) {
    console.log('[dry-run] would write:');
    console.log(`  - ${OUT_DATA} (${merged.length} entries)`);
    for (const lang of LANGS) {
      console.log(`  - ${OUT_LOCALES_DIR}/${lang}/pokemonNames.json (${Object.keys(localized[lang]).length} names)`);
    }
    return;
  }

  // Emit src/data/pokedex.ts
  const rows = merged
    .map(({ slug, data }) => `  ${JSON.stringify(slug)}: ${JSON.stringify(data)},`)
    .join('\n');
  const tsFile = `// AUTO-GENERATED by scripts/fetch-pokedex.mjs — do not edit by hand.
// Sources: Pokémon Showdown data/pokedex.json (primary stats + forms), PokéAPI
// (catchRate, growthRate, baseExperience, localized names). See ASSETS.md.
import type { BaseStats, GrowthRate, PokeType } from '@/types';

export interface Abilities {
  primary: string;
  secondary?: string;
  hidden?: string;
}

export type GenderRatio = { male: number; female: number } | 'genderless';

export interface SpeciesEntry {
  speciesSlug: string;
  showdownKey: string;
  dexId: number;
  generation: number;
  /** English display name. UI should use t('pokemonNames:' + speciesSlug) instead. */
  displayName: string;
  baseSpecies: string | null;
  baseForme: string | null;
  forme: string | null;
  types: PokeType[];
  baseStats: BaseStats;
  abilities: Abilities;
  heightM: number;
  weightKg: number;
  color: string | null;
  eggGroups: string[];
  genderRatio: GenderRatio;
  /** PokéAPI catch_rate, 0-255. Pokestar mons default to 3 (boss tier). */
  catchRate: number;
  /** PokéAPI growth_rate, normalized. Pokestar mons default to 'slow'. */
  growthRate: GrowthRate;
  /** PokéAPI base_experience awarded on defeat. */
  baseExperience: number;
  /** Showdown competitive tier ('OU', 'LC', 'Uber', 'Illegal', etc.) — informational. */
  tier: string | null;
  isLegendary: boolean;
  isMythical: boolean;
  /** Pokestar Studios (BW2 movie-studio "actor" mons). Easter-egg boss content. */
  isPokestar: boolean;
  /** Visually-distinct form that shares stats with its parent (Vivillon, Furfrou, Alcremie, …). */
  isCosmetic: boolean;
  /** PokéAPI slug of the previous evolution, or null. */
  prevo: string | null;
  /** PokéAPI slugs of the next evolutions. Empty when this is a final stage. */
  evos: string[];
  evoLevel: number | null;
  evoItem: string | null;
  evoCondition: string | null;
  evoMove: string | null;
  evoRegion: string | null;
  evoType: string | null;
  canGigantamax: boolean;
  otherFormes: string[];
  cosmeticFormes: string[];
}

export const POKEDEX: Record<string, SpeciesEntry> = {
${rows}
};
`;

  await mkdir('src/data', { recursive: true });
  await writeFile(OUT_DATA, tsFile);
  console.log(`Wrote ${OUT_DATA} (${merged.length} species).`);

  // Emit src/locales/{lang}/pokemonNames.json
  for (const lang of LANGS) {
    const path = `${OUT_LOCALES_DIR}/${lang}/pokemonNames.json`;
    await mkdir(`${OUT_LOCALES_DIR}/${lang}`, { recursive: true });
    // Sort for deterministic diffs
    const sorted = Object.fromEntries(
      Object.entries(localized[lang]).sort(([a], [b]) => a.localeCompare(b)),
    );
    await writeFile(path, JSON.stringify(sorted, null, 2) + '\n');
    console.log(`Wrote ${path} (${Object.keys(sorted).length} names).`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
