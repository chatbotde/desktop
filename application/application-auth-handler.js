/**
 * Application Auth Handler
 * Handles authentication initialization and event management
 * 
 * Single Responsibility: Manages authentication lifecycle
 */

const { initializeAuth, authService, AuthWindow } = require('../auth');
const { guestModeStore } = require('../auth/guest-mode-store');
const { isHostedAuthEnabled } = require('../auth/auth-mode');

class ApplicationAuthHandler {
  /**
   * @param {Function} onAuthSuccess - Callback when auth succeeds
   * @param {Function} onAuthLogout - Callback when user logs out
   * @param {Function} onAuthExpired - Callback when session expires
   * @param {Function} onAuthError - Callback when auth error occurs
   * @param {Function} onGuestTrialStart - Callback when guest trial starts
   */
  constructor(onAuthSuccess, onAuthLogout, onAuthExpired, onAuthError, onGuestTrialStart) {
    this.onAuthSuccess = onAuthSuccess;
    this.onAuthLogout = onAuthLogout;
    this.onAuthExpired = onAuthExpired;
    this.onAuthError = onAuthError;
    this.onGuestTrialStart = onGuestTrialStart;
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
      authService.on('auth:guest-trial-started', () => this.handleGuestTrialStart());
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
   * Skip the login window: local/open-source mode, or an active guest trial.
   */
  shouldSkipAuthWindow() {
    if (!isHostedAuthEnabled()) {
      return true;
    }
    return guestModeStore.shouldSkipAuthWindow();
  }

  /**
   * Show auth window if user is not authenticated
   */
  showAuthWindowIfNeeded() {
    if (this.shouldSkipAuthWindow()) {
      console.log('Application: Local mode or guest trial — not showing hosted login');
      return false;
    }
    if (!this.isAuthenticated()) {
      this.authWindow = new AuthWindow();
      this.authWindow.create();
      console.log('Application: Showing auth window (user not authenticated)');
      return true;
    }
    console.log('Application: User authenticated, skipping auth window');
    return false;
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
    if (isHostedAuthEnabled()) {
      this.showAuthWindowIfNeeded();
    }
    if (this.onAuthLogout) {
      this.onAuthLogout();
    }
  }

  /**
   * Handle guest trial start
   * @private
   */
  handleGuestTrialStart() {
    console.log('Application: Guest trial started, closing auth window');
    this.authWindow?.close();
    if (this.onGuestTrialStart) {
      this.onGuestTrialStart();
    }
  }

  /**
   * Handle auth expired event
   * @private
   */
  handleAuthExpired() {
    console.log('Application: Session expired');
    if (isHostedAuthEnabled()) {
      this.showAuthWindowIfNeeded();
    }
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

