/**
 * Interfaces Window
 * 
 * Manages the interfaces window UI.
 * Loads frontend via custom protocol (app://)
 */

const { BrowserWindow, app, ipcMain } = require('electron');
const path = require('path');
const { protocolHandler } = require('./protocol-handler');

class InterfacesWindow {
  constructor() {
    this.window = null;
    this.isShowing = false;
    this.protocolRegistered = false;
    this.clickthroughEnabled = true; // Start with clickthrough enabled
    this.hasFocus = false; // Track focus state
    this.isChangingFocus = false; // Prevent clickthrough changes during focus transitions
    this._setupIPCHandlers();
  }

  /**
   * Setup IPC handlers for clickthrough
   * @private
   */
  _setupIPCHandlers() {
    // Enable clickthrough
    ipcMain.on('interfaces:clickthrough:enable', () => {
      this.enableClickthrough();
    });

    // Disable clickthrough
    ipcMain.on('interfaces:clickthrough:disable', () => {
      this.disableClickthrough();
    });

    // Toggle clickthrough
    ipcMain.on('interfaces:clickthrough:toggle', () => {
      if (this.clickthroughEnabled) {
        this.disableClickthrough();
      } else {
        this.enableClickthrough();
      }
    });

    // Get clickthrough state
    ipcMain.handle('interfaces:clickthrough:get-state', () => {
      return this.clickthroughEnabled;
    });
  }

  /**
   * Enable clickthrough mode (window ignores mouse events)
   */
  enableClickthrough() {
    if (!this.window || this.window.isDestroyed()) return;
    
    // Don't change clickthrough state during focus transitions
    if (this.isChangingFocus) {
      console.log('[InterfacesWindow] Skipping clickthrough enable during focus change');
      return;
    }
    
    this.window.setIgnoreMouseEvents(true, { forward: true });
    this.clickthroughEnabled = true;
    this.send('interfaces:clickthrough:state-changed', true);
    console.log('[InterfacesWindow] Clickthrough enabled');
  }

  /**
   * Disable clickthrough mode (window captures mouse events)
   */
  disableClickthrough() {
    if (!this.window || this.window.isDestroyed()) return;
    
    // Don't change clickthrough state during focus transitions
    if (this.isChangingFocus) {
      console.log('[InterfacesWindow] Skipping clickthrough disable during focus change');
      return;
    }
    
    this.window.setIgnoreMouseEvents(false);
    this.clickthroughEnabled = false;
    this.send('interfaces:clickthrough:state-changed', false);
    console.log('[InterfacesWindow] Clickthrough disabled');
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
      fullscreen:true,
      resizable: true,
      frame: false,
      alwaysOnTop: true,
      transparent: true,
      titleBarStyle: 'hidden',
      autoHideMenuBar: true,
      skipTaskbar: true, // Don't show in taskbar to avoid focus issues
      focusable: true, // Keep focusable so interactions work
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
      // Enable clickthrough after window is ready
      this.enableClickthrough();
    });

    // Handle focus events to prevent clickthrough changes during focus transitions
    this.window.on('focus', () => {
      this.isChangingFocus = true;
      this.hasFocus = true;
      console.log('[InterfacesWindow] Window focused');
      
      // Ensure window stays visible and on top
      if (this.window && !this.window.isDestroyed()) {
        this.window.setAlwaysOnTop(true, 'screen-saver');
      }
      
      // Reset flag after a short delay
      setTimeout(() => {
        this.isChangingFocus = false;
      }, 100);
    });

    this.window.on('blur', () => {
      this.isChangingFocus = true;
      this.hasFocus = false;
      console.log('[InterfacesWindow] Window blurred');
      
      // Keep window visible and on top even when blurred
      if (this.window && !this.window.isDestroyed()) {
        this.window.setAlwaysOnTop(true, 'screen-saver');
      }
      
      // Reset flag after a short delay
      setTimeout(() => {
        this.isChangingFocus = false;
      }, 100);
    });

    // Handle close
    this.window.on('closed', () => {
      this.window = null;
      this.isShowing = false;
      this.hasFocus = false;
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
