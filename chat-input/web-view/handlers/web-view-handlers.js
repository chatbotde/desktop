/**
 * WebView IPC Handlers
 * Handles IPC communication for web view operations
 */

const { ipcMain } = require('electron');
const {
  createWebView,
  updateBounds,
  navigate,
  setVisible,
  setClickThrough,
  destroyView,
  getActiveViews,
  setUserAgent
} = require('../web-view-manager');

/**
 * Setup all web view IPC handlers
 */
function setupWebViewHandlers() {
  // Create web view
  ipcMain.handle('webview:create', (event, options) => {
    try {
      const parentWindow = require('electron').BrowserWindow.fromWebContents(event.sender);
      if (!parentWindow) {
        throw new Error('Parent window not found');
      }

      const { view, viewId } = createWebView(parentWindow, options);
      
      return {
        success: true,
        viewId,
        message: 'Web view created successfully'
      };
    } catch (error) {
      console.error('[WebView] Create error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });

  // Update bounds
  ipcMain.handle('webview:update-bounds', (event, { viewId, bounds }) => {
    try {
      updateBounds(viewId, bounds);
      return {
        success: true,
        message: 'Bounds updated successfully'
      };
    } catch (error) {
      console.error('[WebView] Update bounds error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });

  // Navigate to URL
  ipcMain.handle('webview:navigate', (event, { viewId, url }) => {
    try {
      navigate(viewId, url);
      return {
        success: true,
        message: 'Navigation successful'
      };
    } catch (error) {
      console.error('[WebView] Navigate error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });

  // Set user agent
  ipcMain.handle('webview:set-user-agent', (event, { viewId, userAgent }) => {
    try {
      setUserAgent(viewId, userAgent);
      return {
        success: true,
        message: 'User agent updated successfully'
      };
    } catch (error) {
      console.error('[WebView] Set user agent error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });

  // Set visibility
  ipcMain.handle('webview:set-visible', (event, { viewId, visible }) => {
    try {
      setVisible(viewId, visible);
      return {
        success: true,
        message: 'Visibility updated successfully'
      };
    } catch (error) {
      console.error('[WebView] Set visible error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });

  // Set click-through
  ipcMain.handle('webview:set-clickthrough', (event, { viewId, enabled }) => {
    try {
      setClickThrough(viewId, enabled);
      return {
        success: true,
        message: 'Click-through updated successfully'
      };
    } catch (error) {
      console.error('[WebView] Set click-through error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });

  // Destroy view
  ipcMain.handle('webview:destroy', (event, { viewId }) => {
    try {
      destroyView(viewId);
      return {
        success: true,
        message: 'Web view destroyed successfully'
      };
    } catch (error) {
      console.error('[WebView] Destroy error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });

  // Get active views
  ipcMain.handle('webview:get-active', () => {
    try {
      const activeViews = getActiveViews();
      const viewsData = [];
      
      for (const [viewId, data] of activeViews) {
        viewsData.push({
          viewId,
          url: data.url,
          bounds: data.bounds
        });
      }
      
      return {
        success: true,
        views: viewsData
      };
    } catch (error) {
      console.error('[WebView] Get active error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });

  console.log('[WebView] IPC handlers registered');
}

module.exports = {
  setupWebViewHandlers
};