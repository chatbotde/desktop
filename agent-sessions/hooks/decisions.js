/**
 * CLI-specific allow/deny response shapes for the hook forwarder.
 * Copied alongside buddy-hook-forwarder.js into ~/.buddy/hooks at install time.
 *
 * @param {string} agentId
 * @param {string} event
 * @param {Record<string, unknown> | null} response
 * @returns {string}
 */
function renderDecision(agentId, event, response) {
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

  if (agentId === 'claude-code') {
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
  }

  if (agentId === 'gemini-cli') {
    if (decision === 'deny') {
      return JSON.stringify({ decision: 'deny', reason });
    }
    return JSON.stringify({ decision: 'approve', reason });
  }

  if (agentId === 'codex') {
    return JSON.stringify({ decision, reason });
  }

  return '';
}

module.exports = { renderDecision };
