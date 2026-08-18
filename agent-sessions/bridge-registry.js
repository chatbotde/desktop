const { safeSocketWrite, attachSocketErrorHandler } = require('./socket-utils');

class BridgeRegistry {
  constructor() {
    /** @type {Map<string, import('net').Socket>} */
    this.bridgesBySessionId = new Map();
    /** @type {Map<number, string>} */
    this.sessionIdByPid = new Map();
  }

  /**
   * @param {string} sessionId
   * @param {import('net').Socket} socket
   */
  attach(sessionId, socket) {
    const previous = this.bridgesBySessionId.get(sessionId);
    if (previous && previous !== socket) {
      this.detach(sessionId, previous);
    }

    this.bridgesBySessionId.set(sessionId, socket);
    attachSocketErrorHandler(socket);

    socket.on('close', () => {
      if (this.bridgesBySessionId.get(sessionId) === socket) {
        this.bridgesBySessionId.delete(sessionId);
      }
    });
  }

  /**
   * @param {string} sessionId
   * @param {import('net').Socket} [socket]
   */
  detach(sessionId, socket = this.bridgesBySessionId.get(sessionId)) {
    if (!socket) {
      return;
    }

    if (this.bridgesBySessionId.get(sessionId) === socket) {
      this.bridgesBySessionId.delete(sessionId);
    }

    if (socket.destroyed) {
      return;
    }

    attachSocketErrorHandler(socket);
    try {
      socket.end();
    } catch {
      try {
        socket.destroy();
      } catch {
        // ignore teardown errors
      }
    }
  }

  /**
   * @param {number} pid
   * @param {string} sessionId
   */
  linkPid(pid, sessionId) {
    this.sessionIdByPid.set(pid, sessionId);
  }

  /**
   * @param {number} pid
   * @returns {string | null}
   */
  getSessionIdByPid(pid) {
    return this.sessionIdByPid.get(pid) || null;
  }

  /**
   * @param {string} sessionId
   * @returns {import('net').Socket | null}
   */
  getBridge(sessionId) {
    return this.bridgesBySessionId.get(sessionId) || null;
  }

  /**
   * @param {import('net').Socket} socket
   * @returns {string | null}
   */
  getSessionIdForSocket(socket) {
    if (!socket) {
      return null;
    }
    for (const [sessionId, attached] of this.bridgesBySessionId.entries()) {
      if (attached === socket) {
        return sessionId;
      }
    }
    return null;
  }

  /**
   * @param {string} sessionId
   * @param {Record<string, unknown>} payload
   */
  sendToBridge(sessionId, payload) {
    const socket = this.getBridge(sessionId);
    if (!socket || socket.destroyed) {
      return false;
    }
    return safeSocketWrite(socket, payload);
  }

  /**
   * @param {number} pid
   */
  unlinkPid(pid) {
    this.sessionIdByPid.delete(pid);
  }
}

module.exports = { BridgeRegistry };
