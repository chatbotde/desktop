/**
 * OpenCode plugin — forwards session activity to Buddy agent hub on localhost:9876.
 * Install: npm run agent:install-opencode-bridge
 *
 * Set BUDDY_BRIDGE_DISABLED=1 to disable without uninstalling.
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
const BRIDGE_DISABLED = process.env.BUDDY_BRIDGE_DISABLED === '1';

/** @type {import('node:net').Socket | null} */
let socket = null;
/** @type {string | null} */
let buddySessionId = null;
/** @type {string | null} */
let opencodeSessionId = null;
/** @type {import('@opencode-ai/sdk').OpencodeClient | null} */
let activeClient = null;

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
    // ignore write failures on dead sockets
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
      agentId: 'opencode',
      pid: process.pid,
      label: 'OpenCode',
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

/**
 * @param {unknown} value
 * @returns {string}
 */
function stringifyEvent(value) {
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * @param {{ type?: string; properties?: Record<string, unknown> }} event
 * @returns {string | null}
 */
function formatEventLine(event) {
  const props = event.properties || {};

  if (event.type === 'message.part.updated' || event.type === 'message.updated') {
    const part = /** @type {Record<string, unknown>} */ (props.part || props);
    const text =
      part.text ||
      part.content ||
      props.text ||
      props.content;
    if (typeof text === 'string' && text.trim()) {
      return text.trim().slice(0, 800);
    }
    return null;
  }

  if (event.type === 'session.error') {
    return `[error] ${stringifyEvent(props).slice(0, 400)}`;
  }

  return null;
}

/**
 * @param {string} text
 */
async function handlePhoneInput(text) {
  const trimmed = text.trim();
  if (!trimmed || !activeClient) {
    return;
  }

  try {
    await activeClient.tui.appendPrompt({
      body: { text: trimmed.endsWith(' ') ? trimmed : `${trimmed} ` },
    });
    await activeClient.tui.submitPrompt();
    return;
  } catch (tuiError) {
    if (!opencodeSessionId) {
      send({
        type: 'bridge_output',
        sessionId: buddySessionId,
        pid: process.pid,
        line: `[error] Phone input failed: ${tuiError instanceof Error ? tuiError.message : 'tui_failed'}`,
        level: 'error',
      });
      return;
    }

    try {
      await activeClient.session.prompt({
        path: { id: opencodeSessionId },
        body: {
          parts: [{ type: 'text', text: trimmed }],
        },
      });
    } catch (sessionError) {
      send({
        type: 'bridge_output',
        sessionId: buddySessionId,
        pid: process.pid,
        line: `[error] Phone input failed: ${sessionError instanceof Error ? sessionError.message : 'prompt_failed'}`,
        level: 'error',
      });
    }
  }
}

function bootstrapBridge(client) {
  activeClient = client;

  void client.session
    .list()
    .then((sessions) => {
      const latest = sessions.data?.[0] || sessions.data?.at?.(-1);
      if (latest?.id) {
        opencodeSessionId = latest.id;
      }
    })
    .catch(() => {
      // session list is optional at startup
    });

  setTimeout(connectBridge, 0);
}

export const BuddyBridgePlugin = async ({ client }) => {
  if (!BRIDGE_DISABLED) {
    bootstrapBridge(client);
  } else {
    activeClient = client;
  }

  return {
    event: async ({ event }) => {
      if (BRIDGE_DISABLED || !event?.type) {
        return;
      }

      if (event.type === 'session.created' || event.type === 'session.updated') {
        const id = event.properties?.id || event.properties?.sessionID || event.properties?.sessionId;
        if (typeof id === 'string' && id) {
          opencodeSessionId = id;
        }
      }

      const line = formatEventLine(event);
      if (!line) {
        return;
      }

      send({
        type: 'bridge_output',
        sessionId: buddySessionId,
        pid: process.pid,
        line,
        level: event.type === 'session.error' ? 'error' : 'info',
      });
    },
  };
};

export default BuddyBridgePlugin;
