#!/usr/bin/env node
/**
 * SonicThinking hook forwarder — relays CLI lifecycle events to localhost:9876.
 * Installed copy: ~/.buddy/hooks/buddy-hook-forwarder.js
 */

const net = require('net');
const path = require('path');

const DEFAULT_PORT = 9876;
const CONNECT_TIMEOUT_MS = 1000;
const DECISION_TIMEOUT_MS = 110_000;

/** @returns {number} */
function resolveSocketPort() {
  if (process.env.BUDDY_AGENT_SOCKET_PORT) {
    const fromEnv = Number(process.env.BUDDY_AGENT_SOCKET_PORT);
    if (Number.isFinite(fromEnv) && fromEnv > 0) {
      return fromEnv;
    }
  }

  try {
    const portFile = path.join(require('os').homedir(), '.buddy', 'agent-socket-port.json');
    const data = JSON.parse(require('fs').readFileSync(portFile, 'utf8'));
    const port = Number(data?.port);
    if (Number.isFinite(port) && port > 0) {
      return port;
    }
  } catch {
    // fall through
  }

  return DEFAULT_PORT;
}

/** @type {(agentId: string, event: string, response: Record<string, unknown> | null) => string} */
let renderDecision;
try {
  renderDecision = require(path.join(__dirname, 'buddy-hook-decisions.js')).renderDecision;
} catch {
  renderDecision = require('./decisions.js').renderDecision;
}

/**
 * @param {string[]} argv
 * @returns {{ agent: string; event: string; block: boolean; port: number }}
 */
function parseArgs(argv) {
  const options = { agent: '', event: '', block: false, port: resolveSocketPort() };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === '--block') {
      options.block = true;
    } else if (flag === '--agent') {
      options.agent = argv[++index] || '';
    } else if (flag === '--event') {
      options.event = argv[++index] || '';
    } else if (flag === '--port') {
      options.port = Number(argv[++index]) || DEFAULT_PORT;
    }
  }
  return options;
}

/**
 * @returns {Promise<string>}
 */
function readStdin() {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) {
      resolve('');
      return;
    }

    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', () => resolve(data));
  });
}

/**
 * @param {Record<string, unknown>} message
 * @param {{ port: number; wait: boolean }} options
 * @returns {Promise<Record<string, unknown> | null>}
 */
function sendToBuddy(message, options) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      socket.destroy();
      resolve(value);
    };

    const timer = setTimeout(
      () => finish(null),
      options.wait ? DECISION_TIMEOUT_MS : CONNECT_TIMEOUT_MS
    );

    const socket = net.createConnection({ port: options.port, host: '127.0.0.1' });
    socket.setTimeout(options.wait ? DECISION_TIMEOUT_MS : CONNECT_TIMEOUT_MS);

    socket.on('error', () => finish(null));
    socket.on('timeout', () => finish(null));
    socket.on('close', () => finish(null));

    socket.on('connect', () => {
      const line = `${JSON.stringify(message)}\n`;
      if (options.wait) {
        socket.write(line);
      } else {
        socket.end(line);
      }
    });

    let buffer = '';
    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      let newlineIndex = buffer.indexOf('\n');
      while (newlineIndex >= 0) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        if (line) {
          try {
            finish(JSON.parse(line));
            return;
          } catch {
            // keep reading
          }
        }
        newlineIndex = buffer.indexOf('\n');
      }
    });
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const raw = await readStdin();

  /** @type {Record<string, unknown>} */
  let payload = {};
  if (raw.trim()) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = { raw: raw.slice(0, 4000) };
    }
  }

  const response = await sendToBuddy(
    {
      type: 'hook_event',
      agentId: options.agent,
      event: options.event,
      blocking: options.block,
      cwd: process.cwd(),
      pid: process.ppid,
      payload,
    },
    { port: options.port, wait: options.block }
  );

  if (options.block) {
    const output = renderDecision(options.agent, options.event, response);
    if (output) {
      process.stdout.write(output);
    }
  }

  process.exit(0);
}

main().catch(() => process.exit(0));
