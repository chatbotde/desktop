# Agent sessions

Runs **external coding CLIs** as managed sessions so the Android Agents tab (and desktop) can start, approve, and stream output.

## Adapters (`adapters/`)

| Id | CLI |
|----|-----|
| Claude Code | `claude-code.js` |
| Gemini CLI | `gemini-cli.js` |
| Codex | `codex.js` |
| Aider | `aider.js` |
| OpenCode | `opencode.js` |

Registry: `adapters/registry.js`. Add a new adapter there + a file implementing the base contract (`adapters/base.js`).

## Other pieces

| File | Role |
|------|------|
| `index.js` | Facade used by main |
| `core/agent-manager.js` | Install hooks, catalog |
| `core/process-wrapper.js` | PTY / process I/O |
| `session-store.js` | Session snapshots |
| `remote-pad-bridge.js` | Phone protocol (`agent*` messages) |
| `socket-server.js` | Local hook forwarder socket |
| `shim-installer.js` | Optional PATH shims (`npm run agent:install-shims`) |

Phone UI: remote-desktop `feature/agents/`. Protocol types must match `remote-pad/protocol.js`.
