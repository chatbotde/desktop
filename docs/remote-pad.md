# Remote Pad

Buddy can be controlled from the **Android companion** ([remote-desktop](https://github.com/sonicthinking/remote-desktop)).

This folder (`remote-pad/`) is the **desktop server**. Keep the wire protocol in sync with the phone:

- Desktop: `remote-pad/protocol.js`
- Android: `app/src/main/java/com/example/remote/RemotePadProtocol.kt`

If you change a `type` string, update **both** repos in the same change set (or open paired PRs).

## Pairing

**Same Wi‑Fi (simplest)**

1. Start Buddy and open Remote Pad.
2. Allow the local firewall prompt (Windows may ask for port **8765**).
3. On the phone, scan the QR (PIN + host + port) or enter IP manually.

**Internet / different networks**

Needs LiveKit (media) and optional Supabase (pairing records). Set the variables in `.env.example`. LAN QR still works without them.

## Transports

| Path | When |
|------|------|
| LAN WebRTC P2P | Same network, preferred for video — `remote-pad/lan-p2p/` |
| LiveKit | Cloud / WAN screen share |
| MJPEG `/stream` | Fallback if WebRTC is unavailable |
| WebSocket `:8765` | Always used for input (mouse, keys, files, agents) |

LAN P2P details: [remote-pad/lan-p2p/README.md](../remote-pad/lan-p2p/README.md)

## Desktop modules

| File | Role |
|------|------|
| `index.js` | Service entry |
| `remote-pad-server.js` | WebSocket server |
| `input-handler.js` | Mouse / keyboard |
| `qr.js` | Pairing payload |
| `livekit-stream.js` / `livekit-token.js` | Cloud video |
| `clipboard-sync.js` | Clipboard bridge |
| `windows-firewall.js` | Port 8765 on Windows |

## Security notes

- The phone authenticates with the PIN from the QR. Treat that PIN like a local password.
- `usesCleartextTraffic` on Android is for LAN `ws://` / `http://`. Do not expose 8765 to the public internet without TLS and a stronger auth story.
- Computer-use / agent messages can run shell and input on the PC — only pair devices you trust.
