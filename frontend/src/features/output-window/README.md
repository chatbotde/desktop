# Output window

Draggable / resizable floating chat surface (the “chat window” pill).

## Flag

`output-window` (default **on**). Overlay: `OutputMessagesOverlay.tsx`.

## Public API

```ts
import { WindowControls, useDraggable, useResizable } from '@/features/output-window'
```

| File | Role |
|------|------|
| `components/WindowControls.tsx` | Chrome |
| `components/*MessageBubble.tsx` | User / assistant bubbles |
| `components/TextSelectionActions.tsx` | Actions on output text |
| `hooks/useDraggable.ts` / `useResizable.ts` / `useAutoScroll.ts` | Window behavior |
| `theme.ts` | Colors for this window |

Message **state** still comes from `features/chat` (store / manager). This module is presentation + window chrome only.
