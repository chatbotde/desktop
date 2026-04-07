/**
 * Authentication Configuration
 * 
 * Centralized configuration for the authentication system.
 * Modify these values to change authentication behavior.
 */

const { app } = require('electron');

// Get the app name for protocol registration
const APP_NAME = app?.name || 'buddy';

const config = {
  // ===========================================
  // WEB AUTH SERVER CONFIGURATION
  // ===========================================

  /**
   * Base URL of your web authentication server
   * Change this when deploying to production
   */
  WEB_AUTH_URL: process.env.AUTH_SERVER_URL || 'https://www.sonicthinking.com',

  /**
   * Auth endpoints on your web server
   */
  AUTH_ENDPOINTS: {
    LOGIN: '/auth/desktop-login',
    SIGNUP: '/auth/desktop-signup',
    CALLBACK: '/auth/desktop-callback',
    VERIFY_TOKEN: '/api/auth/verify-token',
    REFRESH_TOKEN: '/api/auth/refresh-token',
    LOGOUT: '/api/auth/logout',
    USER_INFO: '/api/auth/user-info',
  },

  // ===========================================
  // DEEP LINK / CUSTOM PROTOCOL CONFIGURATION
  // ===========================================

  /**
   * Custom protocol for deep linking (e.g., buddy://auth/callback)
   * This is used when the web redirects back to the desktop app
   */
  PROTOCOL: 'buddy',

  /**
   * Deep link paths
   */
  DEEP_LINK_PATHS: {
    AUTH_CALLBACK: '/auth/callback',
    AUTH_SUCCESS: '/auth/success',
    AUTH_ERROR: '/auth/error',
  },

  // ===========================================
  // TOKEN STORAGE CONFIGURATION
  // ===========================================

  /**
   * Service name for secure credential storage (keytar)
   * Tokens are stored securely in the OS keychain
   */
  KEYTAR_SERVICE: `${APP_NAME}-auth`,

  /**
   * Keys for storing different types of tokens
   */
  TOKEN_KEYS: {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    SESSION_TOKEN: 'session_token',
    USER_DATA: 'user_data',
    LAST_VALIDATED: 'last_validated_at',
  },

  // ===========================================
  // SESSION CONFIGURATION
  // ===========================================

  // Session check interval in milliseconds (30 minutes between checks when online)
  SESSION_CHECK_INTERVAL: 30 * 60 * 1000,

  // Token refresh threshold - how long before expiry to attempt refresh (5 minutes)
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000,

  // Maximum offline session duration - how long to trust local tokens without server validation (7 days)
  MAX_OFFLINE_SESSION_DAYS: 7,

  /**
   * Maximum number of token refresh retries
   */
  MAX_REFRESH_RETRIES: 3,

  // ===========================================
  // AUTH WINDOW CONFIGURATION
  // ===========================================

  /**
   * Auth window dimensions and settings
   */
  AUTH_WINDOW: {
    WIDTH: 320,
    HEIGHT: 380,
    MIN_WIDTH: 300,
    MIN_HEIGHT: 350,
    RESIZABLE: false,
  },

  /**
   * Browser window for OAuth (opened in system browser or embedded)
   */
  OAUTH_WINDOW: {
    WIDTH: 800,
    HEIGHT: 700,
    USE_SYSTEM_BROWSER: true, // Set to true to use system browser for OAuth
  },

  // ===========================================
  // HELPER METHODS
  // ===========================================

  /**
   * Get the full URL for a web auth endpoint
   * @param {string} endpoint - The endpoint path
   * @param {Object} params - Query parameters to append
   * @returns {string} Full URL
   */
  getAuthUrl(endpoint, params = {}) {
    const url = new URL(endpoint, this.WEB_AUTH_URL);

    // Add protocol callback URL
    url.searchParams.set('redirect_uri', this.getCallbackUrl());
    url.searchParams.set('client', 'desktop');
    url.searchParams.set('app_name', APP_NAME);

    // Add any additional params
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    return url.toString();
  },

  /**
   * Get the callback URL for deep linking
   * @returns {string} Callback URL (e.g., buddy://auth/callback)
   */
  getCallbackUrl() {
    return `${this.PROTOCOL}://${this.DEEP_LINK_PATHS.AUTH_CALLBACK.slice(1)}`;
  },

  /**
   * Parse a deep link URL
   * @param {string} url - The deep link URL to parse
   * @returns {Object|null} Parsed data or null if invalid
   */
  parseDeepLink(url) {
    try {
      console.log('Config: Parsing deep link URL:', url);

      // Normalize the URL - handle various formats
      let normalizedUrl = url;

      // Handle buddy:callback format (without //)
      if (url.match(/^[a-z]+:[^/]/i)) {
        const colonIndex = url.indexOf(':');
        normalizedUrl = url.substring(0, colonIndex) + '://' + url.substring(colonIndex + 1);
      }

      // Parse the URL
      const urlObj = new URL(normalizedUrl);

      // Extract path - for custom protocols, hostname might be the first path segment
      let path = urlObj.pathname || '';
      if (urlObj.hostname && urlObj.hostname !== 'localhost') {
        // For buddy://callback?token=xxx, hostname is "callback"
        path = '/' + urlObj.hostname + path;
      }

      // Extract query params
      const params = Object.fromEntries(urlObj.searchParams);

      const result = {
        protocol: urlObj.protocol.replace(':', ''),
        path: path,
        hostname: urlObj.hostname,
        params,
        raw: url,
      };

      console.log('Config: Parsed deep link result:', result);
      return result;
    } catch (error) {
      console.error('Failed to parse deep link:', error, 'URL:', url);
      return null;
    }
  },
};

module.exports = config;
