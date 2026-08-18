const path = require('path');

const IGNORE_COMMAND_MARKERS = [
  'buddy-run',
  'agent-sessions',
  'process-watcher',
  'cli-auto-detect',
  // Buddy's own bridge processes. Without these the Gemini bridge daemon is
  // detected as a Gemini CLI, which spawns another daemon, and so on.
  'buddy-bridge',
  'bridge-daemon',
  'gemini-bridge',
  'opencode-buddy-bridge',
  'inject-input',
  'npm run agent:run',
  'npm run dev',
  'npm test',
  'concurrently',
  'wait-on',
  'electron-builder',
  'electron .',
  'vite',
  'webpack',
  'esbuild',
  'rollup',
  'tsc -p',
  'jest',
  'playwright',
  'mocha',
  'vitest',
];

const IGNORE_PATH_MARKERS = [
  'node_modules/electron/',
  'node_modules/vite/',
  'node_modules/webpack/',
  'node_modules/typescript/',
  'node_modules/jest/',
  'node_modules/playwright/',
  'node_modules/vitest/',
  'node_modules/eslint/',
  'node_modules/prettier/',
  '/buddy/frontend/',
  '\\buddy\\frontend\\',
  '/interface-window/',
  '\\interface-window\\',
];

const SHELL_PROCESS_NAMES = new Set([
  'node',
  'node.exe',
  'python',
  'python.exe',
  'python3',
  'ruby',
  'bash',
  'sh',
  'zsh',
  'fish',
  'cmd',
  'cmd.exe',
  'powershell',
  'powershell.exe',
  'pwsh',
  'pwsh.exe',
]);

const KNOWN_AGENT_BINARIES = new Set([
  'opencode',
  'claude',
  'codex',
  'gemini',
  'cursor-agent',
  'aider',
  'crush',
  'goose',
  'amp',
  'kilocode',
  'copilot',
  'windsurf',
]);

const EXCLUDED_PACKAGE_NAMES = new Set([
  'vue-cli',
  'create-react-app',
  '@angular/cli',
  'typescript',
  'eslint',
  'prettier',
  'webpack',
  'vite',
  'jest',
  'playwright',
]);

/**
 * @param {string} slug
 * @returns {string}
 */
