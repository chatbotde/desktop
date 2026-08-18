const { SERVER_MESSAGE_TYPES } = require('../remote-pad/protocol');

class RemotePadBridge {
  /**
   * @param {{ broadcastToPhone?: (payload: Record<string, unknown>) => Promise<boolean> } | null} remotePadService
   */
  constructor(remotePadService = null) {
    this.remotePadService = remotePadService;
  }

  /**
   * @param {{ broadcastToPhone?: (payload: Record<string, unknown>) => Promise<boolean> } | null} remotePadService
   */
  setRemotePadService(remotePadService) {
    this.remotePadService = remotePadService;
  }

  /**
   * @param {Record<string, unknown>} payload
   * @returns {Promise<boolean>}
   */
  async broadcast(payload) {
    if (!this.remotePadService?.broadcastToPhone) {
      return false;
    }
    return this.remotePadService.broadcastToPhone(payload);
  }

  /**
   * @param {import('./session-store').AgentSessionSnapshot[]} sessions
   */
  async sendSessionList(sessions) {
    return this.broadcast({
      type: SERVER_MESSAGE_TYPES.AGENT_SESSION_LIST,
      sessions,
    });
  }

  /**
   * @param {import('./session-store').AgentSessionSnapshot} session
   */
  async sendSessionUpdate(session) {
    return this.broadcast({
      type: SERVER_MESSAGE_TYPES.AGENT_SESSION_UPDATE,
      session,
    });
  }

  /**
   * @param {string} sessionId
   */
  async sendSessionRemove(sessionId) {
    return this.broadcast({
      type: SERVER_MESSAGE_TYPES.AGENT_SESSION_REMOVE,
      sessionId,
    });
  }

  /**
   * @param {string} sessionId
   * @param {string[]} lines
   * @param {string} [chunk]
   */
  async sendSessionOutput(sessionId, lines, chunk = '') {
    return this.broadcast({
      type: SERVER_MESSAGE_TYPES.AGENT_SESSION_OUTPUT,
      sessionId,
      lines,
      chunk,
    });
  }

  /**
   * @param {Record<string, unknown>} approval
   */
  async sendPermissionRequest(approval) {
    return this.broadcast({
      type: SERVER_MESSAGE_TYPES.AGENT_PERMISSION_REQUEST,
      approval,
    });
  }

  /**
   * Tells the phone to drop an approval card, whether it was answered here,
   * on the desktop, or by timing out.
   *
   * @param {string} approvalId
   * @param {string} decision
   */
  async sendPermissionResolved(approvalId, decision) {
    return this.broadcast({
      type: SERVER_MESSAGE_TYPES.AGENT_PERMISSION_RESOLVED,
      approvalId,
      decision,
    });
  }

  /**
   * @param {string} sessionId
   * @param {string[]} lines
   */
  async sendSessionLog(sessionId, lines) {
    return this.broadcast({
      type: SERVER_MESSAGE_TYPES.AGENT_SESSION_LOG,
      sessionId,
      lines,
    });
  }
}

module.exports = { RemotePadBridge };
