const crypto = require('crypto');
const { BrowserWindow } = require('electron');
const path = require('path');
const { RemotePadServer } = require('./remote-pad-server');
const { getLocalIpAddress, getMeshVpnAddresses, isMeshVpnAddress } = require('./network');
const { DEFAULT_PORT, LAN_HTTP_PORT_OFFSET, SERVER_MESSAGE_TYPES, CLIENT_MESSAGE_TYPES } = require('./protocol');
const { loadConfig, saveConfig, getOrCreateBuddyId, getOrCreatePin } = require('./store');
const { buildPairingPayload, toDataUrl } = require('./qr');
const { LiveKitStreamPublisher } = require('./livekit-stream');
const { LanHttpServer } = require('./lan-http-server');
const { LanStreamCapture } = require('./lan-stream-capture');
const { LanP2pPublisher } = require('./lan-p2p');
const { LanBeacon } = require('./lan-beacon');
const { RemotePadInputHandler } = require('./input-handler');
const { RemotePadCloudPairing } = require('./cloud-pairing');
const { ClipboardSyncService } = require('./clipboard-sync');
const {
  sendBytesToPhone,
  sendFilePathToPhone,
  TransferCancelledError,
} = require('./phone-file-sender');
const { capturePrimaryScreenPng } = require('./desktop-screenshot');
const {
  getLiveKitConfig,
  createLiveKitToken,
  getRoomName,
} = require('./livekit-token');
const {
  ensureWindowsFirewallRules,
  getWindowsFirewallStatus,
  openWindowsFirewallSetup,
} = require('./windows-firewall');

/**
 * Remote Pad — LiveKit-first remote control with optional LAN WebSocket fallback.
 */
class RemotePadService {
  /**
   * @param {import('../ipc-handler-registry').IpcHandlerRegistry} ipcRegistry
   */
  constructor(ipcRegistry) {
    this.ipcRegistry = ipcRegistry;
    this.config = loadConfig();
    this.enabled = true;
    this.port = this.config.port ?? DEFAULT_PORT;
    this.allowScreenView = this.config.allowScreenView ?? true;
    if (!this.allowScreenView && this.preferLanP2p) {
      console.warn(
        '[RemotePad] Screen view is OFF — LAN P2P video will not work. Enable it in Settings → Remote connection.'
      );
    }
    this.lanFallbackEnabled = this.config.lanFallbackEnabled ?? true;
    this.preferLanMedia = this.config.preferLanMedia ?? true;
    /** Prefer LAN WebRTC P2P over MJPEG when on same Wi‑Fi. */
    this.preferLanP2p = this.config.preferLanP2p ?? true;
    this.clipboardSyncEnabled = this.config.clipboardSyncEnabled ?? false;
    /** Optional manual Tailscale / mesh IP (100.x.x.x) — overrides auto-detect for QR. */
    this.meshHostOverride = typeof this.config.meshHostOverride === 'string'
      ? this.config.meshHostOverride.trim()
      : '';
    this.lanHttpPort = this.port + LAN_HTTP_PORT_OFFSET;
    this.buddyId = getOrCreateBuddyId(this.config);
    this.pin = getOrCreatePin(this.config);
    /** @type {RemotePadServer | null} */
    this.server = null;
    this.connectedClients = 0;
    /** @type {import('electron').BrowserWindow | null} */
    this.pairingWindow = null;
    this.liveKitPublisher = new LiveKitStreamPublisher();
    this.lanP2pPublisher = new LanP2pPublisher();
    this.lanP2pPublisher.setSignalHandler((message) => {
      this.server?.sendP2pSignalToViewer(message);
    });
    this.lanHttpServer = new LanHttpServer(
      { port: this.lanHttpPort, pin: this.pin, ip: getLocalIpAddress() },
      {
        onViewerChange: (count) => {
          void this.syncLanCapture(count);
        },
      }
    );
    this.lanStreamCapture = new LanStreamCapture();
    this.lanStreamCapture.setFrameHandler((buffer) => {
      this.lanHttpServer.pushFrame(buffer);
    });
    this.lanBeacon = new LanBeacon();
    this.liveKitRoomName = getRoomName(this.buddyId);
    this.inputHandler = new RemotePadInputHandler();
    this.inputHandler.onClipboardFromPhone = (syncId) => {
      this.clipboardSync.noteRemoteUpdate(syncId);
    };
    /** @type {{ transferId: string; cancel: boolean } | null} */
    this.activeOutgoingTransfer = null;
    this.inputHandler.onFileTransferCancel = (transferId) => {
      if (
        this.activeOutgoingTransfer &&
        (!transferId || transferId === this.activeOutgoingTransfer.transferId)
      ) {
        this.activeOutgoingTransfer.cancel = true;
      }
    };
    this.inputHandler.onFileTransferProgress = (progress) => {
      this.emitFileTransferProgress(progress);
    };
    this.clipboardSync = new ClipboardSyncService();
    this.cloudPairing = new RemotePadCloudPairing(() => this.createSubscriberCredentials());
    /** @type {ReturnType<typeof setInterval> | null} */
    this.wakePollInterval = null;
    this.wakePollInFlight = false;
    /** Phone authenticated over LiveKit (cloud) — LAN uses connectedClients. */
    this.liveKitPhoneActive = false;
    /** @type {import('../agent-sessions').AgentSessionService | null} */
    this.agentSessionService = null;

    if (this.isLiveKitConfigured()) {
      this.lanFallbackEnabled = this.config.lanFallbackEnabled ?? true;
    } else {
      this.lanFallbackEnabled = true;
    }

    saveConfig({
      ...this.config,
      buddyId: this.buddyId,
      pin: this.pin,
      port: this.port,
      lanFallbackEnabled: this.lanFallbackEnabled,
      allowScreenView: this.allowScreenView,
      preferLanMedia: this.preferLanMedia,
      preferLanP2p: this.preferLanP2p,
      clipboardSyncEnabled: this.clipboardSyncEnabled,
    });
    this.refreshClipboardSync();
  }

