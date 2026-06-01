# Vendor everything — sprites, stats, i18n names

## Context

We've been gitignoring `public/sprites/pokemon/` because the sprites needed a rework. Three converging concerns now drive a single architecture pass:

1. **Sprites need vendoring.** Drop the gitignore entry. A fresh clone ships with every sprite — the PWA works fully offline, no Showdown / PokéAPI cold-start latency.
2. **PokéAPI shouldn't be a runtime dependency.** The shipped app never makes external API calls. PokéAPI usage is restricted to vendor-time (`npm run fetch-pokedex`) — a developer-only data extraction step.
3. **Localized Pokémon names.** Right now `Combatant.name` is hardcoded English ("Charmander"), so the FR locale still shows "Charmander" instead of "Salamèche". Names must flow through i18n the same way card names already do.

The Pokémon roster goes from "Gen 1 only" to "Gens 1-8" — the natural boundary of Showdown's BW Sprite Project. **No 3D / HOME mixing**: we stay pure BW aesthetic. If a mon doesn't have a Gen-5-style sprite (animated OR static), it gets missingno — never a HOME render alongside BW art. Gen 9 (Paldea) is out of scope; the user can revisit when the BW project covers more of it (or when we accept a different aesthetic compromise). This is sibling work to the C-epoch combat rework — independent files, can land in either order.

## Data architecture — who owns what

**Every external source below is consumed ONLY at vendor time** (`npm run fetch-pokedex` / `npm run fetch-sprites`). The shipped PWA reads only local files — works fully offline.

| Source                                                | What it gives us                                                                                                                                                                                                                                     |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Showdown** `data/pokedex.json`                      | Base stats, types, abilities, height/weight, evolution chains (`evos`/`prevo`/`evoLevel`/`evoItem`/`evoCondition`/`evoMove`), `genderRatio`, `gen`, `tier`, `isNonstandard`, all form metadata                                                       |
| **Showdown** `sprites/index.js` + `sprites/<bucket>/` | Canonical filename list (`SPECIES` array) and the actual sprite assets                                                                                                                                                                               |
| **PokéAPI** `/pokemon-species/{id}`                   | The 3 fields Showdown lacks: **`catch_rate`**, **`growth_rate`**, **`base_experience`**; plus **localized names** per language (FR/EN)                                                                                                               |
| **Smogon BW Sprite Project sheets**                   | Gap-closing source for sprites — community trackers that are upstream of Showdown's CDN. Consulted during `fetch-sprites` whenever a species comes up missing in Showdown's buckets, and again at `audit-coverage` to surface anything still missing |
| **Hand-authored** (in the fetch script)               | Pokestar defaults (`catchRate: 3`, `growthRate: 'slow'`), CAP filter list                                                                                                                                                                            |

The Smogon sheets are four public Google Spreadsheets (one per Gen 6 / 7 / 8 / 9 batch) where contributors track BW-style sprite work. Each row carries: dex number, name, Front URL, Back URL, Front-shiny URL, Back-shiny URL, Spriter, QC status. URLs point to smogon.com forum attachments. CSV export works without auth (`https://docs.google.com/spreadsheets/d/<id>/export?format=csv&gid=0`). They're consulted automatically during `fetch-sprites` whenever Showdown's bucket returns a 404 for a species — we pull the forum-attachment URL from the sheet and download from there, closing the gap. The runtime never sees the sheets.

End artifacts (all vendored into git) — **source-agnostic names** now that the data is ours:

- `src/data/pokedex.ts` (renamed from `pokedex.gen1.ts`) — Gen 1-8 species data
- `src/data/speciesIndex.ts` — generated sprite-filename / tier / gender-distinct lookup
- `src/locales/{en,fr}/pokemonNames.json` — localized display names
- `public/sprites/pokemon/{animated,static}*/` — sprite assets
- `public/sprites/pokemon/fallback/missingno.gif` — last-resort placeholder (relocated here from `public/sprites/fallback/`)

Identifier rule: once data is fetched, it's **our** data. No `speciesIndex`, `SPRITE_INDEX`, `POKEAPI_NAMES` etc. Generic names: `speciesIndex`, `SPRITE_INDEX`, `GEN_OFFSETS`, `spriteIdOf(speciesName)`. Source attribution stays in fetch-script comments / ASSETS.md only.

