/**
 * Main Entry Point
 * 
 * SOLID Principles Applied:
 * - Single Responsibility: Bootstraps the application only
 * - Dependency Inversion: Uses Application coordinator
 * - All logic delegated to focused components
 */

const { app } = require('electron');
const path = require('path');
const { ProtocolHandler } = require('./interface-window/dist/protocol-handler');

// CRITICAL: Set App User Model ID BEFORE any windows are created
// This is required for Windows to properly associate the app with its icon
if (process.platform === 'win32') {
  app.setAppUserModelId('com.sonicthinking.sonicthinking');
}

// Register custom protocol schemes BEFORE app is ready
// This must be done synchronously at startup
ProtocolHandler.registerPrivileges();

// Protocols and deep linking are now handled by the Auth module
// which is initialized during application.initialize() below.
// This ensures unified handling via DeepLinkHandler.

// Set macOS dock icon
app.whenReady().then(() => {
  if (process.platform === 'darwin' && app.dock) {
    const { nativeImage } = require('electron');
    const iconPath = path.join(__dirname, 'icons', 'icon.png');
    const icon = nativeImage.createFromPath(iconPath);
    if (!icon.isEmpty()) {
      app.dock.setIcon(icon);
    }
  }
});

// Initialize and run application
const { Application } = require('./application/application');
const application = new Application();

application.initialize().catch(error => {
  console.error('Main: Fatal error during application initialization:', error);
  app.quit();
});
