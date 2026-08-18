/**
 * Global agent CLI shim installer.
 *
 * Puts thin wrappers in ~/.buddy/bin (prepended to user PATH) so commands like
 * `claude`, `codex`, `gemini`, `opencode`, `aider` always start as Buddy-managed
 * PTY sessions (visible + controllable on the phone). No per-CLI plugins needed.
 *
 * Loop-safe: shims store the real binary path and Buddy spawns that absolute path.
 * Offline-safe: if Buddy socket is down, shim falls through to the real binary.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile, spawnSync } = require('child_process');
const { promisify } = require('util');
const { loadManifest } = require('./cli-manifest');

const execFileAsync = promisify(execFile);

const BUDDY_HOME = path.join(os.homedir(), '.buddy');
const SHIM_BIN_DIR = path.join(BUDDY_HOME, 'bin');
const SHIM_MANIFEST_PATH = path.join(BUDDY_HOME, 'shims.json');
const SHIM_RUNNER_NAME = 'buddy-shim-runner.js';
const BUDDY_RUN_COPY_NAME = 'buddy-run.js';

/** Prefer short agent CLI names from the manifest; skip path-marker junk. */
function collectShimTargets() {
  /** @type {Map<string, { name: string; agentId: string; label: string }>} */
  const targets = new Map();
  const manifest = loadManifest();

  for (const entry of manifest.entries || []) {
    const agentId = String(entry.id || '').trim();
    const label = String(entry.label || agentId || 'Agent');
    for (const binary of entry.binaries || []) {
      const name = String(binary || '').trim();
      // Skip package path markers like @google/gemini-cli or nested js paths.
      if (!name || name.includes('/') || name.includes('\\') || name.endsWith('.js')) {
        continue;
      }
      const key = name.toLowerCase();
      if (!targets.has(key)) {
        targets.set(key, { name, agentId, label });
      }
    }
  }

  return [...targets.values()];
}

/**
 * @returns {string}
 */
function resolveBuddyRunSource() {
  return path.join(__dirname, '..', 'scripts', 'buddy-run.js');
}

/**
 * @returns {Promise<string|null>}
 */
function resolveNodeBinary() {
  return new Promise((resolve) => {
    const finder = process.platform === 'win32' ? 'where' : 'which';
    execFile(finder, ['node'], { timeout: 5000 }, (error, stdout) => {
      if (error) {
        resolve(process.execPath && !process.execPath.toLowerCase().includes('electron')
          ? process.execPath
          : null);
        return;
      }
      const first = String(stdout || '')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find((line) => line.length > 0);
      resolve(first || null);
    });
  });
}

/**
 * Resolve the real on-disk binary, skipping our own shim directory.
 * @param {string} commandName
 * @returns {Promise<string|null>}
 */
