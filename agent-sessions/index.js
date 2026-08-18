const os = require('os');
const { installProcessSocketSafetyHandlers } = require('./socket-utils');
const { SessionStore } = require('./session-store');
const {
  runManagedCommand,
  stopManagedSession,
  sendInputToSession,
  writeRawToSession,
  resizeSession,
} = require('./core/process-wrapper');
const { RemotePadBridge } = require('./remote-pad-bridge');
const { AgentSessionSocketServer } = require('./socket-server');
const { ProcessWatcher } = require('./process-watcher');
const { BridgeRegistry } = require('./bridge-registry');
const { killProcessTree } = require('./kill-process');
const { listKnownClis } = require('./cli-manifest');
const { builtinTerminalCli } = require('./cli-availability');
const { HookEventRouter } = require('./hooks/events');
const { readSocketPort } = require('./socket-port');
const {
  listAgents: fetchAgentCatalog,
  installHooksFor,
  installAvailableHooks,
  uninstallHooksFor,
} = require('./core/agent-manager');
const {
  installAgentShims,
  uninstallAgentShims,
  getShimStatus,
} = require('./shim-installer');
const { maybeSpawnGeminiBridge, clearGeminiBridgeSpawn } = require('./gemini-bridge-spawner');
const { CLIENT_MESSAGE_TYPES, SERVER_MESSAGE_TYPES } = require('../remote-pad/protocol');

const ACTIVE_STATUSES = new Set(['starting', 'running', 'waiting', 'paused']);

/**
 * @param {import('./session-store').AgentSessionSnapshot[]} sessions
 * @returns {import('./session-store').AgentSessionSnapshot[]}
 */
function dedupeSessionsForDisplay(sessions) {
  /** @type {Map<string, import('./session-store').AgentSessionSnapshot>} */
  const bestByKey = new Map();

  for (const session of sessions) {
    const key = session.agentId || session.id;
    const existing = bestByKey.get(key);
    if (!existing) {
      bestByKey.set(key, session);
      continue;
    }

    const score = (entry) =>
      (entry.interactive ? 4 : 0) +
      (entry.managed ? 2 : 0) +
      (ACTIVE_STATUSES.has(entry.status) ? 1 : 0);

    if (score(session) > score(existing)) {
      bestByKey.set(key, session);
      continue;
    }

    if (
      score(session) === score(existing) &&
      new Date(session.startedAt).getTime() > new Date(existing.startedAt).getTime()
    ) {
      bestByKey.set(key, session);
    }
  }

  return Array.from(bestByKey.values()).sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );
}

class AgentSessionService {
  /**
   * @param {import('../ipc-handler-registry').IpcHandlerRegistry} ipcRegistry
   */
  constructor(ipcRegistry) {
    this.ipcRegistry = ipcRegistry;
    this.store = new SessionStore();
    this.bridge = new RemotePadBridge();
    this.bridgeRegistry = new BridgeRegistry();
    /** @type {AgentSessionSocketServer | null} */
    this.socketServer = null;
    /** @type {ProcessWatcher | null} */
    this.processWatcher = null;
    /** @type {Map<string, string>} */
    this.cliLabels = new Map();
    this.hookRouter = new HookEventRouter(this.store, {
      onSessionLine: (sessionId, line, level) => this.appendSessionLine(sessionId, line, level),
      onSessionUpdate: (session) => {
        void this.bridge.sendSessionUpdate(session);
      },
      onSessionList: () => {
        void this.pushSessionListToPhone();
      },
      onApprovalRequest: (approval) => {
        void this.bridge.sendPermissionRequest(approval);
      },
      onApprovalResolved: (approvalId, decision) => {
        void this.bridge.sendPermissionResolved(approvalId, decision);
      },
      resolveLabel: (agentId) => this.cliLabels.get(agentId) || '',
    });
  }

