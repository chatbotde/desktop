# Feature catalog

This is the map of **everything Buddy does**. Use it to find the code, the toggle, and the detailed README.

**New to the repo?** Read [getting-started.md](getting-started.md), then pick a row below.

**How features are turned on:** many capabilities are flags in `frontend/src/features/feature-flags/definitions/*.feature.ts`. Users toggle them in **Settings → Features**. Adding a `.feature.ts` file auto-registers the toggle. Details: [feature-flags README](../frontend/src/features/feature-flags/README.md).

---

## Overlay shell (always on)

The desktop UI is an always-on overlay, not a normal window. Hash routes `#/o/{panel}+{panel}` open heavy panels. See [overlays.md](overlays.md).

| What users see | Code | Notes |
|----------------|------|--------|
| Prompt / chat input | `frontend/src/features/prompt/` + `components/prompt-input/` | [prompt README](../frontend/src/features/prompt/README.md) |
| Chat messages / streaming | `frontend/src/features/chat/` | [chat README](../frontend/src/features/chat/README.md) |
| Floating chat window | `frontend/src/features/output-window/` | Flag `output-window` |
| Agent pill (computer use) | `frontend/src/app/overlays/PointerInputOverlay.tsx`, `agent-engine.ts` | [cua README](../frontend/src/features/cua/README.md) |
| Global assistant animation | `frontend/src/app/overlays/GlobalAssistantOverlay.tsx` | Settings → Animations |

---

## Chat & AI

| Feature | Flag / setting | Where to change it |
|---------|----------------|--------------------|
| Multi-provider chat (OpenAI, Anthropic, Gemini, Groq, …) | Settings → Custom Models / Model Profiles | `frontend/src/lib/ai/`, `frontend/src/services/ai/` |
| Local models (Ollama) | Settings → Local AI | `frontend/src/features/settings/sections/LocalLLMSection.tsx` |
| Streaming replies | — | `frontend/src/features/chat/hooks/useMessageManager.ts` |
| Prompt library (Ask / Explain / Change / Add) | — | `frontend/src/services/prompts/` |
| Google Search grounding toggle | prompt action | `features/prompt/components/GroundingToggleButton.tsx` |
| Manim / math video from chat | overlay `manim` | `features/chat/lib/manim-video-request.ts`, `manim-video/` |
| Image generation window | `image-generation-window` | `app/overlays/ImageGenerationOverlay.tsx` |
| Video generation window | `video-generation-window` | `app/overlays/VideoGenerationOverlay.tsx` |
| Fact-check overlay | overlay `fact-check` | `app/overlays/FactCheckOverlay.tsx` |
| Explanation overlay | overlay `explanation` | `app/overlays/ExplanationOverlay.tsx` |
| 3D avatar overlay | `three-scene-overlay` | `app/overlays/ThreeSceneOverlay.tsx` |

---

## Capture & media

| Feature | Flag | Code |
|---------|------|------|
| Quick screenshot | `quick-screenshot` | `features/capture/` |
| Circle / area capture (“circle to ask”) | `area-screenshot` | `AreaScreenshotOverlay` |
| Rectangle screenshot | — | overlay `rectangle-screenshot` |
| Set capture area (reuse region) | `set-capture-area` | `features/capture/capture-area-store.ts` |
| Auto-screenshot on send | `auto-screenshot` | `hooks/useAutoScreenshot` (exported from capture) |
| Hide Buddy from captures | `exclude-from-screenshot` | `feature-flags/effects/` |
| Video recording | `video-recording` | `VideoRecorderPill`, `useVideoRecording` |
| Upload image / video / audio / document | `upload-*` | prompt-input actions |
| Clipboard monitor | `clipboard` | feature flag + clipboard services |
| Recorded video / image players | overlays `recorded-video`, `recorded-image` | matching overlay files |
| YouTube player | `youtube-player` | `YoutubePlayerOverlay.tsx` |
| Standalone video player | `standalone-youtube-player` | related player UI |
| YouTube transcripts | — | `youtube-transcript/` ([README](../youtube-transcript/README.md)) |

---

## Voice & audio

| Feature | Flag | Code |
|---------|------|------|
| Voice to prompt | `voice-to-prompt` | `features/audio/components/VoiceToPrompt.tsx` |
| Audio recording pill | `audio-pill` | `features/audio/` |
| Live / auto transcription | `transcription` | `services/audio/` (AssemblyAI) |
| Voice insert (type into other apps) | `voice-insert` | `feature-flags/effects/voice-insert.effect.tsx` |
| Voice cloning / TTS voices | `voice-cloning` | `features/voice/` |
| Voice settings | Settings → (voice section) | `settings/sections/VoiceSection.tsx` |

---

## Text, insert, OS hooks

