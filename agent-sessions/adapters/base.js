const os = require('os');
const path = require('path');

/**
 * @typedef {'session_start'|'prompt'|'tool_pre'|'tool_post'|'notification'|'turn_end'|'session_end'} HookKind
 */

/**
 * @typedef {'hooks'|'plugin'|'managed-only'} AgentIntegration
 */

/**
 * @typedef {'claude'|'gemini'|'codex'} HookConfigFormat
 */

/**
 * @typedef {Object} HookEventSpec
 * @property {string} name
 * @property {boolean} [block]
 */

/**
 * @typedef {Object} AgentHooksSpec
 * @property {string} configPath
 * @property {HookConfigFormat} format
 * @property {'seconds'|'milliseconds'} timeoutUnit
 * @property {HookEventSpec[]} events
 */

/**
 * @typedef {Object} AgentAdapter
 * @property {string} id
 * @property {string} label
 * @property {string[]} binaries
 * @property {AgentIntegration} integration
 * @property {AgentHooksSpec} [hooks]
 * @property {Record<string, HookKind>} [eventKinds]
 * @property {string} [pluginInstallHint]
 * @property {(event: string, response: Record<string, unknown> | null) => string} [renderDecision]
 */

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
 * @param {AgentAdapter} adapter
 * @returns {boolean}
 */
function adapterSupportsHooks(adapter) {
  return adapter.integration === 'hooks' && Boolean(adapter.hooks);
}

/**
 * @param {AgentAdapter} adapter
 * @returns {string}
 */
function hookConfigDir(adapter) {
  if (!adapter.hooks?.configPath) {
    return '';
  }
  return path.dirname(expandHome(adapter.hooks.configPath));
}

module.exports = {
  expandHome,
  adapterSupportsHooks,
  hookConfigDir,
};
