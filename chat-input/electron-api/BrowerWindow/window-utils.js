const { BrowserWindow } = require('electron');

/**
 * Window Utilities Module
 * Handles window manipulation and information gathering
 */

/**
 * Set window bounds (position and size)
 */
function setWindowBounds(windowId, bounds, windows) {
  const window = windows.get(windowId);
  if (window && !window.isDestroyed()) {
    window.setBounds(bounds);
    return true;
  }
  return false;
}

/**
 * Get window bounds
 */
function getWindowBounds(windowId, windows) {
  const window = windows.get(windowId);
  if (window && !window.isDestroyed()) {
    return window.getBounds();
  }
  return null;
}

/**
 * Set window always on top
 */
function setWindowAlwaysOnTop(windowId, flag, windows) {
  const window = windows.get(windowId);
  if (window && !window.isDestroyed()) {
    window.setAlwaysOnTop(flag);
    return true;
  }
  return false;
}

/**
 * Set window opacity
 */
function setWindowOpacity(windowId, opacity, windows) {
  const window = windows.get(windowId);
  if (window && !window.isDestroyed()) {
    window.setOpacity(opacity);
    return true;
  }
  return false;
}

/**
 * Set window ignore mouse events
 */
function setWindowIgnoreMouseEvents(windowId, ignore, windows) {
  const window = windows.get(windowId);
  if (window && !window.isDestroyed()) {
    window.setIgnoreMouseEvents(ignore, { forward: true });
    return true;
  }
  return false;
}

/**
 * Get detailed window information
 */
function getWindowInfo(windowId, windows, windowConfigs) {
  const window = windows.get(windowId);
  const config = windowConfigs.get(windowId);
  
  if (window && !window.isDestroyed()) {
    return {
      id: windowId,
      title: window.getTitle(),
      url: window.webContents.getURL(),
      bounds: window.getBounds(),
      isVisible: window.isVisible(),
      isMinimized: window.isMinimized(),
      isMaximized: window.isMaximized(),
      isFocused: window.isFocused(),
      isAlwaysOnTop: window.isAlwaysOnTop(),
      opacity: window.getOpacity?.() || 1,
      type: config?.type || 'unknown',
      created: config?.created || null,
      webContents: {
        canGoBack: window.webContents.canGoBack(),
        canGoForward: window.webContents.canGoForward(),
        isLoading: window.webContents.isLoading(),
        isLoadingMainFrame: window.webContents.isLoadingMainFrame(),
        isWaitingForResponse: window.webContents.isWaitingForResponse(),
        userAgent: window.webContents.getUserAgent()
      }
    };
  }
  
  return null;
}

/**
 * Get information for all windows
 */
function getAllWindowsInfo(windows, windowConfigs) {
  const windowsInfo = [];
  for (const [id, window] of windows) {
    if (!window.isDestroyed()) {
      const info = getWindowInfo(id, windows, windowConfigs);
      if (info) {
        windowsInfo.push(info);
      }
    }
  }
  return windowsInfo;
}

/**
 * Load URL in a window
 */
function loadURL(windowId, url, windows) {
  const window = windows.get(windowId);
  if (window && !window.isDestroyed()) {
    window.loadURL(url);
    return true;
  }
  return false;
}

/**
 * Reload a window
 */
function reload(windowId, windows) {
  const window = windows.get(windowId);
  if (window && !window.isDestroyed()) {
    window.webContents.reload();
    return true;
  }
  return false;
}

/**
 * Go back in window history
 */
function goBack(windowId, windows) {
  const window = windows.get(windowId);
  if (window && !window.isDestroyed() && window.webContents.canGoBack()) {
    window.webContents.goBack();
    return true;
  }
  return false;
}

/**
 * Go forward in window history
 */
function goForward(windowId, windows) {
  const window = windows.get(windowId);
  if (window && !window.isDestroyed() && window.webContents.canGoForward()) {
    window.webContents.goForward();
    return true;
  }
  return false;
}

/**
 * Open developer tools
 */
function openDevTools(windowId, windows) {
  const window = windows.get(windowId);
  if (window && !window.isDestroyed()) {
    window.webContents.openDevTools();
    return true;
  }
  return false;
}

/**
 * Close developer tools
 */
function closeDevTools(windowId, windows) {
  const window = windows.get(windowId);
  if (window && !window.isDestroyed()) {
    window.webContents.closeDevTools();
    return true;
  }
  return false;
}

/**
 * Toggle developer tools
 */
function toggleDevTools(windowId, windows) {
  const window = windows.get(windowId);
  if (window && !window.isDestroyed()) {
    window.webContents.toggleDevTools();
    return true;
  }
  return false;
}

module.exports = {
  setWindowBounds,
  getWindowBounds,
  setWindowAlwaysOnTop,
  setWindowOpacity,
  setWindowIgnoreMouseEvents,
  getWindowInfo,
  getAllWindowsInfo,
  loadURL,
  reload,
  goBack,
  goForward,
  openDevTools,
  closeDevTools,
  toggleDevTools
};