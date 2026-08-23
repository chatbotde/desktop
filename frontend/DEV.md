# Frontend-only development

You can iterate on the React UI without launching Electron.

```bash
cd frontend
npm install
npm run dev
```

Vite serves the overlay at `http://localhost:5173`. Browser mocks cover many Electron APIs; native capture, global shortcuts, and OS text-selection will not work here.

Architecture: [docs/frontend-architecture.md](../docs/frontend-architecture.md).

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite with HMR |
| `npm run build` | Production bundle (`tsc -b` + Vite) |
| `npm test` | Vitest once |
| `npm run lint` | ESLint |

## Where to edit

| Task | Folder |
|------|--------|
| Chat / streaming | `src/features/chat/`, `src/services/ai/` |
| Prompt box | `src/features/prompt/`, `src/components/prompt-input/` |
| Settings | `src/features/settings/` |
| Capture UI | `src/features/capture/` |
| Feature toggles | `src/features/feature-flags/` |
| Shared UI | `src/components/ui/` (shadcn) |

Import from feature barrels (`@/features/chat`), not deep relative paths. See [ARCHITECTURE.md](ARCHITECTURE.md).