async function resolveRealBinary(commandName) {
  const finder = process.platform === 'win32' ? 'where' : 'which';
  const shimDirNormalized = path.normalize(SHIM_BIN_DIR).toLowerCase();

  try {
    const { stdout } = await execFileAsync(finder, [commandName], { timeout: 5000 });
    const candidates = String(stdout || '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    /** @type {string[]} */
    const usable = [];
    for (const candidate of candidates) {
      const normalized = path.normalize(candidate).toLowerCase();
      if (normalized.startsWith(shimDirNormalized + path.sep) || normalized === shimDirNormalized) {
        continue;
      }
      const base = path.basename(candidate).toLowerCase();
      if (base === 'buddy-shim-runner.js' || base === 'buddy-run.js') {
        continue;
      }
      if (fs.existsSync(candidate)) {
        usable.push(candidate);
      }
    }

    if (process.platform === 'win32') {
      // Prefer .cmd/.exe/.bat — npm also drops extensionless POSIX shims that PowerShell can't run.
      const preferred = usable.find((c) => /\.(cmd|exe|bat)$/i.test(c));
      if (preferred) return preferred;
    }

    return usable[0] || null;
  } catch {
    // not found
  }

  return null;
}

/**
 * @returns {Record<string, any>}
 */
function readShimManifest() {
  try {
    const raw = fs.readFileSync(SHIM_MANIFEST_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * @param {Record<string, any>} data
 */
function writeShimManifest(data) {
  fs.mkdirSync(BUDDY_HOME, { recursive: true });
  fs.writeFileSync(SHIM_MANIFEST_PATH, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

/**
 * Ensure ~/.buddy/bin is first on the user PATH.
 * @returns {{ changed: boolean; path: string; error?: string }}
 */
function ensureShimDirOnUserPath() {
  const binDir = SHIM_BIN_DIR;

  // Always expose to this process and its children (Electron PTY, etc.).
  const currentParts = String(process.env.PATH || '')
    .split(path.delimiter)
    .filter(Boolean);
  if (!currentParts.some((p) => path.normalize(p) === path.normalize(binDir))) {
    process.env.PATH = [binDir, ...currentParts].join(path.delimiter);
  }

  if (process.platform === 'win32') {
    try {
      const ps = `
$ErrorActionPreference = 'Stop'
$bin = ${JSON.stringify(binDir)}
$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
if ($null -eq $userPath) { $userPath = '' }
$parts = @($userPath -split ';' | Where-Object { $_ -and $_.Trim() -ne '' })
$normalizedBin = [IO.Path]::GetFullPath($bin)
$filtered = @()
foreach ($p in $parts) {
  try {
    if ([IO.Path]::GetFullPath($p) -ne $normalizedBin) { $filtered += $p }
  } catch {
    if ($p -ne $bin) { $filtered += $p }
  }
}
$next = (@($normalizedBin) + $filtered) -join ';'
if ($next -cne $userPath) {
  [Environment]::SetEnvironmentVariable('Path', $next, 'User')
  'CHANGED'
} else {
  'OK'
}
`;
      const result = spawnSync(
        'powershell.exe',
        ['-NoLogo', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', ps],
        { encoding: 'utf8', windowsHide: true, timeout: 45_000 },
      );
      if (result.error) {
        return { changed: false, path: binDir, error: result.error.message };
      }
      if (result.status !== 0) {
        return {
          changed: false,
          path: binDir,
          error: (result.stderr || result.stdout || `exit ${result.status}`).toString().trim(),
        };
      }
      const status = String(result.stdout || '')
        .split(/\r?\n/)
        .map((l) => l.trim())
        .find(Boolean);
      return { changed: status === 'CHANGED', path: binDir };
    } catch (error) {
      return {
        changed: false,
        path: binDir,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // macOS / Linux — append export to shell rc files if missing.
  const exportLine = `export PATH="${binDir}:$PATH" # buddy-agent-shims`;
  const rcFiles = [
    path.join(os.homedir(), '.zshrc'),
    path.join(os.homedir(), '.bashrc'),
    path.join(os.homedir(), '.profile'),
  ];
  let changed = false;
  for (const rc of rcFiles) {
    try {
      const exists = fs.existsSync(rc);
      const current = exists ? fs.readFileSync(rc, 'utf8') : '';
      if (current.includes('buddy-agent-shims')) {
        continue;
      }
      const next = `${current}${current.endsWith('\n') || !current ? '' : '\n'}\n${exportLine}\n`;
      fs.writeFileSync(rc, next, 'utf8');
      changed = true;
    } catch {
      // ignore individual rc failures
    }
  }

  return { changed, path: binDir };
}

/**
 * @param {string} nodeBinary
 * @param {string} runnerPath
 * @param {string} commandName
 * @returns {{ unix: string; cmd: string }}
 */
function buildShimScripts(nodeBinary, runnerPath, commandName) {
  // Always call the runner; it bypasses to the real binary when BUDDY_SESSION_ID is set.
  const unix = `#!/usr/bin/env bash
# Buddy global agent shim — do not edit.
# Routes ${commandName} through Buddy managed PTY (phone Agents tab).
exec ${JSON.stringify(nodeBinary)} ${JSON.stringify(runnerPath)} ${JSON.stringify(commandName)} "$@"
`;

  const cmd = `@echo off
REM Buddy global agent shim — do not edit.
"${nodeBinary}" "${runnerPath}" ${commandName} %*
`;

  return { unix, cmd };
}

/**
 * Copy runner + buddy-run into ~/.buddy/bin so shims work after app moves.
 */
function syncRunnerFiles(nodeBinary) {
  fs.mkdirSync(SHIM_BIN_DIR, { recursive: true });

  const buddyRunSource = resolveBuddyRunSource();
  const buddyRunTarget = path.join(SHIM_BIN_DIR, BUDDY_RUN_COPY_NAME);
  const runnerTarget = path.join(SHIM_BIN_DIR, SHIM_RUNNER_NAME);
  const runnerSource = path.join(__dirname, 'shim-runner.js');

  if (!fs.existsSync(buddyRunSource)) {
    throw new Error(`buddy-run.js not found at ${buddyRunSource}`);
  }
  if (!fs.existsSync(runnerSource)) {
    throw new Error(`shim-runner.js not found at ${runnerSource}`);
  }

  fs.copyFileSync(buddyRunSource, buddyRunTarget);
  fs.copyFileSync(runnerSource, runnerTarget);

  return {
    nodeBinary,
    buddyRunPath: buddyRunTarget,
    runnerPath: runnerTarget,
  };
}

/**
 * Install shims for all known agent CLIs that resolve on PATH.
 * @param {{ force?: boolean }} [options]
 */
async function installAgentShims(options = {}) {
  const nodeBinary = (await resolveNodeBinary()) || process.execPath;
  const { buddyRunPath, runnerPath } = syncRunnerFiles(nodeBinary);
  const targets = collectShimTargets();
  /** @type {Record<string, any>} */
  const shims = {};
  /** @type {Array<{ name: string; agentId: string; realPath: string; ok: boolean; error?: string }>} */
  const results = [];

  for (const target of targets) {
    try {
      const realPath = await resolveRealBinary(target.name);
      if (!realPath) {
        results.push({
          name: target.name,
          agentId: target.agentId,
          realPath: '',
          ok: false,
          error: 'binary_not_found',
        });
        continue;
      }

      // Don't shim if the "real" binary is already somehow our runner.
      if (path.normalize(realPath).toLowerCase().includes(path.normalize(SHIM_BIN_DIR).toLowerCase())) {
        results.push({
          name: target.name,
          agentId: target.agentId,
          realPath,
          ok: false,
          error: 'resolved_to_shim_dir',
        });
        continue;
      }

      const scripts = buildShimScripts(nodeBinary, runnerPath, target.name);
      const unixPath = path.join(SHIM_BIN_DIR, target.name);
      const cmdPath = path.join(SHIM_BIN_DIR, `${target.name}.cmd`);

      fs.writeFileSync(unixPath, scripts.unix.replace(/\r\n/g, '\n'), 'utf8');
      try {
        fs.chmodSync(unixPath, 0o755);
      } catch {
        // Windows may not support chmod; fine.
      }
      fs.writeFileSync(cmdPath, scripts.cmd.replace(/\n/g, '\r\n'), 'utf8');

      shims[target.name] = {
        agentId: target.agentId,
        label: target.label,
        realPath,
        installedAt: new Date().toISOString(),
      };
      results.push({
        name: target.name,
        agentId: target.agentId,
        realPath,
        ok: true,
      });
    } catch (error) {
      results.push({
        name: target.name,
        agentId: target.agentId,
        realPath: '',
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const pathResult = ensureShimDirOnUserPath();

  writeShimManifest({
    version: 1,
    updatedAt: new Date().toISOString(),
    nodeBinary,
    buddyRunPath,
    runnerPath,
    binDir: SHIM_BIN_DIR,
    pathPrepended: true,
    pathChanged: pathResult.changed,
    pathError: pathResult.error || null,
    shims,
    force: Boolean(options.force),
  });

  const installed = results.filter((r) => r.ok);
  let note = 'Shims ready.';
  if (pathResult.error) {
    note = `Shims written, but PATH update failed (${pathResult.error}). Add ${SHIM_BIN_DIR} to your user PATH manually, then open a new terminal.`;
  } else if (pathResult.changed) {
    note = 'Open a new terminal so PATH picks up ~/.buddy/bin';
  } else {
    note = 'PATH already includes ~/.buddy/bin (open a new terminal if commands are not found yet)';
  }

  return {
    success: true,
    binDir: SHIM_BIN_DIR,
    pathChanged: pathResult.changed,
    pathError: pathResult.error,
    installedCount: installed.length,
    skippedCount: results.length - installed.length,
    results,
    note,
  };
}

/**
 * Remove shim wrappers and optionally leave PATH entry (safe default: keep PATH).
 * @param {{ removeFromPath?: boolean }} [options]
 */
function uninstallAgentShims(options = {}) {
  const manifest = readShimManifest();
  const shims = manifest.shims && typeof manifest.shims === 'object' ? manifest.shims : {};
  const removed = [];

  for (const name of Object.keys(shims)) {
    for (const file of [path.join(SHIM_BIN_DIR, name), path.join(SHIM_BIN_DIR, `${name}.cmd`)]) {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
          removed.push(file);
        }
      } catch {
        // ignore
      }
    }
  }

  try {
    fs.unlinkSync(SHIM_MANIFEST_PATH);
  } catch {
    // ignore
  }

  if (options.removeFromPath) {
    // Best-effort; leaving PATH entry pointing at empty dir is harmless.
  }

  return {
    success: true,
    removedCount: removed.length,
    removed,
    binDir: SHIM_BIN_DIR,
  };
}

/**
 * @returns {{ installed: boolean; binDir: string; shims: Record<string, any>; pathReady: boolean }}
 */
function getShimStatus() {
  const manifest = readShimManifest();
  const shims = manifest.shims && typeof manifest.shims === 'object' ? manifest.shims : {};
  const pathParts = String(process.env.PATH || '')
    .split(path.delimiter)
    .map((p) => path.normalize(p));
  let pathReady = pathParts.some((p) => p === path.normalize(SHIM_BIN_DIR));

  if (!pathReady && process.platform === 'win32') {
    try {
      const result = spawnSync(
        'powershell.exe',
        [
          '-NoLogo',
          '-NoProfile',
          '-Command',
          `[Environment]::GetEnvironmentVariable('Path','User')`,
        ],
        { encoding: 'utf8', windowsHide: true, timeout: 10_000 },
      );
      const userPath = String(result.stdout || '');
      pathReady = userPath
        .split(';')
        .map((p) => path.normalize(p.trim()))
        .some((p) => p === path.normalize(SHIM_BIN_DIR));
    } catch {
      // ignore
    }
  }

  return {
    installed: Object.keys(shims).length > 0 && fs.existsSync(SHIM_BIN_DIR),
    binDir: SHIM_BIN_DIR,
    shims,
    pathReady,
    updatedAt: manifest.updatedAt || null,
  };
}

/**
 * Look up real binary for a shim name (used by runner --print-real).
 * @param {string} commandName
 * @returns {string|null}
 */
function getRealPathForShim(commandName) {
  const manifest = readShimManifest();
  const entry = manifest.shims?.[commandName];
  if (entry?.realPath && fs.existsSync(entry.realPath)) {
    return entry.realPath;
  }
  return null;
}

module.exports = {
  BUDDY_HOME,
  SHIM_BIN_DIR,
  SHIM_MANIFEST_PATH,
  collectShimTargets,
  installAgentShims,
  uninstallAgentShims,
  getShimStatus,
  getRealPathForShim,
  readShimManifest,
  resolveRealBinary,
  ensureShimDirOnUserPath,
};
