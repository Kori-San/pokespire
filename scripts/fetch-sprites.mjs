// Vendor sprite assets from Pokémon Showdown into the repo.
//
// Primary source: Showdown's CDN buckets at https://play.pokemonshowdown.com/sprites/
//   - gen5ani/, gen5ani-back/, gen5ani-shiny/, gen5ani-back-shiny/  (animated BW, preferred)
//   - gen5/, gen5-back/, gen5-shiny/, gen5-back-shiny/              (static BW PNG, same aesthetic fallback)
//   - itemicons/                                                    (canon item icons)
//   - trainers/                                                     (trainer portraits)
//
// Gap-closing source: the Smogon BW Sprite Project tracker sheets — four public
// Google Spreadsheets where contributors track community sprite work. We pull the
// CSV export and follow the forum-attachment URLs whenever Showdown's bucket
// returned 404 (Showdown sometimes lags behind community submissions).
//
// Filters:
//   - Skip CAP mons (isNonstandard === 'CAP' in pokedex.json)
//   - Skip Gen 9 (num >= 906) — natural BW Sprite Project boundary
//
// Outputs (all vendored into git):
//   - public/sprites/pokemon/animated/<stem>.gif         + 3 back/shiny variants
//   - public/sprites/pokemon/static/<stem>.png           + 3 back/shiny variants
//   - public/sprites/pokemon/fallback/missingno.gif      (preserved/relocated)
//   - public/sprites/items/<name>.png                    (every Showdown itemicon)
//   - public/sprites/trainers/<name>.png                 (every Showdown trainer)
//   - src/data/speciesIndex.ts                           (generated SPRITE_INDEX map)
//
// USAGE:
//   npm run fetch-sprites                    full run
//   npm run fetch-sprites -- --force         re-download everything (default: skip existing)
//   npm run fetch-sprites -- --skip-smogon-sheets   only pull from Showdown (offline fallback)
//   npm run fetch-sprites -- --bucket=animated      one bucket only
//   npm run fetch-sprites -- --only=bulbasaur,charmander
//
// The shipped PWA never calls Showdown / Smogon at runtime. This script is the
// only place external sprite traffic happens.
import { mkdir, writeFile, access, rename } from 'node:fs/promises';

const SD = 'https://play.pokemonshowdown.com/sprites';
const SD_DATA = 'https://play.pokemonshowdown.com/data';
const POKEMON_DIR = 'public/sprites/pokemon';
const ITEMS_DIR = 'public/sprites/items';
const TRAINERS_DIR = 'public/sprites/trainers';
const INDEX_TS = 'src/data/speciesIndex.ts';

// Showdown bucket → local subfolder under public/sprites/pokemon/
const ANIMATED_VARIANTS = [
  { bucket: 'gen5ani', folder: 'animated', ext: 'gif' },
  { bucket: 'gen5ani-back', folder: 'animated-back', ext: 'gif' },
  { bucket: 'gen5ani-shiny', folder: 'animated-shiny', ext: 'gif' },
  { bucket: 'gen5ani-back-shiny', folder: 'animated-back-shiny', ext: 'gif' },
];
const STATIC_VARIANTS = [
  { bucket: 'gen5', folder: 'static', ext: 'png' },
  { bucket: 'gen5-back', folder: 'static-back', ext: 'png' },
  { bucket: 'gen5-shiny', folder: 'static-shiny', ext: 'png' },
  { bucket: 'gen5-back-shiny', folder: 'static-back-shiny', ext: 'png' },
];

// Smogon BW Sprite Project tracker sheets — one per gen batch. CSV export works
// without auth: https://docs.google.com/spreadsheets/d/<id>/export?format=csv&gid=0
const SMOGON_SHEETS = [
  { gen: 6, id: '1Gn0UORn-unvcbUeQhQdEBz0ADNcH49BZZqQ1dpXm9eo' },
  { gen: 7, id: '1FMcHbSKEWZc7v2Ur4cyJjT_NhO0gqXyU9kDhsOQhlBQ' },
  { gen: 8, id: '1acgzAjh0dnFRQnjZu8kSjS177rKCzpFfEHRLtwuuXRU' },
  { gen: 9, id: '1MCjDktTOOFjLKM5C-RW6SfBQGkjlxDSCZAZDma_ItuA' },
];

