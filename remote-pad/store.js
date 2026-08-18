const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const CONFIG_FILE = 'remote-pad-config.json';

/**
 * @returns {string}
 */
function getConfigPath() {
  return path.join(app.getPath('userData'), CONFIG_FILE);
}

/**
 * @returns {{ buddyId?: string; pin?: string; port?: number }}
 */
function loadConfig() {
  try {
    const raw = fs.readFileSync(getConfigPath(), 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * @param {{ buddyId?: string; pin?: string; port?: number }} config
 */
function saveConfig(config) {
  fs.mkdirSync(path.dirname(getConfigPath()), { recursive: true });
  fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2), 'utf8');
}

/**
 * @param {{ buddyId?: string; pin?: string; port?: number }} config
 * @returns {string}
 */
function getOrCreateBuddyId(config) {
  if (config.buddyId) {
    return config.buddyId;
  }

  const id = `BUDDY-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  config.buddyId = id;
  saveConfig(config);
  return id;
}

/**
 * @param {{ buddyId?: string; pin?: string; port?: number }} config
 * @returns {string}
 */
function getOrCreatePin(config) {
  if (config.pin) {
    return config.pin;
  }

  const pin = crypto.randomInt(100000, 999999).toString();
  config.pin = pin;
  saveConfig(config);
  return pin;
}

module.exports = {
  loadConfig,
  saveConfig,
  getOrCreateBuddyId,
  getOrCreatePin,
};
