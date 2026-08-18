const fs = require('fs');
const path = require('path');
const { getGlobalCliRegistry } = require('./cli-global-registry');
const { KNOWN_AGENT_BINARIES } = require('./cli-auto-detect');

const CACHE_TTL_MS = 60 * 1000;

/** @type {{ expiresAt: number; executables: Map<string, string> } | null} */
let executableCache = null;

/**
 * Every executable reachable through PATH, keyed by lower-case base name.
 * Scanning the directories once is far cheaper than running `where`/`which`
 * for each of the dozens of discovered CLIs.
 * @returns {Map<string, string>}
 */
function scanPathExecutables() {
  const isWindows = process.platform === 'win32';
  const extensions = isWindows
    ? (process.env.PATHEXT || '.COM;.EXE;.BAT;.CMD;.PS1')
        .split(';')
        .map((ext) => ext.trim().toLowerCase())
        .filter(Boolean)
    : [];

  /** @type {Map<string, string>} */
  const found = new Map();

  for (const dir of String(process.env.PATH || '').split(path.delimiter)) {
    if (!dir) {
      continue;
    }

    let files;
    try {
      files = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const file of files) {
      if (file.isDirectory()) {
        continue;
      }
      const extension = path.extname(file.name).toLowerCase();
      if (isWindows && extension && !extensions.includes(extension)) {
        continue;
      }
      const baseName = path.basename(file.name, extension).toLowerCase();
      if (baseName && !found.has(baseName)) {
        found.set(baseName, path.join(dir, file.name));
      }
    }
  }

  return found;
}

/**
 * @param {boolean} force
 * @returns {Map<string, string>}
 */
function getPathExecutables(force = false) {
  const now = Date.now();
  if (!force && executableCache && executableCache.expiresAt > now) {
    return executableCache.executables;
  }
  const executables = scanPathExecutables();
  executableCache = { expiresAt: now + CACHE_TTL_MS, executables };
  return executables;
}

/**
 * @param {string} name
 * @returns {boolean}
 */
function isSpawnableName(name) {
  // Manifest binaries include package specifiers like "@google/gemini-cli",
  // which are not runnable; only bare names can be spawned.
  return Boolean(name) && !name.includes('/') && !name.includes('\\');
}

/**
 * @param {import('./cli-global-registry').GlobalCliEntry} entry
 * @param {Map<string, string>} executables
 * @param {Map<string, string>} [discovered] binary name -> command found via another entry
 * @returns {string | null} the command Buddy can actually spawn, if any
 */
function resolveLaunchCommand(entry, executables, discovered) {
  for (const name of entry.binaryNames) {
    if (isSpawnableName(name) && executables.has(name)) {
      return name;
    }
  }

  // A CLI found by scanning a bin directory may live outside PATH.
  if (entry.source === 'path') {
    for (const marker of entry.pathMarkers) {
      if (marker && fs.existsSync(marker)) {
        return marker;
      }
    }
  }

  // A manifest entry carries the canonical id and label but no file of its own,
  // so let it borrow the executable another entry located off-PATH.
  if (discovered) {
    for (const name of entry.binaryNames) {
      if (isSpawnableName(name) && discovered.has(name)) {
        return discovered.get(name);
      }
    }
  }

  return null;
}

/**
 * @typedef {Object} AvailableCli
 * @property {string} id
 * @property {string} label
 * @property {string} command
 * @property {boolean} installed
 * @property {boolean} knownAgent
 * @property {string} source
 */

/**
 * Manifest entries win: their id matches what process detection reports, so a
 * launched session and a detected one collapse into a single row on the phone.
 * @param {AvailableCli} cli
 * @returns {number}
 */
function preferenceRank(cli) {
  return (cli.source === 'manifest' ? 4 : 0) + (cli.knownAgent ? 2 : 0);
}

/**
 * @param {AvailableCli} existing
 * @param {AvailableCli} candidate
 * @returns {AvailableCli}
 */
function mergeCandidates(existing, candidate) {
  return {
    ...candidate,
    // A bare name is launchable from any shell; keep it over an absolute path.
    command: candidate.command.includes(path.sep) ? existing.command : candidate.command,
  };
}

/**
 * Always-available interactive shell so the phone can launch a real terminal
 * without installing an agent CLI.
 * @returns {AvailableCli}
 */
function builtinTerminalCli() {
  const win = process.platform === 'win32';
  return {
    id: 'terminal',
    label: 'Terminal',
    command: win ? 'powershell.exe' : process.env.SHELL || 'bash',
    installed: true,
    knownAgent: true,
    source: 'builtin',
  };
}

/**
 * Every CLI Buddy can launch, newest scan at most a minute old.
 * @param {{ force?: boolean }} [options]
 * @returns {Promise<AvailableCli[]>}
 */
async function listAvailableClis(options = {}) {
  const force = options.force === true;
  const registry = await getGlobalCliRegistry({ force });
  const executables = getPathExecutables(force);

  // Locate every executable first, so a manifest entry whose binary sits outside
  // PATH can still resolve through the entry that found it on disk.
  /** @type {Map<string, string>} */
  const discovered = new Map();
  for (const entry of registry) {
    const command = resolveLaunchCommand(entry, executables);
    if (!command) {
      continue;
    }
    for (const name of entry.binaryNames) {
      if (isSpawnableName(name) && !discovered.has(name)) {
        discovered.set(name, command);
      }
    }
  }

  // One entry per real executable: the registry lists the same CLI several times
  // (manifest id, npm package name, PATH file) and the phone should show it once.
  /** @type {Map<string, AvailableCli>} */
  const byExecutable = new Map();

  for (const entry of registry) {
    const command = resolveLaunchCommand(entry, executables, discovered);
    if (!command) {
      continue;
    }

    const candidate = {
      id: entry.id,
      label: entry.label || entry.id,
      command,
      installed: true,
      knownAgent:
        KNOWN_AGENT_BINARIES.has(entry.id.toLowerCase()) ||
        entry.binaryNames.some((name) => KNOWN_AGENT_BINARIES.has(name)) ||
        entry.source === 'manifest',
      source: entry.source,
    };

    const key = path.basename(command, path.extname(command)).toLowerCase();
    const existing = byExecutable.get(key);
    if (!existing || preferenceRank(candidate) > preferenceRank(existing)) {
      byExecutable.set(key, existing ? mergeCandidates(existing, candidate) : candidate);
    }
  }

  // Recognised agents first so the phone shows the useful ones without scrolling.
  const list = Array.from(byExecutable.values())
    .filter((cli) => cli.id !== 'terminal')
    .sort((a, b) => {
      if (a.knownAgent !== b.knownAgent) {
        return a.knownAgent ? -1 : 1;
      }
      return a.label.localeCompare(b.label);
    });

  return [builtinTerminalCli(), ...list];
}

function clearCliAvailabilityCache() {
  executableCache = null;
}

module.exports = {
  listAvailableClis,
  clearCliAvailabilityCache,
  builtinTerminalCli,
};
