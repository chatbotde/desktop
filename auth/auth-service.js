/**
 * Authentication Service
 * 
 * Core authentication logic for the desktop app.
 * Handles:
 * - Login/Signup flow initiation
 * - Token management and refresh
 * - Session validation
 * - User state management
 */

const { shell, BrowserWindow, app } = require('electron');
const path = require('path');
const { EventEmitter } = require('events');
const config = require('./config');
const { tokenStore } = require('./token-store');

// Use native fetch or cross-fetch
let fetch;
try {
  fetch = require('cross-fetch');
} catch (e) {
  fetch = globalThis.fetch;
}

class AuthService extends EventEmitter {
  constructor() {
    super();

    this.user = null;
    this.isAuthenticated = false;
    this.sessionCheckInterval = null;
    this.refreshRetries = 0;
    this.oauthWindow = null;
  }

  // ===========================================
  // INITIALIZATION
  // ===========================================

  /**
   * Initialize the auth service
   * Checks for existing session and restores it
   * Supports offline mode - trusts local tokens if server is unreachable
   * @returns {Promise<Object|null>} User data if authenticated
   */
  async initialize() {
    console.log('Auth Service: Initializing...');

    try {
      // Check for stored credentials
      const hasCredentials = await tokenStore.hasCredentials();

      if (hasCredentials) {
        console.log('Auth Service: Found stored credentials, checking local validity...');

        // Check if local token is valid (not expired)
        const accessToken = await tokenStore.getAccessToken();
        const sessionToken = await tokenStore.getSessionToken();
        const token = accessToken || sessionToken;

        if (token && !tokenStore.isTokenExpired(token, config.TOKEN_REFRESH_THRESHOLD)) {
          // Local token is valid - restore user immediately (offline mode)
          this.user = await tokenStore.getUserData();
          this.isAuthenticated = true;

          console.log('Auth Service: Local session valid, restored (offline mode)');

          // Try server validation in background but don't wait for it
          this.validateSessionInBackground();

          this.emit('auth:restored', this.user);
          return this.user;
        }

        // Token is expired locally, try to refresh
        console.log('Auth Service: Local token expired, attempting refresh...');
        const refreshed = await this.refreshTokens();

        if (refreshed) {
          this.user = await tokenStore.getUserData();
          this.isAuthenticated = true;

          console.log('Auth Service: Token refreshed successfully');
          this.startSessionMonitoring();
          this.emit('auth:refreshed', this.user);

          return this.user;
        }

        // Refresh failed - try server validation as last resort
        console.log('Auth Service: Refresh failed, trying server validation...');
        const isValid = await this.validateSession();

        if (isValid) {
          this.user = await tokenStore.getUserData();
          this.isAuthenticated = true;
          this.startSessionMonitoring();
          this.emit('auth:restored', this.user);
          return this.user;
        }

        // Server validation failed - check if we still have valid local token
        const currentToken = await tokenStore.getAccessToken() || await tokenStore.getSessionToken();
        if (currentToken && !tokenStore.isTokenExpired(currentToken, 0)) {
          // Still have valid local token - allow offline access
          this.user = await tokenStore.getUserData();
          this.isAuthenticated = true;
          console.log('Auth Service: Using offline mode (local token still valid)');
          this.emit('auth:restored', this.user);
          return this.user;
        }

        // All validation failed - clear invalid credentials
        console.log('Auth Service: All validation failed, clearing credentials');
        await tokenStore.clearAll();
      }

      console.log('Auth Service: No valid session found');
      this.emit('auth:required');
      return null;

    } catch (error) {
      console.error('Auth Service: Initialization error:', error);
      this.emit('auth:error', error);
      return null;
    }
  }

  /**
   * Validate session with server in background (non-blocking)
   * @private
   */
  async validateSessionInBackground() {
    setTimeout(async () => {
      try {
        console.log('Auth Service: Background session validation...');
        const isValid = await this.validateSession();

        if (isValid) {
          console.log('Auth Service: Background validation - session is valid');
        } else {
          // Try refresh in background
          const refreshed = await this.refreshTokens();
          if (refreshed) {
            console.log('Auth Service: Background validation - token refreshed');
          } else {
            console.log('Auth Service: Background validation - using offline mode');
          }
        }
      } catch (error) {
        console.log('Auth Service: Background validation skipped (offline mode):', error.message);
      }
    }, 2000); // Wait 2 seconds before checking
  }

  // ===========================================
  // LOGIN / SIGNUP FLOW
  // ===========================================

  /**
   * Start the login flow
   * Opens the web browser for authentication
   * @param {Object} options - Login options
   */
  async login(options = {}) {
    console.log('Auth Service: Starting login flow...');

    const loginUrl = config.getAuthUrl(config.AUTH_ENDPOINTS.LOGIN, {
      ...options,
      state: this.generateState(),
    });

    console.log('Auth Service: Opening login URL:', loginUrl);

    if (config.OAUTH_WINDOW.USE_SYSTEM_BROWSER) {
      // Open in system browser
      await shell.openExternal(loginUrl);
    } else {
      // Open in embedded window
      this.openOAuthWindow(loginUrl);
    }

    this.emit('auth:login-started');
  }

