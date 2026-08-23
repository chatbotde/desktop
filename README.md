# SonicThinking (Buddy)

Desktop AI companion for Windows, macOS, and Linux. Overlay chat, screen capture, voice, clipboard, and an optional Android remote-control app.

**Companion app:** [remote-desktop](https://github.com/sonicthinking/remote-desktop) (Android)

[Features](#features) · [Quick start](#quick-start) · [Docs](#docs) · [Contributing](#contributing)

## Features

**Full catalog (every flag, folder, and how to change it):** [docs/features.md](docs/features.md)

- Overlay chat with OpenAI, Anthropic, Gemini, Groq, DeepSeek, OpenRouter, Ollama, and more
- Screen capture, area selection, and video recording
- Voice-to-prompt and live transcription
- Clipboard + system-wide text-selection actions
- YouTube transcripts
- Agent pill / computer-use (Cua Driver or robotjs)
- **Remote Pad** — control this PC from the Android companion (LAN WebRTC, LiveKit cloud, or MJPEG fallback)

API keys stay on the machine (Settings UI or OS keychain). You do not need a cloud account to run locally.

**Business split (like Telegram):** the **clients** are GPL-3.0. Accounts, payments, and official cloud stay closed. Forks run in local mode (no login window). Official installers still use SonicThinking sign-in. Details: [docs/oss-model.md](docs/oss-model.md).

## Quick start

**Need:** Node.js 20+ and npm. Ollama is optional (local models).

```bash
git clone https://github.com/sonicthinking/buddy.git
cd buddy
cp .env.example .env          # optional — keys can also be added in Settings
npm install
cd frontend && npm install && cd ..
npm run dev                   # Vite + Electron (no SonicThinking login)
```

Build installers:

```bash
npm run dist          # current OS
npm run dist:win      # Windows
npm run dist:mac      # macOS
npm run dist:linux    # Linux
```

More detail: [docs/getting-started.md](docs/getting-started.md)

### Pair the Android app

1. Run Buddy and open Remote Pad (QR + PIN).
2. Install [remote-desktop](https://github.com/sonicthinking/remote-desktop) on the phone.
3. Scan the QR on the same Wi‑Fi, or use cloud pairing if you configured LiveKit/Supabase.

Protocol notes: [docs/remote-pad.md](docs/remote-pad.md)

## Repo map

```
buddy/
├── main.js                 # Electron entry
├── application/            # Window lifecycle, IPC
├── frontend/               # React + TypeScript + Vite UI
├── interface-window/       # OS hooks (selection, shortcuts)
├── auth/                   # Optional desktop ↔ web sign-in
├── remote-pad/             # Phone control server + screen share
├── mcp/                    # Agent / computer-use helpers
└── docs/                   # Feature catalog, architecture, Remote Pad
```

Frontend features live in `frontend/src/features/` (each folder has a README). Start with [docs/architecture.md](docs/architecture.md), then [docs/features.md](docs/features.md).

## Docs

| Doc | What it covers |
|-----|----------------|
| [docs/README.md](docs/README.md) | Docs index |
| [docs/getting-started.md](docs/getting-started.md) | Install, env vars, first run |
| [docs/architecture.md](docs/architecture.md) | **System architecture** — processes, boot, layers |
| [docs/frontend-architecture.md](docs/frontend-architecture.md) | React layers and import rules |
| [docs/data-flows.md](docs/data-flows.md) | Chat, capture, agent, phone sequences |
| [docs/ipc.md](docs/ipc.md) | Preload / IPC |
| [docs/features.md](docs/features.md) | **Every feature** — flags, code, extend checklist |
| [docs/oss-model.md](docs/oss-model.md) | Open clients, closed backend (Telegram-style) |
| [docs/overlays.md](docs/overlays.md) | Overlay shell and `#/o/` routes |
| [docs/settings.md](docs/settings.md) | Settings pages |
| [docs/main-process.md](docs/main-process.md) | Electron modules |
| [docs/remote-pad.md](docs/remote-pad.md) | Phone pairing and protocol |
| [frontend/src/features/README.md](frontend/src/features/README.md) | UI feature folders |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Branches, PRs, review |
| [SECURITY.md](SECURITY.md) | Privileges and vulnerability reports |
| [AGENTS.md](AGENTS.md) | Map for humans and coding agents |

## Configuration

Copy `.env.example` to `.env` only if you want keys in the environment. The app also accepts keys in **Settings → AI providers**.

Remote Pad cloud streaming (optional) needs LiveKit and, for internet pairing, Supabase — see `.env.example`. LAN pairing on the same Wi‑Fi works without those.

## Contributing

1. Read [CONTRIBUTING.md](CONTRIBUTING.md).
2. One feature module per PR when you can.
3. Open an issue first for large changes.

Please do not commit `.env`, keystores, or API keys.

## License

[GNU GPL v3](LICENSE) © Sonic Thinking
