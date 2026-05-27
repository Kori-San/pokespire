// Asset pipeline: vendor Pokémon data + sprites from PokéAPI into the repo.
// Multi-form aware (regional / mega / primal / Gmax forms have their own types, stats,
// sprites). Schema is designed to cover all gens so later gens only ADD data, never
// change the shape. Run ONCE (rarely re-run). Writes:
//   - src/data/pokedex.gen1.ts                       (committed, typed species data)
//   - public/sprites/pokemon/<variant>/<formId>.gif  (committed, served locally)
//
// Usage:
//   npm run fetch-pokedex                       full run
//   npm run fetch-pokedex -- --dry-run          report only, no writes/downloads
//   npm run fetch-pokedex -- --skip-existing    skip sprites already on disk
//   npm run fetch-pokedex -- --only=6           one id; or --only=1-9 for a range
import { mkdir, writeFile, access } from 'node:fs/promises';

const GEN1_COUNT = 151;
const API = 'https://pokeapi.co/api/v2';
const SPRITE_DIR = 'public/sprites/pokemon';
const DATA_FILE = 'src/data/pokedex.gen1.ts';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const SKIP_EXISTING = args.includes('--skip-existing');
const onlyArg = args.find((a) => a.startsWith('--only='))?.split('=')[1];

function idRange() {
  if (!onlyArg) return { from: 1, to: GEN1_COUNT };
  const [a, b] = onlyArg.split('-').map(Number);
  return { from: a, to: b ?? a };
}

const STAT_KEY = {
  hp: 'hp',
  attack: 'atk',
  defense: 'def',
  'special-attack': 'spAtk',
  'special-defense': 'spDef',
  speed: 'spd',
};

const GROWTH = {
  slow: 'slow',
  medium: 'medium-fast',
  fast: 'fast',
  'medium-slow': 'medium-slow',
  'slow-then-very-fast': 'erratic',
  'fast-then-very-slow': 'fluctuating',
};

const GENERATION = {
  'generation-i': 1,
  'generation-ii': 2,
  'generation-iii': 3,
  'generation-iv': 4,
  'generation-v': 5,
  'generation-vi': 6,
  'generation-vii': 7,
  'generation-viii': 8,
  'generation-ix': 9,
};

const VARIANT_KEY = {
  front: 'front_default',
  back: 'back_default',
  'front-shiny': 'front_shiny',
  'back-shiny': 'back_shiny',
  'front-female': 'front_female',
  'back-female': 'back_female',
  'front-shiny-female': 'front_shiny_female',
  'back-shiny-female': 'back_shiny_female',
};
const BASE_VARIANTS = ['front', 'back', 'front-shiny', 'back-shiny'];
const FEMALE_VARIANTS = ['front-female', 'back-female', 'front-shiny-female', 'back-shiny-female'];
const REGIONAL = /-(alola|alolan|galar|galarian|hisui|hisuian|paldea|paldean)\b/;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function withRetry(fn, label, retries = 3) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      await sleep(400 * (i + 1));
    }
  }
  throw new Error(`${label} failed: ${String(lastErr)}`);
}

const getJson = (url) =>
  withRetry(async () => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return res.json();
  }, url);

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function downloadSprite(url, dest) {
  if (!url) return false;
  if (DRY_RUN) return true;
  if (SKIP_EXISTING && (await fileExists(dest))) return true;
  return withRetry(async () => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    await writeFile(dest, Buffer.from(await res.arrayBuffer()));
    return true;
  }, url).catch(() => false);
}

const idFromUrl = (url) => {
  const m = /\/(\d+)\/?$/.exec(url ?? '');
  return m ? Number(m[1]) : null;
};

function statsOf(p) {
  const s = { hp: 0, atk: 0, def: 0, spAtk: 0, spDef: 0, spd: 0 };
  for (const stat of p.stats) {
    const key = STAT_KEY[stat.stat.name];
    if (key) s[key] = stat.base_stat;
  }
  return s;
}

function formKind(name, isDefault) {
  if (name.includes('-mega')) return 'mega';
  if (name.includes('-primal')) return 'primal';
  if (name.includes('-gmax')) return 'gmax';
  if (REGIONAL.test(name)) return 'regional';
  return isDefault ? 'default' : 'other';
}

/** Vendor one form's sprites (keyed by formId) and return its data. */
async function buildForm(speciesName, varietyName, isDefault, hasGenderDifferences) {
  const p = await getJson(`${API}/pokemon/${varietyName}`);
  const animated = p.sprites?.versions?.['generation-v']?.['black-white']?.animated ?? {};

  const variants =
    isDefault && hasGenderDifferences ? [...BASE_VARIANTS, ...FEMALE_VARIANTS] : BASE_VARIANTS;
  for (const variant of variants) {
    const key = VARIANT_KEY[variant];
    const url = animated[key] ?? p.sprites[key] ?? null; // Gen-V animated, else static
    await downloadSprite(url, `${SPRITE_DIR}/${variant}/${varietyName}.gif`);
  }

  return {
    formId: varietyName,
    label: varietyName === speciesName ? null : varietyName.replace(`${speciesName}-`, ''),
    // mega/gmax/primal = in-combat transform forms (played as transform cards); regional =
    // a normal alternate form; other = cosmetic/misc.
    kind: formKind(varietyName, isDefault),
    isDefault,
    types: p.types.map((t) => t.type.name),
    baseStats: statsOf(p),
    baseExperience: p.base_experience ?? 0,
  };
}

