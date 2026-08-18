const path = require('path');
const pty = require('@homebridge/node-pty-prebuilt-multiarch');
const { resolveAgentFromBinary } = require('../cli-manifest');

/**
 * Common process wrapper — PTY lifecycle shared by every CLI agent.
 * stdin/stdout/stderr flow through the pseudo-terminal; agent-specific logic
 * lives in adapters/ and hooks/.
 */

/**
 * @param {{ command?: string; agentId?: string | null }} input
 * @returns {boolean}
 */
function isTerminalLaunch(input) {
  const agentId = String(input.agentId || '').toLowerCase();
  if (agentId === 'terminal' || agentId === 'shell') {
    return true;
  }
  const raw = String(input.command || '').trim();
  if (!raw) {
    return true;
  }
  const base = path.basename(raw, path.extname(raw)).toLowerCase();
  return base === 'terminal' || base === 'shell';
}

/**
 * @param {string} binary
 * @param {string[]} args
 * @returns {string}
 */
function buildCommandLine(binary, args) {
  if (!binary) {
    return '';
  }
  const invocation =
    process.platform === 'win32' && /\s/.test(binary) ? `& "${binary}"` : binary;
  return [invocation, ...args].join(' ');
}

/**
 * Decide how to spawn the PTY. A Terminal session is a real interactive shell.
 * A CLI session runs that command so phone stdin reaches the program.
 *
 * @param {{
 *   command?: string;
 *   args?: string[];
 *   agentId?: string | null;
 *   persistShell?: boolean;
 *   cols?: number;
 *   rows?: number;
 * }} input
 */
function buildPtyLaunch(input) {
  const args = Array.isArray(input.args) ? input.args : [];
  const binary = String(input.command || '').trim();
  const persistShell = input.persistShell === true || isTerminalLaunch(input);
  const commandLine = persistShell && isTerminalLaunch(input) ? '' : buildCommandLine(binary, args);
  const cols = Number.isFinite(input.cols) && input.cols > 0 ? input.cols : 120;
  const rows = Number.isFinite(input.rows) && input.rows > 0 ? input.rows : 32;

  if (process.platform === 'win32') {
    if (persistShell) {
      return {
        file: 'powershell.exe',
        args: ['-NoLogo', '-NoExit'],
        startCommand: commandLine || null,
        cols,
        rows,
      };
    }
    return {
      file: 'powershell.exe',
      args: ['-NoLogo', '-NoProfile', '-Command', commandLine],
      startCommand: null,
      cols,
      rows,
    };
  }

  const shell = process.env.SHELL || 'bash';
  if (persistShell) {
    return {
      file: shell,
      args: ['-l'],
      startCommand: commandLine || null,
      cols,
      rows,
    };
  }
  return {
    file: shell,
    args: ['-lc', commandLine],
    startCommand: null,
    cols,
    rows,
  };
}

/**
 * @param {import('../session-store').SessionStore} store
 * @param {string} sessionId
 * @param {string} text
 * @returns {{ success: boolean; error?: string }}
 */
function sendInputToSession(store, sessionId, text) {
  const payload = String(text ?? '');
  if (!payload) {
    return { success: false, error: 'empty_input' };
  }
  return writeRawToSession(
    store,
    sessionId,
    payload.endsWith('\n') || payload.endsWith('\r') ? payload.replace(/\n$/, '\r') : `${payload}\r`
  );
}

/**
 * Write bytes into the PTY with no extra newline. Used for attached local terminals.
 *
 * @param {import('../session-store').SessionStore} store
 * @param {string} sessionId
 * @param {string} data
 * @returns {{ success: boolean; error?: string }}
 */
function writeRawToSession(store, sessionId, data) {
  const term = store.getPty(sessionId);
  if (!term) {
    return { success: false, error: 'no_pty' };
  }

  try {
    term.write(String(data ?? ''));
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'write_failed',
    };
  }
}

/**
 * @param {import('../session-store').SessionStore} store
 * @param {string} sessionId
 * @param {number} cols
 * @param {number} rows
 * @returns {{ success: boolean; error?: string }}
 */
