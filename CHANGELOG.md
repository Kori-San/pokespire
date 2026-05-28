# Changelog

All notable changes to Pokespire are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project uses an epoch-based roadmap (see [`TODO.md`](TODO.md)); versions are not semver-rigid.

## [Unreleased]

### Added

- **Scaffold + PWA + i18n**
  - Vite + React 18 + TypeScript project with strict tsconfig.
  - Tooling: ESLint (flat config, type-checked), Prettier, Vitest + Testing Library, Husky + lint-staged (pre-commit runs format + lint + the full test suite).
  - Self-hosted OFL fonts (Press Start 2P, Pixelify Sans) and design tokens (`tokens.css`) preserving the prototype PAL palette plus all 18 Pokémon type colors.
  - PWA via `vite-plugin-pwa`: web manifest, auto-update service worker, runtime caching for PokéAPI + sprite origins.
  - Internationalization via `react-i18next` with French and English locales, surfaced as a globe button opening a flag dropdown (UK / France).
  - TitleScreen with GBA-era chrome and a New Game button.
  - Documentation: `rules/` (technical standards), `wiki/` (game design), numbered `planning/` plans, and `CLAUDE.md` (agent working agreement).
- **Developer tooling**
  - Storybook 10 (React + Vite) with a11y addon and stories for the UI primitives; PWA disabled under Storybook so it builds cleanly.
  - Hardened ESLint to `strict-type-checked` + `stylistic-type-checked`, with the Storybook and Vitest plugins; added a `cx` class-name helper.
  - Autoprefixer + a generous browserslist (`last 2 years`, `> 0.5%`, Firefox ESR, not dead).
  - Pre-commit now also runs a `tsc` typecheck (lint-staged → typecheck → tests).
  - `npm run dev:all` runs the app and Storybook together (via `concurrently`).
  - GitHub Actions CI (typecheck/lint, tests + coverage, build) and Dependabot (npm + github-actions, grouped minor/patch, ⬆️ gitmoji prefix).
  - commitlint with a gitmoji rule (`commit-msg` hook) enforcing our `<gitmoji> <subject>` style.
  - Vitest v8 coverage (`npm run test:coverage`, report-only) and a `knip` script for unused-code detection.
  - `eslint-plugin-i18next` flags hardcoded user-facing JSX text in app code.
  - Claude Code permission guardrails (`.claude/settings.json`): plan-mode default, deny push/force/reset/clean/secret reads; a sectioned `.gitignore`.
- **Combat vertical slice** (in progress)
  - Shared domain types: `PokeType` (18 types), base stats, growth rates, statuses, card/effect shapes, and combat state/actions.
  - 18×18 modern type chart with combined dual-type effectiveness (`typeEffectiveness`).
  - Deterministic damage formula (`calcDamage`): STAB, type effectiveness with a chip floor for immunities, level + base-stat scaling, plus WEAK / weather / held-item hooks. Returns a full breakdown for the live card display; covered by worked-example tests.
  - Capture math (`calcCaptureChance` / `rollCapture`) using the real Gen III/IV formula: a small catch chance even at full HP that rises as HP drops, real ball tiers (Poké/Great/Ultra/Master), a shiny ×5 bonus, and an injected RNG for determinism.
  - Status registry (BURN, WEAK) with `applyStatus` and an end-of-turn `tickStatuses` (tick damage then per-stack decay).
  - Deck helpers (seeded shuffle + draw with discard reshuffle), data-driven effect executor (`applyEffect`), and a ~18-card starter pool (incl. weather + ball cards).
  - Enemy intent AI, a seeded resumable RNG (`rngFrom`), and the pure combat reducer (`createCombat` + PLAY_CARD / SWITCH / END_TURN with enemy phase, status ticks, faints, next-turn draw).
  - `ASSETS.md` asset-tracking registry — every committed binary asset gets a row with source URL, license, and refresh command; updated in the same commit that adds the asset.
  - `HpBar` primitive — banded fill colors (high / mid / low) over a GBA-tinted track, with Storybook stories at each tier.
  - `TypeChip` primitive — small 18-type tinted chip for surfacing a Pokémon's typing, with one story per type.
  - `EnergyPip` + `EnergyBar` primitives — GBA-flavored slanted bars in a `current`-out-of-`max` row. Used by hand cards (cost) and the combat HUD (remaining energy this turn).
  - Missingno fallback sprite (`public/sprites/fallback/missingno.gif`), replacing the placeholder `unknown.png`. Credit: RetroNC on DeviantArt.
  - **Pokédex vendoring pipeline:** `scripts/fetch-pokedex.mjs` (`npm run fetch-pokedex`) downloads Gen 1 data + BW-animated sprites locally so we self-host them (no runtime PokéAPI). All-gens, multi-form schema — per-form types/stats/sprites keyed by `formId`, plus generation, growth/catch rate, gender data, evolution links, and legendary/mythical/mega/Gmax + solo-only flags. Modes: `--dry-run`, `--skip-existing`, `--only`.
