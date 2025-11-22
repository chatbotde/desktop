/**
 * Example: Preload script for Electron
 * Exposes TSF API to renderer process safely
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('tsf', {
    /**
     * Initialize TSF system
     */
    initialize: () => ipcRenderer.invoke('tsf:initialize'),

    /**
     * Insert text into focused application
     * @param {string} text - Text to insert
     * @returns {Promise<boolean>} Success status
     */
    insertText: (text) => ipcRenderer.invoke('tsf:insert-text', text),

    /**
     * Insert text using clipboard fallback method
     * @param {string} text - Text to insert
     * @returns {Promise<boolean>} Success status
     */
    insertTextFallback: (text) => ipcRenderer.invoke('tsf:insert-text-fallback', text),

    /**
     * Get information about focused window
     * @returns {Promise<Object>} Focus info
     */
    getFocusInfo: () => ipcRenderer.invoke('tsf:get-focus-info'),

    /**
     * Check if TSF is available for current window
     * @returns {Promise<boolean>} Availability status
     */
    isTsfAvailable: () => ipcRenderer.invoke('tsf:is-available'),

    /**
     * Check if focused window is editable
     * @returns {Promise<boolean>} Editable status
     */
    isEditableWindow: () => ipcRenderer.invoke('tsf:is-editable'),

    /**
     * Cleanup TSF resources
     */
    cleanup: () => ipcRenderer.invoke('tsf:cleanup')
});

// Example: Listen for specific events
contextBridge.exposeInMainWorld('tsfEvents', {
    onFocusChanged: (callback) => {
        ipcRenderer.on('tsf:focus-changed', (event, focusInfo) => callback(focusInfo));
    }
});
