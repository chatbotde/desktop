/**
 * IPC Handlers for BrowserWindow API
 * Add these handlers to your main.js file
 */

const { ipcMain } = require('electron');
const { browserWindowManager } = require('./chat-input/electron-api/BrowerWindow');

/**
 * Set up all BrowserWindow IPC handlers
 * Call this function in your main.js after app is ready
 */
function setupBrowserWindowIpcHandlers() {
  console.log('Setting up BrowserWindow IPC handlers');

  // Window Creation Handlers
  ipcMain.handle('create-web-app-window', async (event, url, options = {}) => {
    try {
      const result = browserWindowManager.createWebAppWindow(url, options);
      return {
        success: true,
        windowId: result.id,
        config: result.config
      };
    } catch (error) {
      console.error('Error creating web app window:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });

  ipcMain.handle('create-window-with-preset', async (event, url, presetType = 'webapp', options = {}) => {
    try {
      let result;
      
      switch (presetType) {
        case 'chat':
          result = browserWindowManager.createChatWindow(url, options);
          break;
        case 'development':
          result = browserWindowManager.createDevelopmentWindow(url, options);
          break;
        case 'productivity':
          result = browserWindowManager.createProductivityWindow(url, options);
          break;
        case 'social':
          result = browserWindowManager.createSocialWindow(url, options);
          break;
        case 'media':
          result = browserWindowManager.createMediaWindow(url, options);
          break;
        case 'minimal':
          result = browserWindowManager.createMinimalWindow(url, options);
          break;
        case 'overlay':
          result = browserWindowManager.createOverlayWindow(url, options);
          break;
        default:
          result = browserWindowManager.createWebAppWindow(url, options);
      }
      
      return {
        success: true,
        windowId: result.id,
        config: result.config
      };
    } catch (error) {
      console.error('Error creating preset window:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });

  // Window Management Handlers
  ipcMain.handle('get-window-info', async (event, windowId) => {
    try {
      const info = browserWindowManager.getWindowInfo(windowId);
      return {
        success: true,
        windowInfo: info
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  });

  ipcMain.handle('get-all-windows-info', async (event) => {
    try {
      const windows = browserWindowManager.getAllWindowsInfo();
      return {
        success: true,
        windows: windows
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  });

  ipcMain.handle('close-window', async (event, windowId) => {
    try {
      const result = browserWindowManager.closeWindow(windowId);
      return {
        success: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  });

  ipcMain.handle('close-all-managed-windows', async (event) => {
    try {
      const closedWindows = browserWindowManager.closeAllWindows();
      return {
        success: true,
        closedWindows: closedWindows
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  });

  ipcMain.handle('show-window', async (event, windowId) => {
    try {
      const result = browserWindowManager.showWindow(windowId);
      return { success: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('hide-window', async (event, windowId) => {
    try {
      const result = browserWindowManager.hideWindow(windowId);
      return { success: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('focus-window', async (event, windowId) => {
    try {
      const result = browserWindowManager.focusWindow(windowId);
      return { success: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('minimize-window', async (event, windowId) => {
    try {
      const result = browserWindowManager.minimizeWindow(windowId);
      return { success: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('maximize-window', async (event, windowId) => {
    try {
      const result = browserWindowManager.maximizeWindow(windowId);
      return { success: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('restore-window', async (event, windowId) => {
    try {
      const result = browserWindowManager.restoreWindow(windowId);
      return { success: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Window Utility Handlers
  ipcMain.handle('set-window-bounds', async (event, windowId, bounds) => {
    try {
      const result = browserWindowManager.setWindowBounds(windowId, bounds);
      return { success: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-window-bounds', async (event, windowId) => {
    try {
      const bounds = browserWindowManager.getWindowBounds(windowId);
      return { success: !!bounds, bounds: bounds };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('set-window-always-on-top', async (event, windowId, flag) => {
    try {
      const result = browserWindowManager.setWindowAlwaysOnTop(windowId, flag);
      return { success: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('set-window-opacity', async (event, windowId, opacity) => {
    try {
      const result = browserWindowManager.setWindowOpacity(windowId, opacity);
      return { success: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('set-window-ignore-mouse-events', async (event, windowId, ignore) => {
    try {
      const result = browserWindowManager.setWindowIgnoreMouseEvents(windowId, ignore);
      return { success: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Navigation Handlers
  ipcMain.handle('window-load-url', async (event, windowId, url) => {
    try {
      const result = browserWindowManager.loadURL(windowId, url);
      return { success: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('window-reload', async (event, windowId) => {
    try {
      const result = browserWindowManager.reload(windowId);
      return { success: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('window-go-back', async (event, windowId) => {
    try {
      const result = browserWindowManager.goBack(windowId);
      return { success: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('window-go-forward', async (event, windowId) => {
    try {
      const result = browserWindowManager.goForward(windowId);
      return { success: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Developer Tools Handlers
  ipcMain.handle('window-open-dev-tools', async (event, windowId) => {
    try {
      const result = browserWindowManager.openDevTools(windowId);
      return { success: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('window-close-dev-tools', async (event, windowId) => {
    try {
      const result = browserWindowManager.closeDevTools(windowId);
      return { success: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('window-toggle-dev-tools', async (event, windowId) => {
    try {
      const result = browserWindowManager.toggleDevTools(windowId);
      return { success: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  console.log('BrowserWindow IPC handlers setup complete');
}

module.exports = {
  setupBrowserWindowIpcHandlers
};