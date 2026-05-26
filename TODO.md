# Pokespire — Task List

Epoch-based roadmap. **v0 = MVP** (a complete, fun, playable game). Later epochs add scope.
Full design rationale lives in [`wiki/`](wiki/); technical standards in [`rules/`](rules/).

Structure: **Parts** group the work; each **task** is sized to be **one commit**
(atomic, gitmoji). Tackle parts roughly in order; reorder freely if dependencies hold.
**Completed tasks are deleted** from this file — git history + `CHANGELOG.md` hold the record.

Legend: `[ ]` todo · `[~]` in progress

---

## v0 — MVP

### Scaffold + PWA + i18n

- [ ] Browser verification (dev server, SW registration, install prompt, lang toggle) — needs user

### Combat vertical slice

- [ ] `effects.ts` registry (consumes the `CardDef`/`Effect` shapes already defined)
- [ ] ~15 starter cards incl. ORB + 1 weather card (`cards.ts`)
- [ ] Pure combat `reducer.ts` + `actions.ts`
- [ ] `damage.ts` — levelScale + atk/def scale + STAB + eff + weather/item hooks + tests
- [ ] `capture.ts` — capture chance vs missing HP + tests
- [ ] `selectComputedCardView` selector (live computed card damage)
- [ ] Statuses BURN + WEAK; `statusTick.ts`
- [ ] Enemy intent (`intent.ts`)
- [ ] `services/pokeapi.ts` (typed client + zod)
- [ ] `services/sprites.ts` (BW animated, live fetch + in-memory cache)
- [ ] BattleStage + Hand + Card UI with effectiveness tags + tooltip
- [ ] Switch with fake 6-mon team
- [ ] End-of-demo overlay (win / capture / faint)

### Persistence + dex + shinies

- [ ] Dexie `schema.ts` (meta / runs / cache stores)
- [ ] Persist captures + settings; sprite cache survives reload
- [ ] DexScreen: BW sprite + cry + evolution-line viz
- [ ] Shiny roll (1/256) + catch ×5 + `unlockedShinies` + shiny indicator
- [ ] Save export (`export.ts`) → JSON download
- [ ] Save import (`import.ts`) with schemaVersion check

### Run loop + XP + evolutions

- [ ] Seeded RNG (`rng.ts`, mulberry32)
- [ ] Map DAG generation (`generate.ts`) + tests
- [ ] Map resolve / navigation (`resolve.ts`)
- [ ] StarterSelect (5 default + captured base-forms + solo toggle)
- [ ] XP curves (`growthCurves.ts`, all 6) + tests
- [ ] XP award (active full / bench 50%) (`award.ts`)
- [ ] Evolutions (`evolutions.gen1.ts` + `trigger.ts`) at canonical levels
- [ ] Move-learn 1-of-3 draft on evolve
- [ ] Stone reward nodes
- [ ] 1-of-3 card reward screen
- [ ] Boss node + run end → meta update
- [ ] Mid-combat save/resume

### Items, weather, shops, economy

- [ ] `heldItems.ts` registry (v0 set) + lifecycle hooks
- [ ] Equip / swap held item UI
- [ ] `berries.ts` auto-trigger consumables
- [ ] `weather.ts` cards (damage mult + chip tick) + WeatherIndicator
- [ ] Gold in `RunState.inventory`
- [ ] Shop nodes (`shops.ts`): cards / stones / items / berries / lures / card-removal
- [ ] Attractor / Lure encounter biasing
- [ ] Daycare rest option
- [ ] TM cards

### Special mons + solo mode

- [ ] `legendaryBosses.ts` (Articuno / Zapdos / Moltres / Mewtwo / Mew)
- [ ] Run final boss can roll a special mon
- [ ] Catch (low rate) → solo-starter unlock
- [ ] Solo mode: team cap 1, no switch, captures dex-only (special + self-imposed)

### Ascension ladder

- [ ] `ascensions.ts` A0-20 named modifiers + A21+ endless scaling
- [ ] `run/modifiers.ts` applies to map gen, enemy stats, rewards, team cap, XP share, combat
- [ ] `meta.ascensionProgress` per mode
- [ ] A5 Encounter-Targeting (5 species + 1 boss spawn bias)

### Full content + polish

- [ ] All 151 species (`pokedex.gen1.ts`)
- [ ] Full enemy roster + intent tables
- [ ] Final ~60-100 card pool + balance pass
- [ ] Smogon sprite fallback verified
- [ ] Mobile 360px layout
- [ ] Credits screen + `ASSETS.md`
- [ ] FR/EN strings complete

---

## Future epochs

### v1 · Pokémon enhancement

- [ ] Gens 2-9 data (sprite resolver already handles them)
- [ ] Special forms: paradox / Gmax / mega-evolution (all solo-only)
- [ ] More legendaries / mythicals
- [ ] Expanded card pool

### v1+ · Friendship meta

- [ ] `meta.capturedDex[dexId].friendship` ticking per battle won with a species active
- [ ] Cosmetic flair + small capped damage bonus at thresholds

### Future hooks (typed, no impl in v0)

- [ ] Event / rest content beyond stubs
- [ ] Relics / passives slice
- [ ] Cloud-sync interface (last-write-wins; UUIDs + updatedAt already in schema)
- [ ] Multiplayer / leaderboards
- [ ] BGM (cries only in v0)

---

## ⚠️ Placeholder assets to replace before launch

Temporary; must be swapped for real artwork:

- [ ] `public/icons/icon-192.png`, `icon-512.png`, `icon-512-maskable.png` — generated placeholder PWA icons (plain bordered box). Need a real Pokespire app icon.
- [ ] `public/sprites/fallback/unknown.png` — generated placeholder "unknown sprite". Need a proper "missing Pokémon" graphic.
- [ ] TitleScreen logo is plain text — consider a real pixel-art wordmark.