| Feature | Flag | Code |
|---------|------|------|
| System-wide text selection popup | `text-selection` | `features/text-selection/`, `interface-window/` |
| Auto-insert AI output | `auto-insert` | feature flag |
| Prompt references (“add in reference”) | `prompt-references` | feature flag |
| Insert pins (Ctrl+Shift+P → number keys) | Settings → Insert pins | `InsertPinOverlay.tsx`, `interface-window/` TSF APIs |
| Global shortcuts | Settings → General | `application/application-shortcut-manager.js` |
| Click-through overlay | window manager | `application/application-window-manager.js` |

---

## Agent / computer use

| Feature | Flag | Code |
|---------|------|------|
| Agent pill (natural-language OS tasks) | `pointer-click`, `pointer-always-visible` | `app/overlays/agent-engine.ts` |
| Cua Driver (background MCP automation) | — | `features/cua/`, `mcp/cua-driver.js`, [docs/cua-architecture.md](cua-architecture.md) |
| robotjs fallback | when Cua missing | `mcp/`, main process |
| CLI agent sessions (Claude Code, Gemini, Codex, Aider, OpenCode) | phone Agents tab | `agent-sessions/` |
| MCP servers (user-configured) | Settings → MCP Servers | `mcp/` |
| Skills (`skill.md` workflows) | Settings → Skills | `skills/` |

---

## Remote Pad (phone)

Desktop server: [remote-pad.md](remote-pad.md) · Android app: [remote-desktop](https://github.com/sonicthinking/remote-desktop)

| Feature | Code |
|---------|------|
| QR + PIN pairing, LAN WebSocket `:8765` | `remote-pad/` |
| LAN WebRTC screen share | `remote-pad/lan-p2p/` |
| LiveKit WAN share | `remote-pad/livekit-stream.js` |
| MJPEG fallback | `remote-pad/lan-http-server.js` |
| Settings UI | `settings/sections/RemotePadSection.tsx` |

---

## Account, integrations, system

| Feature | Settings section | Code |
|---------|------------------|------|
| Sign-in (optional web auth) | Account | `auth/` ([README](../auth/README.md)) |
| Composio connected apps | Integrations | `composio/` |
| App / site blocking | App Blocking | `settings/sections/BlockingSection.tsx` |
| Appearance / theme | Appearance | `AppearanceSection.tsx` |
| Animations / Lottie assistants | Animations | `AnimationsSection.tsx`, `shared/registry/animationRegistry` |
| Language, history, chrome | General | `GeneralSection.tsx` |
| Personalization / system prompt | Personalization | `PersonalizationSection.tsx` |
| Launch at login | General | `startup/` ([README](../startup/README.md)) |
| Auto-update | — | `application/application-updater.js` |

---

## Feature flag index (all IDs)

These files live in `frontend/src/features/feature-flags/definitions/`. Default on/off is in each file (`defaultEnabled`).

| ID | UI label | Default |
|----|----------|---------|
| `text-selection` | Text Selection | on |
| `clipboard` | Clipboard | on |
| `quick-screenshot` | screenshot | on |
| `area-screenshot` | circle to ask | on |
| `set-capture-area` | Set Capture Area | off |
| `auto-screenshot` | Auto Screen | off |
| `exclude-from-screenshot` | exclude from screen capture | off |
| `video-recording` | Video Recording | on |
| `output-window` | chat window | on |
| `auto-insert` | Auto Insert | on |
| `voice-to-prompt` | voice to prompt | on |
| `audio-pill` | Audio recording | off |
| `transcription` | Auto Transcription | off |
| `voice-insert` | Voice insert | off |
| `voice-cloning` | Voice Cloning | on |
| `upload-image` | Upload Image | on |
| `upload-video` | Upload Video | on |
| `upload-audio` | Upload Audio | on |
| `upload-document` | Upload Document | on |
| `prompt-references` | Add in reference | off |
| `youtube-player` | YouTube Video Player | on |
| `standalone-youtube-player` | Standalone Video Player | on |
| `image-generation-window` | Image Window | on |
| `video-generation-window` | Video Window | on |
| `three-scene-overlay` | 3D Avatar Overlay | on |
| `pointer-click` | Auto-Click After Point | off |
| `pointer-always-visible` | Always Show Pointer | off |

---

## Adding a feature (checklist)

1. Prefer a new folder under `frontend/src/features/{name}/` with `index.ts`.
2. Add a flag in `feature-flags/definitions/{id}.feature.ts` if it should be togglable.
3. Wire UI in `frontend/src/app/` (overlay or prompt action). For a heavy panel, add an ID in `overlayRouteIds.ts` and a loader in `overlayRouteMap.ts`.
4. Main-process / IPC: `application/` or the owning module; types in `frontend/src/types/electron.d.ts`.
5. Document it: a short `README.md` in the feature folder **and** a row in this catalog.
6. One feature per PR — see [CONTRIBUTING.md](../CONTRIBUTING.md).
