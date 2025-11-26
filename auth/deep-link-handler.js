/**
 * Deep Link Handler
 * 
 * Handles custom protocol (deep link) registration and callbacks.
 * Enables the desktop → web → desktop authentication flow.
 * 
 * Flow:
 * 1. Desktop opens web auth URL
 * 2. User authenticates on web
 * 3. Web redirects to buddy://auth/callback?token=xxx
 * 4. OS launches desktop app with the URL
 * 5. This handler processes the URL and completes auth
 */

const { app, dialog } = require('electron');
const config = require('./config');

// Don't import authService here to avoid circular dependency
// It will be set later via setAuthService()
let authService = null;

class DeepLinkHandler {
  constructor() {
    this.initialized = false;
    this.pendingUrl = null;
  }

  /**
   * Set the auth service reference (to avoid circular dependency)
   * @param {Object} service - The auth service instance
   */
  setAuthService(service) {
    authService = service;
    
    // Process pending URL if we have one
    if (this.pendingUrl && authService) {
      this.handleUrl(this.pendingUrl);
      this.pendingUrl = null;
    }
  }

  /**
   * Initialize the deep link handler
   * Should be called as early as possible in app startup
   */
  initialize() {
    if (this.initialized) {
      console.log('Deep Link Handler: Already initialized');
      return;
    }

    console.log('Deep Link Handler: Initializing...');
    
    // Register the custom protocol
    this.registerProtocol();
    
    // Handle URLs on macOS/Linux when app is already running
    app.on('open-url', (event, url) => {
      event.preventDefault();
      console.log('Deep Link Handler: Received URL (open-url):', url);
      this.handleUrl(url);
    });

    // Handle command line arguments (Windows & second-instance)
    this.handleCommandLineArgs(process.argv);

    // Handle second instance (when app is already running)
    app.on('second-instance', (event, argv, workingDirectory) => {
      console.log('Deep Link Handler: Second instance detected, argv:', argv);
      this.handleCommandLineArgs(argv);
      
      // Focus the main window
      this.focusMainWindow();
    });

    this.initialized = true;
    console.log('Deep Link Handler: Initialized successfully');
  }

  /**
   * Register the custom protocol with the OS
   */
  registerProtocol() {
    const protocol = config.PROTOCOL;
    
    // For Windows development, we need to pass the full path to electron
    // and include the app path as an argument
    if (process.platform === 'win32') {
      // In development, we need special handling
      const isDev = !app.isPackaged;
      
      if (isDev) {
        // Get the path to electron executable and app directory
        const electronPath = process.execPath;
        const appPath = app.getAppPath();
        
        console.log(`Deep Link Handler: Dev mode - registering with electron at ${electronPath}`);
        console.log(`Deep Link Handler: App path: ${appPath}`);
        
        // Remove existing registration first
        app.removeAsDefaultProtocolClient(protocol);
        
        // Register with full paths for development
        const success = app.setAsDefaultProtocolClient(protocol, electronPath, [appPath]);
        
        if (success) {
          console.log(`Deep Link Handler: Registered protocol "${protocol}://" for development`);
        } else {
          console.error(`Deep Link Handler: Failed to register protocol "${protocol}://" for development`);
        }
        return;
      }
    }
    
    // For production or non-Windows
    // Check if protocol is already registered
    const isRegistered = app.isDefaultProtocolClient(protocol);
    
    if (!isRegistered) {
      // Register the protocol
      const success = app.setAsDefaultProtocolClient(protocol);
      
      if (success) {
        console.log(`Deep Link Handler: Registered protocol "${protocol}://"`);
      } else {
        console.error(`Deep Link Handler: Failed to register protocol "${protocol}://"`);
      }
    } else {
      console.log(`Deep Link Handler: Protocol "${protocol}://" already registered`);
    }
  }

  /**
   * Unregister the custom protocol
   * Useful for development or cleanup
   */
  unregisterProtocol() {
    const protocol = config.PROTOCOL;
    
    if (app.isDefaultProtocolClient(protocol)) {
      app.removeAsDefaultProtocolClient(protocol);
      console.log(`Deep Link Handler: Unregistered protocol "${protocol}://"`);
    }
  }

