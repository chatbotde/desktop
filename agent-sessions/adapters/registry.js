const fs = require('fs');
const { claudeCodeAdapter } = require('./claude-code');
const { geminiCliAdapter } = require('./gemini-cli');
const { codexAdapter } = require('./codex');
const { aiderAdapter } = require('./aider');
const { opencodeAdapter } = require('./opencode');
const { adapterSupportsHooks, expandHome, hookConfigDir } = require('./base');

/** @type {import('./base').AgentAdapter[]} */
const ADAPTERS = [
  claudeCodeAdapter,
  geminiCliAdapter,
  codexAdapter,
  aiderAdapter,
  opencodeAdapter,
];

/** @type {Map<string, import('./base').AgentAdapter>} */
const byId = new Map(ADAPTERS.map((adapter) => [adapter.id, adapter]));

/**
 * @returns {import('./base').AgentAdapter[]}
 */
function listAdapters() {
  return ADAPTERS.slice();
}

/**
 * @param {string} agentId
 * @returns {import('./base').AgentAdapter | null}
 */
function getAdapter(agentId) {
  return byId.get(String(agentId || '').trim()) || null;
}

/**
 * Normalised hook vocabulary for the phone — merged from all adapters.
 * @returns {Record<string, Record<string, import('./base').HookKind>>}
 */
function buildEventKindsMap() {
  /** @type {Record<string, Record<string, import('./base').HookKind>>} */
  const map = {};
  for (const adapter of ADAPTERS) {
    if (!adapter.eventKinds || Object.keys(adapter.eventKinds).length === 0) {
      continue;
    }
    map[adapter.id] = { ...adapter.eventKinds };
  }
  return map;
}

/**
 * Legacy shape used by hook-installer exports.
 * @returns {Record<string, NonNullable<import('./base').AgentAdapter['hooks']> & { config: string }>}
 */
function buildLegacyHookSpecs() {
  /** @type {Record<string, any>} */
  const specs = {};
  for (const adapter of ADAPTERS) {
    if (!adapterSupportsHooks(adapter) || !adapter.hooks) {
      continue;
    }
    specs[adapter.id] = {
      config: expandHome(adapter.hooks.configPath),
      format: adapter.hooks.format,
      timeoutUnit: adapter.hooks.timeoutUnit,
      events: adapter.hooks.events,
    };
  }
  return specs;
}

/**
 * @param {string} agentId
 * @returns {boolean}
 */
function isHookConfigPresent(agentId) {
  const adapter = getAdapter(agentId);
  if (!adapterSupportsHooks(adapter) || !adapter?.hooks) {
    return false;
  }
  return fs.existsSync(hookConfigDir(adapter));
}

/**
 * @param {{ installed?: boolean; launchable?: boolean; hookInstalled?: boolean }} [status]
 * @returns {Array<{
 *   id: string;
 *   label: string;
 *   binaries: string[];
 *   integration: import('./base').AgentIntegration;
 *   hooksSupported: boolean;
 *   hookConfigPath: string | null;
 *   hookConfigPresent: boolean;
 *   pluginInstallHint: string | null;
 *   installed: boolean;
 *   launchable: boolean;
 *   hookInstalled: boolean;
 * }>}
 */
function listAgentsForUi(status = {}) {
  return ADAPTERS.map((adapter) => {
    const hooksSupported = adapterSupportsHooks(adapter);
    const hookConfigPath = adapter.hooks?.configPath ?? null;
    return {
      id: adapter.id,
      label: adapter.label,
      binaries: adapter.binaries.slice(),
      integration: adapter.integration,
      hooksSupported,
      hookConfigPath,
      hookConfigPresent: hooksSupported ? isHookConfigPresent(adapter.id) : false,
      pluginInstallHint: adapter.pluginInstallHint ?? null,
      installed: Boolean(status.installed?.[adapter.id]),
      launchable: Boolean(status.launchable?.[adapter.id]),
      hookInstalled: Boolean(status.hookInstalled?.[adapter.id]),
    };
  });
}

module.exports = {
  ADAPTERS,
  listAdapters,
  getAdapter,
  buildEventKindsMap,
  buildLegacyHookSpecs,
  isHookConfigPresent,
  listAgentsForUi,
};
