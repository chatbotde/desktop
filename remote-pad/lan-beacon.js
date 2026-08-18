const dgram = require('dgram');

const BEACON_PORT = 8764;
const BEACON_INTERVAL_MS = 2_000;

/**
 * UDP broadcast so phones on the same Wi‑Fi can find Buddy without internet or a static IP.
 */
class LanBeacon {
  constructor() {
    /** @type {import('dgram').Socket | null} */
    this.socket = null;
    /** @type {ReturnType<typeof setInterval> | null} */
    this.timer = null;
  }

  /**
   * @param {{ buddyId: string; port: number }} params
   */
  start({ buddyId, port }) {
    if (this.timer) {
      return;
    }

    try {
      this.socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
      this.socket.on('error', (error) => {
        console.warn('[RemotePad] LAN beacon error:', error.message);
      });
      this.socket.bind(() => {
        this.socket?.setBroadcast(true);
      });

      const payload = () =>
        Buffer.from(
          JSON.stringify({
            type: 'buddy_remote',
            buddyId,
            port,
          })
        );

      this.timer = setInterval(() => {
        if (!this.socket) {
          return;
        }
        this.socket.send(payload(), BEACON_PORT, '255.255.255.255', (error) => {
          if (error) {
            console.warn('[RemotePad] LAN beacon send failed:', error.message);
          }
        });
      }, BEACON_INTERVAL_MS);

      console.log(`[RemotePad] LAN beacon active on UDP ${BEACON_PORT}`);
    } catch (error) {
      console.warn('[RemotePad] Failed to start LAN beacon:', error);
    }
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

module.exports = { LanBeacon, BEACON_PORT };
