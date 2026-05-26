# PWA

Configured via `vite-plugin-pwa` in `vite.config.ts`. Registered in `services/pwa.ts`.

- **Strategy:** `registerType: 'autoUpdate'` — the service worker updates in the background and takes over on next load.
- **Precache:** app shell (JS/CSS/HTML), fonts (woff2), icons.
- **Runtime cache (`CacheFirst`):**
  - `pokeapi` — `https://pokeapi.co` responses (1000 entries, 30 days).
  - `sprites` — sprite host responses (2000 entries, 30 days).
  - Each user's cache is private and origin-scoped; there is no shared backend.
- **Offline goal:** once a Pokémon has been seen, its data + sprite play offline. App shell always works offline after first load.
- **Manifest:** standalone display, portrait, theme `#283058`. Icons in `public/icons/` (currently placeholders — see `TODO.md`).
- **Testing:** verify in DevTools → Application → Service Workers / Manifest. Hard-reload twice to confirm update flow.