function resizeSession(store, sessionId, cols, rows) {
  const term = store.getPty(sessionId);
  if (!term) {
    return { success: false, error: 'no_pty' };
  }
  const nextCols = Number(cols);
  const nextRows = Number(rows);
  if (!Number.isFinite(nextCols) || !Number.isFinite(nextRows) || nextCols < 2 || nextRows < 2) {
    return { success: false, error: 'invalid_size' };
  }
  try {
    term.resize(nextCols, nextRows);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'resize_failed',
    };
  }
}

/**
 * @param {import('../session-store').SessionStore} store
 * @param {{
 *   command: string;
 *   args?: string[];
 *   cwd?: string;
 *   label?: string;
 *   agentId?: string | null;
 *   persistShell?: boolean;
 *   cols?: number;
 *   rows?: number;
 *   onUpdate?: (session: import('../session-store').AgentSessionSnapshot) => void;
 *   onOutput?: (payload: { sessionId: string; lines: string[]; chunk: string }) => void;
 *   onRawData?: (payload: { sessionId: string; data: string }) => void;
 *   onRemove?: (session: import('../session-store').AgentSessionSnapshot) => void;
 * }} input
 * @returns {import('../session-store').AgentSessionSnapshot}
 */
function runManagedCommand(store, input) {
  const args = Array.isArray(input.args) ? input.args : [];
  const cwd = input.cwd ? path.resolve(input.cwd) : require('os').homedir();
  const binary = String(input.command || '').trim();
  const terminal = isTerminalLaunch(input);
  const resolved = terminal ? { id: 'terminal', label: 'Terminal' } : resolveAgentFromBinary(binary);
  const displayLine = terminal
    ? 'Terminal'
    : [binary, ...args].filter(Boolean).join(' ') || 'Terminal';
  const launch = buildPtyLaunch(input);

  const session = store.create({
    command: displayLine,
    cwd,
    label: resolved?.label || input.label || (terminal ? 'Terminal' : binary),
    agentId: resolved?.id ?? input.agentId ?? (terminal ? 'terminal' : binary),
    managed: true,
    interactive: true,
    status: 'starting',
  });

  const sessionLog = store.getOutputLog(session.id);
  sessionLog.appendLine(terminal ? 'Terminal ready — type commands from your phone.' : `Starting ${displayLine}`);

  const term = pty.spawn(launch.file, launch.args, {
    name: 'xterm-256color',
    cols: launch.cols,
    rows: launch.rows,
    cwd,
    env: {
      ...process.env,
      BUDDY_SESSION_ID: session.id,
      BUDDY_MANAGED: '1',
      TERM: 'xterm-256color',
    },
  });

  store.attachPty(session.id, term);
  input.onUpdate?.(store.get(session.id));

  if (launch.startCommand) {
    setTimeout(() => {
      try {
        term.write(`${launch.startCommand}\r`);
      } catch {
        // PTY already gone
      }
    }, 250);
  }

  term.onData((data) => {
    const lines = sessionLog.appendChunk(data);
    const summary = sessionLog.getSummary();
    const updated = store.update(session.id, { output: summary, status: 'running' });
    input.onRawData?.({ sessionId: session.id, data });
    if (updated) {
      input.onUpdate?.(updated);
      if (lines.length > 0) {
        input.onOutput?.({ sessionId: session.id, lines, chunk: data });
      }
    }
  });

  term.onExit(({ exitCode }) => {
    sessionLog.appendLine(`Process exited (${exitCode})`);
    const updated = store.update(session.id, {
      status: exitCode === 0 ? 'stopped' : 'error',
      exitCode,
      output: sessionLog.getSummary(),
    });
    if (updated) {
      input.onUpdate?.(updated);
      input.onRemove?.(updated);
    }
    store.remove(session.id);
  });

  return store.get(session.id);
}

/**
 * @param {import('../session-store').SessionStore} store
 * @param {string} sessionId
 * @returns {{ success: boolean; error?: string }}
 */
function stopManagedSession(store, sessionId) {
  const term = store.getPty(sessionId);
  if (!term) {
    return { success: false, error: 'session_not_found' };
  }

  try {
    term.kill();
    store.update(sessionId, { status: 'stopped' });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'stop_failed',
    };
  }
}

module.exports = {
  runManagedCommand,
  stopManagedSession,
  sendInputToSession,
  writeRawToSession,
  resizeSession,
  isTerminalLaunch,
  buildPtyLaunch,
};
