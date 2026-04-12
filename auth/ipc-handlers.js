/**
 * Auth IPC Handlers
 * 
 * Handles IPC communication between main process and renderer processes
 * for authentication-related operations.
 */

const { ipcMain } = require('electron');
const { authService } = require('./auth-service');
const { tokenStore } = require('./token-store');
const config = require('./config');

let handlersRegistered = false;

/**
 * Register all authentication IPC handlers
 * Should be called once during app initialization
 */
function registerAuthIpcHandlers() {
  if (handlersRegistered) {
    console.log('Auth IPC: Handlers already registered');
    return;
  }

  console.log('Auth IPC: Registering handlers...');

  // ===========================================
  // LOGIN / SIGNUP
  // ===========================================

  /**
   * Start login flow
   */
  ipcMain.on('auth:login', async (event, options = {}) => {
    console.log('Auth IPC: Login requested');
    try {
      await authService.login(options);
    } catch (error) {
      console.error('Auth IPC: Login error:', error);
      event.reply('auth:error', { message: error.message });
    }
  });

  /**
   * Start signup flow
   */
  ipcMain.on('auth:signup', async (event, options = {}) => {
    console.log('Auth IPC: Signup requested');
    try {
      await authService.signup(options);
    } catch (error) {
      console.error('Auth IPC: Signup error:', error);
      event.reply('auth:error', { message: error.message });
    }
  });

  /**
   * Logout
   */
  ipcMain.on('auth:logout', async (event) => {
    console.log('Auth IPC: Logout requested');
    try {
      await authService.logout();
      event.reply('auth:logout-success');
    } catch (error) {
      console.error('Auth IPC: Logout error:', error);
      event.reply('auth:error', { message: error.message });
    }
  });

  // ===========================================
  // SESSION & USER INFO (invoke/handle pattern)
  // ===========================================

  /**
   * Check if user is authenticated
   */
  ipcMain.handle('auth:is-authenticated', async () => {
    return authService.isLoggedIn();
  });

  /**
   * Get current user data
   */
  ipcMain.handle('auth:get-user', async () => {
    return authService.getUser();
  });

  /**
   * Get user info (alias for get-user)
   */
  ipcMain.handle('auth:get-user-info', async () => {
    return authService.getUser();
  });

  /**
   * Get access token for API calls
   */
  ipcMain.handle('auth:get-token', async () => {
    return authService.getAccessToken();
  });

  /**
   * Validate current session
   */
  ipcMain.handle('auth:validate-session', async () => {
    return authService.validateSession();
  });

  /**
   * Refresh tokens
   */
  ipcMain.handle('auth:refresh-tokens', async () => {
    return authService.refreshTokens();
  });

  /**
   * Submit manual token (when deep link doesn't work)
   */
  ipcMain.handle('auth:submit-manual-token', async (event, token) => {
    console.log('Auth IPC: Manual token submitted');
    try {
      // Create a fake URL-like structure to reuse handleAuthCallback
      const result = await authService.handleAuthCallback({
        token: token,
        state: null // No state for manual token
      });
      return result;
    } catch (error) {
      console.error('Auth IPC: Manual token error:', error);
      throw error;
    }
  });

  /**
   * Get auth configuration (safe values only)
   */
  ipcMain.handle('auth:get-config', async () => {
    return {
      webAuthUrl: config.WEB_AUTH_URL,
      protocol: config.PROTOCOL,
      isAuthenticated: authService.isLoggedIn(),
      isLocal: config.useLocalAuth,
      isDev: process.env.NODE_ENV === 'development',
    };
  });

  /**
   * Toggle between local and production auth server
   */
  ipcMain.handle('auth:toggle-server', async () => {
    const result = config.toggleAuthServer();
    console.log('Auth IPC: Server toggled to', result.url);
    return result;
  });

  /**
   * Check if local webbuddy is running
   */
  ipcMain.handle('auth:is-local-running', async () => {
    return config.isLocalServerRunning();
  });

  /**
   * Switch to a specific server
   */
  ipcMain.handle('auth:switch-server', async (event, useLocal) => {
    if (useLocal) {
      config.switchToLocal();
    } else {
      config.switchToProduction();
    }
    return { url: config.WEB_AUTH_URL, isLocal: config.useLocalAuth };
  });

  // ===========================================
  // AUTH STATE LISTENERS
  // ===========================================

  // Track windows that want auth state updates
  const authStateListeners = new Set();

  /**
   * Register for auth state updates
   */
  ipcMain.on('auth:subscribe', (event) => {
    authStateListeners.add(event.sender);

    // Send current state immediately
    event.reply('auth:state-changed', {
      isAuthenticated: authService.isLoggedIn(),
      user: authService.getUser(),
    });

    // Clean up when window is destroyed
    event.sender.once('destroyed', () => {
      authStateListeners.delete(event.sender);
    });
  });

  /**
   * Unregister from auth state updates
   */
  ipcMain.on('auth:unsubscribe', (event) => {
    authStateListeners.delete(event.sender);
  });

  // ===========================================
  // BROADCAST AUTH EVENTS TO ALL LISTENERS
  // ===========================================

  /**
   * Broadcast auth state changes to all subscribed windows
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  function broadcastAuthEvent(eventName, data) {
    authStateListeners.forEach((sender) => {
      if (!sender.isDestroyed()) {
        sender.send(eventName, data);
      }
    });
  }

  /**
   * Clear all tokens (for testing/debugging)
   * This directly clears stored tokens without notifying the server
   */
  ipcMain.handle('auth:clear-tokens', async () => {
    console.log('Auth IPC: Clearing tokens (direct clear)');
    try {
      // Stop session monitoring
      authService.stopSessionMonitoring();

      // Clear stored credentials
      await tokenStore.clearAll();

      // Reset auth service state
      authService.user = null;
      authService.isAuthenticated = false;

      // Broadcast state change
      broadcastAuthEvent('auth:state-changed', { isAuthenticated: false, user: null });

      console.log('Auth IPC: Tokens cleared successfully');
      return { success: true };
    } catch (error) {
      console.error('Auth IPC: Clear tokens error:', error);
      return { success: false, error: error.message };
    }
  });

  // Listen to auth service events and broadcast
  authService.on('auth:success', (user) => {
    broadcastAuthEvent('auth:state-changed', { isAuthenticated: true, user });
    broadcastAuthEvent('auth:success', user);
  });

  authService.on('auth:logout', () => {
    broadcastAuthEvent('auth:state-changed', { isAuthenticated: false, user: null });
    broadcastAuthEvent('auth:logout-complete');
  });

  authService.on('auth:error', (error) => {
    broadcastAuthEvent('auth:error', { message: error.message });
  });

  authService.on('auth:expired', () => {
    broadcastAuthEvent('auth:state-changed', { isAuthenticated: false, user: null });
    broadcastAuthEvent('auth:session-expired');
  });

  authService.on('auth:restored', (user) => {
    broadcastAuthEvent('auth:state-changed', { isAuthenticated: true, user });
    broadcastAuthEvent('auth:restored', user);
  });

  authService.on('auth:refreshed', (user) => {
    broadcastAuthEvent('auth:state-changed', { isAuthenticated: true, user });
  });

  authService.on('auth:required', () => {
    broadcastAuthEvent('auth:state-changed', { isAuthenticated: false, user: null });
    broadcastAuthEvent('auth:required');
  });

  handlersRegistered = true;
  console.log('Auth IPC: Handlers registered successfully');
}

/**
 * Unregister all authentication IPC handlers
 * Useful for testing or cleanup
 */
function unregisterAuthIpcHandlers() {
  if (!handlersRegistered) {
    return;
  }

  // Remove all handlers
  ipcMain.removeHandler('auth:is-authenticated');
  ipcMain.removeHandler('auth:get-user');
  ipcMain.removeHandler('auth:get-user-info');
  ipcMain.removeHandler('auth:get-token');
  ipcMain.removeHandler('auth:validate-session');
  ipcMain.removeHandler('auth:refresh-tokens');
  ipcMain.removeHandler('auth:submit-manual-token');
  ipcMain.removeHandler('auth:get-config');
  ipcMain.removeHandler('auth:clear-tokens');
  ipcMain.removeHandler('auth:toggle-server');
  ipcMain.removeHandler('auth:is-local-running');
  ipcMain.removeHandler('auth:switch-server');

  // Note: ipcMain.on handlers cannot be easily removed by channel name
  // They would need to store references to the handlers

  handlersRegistered = false;
  console.log('Auth IPC: Handlers unregistered');
}

module.exports = {
  registerAuthIpcHandlers,
  unregisterAuthIpcHandlers,
};
