const fs = require('fs');
const os = require('os');
const path = require('path');

const DEFAULT_PORT = 9876;
const PORT_FILE = path.join(os.homedir(), '.buddy', 'agent-socket-port.json');

/**
 * @returns {number}
 */
function readSocketPort() {
  if (process.env.BUDDY_AGENT_SOCKET_PORT) {
    const fromEnv = Number(process.env.BUDDY_AGENT_SOCKET_PORT);
    if (Number.isFinite(fromEnv) && fromEnv > 0) {
      return fromEnv;
    }
  }

  try {
    const raw = fs.readFileSync(PORT_FILE, 'utf8');
    const data = JSON.parse(raw);
    const port = Number(data?.port);
    if (Number.isFinite(port) && port > 0) {
      return port;
    }
  } catch {
    // fall through
  }

  return DEFAULT_PORT;
}

/**
 * @param {number} port
 */
function writeSocketPort(port) {
  fs.mkdirSync(path.dirname(PORT_FILE), { recursive: true });
  fs.writeFileSync(
    PORT_FILE,
    JSON.stringify({ port, pid: process.pid, updatedAt: new Date().toISOString() }, null, 2)
  );
}

function clearSocketPort() {
  try {
    fs.unlinkSync(PORT_FILE);
  } catch {
    // ignore
  }
}

module.exports = {
  DEFAULT_PORT,
  PORT_FILE,
  readSocketPort,
  writeSocketPort,
  clearSocketPort,
};
