const { BrowserWindow } = require('electron');
const path = require('path');

/**
 * Window Manager Module
 * Handles window lifecycle management operations
 */

/**
 * Get a window by its ID
 */
function getWindow(windowId, windows) {
  return windows.get(windowId);
}

/**
 * Get all active windows
 */
function getAllWindows(windows) {
  const windowList = [];
  for (const [id, window] of windows) {
    if (!window.isDestroyed()) {
      windowList.push({
        id,
        window,
        title: window.getTitle(),
        bounds: window.getBounds(),
        isVisible: window.isVisible(),
        isMinimized: window.isMinimized(),
        isMaximized: window.isMaximized(),
        isFocused: window.isFocused(),
        url: window.webContents.getURL()
      });
    }
  }
  return windowList;
}

/**
 * Close a specific window
 */
function closeWindow(windowId, windows, windowConfigs) {
  const window = windows.get(windowId);
  if (window && !window.isDestroyed()) {
    window.close();
    windows.delete(windowId);
    windowConfigs.delete(windowId);
    return true;
  }
  return false;
}

/**
 * Close all managed windows
 */
function closeAllWindows(windows, windowConfigs) {
  const closedWindows = [];
  for (const [id, window] of windows) {
    if (!window.isDestroyed()) {
      window.close();
      closedWindows.push(id);
    }
  }
  windows.clear();
  windowConfigs.clear();
  return closedWindows;
}

/**
 * Show a window
 */
function showWindow(windowId, windows) {
  const window = windows.get(windowId);
  if (window && !window.isDestroyed()) {
    window.show();
    return true;
  }
  return false;
}

/**
 * Hide a window
 */
function hideWindow(windowId, windows) {
  const window = windows.get(windowId);
  if (window && !window.isDestroyed()) {
    window.hide();
    return true;
  }
  return false;
}

/**
 * Focus a window
 */
function focusWindow(windowId, windows) {
  const window = windows.get(windowId);
  if (window && !window.isDestroyed()) {
    window.focus();
    return true;
  }
  return false;
}

/**
 * Minimize a window
 */
function minimizeWindow(windowId, windows) {
  const window = windows.get(windowId);
  if (window && !window.isDestroyed()) {
    window.minimize();
    return true;
  }
  return false;
}

/**
 * Maximize a window
 */
function maximizeWindow(windowId, windows) {
  const window = windows.get(windowId);
  if (window && !window.isDestroyed()) {
    window.maximize();
    return true;
  }
  return false;
}

/**
 * Restore a window from minimized/maximized state
 */
function restoreWindow(windowId, windows) {
  const window = windows.get(windowId);
  if (window && !window.isDestroyed()) {
    window.restore();
    return true;
  }
  return false;
}

module.exports = {
  getWindow,
  getAllWindows,
  closeWindow,
  closeAllWindows,
  showWindow,
  hideWindow,
  focusWindow,
  minimizeWindow,
  maximizeWindow,
  restoreWindow
};