**App runtime touches none of these external sources. Zero network calls.**

## Coverage findings

Probed each Showdown endpoint live.

### Sprite buckets

| Bucket                | File count | Coverage notes                                                                                                                                                          |
| --------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gen5ani/`            | 1254       | Gens 1-5 fully animated; Gens 6-8 partial (Chespin / Decidueye / Urshifu all 404); Gen 9 dropped per "limit to Gen 8" decision                                          |
| `gen5ani-shiny/`      | 1251       | Same pattern; occasionally shiny exists when normal doesn't                                                                                                             |
| `gen5ani-back/`       | 1137       | Some forms front-only                                                                                                                                                   |
| `gen5ani-back-shiny/` | 1135       | Same                                                                                                                                                                    |
| `gen5/`               | 1666       | **Static BW PNG fallback — same aesthetic as gen5ani.** Fills every gap in the animated set (Urshifu, Spectrier, Decidueye, all confirmed present). No 3D / HOME mixing |
| `gen5-back/`          | 1662       | Static back PNGs                                                                                                                                                        |
| `gen5-shiny/`         | 1645       | Static shiny PNGs                                                                                                                                                       |
| `gen5-back-shiny/`    | 1641       | Static back-shiny PNGs                                                                                                                                                  |
| `itemicons/`          | 581        | Full canon item set                                                                                                                                                     |
| `trainers/`           | 1455       | All trainer portraits                                                                                                                                                   |

**Sprite fallback chain at runtime — pure BW only:**

1. `pokemon/animated/<stem>.gif` (animated BW, preferred).
2. `pokemon/static/<stem>.png` (static BW PNG — same artistic style, just not animated).
3. `pokemon/fallback/missingno.gif` — when neither exists. No HOME / 3D / mixed-aesthetic fallback ever.

The fetcher writes the chosen tier per species into the generated `SPRITE_INDEX` map so resolution is O(1) and deterministic. **No `home/` / `home-shiny/` downloads** — those are explicitly dropped.

### Scope cap: Gen 8

Showdown's SPECIES OFFSETS array tells us where each gen starts: `[1, 163, 290, 459, 606, 873, 989, 1153]`. We **vendor SPECIES entries up to index < SPECIES.length** but **filter out anything where `pokedex.json` reports `gen === 9`**. The BW project hasn't really tackled Gen 9 yet, and we don't want a half-finished aesthetic.

### Stats — Showdown vs Pokespire's needs

Showdown's `data/pokedex.json` (1517 entries) **has**: `baseStats`, `types`, `abilities`, `evos`, `prevo`, `evoLevel`/`evoItem`/`evoCondition`/`evoMove`/`evoRegion`/`evoType`, `eggGroups`, `genderRatio`, `gen`, `tier`, `isNonstandard`, `baseForme`, `baseSpecies`, `otherFormes`, `formeOrder`, `cosmeticFormes`, `canGigantamax`, etc.

Showdown's `data/pokedex.json` **lacks**: `catchRate`, `growthRate`, `baseExperience`. PokéAPI fills those three at vendor time.

### Filter rules

- ❌ **CAP mons** rejected (~55 names — Smogon Create-A-Pokémon project: Syclar/Syclant, Revenankh, Embirch/Flarelm/Pyroak, Voodoom, Crucibelle, Cawmodore, Volkraken, Snugglow, Kerfluffle, Equilibra, etc.). Identified via `isNonstandard === 'CAP'` flag in Showdown's pokedex.json — that's the cleanest filter and survives Showdown adding new CAP mons.
- ✅ **Pokestar Studios** kept (17 entries, all `name.startsWith('Pokestar')` / `num` is negative). Stats from `pokedex.json`, missing fields default to **`catchRate: 3`** + **`growthRate: 'slow'`** (boss-content tier).
- ✅ **Cosmetic-only forms** kept (Vivillon patterns, Furfrou cuts, Alcremie creams, Unown letters, Sinistea/Polteageist Antique). They share parent stats but ship distinct sprites — surface them in the species data marked `isCosmetic: true` so the deckbuilder can collapse them at the capture-roll level if desired.

## Naming convention — generated, not handwritten

Showdown derives sprite filenames from each `SPECIES` entry by:

- Lowercasing
- Stripping every non-alphanumeric character from the **base name**
- Preserving the hyphen between base and form suffix (`-mega`, `-mega-x`, `-mega-y`, `-primal`, `-alola`, `-galar`, `-hisui`, `-paldea`, `-gmax`, `-libre`, etc.)

Result vs. PokéAPI (which keeps every hyphen):

| Showdown SPECIES entry           | Filename stem              | PokéAPI slug       |
| -------------------------------- | -------------------------- | ------------------ |
| `Bulbasaur*` _(gender-distinct)_ | `bulbasaur` + `bulbasaurf` | `bulbasaur`        |
| `Nidoran-F`                      | `nidoranf`                 | `nidoran-f`        |
| `Mr. Mime*`                      | `mrmime`                   | `mr-mime`          |
| `Farfetch'd*`                    | `farfetchd`                | `farfetchd`        |
| `Ho-Oh`                          | `hooh`                     | `ho-oh`            |
| `Type: Null`                     | `typenull`                 | `type-null`        |
| `Jangmo-o*`                      | `jangmoo`                  | `jangmo-o`         |
| `Tapu Koko`                      | `tapukoko`                 | `tapu-koko`        |
| `Charizard-Mega-X*`              | `charizard-mega-x`         | `charizard-mega-x` |
| `Farfetch'd-Galar*`              | `farfetchd-galar`          | `farfetchd-galar`  |
| `Mr. Mime-Galar*`                | `mrmime-galar`             | `mr-mime-galar`    |

