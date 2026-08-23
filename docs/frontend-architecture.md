# Frontend architecture (current)

This is the **actual** renderer layout. Longer style guides: [ARCHITECTURE.md](../frontend/ARCHITECTURE.md) (principles) and [src/ARCHITECTURE.md](../frontend/src/ARCHITECTURE.md) (folder encyclopedia — some names there lag the tree).

## Entry

`src/app/main.tsx` → `AppProviders` → `App.tsx` → `OverlayRegistry`.

Dev URL: `http://localhost:5173`. Packaged: `buddy-app://`.

## Layers

| Layer | Path | Allowed |
|-------|------|---------|
| Shell | `src/app/` | Overlays, AppContext, providers |
| Features | `src/features/{name}/` | One product area, public `index.ts` |
| Widgets | `src/components/` | prompt-input, ui/, remote-pad chrome |
| Shared | `src/shared/` | Theme, flags provider, shadcn-ish primitives |
| Domain | `src/services/`, `src/lib/` | Prompts, STT, AI SDK — no overlay JSX |

Alias: `@/` → `src/`.

## Overlay routing

Heavy panels: `#/o/settings+image`. IDs in `overlayRouteIds.ts`, loaders in `overlayRouteMap.ts`. Shell overlays stay mounted for click-through. [overlays.md](overlays.md).

## State

| Kind | Where |
|------|--------|
| Feature on/off | `FeatureProvider` + `feature-flags/definitions` |
| Chat session | `AppContext` + `useMessageManager` |
| Theme / animations / voice | matching providers in `AppProviders` |
| Window chrome | `useUIState` |

Do not add a global Redux store. Prefer feature-local state + context already in the tree.

## Import rules

```ts
import { SmartMessage } from '@/features/chat'     // yes
import { Button } from '@/components/ui/button'    // yes
import { Foo } from '@/features/chat/hooks/useFoo' // no — deep
import { Bar } from '@/features/settings'          // no — from inside chat/
```

Cross-feature: `shared/`, `services/`, or lift to `AppContext`.

## Dual locations (intentional for now)

| Concern | Facades | Implementation |
|---------|---------|----------------|
| Prompt composer | `features/prompt/` | `components/prompt-input/` |
| AI | `services/ai` re-exports | `lib/ai/` |
| Message manager | `features/chat/hooks` | also `src/hooks/useMessageManager.ts` used by AppContext |

Follow `@deprecated` comments; do not duplicate a third copy.

## Adding UI

1. New feature folder + README + barrel.  
2. Optional `.feature.ts` flag.  
3. Mount from an overlay or prompt action.  
4. Row in [features.md](features.md).
