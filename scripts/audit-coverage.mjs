// Coverage audit — surfaces every species we ship and reports what's missing.
//
// Cross-references three artefacts produced by the other fetch scripts:
//   - src/data/pokedex.ts                  (per-species data — catchRate, growthRate, baseExperience)
//   - src/data/speciesIndex.ts             (per-species sprite tier — animated / static / missing)
//   - src/locales/{lang}/pokemonNames.json (localized display names)
//
// Optionally consults the Smogon BW Sprite Project sheets (default ON) so a
// 'missing' sprite gets a hint about whether a community sprite exists upstream.
//
// Emits coverage-report.json (gitignored) for machine-readable use, and prints
// a friendly summary to stdout. Exit 0 always — this is a report, not a gate.
//
// USAGE:
//   npm run audit-coverage
//   npm run audit-coverage -- --json              (machine-readable only)
//   npm run audit-coverage -- --skip-smogon-sheets
import { readFile, writeFile } from 'node:fs/promises';

const POKEDEX_PATH = 'src/data/pokedex.ts';
const SPRITE_INDEX_PATH = 'src/data/speciesIndex.ts';
const REPORT_PATH = 'coverage-report.json';
const LANGS = ['en', 'fr']; // Audit these locales.

const SMOGON_SHEETS = [
  { gen: 6, id: '1Gn0UORn-unvcbUeQhQdEBz0ADNcH49BZZqQ1dpXm9eo' },
  { gen: 7, id: '1FMcHbSKEWZc7v2Ur4cyJjT_NhO0gqXyU9kDhsOQhlBQ' },
  { gen: 8, id: '1acgzAjh0dnFRQnjZu8kSjS177rKCzpFfEHRLtwuuXRU' },
  { gen: 9, id: '1MCjDktTOOFjLKM5C-RW6SfBQGkjlxDSCZAZDma_ItuA' },
];

const args = process.argv.slice(2);
const JSON_ONLY = args.includes('--json');
const SKIP_SMOGON = args.includes('--skip-smogon-sheets');

/** Pull every `"slug": {…}` from a generated TS data module. */
function parseGeneratedTs(src, recordName) {
  const start = src.indexOf(`export const ${recordName}`);
  if (start === -1) throw new Error(`${recordName} not found in module`);
  const open = src.indexOf('{', start);
  // Walk to the matching closing brace, depth-aware (skipping strings).
  let depth = 0;
  let i = open;
  let inStr = false;
  let strCh = '';
  while (i < src.length) {
    const c = src[i];
    if (inStr) {
      if (c === '\\') i++;
      else if (c === strCh) inStr = false;
    } else if (c === '"' || c === "'") {
      inStr = true;
      strCh = c;
    } else if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) {
        return JSON.parse(src.slice(open, i + 1));
      }
    }
    i++;
  }
  throw new Error(`${recordName}: brace mismatch`);
}

async function loadJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

function pokeApiSlug(name) {
  return name
    .toLowerCase()
    .replace(/\*+$/, '')
    .replace(/['’.]/g, '')
    .replace(/:/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function parseCsv(text) {
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const cells = [];
    let buf = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuote && line[i + 1] === '"') {
          buf += '"';
          i++;
        } else inQuote = !inQuote;
      } else if (c === ',' && !inQuote) {
        cells.push(buf);
        buf = '';
      } else buf += c;
    }
    cells.push(buf);
    rows.push(cells);
  }
  return rows;
}

async function loadSmogonHints() {
  if (SKIP_SMOGON) return new Map();
  const map = new Map();
  for (const sheet of SMOGON_SHEETS) {
    try {
      const res = await fetch(
        `https://docs.google.com/spreadsheets/d/${sheet.id}/export?format=csv&gid=0`,
      );
      if (!res.ok) continue;
      const rows = parseCsv(await res.text());
      for (const row of rows) {
        const [num, name, front] = row;
        if (!num || !name || !/^\d+$/.test(num.trim())) continue;
        const slug = pokeApiSlug(name);
        const url = front?.trim() || null;
        if (url) {
          map.set(slug, {
            gen: sheet.gen,
            sheetUrl: `https://docs.google.com/spreadsheets/d/${sheet.id}/`,
            spriteUrl: url,
          });
        }
      }
    } catch {
      // ignore — audit shouldn't block on network errors
    }
  }
  return map;
}

