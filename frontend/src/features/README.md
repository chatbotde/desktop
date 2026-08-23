# Frontend features

Each folder is a team boundary. Import only from that feature’s `index.ts` (`@/features/chat`, never a deep path into another feature).

| Folder | README | Purpose |
|--------|--------|---------|
| `chat/` | [README](chat/README.md) | Messages, streaming, Manim helpers |
| `prompt/` | [README](prompt/README.md) | Composer facade + model selector |
| `output-window/` | [README](output-window/README.md) | Floating chat window |
| `capture/` | [README](capture/README.md) | Screenshots and recording |
| `audio/` | [README](audio/README.md) | Mic, STT, recording |
| `voice/` | [README](voice/README.md) | TTS / cloned voices |
| `text-selection/` | [README](text-selection/README.md) | OS selection popup |
| `settings/` | [README](settings/README.md) | Settings modal |
| `feature-flags/` | [README](feature-flags/README.md) | Toggle registry |
| `cua/` | [README](cua/README.md) | Computer-use / Cua Driver |

Namespace barrel: `index.ts` (`export * as chat from './chat'` …). **Append** new `export * as name` lines; do not re-sort.

Full product map: [docs/features.md](../../../docs/features.md).