Fetch script derives each stem with `spriteIdFromSpeciesName(name)` (algorithm above), and emits a **generated** TS module — no handwritten special-case table to maintain.

```ts
// src/data/speciesIndex.ts — AUTO-GENERATED
export type SpriteTier = 'animated' | 'static' | 'missing';

export interface SpriteIndexEntry {
  readonly stem: string;        // 'bulbasaur', 'nidoranf', 'mrmime-galar'
  readonly female: boolean;     // true → also has a `${stem}f.gif` variant
  readonly tier: SpriteTier;    // best available tier at fetch time
}

export const SPRITE_INDEX: Record<string, SpriteIndexEntry> = { ... };
export const GEN_OFFSETS = [1, 163, 290, 459, 606, 873, 989, 1153] as const;
export const POKESTAR_SLUGS: readonly string[] = [ ... ];
```

## i18n: Pokémon names through the locale layer

Today `Combatant.name` is hardcoded English. Migrating:

1. **New field on the species + Combatant: `speciesSlug: string`** (the PokéAPI slug, e.g., `'bulbasaur'`, `'mr-mime'`, `'charizard-mega-x'`). Becomes the identity key.
2. **Generated locale files** `src/locales/{en,fr}/pokemonNames.json`:
   ```json
   { "bulbasaur": "Bulbizarre", "charmander": "Salamèche", "squirtle": "Carapuce", … }
   ```
   The fetch-pokedex script writes both files from PokéAPI's `/pokemon-species/{id}/names` array (which carries every official localization).
3. **Existing `Combatant.name` becomes the FALLBACK** for places we haven't migrated yet — keep it so the change is incremental. Set it to the English name at construction time.
4. **i18n at render**: `t('pokemonNames:' + speciesSlug, { defaultValue: pokemon.name })`. Mirrors the `cardNames:` pattern we already use.
5. **Slot tooltip, topbar, dex screen, capture overlay** — every place a species name is rendered switches to the t() call. ~6-8 callsites to update.

Future locales (ES / DE / IT / JP) — drop a new file under `src/locales/<lang>/pokemonNames.json`, re-run `npm run fetch-pokedex --langs=fr,en,es,de,it,ja` — done.

## Folder structure

```
public/sprites/
├── pokemon/
│   ├── animated/             (gen5ani — front animated, preferred)
│   ├── animated-back/        (gen5ani-back)
│   ├── animated-shiny/       (gen5ani-shiny)
│   ├── animated-back-shiny/  (gen5ani-back-shiny)
│   ├── static/               (gen5 — static BW PNG, fallback for missing animated)
│   ├── static-back/          (gen5-back)
│   ├── static-shiny/         (gen5-shiny)
│   ├── static-back-shiny/    (gen5-back-shiny)
│   └── fallback/             (missingno.gif — moved here from public/sprites/fallback/)
├── items/                    (Showdown itemicons — replaces today's 5 hand-picked)
├── trainers/                 (Showdown trainers)
├── bg/                       (existing — meadow biome variants)
└── move-category/            (existing — physical/special/status banners)
```

