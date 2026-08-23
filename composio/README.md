# Composio

Connects third-party apps as tools (Gmail, Calendar, …) via [Composio](https://composio.dev).

Needs `COMPOSIO_API_KEY` in `.env` and a signed-in Buddy user (`auth/`). Without the key, the client logs a warning and integrations stay disabled.

| File | Role |
|------|------|
| `composio-client.js` | Session, OAuth open-in-browser, IPC |

Settings UI: **Integrations** (`IntegrationsSection.tsx`).
