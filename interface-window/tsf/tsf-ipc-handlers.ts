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
import { pinManager } from './pin-manager';

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

    // Focus and insert at end of selection
    ipcMain.handle('tsf:focus-and-insert-at-end', async (_event, text: string) => {
        return await tsfManager.focusAndInsertAtEnd(text);
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

    // --- Insert pins (soft identity; survive app close) ---
    ipcMain.handle('tsf:pins:list', async () => {
        return await pinManager.refreshStatuses();
    });

    ipcMain.handle('tsf:pins:assign', async (_event, number: number, name?: string) => {
        const focus =
            tsfManager.getLastExternalFocus() ||
            (await tsfManager.getFocusInfo());
        if (!focus?.processName) {
            throw new Error('No external app focused to pin. Focus Cursor/Edge/etc first.');
        }
        const fresh = await tsfManager.getFocusInfo();
        const anchor = await tsfManager.getInputAnchor();
        let uiaTarget = null;
        if (anchor?.x != null && anchor?.y != null) {
            uiaTarget = await tsfManager.captureUiaTargetAt(anchor.x, anchor.y);
        }
        const withHwnd = {
            ...focus,
            hwnd: fresh?.hwnd || (focus as any).hwnd,
        };
        return pinManager.assignPin({
            number,
            name,
            focus: withHwnd,
            anchorX: anchor?.x ?? null,
            anchorY: anchor?.y ?? null,
            uiaTarget,
        });
    });

    ipcMain.handle('tsf:pins:assign-current', async (_event, number: number, name?: string) => {
        const focus = await tsfManager.getFocusInfo();
        const anchor = await tsfManager.getInputAnchor();
        let uiaTarget = null;
        if (anchor?.x != null && anchor?.y != null) {
            uiaTarget = await tsfManager.captureUiaTargetAt(anchor.x, anchor.y);
        }
        return pinManager.assignPin({
            number,
            name,
            focus,
            anchorX: anchor?.x ?? null,
            anchorY: anchor?.y ?? null,
            uiaTarget,
        });
    });

    ipcMain.handle('tsf:pins:remove', async (_event, number: number) => {
        return pinManager.removePin(number);
    });

    ipcMain.handle('tsf:pins:rename', async (_event, number: number, name: string) => {
        return pinManager.renamePin(number, name);
    });

    ipcMain.handle('tsf:pins:insert', async (_event, number: number, text: string) => {
        return await pinManager.insertToPin(number, text);
    });

    ipcMain.handle('tsf:pins:focus', async (_event, number: number) => {
        return await pinManager.focusPin(number);
    });

    ipcMain.handle('tsf:get-window-rect', async (_event, hwnd: string) => {
        return await tsfManager.getWindowRect(hwnd);
    });

    ipcMain.handle('tsf:get-input-anchor', async () => {
        return await tsfManager.getInputAnchor();
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

    const forwardPins = (pins: unknown) => {
        if (window && !window.isDestroyed()) {
            window.webContents.send('tsf:pins-changed', pins);
        }
    };
    pinManager.on('pins-changed', forwardPins);
    pinManager.on('pin-revived', (pin) => {
        if (window && !window.isDestroyed()) {
            window.webContents.send('tsf:pin-revived', pin);
        }
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
