/**
 * Minimal MCP stdio server for Gemini CLI extension loading.
 * Starts the Buddy bridge daemon and stays alive for the Gemini session.
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const extensionDir = path.dirname(fileURLToPath(import.meta.url));

function startBridgeDaemon() {
  const child = spawn(process.execPath, [path.join(extensionDir, 'bridge-daemon.mjs')], {
    detached: true,
    stdio: 'ignore',
    env: {
      ...process.env,
      BUDDY_GEMINI_PID: String(process.ppid),
    },
  });
  child.unref();
}

startBridgeDaemon();

/** @param {Record<string, unknown>} message */
function handleMessage(message) {
  const id = message.id;
  const method = message.method;

  if (method === 'initialize' && id !== undefined) {
    writeResponse(id, {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'buddy-bridge', version: '1.0.0' },
    });
    return;
  }

  if (method === 'tools/list' && id !== undefined) {
    writeResponse(id, { tools: [] });
    return;
  }

  if (method === 'ping' && id !== undefined) {
    writeResponse(id, {});
    return;
  }

  if (id !== undefined) {
    writeResponse(id, {});
  }
}

/** @param {string | number} id @param {Record<string, unknown>} result */
function writeResponse(id, result) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, result })}\n`);
}

let buffer = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;
  let newlineIndex = buffer.indexOf('\n');
  while (newlineIndex >= 0) {
    const line = buffer.slice(0, newlineIndex).trim();
    buffer = buffer.slice(newlineIndex + 1);
    newlineIndex = buffer.indexOf('\n');
    if (!line) {
      continue;
    }
    try {
      handleMessage(JSON.parse(line));
    } catch {
      // ignore malformed MCP frames
    }
  }
});

process.stdin.on('end', () => {
  process.exit(0);
});
