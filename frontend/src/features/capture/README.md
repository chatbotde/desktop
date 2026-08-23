# Capture

Screenshots, region capture, and screen video. Overlays live under `app/overlays/`; this folder is the feature UI and helpers.

## Flags

| ID | Default | Behavior |
|----|---------|----------|
| `quick-screenshot` | on | Instant screenshot |
| `area-screenshot` | on | Circle / freeform “circle to ask” |
| `set-capture-area` | off | Reuse a drawn rectangle |
| `auto-screenshot` | off | Capture when sending a prompt |
| `exclude-from-screenshot` | off | Hide Buddy from OS capture |
| `video-recording` | on | Screen recorder pill |

## Public API

```ts
import { ScreenshotButton, VideoRecorderPill, AreaScreenshotOverlay } from '@/features/capture'
```

| File | Role |
|------|------|
| `components/` | Buttons, pills, selection popup, rectangle overlay, previews |
| `capture-area-store.ts` | Persisted capture region |
| `lib/trigger-rectangle-screenshot.ts` | Start rectangle capture |
| `lib/trigger-rectangle-area-recording.ts` | Record a region |

Hooks `useAutoScreenshot` and `useVideoRecording` are re-exported from `@/hooks/...`.

Main process capture helpers live under `interface-window/` and Electron desktopCapturer. After changing native capture, rebuild interface (`npm run build:interface`).
