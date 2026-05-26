# React components

## Structure

- **Primitives** (`ui/primitives/`) — dumb, reusable, no game knowledge (Box, Button, HpBar, TypeChip).
- **Feature components** (`ui/combat/`, `ui/map/`, …) — compose primitives, read selectors.
- **Screens** (`ui/screens/`) — top-level views switched by the `screen` enum in the store.

## Rules

- **One component per file**, named export, colocated `.module.css` and `.test.tsx`.
- **Composition over configuration.** Prefer children and small focused props over a god-component with 20 boolean flags.
- **Presentational where possible.** Components receive data + callbacks; game decisions happen in the store/logic layer, not in JSX.
- **No business logic in render.** Compute via selectors; render reads the result.
- **Forwarded `className`/`style` props** are typed `string | undefined` (see [typescript.md](typescript.md)).
- **Accessibility:** interactive elements are real `<button>`s; groups use `role` + `aria-label`; focus-visible styles are required.
- **i18n:** no hardcoded user-facing strings — use `t('...')`. Keys live in `src/locales/`.