  /**
   * Start the signup flow
   * Opens the web browser for registration
   * @param {Object} options - Signup options
   */
  async signup(options = {}) {
    console.log('Auth Service: Starting signup flow...');

    const signupUrl = config.getAuthUrl(config.AUTH_ENDPOINTS.SIGNUP, {
      ...options,
      state: this.generateState(),
    });

    console.log('Auth Service: Opening signup URL:', signupUrl);

    if (config.OAUTH_WINDOW.USE_SYSTEM_BROWSER) {
      await shell.openExternal(signupUrl);
    } else {
      this.openOAuthWindow(signupUrl);
    }

    this.emit('auth:signup-started');
  }

  /**
   * Open OAuth window for embedded auth flow
   * @param {string} url - Auth URL to open
   */
  openOAuthWindow(url) {
    if (this.oauthWindow && !this.oauthWindow.isDestroyed()) {
      this.oauthWindow.loadURL(url);
      this.oauthWindow.show();
      return;
    }

    // Get the icon path from the app root
    const iconPath = path.join(app.getAppPath(), 'icons', 'icon.ico');

    this.oauthWindow = new BrowserWindow({
      width: config.OAUTH_WINDOW.WIDTH,
      height: config.OAUTH_WINDOW.HEIGHT,
      title: 'Sign In',
      show: true,
      icon: iconPath,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    this.oauthWindow.loadURL(url);

    // Handle navigation to callback URL
    this.oauthWindow.webContents.on('will-redirect', (event, redirectUrl) => {
      if (redirectUrl.startsWith(`${config.PROTOCOL}://`)) {
        event.preventDefault();
        this.handleAuthCallback(redirectUrl);
        this.oauthWindow.close();
      }
    });

    this.oauthWindow.on('closed', () => {
      this.oauthWindow = null;
    });
  }

  // ===========================================
  // AUTH CALLBACK HANDLING
  // ===========================================

  /**
   * Handle the authentication callback from web
   * Called when the app receives a deep link or manual token input
   * @param {string|Object} urlOrParams - Callback URL with auth data or params object
   * @returns {Promise<Object|null>} User data if successful
   */
  async handleAuthCallback(urlOrParams) {
    console.log('Auth Service: Handling auth callback:', urlOrParams);

    let params;

    // Support both URL string and direct params object
    if (typeof urlOrParams === 'string') {
      const parsed = config.parseDeepLink(urlOrParams);

      if (!parsed) {
        const error = new Error('Invalid callback URL');
        this.emit('auth:error', error);
        return null;
      }

      params = parsed.params;
    } else if (typeof urlOrParams === 'object') {
      // Direct params object (e.g., from manual token input)
      params = urlOrParams;
    } else {
      const error = new Error('Invalid callback data');
      this.emit('auth:error', error);
      return null;
    }

    // Check for error
    if (params.error) {
      const error = new Error(params.error_description || params.error);
      console.error('Auth Service: Auth error:', error);
      this.emit('auth:error', error);
      return null;
    }

    // Handle different callback types
    if (params.token || params.access_token || params.code) {
      try {
        let tokens;

        if (params.code) {
          // Exchange code for tokens
          tokens = await this.exchangeCodeForTokens(params.code);
        } else {
          // Direct token response
          tokens = {
            accessToken: params.access_token || params.token,
            refreshToken: params.refresh_token,
            sessionToken: params.session_token,
            expiresIn: params.expires_in,
          };
        }

        // Store tokens
        await tokenStore.storeAuthTokens(tokens);

        // Fetch and store user data
        const user = await this.fetchUserInfo(tokens.accessToken || tokens.sessionToken);

        if (user) {
          await tokenStore.storeUserData(user);
          this.user = user;
          this.isAuthenticated = true;

          // Start session monitoring
          this.startSessionMonitoring();

          console.log('Auth Service: Login successful:', user.email || user.id);
          this.emit('auth:success', user);

          return user;
        }
      } catch (error) {
        console.error('Auth Service: Failed to process callback:', error);
        this.emit('auth:error', error);
        throw error; // Re-throw for manual token submission
      }
    }

    return null;
  }

  /**
   * Exchange authorization code for tokens
   * @param {string} code - Authorization code
   * @returns {Promise<Object>} Tokens
   */
  async exchangeCodeForTokens(code) {
    const response = await fetch(`${config.WEB_AUTH_URL}${config.AUTH_ENDPOINTS.CALLBACK}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        redirect_uri: config.getCallbackUrl(),
        client: 'desktop',
      }),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.status}`);
    }

    return response.json();
  }

  // ===========================================
  // SESSION MANAGEMENT
  // ===========================================

  /**
   * Validate the current session with the server
   * @returns {Promise<boolean>} Is valid
   */
  async validateSession() {
    try {
      const accessToken = await tokenStore.getAccessToken();
      const sessionToken = await tokenStore.getSessionToken();
      const token = accessToken || sessionToken;

      if (!token) {
        return false;
      }

      // Check if token is expired locally first
      if (tokenStore.isTokenExpired(token, config.TOKEN_REFRESH_THRESHOLD)) {
        console.log('Auth Service: Token is expired or near expiry');
        return false;
      }

      // Validate with server
      const response = await fetch(`${config.WEB_AUTH_URL}${config.AUTH_ENDPOINTS.VERIFY_TOKEN}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.ok;

    } catch (error) {
      console.error('Auth Service: Session validation error:', error);
      return false;
    }
  }

  /**
   * Refresh the authentication tokens
   * @returns {Promise<boolean>} Success
   */
  async refreshTokens() {
    if (this.refreshRetries >= config.MAX_REFRESH_RETRIES) {
      console.error('Auth Service: Max refresh retries exceeded');
      this.refreshRetries = 0;
      return false;
    }

    try {
      const refreshToken = await tokenStore.getRefreshToken();

      if (!refreshToken) {
        console.log('Auth Service: No refresh token available');
        return false;
      }

      this.refreshRetries++;

      const response = await fetch(`${config.WEB_AUTH_URL}${config.AUTH_ENDPOINTS.REFRESH_TOKEN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        console.error('Auth Service: Token refresh failed:', response.status);
        return false;
      }

      const tokens = await response.json();
      await tokenStore.storeAuthTokens(tokens);

      this.refreshRetries = 0;
      console.log('Auth Service: Tokens refreshed successfully');

      return true;

    } catch (error) {
      console.error('Auth Service: Token refresh error:', error);
      return false;
    }
  }

  /**
   * Start session monitoring
   * Periodically validates session and refreshes tokens
   */
  startSessionMonitoring() {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }

    this.sessionCheckInterval = setInterval(async () => {
      console.log('Auth Service: Checking session...');

      const accessToken = await tokenStore.getAccessToken();

      if (accessToken && tokenStore.isTokenExpired(accessToken, config.TOKEN_REFRESH_THRESHOLD)) {
        console.log('Auth Service: Token near expiry, refreshing...');
        const refreshed = await this.refreshTokens();

        if (!refreshed) {
          console.log('Auth Service: Failed to refresh, session expired');
          this.isAuthenticated = false;
          this.user = null;
          this.emit('auth:expired');
        }
      }
    }, config.SESSION_CHECK_INTERVAL);

    console.log('Auth Service: Session monitoring started');
  }

  /**
   * Stop session monitoring
   */
  stopSessionMonitoring() {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
      console.log('Auth Service: Session monitoring stopped');
    }
  }

