const BENIGN_SOCKET_ERROR_CODES = new Set([
  'ECONNRESET',
  'EPIPE',
  'ECANCELED',
  'ERR_STREAM_DESTROYED',
  'ECONNABORTED',
]);

/**
 * @param {unknown} error
 * @returns {boolean}
 */
function isBenignSocketError(error) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const code = 'code' in error ? String(error.code) : '';
  if (BENIGN_SOCKET_ERROR_CODES.has(code)) {
    return true;
  }

  const message = error instanceof Error ? error.message : String(error);
  return /ECONNRESET|EPIPE|ECANCELED|ERR_STREAM_DESTROYED|ECONNABORTED/i.test(message);
}

let processSafetyHandlersInstalled = false;

/**
 * @param {import('net').Socket} socket
 * @param {Record<string, unknown>} payload
 * @returns {boolean}
 */
function safeSocketWrite(socket, payload) {
  if (!socket || socket.destroyed || !socket.writable) {
    return false;
  }

  try {
    socket.write(`${JSON.stringify(payload)}\n`);
    return true;
  } catch (error) {
    if (!isBenignSocketError(error)) {
      console.warn('[AgentSessions] Socket write failed:', error);
    }
    return false;
  }
}

/**
 * @param {import('net').Socket} socket
 * @param {(error: Error) => void} [onFatalError]
 */
function attachSocketErrorHandler(socket, onFatalError) {
  if (!socket || socket.destroyed || socket.__buddySocketErrorHandlerAttached) {
    return;
  }

  socket.__buddySocketErrorHandlerAttached = true;
  socket.on('error', (error) => {
    if (isBenignSocketError(error)) {
      return;
    }
    if (onFatalError) {
      onFatalError(error);
      return;
    }
    console.warn('[AgentSessions] Socket error:', error instanceof Error ? error.message : error);
  });
}

/**
 * Prevent abrupt TCP disconnects (e.g. OpenCode bridge exit) from crashing Electron.
 */
function installProcessSocketSafetyHandlers() {
  if (processSafetyHandlersInstalled) {
    return;
  }
  processSafetyHandlersInstalled = true;

  process.on('uncaughtException', (error) => {
    if (isBenignSocketError(error)) {
      return;
    }
    console.error('[Buddy] Uncaught exception:', error);
  });

  process.on('unhandledRejection', (reason) => {
    if (isBenignSocketError(reason)) {
      return;
    }
    console.error('[Buddy] Unhandled rejection:', reason);
  });
}

module.exports = {
  isBenignSocketError,
  safeSocketWrite,
  attachSocketErrorHandler,
  installProcessSocketSafetyHandlers,
};
