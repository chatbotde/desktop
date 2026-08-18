const net = require('net');
const { safeSocketWrite, attachSocketErrorHandler, isBenignSocketError } = require('./socket-utils');
const {
  DEFAULT_PORT,
  readSocketPort,
  writeSocketPort,
  clearSocketPort,
} = require('./socket-port');

const MAX_PORT_RETRIES = 10;

class AgentSessionSocketServer {
  /**
   * @param {(message: Record<string, unknown>, socket: import('net').Socket) => Promise<Record<string, unknown> | null>} onMessage
   * @param {{ port?: number; host?: string }} [options]
   */
  constructor(onMessage, options = {}) {
    this.onMessage = onMessage;
    this.port = options.port ?? readSocketPort();
    this.host = options.host ?? '127.0.0.1';
    /** @type {net.Server | null} */
    this.server = null;
  }

  /**
   * @returns {Promise<number>}
   */
  start() {
    if (this.server) {
      return Promise.resolve(this.port);
    }

    const server = net.createServer((socket) => {
      attachSocketErrorHandler(socket);
      let buffer = '';

      const clearBuffer = () => {
        buffer = '';
      };

      socket.on('end', clearBuffer);
      socket.on('close', clearBuffer);

      socket.on('data', (chunk) => {
        void (async () => {
          try {
            buffer += chunk.toString('utf8');
            let newlineIndex = buffer.indexOf('\n');
            while (newlineIndex >= 0) {
              const line = buffer.slice(0, newlineIndex).trim();
              buffer = buffer.slice(newlineIndex + 1);
              if (line.length > 0) {
                await this.handleLine(socket, line);
              }
              newlineIndex = buffer.indexOf('\n');
            }
          } catch (error) {
            if (!isBenignSocketError(error)) {
              console.warn('[AgentSessions] Socket data handler error:', error);
            }
          }
        })();
      });
    });

    server.on('error', (error) => {
      if (this.server) {
        console.error('[AgentSessions] Socket server error:', error);
      }
    });

    const tryListen = (port, attempt) =>
      new Promise((resolve, reject) => {
        const onError = (error) => {
          server.removeListener('listening', onListening);
          if (error?.code === 'EADDRINUSE' && attempt < MAX_PORT_RETRIES) {
            console.warn(
              `[AgentSessions] Port ${port} in use, trying ${port + 1} (close other Buddy instances if this persists)`
            );
            tryListen(port + 1, attempt + 1).then(resolve).catch(reject);
            return;
          }
          reject(error);
        };

        const onListening = () => {
          server.removeListener('error', onError);
          this.server = server;
          this.port = port;
          writeSocketPort(port);
          console.log(`[AgentSessions] Socket listening on ${this.host}:${port}`);
          resolve(port);
        };

        server.once('error', onError);
        server.listen(port, this.host, onListening);
      });

    return tryListen(this.port, 0);
  }

  /**
   * @returns {Promise<void>}
   */
  async stop() {
    if (!this.server) {
      return;
    }

    await new Promise((resolve) => {
      this.server.close(() => {
        this.server = null;
        clearSocketPort();
        resolve();
      });
    });
  }

  /**
   * @param {import('net').Socket} socket
   * @param {string} line
   */
  async handleLine(socket, line) {
    if (socket.destroyed) {
      return;
    }

    try {
      const message = JSON.parse(line);
      const response = await this.onMessage(message, socket);
      if (response) {
        safeSocketWrite(socket, response);
      }
    } catch (error) {
      if (isBenignSocketError(error)) {
        return;
      }
      safeSocketWrite(socket, {
        type: 'error',
        message: error instanceof Error ? error.message : 'invalid_message',
      });
    }
  }
}

module.exports = { AgentSessionSocketServer, DEFAULT_PORT };
