# AGENTS.md

Guidance for AI agents and developers working in the **Buddy** (SonicThinking) codebase.

## Project Overview

Buddy is an Electron desktop productivity assistant. It combines a React/Vite renderer, native OS integrations, and AI services.

| Package | Path | Role |
|---------|------|------|
| Electron shell | `/` (`main.js`, `application/`) | App bootstrap, IPC, lifecycle, shortcuts |
| Frontend (renderer) | `frontend/` | React UI, features, overlays, AI client |
| Auth | `auth/` | Desktop ↔ web OAuth, tokens, deep links |
| OS integration | `interface-window/` | Windows/macOS hooks, text selection, protocols |
| Shared utils | `utils/` | TypeScript utilities compiled for main process |
| Composio | `composio/` | Third-party tool integrations |
| YouTube transcript | `youtube-transcript/` | Transcript fetching helper |

**Start here:** `docs/architecture.md`, then `docs/features.md`. Frontend structure: `docs/frontend-architecture.md`. Cursor rules: `.cursor/rules/*.mdc`.

---

## Common Commands

```bash
# Full dev (Vite + Electron hot reload)
npm run dev

# Frontend only (browser mocks; no native capture)
cd frontend && npm run dev

# Build frontend
npm run build

# Build everything (utils + interface-window + frontend)
npm run build:all

# Package for current platform
npm run dist

# Frontend tests
cd frontend && npm test

# Frontend lint
cd frontend && npm run lint
```

**Browser / UI-only guide:** `frontend/DEV.md`

---

## Where to Change What

### Adding a UI feature (chat, capture, settings, etc.)

1. Create or extend a module under `frontend/src/features/{name}/`
2. Follow the barrel export pattern — public API only via `index.ts`
3. Wire into app via `frontend/src/app/` (overlays, providers, or `App.tsx`)
4. Register feature flags in `frontend/src/features/feature-flags/definitions/` if toggleable
5. See `frontend/src/features/feature-flags/README.md`

**Import rule:** Always `@/features/{name}`, never deep paths into another feature.

### Adding an overlay

- Register in `frontend/src/app/overlays/OverlayRegistry.tsx`
- Overlay components live in `frontend/src/app/overlays/`
- Feature-specific UI stays in `frontend/src/features/{name}/`

### Adding an AI provider or prompt

- Providers: `frontend/src/services/ai/` and `frontend/src/lib/ai/`
- Prompt templates: `frontend/src/services/prompts/`
- See `frontend/src/services/prompts/README.md`

### Adding Electron IPC (main ↔ renderer)

- Main process handlers: `application/application-ipc-handlers.js` and module-specific handlers (e.g. `auth/ipc-handlers.js`)
- Registry: `ipc-handler-registry.js`
- Renderer types: `frontend/src/types/electron.d.ts`

### Adding auth flows

- Read `auth/README.md` first
- Deep links via `interface-window/` protocol handler

### Native OS behavior (text selection, input hooks)

- `interface-window/` — compiled separately (`npm run build:interface`)

### Cua Driver & Agent OS automation

- **Architecture & file map:** `docs/cua-architecture.md`
- Cua feature module: `frontend/src/features/cua/`
- Agent loop: `frontend/src/app/overlays/agent-engine.ts`
- Main process: `mcp/cua-driver.js`, `mcp/mcp-client.js`
- Smoke test: `npm run test-cua-driver`

---

## Frontend Module Map

```
frontend/src/
├── app/              # Shell: App.tsx, providers, overlay registry
├── features/         # Business features (one folder = one team boundary)
│   ├── audio/        # Voice recording, transcription UI
│   ├── capture/      # Screenshots, screen capture
│   ├── chat/         # Messages, streaming responses
│   ├── feature-flags/# Toggle system (auto-discovery)
│   ├── output-window/# Floating output panel
│   ├── prompt/       # Prompt input (legacy; also components/prompt-input/)
│   ├── settings/     # Settings modal & sections
│   ├── text-selection/ # Text selection popup/actions
│   └── voice/        # Voice I/O
├── components/       # Shared UI (prompt-input, settings, ui/)
├── services/         # Pure logic: ai/, audio/, prompts/
├── lib/              # Config, AI SDK wrappers, utilities
├── shared/           # Cross-feature providers, hooks, common UI
└── hooks/            # Global hooks
```

