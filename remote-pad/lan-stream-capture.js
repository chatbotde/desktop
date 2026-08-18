const path = require('path');
const { BrowserWindow, session, desktopCapturer, ipcMain } = require('electron');
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
      callback(primary ? { video: primary, audio: false } : {});
    } catch {
      callback({});
    }
  });

  displayMediaHandlerInstalled = true;
}

/**
 * Captures desktop JPEG frames for LAN MJPEG streaming (no LiveKit).
 */
class LanStreamCapture {
  constructor() {
    /** @type {BrowserWindow | null} */
    this.window = null;
    this.running = false;
    /** @type {((buffer: Buffer) => void) | null} */
    this.onFrame = null;
    this.frameListener = (_event, payload) => {
      if (!this.onFrame || payload == null) {
        return;
      }
      const buffer = Buffer.isBuffer(payload) ? payload : Buffer.from(payload);
      if (buffer.length) {
        this.onFrame(buffer);
      }
    };
  }

  /**
   * @returns {boolean}
   */
  isRunning() {
    return this.running;
  }

  /**
   * @param {(buffer: Buffer) => void} handler
   */
  setFrameHandler(handler) {
    this.onFrame = handler;
  }

  async start() {
    if (this.running && this.window && !this.window.isDestroyed()) {
      return;
    }

    ensureDisplayMediaHandler();
    ipcMain.on('remote-pad:lan-frame', this.frameListener);

    this.window = new BrowserWindow(
      hiddenCaptureWindowOptions({
        contextIsolation: true,
        nodeIntegration: false,
        backgroundThrottling: false,
        preload: path.join(__dirname, 'lan-capture-preload.js'),
      })
    );
    sealHiddenCaptureWindow(this.window);

    this.window.on('closed', () => {
      this.window = null;
      this.running = false;
    });

    await loadHiddenHtml(this.window, path.join(__dirname, 'lan-capture-window.html'));
    this.running = true;
    console.log('[RemotePad LAN] Desktop capture started (free local stream)');
  }

  async stop() {
    ipcMain.removeListener('remote-pad:lan-frame', this.frameListener);
    this.running = false;
    this.onFrame = null;

    if (this.window && !this.window.isDestroyed()) {
      this.window.close();
    }
    this.window = null;
    console.log('[RemotePad LAN] Desktop capture stopped');
  }
}

module.exports = { LanStreamCapture };
