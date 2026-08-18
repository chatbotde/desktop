/** @type {import('./base').AgentAdapter} */
const aiderAdapter = {
  id: 'aider',
  label: 'Aider',
  binaries: ['aider'],
  integration: 'managed-only',
  eventKinds: {},
};

module.exports = { aiderAdapter };
