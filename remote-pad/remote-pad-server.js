const WebSocket = require('ws');
const {
  CLIENT_MESSAGE_TYPES,
  SERVER_MESSAGE_TYPES,
  LAN_P2P_CLIENT_TYPES,
  PHONE_CAM_CLIENT_TYPES,
  AGENT_CLIENT_TYPES,
} = require('./protocol');
const { isMeshVpnAddress, normalizeIpAddress } = require('./network');
const { RemotePadInputHandler } = require('./input-handler');

/**
 * WebSocket server that translates remote-pad messages into MouseService calls.
 * Also forwards LAN WebRTC signaling for P2P video.
 */
class RemotePadServer {
  /**
   * @param {{
   *   ip?: string;
   *   port: number;
   *   pin: string;
   *   allowScreenView: boolean;
   *   preferLanMedia?: boolean;
   *   preferLanP2p?: boolean;
   *   lanHttpPort?: number;
   *   lanIp?: string;
   *   getLiveKitCredentials?: () => Promise<{ url: string; token: string; room: string } | null>;
   *   ensureLiveKitPublisher?: () => Promise<void>;
   *   ensureLanP2pPublisher?: () => Promise<void>;
   *   sendLanP2pSignal?: (message: Record<string, unknown>) => void;
   *   onPhoneCamSignalFromPhone?: (message: Record<string, unknown>) => void;
   *   onLanClientAuth?: () => void;
   *   onLanClientDisconnect?: () => void;
   *   onClientAuthenticated?: (socket: import('ws').WebSocket) => void;
   *   handleAgentMessage?: (message: Record<string, unknown>) => Promise<Record<string, unknown> | null>;
   *   inputHandler?: import('./input-handler').RemotePadInputHandler;
   * }} config
   * @param {(connectedClients: number) => void} [onClientCountChange]
   */
  constructor(config, onClientCountChange) {
    this.config = config;
    this.onClientCountChange = onClientCountChange;
    /** @type {import('ws').WebSocketServer | null} */
    this.wss = null;
    /** @type {Set<import('ws').WebSocket>} */
    this.authenticatedClients = new Set();
    /** @type {import('ws').WebSocket | null} */
    this.p2pViewerSocket = null;
    /** @type {ReturnType<typeof setInterval> | null} */
    this.heartbeatInterval = null;
    this.inputHandler = config.inputHandler || new RemotePadInputHandler();
  }

  /**
   * @returns {boolean}
   */
  isRunning() {
    return this.wss !== null;
  }

  /**
   * @returns {number}
   */
  getConnectedClientCount() {
    return this.authenticatedClients.size;
  }

  /**
   * Forward a signaling message from the P2P publisher to the active phone.
   * @param {Record<string, unknown>} message
   */
  sendP2pSignalToViewer(message) {
    if (this.p2pViewerSocket && this.authenticatedClients.has(this.p2pViewerSocket)) {
      this.send(this.p2pViewerSocket, message);
    }
  }

  /**
   * @returns {Promise<void>}
   */
  async start() {
    if (this.wss) {
      return;
    }

    await new Promise((resolve, reject) => {
      const wss = new WebSocket.Server({ port: this.config.port, host: '0.0.0.0' });

      wss.on('listening', () => {
        this.wss = wss;
        this.startHeartbeat();
        console.log(`[RemotePad] LAN fallback listening on port ${this.config.port}`);
        const host = this.config.ip || 'your-pc-ip';
        console.log(`[RemotePad] LAN connect — ws://${host}:${this.config.port} PIN: ${this.config.pin}`);
        console.log('[RemotePad] If phone cannot connect: allow ports 8765-8766 in Windows Firewall');
        resolve();
      });

      wss.on('error', (error) => {
        if (!this.wss) {
          reject(error);
          return;
        }
        console.error('[RemotePad] LAN server error:', error);
      });

      wss.on('connection', (socket) => {
        this.handleConnection(socket);
      });
    });
  }

  /**
   * @returns {Promise<void>}
   */
  async stop() {
    if (!this.wss) {
      return;
    }

    this.stopHeartbeat();
    for (const client of this.authenticatedClients) {
      client.close(1000, 'Server shutting down');
    }
    this.authenticatedClients.clear();
    this.p2pViewerSocket = null;
    this.notifyClientCountChange();

    await new Promise((resolve) => {
      this.wss.close(() => {
        this.wss = null;
        console.log('[RemotePad] LAN fallback stopped');
        resolve();
      });
    });
  }

  /**
   * Close all connected clients.
   */
  disconnectAll() {
    for (const client of this.authenticatedClients) {
      client.close(1000, 'Disconnected by user');
    }
    this.authenticatedClients.clear();
    this.p2pViewerSocket = null;
    this.notifyClientCountChange();
  }

