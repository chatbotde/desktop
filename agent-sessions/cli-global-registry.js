const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { slugToLabel, agentIdFromPackageName } = require('./cli-auto-detect');

const execFileAsync = promisify(execFile);

const CACHE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_MANIFEST_PATH = path.join(__dirname, 'cli-manifest.json');

const EXCLUDED_PATH_BINARIES = new Set([
  'npm',
  'npx',
  'pnpm',
  'pnpx',
  'yarn',
  'node',
  'electron',
  'python',
  'python3',
  'code',
  'git',
]);

const EXCLUDED_GLOBAL_PACKAGES = new Set([
  'npm',
  'pnpm',
  'electron',
  'typescript',
  'eslint',
  'prettier',
  'webpack',
  'vite',
  'jest',
  'playwright',
  'corepack',
  'yarn',
  '@react-native-community/cli',
  'react-native',
]);

/** @type {{ expiresAt: number; entries: GlobalCliEntry[] } | null} */
let cache = null;
/** @type {Promise<GlobalCliEntry[]> | null} */
let scanPromise = null;

/**
 * @typedef {Object} GlobalCliEntry
 * @property {string} id
 * @property {string} label
 * @property {string} command
 * @property {string} packageName
 * @property {string[]} binaryNames
 * @property {string[]} pathMarkers
 * @property {'npm-global' | 'path' | 'manifest'} source
 */

/**
 * @param {string} dir
 * @returns {string[]}
 */
function listDirectoryNames(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      if (!entry.isDirectory()) {
        return [];
      }
      if (entry.name.startsWith('.')) {
        return [];
      }
      return [entry.name];
    });
  } catch {
    return [];
  }
}

/**
 * @param {string} packageJsonPath
 * @returns {Record<string, unknown> | null}
 */
