const QRCode = require('qrcode');

/**
 * Compact JSON payload scanned by the Buddy Remote Android app.
 * @param {{
 *   id: string;
 *   host?: string;
 *   meshHost?: string;
 *   port?: number;
 *   pin: string;
 *   livekit?: { url: string; token: string; room: string } | null;
 *   cloud?: {
 *     livekitUrl: string;
 *     livekitRoom: string;
 *     supabaseUrl: string;
 *     supabaseAnonKey: string;
 *   } | null;
 * }} params
 * @returns {string}
 */
function buildPairingPayload({ id, host, meshHost, port, pin, livekit = null, cloud = null }) {
  if (cloud?.supabaseUrl && cloud.supabaseAnonKey) {
    /** @type {Record<string, unknown>} */
    const payload = {
      v: 3,
      id,
      pin,
      livekitUrl: cloud.livekitUrl,
      livekitRoom: cloud.livekitRoom,
      supabaseUrl: cloud.supabaseUrl,
      supabaseAnonKey: cloud.supabaseAnonKey,
      cloudPairing: true,
      preferLiveKit: true,
      preferLan: true,
    };

    if (livekit?.token) {
      payload.livekitToken = livekit.token;
    }

    if (host) {
      payload.host = host;
    }
    if (meshHost) {
      payload.meshHost = meshHost;
    }
    if (port) {
      payload.port = port;
    }

    return JSON.stringify(payload);
  }

  /** @type {Record<string, unknown>} */
  const payload = {
    v: livekit ? 2 : 1,
    id,
    pin,
  };

  if (host) {
    payload.host = host;
    payload.preferLan = true;
  }
  if (meshHost) {
    payload.meshHost = meshHost;
  }
  if (port) {
    payload.port = port;
  }
  if (livekit) {
    payload.livekitUrl = livekit.url;
    payload.livekitToken = livekit.token;
    payload.livekitRoom = livekit.room;
    payload.preferLiveKit = true;
  }

  return JSON.stringify(payload);
}

/**
 * @param {string} payload
 * @returns {Promise<string>} data:image/png;base64,... URL
 */
async function toDataUrl(payload) {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 320,
  });
}

module.exports = {
  buildPairingPayload,
  toDataUrl,
};