The folder rename (`ani/` → `animated/`, `gen5/` → `static/`) makes the purpose self-evident without knowing Showdown's bucket history. `fallback/` moves under `pokemon/` since missingno only applies to Pokémon sprites.

Total tracked binary footprint: **~280 MB**. Under GitHub's per-file 100 MB ceiling. If clone times hurt, flip to Git LFS later (out of scope here).

## Implementation

### Phase 1 — scripts

**`scripts/fetch-pokedex.mjs`** — refactor. Combine three input sources, emit two outputs:

```
INPUTS:
  - GET https://play.pokemonshowdown.com/data/pokedex.json → stats + types + abilities + evos
  - GET https://pokeapi.co/api/v2/pokemon-species/{id}     → catchRate, growthRate, baseExperience, names[]
                                                            (per id 1..N where N covers everything in Showdown's data minus CAP)
  - Hardcoded Pokestar defaults (catchRate 3, growthRate slow)

OUTPUTS:
  - src/data/pokedex.ts             → merged SpeciesEntry record (key: speciesSlug)
  - src/locales/en/pokemonNames.json → { speciesSlug: 'Bulbasaur', ... }
  - src/locales/fr/pokemonNames.json → { speciesSlug: 'Bulbizarre', ... }
```

CLI:

```bash
npm run fetch-pokedex                # default: en + fr
npm run fetch-pokedex -- --langs=en,fr,es,de
npm run fetch-pokedex -- --force     # ignore cache, re-pull everything
```

Caching: keep PokéAPI responses in `node_modules/.cache/pokeapi/` (or similar) for re-run speed. PokéAPI is permissively rate-limited but we still don't hammer it.

**`scripts/fetch-sprites.mjs`** — new. Pulls Showdown sprite buckets.

```
1. GET https://play.pokemonshowdown.com/sprites/index.js
   Parse SPECIES + OFFSETS arrays.

2. GET https://play.pokemonshowdown.com/data/pokedex.json (for the CAP filter)
   For each name in SPECIES:
     entry = pokedex[toID(name)]
     if entry?.isNonstandard === 'CAP': skip
     filename_stem = spriteIdFromSpeciesName(name)
     female = name.endsWith('*')

3. Download Pokémon sprites — animated first, static BW PNG as same-aesthetic fallback.
   Showdown bucket → local folder:
     gen5ani            → public/sprites/pokemon/animated/
     gen5ani-back       → public/sprites/pokemon/animated-back/
     gen5ani-shiny      → public/sprites/pokemon/animated-shiny/
     gen5ani-back-shiny → public/sprites/pokemon/animated-back-shiny/
     gen5               → public/sprites/pokemon/static/
     gen5-back          → public/sprites/pokemon/static-back/
     gen5-shiny         → public/sprites/pokemon/static-shiny/
     gen5-back-shiny    → public/sprites/pokemon/static-back-shiny/

   For each species:
     for the 4 animated variants: download(`gen5ani{suffix}/{stem}.gif`)
     for the 4 static variants:   download(`gen5{suffix}/{stem}.png`)
     if female: also try `{stem}f.{ext}` on each variant (silently skip 404)

   Record per-species tier:
     'animated' if at least the front gen5ani sprite succeeded
     'static'   elif at least the front gen5 PNG succeeded
     'missing'  otherwise — no third tier, missingno.gif at runtime

4. Smogon-sheet gap-closing (default on):
   For each species where the Showdown buckets returned a miss on EITHER the
   animated or the static tier, look up the species in the four Smogon project
   sheets (Gen 6 / 7 / 8 / 9 CSVs). For each sheet:
     - CSV-export URL: https://docs.google.com/spreadsheets/d/<id>/export?format=csv&gid=0
     - Columns: dex#, name, Front, Back, Front-shiny, Back-shiny, Spriter, QC
     - For matching rows: parse the forum-attachment URLs and download from
       smogon.com/forums/attachments/... into the appropriate local folder.
     - Upgrade the tier in SPRITE_INDEX accordingly.

   Smogon's sheets are the upstream of Showdown's CDN — community sprites
   often land there weeks before Showdown vendors them. Closing this gap means
   we get latest community work without waiting for Showdown's sync cycle.

   --skip-smogon-sheets flag exists for emergency bypass (e.g., if the sheets
   structure changes), but default is ON.

4. Item icons + trainers — scrape directory HTML, download verbatim.

5. Emit src/data/speciesIndex.ts (auto-generated, banner at top):
     /** AUTO-GENERATED by scripts/fetch-sprites.mjs. Do not edit. */
     export type SpriteTier = 'animated' | 'static' | 'missing';
     export interface SpriteIndexEntry { stem: string; female: boolean; tier: SpriteTier; }
     export const SPRITE_INDEX: Record<string, SpriteIndexEntry> = { ... };
     export const GEN_OFFSETS = [1, 163, 290, 459, 606, 873, 989, 1153] as const;
     export const POKESTAR_SLUGS: readonly string[] = [ ... ];

6. Coverage check — for every species we ship in src/data/pokedex.ts:
   look up its speciesIndex entry, verify tier !== 'missing'.
   Print a friendly summary; exit non-zero if regressions vs prior run.
```

