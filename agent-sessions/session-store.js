const os = require('os');
const { randomUUID } = require('crypto');
const { OutputLog } = require('./output-log');

/**
 * @typedef {'idle'|'starting'|'running'|'waiting'|'paused'|'stopped'|'error'} AgentSessionStatus
 */

/**
 * @typedef {Object} AgentSessionSnapshot
 * @property {string} id
 * @property {string} command
 * @property {string} cwd
 * @property {string} label
 * @property {string|null} agentId
 * @property {boolean} managed
 * @property {string} host
 * @property {AgentSessionStatus} status
 * @property {number|null} pid
 * @property {boolean} interactive
 * @property {boolean} hooked
 * @property {string} output
 * @property {string} startedAt
 * @property {number|null} exitCode
 */

class SessionStore {
  constructor() {
    /** @type {Map<string, AgentSessionSnapshot>} */
    this.sessions = new Map();
    /** @type {Map<string, import('@homebridge/node-pty-prebuilt-multiarch').IPty>} */
    this.ptyBySessionId = new Map();
    /** @type {Map<string, OutputLog>} */
    this.outputLogs = new Map();
    this.host = os.hostname();
  }

  /**
   * @param {string} sessionId
   * @returns {OutputLog}
   */
  getOutputLog(sessionId) {
    if (!this.outputLogs.has(sessionId)) {
      this.outputLogs.set(sessionId, new OutputLog());
    }
    return this.outputLogs.get(sessionId);
  }

  /**
   * @param {Partial<AgentSessionSnapshot> & { id?: string; command: string; cwd: string }} input
   * @returns {AgentSessionSnapshot}
   */
  create(input) {
    const id = input.id || randomUUID();
    const snapshot = {
      id,
      command: input.command,
      cwd: input.cwd,
      label: input.label || input.command,
      agentId: input.agentId ?? null,
      managed: input.managed ?? true,
      host: this.host,
      status: input.status || 'starting',
      pid: input.pid ?? null,
      output: input.output || '',
      interactive: input.interactive ?? Boolean(input.managed),
      hooked: input.hooked ?? false,
      startedAt: input.startedAt || new Date().toISOString(),
      exitCode: input.exitCode ?? null,
    };
    this.sessions.set(id, snapshot);
    return snapshot;
  }

  /**
   * @param {string} sessionId
   * @param {Partial<AgentSessionSnapshot>} patch
   * @returns {AgentSessionSnapshot | null}
   */
  update(sessionId, patch) {
    const current = this.sessions.get(sessionId);
    if (!current) {
      return null;
    }
    const next = { ...current, ...patch, id: current.id };
    this.sessions.set(sessionId, next);
    return next;
  }

  /**
   * @param {string} sessionId
   * @returns {AgentSessionSnapshot | null}
   */
  get(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * @param {number} pid
   * @returns {AgentSessionSnapshot | null}
   */
  findByPid(pid) {
    for (const session of this.sessions.values()) {
      if (session.pid === pid) {
        return session;
      }
    }
    return null;
  }

  /**
   * @param {string} agentId
   * @returns {AgentSessionSnapshot | null}
   */
  findActiveByAgentId(agentId) {
    if (!agentId) {
      return null;
    }

    const active = ['starting', 'running', 'waiting', 'paused'];
    return (
      this.list().find(
        (session) => session.agentId === agentId && active.includes(session.status)
      ) || null
    );
  }

  /**
   * @returns {AgentSessionSnapshot[]}
   */
  list() {
    return Array.from(this.sessions.values()).sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }

  /**
   * @param {string} sessionId
   * @returns {AgentSessionSnapshot | null}
   */
  remove(sessionId) {
    const snapshot = this.sessions.get(sessionId);
    if (!snapshot) {
      return null;
    }
    this.sessions.delete(sessionId);
    this.ptyBySessionId.delete(sessionId);
    this.outputLogs.delete(sessionId);
    return snapshot;
  }

  /**
   * @param {string} sessionId
   * @param {import('@homebridge/node-pty-prebuilt-multiarch').IPty} pty
   */
  attachPty(sessionId, pty) {
    this.ptyBySessionId.set(sessionId, pty);
    this.update(sessionId, { pid: pty.pid, status: 'running' });
  }

  /**
   * @param {string} sessionId
   * @returns {import('@homebridge/node-pty-prebuilt-multiarch').IPty | null}
   */
  getPty(sessionId) {
    return this.ptyBySessionId.get(sessionId) || null;
  }
}

module.exports = { SessionStore };
