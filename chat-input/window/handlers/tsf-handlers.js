const { ipcMain } = require('electron');
const path = require('path');

// Import TSF manager from parent directory
const tsfManager = require(path.join(__dirname, '../../tsf-manager'));

/**
 * TSF (Text Services Framework) IPC Handlers
 */
class TsfHandlers {
  static handlersRegistered = false;

  /**
   * Register all TSF IPC handlers
   */
  static registerHandlers() {
    if (TsfHandlers.handlersRegistered) return;

    console.log('IPC: Registering TSF handlers...');

    // Initialize TSF
    ipcMain.handle('tsf:initialize', async () => {
      return await tsfManager.initialize();
    });

    // Insert text
    ipcMain.handle('tsf:insert-text', async (event, text, options) => {
      return await tsfManager.insertText(text, options);
    });

    // Insert text with fallback
    ipcMain.handle('tsf:insert-text-fallback', async (event, text) => {
      return await tsfManager.insertTextFallback(text);
    });

    // Get focus info
    ipcMain.handle('tsf:get-focus-info', async () => {
      return await tsfManager.getFocusInfo();
    });

    // Check TSF availability
    ipcMain.handle('tsf:is-tsf-available', async () => {
      return await tsfManager.isTsfAvailable();
    });

    // Check if window is editable
    ipcMain.handle('tsf:is-editable-window', async () => {
      return await tsfManager.isEditableWindow();
    });

    // Set enabled state
    ipcMain.on('tsf:set-enabled', (event, enabled) => {
      tsfManager.setEnabled(enabled);
    });

    // Get enabled state
    ipcMain.handle('tsf:is-enabled', () => {
      return tsfManager.isEnabled();
    });

    // Get last external focus
    ipcMain.handle('tsf:get-last-external-focus', () => {
      return tsfManager.getLastExternalFocus();
    });

    // Get last focused window
    ipcMain.handle('tsf:get-last-focused-window', async () => {
      return await tsfManager.getLastFocusedWindow();
    });

    // Focus last window
    ipcMain.handle('tsf:focus-last-window', async () => {
      return await tsfManager.focusLastWindow();
    });

    // Focus and insert text
    ipcMain.handle('tsf:focus-and-insert-text', async (event, text) => {
      return await tsfManager.focusAndInsertText(text);
    });

    TsfHandlers.handlersRegistered = true;
    console.log('IPC: TSF handlers registered');
  }

  /**
   * Setup event forwarding to a specific window
   * Call this after window is created
   */
  static setupEventForwarding(window) {
    if (!window) return;

    // Forward TSF manager events to renderer
    tsfManager.on('focus-changed', (focusInfo) => {
      if (window && !window.isDestroyed()) {
        window.webContents.send('tsf:focus-changed', focusInfo);
      }
    });

    tsfManager.on('text-inserted', (data) => {
      if (window && !window.isDestroyed()) {
        window.webContents.send('tsf:text-inserted', data);
      }
    });

    tsfManager.on('insert-failed', (data) => {
      if (window && !window.isDestroyed()) {
        window.webContents.send('tsf:insert-failed', data);
      }
    });

    tsfManager.on('warning', (data) => {
      if (window && !window.isDestroyed()) {
        window.webContents.send('tsf:warning', data);
      }
    });

    tsfManager.on('external-focus-changed', (focusInfo) => {
      if (window && !window.isDestroyed()) {
        window.webContents.send('tsf:external-focus-changed', focusInfo);
      }
    });

    tsfManager.on('error', (error) => {
      console.error('TSF Manager error:', error);
    });

    console.log('✅ TSF event forwarding setup complete');
  }
}

module.exports = { TsfHandlers };
