/** @type {import('./base').AgentAdapter} */
const opencodeAdapter = {
  id: 'opencode',
  label: 'OpenCode',
  binaries: ['opencode'],
  integration: 'plugin',
  pluginInstallHint: 'npm run agent:install-opencode-bridge',
  eventKinds: {},
};

module.exports = { opencodeAdapter };
