/**
 * Application Auth Handler
 * Handles authentication initialization and event management
 * 
 * Single Responsibility: Manages authentication lifecycle
 */

const { initializeAuth, authService, AuthWindow } = require('../auth');

class ApplicationAuthHandler {
  /**
   * @param {Function} onAuthSuccess - Callback when auth succeeds
   * @param {Function} onAuthLogout - Callback when user logs out
   * @param {Function} onAuthExpired - Callback when session expires
   * @param {Function} onAuthError - Callback when auth error occurs
   */
  constructor(onAuthSuccess, onAuthLogout, onAuthExpired, onAuthError) {
    this.onAuthSuccess = onAuthSuccess;
    this.onAuthLogout = onAuthLogout;
    this.onAuthExpired = onAuthExpired;
    this.onAuthError = onAuthError;
    this.authWindow = null;
  }

  /**
   * Initialize authentication system
   */
  async initialize() {
    try {
      const user = await initializeAuth();
      if (user) {
        console.log('Application: User already authenticated:', user.email || user.id);
      } else {
        console.log('Application: No authenticated user');
      }

      // Setup auth event listeners
      authService.on('auth:success', (user) => this.handleAuthSuccess(user));
      authService.on('auth:logout', () => this.handleAuthLogout());
      authService.on('auth:expired', () => this.handleAuthExpired());
      authService.on('auth:error', (error) => this.handleAuthError(error));
    } catch (error) {
      console.error('Application: Auth initialization error:', error);
    }
  }

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    return authService.isLoggedIn();
  }

  /**
   * Get the current authenticated user
   * @returns {Object|null}
   */
  getCurrentUser() {
    return authService.getUser();
  }

  /**
   * Show auth window if user is not authenticated
   */
  showAuthWindowIfNeeded() {
    if (!this.isAuthenticated()) {
      this.authWindow = new AuthWindow();
      this.authWindow.create();
      console.log('Application: Showing auth window (user not authenticated)');
      return true;
    } else {
      console.log('Application: User authenticated, skipping auth window');
      return false;
    }
  }

  /**
   * Handle auth success event
   * @private
   */
  handleAuthSuccess(user) {
    console.log('Application: Auth success:', user.email || user.id);
    this.authWindow?.close();
    if (this.onAuthSuccess) {
      this.onAuthSuccess(user);
    }
  }

  /**
   * Handle auth logout event
   * @private
   */
  handleAuthLogout() {
    console.log('Application: User logged out');
    if (!this.authWindow) {
      this.authWindow = new AuthWindow();
    }
    this.authWindow.create();
    if (this.onAuthLogout) {
      this.onAuthLogout();
    }
  }

  /**
   * Handle auth expired event
   * @private
   */
  handleAuthExpired() {
    console.log('Application: Session expired');
    if (!this.authWindow) {
      this.authWindow = new AuthWindow();
    }
    this.authWindow.create();
    if (this.onAuthExpired) {
      this.onAuthExpired();
    }
  }

  /**
   * Handle auth error event
   * @private
   */
  handleAuthError(error) {
    console.error('Application: Auth error:', error.message);
    if (this.onAuthError) {
      this.onAuthError(error);
    }
  }

  /**
   * Get auth window instance
   * @returns {AuthWindow|null}
   */
  getAuthWindow() {
    return this.authWindow;
  }
}

module.exports = { ApplicationAuthHandler };

