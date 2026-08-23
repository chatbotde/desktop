# Contributing to Buddy

Thanks for helping. This repo is the **Electron desktop app**. The Android companion is a [separate project](https://github.com/sonicthinking/remote-desktop).

## First 15 minutes

1. [docs/getting-started.md](docs/getting-started.md) — install and `npm run dev`
2. [docs/architecture.md](docs/architecture.md) — how main, renderer, and the phone app connect
3. [docs/features.md](docs/features.md) — pick the feature you will change
4. That feature’s `README.md` (next to the code) + [AGENTS.md](AGENTS.md)
5. [docs/frontend-architecture.md](docs/frontend-architecture.md) — UI import rules

Copy `.env.example` to `.env` if you want env-based keys. Never commit `.env`.

## Development setup

```bash
npm install
cd frontend && npm install
cd ..
npm run dev
```

UI-only: `cd frontend && npm run dev` — see [frontend/DEV.md](frontend/DEV.md).

## Branch names

```
feature/{module}-{short-description}
bugfix/{module}-{short-description}
refactor/{module}-{short-description}
```

Examples: `feature/chat-voice-messages`, `bugfix/capture-overlay-crash`.

## PR scope

| Change type | Stay inside |
|-------------|-------------|
| New UI feature | `frontend/src/features/{name}/` |
| Bug fix | Smallest owning module |
| Shared component | `frontend/src/shared/` or `frontend/src/components/` — extra review |
| AI provider | `frontend/src/services/ai/` |
| IPC / main | `application/`, `auth/`, or the owning root module |
| OS hooks | `interface-window/` |
| Phone protocol | `remote-pad/` **and** a matching PR in remote-desktop |

Avoid one PR that edits two feature folders unless the change is coordinated.

## Module conventions

Every feature exposes a public API via `index.ts`. **Append** new exports; do not re-sort existing lines.

```typescript
// good
import { useChat } from '@/features/chat'

// bad
import { useChat } from '@/features/chat/hooks/useChat'
```

Features must not import other features. Use `shared/`, `services/`, or feature flags.

## Adding a feature

1. Create `frontend/src/features/{name}/` with `components/`, `hooks/`, `types/`, `index.ts`
2. Append a namespace export in `frontend/src/features/index.ts`
3. Wire it in `frontend/src/app/`
4. Optional: `.feature.ts` under `features/feature-flags/definitions/`
5. Add or update that feature’s `README.md` and a row in [docs/features.md](docs/features.md)

## Review checklist

**Authors**

- [ ] One feature module (or a justified shared change)
- [ ] Barrel `index.ts` updated
- [ ] No `../../` cross-module imports
- [ ] Incomplete work behind a feature flag
- [ ] No secrets in the diff

**Reviewers**

- [ ] Imports use `@/` barrels
- [ ] Global `document` / `window` listeners are cleaned up
- [ ] Overlay handlers are scoped

## Testing

```bash
cd frontend && npm test
cd frontend && npm run lint
npm run build:all          # before release PRs
```

## Cursor / AI assistants

Project rules: `.cursor/rules/`. Agents should read `AGENTS.md` first.

## Code of conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