  /**
   * @param {{ broadcastToPhone?: (payload: Record<string, unknown>) => Promise<boolean> } | null} remotePadService
   */
  setup(remotePadService = null) {
    installProcessSocketSafetyHandlers();
    this.bridge.setRemotePadService(remotePadService);
    this.registerIpcHandlers();
    this.socketServer = new AgentSessionSocketServer(
      (message, socket) => this.handleSocketMessage(message, socket)
    );
    this.socketServer.start().catch((error) => {
      console.error('[AgentSessions] Failed to start socket server:', error);
    });
    this.processWatcher = new ProcessWatcher(this.store, {
      onDiscovered: (session) => {
        maybeSpawnGeminiBridge(session);
        void this.bridge.sendSessionUpdate(session);
        void this.pushSessionListToPhone();
      },
      onLost: (session) => {
        if (session.pid) {
          clearGeminiBridgeSpawn(session.pid);
          this.bridgeRegistry.unlinkPid(session.pid);
        }
        void this.bridge.sendSessionRemove(session.id);
      },
    });
    this.processWatcher.start();
    this.geminiBridgeRetryTimer = setInterval(() => {
      for (const session of this.store.list()) {
        if (
          session.agentId === 'gemini-cli' &&
          !session.interactive &&
          session.status === 'running' &&
          session.pid
        ) {
          maybeSpawnGeminiBridge(session, { forceRetry: true });
        }
      }
    }, 15_000);
    void this.cacheCliLabels();
    void this.installHooks();
    void this.installShims();
    console.log('[AgentSessions] Ready — I/O via Agents tab on phone');
    console.log('[AgentSessions] Global shims: npm run agent:install-shims');
    console.log('[AgentSessions] OpenCode bridge: npm run agent:install-opencode-bridge');
    console.log('[AgentSessions] Gemini bridge: npm run agent:install-gemini-bridge');
  }

  /**
   * Keep display names for agents we only ever see through hooks.
   */
  async cacheCliLabels() {
    try {
      for (const cli of await this.listLaunchableClis()) {
        this.cliLabels.set(cli.id, cli.label);
      }
    } catch (error) {
      console.warn('[AgentSessions] Failed to cache CLI labels:', error);
    }
  }

  /**
   * Register Buddy's forwarder with any CLI that already has a config directory,
   * so agents started outside Buddy still stream to the phone.
   */
  async installHooks() {
    try {
      const results = await installAvailableHooks();
      for (const result of results) {
        if (result.installed) {
          console.log(`[AgentSessions] Hooks installed for ${result.agentId} (${result.config})`);
        } else {
          console.warn(
            `[AgentSessions] Hook install skipped for ${result.agentId}: ${result.error}`
          );
        }
      }
    } catch (error) {
      console.error('[AgentSessions] Hook install failed:', error);
    }
  }

  /**
   * Catalog of supported agents with hook install paths and launch status.
   * @param {{ force?: boolean }} [options]
   */
  async listAgents(options = {}) {
    return fetchAgentCatalog(options);
  }

  /**
   * @param {string} agentId
   * @param {{ port?: number }} [options]
   */
  async installHooksForAgent(agentId, options = {}) {
    return installHooksFor(agentId, options);
  }

  /**
   * @param {string} agentId
   */
  uninstallHooksForAgent(agentId) {
    return uninstallHooksFor(agentId);
  }

