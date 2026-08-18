/** @type {import('./base').AgentAdapter} */
const codexAdapter = {
  id: 'codex',
  label: 'Codex',
  binaries: ['codex'],
  integration: 'hooks',
  hooks: {
    configPath: '~/.codex/hooks.json',
    format: 'codex',
    timeoutUnit: 'seconds',
    events: [
      { name: 'SessionStart' },
      { name: 'PreToolUse' },
      { name: 'PostToolUse' },
      { name: 'Stop' },
      { name: 'SessionEnd' },
    ],
  },
  eventKinds: {
    SessionStart: 'session_start',
    PreToolUse: 'tool_pre',
    PostToolUse: 'tool_post',
    Stop: 'turn_end',
    SessionEnd: 'session_end',
  },
  renderDecision(_event, response) {
    const decision = response && typeof response.decision === 'string' ? response.decision : '';
    if (decision !== 'allow' && decision !== 'deny') {
      return '';
    }

    const reason =
      response && typeof response.reason === 'string' && response.reason
        ? response.reason
        : decision === 'deny'
          ? 'Denied from SonicThinking on your phone.'
          : 'Approved from SonicThinking on your phone.';

    return JSON.stringify({ decision, reason });
  },
};

module.exports = { codexAdapter };
