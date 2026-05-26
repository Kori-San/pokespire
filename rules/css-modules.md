# CSS Modules

- **One `.module.css` per component**, colocated. Import as `import styles from './X.module.css'`.
- **Tokens only.** Colors, fonts, spacing, radii come from `src/styles/tokens.css` custom properties (`var(--box-border)`, `var(--type-fire)`, …). No hardcoded hex in component CSS.
- **The palette is canonical.** `--box-*`, `--sky-*`, `--grass-*`, `--hp-*` are preserved verbatim from the design prototype. The 18 `--type-*` colors are the real Pokémon type palette.
- **Mobile-first.** Base styles target ~360px width; layer larger breakpoints with `min-width` queries. The game must work at 360px.
- **Pixel aesthetic.** `image-rendering: pixelated`, no anti-aliased font smoothing, integer-ish spacing. GBA-era chrome: white box, blue tube border.
- **Class names** are local and semantic (`.panel`, `.menu`), not utility soup.
- **No global styles** except `global.css` (reset + base) and `tokens.css`.