  refreshClipboardSync() {
    this.clipboardSync.configure(
      this.clipboardSyncEnabled,
      async (payload) => {
        if (!this.isPhoneReachable()) {
          return false;
        }
        return this.broadcastToPhone(payload);
      },
    );
  }

  /**
   * @returns {boolean}
   */
  isLiveKitConfigured() {
    return getLiveKitConfig() !== null;
  }

  /**
   * Start the LAN WebRTC publisher window (idempotent).
   * @returns {Promise<void>}
   */
  async ensureLanP2pPublisher() {
    if (!this.enabled || !this.allowScreenView || !this.preferLanMedia || !this.preferLanP2p) {
      return;
    }
    await this.lanP2pPublisher.start();
  }

  /**
   * @returns {Promise<{ url: string; token: string } | null>}
   */
  async createPublisherCredentials() {
    const config = getLiveKitConfig();
    if (!config) {
      return null;
    }

    const token = await createLiveKitToken(this.liveKitRoomName, `buddy-${this.buddyId}`, {
      canPublish: true,
      canSubscribe: true,
    });

    return { url: config.url, token };
  }

  /**
   * @returns {Promise<{ url: string; token: string; room: string } | null>}
   */
  async createSubscriberCredentials() {
    const config = getLiveKitConfig();
    if (!config) {
      return null;
    }

    const identity = `remote-${crypto.randomBytes(4).toString('hex')}`;
    const token = await createLiveKitToken(this.liveKitRoomName, identity, {
      canPublish: true,
      canSubscribe: true,
    });

    return {
      url: config.url,
      token,
      room: this.liveKitRoomName,
    };
  }

  rebuildLanHttpServer() {
    const lanIp = getLocalIpAddress();
    this.lanHttpServer = new LanHttpServer(
      { port: this.lanHttpPort, pin: this.pin, ip: lanIp },
      {
        onViewerChange: (count) => {
          void this.syncLanCapture(count);
        },
      }
    );
    this.lanStreamCapture.setFrameHandler((buffer) => {
      this.lanHttpServer.pushFrame(buffer);
    });
    return lanIp;
  }

  async syncLanCapture(viewerCount = this.lanHttpServer.getViewerCount()) {
    // MJPEG starts only when a client hits /stream (P2P path never does).
    const shouldCapture =
      this.enabled && this.allowScreenView && this.preferLanMedia && viewerCount > 0;

    if (shouldCapture && !this.lanStreamCapture.isRunning()) {
      await this.lanStreamCapture.start();
    } else if (!shouldCapture && this.lanStreamCapture.isRunning()) {
      await this.lanStreamCapture.stop();
    }
  }