async function main() {
  const [pokedexSrc, spriteSrc] = await Promise.all([
    readFile(POKEDEX_PATH, 'utf8'),
    readFile(SPRITE_INDEX_PATH, 'utf8'),
  ]);
  const pokedex = parseGeneratedTs(pokedexSrc, 'POKEDEX');
  const sprites = parseGeneratedTs(spriteSrc, 'SPRITE_INDEX');
  const locales = Object.fromEntries(
    await Promise.all(
      LANGS.map(async (l) => [l, await loadJson(`src/locales/${l}/pokemonNames.json`)]),
    ),
  );
  const smogonHints = await loadSmogonHints();

  const summary = {
    totalSpecies: 0,
    animated: 0,
    static: 0,
    missingSprite: 0,
    missingStats: 0,
    missingLocale: Object.fromEntries(LANGS.map((l) => [l, 0])),
  };
  const issues = [];

  for (const [slug, entry] of Object.entries(pokedex)) {
    summary.totalSpecies++;
    const sprite = sprites[slug];
    const tier = sprite?.tier ?? 'missing';
    if (tier === 'animated') summary.animated++;
    else if (tier === 'static') summary.static++;
    else summary.missingSprite++;

    const statsOk =
      typeof entry.catchRate === 'number' &&
      typeof entry.growthRate === 'string' &&
      typeof entry.baseExperience === 'number';
    if (!statsOk) summary.missingStats++;

    const localeStatus = {};
    let missingLocale = false;
    for (const l of LANGS) {
      const ok = Boolean(locales[l][slug]);
      localeStatus[l] = ok ? 'ok' : 'missing';
      if (!ok) {
        summary.missingLocale[l]++;
        missingLocale = true;
      }
    }

    if (tier === 'missing' || !statsOk || missingLocale) {
      issues.push({
        speciesSlug: slug,
        displayName: entry.displayName,
        sprite: tier,
        stats: statsOk ? 'ok' : 'missing',
        locales: localeStatus,
        ...(tier === 'missing' && smogonHints.has(slug) ? { smogonHint: smogonHints.get(slug) } : {}),
      });
    }
  }

  await writeFile(REPORT_PATH, JSON.stringify({ summary, issues }, null, 2));

  if (JSON_ONLY) {
    console.log(JSON.stringify({ summary, issues }, null, 2));
    return;
  }

  const fullyCovered = summary.totalSpecies - summary.missingSprite - summary.missingStats;
  console.log('');
  console.log(`  ✓ ${summary.animated} species with animated sprite`);
  console.log(`  · ${summary.static} on static BW fallback (same aesthetic)`);
  console.log(`  ✗ ${summary.missingSprite} missing any sprite`);
  console.log(`  ✗ ${summary.missingStats} missing stats (catchRate / growthRate / baseExperience)`);
  for (const l of LANGS) {
    console.log(`  ✗ ${summary.missingLocale[l]} missing ${l} name`);
  }
  console.log('');
  console.log(`Total species: ${summary.totalSpecies}    Full-coverage: ${fullyCovered}`);
  console.log(`Report: ${REPORT_PATH}`);

  if (summary.missingSprite > 0 && !SKIP_SMOGON) {
    const withHint = issues.filter((i) => i.smogonHint).length;
    if (withHint > 0) {
      console.log(`\n  ${withHint} missing sprites have a Smogon community hint:`);
      for (const it of issues.filter((i) => i.smogonHint).slice(0, 10)) {
        console.log(`    ${it.speciesSlug.padEnd(28)} gen${it.smogonHint.gen}: ${it.smogonHint.spriteUrl}`);
      }
      if (withHint > 10) console.log(`    … and ${withHint - 10} more (see ${REPORT_PATH})`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
