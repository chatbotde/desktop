# Architecture

How SonicThinking is actually built. Feature list: [features.md](features.md). Run it: [getting-started.md](getting-started.md).

There are **two codebases**:

| Repo | Runtime | Role |
|------|---------|------|
| **Buddy** (this repo) | Electron + React | Desktop overlay, AI, OS hooks, Remote Pad **server** |
| **[remote-desktop](https://github.com/sonicthinking/remote-desktop)** | Android / Compose | Phone client |

They share one wire contract (`remote-pad/protocol.js` ↔ `RemotePadProtocol.kt`). They do not share a database.

---

## 1. Desktop process model

```
┌─────────────────────────────────────────────────────────────────┐
│  OS                                                             │
│  shortcuts, selection-hook, TSF/IME, robotjs / Cua, firewall    │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│  MAIN PROCESS  (Node, no DOM)                                   │
│  main.js → Application                                          │
│  windows, IPC, Remote Pad WS, MCP, auth, updater                │
└──────────────────────────────┬──────────────────────────────────┘
                               │ contextBridge (preload)
                               │ ipcRenderer.invoke / send
┌──────────────────────────────▼──────────────────────────────────┐
│  RENDERER  (Chromium)                                           │
│  Vite @ :5173 in dev · buddy-app:// in packaged builds          │
│  React overlay UI — click-through transparent window            │
└─────────────────────────────────────────────────────────────────┘
```

**Dev:** `npm run dev` starts Vite, then Electron loads `http://localhost:5173`.  
**Prod:** `ProtocolHandler` serves the built UI over `buddy-app://app/index.html`.  
**Media:** Manim output streams on `sonic-media://` (registered in `main.js` before `app.ready`).

There is one primary `BrowserWindow` (`InterfaceWindow`): fullscreen overlay, always-on-top, click-through when idle. Auth may open a separate window. Hidden windows exist for LAN screen capture (Remote Pad).

---

## 2. Boot sequence (main)

```
main.js
  registerSchemesAsPrivileged (buddy-app, sonic-media)
  new Application().initialize()
       │
       ├─ authHandler.initialize()     # buddy:// deep links
       └─ app.whenReady → onAppReady()
            ├─ ProtocolHandler.setup()
            ├─ AutoStartupManager
            ├─ windowManager.createInterfaceWindow()
            │     preload exposes window.*API
            │     registerElectronApis()  (app:*, clipboard:*, …)
            │     capture / TSF / block-manager / files
            ├─ updater, shortcuts, monitoring
            ├─ ipcHandlers.register()    # IpcHandlerRegistry
            ├─ composio, mcp, remotePad, agentSessions
            ├─ manim, video-gif, skills
            └─ youtube-transcript (+ optional sibling pocket-tts)
```

Source of truth: `application/application.js` (`initialize` / `onAppReady`).

---

## 3. Renderer tree

```
main.tsx
  AppProviders          theme, feature flags, auth, animations, voice
    App.tsx
      ClickThrough      mouse ignore except over UI
      OverlayRegistry   HashRouter → #/o/{panels}
      FileTransferBanner / PhoneShareInbox
```

`AppStateProvider` (`app/context/AppContext.tsx`) is the **session hub** for chat: UI state, `useMessageManager`, history, send, fact-check, Manim detection.

Overlays: [overlays.md](overlays.md). Settings pages: [settings.md](settings.md).

### Frontend layers (where code goes)

```
frontend/src/
  app/           shell, overlays, AppContext          ← wire features here
  features/      one folder = one product area        ← new UI work
  components/    prompt-input, shadcn, remote-pad UI  ← shared widgets
  shared/        providers, primitives, theme
  services/      prompts, AssemblyAI                  ← no React
  lib/           AI SDK wrappers, model-config        ← no React
  hooks/         some global hooks (legacy overlap)
  contexts/      FeatureContext, AuthContext
  types/         electron.d.ts (window.*API)
```

**Rules**

1. Features import other features only through `@/features/{name}` barrels — never deep paths.
2. Features must not import sibling features. Use `shared/`, `services/`, or AppContext.
3. Native power goes through preload APIs, not `require('electron')` in React.

Known split (do not “fix” in a drive-by PR): `features/prompt/` is the facade; much of the composer lives in `components/prompt-input/`.

More: [frontend/ARCHITECTURE.md](../frontend/ARCHITECTURE.md), [frontend/src/features/README.md](../frontend/src/features/README.md).

---

## 4. IPC (two systems)

Full channel notes: [ipc.md](ipc.md).

| System | Registration | Renderer |
|--------|----------------|----------|
| **Named APIs** | `interface-window/preload/` → `contextBridge.exposeInMainWorld` | `window.electronAPI`, `CaptureAPI`, `tsfAPI`, `remotePadAPI`, … |
| **IpcHandlerRegistry** | `ipc-handler-registry.js` (`handle` / `on`) | Same preload wrappers calling `ipcRenderer.invoke('channel')` |
| **Generic Electron** | `register-apis.ts` — `ipcMain.handle('clipboard:readText', …)` | `window.electronAPI` style `name:method` |

When the app is **locked** (block manager), `register-apis.ts` can reject channels. Do not add a third registration style.

Types: `frontend/src/types/electron.d.ts`. After preload changes: `npm run build:interface`.

---

## 5. Cross-cutting data flows

Diagrams: [data-flows.md](data-flows.md).

| Flow | Path |
|------|------|
| **Chat** | Prompt overlay → `AppContext.handleSendMessage` → `lib/ai` (Vercel AI SDK / local LLM) → `features/chat` store → output window |
| **Screenshot** | Flag / shortcut → overlay → `CaptureAPI` → desktopCapturer / region UI → attachment on next send |
| **Text selection** | `selection-hook` in main → `text-selection-changed` → `TextSelectionOverlay` → prompt actions in `services/prompts` |
| **Agent pill** | `PointerInputOverlay` → `agent-engine.ts` → Cua MCP (`mcp/cua-driver.js`) or robotjs |
| **Remote Pad** | Phone WS `:8765` → `input-handler.js` / agent-sessions; video via WebRTC, LiveKit, or MJPEG |
| **Insert pins** | Ctrl+Shift+P overlay → TSF APIs (`interface-window` / `os-system`) → number keys insert into that HWND |

---

## 6. Main-process modules

Coordinator only in `application/`. Each domain owns its IPC and README:

| Module | Owns |
|--------|------|
| `application/` | Lifecycle, window manager, shortcuts, updater |
| `interface-window/` | Overlay window, preload, capture, TSF, click-through, block |
| `auth/` | Optional web login, keytar, `buddy://` |
| `remote-pad/` | Phone server |
| `mcp/` + `features/cua/` | Tools + computer-use |
| `agent-sessions/` | External CLIs for the phone Agents tab |
| `composio/`, `skills/`, `youtube-transcript/`, `startup/`, `manim-video/`, `media/` | As named |

Catalog: [main-process.md](main-process.md).

`application.js` may try `../../pocket-tts` (sibling folder). That is **optional** and not part of this repo. Failures are logged; the app continues.

---

## 7. Android companion

```
BuddyRemoteApplication
  owns RemotePadViewModel (process-scoped)
MainActivity
  Compose tabs → feature screens
RemotePadClient
  WebSocket control plane
Video: LanWebRtcClient | LiveKitSession | LanMjpegClient
```

Details: companion [architecture](https://github.com/sonicthinking/remote-desktop/blob/main/docs/architecture.md) (local copy: `../remote-desktop/docs/architecture.md` if both trees sit side by side).

---

## 8. Decision guide

| I want to… | Put it in… |
|------------|------------|
| New overlay panel | `app/overlays/` + route id/map + [overlays.md](overlays.md) |
| New toggleable capability | `feature-flags/definitions/*.feature.ts` |
| New chat/capture/settings UI | `frontend/src/features/{name}/` |
| New AI provider | `frontend/src/lib/ai/` + Settings custom models |
| New prompt button | `components/prompt-input/actions/` registry |
| New OS / capture IPC | `interface-window/` + preload API + `electron.d.ts` |
| New phone message type | `protocol.js` **and** `RemotePadProtocol.kt` |
| New coding CLI for Agents | `agent-sessions/adapters/` |

Always add a row to [features.md](features.md) and a short README next to the code.

---

## 9. What this architecture is not

- Not a classic multi-window Electron app (one overlay is the product).
- Not a Next.js monorepo. A private web app may exist for auth/payments; Buddy runs without it.
- Not a single “src/main + src/renderer” tree. Ignore any old docs that show that layout.
