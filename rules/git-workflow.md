# Git workflow

## Commits

- **Gitmoji** lead each message (e.g. `✨ Add combat reducer`, `🐛 Fix STAB rounding`, `📦 …`, `💄 …`, `✅ …`, `📝 …`, `🔧 …`).
- **Atomic and isolated.** **One task = one commit** — each checkbox in [`../TODO.md`](../TODO.md) is sized to be a single commit. Dependency/config changes are their own commits, separate from feature code.
- Imperative, concise subject; body explains _why_ when non-obvious.

## Hooks (Husky)

- **pre-commit** runs `lint-staged` (Prettier + ESLint on staged files) **and** the full Vitest suite (`npm test`). Both must pass. No pre-push hook.
- Do not bypass hooks (`--no-verify`) unless explicitly authorized — fix the underlying issue.

## Branches

- `main` is the integration branch. Feature work on short-lived branches when collaborating.