  /**
   * @returns {Promise<void>}
   */
  async syncLiveKitPublisher() {
    if (!this.isLiveKitConfigured() || !this.enabled) {
      await this.liveKitPublisher.stop();
      return;
    }

    const credentials = await this.createPublisherCredentials();
    if (!credentials) {
      return;
    }

    try {
      await this.liveKitPublisher.start({
        ...credentials,
        allowScreenView: this.allowScreenView,
      });
      console.log(`[RemotePad] LiveKit session started (room ${this.liveKitRoomName})`);
    } catch (error) {
      console.warn('[RemotePad] LiveKit publisher start failed, retrying once:', error);
      await new Promise((resolve) => setTimeout(resolve, 750));
      try {
        await this.liveKitPublisher.start({
          ...credentials,
          allowScreenView: this.allowScreenView,
        });
        console.log(`[RemotePad] LiveKit session started after retry (room ${this.liveKitRoomName})`);
      } catch (retryError) {
        console.error('[RemotePad] Failed to start LiveKit session:', retryError);
      }
    }
  }

  /**
   * Restore cloud signaling after a direct P2P session ends. Relay sessions
   * keep the signaling room connected and stop only their capture tracks.
   */
  async onLiveKitSessionIdle() {
    this.liveKitPhoneActive = false;
    if (!this.liveKitPublisher.isRunning()) {
      return;
    }

    if (this.enabled && this.isLiveKitConfigured() && this.cloudPairing.isConfigured()) {
      await this.syncLiveKitPublisher();
      console.log('[RemotePad] LiveKit signaling restored for the next cloud connection');
      return;
    }

    await this.liveKitPublisher.stop();
    console.log('[RemotePad] LiveKit stopped — idle until next phone connect');
  }

  startWakePoller() {
    if (this.wakePollInterval || !this.isLiveKitConfigured()) {
      return;
    }

    this.wakePollInterval = setInterval(() => {
      void this.pollForConnectionRequest();
    }, 1_000);
  }

  stopWakePoller() {
    if (this.wakePollInterval) {
      clearInterval(this.wakePollInterval);
      this.wakePollInterval = null;
    }
    this.wakePollInFlight = false;
  }

  async pollForConnectionRequest() {
    if (
      !this.enabled ||
      !this.isLiveKitConfigured() ||
      this.liveKitPublisher.isRunning() ||
      this.wakePollInFlight
    ) {
      return;
    }

    this.wakePollInFlight = true;
    try {
      const requested = await this.cloudPairing.checkConnectionRequest(this.buddyId);
      if (!requested) {
        return;
      }

      await this.cloudPairing.clearConnectionRequest(this.buddyId);
      console.log('[RemotePad] Phone requested session — starting LiveKit');
      await this.syncLiveKitPublisher();
    } catch (error) {
      console.error('[RemotePad] Wake poll error:', error);
    } finally {
      this.wakePollInFlight = false;
    }
  }

  setup() {
    this.registerIpcHandlers();
    if (this.enabled) {
      this.startServer().catch((error) => {
        console.error('[RemotePad] Failed to auto-start:', error);
      });
    }
  }

  /**
   * Effective mesh/VPN host for QR: manual override, else auto-detected Tailscale IP.
   * @returns {string | null}
   */
  resolveMeshHost() {
    if (this.meshHostOverride && isMeshVpnAddress(this.meshHostOverride)) {
      return this.meshHostOverride;
    }
    const detected = getMeshVpnAddresses();
    return detected[0] ?? null;
  }

