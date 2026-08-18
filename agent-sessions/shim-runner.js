#!/usr/bin/env node

/**
 * Global agent shim runner (copied to ~/.buddy/bin).
 * Usage:
 *   node buddy-shim-runner.js claude [-- args...]
 *   node buddy-shim-runner.js --print-real claude
 *
 * Starts the CLI as a Buddy-managed PTY and attaches this terminal to it, so
 * the local window and the phone share the same stdin/stdout.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const net = require('net');
const { spawn } = require('child_process');

const DEFAULT_HOST = process.env.BUDDY_AGENT_SOCKET_HOST || '127.0.0.1';
const SHIM_MANIFEST_PATH = path.join(os.homedir(), '.buddy', 'shims.json');

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

function readManifest() {
  try {
    return JSON.parse(fs.readFileSync(SHIM_MANIFEST_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function getShimEntry(name) {
  const manifest = readManifest();
  const entry = manifest.shims?.[name];
  if (!entry || typeof entry !== 'object') return null;
  return entry;
}

function runReal(realPath, args) {
  const child = spawn(realPath, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32' && /\.(cmd|bat)$/i.test(realPath),
    windowsHide: false,
    env: {
      ...process.env,
      BUDDY_SHIM_BYPASS: '1',
    },
  });
  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 1);
  });
  child.on('error', (error) => {
    console.error(`Failed to start ${realPath}:`, error.message);
    process.exit(1);
  });
}

/**
 * Keep a TCP connection open for the whole PTY session.
 * @returns {Promise<import('net').Socket>}
 */
function connectSocket() {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: DEFAULT_HOST, port: resolveSocketPort() }, () => {
      resolve(socket);
    });
    socket.once('error', reject);
    socket.setTimeout(8_000, () => {
      socket.destroy();
      reject(new Error('Timed out waiting for Buddy agent socket'));
    });
  });
}

/**
 * @param {import('net').Socket} socket
 * @param {Record<string, unknown>} payload
 */
function sendJson(socket, payload) {
  if (!socket || socket.destroyed || !socket.writable) {
    return;
  }
  socket.write(`${JSON.stringify(payload)}\n`);
}

/**
 * Attach this process's stdin/stdout to a Buddy-owned PTY.
 *
 * @param {{
 *   command: string;
 *   args: string[];
 *   cwd: string;
 *   label?: string;
 *   agentId?: string;
 * }} input
 * @returns {Promise<number>}
 */
async function attachToBuddy(input) {
  const socket = await connectSocket();
  socket.setTimeout(0);

  return new Promise((resolve, reject) => {
    let buffer = '';
    let rawMode = false;
    let finished = false;

    const restoreStdin = () => {
      if (!rawMode || !process.stdin.isTTY) {
        return;
      }
      try {
        process.stdin.setRawMode(false);
      } catch {
        // ignore
      }
      rawMode = false;
    };

    const finish = (code) => {
      if (finished) {
        return;
      }
      finished = true;
      restoreStdin();
      try {
        socket.destroy();
      } catch {
        // ignore
      }
      resolve(typeof code === 'number' ? code : 0);
    };

    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      let newlineIndex = buffer.indexOf('\n');
      while (newlineIndex >= 0) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        newlineIndex = buffer.indexOf('\n');
        if (!line) {
          continue;
        }
        let message;
        try {
          message = JSON.parse(line);
        } catch {
          continue;
        }

        if (message.type === 'error') {
          restoreStdin();
          reject(new Error(String(message.message || 'attach_failed')));
          return;
        }

        if (message.type === 'pty_output' && typeof message.data === 'string') {
          process.stdout.write(message.data);
        }

        if (message.type === 'pty_exit') {
          finish(Number(message.exitCode) || 0);
        }
      }
    });

    socket.on('close', () => finish(0));
    socket.on('error', (error) => {
      restoreStdin();
      reject(error);
    });

    sendJson(socket, {
      type: 'attach_run',
      command: input.command,
      args: input.args,
      cwd: input.cwd,
      label: input.label,
      agentId: input.agentId,
      cols: process.stdout.columns || 120,
      rows: process.stdout.rows || 32,
    });

    if (process.stdin.isTTY) {
      try {
        process.stdin.setRawMode(true);
        rawMode = true;
      } catch {
        rawMode = false;
      }
    }
    process.stdin.resume();
    process.stdin.on('data', (chunk) => {
      const data = Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);
      sendJson(socket, { type: 'pty_input', data });
    });

    const onResize = () => {
      sendJson(socket, {
        type: 'pty_resize',
        cols: process.stdout.columns || 120,
        rows: process.stdout.rows || 32,
      });
    };
    process.stdout.on('resize', onResize);
  });
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv[0] === '--print-real') {
    const name = argv[1];
    const entry = getShimEntry(name);
    if (entry?.realPath) {
      process.stdout.write(String(entry.realPath));
      process.exit(0);
    }
    process.exit(1);
  }

  const name = argv[0];
  const args = argv.slice(1);
  if (!name || name === '--help' || name === '-h') {
    console.log('Usage: buddy-shim-runner <command> [args...]');
    process.exit(name ? 0 : 1);
  }

  // Already inside a Buddy-managed PTY — never recurse through the socket.
  if (process.env.BUDDY_SESSION_ID || process.env.BUDDY_MANAGED === '1') {
    const entry = getShimEntry(name);
    if (entry?.realPath) {
      runReal(entry.realPath, args);
      return;
    }
    console.error(`Buddy shim: no real path for "${name}" while inside managed session.`);
    process.exit(1);
  }

  const entry = getShimEntry(name);
  const realPath = entry?.realPath;
  if (!realPath || !fs.existsSync(realPath)) {
    console.error(`Buddy shim: real binary for "${name}" not found. Re-run shim install.`);
    process.exit(1);
  }

  try {
    const code = await attachToBuddy({
      command: realPath,
      args,
      cwd: process.cwd(),
      label: entry.label || name,
      agentId: entry.agentId || name,
    });
    process.exit(code);
  } catch (error) {
    console.warn('Buddy is not reachable — running locally (not mirrored to phone).');
    console.warn(error instanceof Error ? error.message : String(error));
    runReal(realPath, args);
  }
}

main();
