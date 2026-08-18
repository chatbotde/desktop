# Cua Driver feature module

OS automation via [Cua Driver](https://github.com/trycua/cua) MCP. Powers the Agent pill with background clicks and typing.

**Full architecture, file map, and maintenance guide:** [`../../../docs/cua-architecture.md`](../../../docs/cua-architecture.md)

## Quick reference

```
cua-driver-client.ts   # MCP wrappers (windows, actions, headless mode)
cua-simple-tasks.ts    # Fast path: "open notepad and type …"
components/
  CuaDriverPanel.tsx   # Settings UI
index.ts               # Public exports — import from @/features/cua only
```

## Public import

```typescript
import { isCuaDriverReady, executeSimpleCuaTask } from '@/features/cua'
```

## Dev

```bash
npm run test-cua-driver      # from buddy/ root
npm run build:interface      # after preload changes
```
