const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const {
  getAdapter,
  listAdapters,
  buildLegacyHookSpecs,
  isHookConfigPresent,
} = require('../adapters/registry');
const { adapterSupportsHooks, expandHome, hookConfigDir } = require('../adapters/base');

const FORWARDER_SOURCE = path.join(__dirname, 'buddy-hook-forwarder.js');
const DECISIONS_SOURCE = path.join(__dirname, 'decisions.js');
const HOOK_DIR = path.join(os.homedir(), '.buddy', 'hooks');
const FORWARDER_TARGET = path.join(HOOK_DIR, 'buddy-hook-forwarder.js');
const DECISIONS_TARGET = path.join(HOOK_DIR, 'buddy-hook-decisions.js');
const HOOK_NAME = 'buddy-remote';

const BLOCKING_TIMEOUT_SECONDS = 120;
const PASSIVE_TIMEOUT_SECONDS = 5;

/** @deprecated Use adapters/registry — kept for tests and legacy imports. */
const AGENT_HOOKS = buildLegacyHookSpecs();

/**
 * @returns {Promise<string|null>}
 */
function resolveNodeBinary() {
  return new Promise((resolve) => {
    const finder = process.platform === 'win32' ? 'where' : 'which';
    execFile(finder, ['node'], { timeout: 5000 }, (error, stdout) => {
      if (error) {
        resolve(null);
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
 * @param {string} filePath
 * @returns {Record<string, any>}
 */
function readJsonFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8').trim();
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * @param {string} filePath
 * @param {Record<string, any>} data
 */
function writeJsonFile(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

/**
 * @param {{ format: string; timeoutUnit: string }} spec
 * @param {{ nodeBinary: string; agentId: string; event: string; block: boolean; port: number }} input
 * @returns {Record<string, unknown>}
 */
function buildHookEntry(spec, input) {
  const args = [
    FORWARDER_TARGET,
    '--agent',
    input.agentId,
    '--event',
    input.event,
    '--port',
    String(input.port),
  ];
  if (input.block) {
    args.push('--block');
  }

  const seconds = input.block ? BLOCKING_TIMEOUT_SECONDS : PASSIVE_TIMEOUT_SECONDS;
  const timeout = spec.timeoutUnit === 'milliseconds' ? seconds * 1000 : seconds;

  if (spec.format === 'claude' || spec.format === 'codex') {
    return {
      name: HOOK_NAME,
      type: 'command',
      command: input.nodeBinary,
      args: args.slice(),
      timeout,
    };
  }

  const quoted = [input.nodeBinary, ...args]
    .map((part) => (part.includes(' ') ? `"${part}"` : part))
    .join(' ');
  return { name: HOOK_NAME, type: 'command', command: quoted, timeout };
}

/**
 * @param {any[]} groups
 * @param {Record<string, unknown> | null} entry
 * @returns {any[]}
 */
function mergeEventGroups(groups, entry) {
  const existing = Array.isArray(groups) ? groups : [];
  const cleaned = existing
    .map((group) => {
      if (!group || typeof group !== 'object' || !Array.isArray(group.hooks)) {
        return group;
      }
      const hooks = group.hooks.filter((hook) => hook?.name !== HOOK_NAME);
      return hooks.length === group.hooks.length ? group : { ...group, hooks };
    })
    .filter((group) => !group || !Array.isArray(group.hooks) || group.hooks.length > 0);

  if (!entry) {
    return cleaned;
  }
  return [...cleaned, { matcher: '*', hooks: [entry] }];
}

function copyHookRuntimeFiles() {
  fs.mkdirSync(HOOK_DIR, { recursive: true });
  fs.copyFileSync(FORWARDER_SOURCE, FORWARDER_TARGET);
  fs.copyFileSync(DECISIONS_SOURCE, DECISIONS_TARGET);
}

/**
 * @param {string} agentId
 * @param {{ port?: number; nodeBinary?: string | null; configPath?: string }} [options]
 * @returns {Promise<{ agentId: string; installed: boolean; config?: string; error?: string }>}
 */
async function installHooksFor(agentId, options = {}) {
  const adapter = getAdapter(agentId);
  if (!adapterSupportsHooks(adapter) || !adapter?.hooks) {
    return { agentId, installed: false, error: 'unsupported_agent' };
  }

  const nodeBinary = options.nodeBinary ?? (await resolveNodeBinary());
  if (!nodeBinary) {
    return { agentId, installed: false, error: 'node_not_found' };
  }

  const configPath = options.configPath || expandHome(adapter.hooks.configPath);
  const spec = {
    format: adapter.hooks.format,
    timeoutUnit: adapter.hooks.timeoutUnit,
  };

  try {
    copyHookRuntimeFiles();

    const config = readJsonFile(configPath);
    const hooks = config.hooks && typeof config.hooks === 'object' ? { ...config.hooks } : {};

    for (const event of adapter.hooks.events) {
      hooks[event.name] = mergeEventGroups(
        hooks[event.name],
        buildHookEntry(spec, {
          nodeBinary,
          agentId,
          event: event.name,
          block: event.block === true,
          port: options.port ?? 9876,
        })
      );
    }

    writeJsonFile(configPath, { ...config, hooks });
    return { agentId, installed: true, config: configPath };
  } catch (error) {
    return {
      agentId,
      installed: false,
      error: error instanceof Error ? error.message : 'install_failed',
    };
  }
}

/**
 * @param {string} agentId
 * @param {{ configPath?: string }} [options]
 * @returns {{ agentId: string; removed: boolean; error?: string }}
 */
function uninstallHooksFor(agentId, options = {}) {
  const adapter = getAdapter(agentId);
  if (!adapterSupportsHooks(adapter) || !adapter?.hooks) {
    return { agentId, removed: false, error: 'unsupported_agent' };
  }

  const configPath = options.configPath || expandHome(adapter.hooks.configPath);

  try {
    if (!fs.existsSync(configPath)) {
      return { agentId, removed: true };
    }
    const config = readJsonFile(configPath);
    if (!config.hooks || typeof config.hooks !== 'object') {
      return { agentId, removed: true };
    }

    const hooks = { ...config.hooks };
    for (const event of adapter.hooks.events) {
      const groups = mergeEventGroups(hooks[event.name], null);
      if (groups.length > 0) {
        hooks[event.name] = groups;
      } else {
        delete hooks[event.name];
      }
    }

    writeJsonFile(configPath, { ...config, hooks });
    return { agentId, removed: true };
  } catch (error) {
    return {
      agentId,
      removed: false,
      error: error instanceof Error ? error.message : 'uninstall_failed',
    };
  }
}

/**
 * @param {{ port?: number }} [options]
 * @returns {Promise<Array<{ agentId: string; installed: boolean; config?: string; error?: string }>>}
 */
async function installAvailableHooks(options = {}) {
  const nodeBinary = await resolveNodeBinary();
  const results = [];

  for (const adapter of listAdapters()) {
    if (!adapterSupportsHooks(adapter)) {
      continue;
    }
    if (!isHookConfigPresent(adapter.id)) {
      continue;
    }
    results.push(await installHooksFor(adapter.id, { ...options, nodeBinary }));
  }

  return results;
}

/**
 * @param {string} configPath
 * @returns {boolean}
 */
function configHasBuddyHooks(configPath) {
  if (!fs.existsSync(configPath)) {
    return false;
  }
  const config = readJsonFile(configPath);
  if (!config.hooks || typeof config.hooks !== 'object') {
    return false;
  }
  for (const groups of Object.values(config.hooks)) {
    if (!Array.isArray(groups)) {
      continue;
    }
    for (const group of groups) {
      if (!group || !Array.isArray(group.hooks)) {
        continue;
      }
      if (group.hooks.some((hook) => hook?.name === HOOK_NAME)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * @param {string} agentId
 * @returns {boolean}
 */
function isHookInstalled(agentId) {
  const adapter = getAdapter(agentId);
  if (!adapterSupportsHooks(adapter) || !adapter?.hooks) {
    return false;
  }
  return configHasBuddyHooks(expandHome(adapter.hooks.configPath));
}

module.exports = {
  AGENT_HOOKS,
  HOOK_NAME,
  FORWARDER_TARGET,
  installHooksFor,
  installAvailableHooks,
  uninstallHooksFor,
  resolveNodeBinary,
  isHookInstalled,
  hookConfigDir,
};