  /**
   * @returns {import('../frontend/src/types/electron').RemotePadStatus}
   */
  getStatus() {
    const meshVpnIps = getMeshVpnAddresses();
    const meshVpnDetected = meshVpnIps[0] ?? null;
    const meshVpnIp = this.resolveMeshHost();
    return {
      enabled: this.enabled,
      running: this.isLiveKitConfigured()
        ? this.liveKitPublisher.isRunning() || (this.server?.isRunning() ?? false)
        : (this.server?.isRunning() ?? false),
      connectedClients: this.connectedClients,
      phoneConnected: this.connectedClients > 0 || this.liveKitPhoneActive,
      buddyId: this.buddyId,
      ip: getLocalIpAddress(),
      meshVpnIp,
      meshVpnDetected,
      meshHostOverride: this.meshHostOverride || null,
      meshVpnIps,
      port: this.port,
      pin: this.pin,
      allowScreenView: this.allowScreenView,
      lanFallbackEnabled: this.lanFallbackEnabled,
      liveKitConfigured: this.isLiveKitConfigured(),
      liveKitStreaming: this.liveKitPublisher.isRunning(),
      preferLiveKit: this.isLiveKitConfigured(),
      preferLanMedia: this.preferLanMedia,
      preferLanP2p: this.preferLanP2p,
      lanP2pRunning: this.lanP2pPublisher.isRunning(),
      lanHttpRunning: this.lanHttpServer.isRunning(),
      lanHttpPort: this.lanHttpPort,
      clipboardSyncEnabled: this.clipboardSyncEnabled,
      cloudPairingConfigured: this.cloudPairing.isConfigured(),
      cloudPairingActive: this.cloudPairing.running,
      phoneCameraActive: false,
      phoneCameraRequested: false,
      phoneCamera: { available: false },
      windowsFirewall: getWindowsFirewallStatus(),
    };
  }

  getCloudPresenceParams() {
    const livekit = getLiveKitConfig();
    if (!livekit) {
      return null;
    }

    return {
      buddyId: this.buddyId,
      pin: this.pin,
      livekitUrl: livekit.url,
      livekitRoom: this.liveKitRoomName,
    };
  }

  async syncCloudPairing() {
    const params = this.getCloudPresenceParams();
    if (!this.enabled || !params || !this.cloudPairing.isConfigured()) {
      await this.cloudPairing.stop(this.buddyId);
      return;
    }

    await this.cloudPairing.start(params);
  }

  async getPairingPayload() {
    const status = this.getStatus();
    const livekitConfig = getLiveKitConfig();
    const cloudPublic = this.cloudPairing.getPublicConfig();
    const lanIp = status.ip !== '127.0.0.1' ? status.ip : undefined;
    const meshHost = status.meshVpnIp ?? undefined;

    // Start LiveKit when QR is generated so scan/connect works without an app rebuild.
    if (livekitConfig && this.enabled) {
      await this.syncLiveKitPublisher();
    }

    if (livekitConfig && cloudPublic?.url && cloudPublic.anonKey) {
      await this.syncCloudPairing();
      const livekit = await this.createSubscriberCredentials();

      return buildPairingPayload({
        id: status.buddyId,
        host: lanIp,
        meshHost,
        port: status.port,
        pin: status.pin,
        livekit,
        cloud: {
          livekitUrl: livekitConfig.url,
          livekitRoom: this.liveKitRoomName,
          supabaseUrl: cloudPublic.url,
          supabaseAnonKey: cloudPublic.anonKey,
        },
      });
    }

    const livekit = this.isLiveKitConfigured()
      ? await this.createSubscriberCredentials()
      : null;

    return buildPairingPayload({
      id: status.buddyId,
      host: lanIp ?? (this.lanFallbackEnabled ? status.ip : undefined),
      meshHost,
      port: status.port,
      pin: status.pin,
      livekit,
    });
  }

  async getQrCodeDataUrl() {
    return toDataUrl(await this.getPairingPayload());
  }