  /**
   * Install PATH shims so any terminal agent CLI starts as a Buddy-managed session.
   */
  async installShims() {
    try {
      const result = await installAgentShims();
      console.log(
        `[AgentSessions] Shims installed: ${result.installedCount} ok, ${result.skippedCount} skipped (${result.binDir})`
      );
      if (result.pathChanged) {
        console.log('[AgentSessions] User PATH updated — open a new terminal to use shims');
      }
      return result;
    } catch (error) {
      console.error('[AgentSessions] Shim install failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  uninstallShims() {
    return uninstallAgentShims();
  }

  getShimStatus() {
    return getShimStatus();
  }

  /**
   * @param {{ sessionId: string; lines: string[]; chunk?: string }} payload
   */
  emitSessionOutput(payload) {
    void this.bridge.sendSessionOutput(payload.sessionId, payload.lines, payload.chunk || '');
  }

  /**
   * @param {string} sessionId
   * @param {string} line
   * @param {'info'|'error'} [level]
   */
  appendSessionLine(sessionId, line, level = 'info') {
    const log = this.store.getOutputLog(sessionId);
    const prefix = level === 'error' ? '[error] ' : '';
    const lines = log.appendLine(`${prefix}${line}`);
    const summary = log.getSummary();
    const updated = this.store.update(sessionId, { output: summary, status: 'running' });
    if (updated) {
      void this.bridge.sendSessionUpdate(updated);
    }
    if (lines.length > 0) {
      this.emitSessionOutput({ sessionId, lines });
    }
  }

  /**
   * @returns {import('./session-store').AgentSessionSnapshot[]}
   */
  listSessions() {
    return dedupeSessionsForDisplay(this.store.list());
  }

  /**
   * @param {string} agentId
   * @returns {string[]}
   */
  removeDuplicateAgentSessions(agentId, keepSessionId) {
    if (!agentId) {
      return [];
    }

    const removedIds = [];
    for (const session of this.store.list()) {
      if (session.id === keepSessionId || session.agentId !== agentId) {
        continue;
      }
      if (!ACTIVE_STATUSES.has(session.status)) {
        continue;
      }
      this.store.remove(session.id);
      removedIds.push(session.id);
    }
    return removedIds;
  }

  /**
   * @param {{ command: string; args?: string[]; cwd?: string; label?: string; agentId?: string | null }} input
   * @returns {import('./session-store').AgentSessionSnapshot}
   */
  startSession(input) {
    const session = runManagedCommand(this.store, {
      ...input,
      onUpdate: (updated) => {
        void this.bridge.sendSessionUpdate(updated);
      },
      onOutput: (payload) => {
        this.emitSessionOutput(payload);
      },
      onRawData: (payload) => {
        this.bridgeRegistry.sendToBridge(payload.sessionId, {
          type: 'pty_output',
          sessionId: payload.sessionId,
          data: payload.data,
        });
      },
      onRemove: (removed) => {
        this.bridgeRegistry.sendToBridge(removed.id, {
          type: 'pty_exit',
          sessionId: removed.id,
          exitCode: removed.exitCode,
        });
        void this.bridge.sendSessionRemove(removed.id);
      },
    });
    void this.bridge.sendSessionUpdate(session);
    return session;
  }

  /**
   * @param {string} sessionId
   * @param {string} text
   */
  sendInput(sessionId, text) {
    const trimmed = String(text ?? '').trim();
    if (!trimmed) {
      return { success: false, error: 'empty_input' };
    }

    const session = this.store.get(sessionId);
    if (!session) {
      console.warn('[AgentSessions] sendInput: session not found', sessionId);
      return { success: false, error: 'session_not_found' };
    }

    if (this.store.getPty(sessionId)) {
      const result = sendInputToSession(this.store, sessionId, trimmed);
      if (!result.success) {
        console.warn('[AgentSessions] PTY sendInput failed:', result.error);
      }
      return result;
    }

    if (this.bridgeRegistry.sendToBridge(sessionId, { type: 'bridge_input', text: trimmed })) {
      return { success: true };
    }

    // This session was started outside Buddy, so there is no PTY to write to.
    // Launching the same CLI from the Agents tab gives a session that accepts input.
    const label = session.label || session.agentId || 'this agent';
    this.appendSessionLine(
      sessionId,
      `Cannot type into ${label} — it was started outside Buddy. ` +
        'Stop it, then launch it from the Agents tab to send input from your phone.',
      'error'
    );
    return { success: false, error: 'not_interactive' };
  }

  /**
   * @param {string} sessionId
   */
  stopSession(sessionId) {
    const existing = this.store.get(sessionId);
    if (!existing) {
      return { success: false, error: 'session_not_found' };
    }

    if (this.store.getPty(sessionId)) {
      const result = stopManagedSession(this.store, sessionId);
      const snapshot = this.store.get(sessionId);
      if (snapshot) {
        void this.bridge.sendSessionUpdate(snapshot);
        void this.bridge.sendSessionRemove(sessionId);
        this.store.remove(sessionId);
      }
      return result;
    }

    if (existing.pid) {
      void killProcessTree(existing.pid);
      this.bridgeRegistry.unlinkPid(existing.pid);
    }

    const stopped = this.store.update(sessionId, { status: 'stopped' });
    if (stopped) {
      void this.bridge.sendSessionUpdate(stopped);
      void this.bridge.sendSessionRemove(sessionId);
    }
    this.store.remove(sessionId);
    return { success: true };
  }

  /**
   * Send current sessions to connected phone clients.
   */
  async pushSessionListToPhone() {
    return this.bridge.sendSessionList(this.listSessions());
  }

  /**
   * @param {string} sessionId
   */
  async pushSessionLogToPhone(sessionId) {
    const lines = this.store.getOutputLog(sessionId).getLines();
    return this.bridge.sendSessionLog(sessionId, lines);
  }

  /**
   * @param {Record<string, unknown>} message
   * @returns {Promise<Record<string, unknown> | null>}
   */
  async handleRemotePadMessage(message) {
    switch (message.type) {
      case CLIENT_MESSAGE_TYPES.AGENT_STOP: {
        const sessionId = String(message.sessionId ?? '');
        const result = this.stopSession(sessionId);
        return {
          type: SERVER_MESSAGE_TYPES.AGENT_STOP_RESULT,
          sessionId,
          success: result.success,
          error: result.error,
        };
      }
      case CLIENT_MESSAGE_TYPES.AGENT_SEND_INPUT: {
        const sessionId = String(message.sessionId ?? '');
        const result = this.sendInput(sessionId, String(message.text ?? ''));
        return {
          type: SERVER_MESSAGE_TYPES.STATUS,
          sessionId,
          ...result,
        };
      }
      case CLIENT_MESSAGE_TYPES.AGENT_APPROVE:
      case CLIENT_MESSAGE_TYPES.AGENT_DENY: {
        const approvalId = String(message.approvalId ?? '');
        const decision =
          message.type === CLIENT_MESSAGE_TYPES.AGENT_APPROVE ? 'allow' : 'deny';
        const handled = this.hookRouter.resolveApproval(
          approvalId,
          decision,
          typeof message.reason === 'string' ? message.reason : undefined
        );
        return {
          type: SERVER_MESSAGE_TYPES.STATUS,
          approvalId,
          success: handled,
          error: handled ? undefined : 'approval_not_pending',
        };
      }
      case CLIENT_MESSAGE_TYPES.AGENT_SESSION_LOG: {
        const sessionId = String(message.sessionId ?? '');
        const lines = this.store.getOutputLog(sessionId).getLines();
        await this.bridge.sendSessionLog(sessionId, lines);
        return {
          type: SERVER_MESSAGE_TYPES.AGENT_SESSION_LOG,
          sessionId,
          lines,
        };
      }
      case CLIENT_MESSAGE_TYPES.AGENT_SESSION_REFRESH: {
        await this.pushSessionListToPhone();
        // Replay anything still parked so a reconnecting phone can unblock it.
        for (const approval of this.hookRouter.listPendingApprovals()) {
          await this.bridge.sendPermissionRequest(approval);
        }
        return {
          type: SERVER_MESSAGE_TYPES.AGENT_SESSION_LIST,
          sessions: this.listSessions(),
          pendingApprovals: this.hookRouter.listPendingApprovals(),
        };
      }
      case CLIENT_MESSAGE_TYPES.AGENT_CLI_LIST: {
        const clis = await this.listLaunchableClis({ force: message.refresh === true });
        return {
          type: SERVER_MESSAGE_TYPES.AGENT_CLI_LIST,
          clis,
        };
      }
      case CLIENT_MESSAGE_TYPES.AGENT_ADAPTER_LIST: {
        const agents = await this.listAgents({ force: message.refresh === true });
        return {
          type: SERVER_MESSAGE_TYPES.AGENT_ADAPTER_LIST,
          agents,
        };
      }
      case CLIENT_MESSAGE_TYPES.AGENT_HOOK_INSTALL: {
        const agentId = String(message.agentId ?? '');
        const result = await this.installHooksForAgent(agentId);
        return {
          type: SERVER_MESSAGE_TYPES.AGENT_HOOK_INSTALL_RESULT,
          agentId,
          ...result,
        };
      }
      case CLIENT_MESSAGE_TYPES.AGENT_HOOK_UNINSTALL: {
        const agentId = String(message.agentId ?? '');
        const result = this.uninstallHooksForAgent(agentId);
        return {
          type: SERVER_MESSAGE_TYPES.AGENT_HOOK_UNINSTALL_RESULT,
          agentId,
          ...result,
        };
      }
      case CLIENT_MESSAGE_TYPES.AGENT_LAUNCH: {
        const result = await this.launchCli({
          cliId: String(message.cliId ?? ''),
          command: typeof message.command === 'string' ? message.command : '',
          args: Array.isArray(message.args) ? message.args.map(String) : [],
          cwd: typeof message.cwd === 'string' ? message.cwd : undefined,
        });
        await this.pushSessionListToPhone();
        return {
          type: SERVER_MESSAGE_TYPES.AGENT_LAUNCH_RESULT,
          cliId: String(message.cliId ?? ''),
          success: result.success,
          error: result.error,
          sessionId: result.session?.id,
        };
      }
      default:
        return null;
    }
  }

  /**
   * @param {{ force?: boolean }} [options]
   * @returns {Promise<import('./cli-availability').AvailableCli[]>}
   */
  async listLaunchableClis(options = {}) {
    try {
      return await listKnownClis(options);
    } catch (error) {
      console.error('[AgentSessions] Failed to list CLIs:', error);
      return [builtinTerminalCli()];
    }
  }

  /**
   * Start any installed CLI under a PTY. This is the one path that gives every
   * agent working input and output without a per-agent bridge plugin.
   * @param {{ cliId?: string; command?: string; args?: string[]; cwd?: string }} input
   * @returns {Promise<{ success: boolean; error?: string; session?: import('./session-store').AgentSessionSnapshot }>}
   */
  async launchCli(input) {
    const clis = await this.listLaunchableClis();
    const match = input.cliId ? clis.find((cli) => cli.id === input.cliId) : null;
    const isTerminal = String(input.cliId || match?.id || '') === 'terminal';
    const command = (match?.command || input.command || '').trim();

    if (!command && !isTerminal) {
      return { success: false, error: 'cli_not_found' };
    }

    const cwd =
      typeof input.cwd === 'string' && input.cwd.trim()
        ? input.cwd.trim()
        : os.homedir();

    try {
      const session = this.startSession({
        command: isTerminal ? '' : command,
        args: isTerminal ? [] : (input.args ?? []),
        cwd,
        label: isTerminal ? 'Terminal' : match?.label,
        agentId: isTerminal ? 'terminal' : match?.id ?? input.cliId ?? undefined,
        persistShell: isTerminal,
      });
      return { success: true, session };
    } catch (error) {
      console.error('[AgentSessions] Failed to launch CLI:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'launch_failed',
      };
    }
  }

  /**
   * @param {Record<string, unknown>} message
   * @param {import('net').Socket} socket
   * @returns {Promise<Record<string, unknown> | null>}
   */
  async handleSocketMessage(message, socket) {
    switch (message.type) {
      case 'run':
      case 'attach_run': {
        const command = String(message.command ?? '').trim();
        const attach = message.type === 'attach_run';
        if (!command && String(message.agentId || '') !== 'terminal') {
          return { type: 'error', message: 'command_required' };
        }
        const args = Array.isArray(message.args) ? message.args.map(String) : [];
        const session = this.startSession({
          command,
          args,
          cwd: typeof message.cwd === 'string' ? message.cwd : undefined,
          label: typeof message.label === 'string' ? message.label : undefined,
          agentId: typeof message.agentId === 'string' ? message.agentId : undefined,
          persistShell: String(message.agentId || '') === 'terminal',
          cols: Number(message.cols),
          rows: Number(message.rows),
        });
        if (attach) {
          this.bridgeRegistry.attach(session.id, socket);
        }
        return { type: attach ? 'attach_ok' : 'run_ack', ok: true, session };
      }
      case 'pty_attach': {
        const sessionId = String(message.sessionId ?? '');
        if (!this.store.getPty(sessionId)) {
          return { type: 'error', message: 'no_pty' };
        }
        this.bridgeRegistry.attach(sessionId, socket);
        return { type: 'attach_ok', ok: true, sessionId };
      }
      case 'pty_input': {
        const sessionId =
          String(message.sessionId ?? '') || this.bridgeRegistry.getSessionIdForSocket(socket) || '';
        if (!sessionId) {
          return { type: 'error', message: 'session_not_linked' };
        }
        const data = typeof message.data === 'string' ? message.data : String(message.text ?? '');
        const result = writeRawToSession(this.store, sessionId, data);
        return result.success ? null : { type: 'error', message: result.error };
      }
      case 'pty_resize': {
        const sessionId =
          String(message.sessionId ?? '') || this.bridgeRegistry.getSessionIdForSocket(socket) || '';
        if (!sessionId) {
          return { type: 'error', message: 'session_not_linked' };
        }
        const result = resizeSession(
          this.store,
          sessionId,
          Number(message.cols),
          Number(message.rows)
        );
        return result.success ? null : { type: 'error', message: result.error };
      }
      case 'bridge_register': {
        const pid = Number(message.pid);
        const agentId = typeof message.agentId === 'string' ? message.agentId : null;
        let session = Number.isFinite(pid) ? this.store.findByPid(pid) : null;
        if (!session && agentId) {
          session = this.store.findActiveByAgentId(agentId);
        }

        if (!session) {
          session = this.store.create({
            command: String(message.label || message.agentId || 'agent'),
            cwd: process.cwd(),
            label: String(message.label || message.agentId || 'Agent'),
            agentId,
            managed: false,
            interactive: true,
            pid: Number.isFinite(pid) ? pid : null,
            status: 'running',
            output: 'Bridge connected',
          });
        } else {
          session =
            this.store.update(session.id, {
              interactive: true,
              status: 'running',
              agentId: agentId || session.agentId,
              label: String(message.label || session.label),
              pid: Number.isFinite(pid) ? pid : session.pid,
            }) || session;
        }

        for (const removedId of this.removeDuplicateAgentSessions(agentId, session.id)) {
          void this.bridge.sendSessionRemove(removedId);
        }

        if (Number.isFinite(pid)) {
          this.bridgeRegistry.linkPid(pid, session.id);
        }
        this.bridgeRegistry.attach(session.id, socket);
        void this.bridge.sendSessionUpdate(session);
        void this.pushSessionListToPhone();
        return { type: 'bridge_registered', sessionId: session.id, ok: true };
      }
      case 'bridge_output': {
        const sessionId =
          String(message.sessionId ?? '') ||
          (Number.isFinite(Number(message.pid))
            ? this.bridgeRegistry.getSessionIdByPid(Number(message.pid))
            : null);
        if (!sessionId) {
          return { type: 'error', message: 'session_not_linked' };
        }
        const line = String(message.line ?? message.text ?? '').trim();
        if (line) {
          this.appendSessionLine(sessionId, line, message.level === 'error' ? 'error' : 'info');
        }
        return { type: 'bridge_output_ack', ok: true };
      }
      case 'hook_event':
        return this.hookRouter.handleHookEvent(message, socket);
      case 'list':
        return { type: 'list_result', sessions: this.store.list() };
      case 'stop': {
        const sessionId = String(message.sessionId ?? '');
        const result = this.stopSession(sessionId);
        return { type: 'stop_result', sessionId, ...result };
      }
      case 'ping':
        return { type: 'pong', host: os.hostname() };
      default:
        return { type: 'error', message: 'unknown_type' };
    }
  }

  registerIpcHandlers() {
    this.ipcRegistry.register('agent-sessions:list', async () => this.listSessions());

    this.ipcRegistry.register('agent-sessions:get', async (_event, sessionId) => {
      return this.store.get(String(sessionId ?? ''));
    });

    this.ipcRegistry.register('agent-sessions:run', async (_event, input) => {
      const command = String(input?.command ?? '').trim();
      if (!command) {
        throw new Error('command is required');
      }
      return this.startSession({
        command,
        args: Array.isArray(input?.args) ? input.args.map(String) : [],
        cwd: typeof input?.cwd === 'string' ? input.cwd : undefined,
        label: typeof input?.label === 'string' ? input.label : undefined,
        agentId: typeof input?.agentId === 'string' ? input.agentId : undefined,
      });
    });

    this.ipcRegistry.register('agent-sessions:stop', async (_event, sessionId) => {
      return this.stopSession(String(sessionId ?? ''));
    });

    this.ipcRegistry.register('agent-sessions:send-input', async (_event, payload) => {
      return this.sendInput(String(payload?.sessionId ?? ''), String(payload?.text ?? ''));
    });

    this.ipcRegistry.register('agent-sessions:get-log', async (_event, sessionId) => {
      const id = String(sessionId ?? '');
      return {
        sessionId: id,
        lines: this.store.getOutputLog(id).getLines(),
      };
    });

    this.ipcRegistry.register('agent-sessions:list-clis', async () => listKnownClis());

    this.ipcRegistry.register('agent-sessions:list-agents', async (_event, options) =>
      this.listAgents(options ?? {})
    );

    this.ipcRegistry.register('agent-sessions:install-hooks', async (_event, agentId) =>
      this.installHooksForAgent(String(agentId ?? ''))
    );

    this.ipcRegistry.register('agent-sessions:uninstall-hooks', async (_event, agentId) =>
      this.uninstallHooksForAgent(String(agentId ?? ''))
    );

    this.ipcRegistry.register('agent-sessions:install-shims', async () => this.installShims());
    this.ipcRegistry.register('agent-sessions:uninstall-shims', async () => this.uninstallShims());
    this.ipcRegistry.register('agent-sessions:shim-status', async () => this.getShimStatus());

    this.ipcRegistry.register('agent-sessions:get-defaults', async () => ({
      cwd: os.homedir(),
      socketPort: this.socketServer?.port ?? readSocketPort(),
    }));
  }

  async shutdown() {
    // Release parked agents first so no CLI is left waiting on a dead socket.
    this.hookRouter.clear();
    if (this.geminiBridgeRetryTimer) {
      clearInterval(this.geminiBridgeRetryTimer);
      this.geminiBridgeRetryTimer = null;
    }
    if (this.processWatcher) {
      this.processWatcher.stop();
      this.processWatcher = null;
    }
    for (const session of this.store.list()) {
      this.stopSession(session.id);
    }
    if (this.socketServer) {
      await this.socketServer.stop();
      this.socketServer = null;
    }
  }
}

module.exports = { AgentSessionService };
