# Interface window (OS integration)

The overlay `BrowserWindow`, preload bridge, capture, TSF, and click-through. This is the native edge of the renderer.

System context: [docs/architecture.md](../docs/architecture.md). IPC: [docs/ipc.md](../docs/ipc.md).

```bash
npm run build:interface
```

Dev loads `http://localhost:5173`. Packaged loads `buddy-app://app/index.html`.

| File / folder | Role |
|---------------|------|
| `interface-window.ts` | Creates the fullscreen overlay, preload path, `loadURL` |
| `preload/` | `contextBridge` — `window.electronAPI`, `CaptureAPI`, `tsfAPI`, … |
| `register-apis.ts` | Generic `clipboard:readText`-style IPC + lock blocking |
| `protocol-handler.ts` | Serves UI over `buddy-app://` |
| `click-through.ts` | Ignore mouse when the overlay is idle |
| `mouse-service.ts` | Pointer helpers |
| `capture/` | Screenshot / recording IPC |
| `block-manager/` | App lock |
| `os-system/` | Windows TSF, macOS IME, insert pins |
| `file-system/` | File IPC |

Renderer types: `frontend/src/types/electron.d.ts`.

Text-selection UI: `frontend/src/features/text-selection/`. Insert pins: Settings + `InsertPinOverlay`.

After TypeScript changes here, rebuild or OS/preload APIs stay stale.
