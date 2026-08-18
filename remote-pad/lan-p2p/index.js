const path = require('path');
const { BrowserWindow, session, desktopCapturer, ipcMain } = require('electron');
const {
  hiddenCaptureWindowOptions,
  sealHiddenCaptureWindow,
  loadHiddenHtml,
} = require('../hidden-capture-window');

let displayMediaHandlerInstalled = false;

function ensureDisplayMediaHandler() {
  if (displayMediaHandlerInstalled) {
    return;
  }

  session.defaultSession.setDisplayMediaRequestHandler(async (_request, callback) => {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: 0, height: 0 },
      });
      const primary =
        sources.find((source) => /primary|screen 1|display 1/i.test(source.name)) ?? sources[0];
      callback(primary ? { video: primary, audio: 'loopback' } : {});
    } catch {
      callback({});
    }
  });

  displayMediaHandlerInstalled = true;
}

/**
 * Hidden window that publishes desktop video over LAN WebRTC (P2P).
 * Signaling is forwarded through the existing Remote Pad WebSocket.
 */
class LanP2pPublisher {
  constructor() {
    /** @type {import('electron').BrowserWindow | null} */
    this.window = null;
    this.running = false;
    this.rendererReady = false;
    /** @type {Record<string, unknown>[]} */
    this.pendingSignals = [];
    /** @type {((message: Record<string, unknown>) => void) | null} */
    this.onSignalOut = null;
    this.signalListener = (_event, message) => {
      if (message?.type === 'publisher_ready') {
        this.rendererReady = true;
        this.flushPending();
        return;
      }
      if (this.onSignalOut && message && typeof message === 'object') {
        this.onSignalOut(message);
      }
    };
  }

  /**
   * @returns {boolean}
   */
  isRunning() {
    return this.running && this.window != null && !this.window.isDestroyed();
  }

  /**
   * @param {(message: Record<string, unknown>) => void} handler
   */
  setSignalHandler(handler) {
    this.onSignalOut = handler;
  }

  flushPending() {
    if (!this.isRunning() || !this.rendererReady) {
      return;
    }
    const queued = this.pendingSignals.splice(0, this.pendingSignals.length);
    for (const message of queued) {
      this.window.webContents.send('remote-pad:lan-p2p-from-phone', message);
    }
  }

  async start() {
    if (this.isRunning()) {
      return;
    }

    ensureDisplayMediaHandler();
    ipcMain.removeListener('remote-pad:lan-p2p-signal', this.signalListener);
    ipcMain.on('remote-pad:lan-p2p-signal', this.signalListener);

    this.rendererReady = false;
    this.pendingSignals = [];

    this.window = new BrowserWindow(
      hiddenCaptureWindowOptions({
        contextIsolation: true,
        nodeIntegration: false,
        backgroundThrottling: false,
        preload: path.join(__dirname, 'publisher-preload.js'),
      })
    );
    sealHiddenCaptureWindow(this.window);

    this.window.webContents.on('console-message', (_event, _level, message) => {
      console.log(`[RemotePad LAN-P2P] ${message}`);
    });

    this.window.on('closed', () => {
      this.window = null;
      this.running = false;
      this.rendererReady = false;
      this.pendingSignals = [];
    });

    await loadHiddenHtml(this.window, path.join(__dirname, 'publisher-window.html'));
    this.running = true;
    console.log('[RemotePad LAN-P2P] Publisher window started');
  }

  /**
   * Forward a signaling message from the phone into the publisher renderer.
   * @param {Record<string, unknown>} message
   */
  sendToPublisher(message) {
    if (!this.isRunning()) {
      this.pendingSignals.push(message);
      void this.start().then(() => this.flushPending());
      return;
    }
    if (!this.rendererReady) {
      this.pendingSignals.push(message);
      return;
    }
    this.window.webContents.send('remote-pad:lan-p2p-from-phone', message);
  }

  async stop() {
    ipcMain.removeListener('remote-pad:lan-p2p-signal', this.signalListener);
    this.running = false;
    this.rendererReady = false;
    this.pendingSignals = [];

    if (this.window && !this.window.isDestroyed()) {
      try {
        this.window.webContents.send('remote-pad:lan-p2p-from-phone', { type: 'webrtc_hangup' });
      } catch {
        // ignore
      }
      this.window.close();
    }
    this.window = null;
    console.log('[RemotePad LAN-P2P] Publisher stopped');
  }
}

module.exports = { LanP2pPublisher };
