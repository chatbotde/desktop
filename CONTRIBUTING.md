# Contributing to Buddy

This guide helps multiple developers work in parallel without merge conflicts.

## Repository Layout

Buddy is a monorepo. Most UI work happens in `frontend/`. Electron main-process code lives at the repo root and in `application/`, `auth/`, and `interface-window/`.

**Read before your first change:**
- `AGENTS.md` — quick navigation for agents and new contributors
- `frontend/ARCHITECTURE.md` — module structure and import rules

## Development Setup

```bash
npm install          # root (includes electron deps)
cd frontend && npm install
npm run dev          # starts Vite + Electron
```

Copy `.env.example` to `.env` and fill in required keys.

## Branch Strategy

```
feature/{module}-{short-description}
bugfix/{module}-{short-description}
refactor/{module}-{short-description}
```

Examples:
- `feature/chat-voice-messages`
- `bugfix/capture-overlay-crash`
- `refactor/settings-appearance`

## PR Scope Rules

| Change type | Scope |
|-------------|-------|
| New UI feature | One folder under `frontend/src/features/{name}/` |
| Bug fix | Smallest module that owns the bug |
| Shared component | `frontend/src/shared/` or `frontend/src/components/` — needs extra review |
| AI provider | `frontend/src/services/ai/` only |
| IPC / main process | `application/`, `auth/`, or relevant root module |
| OS hooks | `interface-window/` |

**Avoid:** One PR touching `features/chat/` and `features/settings/` unless it's a coordinated refactor approved by the team.

## Module Conventions

### Barrel exports

Every module exposes a public API via `index.ts`:

```typescript
// frontend/src/features/my-feature/index.ts
export { MyComponent } from './components/MyComponent'
export { useMyHook } from './hooks/useMyHook'
export type { MyType } from './types'
```

When adding exports, **append** to `index.ts` — do not re-sort existing lines (reduces merge conflicts).

### Imports

```typescript
// ✅ Good
import { useChat } from '@/features/chat'
import { Button } from '@/components/ui/button'

// ❌ Bad
import { useChat } from '@/features/chat/hooks/useChat'
import { Foo } from '../../../features/chat/utils/foo'
```

### Feature isolation

Features must not import from other features. Communicate via:
- `shared/providers/` (shared context)
- `services/` (business logic)
- Feature flags (`features/feature-flags/`)

## Adding a New Feature

1. Create `frontend/src/features/{name}/` with `components/`, `hooks/`, `types/`, `index.ts`
2. Add namespace export to `frontend/src/features/index.ts` (append at end)
3. Wire into `frontend/src/app/` (overlay or provider)
4. Optional: add `.feature.ts` in `features/feature-flags/definitions/`
5. Optional: add `README.md` in the feature folder documenting public API

## Code Review Checklist

**Authors:**
- [ ] Only one feature module changed (or shared change is justified)
- [ ] Barrel `index.ts` updated
- [ ] No deep relative imports (`../../`)
- [ ] No cross-feature imports
- [ ] Feature flag used if work is incomplete

**Reviewers:**
- [ ] Imports use `@/` aliases from barrel exports
- [ ] No new global `document`/`window` listeners without cleanup
- [ ] Overlay/event components have scoped handlers

## Ownership

See `.github/CODEOWNERS` for path-based ownership. Update team handles when adding a new feature folder.

## Testing

```bash
cd frontend && npm test        # Vitest
cd frontend && npm run lint    # ESLint
npm run build:all              # Full build before release PRs
```

## Cursor / AI Assistants

Project rules live in `.cursor/rules/`. Agents should read `AGENTS.md` first, then the relevant feature README if one exists.
