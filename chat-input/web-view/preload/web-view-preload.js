/**
 * WebView Preload API
 * Exposes web view functionality to the renderer process
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('webView', {
  /**
   * Create a new web view
   * @param {Object} options - Configuration options
   * @returns {Promise<Object>}
   */
  create: (options) => ipcRenderer.invoke('webview:create', options),

  /**
   * Update web view bounds
   * @param {string} viewId - The view identifier
   * @param {Object} bounds - New bounds { x, y, width, height }
   * @returns {Promise<Object>}
   */
  updateBounds: (viewId, bounds) => 
    ipcRenderer.invoke('webview:update-bounds', { viewId, bounds }),

  /**
   * Navigate to a different URL
   * @param {string} viewId - The view identifier
   * @param {string} url - The URL to navigate to
   * @returns {Promise<Object>}
   */
  navigate: (viewId, url) => 
    ipcRenderer.invoke('webview:navigate', { viewId, url }),

  /**
   * Set user agent for the web view
   * @param {string} viewId - The view identifier
   * @param {string} userAgent - The user agent string
   * @returns {Promise<Object>}
   */
  setUserAgent: (viewId, userAgent) => 
    ipcRenderer.invoke('webview:set-user-agent', { viewId, userAgent }),

  /**
   * Show/hide the web view
   * @param {string} viewId - The view identifier
   * @param {boolean} visible - Visibility state
   * @returns {Promise<Object>}
   */
  setVisible: (viewId, visible) => 
    ipcRenderer.invoke('webview:set-visible', { viewId, visible }),

  /**
   * Destroy a web view
   * @param {string} viewId - The view identifier
   * @returns {Promise<Object>}
   */
  destroy: (viewId) => 
    ipcRenderer.invoke('webview:destroy', { viewId }),

  /**
   * Get all active web views
   * @returns {Promise<Object>}
   */
  getActive: () => ipcRenderer.invoke('webview:get-active')
});