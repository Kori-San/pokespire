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
- **Combat vertical slice** (in progress)
  - Shared domain types: `PokeType` (18 types), base stats, growth rates, statuses, card/effect shapes, and combat state/actions.
  - 18×18 modern type chart with combined dual-type effectiveness (`typeEffectiveness`).