  async startServer() {
    // Keep the desktop participant available immediately. This makes direct
    // LiveKit QR connections work after Buddy restarts, even before LAN or the
    // cloud wake-up channel is available.
    await this.syncLiveKitPublisher();

    await this.syncCloudPairing();
    this.startWakePoller();
    void this.pollForConnectionRequest();

    if (this.enabled && !this.server?.isRunning()) {
      const lanIp = this.rebuildLanHttpServer();

      if (!this.lanHttpServer.isRunning()) {
        await this.lanHttpServer.start();
      }

      this.server = new RemotePadServer(
        {
          ip: lanIp,
          port: this.port,
          pin: this.pin,
          allowScreenView: this.allowScreenView,
          preferLanMedia: this.preferLanMedia,
          preferLanP2p: this.preferLanP2p,
          lanHttpPort: this.lanHttpPort,
          lanIp,
          getLiveKitCredentials: () => this.createSubscriberCredentials(),
          ensureLiveKitPublisher: () => this.syncLiveKitPublisher(),
          ensureLanP2pPublisher: () => this.ensureLanP2pPublisher(),
          sendLanP2pSignal: (message) => this.lanP2pPublisher.sendToPublisher(message),
          onLanClientDisconnect: () => {
            void this.syncLanCapture(0);
            void this.lanP2pPublisher.stop();
          },
          handleScreenshotRequest: () => this.handleScreenshotRequest(),
          handleAgentMessage: (message) => this.handleAgentClientMessage(message),
          inputHandler: this.inputHandler,
          onClientAuthenticated: () => {
            void this.agentSessionService?.pushSessionListToPhone();
            this.refreshClipboardSync();
          },
        },
        (count) => {
          this.connectedClients = count;
        }
      );

      await this.server.start();
      ensureWindowsFirewallRules(this.port, this.lanHttpPort);
      this.lanBeacon.start({ buddyId: this.buddyId, port: this.port });
      const meshIp = this.resolveMeshHost();
      if (meshIp) {
        console.log(`[RemotePad] VPN/mesh connect — ws://${meshIp}:${this.port} PIN: ${this.pin}`);
      }
    }

    if (!this.isLiveKitConfigured() && !this.server?.isRunning()) {
      console.warn('[RemotePad] LiveKit is not configured and LAN fallback is disabled');
    }

    return this.getStatus();
  }

  async stopServer() {
    this.stopWakePoller();
    this.lanBeacon.stop();
    this.clipboardSync.stop();
    await this.cloudPairing.stop(this.buddyId);
    await this.liveKitPublisher.stop();
    await this.lanP2pPublisher.stop();
    await this.lanStreamCapture.stop();
    if (this.lanHttpServer?.isRunning()) {
      await this.lanHttpServer.stop();
    }
    if (this.server) {
      await this.server.stop();
      this.server = null;
      this.connectedClients = 0;
    }
    return this.getStatus();
  }

  async disconnectAllClients() {
    if (this.server) {
      this.server.disconnectAll();
    }
    this.liveKitPhoneActive = false;
    await this.liveKitPublisher.stop();
    await this.lanP2pPublisher.stop();
    console.log('[RemotePad] Disconnected all clients');
    return this.getStatus();
  }

  /**
   * @returns {boolean}
   */
  isPhoneReachable() {
    return (
      (this.server?.getConnectedClientCount() ?? 0) > 0 ||
      this.liveKitPhoneActive
    );
  }

  /**
   * @param {import('../agent-sessions').AgentSessionService} agentSessionService
   */
  setAgentSessionService(agentSessionService) {
    this.agentSessionService = agentSessionService;
  }

  /**
   * Broadcast a JSON payload to connected phone clients (LAN WS + LiveKit).
   * @param {Record<string, unknown>} payload
   * @returns {Promise<boolean>}
   */
  async broadcastToPhone(payload) {
    if (!this.isPhoneReachable()) {
      return false;
    }

    let sent = false;
    if (this.server?.getConnectedClientCount()) {
      sent = this.server.sendToAuthenticatedClients(payload) || sent;
    }
    if (
      !sent &&
      this.liveKitPhoneActive &&
      this.liveKitPublisher.isRunning() &&
      (await this.liveKitPublisher.canSendToPhone())
    ) {
      sent = (await this.liveKitPublisher.sendToPhone(payload)) || sent;
      if (!sent) {
        this.liveKitPhoneActive = false;
      }
    }
    return sent;
  }

  /**
   * @param {Record<string, unknown>} message
   * @returns {Promise<Record<string, unknown> | null>}
   */
  async handleAgentClientMessage(message) {
    if (!this.agentSessionService) {
      return {
        type: SERVER_MESSAGE_TYPES.ERROR,
        message: 'agent_sessions_unavailable',
      };
    }
    return this.agentSessionService.handleRemotePadMessage(message);
  }