const CONCURRENCY = 16;
const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const SKIP_SMOGON = args.includes('--skip-smogon-sheets');
const onlyArg = args.find((a) => a.startsWith('--only='))?.split('=')[1];
const ONLY = onlyArg ? new Set(onlyArg.split(',').map((s) => s.trim())) : null;
const bucketArg = args.find((a) => a.startsWith('--bucket='))?.split('=')[1];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function withRetry(fn, retries = 3) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i === retries) break;
      await sleep(300 * (i + 1));
    }
  }
  throw lastErr;
}

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Download a single URL to a local path, atomically (write to .tmp, rename).
 * Returns true on success, false if 404 / non-OK. Throws on network errors after retries.
 */
async function downloadOnce(url, dest) {
  if (!FORCE && (await fileExists(dest))) return true;
  const tmp = `${dest}.tmp`;
  try {
    const ok = await withRetry(async () => {
      const res = await fetch(url);
      if (res.status === 404) return false;
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      const buf = Buffer.from(await res.arrayBuffer());
      // Sanity check — Showdown returns HTML 200 for missing buckets sometimes; reject
      // tiny payloads or HTML.
      if (buf.length < 100) return false;
      const head = buf.subarray(0, 50).toString('utf8').toLowerCase();
      if (head.includes('<!doctype') || head.includes('<html')) return false;
      await writeFile(tmp, buf);
      await rename(tmp, dest);
      return true;
    });
    return ok;
  } catch (err) {
    console.warn(`\n  WARN: ${url} → ${String(err)}`);
    return false;
  }
}

/**
 * Convert a Showdown SPECIES entry into its sprite filename stem, looking up the
 * `baseSpecies` + `forme` fields from Showdown's own pokedex.json so we don't have
 * to maintain a hand-rolled form-suffix allowlist. Showdown's filename rule (verified
 * against the live directory):
 *
 *   - No `forme`: filename = `toID(name)` — every non-alphanumeric char dropped.
 *       "Ho-Oh"      → "hooh"
 *       "Mr. Mime"   → "mrmime"
 *       "Bulbasaur*" → "bulbasaur"  (`*` is the gender-distinct marker, stripped)
 *       "Nidoran-F"  → "nidoranf"
 *       "Type: Null" → "typenull"
 *       "Tapu Koko"  → "tapukoko"
 *   - With `forme`: filename = `toID(baseSpecies) + "-" + toID(forme)`.
 *       "Charizard-Mega-X" → "charizard-megax"     (Mega-X squashes to megax)
 *       "Rotom-Frost"      → "rotom-frost"
 *       "Arceus-Bug"       → "arceus-bug"
 *       "Urshifu-Rapid-Strike" → "urshifu-rapidstrike"
 */
function toID(s) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function spriteIdFromSpeciesName(rawName, pokedex) {
  const name = rawName.replace(/\*+$/, '');
  const key = toID(name);
  const entry = pokedex[key];
  if (entry?.forme && entry?.baseSpecies) {
    return `${toID(entry.baseSpecies)}-${toID(entry.forme)}`;
  }
  return key;
}

/** Same logic but yields the PokéAPI slug (every word hyphenated). Mirrors fetch-pokedex.mjs. */
function pokeApiSlug(name) {
  return name
    .toLowerCase()
    .replace(/\*+$/, '')
    .replace(/['’.]/g, '')
    .replace(/:/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/** Parse Showdown's sprites/index.js → { SPECIES: string[], OFFSETS: number[] }. */
function parseIndexJs(src) {
  const speciesMatch = src.match(/const SPECIES = (\[.*?\]);/s);
  const offsetsMatch = src.match(/const OFFSETS = (\[.*?\]);/s);
  if (!speciesMatch || !offsetsMatch) {
    throw new Error('Failed to parse Showdown sprites/index.js');
  }
  // The JS arrays are JSON-compatible (string literals + numbers).
  const SPECIES = JSON.parse(speciesMatch[1]);
  const OFFSETS = JSON.parse(offsetsMatch[1]);
  return { SPECIES, OFFSETS };
}

/** Concurrency-limited mapper. */
async function plimit(items, limit, worker) {
  const out = new Array(items.length);
  let cursor = 0;
  async function pull() {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      out[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: limit }, pull));
  return out;
}

/** Naive CSV parser — Smogon sheets are tame (no embedded commas in URL cells). */
function parseCsv(text) {
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    // Showdown's sheet rows do have quoted cells (commas in Spriter / QC fields).
    // Split on commas not inside quotes.
    const cells = [];
    let buf = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuote && line[i + 1] === '"') {
          buf += '"';
          i++;
        } else {
          inQuote = !inQuote;
        }
      } else if (c === ',' && !inQuote) {
        cells.push(buf);
        buf = '';
      } else {
        buf += c;
      }
    }
    cells.push(buf);
    rows.push(cells);
  }
  return rows;
}

