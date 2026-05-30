/**
 * Auth Preload Script
 * 
 * Exposes authentication APIs to the renderer process in a secure way.
 * Uses contextBridge to prevent direct access to Node.js APIs.
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose auth API to renderer
contextBridge.exposeInMainWorld('authAPI', {
  // ===========================================
  // LOGIN / SIGNUP / LOGOUT
  // ===========================================

  /**
   * Start the login flow
   * Opens web browser for authentication
   * @param {Object} options - Optional login options
   */
  login: (options = {}) => {
    ipcRenderer.send('auth:login', options);
  },

  /**
   * Start the signup flow
   * Opens web browser for registration
   * @param {Object} options - Optional signup options
   */
  signup: (options = {}) => {
    ipcRenderer.send('auth:signup', options);
  },

  /**
   * Log out the current user
   */
  logout: () => {
    ipcRenderer.send('auth:logout');
  },

  /**
   * Start 7-day guest trial without signing in
   */
  startGuestTrial: () => {
    ipcRenderer.send('auth:start-guest-trial');
  },

  // ===========================================
  // SESSION & USER INFO
  // ===========================================

  /**
   * Check if user is currently authenticated
   * @returns {Promise<boolean>} Is authenticated
   */
  isAuthenticated: () => {
    return ipcRenderer.invoke('auth:is-authenticated');
  },

  /**
   * Get the current user data
   * @returns {Promise<Object|null>} User data or null
   */
  getUser: () => {
    return ipcRenderer.invoke('auth:get-user');
  },

  /**
   * Get the access token for API calls
   * @returns {Promise<string|null>} Access token or null
   */
  getToken: () => {
    return ipcRenderer.invoke('auth:get-token');
  },

  /**
   * Validate the current session with the server
   * @returns {Promise<boolean>} Is valid
   */
  validateSession: () => {
    return ipcRenderer.invoke('auth:validate-session');
  },

  /**
   * Manually refresh the authentication tokens
   * @returns {Promise<boolean>} Success
   */
  refreshTokens: () => {
    return ipcRenderer.invoke('auth:refresh-tokens');
  },

  /**
   * Submit a manual authentication token
   * Used when deep link doesn't work and user copies token from web
   * @param {string} token - The authentication token
   * @returns {Promise<Object>} User data on success
   */
  submitManualToken: (token) => {
    return ipcRenderer.invoke('auth:submit-manual-token', token);
  },

  /**
   * Get auth configuration
   * @returns {Promise<Object>} Config object
   */
  getConfig: () => {
    return ipcRenderer.invoke('auth:get-config');
  },

  /**
   * Clear all tokens directly (for testing/debugging)
   * This clears tokens without notifying the server
   * @returns {Promise<Object>} Success status
   */
  clearTokens: () => {
    return ipcRenderer.invoke('auth:clear-tokens');
  },

  // ===========================================
  // EVENT LISTENERS
  // ===========================================

  /**
   * Subscribe to auth state changes
   * Receive real-time updates when auth state changes
   */
  subscribe: () => {
    ipcRenderer.send('auth:subscribe');
  },

  /**
   * Unsubscribe from auth state changes
   */
  unsubscribe: () => {
    ipcRenderer.send('auth:unsubscribe');
  },

  /**
   * Listen for auth success
   * @param {Function} callback - Called with user data on success
   * @returns {Function} Cleanup function
   */
  onAuthSuccess: (callback) => {
    const handler = (event, user) => callback(user);
    ipcRenderer.on('auth:success', handler);
    return () => ipcRenderer.removeListener('auth:success', handler);
  },

  /**
   * Listen for auth errors
   * @param {Function} callback - Called with error object
   * @returns {Function} Cleanup function
   */
  onAuthError: (callback) => {
    const handler = (event, error) => callback(error);
    ipcRenderer.on('auth:error', handler);
    return () => ipcRenderer.removeListener('auth:error', handler);
  },

  /**
   * Listen for logout events
   * @param {Function} callback - Called when logged out
   * @returns {Function} Cleanup function
   */
  onLogout: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('auth:logout-complete', handler);
    return () => ipcRenderer.removeListener('auth:logout-complete', handler);
  },

  /**
   * Listen for session expiry
   * @param {Function} callback - Called when session expires
   * @returns {Function} Cleanup function
   */
  onSessionExpired: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('auth:session-expired', handler);
    return () => ipcRenderer.removeListener('auth:session-expired', handler);
  },

  /**
   * Listen for auth state changes
   * @param {Function} callback - Called with { isAuthenticated, user }
   * @returns {Function} Cleanup function
   */
  onStateChange: (callback) => {
    const handler = (event, state) => callback(state);
    ipcRenderer.on('auth:state-changed', handler);
    return () => ipcRenderer.removeListener('auth:state-changed', handler);
  },

  /**
   * Listen for auth required (need to login)
   * @param {Function} callback - Called when auth is required
   * @returns {Function} Cleanup function
   */
  onAuthRequired: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('auth:required', handler);
    return () => ipcRenderer.removeListener('auth:required', handler);
  },

  /**
   * Listen for session restored on app start
   * @param {Function} callback - Called with user data
   * @returns {Function} Cleanup function
   */
  onSessionRestored: (callback) => {
    const handler = (event, user) => callback(user);
    ipcRenderer.on('auth:restored', handler);
    return () => ipcRenderer.removeListener('auth:restored', handler);
  },
});

// Expose window controls (for frameless window)
contextBridge.exposeInMainWorld('windowAPI', {
  close: () => ipcRenderer.send('window:close'),
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
});

console.log('Auth preload: APIs exposed to renderer');
