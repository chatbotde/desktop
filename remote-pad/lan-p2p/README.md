# LAN P2P WebRTC streaming

Isolated module for same-Wi‑Fi desktop video over **WebRTC P2P**.

Does not replace LiveKit (cloud) or MJPEG (fallback). Control (mouse/typing)
stays on the existing WebSocket (`8765`).

## Quality defaults (LAN)

- Video: up to **1080p / 60 fps / 8 Mbps**, prefer H.264
- Audio: system loopback (desktop sound) via Opus
- Phone can pause with `screenShare` (stops video + audio capture)

## Flow

1. Phone authenticates on `ws://PC:8765`
2. `auth_ok` includes `lanP2p: true`
3. Phone sends `webrtc_request`
4. PC captures screen and sends `webrtc_offer`
5. Phone answers + ICE exchange over WebSocket
6. Video flows UDP peer-to-peer on LAN

## Stop video from phone

```json
{ "type": "screenShare", "enabled": false }
```

PC stops capture. Typing/mouse keep working.

## Files

| File | Role |
|------|------|
| `index.js` | Electron host + IPC bridge |
| `publisher-renderer.js` | `getDisplayMedia` + `RTCPeerConnection` |
| `publisher-preload.js` | Secure IPC bridge |
| `publisher-window.html` | Hidden capture window |

## Config

- `preferLanP2p` (default `true`) — prefer WebRTC over MJPEG on LAN
- MJPEG `/stream` still works as fallback if a client hits it