/** Index Smogon sheets: { dexId|name → {front, back, frontShiny, backShiny} } */
async function loadSmogonSheets() {
  if (SKIP_SMOGON) return new Map();
  console.log('Loading Smogon BW Sprite Project sheets…');
  const map = new Map();
  for (const sheet of SMOGON_SHEETS) {
    const url = `https://docs.google.com/spreadsheets/d/${sheet.id}/export?format=csv&gid=0`;
    try {
      const text = await withRetry(async () => {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`${res.status} ${url}`);
        return res.text();
      });
      const rows = parseCsv(text);
      // Columns are: dex#, name, Front, Back, Front-shiny, Back-shiny, Spriter, QC
      for (const row of rows) {
        const [num, name, front, back, frontShiny, backShiny] = row;
        if (!num || !name) continue;
        if (!/^\d+$/.test(num.trim())) continue; // header / divider rows
        const slug = pokeApiSlug(name);
        map.set(slug, {
          front: front?.trim() || null,
          back: back?.trim() || null,
          frontShiny: frontShiny?.trim() || null,
          backShiny: backShiny?.trim() || null,
          gen: sheet.gen,
        });
      }
      console.log(`  gen ${sheet.gen}: ${rows.length} rows`);
    } catch (err) {
      console.warn(`  gen ${sheet.gen}: failed to load (${String(err)})`);
    }
  }
  console.log(`  → ${map.size} species indexed across all sheets`);
  return map;
}

/** Scrape a Showdown directory listing's filenames. */
async function listDirectory(bucket) {
  const url = `${SD}/${bucket}/`;
  const html = await withRetry(async () => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return res.text();
  });
  const files = new Set();
  for (const match of html.matchAll(/href="\.?\/?([^"./][^"]*\.(?:gif|png))"/gi)) {
    files.add(match[1]);
  }
  return files;
}