**Features must not import from other features.** Use `shared/`, `services/`, or event/context patterns.

---

## Main Process Map

```
buddy/
├── main.js                    # Entry — delegates to Application
├── application/               # Application coordinator (SOLID modules)
│   ├── application.js
│   ├── application-ipc-handlers.js
│   ├── application-window-manager.js
│   └── ...
├── auth/                      # Auth module (see auth/README.md)
├── ipc-handler-registry.js    # Central IPC registration
├── global-shortcut-registry.js
├── app-lifecycle-manager.js
└── interface-window/          # OS-level integrations
```

---

## Multi-Developer Rules

1. **One feature per PR** — avoid touching multiple `frontend/src/features/*` folders
2. **Shared changes need review** — `shared/`, `components/ui/`, `services/ai/`
3. **Append barrel exports** — add new lines at end of `index.ts`, don't re-sort
4. **Branch naming:** `feature/chat-xxx`, `bugfix/capture-xxx`, `refactor/settings-xxx`
5. **Feature flags for WIP** — merge incomplete work behind flags

Full workflow: `CONTRIBUTING.md`

---

## Path Aliases (frontend)

```typescript
import { X } from '@/features/chat'      // ✅ feature public API
import { Button } from '@/components/ui' // ✅ shared UI
import { cn } from '@/lib/utils'         // ✅ utilities

import { Foo } from '@/features/chat/hooks/useFoo' // ❌ deep import
import { Bar } from '../../../features/chat'       // ❌ relative cross-module
```

---

## Key Docs Index

| Topic | File |
|-------|------|
| New contributor setup | `docs/getting-started.md` |
| **System architecture** | `docs/architecture.md` |
| Renderer architecture | `docs/frontend-architecture.md` |
| Data flows (mermaid) | `docs/data-flows.md` |
| IPC / preload | `docs/ipc.md` |
| **Every feature** | `docs/features.md` |
| Overlay routes | `docs/overlays.md` |
| Settings pages | `docs/settings.md` |
| Main-process modules | `docs/main-process.md` |
| Remote Pad + Android | `docs/remote-pad.md` |
| UI feature READMEs | `frontend/src/features/README.md` |
| Import-rules guide | `frontend/ARCHITECTURE.md` |
| Folder encyclopedia | `frontend/src/ARCHITECTURE.md` |
| Feature flags | `frontend/src/features/feature-flags/README.md` |
| Auth system | `auth/README.md` |
| Frontend-only / browser mode | `frontend/DEV.md` |
| Build & dist | `BUILD.md` |
| Payments/subscription | `frontend/src/lib/subscription.ts`, `subscription-config` |
| React perf (agents) | `frontend/.skills/react-best-practices/AGENTS.md` |
| Team workflow | `CONTRIBUTING.md` |

---

## Common Gotchas

1. **Two prompt locations:** `features/prompt/` and `components/prompt-input/` — check both; prefer consolidating into features over time
2. **Legacy re-exports:** `lib/ai/`, `lib/audio/`, `components/messages/` may re-export from new locations — follow `@deprecated` comments
3. **interface-window must be built** before full Electron run if OS hooks changed
4. **Electron is not thread-safe** — IPC handlers should not assume concurrent calls
5. **Global event listeners** — see `.cursor/rules/component-interaction.mdc`; scope to component boundaries

---

## Agent Search Tips

| Task | Search in |
|------|-----------|
| Overlay behavior | `frontend/src/app/overlays/` |
| Feature UI/logic | `frontend/src/features/{name}/` |
| AI streaming | `frontend/src/services/ai/`, `frontend/src/lib/ai/` |
| Settings section | `frontend/src/features/settings/sections/` |
| IPC channel | `application/`, `auth/`, grep `ipcMain` |
| Feature toggle | `frontend/src/features/feature-flags/definitions/` |
| shadcn components | `frontend/src/components/ui/` |