function readPackageJson(packageJsonPath) {
  try {
    return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * @param {string} packageName
 * @returns {boolean}
 */
function isExcludedGlobalPackage(packageName) {
  const normalized = String(packageName || '').toLowerCase();
  if (!normalized || EXCLUDED_GLOBAL_PACKAGES.has(normalized)) {
    return true;
  }

  const baseName = normalized.includes('/') ? normalized.split('/').pop() || normalized : normalized;
  if (EXCLUDED_GLOBAL_PACKAGES.has(baseName) || EXCLUDED_PATH_BINARIES.has(baseName)) {
    return true;
  }

  return false;
}

/**
 * @param {string} packageName
 * @param {string} packageDir
 * @param {Record<string, unknown>} pkg
 * @returns {GlobalCliEntry | null}
 */
function entryFromPackageJson(packageName, packageDir, pkg) {
  if (isExcludedGlobalPackage(packageName)) {
    return null;
  }
  const binField = pkg.bin;
  /** @type {string[]} */
  const binaryNames = [];

  if (typeof binField === 'string') {
    binaryNames.push(path.basename(binField, path.extname(binField)));
  } else if (binField && typeof binField === 'object') {
    for (const value of Object.values(binField)) {
      if (typeof value === 'string') {
        binaryNames.push(path.basename(value, path.extname(value)));
      }
    }
    for (const key of Object.keys(binField)) {
      binaryNames.push(String(key).toLowerCase());
    }
  }

  if (binaryNames.length === 0) {
    return null;
  }

  const normalizedPackageDir = packageDir.replace(/\\/g, '/').toLowerCase();
  const id = agentIdFromPackageName(packageName);
  const label = slugToLabel(id);

  return {
    id,
    label,
    command: binaryNames[0],
    packageName,
    binaryNames: [...new Set(binaryNames.map((name) => name.toLowerCase()).filter(Boolean))],
    pathMarkers: [normalizedPackageDir, `${normalizedPackageDir}/`],
    source: 'npm-global',
  };
}

/**
 * @param {string} globalRoot
 * @returns {GlobalCliEntry[]}
 */
function scanNpmGlobalTree(globalRoot) {
  /** @type {GlobalCliEntry[]} */
  const entries = [];
  /** @type {Map<string, GlobalCliEntry>} */
  const byId = new Map();

  for (const topLevel of listDirectoryNames(globalRoot)) {
    if (topLevel.startsWith('@')) {
      const scopeDir = path.join(globalRoot, topLevel);
      for (const scopedName of listDirectoryNames(scopeDir)) {
        const packageName = `${topLevel}/${scopedName}`;
        const packageDir = path.join(scopeDir, scopedName);
        const pkg = readPackageJson(path.join(packageDir, 'package.json'));
        if (!pkg) {
          continue;
        }
        const entry = entryFromPackageJson(packageName, packageDir, pkg);
        if (entry) {
          byId.set(entry.id, entry);
        }
      }
      continue;
    }

    const packageName = topLevel;
    const packageDir = path.join(globalRoot, topLevel);
    const pkg = readPackageJson(path.join(packageDir, 'package.json'));
    if (!pkg) {
      continue;
    }
    const entry = entryFromPackageJson(packageName, packageDir, pkg);
    if (entry) {
      byId.set(entry.id, entry);
    }
  }

  entries.push(...byId.values());
  return entries;
}

/**
 * @param {string} binDir
 * @returns {GlobalCliEntry[]}
 */
function scanPathBinDirectory(binDir) {
  /** @type {GlobalCliEntry[]} */
  const entries = [];
  /** @type {Map<string, GlobalCliEntry>} */
  const byId = new Map();

  let files = [];
  try {
    files = fs.readdirSync(binDir, { withFileTypes: true });
  } catch {
    return entries;
  }

  for (const file of files) {
    if (!file.isFile()) {
      continue;
    }

    const baseName = file.name.replace(/\.(exe|cmd|bat|ps1)$/i, '').toLowerCase();
    if (
      !baseName ||
      baseName.startsWith('.') ||
      EXCLUDED_PATH_BINARIES.has(baseName) ||
      baseName.startsWith('python')
    ) {
      continue;
    }

    const fullPath = path.join(binDir, file.name).replace(/\\/g, '/').toLowerCase();
    if (byId.has(baseName)) {
      continue;
    }

    byId.set(baseName, {
      id: baseName,
      label: slugToLabel(baseName),
      command: baseName,
      packageName: baseName,
      binaryNames: [baseName],
      pathMarkers: [fullPath],
      source: 'path',
    });
  }

  entries.push(...byId.values());
  return entries;
}

/**
 * @returns {{ entries: Array<{ id: string; label?: string; binaries: string[] }> }}
 */
function loadManifestEntries() {
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
    } catch {
      // try next path
    }
  }

  return { entries: [] };
}

/**
 * @returns {Promise<string>}
 */
async function getNpmGlobalRoot() {
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  try {
    const { stdout } = await execFileAsync(npmCmd, ['root', '-g'], {
      windowsHide: true,
      timeout: 15_000,
    });
    return stdout.trim();
  } catch {
    if (process.platform === 'win32') {
      const fallback = path.join(os.homedir(), 'AppData', 'Roaming', 'npm', 'node_modules');
      if (fs.existsSync(fallback)) {
        return fallback;
      }
    }
    return '';
  }
}

/**
 * @returns {Promise<string>}
 */
async function getNpmGlobalBin() {
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  try {
    const { stdout } = await execFileAsync(npmCmd, ['bin', '-g'], {
      windowsHide: true,
      timeout: 15_000,
    });
    return stdout.trim();
  } catch {
    if (process.platform === 'win32') {
      const fallback = path.join(os.homedir(), 'AppData', 'Roaming', 'npm');
      if (fs.existsSync(fallback)) {
        return fallback;
      }
    }
    return '';
  }
}

/**
 * @returns {GlobalCliEntry[]}
 */
function entriesFromManifest() {
  const manifest = loadManifestEntries();
  /** @type {GlobalCliEntry[]} */
  const entries = [];

  for (const item of manifest.entries || []) {
    const binaryNames = (item.binaries || []).map((binary) => binary.toLowerCase()).filter(Boolean);
    if (binaryNames.length === 0) {
      continue;
    }

    entries.push({
      id: item.id,
      label: item.label || item.id,
      command: binaryNames[0],
      packageName: item.id,
      binaryNames,
      pathMarkers: binaryNames,
      source: 'manifest',
    });
  }

  return entries;
}

