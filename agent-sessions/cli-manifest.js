const fs = require('fs');
const os = require('os');
const path = require('path');
const { listAvailableClis } = require('./cli-availability');

const DEFAULT_MANIFEST_PATH = path.join(__dirname, 'cli-manifest.json');

/**
 * @param {string} value
 * @returns {string}
 */
function expandHome(value) {
  if (!value || typeof value !== 'string') {
    return value;
  }
  if (value.startsWith('~/')) {
    return path.join(os.homedir(), value.slice(2));
  }
  if (value === '~') {
    return os.homedir();
  }
  return value;
}

/**
 * @returns {{ entries: Array<{ id: string; label?: string; binaries: string[]; hookConfig?: string; hookTemplate?: string }> }}
 */
function loadManifest() {
  const userPath = path.join(os.homedir(), '.buddy', 'cli-manifest.json');
  const paths = [userPath, DEFAULT_MANIFEST_PATH];

  for (const manifestPath of paths) {
    try {
      if (fs.existsSync(manifestPath)) {
        const parsed = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        if (Array.isArray(parsed.entries)) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn(`[AgentSessions] Failed to read manifest ${manifestPath}:`, error);
    }
  }

  return { entries: [] };
}

/**
 * @param {string} binary
 * @returns {{ id: string; label: string } | null}
 */
function resolveAgentFromBinary(binary) {
  const raw = String(binary || '').trim();
  // Accept absolute paths and Windows executables, not just bare names.
  const normalized = path.basename(raw, path.extname(raw)).toLowerCase();
  if (!normalized) {
    return null;
  }

  const manifest = loadManifest();
  for (const entry of manifest.entries) {
    for (const candidate of entry.binaries || []) {
      if (candidate.toLowerCase() === normalized) {
        return {
          id: entry.id,
          label: entry.label || entry.id,
        };
      }
    }
  }

  return null;
}

/**
 * @param {{ force?: boolean }} [options]
 * @returns {Promise<import('./cli-availability').AvailableCli[]>}
 */
async function listKnownClis(options = {}) {
  return listAvailableClis(options);
}

module.exports = {
  loadManifest,
  resolveAgentFromBinary,
  listKnownClis,
  expandHome,
};