  /**
   * Handle command line arguments to extract deep link URL
   * @param {string[]} argv - Command line arguments
   */
  handleCommandLineArgs(argv) {
    console.log('Deep Link Handler: Processing command line args:', argv);
    
    // Find URL argument
    const url = argv.find(arg => {
      const lowerArg = arg.toLowerCase();
      return lowerArg.startsWith(`${config.PROTOCOL}://`) || 
             lowerArg.startsWith(`${config.PROTOCOL}:`);
    });
    
    if (url) {
      console.log('Deep Link Handler: Found URL in args:', url);
      this.handleUrl(url);
    }
  }

  /**
   * Handle a deep link URL
   * @param {string} url - The deep link URL
   */
  async handleUrl(url) {
    console.log('Deep Link Handler: Handling URL:', url);
    
    // Wait for app to be ready
    if (!app.isReady()) {
      console.log('Deep Link Handler: App not ready, storing URL for later');
      this.pendingUrl = url;
      
      app.whenReady().then(() => {
        if (this.pendingUrl) {
          this.handleUrl(this.pendingUrl);
          this.pendingUrl = null;
        }
      });
      
      return;
    }
    
    // Wait for auth service to be set
    if (!authService) {
      console.log('Deep Link Handler: Auth service not ready, storing URL for later');
      this.pendingUrl = url;
      return;
    }
    
    // Parse the URL
    const parsed = config.parseDeepLink(url);
    
    if (!parsed) {
      console.error('Deep Link Handler: Failed to parse URL:', url);
      return;
    }
    
    console.log('Deep Link Handler: Parsed URL:', parsed);
    
    // Route based on path or just check for tokens
    const path = (parsed.path || '').toLowerCase();
    
    // Check if we have auth tokens in the URL
    if (parsed.params.token || parsed.params.code || parsed.params.access_token) {
      console.log('Deep Link Handler: Found auth tokens, routing to auth callback');
      await authService.handleAuthCallback(url);
    } else if (path.includes('callback') || path.includes('auth')) {
      // Authentication callback
      console.log('Deep Link Handler: Routing to auth callback based on path');
      await authService.handleAuthCallback(url);
    } else if (path.includes('success')) {
      // Auth success (alternative endpoint)
      console.log('Deep Link Handler: Auth success callback');
      await authService.handleAuthCallback(url);
    } else if (path.includes('error')) {
      // Auth error
      console.log('Deep Link Handler: Auth error callback');
      const error = parsed.params.error || parsed.params.message || 'Authentication failed';
      authService.emit('auth:error', new Error(error));
    } else {
      console.warn('Deep Link Handler: Unhandled deep link path:', path);
    }
    
    // Focus the main window after handling
    this.focusMainWindow();
  }

  /**
   * Focus the main window of the application
   */
  focusMainWindow() {
    const { BrowserWindow } = require('electron');
    const windows = BrowserWindow.getAllWindows();
    
    if (windows.length > 0) {
      const mainWindow = windows[0];
      
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      
      mainWindow.show();
      mainWindow.focus();
    }
  }

  /**
   * Check if a URL is a valid deep link for this app
   * @param {string} url - URL to check
   * @returns {boolean} Is valid deep link
   */
  isValidDeepLink(url) {
    if (!url || typeof url !== 'string') {
      return false;
    }
    
    const lowerUrl = url.toLowerCase();
    return lowerUrl.startsWith(`${config.PROTOCOL}://`) || 
           lowerUrl.startsWith(`${config.PROTOCOL}:`);
  }

  /**
   * Build a deep link URL
   * @param {string} path - Path (e.g., '/auth/callback')
   * @param {Object} params - Query parameters
   * @returns {string} Deep link URL
   */
  buildUrl(path, params = {}) {
    const url = new URL(`${config.PROTOCOL}:/${path}`);
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    
    return url.toString();
  }
}

// Export singleton instance
const deepLinkHandler = new DeepLinkHandler();
module.exports = { deepLinkHandler, DeepLinkHandler };
