const os = require('os');

const SKIP_INTERFACE = /virtual|vmware|hyper-v|vbox|vether|wsl|docker|loopback|tailscale|hamachi|npcap|bluetooth/i;
const PREFERRED_INTERFACE = /wi-?fi|wlan|wireless|ethernet|eth/i;
const WIFI_DIRECT_INTERFACE = /wi-?fi direct|direct virtual|p2p/i;

/**
 * Returns the best LAN IPv4 for phone pairing (prefers Wi‑Fi / 192.168.x.x).
 * @returns {string}
 */
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  /** @type {{ addr: string; score: number; name: string }[]} */
  const candidates = [];

  for (const [name, ifaces] of Object.entries(interfaces)) {
    if (SKIP_INTERFACE.test(name)) {
      continue;
    }

    for (const iface of ifaces || []) {
      const family = iface.family;
      if (family !== 'IPv4' && family !== 4) {
        continue;
      }
      if (iface.internal) {
        continue;
      }

      const addr = iface.address;
      let score = 10;

      if (addr.startsWith('192.168.')) {
        score = 100;
      } else if (addr.startsWith('10.')) {
        score = 80;
      } else if (/^172\.(1[6-9]|2\d|3[01])\./.test(addr)) {
        score = 60;
      }

      if (PREFERRED_INTERFACE.test(name)) {
        score += 25;
      }

      if (WIFI_DIRECT_INTERFACE.test(name)) {
        score += 40;
      }

      if (addr.startsWith('192.168.49.') || addr.startsWith('192.168.137.')) {
        score += 35;
      }

      candidates.push({ addr, score, name });
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  if (candidates.length > 0) {
    const best = candidates[0];
    console.log(`[RemotePad] Using LAN IP ${best.addr} (${best.name})`);
    return best.addr;
  }

  console.warn('[RemotePad] No LAN IP found — check Wi‑Fi/Ethernet connection');
  return '127.0.0.1';
}

/** Tailscale / similar mesh VPN CGNAT range (100.64.0.0/10). */
function isMeshVpnAddress(addr) {
  const parts = String(addr || '').split('.').map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }
  return parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127;
}

/**
 * Strip IPv4-mapped IPv6 (::ffff:192.168.0.1 → 192.168.0.1).
 * @param {string | undefined} raw
 * @returns {string}
 */
function normalizeIpAddress(raw) {
  const value = String(raw || '').trim();
  if (value.startsWith('::ffff:')) {
    return value.slice(7);
  }
  return value;
}

/**
 * Mesh VPN addresses (Tailscale, Netbird, etc.) for cross-network local connect.
 * @returns {string[]}
 */
function getMeshVpnAddresses() {
  const interfaces = os.networkInterfaces();
  /** @type {string[]} */
  const addresses = [];

  for (const ifaces of Object.values(interfaces)) {
    for (const iface of ifaces || []) {
      const family = iface.family;
      if (family !== 'IPv4' && family !== 4) {
        continue;
      }
      if (iface.internal) {
        continue;
      }
      const addr = normalizeIpAddress(iface.address);
      if (isMeshVpnAddress(addr) && !addresses.includes(addr)) {
        addresses.push(addr);
      }
    }
  }

  return addresses;
}

module.exports = {
  getLocalIpAddress,
  getMeshVpnAddresses,
  isMeshVpnAddress,
  normalizeIpAddress,
};
