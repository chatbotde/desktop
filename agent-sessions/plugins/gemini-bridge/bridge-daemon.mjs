/**
 * Buddy bridge daemon for Gemini CLI.
 * Connects to Buddy socket, forwards model output from logs.json, injects phone input.
 */
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const extensionDir = path.dirname(fileURLToPath(import.meta.url));

const SOCKET_HOST = process.env.BUDDY_AGENT_SOCKET_HOST || '127.0.0.1';

function resolveSocketPort() {
  if (process.env.BUDDY_AGENT_SOCKET_PORT) {
    const fromEnv = Number(process.env.BUDDY_AGENT_SOCKET_PORT);
    if (Number.isFinite(fromEnv) && fromEnv > 0) {
      return fromEnv;
    }
  }

  try {
    const portFile = path.join(os.homedir(), '.buddy', 'agent-socket-port.json');
    const data = JSON.parse(fs.readFileSync(portFile, 'utf8'));
    const port = Number(data?.port);
    if (Number.isFinite(port) && port > 0) {
      return port;
    }
  } catch {
    // fall through
  }

  return 9876;
}

const SOCKET_PORT = resolveSocketPort();
const BRIDGE_DISABLED = process.env.BUDDY_BRIDGE_DISABLED === '1';
const GEMINI_TMP_ROOT = path.join(os.homedir(), '.gemini', 'tmp');
const LOCK_FILE = path.join(os.homedir(), '.gemini', 'buddy-bridge.lock');

function acquireDaemonLock() {
  const targetGeminiPid = String(process.env.BUDDY_GEMINI_PID || process.ppid || '');

  try {
    if (fs.existsSync(LOCK_FILE)) {
      const raw = fs.readFileSync(LOCK_FILE, 'utf8').trim();
      const [daemonPidRaw, geminiPidRaw] = raw.split(':');
      const daemonPid = Number(daemonPidRaw);
      const geminiPid = geminiPidRaw || '';

      if (
        Number.isFinite(daemonPid) &&
        daemonPid > 0 &&
        geminiPid === targetGeminiPid
      ) {
        try {
          process.kill(daemonPid, 0);
          return false;
        } catch {
          // stale lock
        }
      }
    }

    fs.mkdirSync(path.dirname(LOCK_FILE), { recursive: true });
    fs.writeFileSync(LOCK_FILE, `${process.pid}:${targetGeminiPid}`);
    return true;
  } catch {
    return true;
  }
}

if (!acquireDaemonLock()) {
  process.exit(0);
}

process.on('exit', () => {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      fs.unlinkSync(LOCK_FILE);
    }
  } catch {
    // ignore lock cleanup errors
  }
});

/** @type {net.Socket | null} */
let socket = null;
/** @type {string | null} */
let buddySessionId = null;
/** @type {Map<string, number>} */
const lastMessageIdByLogFile = new Map();
/** @type {Set<string>} */
const recentPhoneInputs = new Set();

/**
 * @param {Record<string, unknown>} payload
 */
function send(payload) {
  if (!socket || socket.destroyed) {
    return;
  }
  try {
    socket.write(`${JSON.stringify(payload)}\n`);
  } catch {
    // ignore dead socket writes
  }
}

function scheduleReconnect() {
  setTimeout(connectBridge, 2000);
}

function connectBridge() {
  if (BRIDGE_DISABLED || (socket && !socket.destroyed)) {
    return;
  }

  socket = net.createConnection({ host: SOCKET_HOST, port: SOCKET_PORT }, () => {
    send({
      type: 'bridge_register',
      agentId: 'gemini-cli',
      pid: resolveGeminiPid(),
      label: 'Gemini CLI',
    });
  });

  socket.on('data', (chunk) => {
    const lines = chunk.toString('utf8').split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const message = JSON.parse(line);
        if (message.type === 'bridge_registered') {
          buddySessionId = message.sessionId || null;
        }
        if (message.type === 'bridge_input' && message.text) {
          void handlePhoneInput(String(message.text));
        }
      } catch {
        // ignore malformed bridge messages
      }
    }
  });

  socket.on('close', () => {
    socket = null;
    buddySessionId = null;
    if (!BRIDGE_DISABLED) {
      scheduleReconnect();
    }
  });

  socket.on('error', () => {
    socket?.destroy();
    socket = null;
    buddySessionId = null;
    if (!BRIDGE_DISABLED) {
      scheduleReconnect();
    }
  });
}

