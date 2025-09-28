/**
 * Preload Script Additions for BrowserWindow API
 * Add these to your existing preload.js or chat-input-preload.js
 */

const { contextBridge, ipcRenderer } = require('electron');

// BrowserWindow API for renderer process
const browserWindowAPI = {
  // Window Creation
  createWebAppWindow: (url, options = {}) => {
    return ipcRenderer.invoke('create-web-app-window', url, options);
  },

  createWindowWithPreset: (url, presetType = 'webapp', options = {}) => {
    return ipcRenderer.invoke('create-window-with-preset', url, presetType, options);
  },

  // Quick preset creators
  createChatWindow: (url = 'https://chat.openai.com', options = {}) => {
    return ipcRenderer.invoke('create-window-with-preset', url, 'chat', options);
  },

  createDevelopmentWindow: (url = 'http://localhost:3000', options = {}) => {
    return ipcRenderer.invoke('create-window-with-preset', url, 'development', options);
  },

  createProductivityWindow: (url, options = {}) => {
    return ipcRenderer.invoke('create-window-with-preset', url, 'productivity', options);
  },

  createSocialWindow: (url, options = {}) => {
    return ipcRenderer.invoke('create-window-with-preset', url, 'social', options);
  },

  createMediaWindow: (url, options = {}) => {
    return ipcRenderer.invoke('create-window-with-preset', url, 'media', options);
  },

  createMinimalWindow: (url, options = {}) => {
    return ipcRenderer.invoke('create-window-with-preset', url, 'minimal', options);
  },

  createOverlayWindow: (url, options = {}) => {
    return ipcRenderer.invoke('create-window-with-preset', url, 'overlay', options);
  },

  // Window Management
  getWindowInfo: (windowId) => {
    return ipcRenderer.invoke('get-window-info', windowId);
  },

  getAllWindowsInfo: () => {
    return ipcRenderer.invoke('get-all-windows-info');
  },

  closeWindow: (windowId) => {
    return ipcRenderer.invoke('close-window', windowId);
  },

  closeAllManagedWindows: () => {
    return ipcRenderer.invoke('close-all-managed-windows');
  },

  showWindow: (windowId) => {
    return ipcRenderer.invoke('show-window', windowId);
  },

  hideWindow: (windowId) => {
    return ipcRenderer.invoke('hide-window', windowId);
  },

  focusWindow: (windowId) => {
    return ipcRenderer.invoke('focus-window', windowId);
  },

  minimizeWindow: (windowId) => {
    return ipcRenderer.invoke('minimize-window', windowId);
  },

  maximizeWindow: (windowId) => {
    return ipcRenderer.invoke('maximize-window', windowId);
  },

  restoreWindow: (windowId) => {
    return ipcRenderer.invoke('restore-window', windowId);
  },

  // Window Utilities
  setWindowBounds: (windowId, bounds) => {
    return ipcRenderer.invoke('set-window-bounds', windowId, bounds);
  },

  getWindowBounds: (windowId) => {
    return ipcRenderer.invoke('get-window-bounds', windowId);
  },

  setWindowAlwaysOnTop: (windowId, flag) => {
    return ipcRenderer.invoke('set-window-always-on-top', windowId, flag);
  },

  setWindowOpacity: (windowId, opacity) => {
    return ipcRenderer.invoke('set-window-opacity', windowId, opacity);
  },

  setWindowIgnoreMouseEvents: (windowId, ignore) => {
    return ipcRenderer.invoke('set-window-ignore-mouse-events', windowId, ignore);
  },

  // Navigation
  loadURL: (windowId, url) => {
    return ipcRenderer.invoke('window-load-url', windowId, url);
  },

  reload: (windowId) => {
    return ipcRenderer.invoke('window-reload', windowId);
  },

  goBack: (windowId) => {
    return ipcRenderer.invoke('window-go-back', windowId);
  },

  goForward: (windowId) => {
    return ipcRenderer.invoke('window-go-forward', windowId);
  },

  // Developer Tools
  openDevTools: (windowId) => {
    return ipcRenderer.invoke('window-open-dev-tools', windowId);
  },

  closeDevTools: (windowId) => {
    return ipcRenderer.invoke('window-close-dev-tools', windowId);
  },

  toggleDevTools: (windowId) => {
    return ipcRenderer.invoke('window-toggle-dev-tools', windowId);
  }
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('browserWindowAPI', browserWindowAPI);

// Also add to existing electronAPI if it exists
if (typeof window !== 'undefined' && window.electronAPI) {
  // Merge with existing API
  contextBridge.exposeInMainWorld('electronAPI', {
    ...window.electronAPI,
    ...browserWindowAPI
  });
} else {
  // Create new electronAPI with browserWindow functions
  contextBridge.exposeInMainWorld('electronAPI', browserWindowAPI);
}

console.log('BrowserWindow preload API exposed');

// Export for use in other preload scripts
module.exports = {
  browserWindowAPI
};