  // ===========================================
  // USER INFO
  // ===========================================

  /**
   * Fetch user information from the server
   * @param {string} token - Access or session token
   * @returns {Promise<Object|null>} User data
   */
  async fetchUserInfo(token) {
    try {
      const response = await fetch(`${config.WEB_AUTH_URL}${config.AUTH_ENDPOINTS.USER_INFO}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user info: ${response.status}`);
      }

      const data = await response.json();
      return data.user || data;

    } catch (error) {
      console.error('Auth Service: Failed to fetch user info:', error);
      return null;
    }
  }

  /**
   * Get the current user
   * @returns {Object|null} User data
   */
  getUser() {
    return this.user;
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} Is authenticated
   */
  isLoggedIn() {
    return this.isAuthenticated;
  }

  /**
   * Get the current access token
   * Useful for making authenticated API requests
   * @returns {Promise<string|null>} Access token
   */
  async getAccessToken() {
    return tokenStore.getAccessToken();
  }

  // ===========================================
  // LOGOUT
  // ===========================================

  /**
   * Log out the current user
   * Clears all stored credentials and notifies the server
   */
  async logout() {
    console.log('Auth Service: Logging out...');

    try {
      // Notify server of logout
      const token = await tokenStore.getAccessToken() || await tokenStore.getSessionToken();

      if (token) {
        await fetch(`${config.WEB_AUTH_URL}${config.AUTH_ENDPOINTS.LOGOUT}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }).catch(() => {
          // Ignore server errors during logout
        });
      }
    } catch (error) {
      console.warn('Auth Service: Server logout notification failed:', error);
    }

    // Stop session monitoring
    this.stopSessionMonitoring();

    // Clear stored credentials
    await tokenStore.clearAll();

    // Reset state
    this.user = null;
    this.isAuthenticated = false;

    // Close OAuth window if open
    if (this.oauthWindow && !this.oauthWindow.isDestroyed()) {
      this.oauthWindow.close();
    }

    console.log('Auth Service: Logged out successfully');
    this.emit('auth:logout');
  }

  // ===========================================
  // UTILITIES
  // ===========================================

  /**
   * Generate a random state for CSRF protection
   * @returns {string} Random state string
   */
  generateState() {
    const array = new Uint8Array(32);
    require('crypto').randomFillSync(array);
    return Buffer.from(array).toString('base64url');
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.stopSessionMonitoring();

    if (this.oauthWindow && !this.oauthWindow.isDestroyed()) {
      this.oauthWindow.close();
    }

    this.removeAllListeners();
  }
}

// Export singleton instance
const authService = new AuthService();
module.exports = { authService, AuthService };
