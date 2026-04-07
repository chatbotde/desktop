/**
 * Auth Module
 * 
 * Main entry point for the authentication system.
 * Exports all auth-related functionality.
 * 
 * Usage:
 * ```javascript
 * const { initializeAuth, authService, AuthWindow } = require('./auth');
 * 
 * // Initialize auth system (call once in main.js)
 * await initializeAuth();
 * 
 * // Use authService for auth operations
 * authService.on('auth:success', (user) => {
 *   console.log('User logged in:', user);
 * });
 * 
 * // Create auth window
 * const authWindow = new AuthWindow();
 * authWindow.create();
 * ```
 */

const { app } = require('electron');
const { AuthWindow } = require('./auth-window');
const { authService } = require('./auth-service');
const { tokenStore } = require('./token-store');
const { deepLinkHandler } = require('./deep-link-handler');
const { registerAuthIpcHandlers, unregisterAuthIpcHandlers } = require('./ipc-handlers');
const config = require('./config');

let initialized = false;

/**
 * Initialize the authentication system
 * Should be called once during app startup, before app.whenReady()
 * 
 * @returns {Promise<Object|null>} User data if already authenticated
 */
async function initializeAuth() {
  if (initialized) {
    console.log('Auth: Already initialized');
    return authService.getUser();
  }

  console.log('Auth: Initializing authentication system...');

  // Ensure single instance for deep links to work properly
  const gotTheLock = app.requestSingleInstanceLock();
  
  if (!gotTheLock) {
    console.log('Auth: Another instance is running, quitting...');
    app.quit();
    return null;
  }

  // Initialize deep link handler early (before app.whenReady)
  deepLinkHandler.initialize();
  
  // Set auth service reference in deep link handler (to avoid circular dependency)
  deepLinkHandler.setAuthService(authService);

  // Wait for app to be ready
  await app.whenReady();

  // Register IPC handlers
  registerAuthIpcHandlers();

  // Initialize window control IPC handlers
  const { ipcMain, BrowserWindow } = require('electron');
  
  ipcMain.on('window:close', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window) window.close();
  });

  ipcMain.on('window:minimize', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window) window.minimize();
  });

  ipcMain.on('window:maximize', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window) {
      if (window.isMaximized()) {
        window.unmaximize();
      } else {
        window.maximize();
      }
    }
  });

  // Initialize auth service (checks for existing session)
  const user = await authService.initialize();

  initialized = true;
  console.log('Auth: Initialization complete');

  return user;
}

/**
 * Clean up auth resources
 * Should be called when app is quitting
 */
function cleanupAuth() {
  console.log('Auth: Cleaning up...');
  
  authService.destroy();
  unregisterAuthIpcHandlers();
  
  initialized = false;
}

// Clean up on app quit
app.on('will-quit', () => {
  cleanupAuth();
});

module.exports = {
  // Main initialization
  initializeAuth,
  cleanupAuth,
  
  // Core services
  authService,
  tokenStore,
  
  // UI
  AuthWindow,
  
  // Deep linking
  deepLinkHandler,
  
  // IPC
  registerAuthIpcHandlers,
  unregisterAuthIpcHandlers,
  
  // Configuration
  config,
};
