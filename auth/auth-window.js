/**
 * Auth Window
 * 
 * Manages the authentication window UI.
 * Shows login/signup buttons and status information.
 */

const { BrowserWindow } = require('electron');
const path = require('path');
const config = require('./config');
const { authService } = require('./auth-service');

class AuthWindow {
  constructor() {
    this.window = null;
    this.isShowing = false;
  }

  /**
   * Create and show the auth window
   * @returns {BrowserWindow} The created window
   */
  create() {
    if (this.window && !this.window.isDestroyed()) {
      this.window.focus();
      return this.window;
    }

    this.window = new BrowserWindow({
      width: config.AUTH_WINDOW.WIDTH,
      height: config.AUTH_WINDOW.HEIGHT,
      minWidth: config.AUTH_WINDOW.MIN_WIDTH,
      minHeight: config.AUTH_WINDOW.MIN_HEIGHT,
      resizable: config.AUTH_WINDOW.RESIZABLE,
      frame: false,
      transparent: false,
      backgroundColor: '#0ea5e9',
      titleBarStyle: 'hidden',
      autoHideMenuBar: true,
      show: false,
      icon: path.join(__dirname, '../icons/icon.ico'),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'auth-preload.js'),
      },
    });

    this.window.loadFile(path.join(__dirname, 'auth.html'));

    // Show when ready
    this.window.once('ready-to-show', () => {
      this.window.show();
      this.isShowing = true;
    });

    // Handle close
    this.window.on('closed', () => {
      this.window = null;
      this.isShowing = false;
    });

    // Listen for auth success to auto-close
    authService.on('auth:success', () => {
      this.close();
    });

    return this.window;
  }

  /**
   * Show the auth window
   */
  show() {
    if (this.window && !this.window.isDestroyed()) {
      this.window.show();
      this.window.focus();
      this.isShowing = true;
    } else {
      this.create();
    }
  }

  /**
   * Hide the auth window
   */
  hide() {
    if (this.window && !this.window.isDestroyed()) {
      this.window.hide();
      this.isShowing = false;
    }
  }

  /**
   * Close the auth window
   */
  close() {
    if (this.window && !this.window.isDestroyed()) {
      this.window.close();
    }
    this.window = null;
    this.isShowing = false;
  }

  /**
   * Get the window instance
   * @returns {BrowserWindow|null} Window instance
   */
  getWindow() {
    return this.window;
  }

  /**
   * Check if window is visible
   * @returns {boolean} Is showing
   */
  isVisible() {
    return this.isShowing && this.window && !this.window.isDestroyed();
  }

  /**
   * Send a message to the window
   * @param {string} channel - IPC channel
   * @param {any} data - Data to send
   */
  send(channel, data) {
    if (this.window && !this.window.isDestroyed()) {
      this.window.webContents.send(channel, data);
    }
  }

  /**
   * Update the window with auth state
   * @param {Object} state - Auth state
   */
  updateAuthState(state) {
    this.send('auth:state-changed', state);
  }

  /**
   * Destroy the window
   */
  destroy() {
    if (this.window && !this.window.isDestroyed()) {
      this.window.destroy();
    }
    this.window = null;
    this.isShowing = false;
  }
}

module.exports = { AuthWindow };
