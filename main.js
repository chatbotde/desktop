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
  app.setAppUserModelId('com.sonicthinking.buddy');
}

// Register custom protocol schemes BEFORE app is ready
// This must be done synchronously at startup
ProtocolHandler.registerPrivileges();

// Handle deep link URLs from command line arguments FIRST
let pendingDeepLinkUrl = null;
const deepLinkArg = process.argv.find(arg => arg.startsWith('buddy://') || arg.startsWith('buddy:'));
if (deepLinkArg) {
  console.log('Main: Deep link detected in args:', deepLinkArg);
  pendingDeepLinkUrl = deepLinkArg;
  const deepLinkIndex = process.argv.indexOf(deepLinkArg);
  if (deepLinkIndex > -1) {
    process.argv.splice(deepLinkIndex, 1);
  }
}

// Handle deep link after auth initialization
if (pendingDeepLinkUrl) {
  const { initializeAuth } = require('./auth');
  initializeAuth().then(() => {
    const { deepLinkHandler } = require('./auth');
    deepLinkHandler.handleUrl(pendingDeepLinkUrl);
  });
}

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
