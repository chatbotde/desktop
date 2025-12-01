/**
 * TSF IPC Handler Setup
 * 
 * Sets up IPC handlers for TSF (Text Services Framework) communication
 * between renderer and main process.
 * 
 * Usage in your main process:
 * const setupTsfIpc = require('./tsf-ipc-handlers');
 * setupTsfIpc(chatInputWindow);
 */

const { ipcMain } = require('electron');
const tsfManager = require('./tsf-manager');

/**
 * Setup TSF IPC handlers
 * @param {BrowserWindow} window - The chat input window
 */
function setupTsfIpc(window) {
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

    // Get selected text
    ipcMain.handle('tsf:get-selected-text', async () => {
        return await tsfManager.getSelectedText();
    });

    // Replace selected text
    ipcMain.handle('tsf:replace-selected-text', async (event, text) => {
        return await tsfManager.replaceSelectedText(text);
    });

    // Focus and replace selected text
    ipcMain.handle('tsf:focus-and-replace-text', async (event, text) => {
        return await tsfManager.focusAndReplaceText(text);
    });

    // Delete selected text
    ipcMain.handle('tsf:delete-selection', async () => {
        return await tsfManager.deleteSelection();
    });

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

    tsfManager.on('text-replaced', (data) => {
        if (window && !window.isDestroyed()) {
            window.webContents.send('tsf:text-replaced', data);
        }
    });

    tsfManager.on('replace-failed', (data) => {
        if (window && !window.isDestroyed()) {
            window.webContents.send('tsf:replace-failed', data);
        }
    });

    tsfManager.on('selection-deleted', (data) => {
        if (window && !window.isDestroyed()) {
            window.webContents.send('tsf:selection-deleted', data);
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

    console.log('✅ TSF IPC handlers registered');
}

/**
 * Initialize TSF on app ready
 * Call this when your app is ready
 */
async function initializeTsf() {
    console.log('Initializing TSF...');
    const success = await tsfManager.initialize();
    if (success) {
        console.log('✅ TSF initialized successfully');
    } else {
        console.error('❌ TSF initialization failed');
    }
    return success;
}

/**
 * Cleanup TSF on app quit
 * Call this before your app quits
 */
async function cleanupTsf() {
    console.log('Cleaning up TSF...');
    await tsfManager.cleanup();
}

module.exports = {
    setupTsfIpc,
    initializeTsf,
    cleanupTsf,
    tsfManager
};
