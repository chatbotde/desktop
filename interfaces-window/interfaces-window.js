/**
 * Interfaces Window
 * 
 * Manages the interfaces window UI.
 * Loads frontend via custom protocol (app://)
 */

const { BrowserWindow, app } = require('electron');
const path = require('path');
const { protocolHandler } = require('./protocol-handler');

class InterfacesWindow {
  constructor() {
    this.window = null;
    this.isShowing = false;
    this.protocolRegistered = false;
  }

  /**
   * Get the frontend URL based on environment
   * @returns {string} URL to load
   */
  getFrontendURL() {
    const isDevelopment = !app.isPackaged && process.env.NODE_ENV !== 'production';
    
    if (isDevelopment) {
      // In development, load from Vite dev server
      return 'http://localhost:5173';
    } else {
      // In production, use custom protocol
      return protocolHandler.getURL('/');
    }
  }

  /**
   * Register custom protocol for production
   */
  registerProtocol() {
    if (this.protocolRegistered) return;
    
    const isDevelopment = !app.isPackaged && process.env.NODE_ENV !== 'production';
    
    if (!isDevelopment) {
      // Register protocol with app-frontend as base path
      const frontendPath = path.join(__dirname, '..', 'app-frontend');
      protocolHandler.register(frontendPath);
      this.protocolRegistered = true;
    }
  }

  /**
   * Create the interfaces window (does not show by default)
   * @param {boolean} showOnReady - Whether to show window when ready (default: false)
   * @returns {BrowserWindow} The created window
   */
  create(showOnReady = false) {
    if (this.window && !this.window.isDestroyed()) {
      if (showOnReady) {
        this.window.show();
        this.window.focus();
      }
      return this.window;
    }

    // Register protocol before creating window
    this.registerProtocol();

    this.window = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      resizable: true,
      frame: false,
      transparent: true,
      titleBarStyle: 'hidden',
      autoHideMenuBar: true,
      show: false, // Never show immediately
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'interfaces-preload.js'),
        webSecurity: true,
      },
    });

    // Load frontend URL
    const url = this.getFrontendURL();
    console.log('InterfacesWindow: Loading URL:', url);
    this.window.loadURL(url);

    // Only show when ready if requested
    this.window.once('ready-to-show', () => {
      if (showOnReady) {
        this.window.show();
        this.isShowing = true;
      }
    });

    // Handle close
    this.window.on('closed', () => {
      this.window = null;
      this.isShowing = false;
    });

    // Open DevTools in development
    const isDevelopment = !app.isPackaged && process.env.NODE_ENV !== 'production';
    if (isDevelopment) {
      this.window.webContents.openDevTools({ mode: 'detach' });
    }

    return this.window;
  }

  /**
   * Show the interfaces window
   */
  show() {
    if (this.window && !this.window.isDestroyed()) {
      this.window.show();
      this.window.focus();
      this.isShowing = true;
    } else {
      this.create(true); // Pass true to show when ready
    }
  }

  /**
   * Hide the interfaces window
   */
  hide() {
    if (this.window && !this.window.isDestroyed()) {
      this.window.hide();
      this.isShowing = false;
    }
  }

  /**
   * Close the interfaces window
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

module.exports = { InterfacesWindow };
