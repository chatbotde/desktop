#!/usr/bin/env node

/**
 * Universal CLI launcher for Buddy agent sessions.
 * Usage: node scripts/buddy-run.js opencode
 *        node scripts/buddy-run.js opencode --help
 *        npm run agent:run -- opencode
 *
 * When shims are installed, prefer:
 *   claude / codex / gemini / opencode  (via ~/.buddy/bin)
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const net = require('net');

const DEFAULT_HOST = process.env.BUDDY_AGENT_SOCKET_HOST || '127.0.0.1';
const DEFAULT_PORT = Number(process.env.BUDDY_AGENT_SOCKET_PORT || 9876);
const SHIM_MANIFEST_PATH = path.join(os.homedir(), '.buddy', 'shims.json');

/**
 * @param {Record<string, unknown>} payload
 * @returns {Promise<Record<string, unknown>>}
 */
function sendRequest(payload) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: DEFAULT_HOST, port: DEFAULT_PORT }, () => {
      socket.write(`${JSON.stringify(payload)}\n`);
    });

    let buffer = '';
    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      const newlineIndex = buffer.indexOf('\n');
      if (newlineIndex >= 0) {
        const line = buffer.slice(0, newlineIndex).trim();
        socket.end();
        try {
          resolve(JSON.parse(line));
        } catch (error) {
          reject(error);
        }
      }
    });

    socket.on('error', (error) => {
      reject(error);
    });

    socket.setTimeout(10_000, () => {
      socket.destroy();
      reject(new Error('Timed out waiting for Buddy agent socket'));
    });
  });
}

function readShimEntry(commandName) {
  try {
    const manifest = JSON.parse(fs.readFileSync(SHIM_MANIFEST_PATH, 'utf8'));
    const entry = manifest?.shims?.[commandName];
    if (entry?.realPath && fs.existsSync(entry.realPath)) {
      return entry;
    }
  } catch {
    // ignore
  }
  return null;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log('Usage: buddy-run <command> [args...]');
    console.log('');
    console.log('Examples:');
    console.log('  npm run agent:run -- opencode');
    console.log('  npm run agent:run -- opencode --version');
    console.log('  claude          (after: npm run agent:install-shims)');
    console.log('');
    console.log('Requires Buddy (SonicThinking) to be running on this PC.');
    process.exit(args.length === 0 ? 1 : 0);
  }

  let command = args[0];
  let rest = args.slice(1);
  let label;
  let agentId;

  // Prefer absolute real binary from shim manifest to avoid recursion.
  const shim = readShimEntry(command);
  if (shim) {
    command = shim.realPath;
    label = shim.label;
    agentId = shim.agentId;
  }

  try {
    const response = await sendRequest({
      type: 'run',
      command,
      args: rest,
      cwd: process.cwd(),
      label,
      agentId,
    });

    if (response.type === 'error') {
      console.error(`Buddy agent error: ${response.message || 'unknown'}`);
      process.exit(1);
    }

    const session = response.session;
    if (session?.id) {
      console.log(`Started session ${session.id} (${session.label})`);
      console.log('Open the Agents tab on your phone to monitor, type, or stop it.');
    } else {
      console.log(JSON.stringify(response, null, 2));
    }
  } catch (error) {
    console.error('Could not reach Buddy agent socket.');
    console.error('Start Buddy on this PC first, then retry.');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
