/** @type {import('./base').AgentAdapter} */
const geminiCliAdapter = {
  id: 'gemini-cli',
  label: 'Gemini CLI',
  binaries: ['gemini'],
  integration: 'hooks',
  hooks: {
    configPath: '~/.gemini/settings.json',
    format: 'gemini',
    timeoutUnit: 'milliseconds',
    events: [
      { name: 'SessionStart' },
      { name: 'BeforeAgent' },
      { name: 'BeforeTool', block: true },
      { name: 'AfterTool' },
      { name: 'AfterAgent' },
      { name: 'SessionEnd' },
    ],
  },
  eventKinds: {
    SessionStart: 'session_start',
    BeforeAgent: 'prompt',
    BeforeTool: 'tool_pre',
    AfterTool: 'tool_post',
    AfterAgent: 'turn_end',
    SessionEnd: 'session_end',
  },
  pluginInstallHint: 'npm run agent:install-gemini-bridge',
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

    if (decision === 'deny') {
      return JSON.stringify({ decision: 'deny', reason });
    }
    return JSON.stringify({ decision: 'approve', reason });
  },
};

module.exports = { geminiCliAdapter };
