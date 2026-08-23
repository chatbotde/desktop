# Manim video

Renders explainer / math videos from generated Manim scripts (chat overlay `manim`).

| File | Role |
|------|------|
| `manim-video-service.js` | Spawn Manim, `sonic-media://` protocol for playback, optional local TTS (`http://127.0.0.1:8000/tts`) |

Frontend: `frontend/src/features/chat/lib/manim-video-request.ts` and `app/overlays/ManimScriptOverlay.tsx`.

Needs a working Manim install on the machine to actually render. UI can still plan chapters without it.
