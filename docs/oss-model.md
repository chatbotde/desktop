# Open-source model (Telegram-style)

SonicThinking follows the same split as **Telegram**:

| Layer | License | What it is |
|-------|---------|------------|
| **Clients** | Public (GPL-3.0) | Apps people install and audit |
| **Backend / business** | Private | Accounts, payments, official cloud |

Forks get the **clients**. They do not get your auth site, database, payment keys, or release-signing secrets.

```
Open (this repo + remote-desktop)
  Buddy desktop client
  Android Remote client
  LAN protocol (QR + PIN)

Closed (not in these repos)
  webbuddy — login, subscriptions, Razorpay / Dodo
  Official Supabase / LiveKit / R2
  Installer signing, update feed credentials
```

## Two ways the desktop client runs

**Official SonicThinking installer** (your GitHub `sonicthinking/buddy` release CI)

- Hosted login is **on**
- Talks to your closed site (`sonicthinking.com`)
- Trials, Pro, VIP are decided **on the server** — never trust the client alone

**Fork / `npm run dev` / self-built installer**

- Hosted login is **off** (local mode)
- No auth window
- User brings their own API keys or Ollama
- Remote Desktop still pairs on the same Wi‑Fi (QR + PIN)
- They cannot charge your cloud or read your user DB

That is stricter for *your* servers than Telegram (Telegram forks still hit Telegram’s API). It is better for contributors and still keeps money on the closed side.

## What you must never put in the open clients

- `.env` with real keys
- `SUPABASE_SERVICE_ROLE_KEY`, LiveKit secret, R2 access keys
- Payment webhook secrets
- Android upload keystore / Apple notarization certs
- The webbuddy source tree

`.env.example` and empty `auth/build-config.json` (`hostedAuth: false`) stay public.

## Official vs fork builds

| | Official | Fork |
|--|----------|------|
| Source | Same public client | Same public client |
| `auth/build-config.json` | CI sets `hostedAuth: true` | stays `false` |
| Login window | Yes | No |
| Remote Pad LAN | Yes | Yes |
| Your paid cloud | Yes | No (unless they set `AUTH_SERVER_URL` to **their** server) |

Enable hosted auth yourself: `REQUIRE_AUTH=true` or `AUTH_SERVER_URL=…`.  
Force local: `SKIP_AUTH=true`.

## Product rule

- **Value users pay you for** lives on the closed backend (account, sync, official WAN streaming you operate, billing).
- **Value users can rebuild** lives in the clients (UI, overlay, protocol, local AI).

Do not implement “is this user Pro?” only in React. The official app already asks the server; keep it that way.
