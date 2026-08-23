# Chat

Streaming conversation UI: user/assistant messages, attachments, stop, Manim video helpers.

## Public API

```ts
import { useMessageManager, useChatStore, SmartMessage } from '@/features/chat'
```

| File | Role |
|------|------|
| `hooks/useMessageManager.ts` | Send, stream, stop, attachments |
| `store.ts` | Chat Zustand (or equivalent) store |
| `components/` | `SmartMessage`, typing indicator, media, stop button |
| `lib/manim-video-request.ts` | Detect Manim prompts, chapter plans, duration |
| `types.ts` | `ChatMessage`, `MediaAttachment` |

## How to change it

- **New message UI:** `components/` — export from the feature `index.ts`.
- **Provider / model:** not here — `frontend/src/lib/ai/` and Settings → Custom Models.
- **System / action prompts:** `frontend/src/services/prompts/`.
- **Manim overlay:** `app/overlays/ManimScriptOverlay.tsx` + main `manim-video/`.

Do not import this feature from another feature folder; go through `@/features/chat`.