function resolveGeminiPid() {
  const fromEnv = Number(process.env.BUDDY_GEMINI_PID);
  if (Number.isFinite(fromEnv) && fromEnv > 0) {
    return fromEnv;
  }
  return process.ppid;
}

/**
 * @param {string} text
 */
async function handlePhoneInput(text) {
  const trimmed = text.trim();
  if (!trimmed) {
    return;
  }

  recentPhoneInputs.add(trimmed.toLowerCase());
  setTimeout(() => recentPhoneInputs.delete(trimmed.toLowerCase()), 15_000);

  const pid = resolveGeminiPid();
  try {
    if (process.platform === 'win32') {
      await execFileAsync(
        'powershell.exe',
        [
          '-NoProfile',
          '-ExecutionPolicy',
          'Bypass',
          '-File',
          path.join(extensionDir, 'inject-input.ps1'),
          String(pid),
          trimmed,
        ],
        { windowsHide: true, timeout: 10_000 }
      );
      return;
    }

    await execFileAsync(path.join(extensionDir, 'inject-input.sh'), [String(pid), trimmed], {
      timeout: 10_000,
    });
  } catch (error) {
    send({
      type: 'bridge_output',
      sessionId: buddySessionId,
      pid,
      line: `[error] Phone input failed — keep the Gemini terminal focused. ${error instanceof Error ? error.message : 'inject_failed'}`,
      level: 'error',
    });
  }
}

/**
 * @param {string} logFilePath
 */
async function scanLogFile(logFilePath) {
  let raw = '';
  try {
    raw = await fs.promises.readFile(logFilePath, 'utf8');
  } catch {
    return;
  }

  /** @type {Array<{ sessionId: string; messageId: number; type: string; message: string }>} */
  let entries = [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      entries = parsed;
    }
  } catch {
    return;
  }

  const lastSeen = lastMessageIdByLogFile.get(logFilePath) ?? -1;
  let maxId = lastSeen;

  for (const entry of entries) {
    const messageId = Number(entry.messageId);
    if (!Number.isFinite(messageId) || messageId <= lastSeen) {
      continue;
    }

    maxId = Math.max(maxId, messageId);
    const type = String(entry.type || '');
    const message = String(entry.message || '').trim();
    if (!message) {
      continue;
    }

    if (type === 'user') {
      if (recentPhoneInputs.has(message.toLowerCase())) {
        continue;
      }
      continue;
    }

    if (type === 'model' || type === 'assistant' || type === 'gemini') {
      send({
        type: 'bridge_output',
        sessionId: buddySessionId,
        pid: resolveGeminiPid(),
        line: message.slice(0, 800),
        level: 'info',
      });
    }
  }

  if (maxId > lastSeen) {
    lastMessageIdByLogFile.set(logFilePath, maxId);
  }
}

/**
 * @param {string} dir
 */
async function scanTmpDirectory(dir) {
  let entries = [];
  try {
    entries = await fs.promises.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const logPath = path.join(fullPath, 'logs.json');
      if (fs.existsSync(logPath)) {
        await scanLogFile(logPath);
      }
      continue;
    }
    if (entry.isFile() && entry.name === 'logs.json') {
      await scanLogFile(fullPath);
    }
  }
}

function startLogWatcher() {
  if (!fs.existsSync(GEMINI_TMP_ROOT)) {
    fs.mkdirSync(GEMINI_TMP_ROOT, { recursive: true });
  }

  void scanTmpDirectory(GEMINI_TMP_ROOT);

  try {
    fs.watch(GEMINI_TMP_ROOT, { recursive: true }, (_event, filename) => {
      if (!filename || !String(filename).endsWith('logs.json')) {
        return;
      }
      const logPath = path.join(GEMINI_TMP_ROOT, String(filename));
      void scanLogFile(logPath);
    });
  } catch {
    setInterval(() => {
      void scanTmpDirectory(GEMINI_TMP_ROOT);
    }, 2000);
  }
}

if (!BRIDGE_DISABLED) {
  connectBridge();
  startLogWatcher();
}