async function main() {
  const { from, to } = idRange();
  console.log(
    `fetch-pokedex: ids ${from}-${to}${DRY_RUN ? ' [dry-run]' : ''}${SKIP_EXISTING ? ' [skip-existing]' : ''}`,
  );

  if (!DRY_RUN) {
    for (const v of [...BASE_VARIANTS, ...FEMALE_VARIANTS]) {
      await mkdir(`${SPRITE_DIR}/${v}`, { recursive: true });
    }
    await mkdir('src/data', { recursive: true });
  }

  const entries = [];
  for (let id = from; id <= to; id++) {
    const species = await getJson(`${API}/pokemon-species/${id}`);
    const speciesName = species.name;
    const hasGenderDifferences = Boolean(species.has_gender_differences);
    const isLegendary = Boolean(species.is_legendary);
    const isMythical = Boolean(species.is_mythical);
    const isParadox = false; // no PokéAPI flag; populated for Gen 9 later. Field present now.
    const speciesSolo = isLegendary || isMythical || isParadox;

    const forms = [];
    for (const variety of species.varieties ?? []) {
      forms.push(
        await buildForm(
          speciesName,
          variety.pokemon.name,
          Boolean(variety.is_default),
          hasGenderDifferences,
        ),
      );
    }

    entries.push({
      dexId: id,
      generation: GENERATION[species.generation?.name] ?? 1,
      name: speciesName,
      catchRate: species.capture_rate,
      growthRate: GROWTH[species.growth_rate?.name] ?? 'medium-fast',
      genderRate: species.gender_rate ?? -1,
      hasGenderDifferences,
      isLegendary,
      isMythical,
      isParadox,
      hasMega: forms.some((f) => f.kind === 'mega'),
      hasGmax: forms.some((f) => f.kind === 'gmax'),
      soloOnly: speciesSolo,
      evolvesFrom: idFromUrl(species.evolves_from_species?.url),
      forms,
    });

    process.stdout.write(`\r  ${id}/${to}  ${speciesName.padEnd(14)} (${forms.length} form(s))   `);
    await sleep(30);
  }

  if (DRY_RUN) {
    console.log('\n[dry-run] would write:');
    for (const e of entries) {
      const flags = [
        e.isLegendary && 'legendary',
        e.isMythical && 'mythical',
        e.hasMega && 'mega',
        e.hasGmax && 'gmax',
        e.soloOnly && 'SOLO',
      ].filter(Boolean);
      console.log(
        `  #${e.dexId} g${e.generation} ${e.name} [${flags.join(',') || '-'}] forms: ${e.forms
          .map((f) => `${f.formId}(${f.kind})`)
          .join(', ')}`,
      );
    }
    return;
  }

  const rows = entries.map((e) => `  ${e.dexId}: ${JSON.stringify(e)},`).join('\n');
  const file = `// AUTO-GENERATED by scripts/fetch-pokedex.mjs — do not edit by hand.
import type { BaseStats, GrowthRate, PokeType } from '@/types';

/** A form's special category. \`paradox\` is species-level (see SpeciesEntry), not a form. */
export type FormKind = 'default' | 'mega' | 'primal' | 'gmax' | 'regional' | 'other';

export interface FormEntry {
  /** Unique sprite/asset key, e.g. \`charmander\`, \`charizard-mega-x\`, \`rattata-alola\`. */
  formId: string;
  /** Form label (null for the default form), e.g. \`mega-x\`, \`gmax\`, \`alola\`. */
  label: string | null;
  kind: FormKind;
  isDefault: boolean;
  types: PokeType[];
  baseStats: BaseStats;
  baseExperience: number;
}

export interface SpeciesEntry {
  dexId: number;
  generation: number;
  name: string;
  catchRate: number;
  growthRate: GrowthRate;
  /** Female ratio in eighths; -1 = genderless (PokéAPI gender_rate). */
  genderRate: number;
  hasGenderDifferences: boolean;
  isLegendary: boolean;
  isMythical: boolean;
  isParadox: boolean;
  /** Has a mega form (→ a Mega Evolve card can target it). Not solo-only. */
  hasMega: boolean;
  /** Has a Gmax form (→ a Dynamax card transforms into it instead of generic Dynamax). Not solo-only. */
  hasGmax: boolean;
  /** Only legendary/mythical/paradox SPECIES are solo-team-only. Mega/Gmax are in-combat
   *  transform cards (any team mon can use them), so they never gate to solo. */
  soloOnly: boolean;
  /** National dex id of the pre-evolution, or null. The full line is reconstructable by
   *  following these links across all vendored gens; evolution *triggers* are a separate
   *  additive dataset (added with the evolution system). */
  evolvesFrom: number | null;
  forms: FormEntry[];
}

export const GEN1: Record<number, SpeciesEntry> = {
${rows}
};
`;
  await writeFile(DATA_FILE, file);
  console.log(`\nWrote ${DATA_FILE} (${entries.length} species).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
