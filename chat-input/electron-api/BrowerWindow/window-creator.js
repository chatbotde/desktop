const { BrowserWindow } = require('electron');
const path = require('path');

/**
 * Window Creator Module
 * Handles creation of different types of browser windows
 */

/**
 * Generate a unique window ID
 */
function generateWindowId() {
  return `window_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get default window options
 */
function getDefaultOptions() {
  return {
    width: 1200,
    height: 800,
    show: true,
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../../../icons/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false
    }
  };
}

/**
 * Create a basic browser window
 */
function createWindow(options = {}, windows, windowConfigs) {
  const windowId = generateWindowId();
  const defaultOptions = getDefaultOptions();
  const finalOptions = { ...defaultOptions, ...options };

  const window = new BrowserWindow(finalOptions);
  
  // Store window and its config
  windows.set(windowId, window);
  windowConfigs.set(windowId, {
    id: windowId,
    type: 'basic',
    options: finalOptions,
    created: Date.now()
  });

  // Set up basic event handlers
  window.on('closed', () => {
    windows.delete(windowId);
    windowConfigs.delete(windowId);
  });

  // Load initial URL if provided
  if (finalOptions.url) {
    window.loadURL(finalOptions.url);
  }

  return {
    id: windowId,
    window,
    config: windowConfigs.get(windowId)
  };
}

/**
 * Create a web application window
 */
function createWebAppWindow(url, options = {}, windows, windowConfigs) {
  const windowId = generateWindowId();
  const defaultOptions = getDefaultOptions();
  
  const webAppOptions = {
    ...defaultOptions,
    ...options,
    autoHideMenuBar: true,
    titleBarStyle: options.titleBarStyle || 'default',
    webPreferences: {
      ...defaultOptions.webPreferences,
      ...options.webPreferences,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      allowRunningInsecureContent: false
    }
  };

  const window = new BrowserWindow(webAppOptions);
  
  // Store window and its config
  windows.set(windowId, window);
  windowConfigs.set(windowId, {
    id: windowId,
    type: 'webapp',
    url: url,
    options: webAppOptions,
    created: Date.now()
  });

  // Set up event handlers
  window.on('closed', () => {
    windows.delete(windowId);
    windowConfigs.delete(windowId);
  });

  // Load the URL
  window.loadURL(url);

  return {
    id: windowId,
    window,
    config: windowConfigs.get(windowId)
  };
}

/**
 * Create a minimal browser window (no decorations)
 */
function createMinimalWindow(url, options = {}, windows, windowConfigs) {
  const windowId = generateWindowId();
  const defaultOptions = getDefaultOptions();
  
  const minimalOptions = {
    ...defaultOptions,
    ...options,
    frame: false,
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
    resizable: options.resizable !== false,
    webPreferences: {
      ...defaultOptions.webPreferences,
      ...options.webPreferences
    }
  };

  const window = new BrowserWindow(minimalOptions);
  
  windows.set(windowId, window);
  windowConfigs.set(windowId, {
    id: windowId,
    type: 'minimal',
    url: url,
    options: minimalOptions,
    created: Date.now()
  });

  window.on('closed', () => {
    windows.delete(windowId);
    windowConfigs.delete(windowId);
  });

  window.loadURL(url);

  return {
    id: windowId,
    window,
    config: windowConfigs.get(windowId)
  };
}

/**
 * Create an overlay window (always on top, clickthrough options)
 */
function createOverlayWindow(url, options = {}, windows, windowConfigs) {
  const windowId = generateWindowId();
  const defaultOptions = getDefaultOptions();
  
  const overlayOptions = {
    ...defaultOptions,
    ...options,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    skipTaskbar: true,
    focusable: options.focusable !== false,
    webPreferences: {
      ...defaultOptions.webPreferences,
      ...options.webPreferences,
      backgroundThrottling: false
    }
  };

  const window = new BrowserWindow(overlayOptions);
  
  windows.set(windowId, window);
  windowConfigs.set(windowId, {
    id: windowId,
    type: 'overlay',
    url: url,
    options: overlayOptions,
    created: Date.now()
  });

  window.on('closed', () => {
    windows.delete(windowId);
    windowConfigs.delete(windowId);
  });

  // Set ignore mouse events if specified
  if (options.ignoreMouseEvents) {
    window.setIgnoreMouseEvents(true, { forward: true });
  }

  window.loadURL(url);

  return {
    id: windowId,
    window,
    config: windowConfigs.get(windowId)
  };
}

module.exports = {
  generateWindowId,
  getDefaultOptions,
  createWindow,
  createWebAppWindow,
  createMinimalWindow,
  createOverlayWindow
};