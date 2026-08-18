const http = require('http');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const BOUNDARY = 'remote-pad-frame';

/**
 * Local HTTP server for free LAN screen stream (MJPEG) and file upload.
 */
class LanHttpServer {
  /**
   * @param {{ port: number; pin: string; ip?: string }} config
   * @param {{ onViewerChange?: (count: number) => void }} [callbacks]
   */
  constructor(config, callbacks = {}) {
    this.config = config;
    this.callbacks = callbacks;
    /** @type {http.Server | null} */
    this.server = null;
    /** @type {Set<import('http').ServerResponse>} */
    this.streamClients = new Set();
    /** @type {Buffer | null} */
    this.latestFrame = null;
  }

  /**
   * @returns {boolean}
   */
  isRunning() {
    return this.server !== null;
  }

  /**
   * @returns {number}
   */
  getViewerCount() {
    return this.streamClients.size;
  }

  /**
   * @returns {string}
   */
  getStreamUrl() {
    const host = this.config.ip || '127.0.0.1';
    return `http://${host}:${this.config.port}/stream?pin=${encodeURIComponent(this.config.pin)}`;
  }

  /**
   * @returns {string}
   */
  getUploadUrl() {
    const host = this.config.ip || '127.0.0.1';
    return `http://${host}:${this.config.port}/upload?pin=${encodeURIComponent(this.config.pin)}`;
  }

  /**
   * @param {Buffer} jpegBuffer
   */
  pushFrame(jpegBuffer) {
    if (!jpegBuffer?.length) {
      return;
    }

    this.latestFrame = jpegBuffer;

    if (this.streamClients.size === 0) {
      return;
    }

    const header = Buffer.from(
      `\r\n--${BOUNDARY}\r\nContent-Type: image/jpeg\r\nContent-Length: ${jpegBuffer.length}\r\n\r\n`
    );

    for (const client of this.streamClients) {
      try {
        if (!client.writableEnded) {
          client.write(header);
          client.write(jpegBuffer);
        }
      } catch {
        this.streamClients.delete(client);
      }
    }
  }

  /**
   * @param {import('http').IncomingMessage} req
   * @returns {boolean}
   */
  isAuthorized(req) {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    return url.searchParams.get('pin') === this.config.pin;
  }

  /**
   * @returns {Promise<void>}
   */
  async start() {
    if (this.server) {
      return;
    }

    await new Promise((resolve, reject) => {
      const server = http.createServer((req, res) => {
        void this.handleRequest(req, res);
      });

      server.on('listening', () => {
        this.server = server;
        const host = this.config.ip || 'localhost';
        console.log(`[RemotePad LAN] HTTP on port ${this.config.port} (stream + upload)`);
        console.log(`[RemotePad LAN] Stream  http://${host}:${this.config.port}/stream?pin=***`);
        console.log(`[RemotePad LAN] Upload  http://${host}:${this.config.port}/upload?pin=***`);
        resolve();
      });

      server.on('error', (error) => {
        if (!this.server) {
          reject(error);
          return;
        }
        console.error('[RemotePad LAN] HTTP error:', error);
      });

      server.listen(this.config.port, '0.0.0.0');
    });
  }

  /**
   * @param {import('http').IncomingMessage} req
   * @param {import('http').ServerResponse} res
   */
  async handleRequest(req, res) {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);

    if (req.method === 'GET' && url.pathname === '/stream') {
      this.handleStream(req, res);
      return;
    }

    if (req.method === 'POST' && url.pathname === '/upload') {
      await this.handleUpload(req, res, url);
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  }

  /**
   * @param {import('http').IncomingMessage} req
   * @param {import('http').ServerResponse} res
   */
  handleStream(req, res) {
    if (!this.isAuthorized(req)) {
      res.writeHead(401);
      res.end('Invalid PIN');
      return;
    }

    res.writeHead(200, {
      'Content-Type': `multipart/x-mixed-replace; boundary=${BOUNDARY}`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Connection: 'close',
      Pragma: 'no-cache',
    });

    this.streamClients.add(res);
    this.callbacks.onViewerChange?.(this.streamClients.size);

    if (this.latestFrame) {
      const header = Buffer.from(
        `\r\n--${BOUNDARY}\r\nContent-Type: image/jpeg\r\nContent-Length: ${this.latestFrame.length}\r\n\r\n`
      );
      res.write(header);
      res.write(this.latestFrame);
    }

    req.on('close', () => {
      this.streamClients.delete(res);
      this.callbacks.onViewerChange?.(this.streamClients.size);
    });
  }

  /**
   * @param {import('http').IncomingMessage} req
   * @param {import('http').ServerResponse} res
   * @param {URL} url
   */
  async handleUpload(req, res, url) {
    if (!this.isAuthorized(req)) {
      res.writeHead(401);
      res.end('Invalid PIN');
      return;
    }

    const rawName =
      url.searchParams.get('filename') ||
      req.headers['x-filename'] ||
      `phone-upload-${Date.now()}`;
    const safeName = path.basename(String(rawName)).replace(/[^\w.\-()+ ]/g, '_') || 'upload.bin';
    const dir = path.join(app.getPath('downloads'), 'BuddyPhone');
    const dest = path.join(dir, safeName);

    try {
      fs.mkdirSync(dir, { recursive: true });
      await new Promise((resolve, reject) => {
        const out = fs.createWriteStream(dest);
        req.pipe(out);
        out.on('finish', resolve);
        out.on('error', reject);
        req.on('error', reject);
      });

      console.log(`[RemotePad LAN] Saved upload: ${dest}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, path: dest, name: safeName }));
    } catch (error) {
      console.error('[RemotePad LAN] Upload failed:', error);
      res.writeHead(500);
      res.end('Upload failed');
    }
  }

  async stop() {
    for (const client of this.streamClients) {
      try {
        client.end();
      } catch {
        // ignore
      }
    }
    this.streamClients.clear();
    this.callbacks.onViewerChange?.(0);
    this.latestFrame = null;

    if (!this.server) {
      return;
    }

    await new Promise((resolve) => {
      this.server.close(() => {
        this.server = null;
        console.log('[RemotePad LAN] HTTP stopped');
        resolve();
      });
    });
  }
}

module.exports = { LanHttpServer };