function slugToLabel(slug) {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * @param {string} commandLine
 * @returns {string}
 */
function normalizeCommandLine(commandLine) {
  return String(commandLine || '').replace(/\\/g, '/').toLowerCase();
}

/**
 * @param {string} commandLine
 * @returns {boolean}
 */
function shouldIgnoreCommandLine(commandLine) {
  const normalized = normalizeCommandLine(commandLine);
  if (!normalized.trim()) {
    return true;
  }
  return (
    IGNORE_COMMAND_MARKERS.some((marker) => normalized.includes(marker)) ||
    IGNORE_PATH_MARKERS.some((marker) => normalized.includes(marker.replace(/\\/g, '/')))
  );
}

/**
 * A bare binary name must appear as its own path segment or argument. Plain
 * substring matching made "gemini" match `~/.gemini/...` and `--model gemini-pro`,
 * so unrelated processes were filed under the Gemini CLI.
 * @param {string} commandLine
 * @param {string} token
 * @returns {boolean}
 */
function matchTokenInCommandLine(commandLine, token) {
  const haystack = normalizeCommandLine(commandLine);
  const needle = String(token || '').replace(/\\/g, '/').toLowerCase();
  if (!needle) {
    return false;
  }

  // Tokens that already carry path context are specific enough to match raw.
  if (needle.includes('/')) {
    return haystack.includes(needle);
  }

  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[\\s/"'])${escaped}(\\.\\w+)?($|[\\s"'])`).test(haystack);
}

/**
 * @param {{ pid: number; name: string; commandLine: string }} proc
 * @param {{ id: string; label?: string; binaries: string[] }} entry
 * @returns {boolean}
 */
function matchesManifestEntry(proc, entry) {
  const name = proc.name.toLowerCase();

  if (shouldIgnoreCommandLine(proc.commandLine)) {
    return false;
  }

  for (const binary of entry.binaries || []) {
    const token = binary.toLowerCase();
    if (!token) {
      continue;
    }
    if (name === `${token}.exe` || name === token) {
      return true;
    }
    if (matchTokenInCommandLine(proc.commandLine, binary)) {
      return true;
    }
  }

  return false;
}

/**
 * @param {{ pid: number; name: string; commandLine: string }} proc
 * @param {{ byBinary: Map<string, import('./cli-global-registry').GlobalCliEntry>; byPathMarker: import('./cli-global-registry').GlobalCliEntry[] }} indexes
 * @returns {{ agentId: string; label: string } | null}
 */
function detectFromGlobalRegistry(proc, indexes) {
  if (!indexes) {
    return null;
  }

  const baseName = path.basename(proc.name, path.extname(proc.name)).toLowerCase();
  const normalizedCommand = normalizeCommandLine(proc.commandLine);

  const byName = indexes.byBinary.get(baseName);
  if (byName) {
    return {
      agentId: byName.id,
      label: byName.label,
    };
  }

  for (const entry of indexes.byPathMarker) {
    const matched = entry.pathMarkers.some((marker) => {
      const token = String(marker || '').replace(/\\/g, '/').toLowerCase();
      return token && normalizedCommand.includes(token);
    });
    if (matched) {
      return {
        agentId: entry.id,
        label: entry.label,
      };
    }
  }

  return null;
}

/**
 * @param {string} packageName
 * @returns {boolean}
 */
function isAgentPackageName(packageName) {
  const normalized = String(packageName || '').toLowerCase();
  if (!normalized || EXCLUDED_PACKAGE_NAMES.has(normalized)) {
    return false;
  }

  const baseName = normalized.includes('/') ? normalized.split('/').pop() || normalized : normalized;

  if (KNOWN_AGENT_BINARIES.has(baseName)) {
    return true;
  }
  if (baseName.endsWith('-cli') || baseName.endsWith('-agent')) {
    return true;
  }
  if (baseName.includes('claude') || baseName.includes('codex') || baseName.includes('opencode')) {
    return true;
  }

  return false;
}

/**
 * @param {string} packageName
 * @returns {string}
 */
function agentIdFromPackageName(packageName) {
  const normalized = String(packageName || '').trim();
  if (normalized.startsWith('@')) {
    const parts = normalized.split('/');
    return parts[parts.length - 1] || normalized.replace(/^@/, '');
  }
  return normalized;
}

/**
 * @param {string} packageName
 * @returns {{ agentId: string; label: string }}
 */
function identityFromPackageName(packageName) {
  const agentId = agentIdFromPackageName(packageName);
  return {
    agentId,
    label: slugToLabel(agentId),
  };
}

/**
 * @param {string} commandLine
 * @returns {{ agentId: string; label: string } | null}
 */
function detectFromNodePackage(commandLine) {
  const normalized = normalizeCommandLine(commandLine);

  const patterns = [
    /node_modules\/(@[^/]+\/[^/\s"']+?)\/(?:dist\/|bin\/|cli\.js|index\.js)/i,
    /node_modules\/([^/\s"']+?(?:-cli|-agent))\/(?:dist\/|bin\/|cli\.js|index\.js)/i,
    /\/npm\/node_modules\/(@[^/]+\/[^/\s"']+?)\//i,
    /\/npm\/node_modules\/([^/\s"']+?(?:-cli|-agent))\//i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (!match?.[1]) {
      continue;
    }
    const packageName = match[1];
    if (!isAgentPackageName(packageName)) {
      continue;
    }
    return identityFromPackageName(packageName);
  }

  return null;
}

/**
 * @param {string} commandLine
 * @returns {{ agentId: string; label: string } | null}
 */
function detectFromNpx(commandLine) {
  const normalized = normalizeCommandLine(commandLine);
  if (!/\bnpx\b/.test(normalized)) {
    return null;
  }

  const match = normalized.match(
    /\bnpx\b(?:\s+(?:--yes|--no-install|--package|-y|-p)\b|\s+-[^\s]+)*\s+((?:@[^/\s]+\/)?[^\s"']+)/i
  );
  if (!match?.[1]) {
    return null;
  }

  const target = match[1].replace(/[;"']+$/, '');
  if (!isAgentPackageName(target) && !KNOWN_AGENT_BINARIES.has(target)) {
    return null;
  }

  if (target.startsWith('@') || target.includes('-cli') || target.includes('-agent')) {
    return identityFromPackageName(target);
  }

  return {
    agentId: target,
    label: slugToLabel(target),
  };
}

/**
 * @param {{ pid: number; name: string; commandLine: string }} proc
 * @returns {{ agentId: string; label: string } | null}
 */
function detectFromDirectBinary(proc) {
  const baseName = path.basename(proc.name, path.extname(proc.name)).toLowerCase();
  if (!baseName || SHELL_PROCESS_NAMES.has(baseName)) {
    return null;
  }

  if (KNOWN_AGENT_BINARIES.has(baseName)) {
    return {
      agentId: baseName,
      label: slugToLabel(baseName),
    };
  }

  if (baseName.endsWith('-cli') || baseName.endsWith('-agent')) {
    return {
      agentId: baseName,
      label: slugToLabel(baseName),
    };
  }

  return null;
}

/**
 * @param {{ pid: number; name: string; commandLine: string }} proc
 * @param {{ entries: Array<{ id: string; label?: string; binaries: string[] }> }} manifest
 * @param {{ byBinary: Map<string, import('./cli-global-registry').GlobalCliEntry>; byPathMarker: import('./cli-global-registry').GlobalCliEntry[] } | null} [globalIndexes]
 * @returns {{ agentId: string; label: string; source: 'manifest' | 'global' | 'auto' } | null}
 */
function resolveAgentFromProcess(proc, manifest, globalIndexes = null) {
  if (shouldIgnoreCommandLine(proc.commandLine)) {
    return null;
  }

  for (const entry of manifest.entries || []) {
    if (matchesManifestEntry(proc, entry)) {
      return {
        agentId: entry.id,
        label: entry.label || entry.id,
        source: 'manifest',
      };
    }
  }

  const fromGlobal = detectFromGlobalRegistry(proc, globalIndexes);
  if (fromGlobal) {
    return { ...fromGlobal, source: 'global' };
  }

  const fromBinary = detectFromDirectBinary(proc);
  if (fromBinary) {
    return { ...fromBinary, source: 'auto' };
  }

  const fromNode = detectFromNodePackage(proc.commandLine);
  if (fromNode) {
    return { ...fromNode, source: 'auto' };
  }

  const fromNpx = detectFromNpx(proc.commandLine);
  if (fromNpx) {
    return { ...fromNpx, source: 'auto' };
  }

  return null;
}

module.exports = {
  KNOWN_AGENT_BINARIES,
  resolveAgentFromProcess,
  detectFromGlobalRegistry,
  shouldIgnoreCommandLine,
  matchesManifestEntry,
  slugToLabel,
  agentIdFromPackageName,
  isAgentPackageName,
};
