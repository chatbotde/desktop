# Main process modules

Electron **main** code (Node). How it fits: [architecture.md](architecture.md). Channels: [ipc.md](ipc.md).

| Module | Path | Responsibility | Docs |
|--------|------|----------------|------|
| Entry | `main.js` | Starts `application/` | — |
| Application | `application/` | Lifecycle, windows, IPC, shortcuts, updater, Whisper | [README](../application/README.md) |
| Auth | `auth/` | Optional browser login, `buddy://` callback, keytar | [README](../auth/README.md) |
| OS / TSF | `interface-window/` | Overlay window, preload, capture, TSF, lock | [README](../interface-window/README.md) |
| Remote Pad | `remote-pad/` | Phone WebSocket, video, files | [remote-pad.md](remote-pad.md) |
| MCP | `mcp/` | MCP client, Cua Driver registration | [README](../mcp/README.md) |
| Agent CLIs | `agent-sessions/` | Claude / Gemini / Codex / Aider / OpenCode | [README](../agent-sessions/README.md) |
| Composio | `composio/` | Third-party app tools | [README](../composio/README.md) |
| Skills | `skills/` | User `skill.md` store | [README](../skills/README.md) |
| YouTube | `youtube-transcript/` | Transcript fetch (no Data API) | [README](../youtube-transcript/README.md) |
| Startup | `startup/` | Launch at login | [README](../startup/README.md) |
| Manim | `manim-video/` | Render math/explainer videos | used from chat overlay |
| Utils | `utils/` | Shared TS compiled for main | `npm run build:utils` |

## Adding IPC

1. Register in the owning module (`ipcRegistry.register('channel', handler)`).
2. Expose a safe API in preload if needed (`interface-window` / auth preload).
3. Add TypeScript on `window.electronAPI` (or the specific API) in `electron.d.ts`.
4. Never send secrets to the renderer logs.

Computer-use architecture: [cua-architecture.md](cua-architecture.md).
