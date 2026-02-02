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
      // In packaged app, extraResources are placed in process.resourcesPath
      // Try multiple possible locations
      const possiblePaths = [];

      // 1. extraResources location (most reliable)
      if (process.resourcesPath) {
        possiblePaths.push(path.join(process.resourcesPath, 'app-frontend'));
      }

      // 2. Fallback to app path locations
      const appPath = app.getAppPath();

      if (appPath.includes('.asar')) {
        // Try ASAR unpacked location
        const asarUnpackedPath = appPath.replace(/\.asar$/, '.asar.unpacked');
        possiblePaths.push(path.join(asarUnpackedPath, 'app-frontend'));

        // Try parent of ASAR
        const parentDir = path.dirname(appPath);
        possiblePaths.push(path.join(parentDir, 'app-frontend'));
      }

      // 3. Try in app path itself
      possiblePaths.push(path.join(appPath, 'app-frontend'));

      // Find the first path that exists
      this.frontendDistPath = possiblePaths.find(p => fs.existsSync(p)) || possiblePaths[0];

      console.log(`ProtocolHandler Constructor: Checked paths: ${JSON.stringify(possiblePaths, null, 2)}`);
      console.log(`ProtocolHandler Constructor: Selected path: ${this.frontendDistPath}`);
      console.log(`ProtocolHandler Constructor: Path exists: ${fs.existsSync(this.frontendDistPath)}`);
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
    // Comprehensive debugging for production builds
    console.log(`\n======= ProtocolHandler Setup Debug =======`);
    console.log(`ProtocolHandler: app.isPackaged = ${app.isPackaged}`);
    console.log(`ProtocolHandler: app.getAppPath() = ${app.getAppPath()}`);
    console.log(`ProtocolHandler: __dirname = ${__dirname}`);
    console.log(`ProtocolHandler: process.resourcesPath = ${process.resourcesPath}`);
    console.log(`ProtocolHandler: Final frontend path = ${this.frontendDistPath}`);

    // Verify the frontend path exists
    if (!fs.existsSync(this.frontendDistPath)) {
      console.error(`\n!!! ERROR: Frontend path does not exist: ${this.frontendDistPath}`);

      // List what's actually in the app directory
      const appPath = app.getAppPath();
      console.error(`\nListing contents of app path: ${appPath}`);
      try {
        const files = fs.readdirSync(appPath);
        console.error(`Contents: ${JSON.stringify(files, null, 2)}`);
      } catch (e) {
        console.error(`Could not list app path: ${e}`);
      }

      // Check parent directory
      const parentDir = path.dirname(appPath);
      console.error(`\nListing contents of parent directory: ${parentDir}`);
      try {
        const files = fs.readdirSync(parentDir);
        console.error(`Contents: ${JSON.stringify(files, null, 2)}`);
      } catch (e) {
        console.error(`Could not list parent directory: ${e}`);
      }

      // Check resources path if available
      if (process.resourcesPath) {
        console.error(`\nListing contents of resources path: ${process.resourcesPath}`);
        try {
          const files = fs.readdirSync(process.resourcesPath);
          console.error(`Contents: ${JSON.stringify(files, null, 2)}`);
        } catch (e) {
          console.error(`Could not list resources path: ${e}`);
        }
      }
    } else {
      console.log(`✓ Frontend path verified: ${this.frontendDistPath}`);

      // List what's in the frontend directory
      try {
        const files = fs.readdirSync(this.frontendDistPath);
        console.log(`Frontend directory contents (${files.length} items): ${files.join(', ')}`);
      } catch (e) {
        console.error(`Could not list frontend directory: ${e}`);
      }
    }
    console.log(`===========================================\n`);

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
