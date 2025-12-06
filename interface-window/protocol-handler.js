const { protocol, net } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

class ProtocolHandler {
  constructor(scheme = 'buddy-app') {
    this.scheme = scheme;
    this.frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');
  }

  /**
   * Register the custom protocol privileges
   * Must be called before app is ready
   */
  static registerPrivileges(scheme = 'buddy-app') {
    protocol.registerSchemesAsPrivileged([
      {
        scheme: scheme,
        privileges: {
          standard: true,
          secure: true,
          allowServiceWorkers: true,
          supportFetchAPI: true,
          corsEnabled: true
        }
      }
    ]);
  }

  /**
   * Setup the protocol handler
   * Should be called when app is ready
   */
  setup() {
    protocol.handle(this.scheme, (request) => {
      const url = new URL(request.url);
      let pathname = url.pathname;

      // Remove leading slash if present (Windows path compatibility)
      if (pathname.startsWith('/')) {
        pathname = pathname.slice(1);
      }

      // Default to index.html for root
      if (!pathname || pathname === '/') {
        pathname = 'index.html';
      }

      // Construct file path
      let filePath = path.join(this.frontendDistPath, pathname);

      // If file doesn't exist, fall back to index.html (SPA routing)
      if (!fs.existsSync(filePath)) {
        filePath = path.join(this.frontendDistPath, 'index.html');
      }

      return net.fetch(pathToFileURL(filePath).toString());
    });

    console.log(`ProtocolHandler: Registered handler for ${this.scheme}:// serving from ${this.frontendDistPath}`);
  }
}

module.exports = { ProtocolHandler };
