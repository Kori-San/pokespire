# Data loading

## PokéAPI

- Single typed client in `services/pokeapi.ts`: `fetch` → zod parse → typed result. No raw `fetch` elsewhere.
- **Lazy + cached.** Fetch a species on first encounter; persist to the Dexie `cache` store with a 30-day TTL. The PWA service worker also caches the responses at the network layer (`CacheFirst`).
- **Retry** transient failures with backoff; surface a typed error after exhausting retries.
- The 18 `/type/{id}` endpoints are **not** used at runtime — the type chart is hardcoded to avoid boot round-trips.
- Endpoints used: `/pokemon/{id}` (sprites, types, stats, base_experience), `/pokemon-species/{id}` (dex#, growth_rate, flavor), `/evolution-chain/{id}`.

## Sprites

- `services/sprites.ts` resolver chain: cache → PokéAPI Gen-5 BW animated (`sprites.versions['generation-v']['black-white'].animated`) → Smogon Sprite Project → local `/sprites/fallback/unknown.png`.
- Resolve normal and shiny variants.

## Validation boundary

External data is **untrusted** until parsed. Save-file import checks `schemaVersion` and rejects unknown future versions. Our own bundled data (`cards.ts`, `typeChart.ts`) is trusted.
