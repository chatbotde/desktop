# Data flows

Runtime paths for the main product loops. Folder map: [architecture.md](architecture.md).

## Chat (send → stream → window)

```mermaid
sequenceDiagram
  participant User
  participant Prompt as Prompt overlay
  participant Ctx as AppContext
  participant AI as lib/ai
  participant Chat as features/chat
  participant Out as Output window

  User->>Prompt: Enter / attachments
  Prompt->>Ctx: handleSendMessage
  Ctx->>Chat: append user message
  alt Manim-style prompt
    Ctx->>Prompt: open #/o/manim
  else Image/video gen flags
    Ctx->>Prompt: open image/video overlay
  else Normal chat
    Ctx->>AI: stream (cloud or Ollama)
    AI-->>Chat: tokens
    Chat-->>Out: render SmartMessage
  end
```

Change streaming: `hooks/useMessageManager` (also used from AppContext) and `frontend/src/lib/ai`.  
Change bubbles: `features/chat` and `features/output-window`.

## Text selection (OS → popup → AI)

```mermaid
sequenceDiagram
  participant OS
  participant Hook as selection-hook (main)
  participant App as Application.monitoring
  participant Win as InterfaceWindow
  participant UI as TextSelectionOverlay

  OS->>Hook: selection changed
  Hook->>App: selection payload
  App->>App: normalize coords (HiDPI)
  App->>Win: webContents.send text-selection-changed
  Win->>UI: popup Ask/Explain/Change/Add
  UI->>UI: services/prompts action builders
```

Native rebuild: `npm run build:interface`. Flag: `text-selection`.

## Agent pill (computer use)

```mermaid
flowchart TD
  A[PointerInputOverlay] --> B[agent-engine.ts]
  B --> C{Cua Driver MCP ready?}
  C -->|yes| D[mcp/cua-driver.js]
  D --> E[Background clicks/type]
  C -->|no| F[robotjs / visible pointer]
  B --> G[Screenshot vision loop if needed]
```

Deep dive: [cua-architecture.md](cua-architecture.md).

## Remote Pad (phone → PC)

```mermaid
flowchart LR
  subgraph phone [Android]
    VM[RemotePadViewModel]
    WS[RemotePadClient]
    V[WebRTC / LiveKit / MJPEG]
  end
  subgraph pc [Buddy main]
    S[remote-pad-server.js :8765]
    I[input-handler]
    A[agent-sessions]
    Cap[lan-p2p / LiveKit / MJPEG]
  end
  VM --> WS
  WS -->|auth, move, type, agent*| S
  S --> I
  S --> A
  V --- Cap
```

Input always uses the WebSocket. Video is optional and can fail over.  
[remote-pad.md](remote-pad.md).

## Capture

```mermaid
flowchart LR
  Flag[Feature flag / shortcut] --> Ov[Capture overlay]
  Ov --> API[window.CaptureAPI]
  API --> Main[interface-window/capture]
  Main --> Att[MediaAttachment on next send]
```

Flags: `quick-screenshot`, `area-screenshot`, `video-recording`, `auto-screenshot`.

## Auth (optional)

```mermaid
sequenceDiagram
  participant Desk as Buddy
  participant Browser
  participant Web as Auth server optional

  Desk->>Browser: open AUTH_SERVER_URL
  Browser->>Web: login
  Web->>Desk: buddy:// callback
  Desk->>Desk: keytar token store
```

Local keys in Settings work with **no** auth server. [auth/README.md](../auth/README.md).
