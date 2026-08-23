# Remote Pad (desktop server)

Lets the [Android companion](https://github.com/sonicthinking/remote-desktop) control this PC.

**Contributor guide:** [docs/remote-pad.md](../docs/remote-pad.md)  
**LAN WebRTC:** [lan-p2p/README.md](lan-p2p/README.md)  
**Wire types:** `protocol.js` — keep in sync with `RemotePadProtocol.kt`.

| File | Role |
|------|------|
| `index.js` | `RemotePadService` — QR, PIN, start/stop |
| `remote-pad-server.js` | WebSocket server (default port 8765) |
| `protocol.js` | Message `type` constants |
| `input-handler.js` | Mouse / keyboard injection |
| `qr.js` | Pairing payload + image |
| `network.js` | LAN / VPN addresses |
| `store.js` | PIN, buddy id, persisted config |
| `lan-p2p/` | Same-Wi‑Fi WebRTC screen share |
| `lan-http-server.js` | MJPEG `/stream` fallback |
| `livekit-stream.js` / `livekit-token.js` | Cloud video |
| `cloud-pairing.js` | Optional Supabase pairing |
| `clipboard-sync.js` | Clipboard bridge |
| `phone-file-sender.js` / `phone-share-inbox.js` | Files |
| `windows-firewall.js` | Port 8765 on Windows |

Settings UI: `frontend/src/features/settings/sections/RemotePadSection.tsx`.

Do not expose 8765 to the public internet without a stronger auth design than a local PIN.
