# MCP

Model Context Protocol client used by Buddy (user-defined servers + **Cua Driver**).

| File | Role |
|------|------|
| `mcp-client.js` | Connect, list tools, IPC |
| `mcp-connection.js` | One server session |
| `mcp-store.js` | Persisted server list |
| `cua-driver.js` | Auto-register Cua if `cua-driver` is installed |

Settings: **MCP Servers** (`McpServersSection.tsx`).

Cua / Agent pill: [docs/cua-architecture.md](../docs/cua-architecture.md) and `frontend/src/features/cua/`.

Smoke test from repo root: `npm run test-cua-driver`.