Implementation details — same as `fetch-pokedex.mjs`:

- Native `fetch`, retry x3 with exponential backoff
- 10 parallel downloads via inline `limit(n)` helper
- Atomic writes (`.tmp` → rename)
- Idempotent — skip files already on disk unless `--force`
- CLI:
  ```bash
  npm run fetch-sprites                # default
  npm run fetch-sprites -- --force
  npm run fetch-sprites -- --bucket=ani
  npm run fetch-sprites -- --gen=1
  ```

### Phase 2 — runtime resolver + i18n migration

**[src/services/sprites.ts](src/services/sprites.ts)** — rewrite:

```ts
import { SPRITE_INDEX, type SpriteTier } from '@/data/speciesIndex';

interface SpriteOptions {
  facing?: 'front' | 'back';
  shiny?: boolean;
  female?: boolean;
}

/** Returns local path (always — no remote URLs). Falls back to missingno when tier is 'missing'. */
export function spriteUrl(speciesSlug: string, opts: SpriteOptions = {}): string {
  const entry = SPRITE_INDEX[speciesSlug];
  if (!entry || entry.tier === 'missing') return FALLBACK_SPRITE;
  const facing = opts.facing ?? 'front';
  const shiny = opts.shiny ?? false;
  const female = (opts.female ?? false) && entry.female;
  const stem = female ? `${entry.stem}f` : entry.stem;
  const backSuffix = facing === 'back' ? '-back' : '';
  const shinySuffix = shiny ? '-shiny' : '';
  // tier is either 'animated' (gif) or 'static' (png) — same variant matrix on both.
  const ext = entry.tier === 'animated' ? 'gif' : 'png';
  return `/sprites/pokemon/${entry.tier}${backSuffix}${shinySuffix}/${stem}.${ext}`;
}

export const FALLBACK_SPRITE = '/sprites/pokemon/fallback/missingno.gif';
```

**[src/ui/primitives/PokemonSprite.tsx](src/ui/primitives/PokemonSprite.tsx)** — adopt the new `speciesSlug` field on `Combatant`. The `onError` retry fallback to FALLBACK_SPRITE stays.

**i18n callsites** to update (each switches from `pokemon.name` → `t('pokemonNames:' + pokemon.speciesSlug, { defaultValue: pokemon.name })`):

- [src/ui/combat/PokemonSlot.tsx](src/ui/combat/PokemonSlot.tsx) — slot tooltip title + `aria-label`
- [src/ui/combat/BattleTopBar.tsx](src/ui/combat/BattleTopBar.tsx) — active mon name
- Any future dex / capture overlay (when those land)
- [src/ui/primitives/IntentBadge.tsx](src/ui/primitives/IntentBadge.tsx) — target mini-sprite `alt` text

