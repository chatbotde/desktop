const path = require('path');
const { BrowserWindow, desktopCapturer, session, ipcMain } = require('electron');
const {
  hiddenCaptureWindowOptions,
  sealHiddenCaptureWindow,
  loadHiddenHtml,
} = require('./hidden-capture-window');

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

      if (!primary) {
        callback({});
        return;
      }

      callback({ video: primary, audio: 'loopback' });
    } catch (error) {
      console.error('[RemotePad] Display media handler failed:', error);
      callback({});
    }
  });

  displayMediaHandlerInstalled = true;
}

/**
 * Hidden window that publishes the primary desktop to a LiveKit room.
 */
class LiveKitStreamPublisher {
  constructor() {
    /** @type {import('electron').BrowserWindow | null} */
    this.window = null;
    this.running = false;
    /** @type {{ url: string; token: string; allowScreenView: boolean } | null} */
    this.publisherConfig = null;
    this.configHandler = () => this.publisherConfig;
    ipcMain.handle('remote-pad:livekit-publisher-config', this.configHandler);
  }

  /**
   * @returns {boolean}
   */
  isRunning() {
    return this.running;
  }

  /**
   * @param {{ url: string; token: string; allowScreenView?: boolean }} config
   */
  async start(config) {
    ensureDisplayMediaHandler();

    this.publisherConfig = {
      url: config.url,
      token: config.token,
      allowScreenView: config.allowScreenView !== false,
    };

    if (this.running && this.window && !this.window.isDestroyed()) {
      await this.reload(config);
      return;
    }

    if (this.window && !this.window.isDestroyed()) {
      this.window.destroy();
      this.window = null;
    }

    this.window = new BrowserWindow(
      hiddenCaptureWindowOptions({
        contextIsolation: true,
        nodeIntegration: false,
        backgroundThrottling: false,
        preload: path.join(__dirname, 'stream-preload.js'),
      })
    );
    sealHiddenCaptureWindow(this.window);

    this.window.webContents.on('console-message', (_event, _level, message) => {
      console.log(`[RemotePad LiveKit] ${message}`);
    });

    this.window.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
      console.error(
        `[RemotePad LiveKit] Failed to load publisher window (${errorCode}): ${errorDescription} — ${validatedURL}`
      );
    });

    this.window.on('closed', () => {
      this.window = null;
      this.running = false;
    });

    try {
      await loadHiddenHtml(this.window, path.join(__dirname, 'stream-window.html'));
      this.running = true;
    } catch (error) {
      if (this.window && !this.window.isDestroyed()) {
        this.window.destroy();
      }
      this.window = null;
      this.running = false;
      throw error;
    }
  }

  /**
   * @param {{ url: string; token: string; allowScreenView?: boolean }} config
   */
  async reload(config) {
    if (!this.window || this.window.isDestroyed()) {
      return this.start(config);
    }

    this.publisherConfig = {
      url: config.url,
      token: config.token,
      allowScreenView: config.allowScreenView !== false,
    };

    await loadHiddenHtml(this.window, path.join(__dirname, 'stream-window.html'));
  }

  async stop() {
    this.running = false;
    this.publisherConfig = null;
    if (this.window && !this.window.isDestroyed()) {
      this.window.close();
    }
    this.window = null;
  }

  /**
   * @returns {Promise<boolean>}
   */
  async canSendToPhone() {
    if (!this.window || this.window.isDestroyed()) {
      return false;
    }

    try {
      return await this.window.webContents.executeJavaScript(
        'typeof window.__remotePadCanSendToPhone === "function" && window.__remotePadCanSendToPhone()'
      );
    } catch {
      return false;
    }
  }

  /**
   * Push a JSON payload to the connected phone (LiveKit data or direct P2P channel).
   * @param {Record<string, unknown>} payload
   * @returns {Promise<boolean>}
   */
  async sendToPhone(payload) {
    if (!this.window || this.window.isDestroyed()) {
      return false;
    }

    try {
      return await this.window.webContents.executeJavaScript(
        `(async () => {
          if (typeof window.__remotePadSendToPhone !== 'function') return false;
          return window.__remotePadSendToPhone(${JSON.stringify(payload)});
        })()`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes('PC manager is closed')) {
        console.error('[RemotePad LiveKit] sendToPhone failed:', error);
      }
      return false;
    }
  }
}

module.exports = { LiveKitStreamPublisher };
