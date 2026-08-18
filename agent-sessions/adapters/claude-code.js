/** @type {import('./base').AgentAdapter} */
const claudeCodeAdapter = {
  id: 'claude-code',
  label: 'Claude Code',
  binaries: ['claude'],
  integration: 'hooks',
  hooks: {
    configPath: '~/.claude/settings.json',
    format: 'claude',
    timeoutUnit: 'seconds',
    events: [
      { name: 'SessionStart' },
      { name: 'UserPromptSubmit' },
      { name: 'PreToolUse', block: true },
      { name: 'PostToolUse' },
      { name: 'Notification' },
      { name: 'Stop' },
      { name: 'SessionEnd' },
    ],
  },
  eventKinds: {
    SessionStart: 'session_start',
    UserPromptSubmit: 'prompt',
    PreToolUse: 'tool_pre',
    PermissionRequest: 'tool_pre',
    PostToolUse: 'tool_post',
    Notification: 'notification',
    Stop: 'turn_end',
    SessionEnd: 'session_end',
  },
  renderDecision(event, response) {
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

    if (event === 'PermissionRequest') {
      return JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PermissionRequest',
          decision: { behavior: decision, message: reason },
        },
      });
    }

    return JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: decision,
        permissionDecisionReason: reason,
      },
    });
  },
};

module.exports = { claudeCodeAdapter };
