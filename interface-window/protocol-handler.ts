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

    if (isDev) {
      // __dirname is interface-window/dist, go up 2 levels to project root, then to frontend/dist
      this.frontendDistPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
    } else {
      // In packaged app, files are in app-frontend at the app root
      this.frontendDistPath = path.join(app.getAppPath(), 'app-frontend');
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
      // url.pathname contains the path after hostname (e.g., buddy-app://app/index.html -> /index.html)
      let pathname = url.pathname;

      // Remove leading slash if present (Windows path compatibility)
      if (pathname.startsWith('/')) {
        pathname = pathname.slice(1);
      }

      // Default to index.html for root or empty path
      if (!pathname || pathname === '' || pathname === '/') {
        pathname = 'index.html';
      }

      // Construct file path
      let filePath = path.join(this.frontendDistPath, pathname);

      console.log(`ProtocolHandler: Request for ${request.url}`);
      console.log(`ProtocolHandler: Resolved pathname: ${pathname}`);
      console.log(`ProtocolHandler: Looking for file: ${filePath}`);

      // If file doesn't exist, fall back to index.html (SPA routing)
      if (!fs.existsSync(filePath)) {
        console.warn(`ProtocolHandler: File not found: ${filePath}, falling back to index.html`);
        filePath = path.join(this.frontendDistPath, 'index.html');

        // Final check if even index.html doesn't exist
        if (!fs.existsSync(filePath)) {
          console.error(`ProtocolHandler: index.html not found at: ${filePath}`);
          console.error(`ProtocolHandler: Listing files in frontendDistPath:`);
          try {
            const files = fs.readdirSync(this.frontendDistPath);
            console.error(`ProtocolHandler: Files found: ${files.join(', ')}`);
          } catch (e) {
            console.error(`ProtocolHandler: Could not list directory: ${e}`);
          }
        }
      }

      return net.fetch(pathToFileURL(filePath).toString());
    });

    console.log(`ProtocolHandler: Registered handler for ${this.scheme}:// serving from ${this.frontendDistPath}`);
  }
}

// Export for CommonJS compatibility
module.exports = { ProtocolHandler };