  /**
   * @param {import('ws').WebSocket} socket
   */
  handleConnection(socket) {
    let authenticated = false;
    socket.isAlive = true;
    socket.on('pong', () => {
      socket.isAlive = true;
    });

    socket.on('message', async (raw) => {
      try {
        const message = JSON.parse(raw.toString());
        if (!authenticated) {
          authenticated = await this.handleAuth(socket, message);
          return;
        }

        if (LAN_P2P_CLIENT_TYPES.has(message.type)) {
          await this.handleLanP2pMessage(socket, message);
          return;
        }

        if (PHONE_CAM_CLIENT_TYPES.has(message.type)) {
          // Phone camera removed from desktop — ignore legacy phone cam signaling.
          return;
        }

        if (message.type === CLIENT_MESSAGE_TYPES.REQUEST_SCREENSHOT) {
          const response = await this.config.handleScreenshotRequest?.();
          if (response) {
            this.send(socket, response);
          }
          return;
        }

        if (AGENT_CLIENT_TYPES.has(message.type)) {
          const response = await this.config.handleAgentMessage?.(message);
          if (response) {
            this.send(socket, response);
          }
          return;
        }

        const response = await this.inputHandler.handleMessage(message);
        if (response) {
          this.send(socket, response);
        }
      } catch (error) {
        this.send(socket, {
          type: SERVER_MESSAGE_TYPES.ERROR,
          message: error instanceof Error ? error.message : 'Invalid message',
        });
      }
    });

    socket.on('close', () => {
      if (this.p2pViewerSocket === socket) {
        this.p2pViewerSocket = null;
        this.config.sendLanP2pSignal?.({ type: CLIENT_MESSAGE_TYPES.WEBRTC_HANGUP });
      }
      if (this.authenticatedClients.delete(socket)) {
        this.notifyClientCountChange();
        if (this.authenticatedClients.size === 0) {
          this.config.onLanClientDisconnect?.();
        }
      }
    });

    socket.on('error', (error) => {
      console.error('[RemotePad] LAN client socket error:', error);
    });
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (!this.wss) {
        return;
      }
      for (const socket of this.wss.clients) {
        if (socket.isAlive === false) {
          socket.terminate();
          continue;
        }
        socket.isAlive = false;
        try {
          socket.ping();
        } catch {
          socket.terminate();
        }
      }
    }, 5_000);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * @param {import('ws').WebSocket} socket
   * @param {Record<string, unknown>} message
   */
  async handleLanP2pMessage(socket, message) {
    this.p2pViewerSocket = socket;

    if (
      message.type === CLIENT_MESSAGE_TYPES.WEBRTC_REQUEST ||
      (message.type === CLIENT_MESSAGE_TYPES.SCREEN_SHARE && message.enabled !== false)
    ) {
      if (this.config.ensureLanP2pPublisher) {
        await this.config.ensureLanP2pPublisher();
      }
    }

    this.config.sendLanP2pSignal?.(message);
  }

  /**
   * @param {import('ws').WebSocket} socket
   * @param {Record<string, unknown>} message
   * @returns {Promise<boolean>}
   */
  async handleAuth(socket, message) {
    if (message.type !== CLIENT_MESSAGE_TYPES.AUTH) {
      this.send(socket, {
        type: SERVER_MESSAGE_TYPES.AUTH_FAIL,
        reason: 'auth_required',
      });
      socket.close(4001, 'Authentication required');
      return false;
    }

    const authResult = this.inputHandler.buildAuthResponse(
      String(message.pin ?? ''),
      this.config.pin,
      { allowScreenView: this.config.allowScreenView }
    );

    if (authResult.error) {
      this.send(socket, authResult.error);
      socket.close(4003, 'Invalid PIN');
      return false;
    }

    this.authenticatedClients.add(socket);
    this.notifyClientCountChange();

    /** @type {Record<string, unknown>} */
    const authOk = { ...authResult, transport: 'lan' };

    const useLanMedia =
      this.config.preferLanMedia !== false &&
      this.config.allowScreenView &&
      typeof this.config.lanHttpPort === 'number';

    const preferLanP2p = this.config.preferLanP2p !== false;

    if (useLanMedia) {
      const lanIp = this.config.lanIp || this.config.ip || '127.0.0.1';
      const localAddress = normalizeIpAddress(
        socket._socket?.localAddress || socket.localAddress || lanIp
      );
      // When the phone connected via Tailscale (100.x), advertise that IP for
      // MJPEG/upload — not the Wi‑Fi LAN address it cannot reach.
      const host =
        isMeshVpnAddress(localAddress) || (localAddress && localAddress !== lanIp)
          ? localAddress
          : lanIp;
      const pinParam = encodeURIComponent(this.config.pin);
      // Keep upload + MJPEG fallback URL; phone prefers P2P when lanP2p is true.
      authOk.lanStreamUrl = `http://${host}:${this.config.lanHttpPort}/stream?pin=${pinParam}`;
      authOk.lanUploadUrl = `http://${host}:${this.config.lanHttpPort}/upload?pin=${pinParam}`;
      authOk.lanMedia = true;
      authOk.lanP2p = preferLanP2p;
      this.p2pViewerSocket = socket;
      this.config.onLanClientAuth?.();
    } else if (this.config.allowScreenView && this.config.getLiveKitCredentials) {
      try {
        if (this.config.ensureLiveKitPublisher) {
          await this.config.ensureLiveKitPublisher();
        }
        const liveKit = await this.config.getLiveKitCredentials();
        if (liveKit) {
          authOk.livekitUrl = liveKit.url;
          authOk.livekitToken = liveKit.token;
          authOk.livekitRoom = liveKit.room;
        }
      } catch (error) {
        console.error('[RemotePad] Failed to create LiveKit subscriber token:', error);
      }
    }

    this.send(socket, authOk);

    this.config.onClientAuthenticated?.(socket);

    return true;
  }

  /**
   * @param {Record<string, unknown>} payload
   */
  sendToAuthenticatedClients(payload) {
    let sent = false;
    for (const client of this.authenticatedClients) {
      if (client.readyState === WebSocket.OPEN) {
        this.send(client, payload);
        sent = true;
      }
    }
    return sent;
  }

  /**
   * @param {import('ws').WebSocket} socket
   * @param {Record<string, unknown>} payload
   */
  send(socket, payload) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload));
    }
  }

  notifyClientCountChange() {
    if (this.onClientCountChange) {
      this.onClientCountChange(this.authenticatedClients.size);
    }
  }
}

module.exports = { RemotePadServer };
