const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const GEMINI_BRIDGE_DAEMON = path.join(
  os.homedir(),
  '.gemini',
  'extensions',
  'buddy-bridge',
  'bridge-daemon.mjs'
);

/** @type {Map<number, number>} pid -> last spawn attempt ms */
const lastSpawnAttempt = new Map();

const RETRY_MS = 15_000;

/**
 * @param {import('./session-store').AgentSessionSnapshot} session
 * @param {{ forceRetry?: boolean }} [options]
 */
function maybeSpawnGeminiBridge(session, options = {}) {
  if (session.agentId !== 'gemini-cli' || session.interactive || session.managed) {
    return;
  }
  if (!session.pid) {
    return;
  }

  const now = Date.now();
  const lastAttempt = lastSpawnAttempt.get(session.pid) ?? 0;
  if (!options.forceRetry && now - lastAttempt < RETRY_MS) {
    return;
  }

  if (!fs.existsSync(GEMINI_BRIDGE_DAEMON)) {
    return;
  }

  lastSpawnAttempt.set(session.pid, now);

  try {
    const child = spawn(process.execPath, [GEMINI_BRIDGE_DAEMON], {
      detached: true,
      stdio: 'ignore',
      env: {
        ...process.env,
        BUDDY_GEMINI_PID: String(session.pid),
      },
    });
    child.unref();
    console.log(`[AgentSessions] Started Gemini bridge daemon for pid ${session.pid}`);
  } catch (error) {
    lastSpawnAttempt.delete(session.pid);
    console.warn('[AgentSessions] Failed to start Gemini bridge daemon:', error);
  }
}

/**
 * @param {number} pid
 */
function clearGeminiBridgeSpawn(pid) {
  if (Number.isFinite(pid)) {
    lastSpawnAttempt.delete(pid);
  }
}

module.exports = { maybeSpawnGeminiBridge, clearGeminiBridgeSpawn };