`Combatant.name` stays as the English fallback (so the type doesn't break and untranslated locales gracefully degrade). The species data layer sets it at construction.

### Phase 3 — coverage audit script

**`scripts/audit-coverage.mjs`** — new. Standalone read-only diagnostic. Run after fetch-pokedex + fetch-sprites complete. Surfaces every species we ship and reports what it's missing across all three concerns.

```
For each speciesSlug in src/data/pokedex.ts:
  - Sprite tier from SPRITE_INDEX (animated / static / missing)
  - PokéAPI fields present? (catchRate, growthRate, baseExperience)
  - Localized name present in each locale we ship?
  - Cross-reference Smogon BW Sprite Project sheets when sprite is 'missing':
      report whether a community sprite exists in the upstream sheets (which
      `fetch-sprites` should have picked up — if audit still flags it, the
      sheet entry probably has an invalid URL or the QC is incomplete).

Emit `coverage-report.json` (gitignored runtime artefact) with:
  {
    "summary": { totalSpecies, animated, static, missingSprite, missingStats, missingLocale },
    "issues": [
      { "speciesSlug": "urshifu", "sprite": "static",   "stats": "ok", "locales": "ok",
        "smogonSheetUrl": "..." },
      { "speciesSlug": "great-tusk", "sprite": "missing", "stats": "ok", "locales": "ok",
        "smogonSheetUrl": null },
      ...
    ]
  }

Print a friendly stdout summary:
  ✓ 1100 species fully covered (animated)
  · 80 species on static fallback (BW PNG, same aesthetic)
  ✗ 23 species missing sprite entirely (listed, with Smogon sheet URLs where applicable)
  ✗ 0 species missing stats
  ✗ 4 species missing FR name (listed)

Exit 0 always — report, not a gate. CI can wire it up to fail later if we want.
```

CLI:

```bash
npm run audit-coverage              # full report (Smogon sheets consulted by default)
npm run audit-coverage -- --json    # machine-readable only
npm run audit-coverage -- --skip-smogon-sheets  # offline / emergency fallback
```

Goal: when the user adds a new species or changes the data source, one command tells them exactly what work is needed. Caught early instead of "user reports a missingno in the dex screen weeks later". The Smogon-sheet cross-reference makes it easy to spot community sprites Showdown hasn't synced yet.

### Phase 4 — `.gitignore` + ASSETS.md

- `.gitignore`: delete `public/sprites/pokemon/`. Sprites become tracked. Add `coverage-report.json` (the audit artefact).
- [ASSETS.md](ASSETS.md): collapse the per-file move-category and items tables into one "Vendored from Pokémon Showdown" section explaining the buckets + the `npm run fetch-sprites` / `npm run fetch-pokedex` / `npm run audit-coverage` commands. Cite the licence (Showdown sprites are community-contributed under their published terms; PokéAPI is CC-BY-SA 4.0).

## Commit plan

Six atomic commits:

1. **🔧 Data pipeline: refactor fetch-pokedex + new fetch-sprites + audit-coverage**
   - `scripts/fetch-pokedex.mjs` (rewrite — Showdown stats + PokéAPI gap-fill + localized names)
   - `scripts/fetch-sprites.mjs` (new — sprite buckets, ani→gen5 fallback, tier mapping)
   - `scripts/audit-coverage.mjs` (new — read-only coverage diagnostic)
   - `package.json` scripts (`fetch-pokedex`, `fetch-sprites`, `audit-coverage`)
   - `src/data/speciesIndex.ts` (generated, first version checked in)
   - `src/data/pokedex.ts` (renamed from `pokedex.gen1.ts`, regenerated Gen 1-8 coverage)
   - `src/services/sprites.ts` (new resolver with ani→gen5 fallback)
   - `src/locales/{en,fr}/pokemonNames.json` (generated)
   - `.gitignore` (drop `public/sprites/pokemon/`, add `coverage-report.json`)
   - `ASSETS.md` (vendored-sources section)
   - Test fixtures patched for the `speciesSlug` field where they exist

2. **🌐 i18n: route Pokémon names through `pokemonNames:` locale keys**
   - `src/ui/combat/PokemonSlot.tsx`, `BattleTopBar.tsx`, `IntentBadge.tsx`, any other ~6 callsites
   - `Combatant` type gains `speciesSlug: string` (and stories / tests get patched in the same commit)
   - **Verify in browser**: FR locale shows Salamèche / Bulbizarre / Carapuce instead of English

3. **🍱 Vendor Pokémon sprites — animated set (gen5ani family)**
   - `public/sprites/pokemon/{animated,animated-back,animated-shiny,animated-back-shiny}/`
   - `public/sprites/pokemon/fallback/missingno.gif` (relocated from `public/sprites/fallback/`)
   - ~260 MB. Push immediately after.

4. **🍱 Vendor Pokémon sprites — static BW fallback (gen5 family)**
   - `public/sprites/pokemon/{static,static-back,static-shiny,static-back-shiny}/`
   - ~20 MB (PNGs are smaller than the GIFs).

5. **🍱 Vendor item icons + trainer portraits from Showdown**
   - `public/sprites/items/*` (581 PNGs — replaces today's 5)
   - `public/sprites/trainers/*` (1455 PNGs)
   - ~5 MB total. Lightweight.

6. **💄 Adopt Showdown sprite paths in remaining callsites + polish**
   - Placeholder for the inevitable "one thing the path rename broke" follow-up.

Splitting the sprite commits per-source-bucket means each push fits comfortably (largest is ~260 MB). If even that chokes, sub-split per-variant (4 commits for ani, 4 for gen5).

## Critical files

- **`scripts/fetch-pokedex.mjs`** — primary fetcher, combines Showdown stats + PokéAPI gap-fill + localized names.
- **`scripts/fetch-sprites.mjs`** (new) — Showdown sprite vendor (ani + gen5 static).
- **`scripts/audit-coverage.mjs`** (new) — coverage diagnostic; reports missing sprites / stats / locale names per species.
- **`src/data/pokedex.ts`** (renamed from `pokedex.gen1.ts`) — vendored Gen 1-8 species data, the runtime source of truth.
- **`src/data/speciesIndex.ts`** (new, generated) — `SPRITE_INDEX` lookup + `POKESTAR_SLUGS`.
- **`src/services/sprites.ts`** — resolver, ani→gen5 fallback chain.
- **`src/locales/{en,fr}/pokemonNames.json`** (new, generated) — localized display names.
- **`src/types/combat.ts`** — `Combatant.speciesSlug: string` field added.
- **`.gitignore`** — drop `public/sprites/pokemon/`, add `coverage-report.json`.
- **`ASSETS.md`** — new "Vendored from Showdown" section.

## Verification

1. `npm run fetch-pokedex && npm run fetch-sprites && npm run audit-coverage` — all complete cleanly; audit-coverage reports ≥99% full coverage across Gen 1-8 (every species has a sprite + stats + FR/EN name).
2. `npm run typecheck && npm run lint && npm test` — green.
3. `npm run dev` → BattleStage canonical scene renders Charmander / Squirtle / Bulbasaur / Pikachu / Eevee / Pidgey with Showdown animated GIFs. Switch language to FR → mon names become **Salamèche / Carapuce / Bulbizarre / Pikachu / Évoli / Roucool** without any other UI change.
4. Manually instantiate a special-name species in a story (Mr. Mime, Nidoran♀, Type: Null) → sprite resolves with no 404 fallback (Network tab shows one 200 response).
5. Force a Gen-8 species with no animated sprite (e.g., Urshifu) into a story → renders the static gen5 PNG fallback, same BW art style, no 3D mixing.
6. Force a Gen-9 species (Sprigatito) → audit-coverage flags it as out-of-scope; sprite resolves to missingno.
7. `git status` after a fresh fetch — clean. Re-runs idempotent.

## Out of scope (deferred)

- **Sprite-sheet slicing for icons.** When small-context icons get demanding, slice `pokemonicons-sheet.png` rather than downscaling gen5ani GIFs at runtime.
- **Pokémon HOME rendering for ALL species.** Right now we use HOME only as a Gen-6-9 fallback. Could be a stylistic choice for the entire dex if the user prefers 3D over BW.
- **Other locales beyond FR / EN.** `fetch-pokedex --langs=...` is built to accept them; just add the language code and run.
- **Git LFS migration.** Only if clone times become painful.
- **Custom-art trainers / items.** User flagged this as future work — Showdown vendoring bridges the gap.
- **Localized move / item names.** Same `pokeApi → locale json` pattern when needed.

## Sibling-project note

This work is parallel to the C-epoch combat-rework still pending in [TODO.md](TODO.md) (C3 initiative queue, C4 TurnTracker, C5 TargetPicker, C6 switch-as-card, C7 per-actor ticks, C8 win/lose-on-faint). Sprite/stats/i18n work shares no files with C3+. Pick whichever feels more energising next — they don't block each other.
