const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { AccessToken } = require('livekit-server-sdk');

/**
 * @returns {{ url: string; apiKey: string; apiSecret: string } | null}
 */
function getLiveKitConfig() {
  const url = process.env.LIVEKIT_URL?.trim();
  const apiKey = process.env.LIVEKIT_API_KEY?.trim();
  const apiSecret = process.env.LIVEKIT_API_SECRET?.trim();

  if (!url || !apiKey || !apiSecret) {
    return null;
  }

  return { url, apiKey, apiSecret };
}

/**
 * @param {string} roomName
 * @param {string} identity
 * @param {{ canPublish?: boolean; canSubscribe?: boolean }} grants
 * @returns {Promise<string>}
 */
async function createLiveKitToken(roomName, identity, grants = {}) {
  const config = getLiveKitConfig();
  if (!config) {
    throw new Error('LiveKit is not configured');
  }

  const token = new AccessToken(config.apiKey, config.apiSecret, {
    identity,
    ttl: '24h',
  });

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: grants.canPublish ?? false,
    canSubscribe: grants.canSubscribe ?? false,
  });

  return token.toJwt();
}

function getRoomName(buddyId) {
  return buddyId.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
}

module.exports = {
  getLiveKitConfig,
  createLiveKitToken,
  getRoomName,
};
