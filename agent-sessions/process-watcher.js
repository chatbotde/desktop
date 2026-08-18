const { execFile } = require('child_process');
const { promisify } = require('util');
const { loadManifest } = require('./cli-manifest');
const { resolveAgentFromProcess } = require('./cli-auto-detect');
const { getGlobalCliRegistry, buildGlobalCliIndexes } = require('./cli-global-registry');

const execFileAsync = promisify(execFile);

const ACTIVE_STATUSES = new Set(['starting', 'running', 'waiting', 'paused']);

/**
 * @returns {Promise<Array<{ pid: number; name: string; commandLine: string }>>}
 */
async function listProcesses() {
  if (process.platform === 'win32') {
    const { stdout } = await execFileAsync(
      'powershell.exe',
      [
        '-NoProfile',
        '-Command',
        "Get-CimInstance Win32_Process | Select-Object ProcessId,Name,CommandLine | ConvertTo-Json -Compress",
      ],
      { maxBuffer: 20 * 1024 * 1024, windowsHide: true }
    );

    const trimmed = stdout.trim();
    if (!trimmed) {
      return [];
    }

    const parsed = JSON.parse(trimmed);
    const rows = Array.isArray(parsed) ? parsed : [parsed];
    return rows
      .map((row) => ({
        pid: Number(row.ProcessId),
        name: String(row.Name || ''),
        commandLine: String(row.CommandLine || ''),
      }))
      .filter((row) => Number.isFinite(row.pid) && row.pid > 0);
  }

  const { stdout } = await execFileAsync('ps', ['-ax', '-o', 'pid=,command='], {
    maxBuffer: 20 * 1024 * 1024,
  });

  return stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(\d+)\s+(.*)$/);
      if (!match) {
        return null;
      }
      return {
        pid: Number(match[1]),
        name: match[2].split(/\s+/)[0] || '',
        commandLine: match[2],
      };
    })
    .filter((row) => row && Number.isFinite(row.pid));
}

/**
 * @param {import('./session-store').SessionStore} store
 * @param {string} agentId
 * @returns {boolean}
 */
function hasManagedActiveSession(store, agentId) {
  return store
    .list()
    .some(
      (session) =>
        session.managed &&
        session.agentId === agentId &&
        ACTIVE_STATUSES.has(session.status)
    );
}

class ProcessWatcher {
  /**
   * @param {import('./session-store').SessionStore} store
   * @param {{
   *   onDiscovered?: (session: import('./session-store').AgentSessionSnapshot) => void;
   *   onLost?: (session: import('./session-store').AgentSessionSnapshot) => void;
   *   intervalMs?: number;
   * }} [options]
   */
  constructor(store, options = {}) {
    this.store = store;
    this.onDiscovered = options.onDiscovered || (() => {});
    this.onLost = options.onLost || (() => {});
    this.intervalMs = options.intervalMs ?? 3000;
    /** @type {ReturnType<typeof setInterval> | null} */
    this.timer = null;
    this.inFlight = false;
    this.registryRefreshTimer = null;
  }

  async refreshGlobalRegistry(force = false) {
    const registry = await getGlobalCliRegistry({ force });
    this.globalIndexes = buildGlobalCliIndexes(registry);
    return registry;
  }

  start() {
    if (this.timer) {
      return;
    }
    void this.refreshGlobalRegistry(true);
    this.registryRefreshTimer = setInterval(() => {
      void this.refreshGlobalRegistry(false);
    }, 5 * 60 * 1000);
    void this.poll();
    this.timer = setInterval(() => {
      void this.poll();
    }, this.intervalMs);
    console.log('[AgentSessions] Process watcher started (global CLI registry + auto-detect)');
  }

  stop() {
    if (this.registryRefreshTimer) {
      clearInterval(this.registryRefreshTimer);
      this.registryRefreshTimer = null;
    }
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async poll() {
    if (this.inFlight) {
      return;
    }
    this.inFlight = true;

    try {
      const manifest = loadManifest();
      if (!this.globalIndexes) {
        await this.refreshGlobalRegistry(false);
      }
      const processes = await listProcesses();
      /** @type {Map<number, { agentId: string; label: string; command: string }>} */
      const discovered = new Map();

      for (const proc of processes) {
        const match = resolveAgentFromProcess(proc, manifest, this.globalIndexes);
        if (!match) {
          continue;
        }
        if (hasManagedActiveSession(this.store, match.agentId)) {
          continue;
        }

        discovered.set(proc.pid, {
          agentId: match.agentId,
          label: match.label,
          command: proc.commandLine.trim() || match.agentId,
        });
      }

      const trackedPids = new Set(
        this.store
          .list()
          .filter((session) => !session.managed && session.pid)
          .map((session) => session.pid)
      );

      for (const session of this.store.list()) {
        if (session.managed || !session.pid) {
          continue;
        }
        if (!discovered.has(session.pid)) {
          const removed = this.store.remove(session.id);
          if (removed) {
            this.onLost(removed);
          }
        }
      }

      for (const [pid, info] of discovered.entries()) {
        if (this.store.findByPid(pid)) {
          continue;
        }

        const existingForAgent = this.store.findActiveByAgentId(info.agentId);
        if (existingForAgent) {
          if (!existingForAgent.pid || existingForAgent.pid !== pid) {
            const updated = this.store.update(existingForAgent.id, {
              pid,
              command: info.command,
            });
            if (updated) {
              this.onDiscovered(updated);
            }
          }
          continue;
        }

        if (trackedPids.has(pid)) {
          continue;
        }

        const session = this.store.create({
          command: info.command,
          cwd: process.cwd(),
          label: info.label,
          agentId: info.agentId,
          managed: false,
          interactive: false,
          pid,
          status: 'running',
          output: 'Detected running process',
        });
        this.onDiscovered(session);
      }
    } catch (error) {
      console.warn('[AgentSessions] Process watcher poll failed:', error);
    } finally {
      this.inFlight = false;
    }
  }
}

module.exports = { ProcessWatcher, listProcesses };