async function main() {
  console.log('fetch-sprites: loading Showdown index.js + pokedex.json…');
  const [indexJsText, pokedex] = await Promise.all([
    withRetry(async () => {
      const res = await fetch(`${SD}/index.js`);
      if (!res.ok) throw new Error(`${res.status}`);
      return res.text();
    }),
    withRetry(async () => {
      const res = await fetch(`${SD_DATA}/pokedex.json`);
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json();
    }),
  ]);
  const { SPECIES, OFFSETS } = parseIndexJs(indexJsText);
  console.log(`  ${SPECIES.length} species in Showdown SPECIES list`);

  // Build the working set: drop CAP (isNonstandard === 'CAP' in pokedex.json) and
  // names with no pokedex entry (defensive). Pokestar passes through. Gen 9 names
  // also pass through here — they'll go in the missing tier if there's no sprite,
  // matching fetch-pokedex's filter.
  const work = [];
  for (const rawName of SPECIES) {
    if (ONLY && !ONLY.has(pokeApiSlug(rawName))) continue;
    const showdownKey = rawName.replace(/\*+$/, '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const entry = pokedex[showdownKey];
    if (entry?.isNonstandard === 'CAP') continue;
    work.push({
      rawName,
      slug: pokeApiSlug(rawName),
      stem: spriteIdFromSpeciesName(rawName, pokedex),
      female: rawName.endsWith('*'),
      dexId: entry?.num ?? 0,
    });
  }
  console.log(`  ${work.length} after CAP filter${ONLY ? ' + --only' : ''}`);

  const smogonSheets = await loadSmogonSheets();

  // Sheet-only species — entries the Smogon BW Sprite Project tracks but that
  // Showdown's SPECIES list hasn't picked up (Urshifu styles, Zorua / Zoroark
  // Hisui, late SwSh DLC, Paradox mons, etc.). For these we have no Showdown
  // bucket URL, but the smogon-sheet step further down already knows how to
  // pull forum-attachment URLs — we just need to make sure the species is in
  // `work[]` so it's considered. Derive stems the same way as Showdown-sourced
  // species (base + squashed forme) for filename consistency.
  const existingSlugs = new Set(work.map((w) => w.slug));
  let sheetOnlyAdded = 0;
  for (const [slug, sheet] of smogonSheets) {
    if (existingSlugs.has(slug)) continue;
    if (ONLY && !ONLY.has(slug)) continue;
    if (!sheet.front && !sheet.back) continue; // no usable URL at all
    // Split on first hyphen — base is `urshifu`, formParts is ['rapid', 'strike'];
    // squashed forme is `rapidstrike`. Single-word slugs (no hyphen) stay verbatim.
    const [base, ...formParts] = slug.split('-');
    const stem = formParts.length ? `${base ?? slug}-${formParts.join('')}` : slug;
    work.push({
      rawName: slug,
      slug,
      stem,
      female: false,
      dexId: 0,
      sheetOnly: true,
    });
    existingSlugs.add(slug);
    sheetOnlyAdded++;
  }
  if (sheetOnlyAdded > 0) {
    console.log(`  +${sheetOnlyAdded} sheet-only species (Showdown SPECIES doesn't list them)`);
  }

  // Make local folders.
  await mkdir(`${POKEMON_DIR}/fallback`, { recursive: true });
  for (const v of [...ANIMATED_VARIANTS, ...STATIC_VARIANTS]) {
    if (bucketArg && bucketArg !== v.folder && bucketArg !== v.bucket) continue;
    await mkdir(`${POKEMON_DIR}/${v.folder}`, { recursive: true });
  }
  await mkdir(ITEMS_DIR, { recursive: true });
  await mkdir(TRAINERS_DIR, { recursive: true });

  // Relocate the existing missingno.gif if it's still at the old location.
  const oldMissing = 'public/sprites/fallback/missingno.gif';
  const newMissing = `${POKEMON_DIR}/fallback/missingno.gif`;
  if ((await fileExists(oldMissing)) && !(await fileExists(newMissing))) {
    await rename(oldMissing, newMissing);
    console.log(`  relocated fallback/missingno.gif → pokemon/fallback/missingno.gif`);
  }

  // --- Pokémon sprite downloads ---
  const tierByStem = new Map(); // stem → 'animated' | 'static'
  const hasFemaleSprite = new Set(); // stems where at least one female sprite landed

  const variants = bucketArg
    ? [...ANIMATED_VARIANTS, ...STATIC_VARIANTS].filter(
        (v) => v.bucket === bucketArg || v.folder === bucketArg,
      )
    : [...ANIMATED_VARIANTS, ...STATIC_VARIANTS];

  console.log(`Downloading ${work.length * variants.length} Pokémon sprite candidates…`);
  let downloads = 0;
  let skips = 0;
  let misses = 0;

  // Build (item) tasks: every (species, variant) pair, plus the female alt where applicable.
  // Showdown's female suffix is `-f` (hyphenated): pikachu-f.gif, not pikachuf.gif.
  // The stem already encodes Showdown's canonical naming (forme squashed, base separated
  // by a single hyphen) via pokedex.json — no alt-stem fallback needed.
  const tasks = [];
  for (const w of work) {
    for (const v of variants) {
      tasks.push({ ...w, ...v, suffix: '' });
      if (w.female) tasks.push({ ...w, ...v, suffix: '-f' });
    }
  }

  await plimit(tasks, CONCURRENCY, async (t) => {
    const filename = `${t.stem}${t.suffix}.${t.ext}`;
    const url = `${SD}/${t.bucket}/${filename}`;
    const dest = `${POKEMON_DIR}/${t.folder}/${filename}`;
    const existed = !FORCE && (await fileExists(dest));
    const ok = existed ? true : await downloadOnce(url, dest);
    if (ok) {
      if (existed) skips++;
      else downloads++;
      if (t.suffix === '-f') hasFemaleSprite.add(t.stem);
      else if (t.bucket === 'gen5ani') tierByStem.set(t.stem, 'animated');
      else if (t.bucket === 'gen5' && !tierByStem.has(t.stem))
        tierByStem.set(t.stem, 'static');
    } else if (t.suffix !== '-f') {
      // Only count base-variant 404s — female 404s are expected for non-dimorphic species.
      misses++;
    }
    if ((downloads + misses + skips) % 200 === 0) {
      process.stdout.write(
        `\r  done: ${downloads} new, ${skips} skipped, ${misses} 404s   `,
      );
    }
  });
  console.log(`\n  total: ${downloads} new, ${skips} skipped, ${misses} 404s`);

  // --- Smogon-sheet gap-closing ---
  if (!SKIP_SMOGON && smogonSheets.size > 0) {
    const gapSpecies = work.filter((w) => !tierByStem.has(w.stem));
    if (gapSpecies.length > 0) {
      console.log(`Smogon-sheet gap-closing for ${gapSpecies.length} species…`);
      let closed = 0;
      for (const w of gapSpecies) {
        const sheet = smogonSheets.get(w.slug);
        if (!sheet) continue;
        const variantToUrl = {
          [`${POKEMON_DIR}/animated/${w.stem}.gif`]: sheet.front,
          [`${POKEMON_DIR}/animated-back/${w.stem}.gif`]: sheet.back,
          [`${POKEMON_DIR}/animated-shiny/${w.stem}.gif`]: sheet.frontShiny,
          [`${POKEMON_DIR}/animated-back-shiny/${w.stem}.gif`]: sheet.backShiny,
        };
        let any = false;
        for (const [dest, url] of Object.entries(variantToUrl)) {
          if (!url) continue;
          if (await downloadOnce(url, dest)) any = true;
        }
        if (any) {
          tierByStem.set(w.stem, 'animated');
          closed++;
        }
      }
      console.log(`  closed ${closed} gaps from Smogon community sheets`);
    }
  }

  // --- Item icons + trainers ---
  console.log('Downloading item icons + trainer portraits…');
  const [itemFiles, trainerFiles] = await Promise.all([
    listDirectory('itemicons'),
    listDirectory('trainers'),
  ]);
  const itemTasks = [...itemFiles].map((f) => ({
    url: `${SD}/itemicons/${f}`,
    dest: `${ITEMS_DIR}/${f}`,
  }));
  const trainerTasks = [...trainerFiles].map((f) => ({
    url: `${SD}/trainers/${f}`,
    dest: `${TRAINERS_DIR}/${f}`,
  }));
  await plimit([...itemTasks, ...trainerTasks], CONCURRENCY, async (t) => downloadOnce(t.url, t.dest));
  console.log(`  ${itemFiles.size} items + ${trainerFiles.size} trainers`);

  // --- Emit src/data/speciesIndex.ts ---
  const indexEntries = work
    .map((w) => {
      const tier = tierByStem.get(w.stem) ?? 'missing';
      return [w.slug, { stem: w.stem, female: hasFemaleSprite.has(w.stem), tier }];
    })
    .sort(([a], [b]) => a.localeCompare(b));

  const tsRows = indexEntries
    .map(([slug, data]) => `  ${JSON.stringify(slug)}: ${JSON.stringify(data)},`)
    .join('\n');

  const tierCounts = { animated: 0, static: 0, missing: 0 };
  for (const [, data] of indexEntries) tierCounts[data.tier]++;

  const tsFile = `// AUTO-GENERATED by scripts/fetch-sprites.mjs — do not edit by hand.
// Source: Pokémon Showdown gen5ani / gen5 buckets + Smogon BW Sprite Project sheets.
// See ASSETS.md.

export type SpriteTier = 'animated' | 'static' | 'missing';

export interface SpriteIndexEntry {
  /** Sprite filename stem (no extension): 'bulbasaur', 'nidoranf', 'mrmime-galar'. */
  readonly stem: string;
  /** When true the species also ships a \`\${stem}f.\${ext}\` female-distinct sprite. */
  readonly female: boolean;
  /** Best available tier at vendor time: animated > static > missing. */
  readonly tier: SpriteTier;
}

export const SPRITE_INDEX: Record<string, SpriteIndexEntry> = {
${tsRows}
};

/** National-Dex generation boundaries from Showdown's sprites/index.js OFFSETS array. */
export const GEN_OFFSETS = ${JSON.stringify(OFFSETS)} as const;
`;
  await mkdir('src/data', { recursive: true });
  await writeFile(INDEX_TS, tsFile);
  console.log(`Wrote ${INDEX_TS} (${indexEntries.length} entries — animated ${tierCounts.animated} / static ${tierCounts.static} / missing ${tierCounts.missing}).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
