/**
 * Hosted SonicThinking login vs local / open-source mode.
 *
 * Default (this file + no env): forks and `npm run dev` never open
 * https://www.sonicthinking.com. Users add their own API keys in Settings.
 *
 * Official packaged builds set hostedAuth in build-config.json at CI time
 * (only when github.repository is sonicthinking/buddy).
 *
 * Override any time:
 *   SKIP_AUTH=true          force local mode
 *   REQUIRE_AUTH=true       force hosted login
 *   AUTH_SERVER_URL=…       enable hosted login against that server
 */

const PRODUCTION_AUTH_URL = 'https://www.sonicthinking.com';

function readBuildConfig() {
  try {
    return require('./build-config.json');
  } catch {
    return { hostedAuth: false };
  }
}

function envFlag(name) {
  const value = process.env[name];
  if (value == null) return undefined;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'true' || normalized === '1') return true;
  if (normalized === 'false' || normalized === '0') return false;
  return undefined;
}

function getAuthServerUrlFromEnv() {
  const url = process.env.AUTH_SERVER_URL || process.env.VITE_AUTH_SERVER_URL;
  return url && String(url).trim() ? String(url).trim() : '';
}

function isHostedAuthEnabled() {
  if (envFlag('SKIP_AUTH') === true) return false;
  if (envFlag('REQUIRE_AUTH') === false) return false;
  if (envFlag('REQUIRE_AUTH') === true) return true;
  if (getAuthServerUrlFromEnv()) return true;
  return readBuildConfig().hostedAuth === true;
}

function getWebAuthUrl() {
  return getAuthServerUrlFromEnv()
    || (isHostedAuthEnabled() ? PRODUCTION_AUTH_URL : '');
}

module.exports = {
  PRODUCTION_AUTH_URL,
  isHostedAuthEnabled,
  getWebAuthUrl,
};
