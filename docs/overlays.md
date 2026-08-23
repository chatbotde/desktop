# Overlays

Buddy’s UI is a stack of Electron overlays. Most of the “app” is not a single page.

## Two kinds

**Shell (always mounted)** — needed for click-through, prompt, and selection. Listed in `OverlayShell.tsx` as `CORE_OVERLAYS` / `SHELL_AMBIENT`.

| Overlay | File | Role |
|---------|------|------|
| Prompt input | `PromptInputOverlay.tsx` | Main composer |
| Output messages | `OutputMessagesOverlay.tsx` | Floating chat (`output-window` flag) |
| Text selection | `TextSelectionOverlay.tsx` | Popup on OS selection |
| Pointer / agent | `PointerInputOverlay.tsx` | Agent pill |
| Insert pins | `InsertPinOverlay.tsx` | Ctrl+Shift+P pin assignment |
| Global assistant | `GlobalAssistantOverlay.tsx` | Live assistant visuals |
| Screenshot selection | `ScreenshotSelectionOverlay.tsx` | After-capture actions |
| Pointer visual | `PointerOverlay.tsx` | Cursor follower (`pointer-*` flags) |

**Routed (lazy)** — opened via hash `#/o/{id}` or `#/o/{id}+{id}`. IDs: `overlayRouteIds.ts`. Loaders: `overlayRouteMap.ts`.

| Route ID | Overlay | Typical trigger |
|----------|---------|-----------------|
| `settings` | Settings | Gear / shortcut |
| `image` | Image generation | Flag + user action |
| `video` | Video generation | Flag + user action |
| `fact-check` | Fact check | Chat / tool |
| `audio` | Audio recording | `audio-pill` |
| `video-scroll` | Video scroll | Media UI |
| `area-screenshot` | Circle capture | `area-screenshot` |
| `rectangle-screenshot` | Rectangle capture | Capture flow |
| `explanation` | Explain panel | Text-selection Explain |
| `manim` | Manim script | Chat video request |
| `youtube` | YouTube player | `youtube-player` |
| `recorded-video` | Playback | After recording |
| `recorded-image` | Image playback | After capture |
| `three-scene` | 3D avatar | `three-scene-overlay` |

Bridges sync flags / UI state / events into the URL: `routes/bridges/`.

## Adding a routed overlay

1. Create `frontend/src/app/overlays/MyOverlay.tsx`.
2. Add the id to `OVERLAY_ROUTE_IDS`.
3. Add a `lazyOverlay(...)` entry in `OVERLAY_ROUTE_LOADERS`.
4. Open it through the overlay navigation helpers (see `overlayPath()`).
5. Document the row in [features.md](features.md).

Decorative Lottie overlays (planes, cat, skateboard, …) are registered in `shared/registry/animationRegistry` and Settings → Animations — they are not product features unless you are changing motion.
