# Application (Electron main)

Coordinator for the desktop process. `main.js` constructs this and calls `setup()`.

| File | Role |
|------|------|
| `application.js` | Construct services, `setup()`, app ready |
| `application-lifecycle.js` | Quit, activate, second instance |
| `application-window-manager.js` | Overlay windows, always-on-top, click-through |
| `application-ipc-handlers.js` | Generic IPC (config, dialogs, …) |
| `application-shortcut-manager.js` | Global shortcuts |
| `application-auth-handler.js` | Wires `auth/` |
| `application-updater.js` | `electron-updater` |
| `application-monitoring.js` | Diagnostics |
| `whisper-manager.js` | Local / Whisper-related audio helpers |

New app-wide IPC belongs here **or** in the module that owns the feature (`remote-pad`, `mcp`, `auth`). Keep handlers small; do not put React here.

Related: [docs/main-process.md](../docs/main-process.md).
