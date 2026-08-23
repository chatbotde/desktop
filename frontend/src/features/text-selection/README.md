# Text selection

System-wide selection popup (Ask / Explain / Change / Add) when the OS reports selected text.

## Flag

`text-selection` (default **on**).

## Public API

```ts
import { TextSelectionPopup, useTextSelectionActions } from '@/features/text-selection'
```

| File | Role |
|------|------|
| `components/TextSelection.tsx` | Root wiring |
| `components/TextSelectionPopup.tsx` | Floating actions |
| `components/TextSelectionInput.tsx` / `Output` | Follow-up UI |
| `hooks/` | Action handlers |

Native hook: `interface-window/` (`selection-hook`). Overlay: `app/overlays/TextSelectionOverlay.tsx`.

Prompt text for actions: `frontend/src/services/prompts/actions/` and `prompts/text-selection/`.

If selection never appears, rebuild interface-window and confirm the flag is enabled. Browser `npm run dev` will not get OS selection.
