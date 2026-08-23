# Getting started

Run the SonicThinking desktop app from source.

## Prerequisites

- **Node.js 20+** and npm
- Windows, macOS, or Linux
- Optional: [Ollama](https://ollama.com/) for local models
- Optional: Android companion — clone [remote-desktop](https://github.com/sonicthinking/remote-desktop) separately

You do **not** need SonicThinking sign-in. Forks and `npm run dev` run in **local mode**: add API keys in Settings → Custom Models (or Ollama). The hosted login window is off unless this is an official SonicThinking build.

## Install

```bash
git clone https://github.com/sonicthinking/buddy.git
cd buddy
cp .env.example .env
npm install
cd frontend && npm install && cd ..
```

Native modules (`keytar`, `better-sqlite3`, `selection-hook`, `robotjs`) compile during `npm install`. If that fails, install C++ build tools for your OS (Visual Studio Build Tools on Windows, Xcode CLT on macOS).

## Run

```bash
npm run dev
```

This starts Vite on port 5173 and then Electron. The overlay is the main UI.

**UI only (browser, no native capture/shortcuts):**

```bash
cd frontend
npm run dev
```

## Environment variables

`.env` is gitignored. `.env.example` lists optional keys:

| Variable | Needed when |
|----------|-------------|
| `OPENAI_API_KEY`, `GEMINI_API_KEY`, … | You prefer env over Settings UI |
| `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` | Cloud / WAN screen share to the phone |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Internet pairing (not same-Wi‑Fi QR) |
| `AUTH_SERVER_URL` / `BETTER_AUTH_*` | Optional hosted sign-in (not required) |

LAN Remote Pad (same Wi‑Fi + QR) works with **no** LiveKit or Supabase.

## Useful scripts

| Command | What it does |
|---------|----------------|
| `npm run dev` | Vite + Electron |
| `npm run build:all` | Compile utils, OS hooks, and frontend |
| `npm run dist` | Installer for this OS (`electron-builder`) |
| `cd frontend && npm test` | Vitest |
| `cd frontend && npm run lint` | ESLint |
| `npm run test-cua-driver` | Smoke test for computer-use driver |

## First-run tips

1. Open Settings and paste at least one provider key, **or** start Ollama (`ollama pull llama3.2`).
2. Default overlay shortcut is typically `Ctrl+Space` / `Cmd+Space` (check Settings if it conflicts).
3. For the phone app, enable Remote Pad and scan the QR — see [remote-pad.md](remote-pad.md).

To change a capability, open [architecture.md](architecture.md) (where it lives) then [features.md](features.md) (flag + folder + README).

## Troubleshooting

- **Blank window:** wait for Vite (`http://localhost:5173`). `wait-on` should block Electron until it is up.
- **`selection-hook` / `robotjs` build errors:** install platform build tools, then `npm rebuild`.
- **Windows firewall:** Remote Pad may prompt to allow port 8765. See `remote-pad/windows-firewall.js`.
- **Do not commit `.env`.** If you did, rotate those keys immediately.
