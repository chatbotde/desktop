/**
 * Custom Protocol Handler for Interfaces Window
 * 
 * Registers a custom protocol (app://) to serve frontend files
 * securely within Electron.
 */

const { protocol, net } = require('electron');
const path = require('path');
const fs = require('fs');

class ProtocolHandler {
  constructor() {
    this.isRegistered = false;
    this.schemeName = 'app';
  }

  /**
   * Register custom protocol schemes before app is ready
   * MUST be called before app.whenReady()
   */
  static registerSchemes() {
    protocol.registerSchemesAsPrivileged([
      {
        scheme: 'app',
        privileges: {
          standard: true,
          secure: true,
          supportFetchAPI: true,
          corsEnabled: true,
          stream: true,
        },
      },
    ]);
    console.log('ProtocolHandler: Schemes registered as privileged');
  }

  /**
   * Register the protocol handler
   * MUST be called after app.whenReady()
   * @param {string} basePath - Base path to serve files from
   */
  register(basePath) {
    if (this.isRegistered) {
      console.log('ProtocolHandler: Protocol already registered');
      return;
    }

    protocol.handle(this.schemeName, (request) => {
      return this.handleRequest(request, basePath);
    });

    this.isRegistered = true;
    console.log(`ProtocolHandler: Registered '${this.schemeName}://' protocol with base: ${basePath}`);
  }

  /**
   * Handle protocol requests
   * @param {Request} request - The incoming request
   * @param {string} basePath - Base path to serve files from
   * @returns {Response} Response object
   */
  handleRequest(request, basePath) {
    try {
      const url = new URL(request.url);
      let filePath = url.pathname;

      // Remove leading slash for Windows compatibility
      if (process.platform === 'win32' && filePath.startsWith('/')) {
        filePath = filePath.substring(1);
      }

      // Default to index.html for root or directory requests
      if (filePath === '' || filePath === '/' || !path.extname(filePath)) {
        filePath = 'index.html';
      }

      // Construct full file path
      const fullPath = path.join(basePath, filePath);

      // Security: Ensure the path is within basePath
      const normalizedBase = path.normalize(basePath);
      const normalizedFull = path.normalize(fullPath);

      if (!normalizedFull.startsWith(normalizedBase)) {
        console.error('ProtocolHandler: Path traversal attempt blocked:', filePath);
        return new Response('Forbidden', { status: 403 });
      }

      // Check if file exists
      if (!fs.existsSync(fullPath)) {
        // For SPA routing, return index.html for non-asset requests
        const indexPath = path.join(basePath, 'index.html');
        if (fs.existsSync(indexPath) && !this.isAssetRequest(filePath)) {
          return net.fetch(`file://${indexPath}`);
        }
        console.error('ProtocolHandler: File not found:', fullPath);
        return new Response('Not Found', { status: 404 });
      }

      // Return the file
      return net.fetch(`file://${fullPath}`);
    } catch (error) {
      console.error('ProtocolHandler: Error handling request:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }

  /**
   * Check if request is for a static asset
   * @param {string} filePath - File path
   * @returns {boolean} True if asset request
   */
  isAssetRequest(filePath) {
    const assetExtensions = [
      '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg',
      '.woff', '.woff2', '.ttf', '.eot', '.ico', '.json', '.map'
    ];
    const ext = path.extname(filePath).toLowerCase();
    return assetExtensions.includes(ext);
  }

  /**
   * Get URL for the custom protocol
   * @param {string} pathname - Path within the app
   * @returns {string} Full protocol URL
   */
  getURL(pathname = '/') {
    return `${this.schemeName}://.${pathname}`;
  }

  /**
   * Unregister the protocol (for cleanup)
   */
  unregister() {
    if (this.isRegistered) {
      // Note: Electron doesn't have a built-in way to unregister protocols
      this.isRegistered = false;
      console.log('ProtocolHandler: Protocol marked as unregistered');
    }
  }
}

// Singleton instance
const protocolHandler = new ProtocolHandler();

module.exports = { ProtocolHandler, protocolHandler };
