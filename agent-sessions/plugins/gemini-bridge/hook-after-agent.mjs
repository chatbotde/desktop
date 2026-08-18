/**
 * Forwards Gemini AfterAgent hook output to Buddy (newer gemini-cli with hooks).
 */
import net from 'node:net';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

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

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

/**
 * @param {Record<string, unknown>} payload
 */
function sendOnce(payload) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: SOCKET_HOST, port: SOCKET_PORT }, () => {
      socket.write(`${JSON.stringify(payload)}\n`);
      socket.end();
    });
    socket.on('close', resolve);
    socket.on('error', () => resolve());
    setTimeout(() => {
      socket.destroy();
      resolve();
    }, 3000);
  });
}

const raw = await readStdin();
if (!raw.trim()) {
  process.exit(0);
}

let input;
try {
  input = JSON.parse(raw);
} catch {
  process.exit(0);
}

const response = String(input.prompt_response || '').trim();
if (!response) {
  process.stdout.write(JSON.stringify({}));
  process.exit(0);
}

await sendOnce({
  type: 'bridge_output',
  pid: process.ppid,
  line: response.slice(0, 800),
  level: 'info',
});

process.stdout.write(JSON.stringify({}));
