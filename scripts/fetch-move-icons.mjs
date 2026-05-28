// Asset pipeline: vendor the HGSS move-category icons from Bulbapedia.
// These are the canonical Gen-IV-onward physical / special / status icons. Three tiny
// PNGs (~1 KB each) — committed once, served locally, never re-fetched at runtime. Credit
// Bulbapedia in ASSETS.md.
//
// Usage:
//   npm run fetch-move-icons                full run
//   npm run fetch-move-icons -- --dry-run   report only, no writes
import { mkdir, writeFile, access } from 'node:fs/promises';

const OUT_DIR = 'public/sprites/move-category';
const SOURCE = 'https://archives.bulbagarden.net/wiki/Special:FilePath';

const ICONS = [
  { name: 'physical', file: 'PhysicalIC_HGSS.png' },
  { name: 'special', file: 'SpecialIC_HGSS.png' },
  { name: 'status', file: 'StatusIC_HGSS.png' },
];

const DRY_RUN = process.argv.includes('--dry-run');

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function fetchIcon({ name, file }) {
  const url = `${SOURCE}/${file}`;
  const target = `${OUT_DIR}/${name}.png`;
  if (DRY_RUN) {
    console.log(`[dry] ${url} → ${target}`);
    return;
  }
  if (await exists(target)) {
    console.log(`[skip] ${target} already vendored`);
    return;
  }
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(target, buf);
  console.log(`[ok]   ${target} (${buf.length} bytes)`);
}

await mkdir(OUT_DIR, { recursive: true });
for (const icon of ICONS) {
  await fetchIcon(icon);
}