/**
 * @param {GlobalCliEntry[]} entries
 * @returns {GlobalCliEntry[]}
 */
function mergeGlobalCliEntries(entries) {
  /** @type {Map<string, GlobalCliEntry>} */
  const merged = new Map();

  for (const entry of entries) {
    const existing = merged.get(entry.id);
    if (!existing) {
      merged.set(entry.id, {
        ...entry,
        binaryNames: [...entry.binaryNames],
        pathMarkers: [...entry.pathMarkers],
      });
      continue;
    }

    merged.set(entry.id, {
      ...existing,
      label: existing.source === 'manifest' ? existing.label : entry.label || existing.label,
      command: existing.command || entry.command,
      packageName: existing.packageName || entry.packageName,
      binaryNames: [...new Set([...existing.binaryNames, ...entry.binaryNames])],
      pathMarkers: [...new Set([...existing.pathMarkers, ...entry.pathMarkers])],
      source: existing.source === 'manifest' ? 'manifest' : entry.source,
    });
  }

  return Array.from(merged.values()).sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * @returns {Promise<GlobalCliEntry[]>}
 */
async function scanGlobalClis() {
  /** @type {GlobalCliEntry[]} */
  const collected = [...entriesFromManifest()];

  try {
    const [globalRoot, globalBin] = await Promise.all([getNpmGlobalRoot(), getNpmGlobalBin()]);
    if (globalRoot && fs.existsSync(globalRoot)) {
      collected.push(...scanNpmGlobalTree(globalRoot));
    }
    if (globalBin && fs.existsSync(globalBin)) {
      collected.push(...scanPathBinDirectory(globalBin));
    }
  } catch (error) {
    console.warn('[AgentSessions] npm global CLI scan failed:', error);
  }

  const userNpmBin = path.join(os.homedir(), 'AppData', 'Roaming', 'npm');
  if (process.platform === 'win32' && fs.existsSync(userNpmBin)) {
    collected.push(...scanPathBinDirectory(userNpmBin));
  }

  const userNpmModules = path.join(userNpmBin, 'node_modules');
  if (process.platform === 'win32' && fs.existsSync(userNpmModules)) {
    collected.push(...scanNpmGlobalTree(userNpmModules));
  }

  const localBin = path.join(os.homedir(), '.local', 'bin');
  if (fs.existsSync(localBin)) {
    collected.push(...scanPathBinDirectory(localBin));
  }

  return mergeGlobalCliEntries(collected);
}

/**
 * @param {{ force?: boolean }} [options]
 * @returns {Promise<GlobalCliEntry[]>}
 */
async function getGlobalCliRegistry(options = {}) {
  const force = options.force === true;
  const now = Date.now();

  if (!force && cache && cache.expiresAt > now) {
    return cache.entries;
  }

  if (!force && scanPromise) {
    return scanPromise;
  }

  scanPromise = scanGlobalClis()
    .then((entries) => {
      cache = {
        expiresAt: Date.now() + CACHE_TTL_MS,
        entries,
      };
      return entries;
    })
    .finally(() => {
      scanPromise = null;
    });

  return scanPromise;
}

/**
 * @param {GlobalCliEntry[]} registry
 * @returns {{ byBinary: Map<string, GlobalCliEntry>; byPathMarker: GlobalCliEntry[] }}
 */
function buildGlobalCliIndexes(registry) {
  /** @type {Map<string, GlobalCliEntry>} */
  const byBinary = new Map();

  for (const entry of registry) {
    for (const binaryName of entry.binaryNames) {
      if (!byBinary.has(binaryName)) {
        byBinary.set(binaryName, entry);
      }
    }
  }

  return {
    byBinary,
    byPathMarker: registry,
  };
}

function clearGlobalCliCache() {
  cache = null;
  scanPromise = null;
}

module.exports = {
  getGlobalCliRegistry,
  scanGlobalClis,
  buildGlobalCliIndexes,
  clearGlobalCliCache,
};
