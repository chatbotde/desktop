/**
 * Protocol Handler
 * Handles custom protocol registration and file serving for the Electron app
 */

import { protocol, net, app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { pathToFileURL } from 'url';

// Declare __dirname for TypeScript (available in CommonJS)
declare const __dirname: string;

export class ProtocolHandler {
  private scheme: string;
  private frontendDistPath: string;

  constructor(scheme: string = 'buddy-app') {
    this.scheme = scheme;
    // In development, use frontend/dist; in production, use app-frontend
    const isDev = !app.isPackaged;
    const basePath = app.isPackaged ? app.getAppPath() : __dirname;
    
    if (isDev) {
      this.frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');
    } else {
      // In packaged app, files are in app-frontend
      this.frontendDistPath = path.join(basePath, 'app-frontend');
    }
  }

  /**
   * Register the custom protocol privileges
   * Must be called before app is ready
   */
  static registerPrivileges(scheme: string = 'buddy-app'): void {
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
  setup(): void {
    // Verify the frontend path exists
    if (!fs.existsSync(this.frontendDistPath)) {
      console.error(`ProtocolHandler: Frontend path does not exist: ${this.frontendDistPath}`);
      console.error(`ProtocolHandler: app.isPackaged = ${app.isPackaged}`);
      console.error(`ProtocolHandler: app.getAppPath() = ${app.getAppPath()}`);
      console.error(`ProtocolHandler: __dirname = ${__dirname}`);
    } else {
      console.log(`ProtocolHandler: Frontend path verified: ${this.frontendDistPath}`);
    }

    protocol.handle(this.scheme, (request: Request) => {
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
        console.warn(`ProtocolHandler: File not found: ${filePath}, falling back to index.html`);
        filePath = path.join(this.frontendDistPath, 'index.html');
      }

      return net.fetch(pathToFileURL(filePath).toString());
    });

    console.log(`ProtocolHandler: Registered handler for ${this.scheme}:// serving from ${this.frontendDistPath}`);
  }
}

// Export for CommonJS compatibility
module.exports = { ProtocolHandler };
