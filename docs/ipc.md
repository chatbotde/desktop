# IPC

The renderer never imports Electron. It talks to main through **preload** (`interface-window/preload/`).

## Surface on `window`

Created in `preload/index.ts` via `contextBridge.exposeInMainWorld`:

| Global | Typical use |
|--------|-------------|
| `interfaceAPI` | Overlay window, click-through, show/hide |
| `electronAPI` | App, shell, shortcuts, generic helpers |
| `CaptureAPI` | Screenshots, sources, recording |
| `tsfAPI` | Insert pins, IME/TSF |
| `blockAPI` | App lock / site block |
| `authAPI` | Session |
| `fileAPI` | Filesystem helpers |
| `youtubeTranscriptAPI` | Transcripts |
| `composioAPI` / `mcpAPI` / `cuaAPI` | Tools / computer-use |
| `remotePadAPI` | Pairing, PIN, stream |
| `manimVideoAPI` / `mediaAPI` / `skillsAPI` | Media + skills |

TypeScript: `frontend/src/types/electron.d.ts`. If you add a method, update **preload + types + main handler** in one PR.

## How a call travels

```
React  →  window.CaptureAPI.takeScreenshot()
       →  ipcRenderer.invoke('capture:…')
       →  ipcMain.handle in interface-window/capture or IpcHandlerRegistry
       →  result Promise back to React
```

Main → renderer events use `webContents.send(channel, data)` (example: `text-selection-changed`).

## Two registration helpers

**`IpcHandlerRegistry`** (`ipc-handler-registry.js`)

- Used by `application`, `remote-pad`, `mcp`, `skills`, `composio`, `agent-sessions`, …
- `register(channel, handler, 'handle' | 'on')`
- Prevents double-register of the same channel

**`registerElectronApis()`** (`interface-window/register-apis.ts`)

- Reflects methods on Electron wrapper services
- Channels look like `clipboard:readText`, `screen:getPrimaryDisplay`
- Can **block** calls when the lock manager says the app is locked

Do not call `ipcMain.handle` ad hoc in random files if a registry already owns that area.

## Adding a channel

1. Implement the handler in the owning module.
2. Wrap it in `interface-window/preload/apis/` and expose on the right `window.*` object.
3. Add types in `electron.d.ts`.
4. `npm run build:interface`.
5. Note it in the feature README.

Security: no API keys in renderer logs; lock manager must keep working for new `register-apis` channels.