  /**
   * Phone requested a one-shot desktop screenshot (video stream stays as-is).
   * @returns {Promise<Record<string, unknown>>}
   */
  async handleScreenshotRequest() {
    try {
      const { buffer } = await capturePrimaryScreenPng();
      const filename = `screenshot-${Date.now()}.png`;
      const result = await this.sendFileToPhone({
        data: buffer,
        filename,
        mime: 'image/png',
      });

      if (!result.ok) {
        return {
          type: SERVER_MESSAGE_TYPES.SCREENSHOT_FAILED,
          reason: result.reason || 'send_failed',
        };
      }

      return {
        type: SERVER_MESSAGE_TYPES.SCREENSHOT_SENT,
        filename: result.filename,
      };
    } catch (error) {
      console.error('[RemotePad] Screenshot request failed:', error);
      return {
        type: SERVER_MESSAGE_TYPES.SCREENSHOT_FAILED,
        reason: error instanceof Error ? error.message : 'capture_failed',
      };
    }
  }

  /**
   * @param {Record<string, unknown> | null} progress
   */
  emitFileTransferProgress(progress) {
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) {
        win.webContents.send('remote-pad:file-transfer-progress', progress);
      }
    }
  }

  /**
   * Cancel an in-flight send or receive transfer from either side.
   * @param {string} [transferId]
   */
  async cancelFileTransfer(transferId = '') {
    const outgoing = this.activeOutgoingTransfer;
    if (outgoing && (!transferId || transferId === outgoing.transferId)) {
      outgoing.cancel = true;
      await this.broadcastToPhone({
        type: CLIENT_MESSAGE_TYPES.FILE_TRANSFER_CANCEL,
        transferId: outgoing.transferId,
      });
      this.emitFileTransferProgress(null);
      return { ok: true, transferId: outgoing.transferId };
    }

    const cancelledId = this.inputHandler.cancelFileTransfer(transferId);
    if (cancelledId) {
      await this.broadcastToPhone({
        type: CLIENT_MESSAGE_TYPES.FILE_TRANSFER_CANCEL,
        transferId: cancelledId,
      });
      this.emitFileTransferProgress(null);
      return { ok: true, transferId: cancelledId };
    }

    return { ok: false, reason: 'no_active_transfer' };
  }

  /**
   * Send a file from the desktop to the connected phone app.
   * @param {{ filePath?: string; data?: Buffer | Uint8Array; filename?: string; mime?: string }} input
   */
  async sendFileToPhone(input = {}) {
    if (!this.isPhoneReachable()) {
      return { ok: false, reason: 'no_phone_connected' };
    }

    if (this.activeOutgoingTransfer) {
      return { ok: false, reason: 'transfer_in_progress' };
    }

    const transferId = crypto.randomUUID();
    this.activeOutgoingTransfer = { transferId, cancel: false };

    /** @type {(payload: Record<string, unknown>) => Promise<boolean>} */
    const deliver = async (payload) => this.broadcastToPhone(payload);
    const options = {
      transferId,
      shouldCancel: () => Boolean(this.activeOutgoingTransfer?.cancel),
      onProgress: (progress) => this.emitFileTransferProgress(progress),
    };

    try {
      if (input.filePath) {
        const result = await sendFilePathToPhone(input.filePath, deliver, options);
        this.emitFileTransferProgress(null);
        return { ok: true, filename: result.filename, transferId };
      }

      if (input.data) {
        const filename = input.filename || `pc-share-${Date.now()}.bin`;
        const result = await sendBytesToPhone(
          input.data,
          filename,
          input.mime,
          deliver,
          options,
        );
        this.emitFileTransferProgress(null);
        return { ok: true, filename: result.filename, transferId };
      }

      return { ok: false, reason: 'missing_file' };
    } catch (error) {
      if (error instanceof TransferCancelledError || error?.code === 'cancelled') {
        await this.broadcastToPhone({
          type: CLIENT_MESSAGE_TYPES.FILE_TRANSFER_CANCEL,
          transferId,
        });
        this.emitFileTransferProgress(null);
        return { ok: false, reason: 'cancelled', transferId };
      }
      console.error('[RemotePad] sendFileToPhone failed:', error);
      this.emitFileTransferProgress(null);
      return {
        ok: false,
        reason: error instanceof Error ? error.message : 'send_failed',
        transferId,
      };
    } finally {
      if (this.activeOutgoingTransfer?.transferId === transferId) {
        this.activeOutgoingTransfer = null;
      }
    }
  }

  async setEnabled(enabled) {
    this.enabled = enabled;
    if (enabled) {
      return this.startServer();
    }
    return this.stopServer();
  }

  async setConfig(partial = {}) {
    if (typeof partial.port === 'number' && partial.port > 0) {
      this.port = partial.port;
      this.config.port = partial.port;
    }
    if (typeof partial.allowScreenView === 'boolean') {
      this.allowScreenView = partial.allowScreenView;
      this.config.allowScreenView = partial.allowScreenView;
    }
    if (typeof partial.lanFallbackEnabled === 'boolean') {
      this.lanFallbackEnabled = partial.lanFallbackEnabled;
      this.config.lanFallbackEnabled = partial.lanFallbackEnabled;
    }
    if (typeof partial.preferLanMedia === 'boolean') {
      this.preferLanMedia = partial.preferLanMedia;
      this.config.preferLanMedia = partial.preferLanMedia;
    }
    if (typeof partial.preferLanP2p === 'boolean') {
      this.preferLanP2p = partial.preferLanP2p;
      this.config.preferLanP2p = partial.preferLanP2p;
    }
    if (typeof partial.clipboardSyncEnabled === 'boolean') {
      this.clipboardSyncEnabled = partial.clipboardSyncEnabled;
      this.config.clipboardSyncEnabled = partial.clipboardSyncEnabled;
    }
    if (typeof partial.meshHostOverride === 'string') {
      const trimmed = partial.meshHostOverride.trim();
      if (trimmed && !isMeshVpnAddress(trimmed)) {
        throw new Error('VPN address should look like 100.x.x.x (Tailscale / mesh)');
      }
      this.meshHostOverride = trimmed;
      this.config.meshHostOverride = trimmed;
    }

    this.lanHttpPort = this.port + LAN_HTTP_PORT_OFFSET;

    saveConfig({
      ...this.config,
      buddyId: this.buddyId,
      pin: this.pin,
      port: this.port,
      lanFallbackEnabled: this.lanFallbackEnabled,
      allowScreenView: this.allowScreenView,
      preferLanMedia: this.preferLanMedia,
      preferLanP2p: this.preferLanP2p,
      clipboardSyncEnabled: this.clipboardSyncEnabled,
      meshHostOverride: this.meshHostOverride,
    });

    this.refreshClipboardSync();

    if (this.enabled && (
      typeof partial.port === 'number' ||
      typeof partial.allowScreenView === 'boolean' ||
      typeof partial.lanFallbackEnabled === 'boolean' ||
      typeof partial.preferLanMedia === 'boolean' ||
      typeof partial.preferLanP2p === 'boolean'
    )) {
      await this.stopServer();
      return this.startServer();
    }

    return this.getStatus();
  }

  async regeneratePin() {
    this.pin = String(crypto.randomInt(100000, 999999));
    this.config.pin = this.pin;
    saveConfig({
      ...this.config,
      buddyId: this.buddyId,
      pin: this.pin,
      port: this.port,
      lanFallbackEnabled: this.lanFallbackEnabled,
      allowScreenView: this.allowScreenView,
      preferLanMedia: this.preferLanMedia,
      preferLanP2p: this.preferLanP2p,
    });

    if (this.enabled) {
      await this.stopServer();
      return this.startServer();
    }

    return this.getStatus();
  }

  async openPairingWindow() {
    if (this.pairingWindow && !this.pairingWindow.isDestroyed()) {
      this.pairingWindow.focus();
      await this.refreshPairingWindow();
      return;
    }

    this.pairingWindow = new BrowserWindow({
      width: 380,
      height: 520,
      resizable: false,
      autoHideMenuBar: true,
      title: 'Remote connection',
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    this.pairingWindow.on('closed', () => {
      this.pairingWindow = null;
    });

    await this.refreshPairingWindow();
  }

  async refreshPairingWindow() {
    if (!this.pairingWindow || this.pairingWindow.isDestroyed()) {
      return;
    }

    const status = this.getStatus();
    const qrDataUrl = await this.getQrCodeDataUrl();
    const htmlPath = path.join(__dirname, 'pairing-window.html');
    await this.pairingWindow.loadFile(htmlPath, {
      query: {
        buddyId: status.buddyId,
        ip: status.ip,
        port: String(status.port),
        pin: status.pin,
        qr: encodeURIComponent(qrDataUrl),
      },
    });
  }

  registerIpcHandlers() {
    this.ipcRegistry.register('remote-pad:get-status', async () => this.getStatus());

    this.ipcRegistry.register('remote-pad:get-qr-code', async () => ({
      payload: await this.getPairingPayload(),
      dataUrl: await this.getQrCodeDataUrl(),
    }));

    this.ipcRegistry.register('remote-pad:open-pairing-window', async () => {
      await this.openPairingWindow();
      return this.getStatus();
    });

    this.ipcRegistry.register('remote-pad:set-enabled', async (_event, enabled) => {
      return this.setEnabled(Boolean(enabled));
    });

    this.ipcRegistry.register('remote-pad:disconnect-clients', async () => {
      return this.disconnectAllClients();
    });

    this.ipcRegistry.register('remote-pad:set-config', async (_event, partial) => {
      return this.setConfig(partial ?? {});
    });

    this.ipcRegistry.register('remote-pad:regenerate-pin', async () => {
      const status = await this.regeneratePin();
      if (this.pairingWindow && !this.pairingWindow.isDestroyed()) {
        await this.refreshPairingWindow();
      }
      return status;
    });

    this.ipcRegistry.register('remote-pad:send-file-to-phone', async (_event, input) => {
      return this.sendFileToPhone(input ?? {});
    });

    this.ipcRegistry.register('remote-pad:cancel-file-transfer', async (_event, transferId) => {
      return this.cancelFileTransfer(typeof transferId === 'string' ? transferId : '');
    });

    this.ipcRegistry.register('remote-pad:start-phone-camera', async () => {
      return { ok: false, reason: 'not_supported' };
    });

    this.ipcRegistry.register('remote-pad:stop-phone-camera', async () => {
      return { ok: true };
    });

    this.ipcRegistry.register('remote-pad:send-phone-cam-signal', async () => {
      return { ok: false, reason: 'not_supported' };
    });

    this.ipcRegistry.register('remote-pad:install-virtual-webcam', async () => {
      return { ok: false, reason: 'not_supported' };
    });

    this.ipcRegistry.register('remote-pad:open-firewall-setup', async () => {
      openWindowsFirewallSetup();
      return getWindowsFirewallStatus();
    });

    this.ipcRegistry.register('remote-pad:livekit-auth', async (_event, pin) => {
      const result = this.inputHandler.buildAuthResponse(String(pin ?? ''), this.pin, {
        allowScreenView: this.allowScreenView,
      });

      if (result.error) {
        return result;
      }

      const livekit = this.isLiveKitConfigured()
        ? {
            url: getLiveKitConfig()?.url,
            room: this.liveKitRoomName,
          }
        : null;

      const response = {
        ...result,
        ...(livekit?.url
          ? {
              livekitUrl: livekit.url,
              livekitRoom: livekit.room,
            }
          : {}),
      };
      void this.agentSessionService?.pushSessionListToPhone();
      return response;
    });

    this.ipcRegistry.register('remote-pad:livekit-input', async (_event, message) => {
      try {
        const type = message?.type;
        if (type && type !== CLIENT_MESSAGE_TYPES.PING) {
          this.liveKitPhoneActive = true;
        }
        if (type === CLIENT_MESSAGE_TYPES.REQUEST_SCREENSHOT) {
          return this.handleScreenshotRequest();
        }
        if (
          type === CLIENT_MESSAGE_TYPES.AGENT_STOP ||
          type === CLIENT_MESSAGE_TYPES.AGENT_APPROVE ||
          type === CLIENT_MESSAGE_TYPES.AGENT_DENY ||
          type === CLIENT_MESSAGE_TYPES.AGENT_SEND_INPUT ||
          type === CLIENT_MESSAGE_TYPES.AGENT_SESSION_REFRESH ||
          type === CLIENT_MESSAGE_TYPES.AGENT_SESSION_LOG
        ) {
          return this.handleAgentClientMessage(message ?? {});
        }
        return await this.inputHandler.handleMessage(message ?? {});
      } catch (error) {
        return {
          type: SERVER_MESSAGE_TYPES.ERROR,
          message: error instanceof Error ? error.message : 'Invalid message',
        };
      }
    });

    this.ipcRegistry.register('remote-pad:livekit-session-idle', async () => {
      await this.onLiveKitSessionIdle();
    });
  }

  async shutdown() {
    if (this.pairingWindow && !this.pairingWindow.isDestroyed()) {
      this.pairingWindow.close();
    }
    await this.stopServer();
  }
}

module.exports = { RemotePadService };
