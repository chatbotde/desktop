/**
 * TSF IPC Handler Setup for Interface Window
 * 
 * Sets up IPC handlers for TSF (Text Services Framework) communication
 * between renderer and main process.
 * 
 * Independent implementation - does not depend on chat-input.
 */

import { ipcMain, BrowserWindow } from 'electron';
import { tsfManager } from './tsf-manager';

/**
 * Setup TSF IPC handlers
 * @param window - The interface window (optional, for event forwarding)
 */
export function setupTsfIpc(window?: BrowserWindow): void {
    // Initialize TSF
    ipcMain.handle('tsf:initialize', async () => {
        return await tsfManager.initialize();
    });

    // Insert text
    ipcMain.handle('tsf:insert-text', async (_event, text: string, options?: any) => {
        return await tsfManager.insertText(text, options);
    });

    // Insert text with fallback
    ipcMain.handle('tsf:insert-text-fallback', async (_event, text: string) => {
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
    ipcMain.on('tsf:set-enabled', (_event, enabled: boolean) => {
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

    // Focus and insert text (main method for Insert button)
    ipcMain.handle('tsf:focus-and-insert-text', async (_event, text: string) => {
        return await tsfManager.focusAndInsertText(text);
    });

    // Focus and insert rich content (HTML, images, RTF, etc.) - uses clipboard + paste
    ipcMain.handle('tsf:focus-and-insert-rich-content', async (_event, content: any) => {
        return await tsfManager.focusAndInsertRichContent(content);
    });

    // Get selected text
    ipcMain.handle('tsf:get-selected-text', async () => {
        return await tsfManager.getSelectedText();
    });

    // Replace selected text
    ipcMain.handle('tsf:replace-selected-text', async (_event, text: string) => {
        return await tsfManager.replaceSelectedText(text);
    });

    // Focus and replace selected text
    ipcMain.handle('tsf:focus-and-replace-text', async (_event, text: string) => {
        return await tsfManager.focusAndReplaceText(text);
    });

    // Delete selected text
    ipcMain.handle('tsf:delete-selection', async () => {
        return await tsfManager.deleteSelection();
    });

    // Forward TSF manager events to renderer (if window provided)
    if (window) {
        setupEventForwarding(window);
    }

    console.log('✅ TSF IPC handlers registered (interface-window)');
}

/**
 * Setup event forwarding from TSF manager to renderer
 */
function setupEventForwarding(window: BrowserWindow): void {
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
}

/**
 * Initialize TSF on app ready
 */
export async function initializeTsf(): Promise<boolean> {
    console.log('TSF: Initializing...');
    const success = await tsfManager.initialize();
    if (success) {
        console.log('✅ TSF: Initialized successfully');
    } else {
        console.error('❌ TSF: Initialization failed');
    }
    return success;
}

/**
 * Cleanup TSF on app quit
 */
export async function cleanupTsf(): Promise<void> {
    console.log('TSF: Cleaning up...');
    await tsfManager.cleanup();
}

export { tsfManager };
