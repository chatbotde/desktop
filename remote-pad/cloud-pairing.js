const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

/**
 * @param {string | undefined} value
 * @returns {string}
 */
function cleanEnv(value) {
  if (!value) {
    return '';
  }
  return value.trim().replace(/^#+/, '');
}

/**
 * @returns {{ url: string; serviceRoleKey: string; anonKey: string } | null}
 */
function getSupabaseConfig() {
  const url = cleanEnv(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.REMOTE_PAD_SUPABASE_URL
  );
  const serviceRoleKey = cleanEnv(
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REMOTE_PAD_SUPABASE_SERVICE_KEY
  );
  const anonKey = cleanEnv(
    process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.REMOTE_PAD_SUPABASE_ANON_KEY
  );

  if (!url || !serviceRoleKey) {
    return null;
  }

  return { url: url.replace(/\/$/, ''), serviceRoleKey, anonKey };
}

/**
 * @param {string} buddyId
 * @param {string} pin
 * @returns {string}
 */
function hashPin(buddyId, pin) {
  return crypto.createHash('sha256').update(`${buddyId}:${pin}`).digest('hex');
}

/** How long subscriber tokens stay valid (must match livekit-token.js TTL). */
const SUBSCRIBER_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
/** Refresh stored tokens before they expire while Buddy stays open. */
const TOKEN_REFRESH_INTERVAL_MS = 12 * 60 * 60 * 1000;
/** Keep online_at fresh so phones see accurate PC Online while Buddy is open. */
const HEARTBEAT_INTERVAL_MS = 45_000;

/**
 * Registers Buddy in Supabase while Remote Pad runs so paired phones can reconnect
 * from any network. Sends a lightweight heartbeat between full token refreshes.
 */
class RemotePadCloudPairing {
  /**
   * @param {() => Promise<{ url: string; token: string; room: string } | null>} createSubscriberCredentials
   */
  constructor(createSubscriberCredentials) {
    this.createSubscriberCredentials = createSubscriberCredentials;
    this.refreshInterval = null;
    this.heartbeatInterval = null;
    this.running = false;
    /** @type {{ buddyId: string; pin: string; livekitUrl: string; livekitRoom: string } | null} */
    this.activeParams = null;
  }

  /**
   * @returns {boolean}
   */
  isConfigured() {
    return getSupabaseConfig() !== null;
  }

  /**
   * @returns {{ url: string; anonKey: string } | null}
   */
  getPublicConfig() {
    const config = getSupabaseConfig();
    if (!config?.anonKey) {
      return config ? { url: config.url, anonKey: '' } : null;
    }
    return { url: config.url, anonKey: config.anonKey };
  }

  /**
   * @param {{ buddyId: string; pin: string; livekitUrl: string; livekitRoom: string }} params
   */
  async syncPresence(params) {
    const config = getSupabaseConfig();
    if (!config) {
      return false;
    }

    const credentials = await this.createSubscriberCredentials();
    if (!credentials) {
      return false;
    }

    const tokenExpiresAt = new Date(Date.now() + SUBSCRIBER_TOKEN_TTL_MS).toISOString();
    const payload = {
      buddy_id: params.buddyId,
      pin_hash: hashPin(params.buddyId, params.pin),
      livekit_url: params.livekitUrl,
      livekit_room: params.livekitRoom,
      subscriber_token: credentials.token,
      token_expires_at: tokenExpiresAt,
      online_at: new Date().toISOString(),
    };

    const response = await fetch(`${config.url}/rest/v1/remote_pad_peers`, {
      method: 'POST',
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('[RemotePad Cloud] Supabase sync failed:', response.status, text);
      return false;
    }

    return true;
  }

  /**
   * @param {string} buddyId
   * @returns {Promise<boolean>}
   */
  async touchPresence(buddyId) {
    const config = getSupabaseConfig();
    if (!config || !buddyId) {
      return false;
    }

    try {
      const response = await fetch(
        `${config.url}/rest/v1/remote_pad_peers?buddy_id=eq.${encodeURIComponent(buddyId)}`,
        {
          method: 'PATCH',
          headers: {
            apikey: config.serviceRoleKey,
            Authorization: `Bearer ${config.serviceRoleKey}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({ online_at: new Date().toISOString() }),
        }
      );

      return response.ok;
    } catch (error) {
      console.warn('[RemotePad Cloud] Heartbeat failed:', error);
      return false;
    }
  }

  /**
   * @param {{ buddyId: string; pin: string; livekitUrl: string; livekitRoom: string }} params
   */
  async start(params) {
    if (!this.isConfigured()) {
      return;
    }

    this.activeParams = params;
    this.running = true;

    this.clearIntervals();

    await this.syncOnce();

    this.heartbeatInterval = setInterval(() => {
      void this.sendHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    this.refreshInterval = setInterval(() => {
      void this.syncOnce();
    }, TOKEN_REFRESH_INTERVAL_MS);
  }

  clearIntervals() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  async sendHeartbeat() {
    if (!this.running || !this.activeParams) {
      return false;
    }

    const ok = await this.touchPresence(this.activeParams.buddyId);
    if (!ok) {
      console.warn('[RemotePad Cloud] Heartbeat missed — refreshing cloud session');
      return this.syncOnce();
    }
    return true;
  }

  async syncOnce() {
    if (!this.running || !this.activeParams) {
      return false;
    }

    try {
      const ok = await this.syncPresence(this.activeParams);
      if (ok) {
        console.log('[RemotePad Cloud] Session registered — PC Online heartbeat active');
      }
      return ok;
    } catch (error) {
      console.error('[RemotePad Cloud] Session sync error:', error);
      return false;
    }
  }

  /**
   * @param {string} buddyId
   * @returns {Promise<boolean>}
   */
  async checkConnectionRequest(buddyId) {
    const config = getSupabaseConfig();
    if (!config || !buddyId) {
      return false;
    }

    try {
      const response = await fetch(
        `${config.url}/rest/v1/remote_pad_peers?buddy_id=eq.${encodeURIComponent(buddyId)}&select=connection_requested_at`,
        {
          headers: {
            apikey: config.serviceRoleKey,
            Authorization: `Bearer ${config.serviceRoleKey}`,
          },
        }
      );

      if (!response.ok) {
        return false;
      }

      const rows = await response.json();
      const requestedAt = rows[0]?.connection_requested_at;
      if (!requestedAt) {
        return false;
      }

      const ageMs = Date.now() - new Date(requestedAt).getTime();
      return ageMs >= 0 && ageMs < 60_000;
    } catch {
      return false;
    }
  }

  /**
   * @param {string} buddyId
   */
  async clearConnectionRequest(buddyId) {
    const config = getSupabaseConfig();
    if (!config || !buddyId) {
      return;
    }

    try {
      await fetch(`${config.url}/rest/v1/remote_pad_peers?buddy_id=eq.${encodeURIComponent(buddyId)}`, {
        method: 'PATCH',
        headers: {
          apikey: config.serviceRoleKey,
          Authorization: `Bearer ${config.serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ connection_requested_at: null }),
      });
    } catch {
      // ignore
    }
  }

  async stop(buddyId) {
    this.running = false;
    this.activeParams = null;
    this.clearIntervals();

    const config = getSupabaseConfig();
    if (!config || !buddyId) {
      return;
    }

    try {
      await fetch(`${config.url}/rest/v1/remote_pad_peers?buddy_id=eq.${encodeURIComponent(buddyId)}`, {
        method: 'DELETE',
        headers: {
          apikey: config.serviceRoleKey,
          Authorization: `Bearer ${config.serviceRoleKey}`,
        },
      });
    } catch {
      // ignore
    }
  }
}

module.exports = {
  RemotePadCloudPairing,
  getSupabaseConfig,
  hashPin,
};
