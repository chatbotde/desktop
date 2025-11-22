/**
 * Text Services Framework (TSF) Native Module
 * 
 * This module provides Windows TSF integration to insert text into any application
 * that accepts text input, similar to how Grammarly works.
 * 
 * @module tsf-framework
 */

let native;
let initialized = false;

try {
    // Try to load the native addon
    native = require('./build/Release/tsf_native.node');
} catch (err) {
    try {
        native = require('./build/Debug/tsf_native.node');
    } catch (err2) {
        console.error('Failed to load TSF native module:', err2.message);
        console.error('Please run "npm run build" to compile the native module');
    }
}

/**
 * Initialize the TSF system
 * Must be called before using other functions
 * @returns {Promise<boolean>} Success status
 */
async function initialize() {
    if (!native) {
        throw new Error('TSF native module not loaded');
    }
    
    if (initialized) {
        return true;
    }
    
    try {
        const result = native.initialize();
        initialized = result;
        return result;
    } catch (err) {
        console.error('Failed to initialize TSF:', err);
        return false;
    }
}

/**
 * Insert text at the current cursor position in the focused application
 * Uses TSF if available, falls back to clipboard+paste method
 * @param {string} text - The text to insert
 * @returns {Promise<boolean>} Success status
 */
async function insertText(text) {
    if (!native) {
        throw new Error('TSF native module not loaded');
    }
    
    if (!initialized) {
        await initialize();
    }
    
    if (!text || typeof text !== 'string') {
        throw new TypeError('Text must be a non-empty string');
    }
    
    try {
        return native.insertText(text);
    } catch (err) {
        console.error('Failed to insert text:', err);
        return false;
    }
}

/**
 * Insert text using clipboard+paste fallback method
 * This method always uses clipboard, regardless of TSF availability
 * @param {string} text - The text to insert
 * @returns {Promise<boolean>} Success status
 */
async function insertTextFallback(text) {
    if (!native) {
        throw new Error('TSF native module not loaded');
    }
    
    if (!text || typeof text !== 'string') {
        throw new TypeError('Text must be a non-empty string');
    }
    
    try {
        return native.insertTextFallback(text);
    } catch (err) {
        console.error('Failed to insert text (fallback):', err);
        return false;
    }
}

/**
 * Get information about the currently focused window
 * @returns {Promise<Object>} Focus information
 * @property {string} windowTitle - Title of the focused window
 * @property {string} processName - Name of the process (e.g., "chrome.exe")
 * @property {number} processId - Process ID
 * @property {boolean} isEditable - Whether the window is likely a text input
 */
async function getFocusInfo() {
    if (!native) {
        throw new Error('TSF native module not loaded');
    }
    
    try {
        return native.getFocusInfo();
    } catch (err) {
        console.error('Failed to get focus info:', err);
        return {
            windowTitle: '',
            processName: '',
            processId: 0,
            isEditable: false
        };
    }
}

/**
 * Check if TSF is available for the currently focused application
 * @returns {Promise<boolean>} TSF availability status
 */
async function isTsfAvailable() {
    if (!native) {
        return false;
    }
    
    if (!initialized) {
        await initialize();
    }
    
    try {
        return native.isTsfAvailable();
    } catch (err) {
        console.error('Failed to check TSF availability:', err);
        return false;
    }
}

/**
 * Check if the currently focused window is editable
 * @returns {Promise<boolean>} Editable status
 */
async function isEditableWindow() {
    if (!native) {
        return false;
    }
    
    try {
        return native.isEditableWindow();
    } catch (err) {
        console.error('Failed to check editable status:', err);
        return false;
    }
}

/**
 * Cleanup and release TSF resources
 * Should be called when shutting down
 * @returns {Promise<void>}
 */
async function cleanup() {
    if (!native || !initialized) {
        return;
    }
    
    try {
        native.cleanup();
        initialized = false;
    } catch (err) {
        console.error('Failed to cleanup TSF:', err);
    }
}

/**
 * Store the current focused window as "last focused"
 * Call this before your window gets focus to remember where to insert text
 * @returns {Promise<void>}
 */
async function setLastFocusedWindow() {
    if (!native) {
        throw new Error('TSF native module not loaded');
    }
    
    try {
        native.setLastFocusedWindow();
    } catch (err) {
        console.error('Failed to set last focused window:', err);
    }
}

/**
 * Get information about the last focused window
 * @returns {Promise<Object>} Focus information
 */
async function getLastFocusedWindow() {
    if (!native) {
        throw new Error('TSF native module not loaded');
    }
    
    try {
        return native.getLastFocusedWindow();
    } catch (err) {
        console.error('Failed to get last focused window:', err);
        return {
            windowTitle: '',
            processName: '',
            processId: 0,
            isEditable: false
        };
    }
}

/**
 * Focus the last remembered window
 * @returns {Promise<boolean>} Success status
 */
async function focusLastWindow() {
    if (!native) {
        throw new Error('TSF native module not loaded');
    }
    
    try {
        return native.focusLastWindow();
    } catch (err) {
        console.error('Failed to focus last window:', err);
        return false;
    }
}

/**
 * Focus the last window and insert text at the caret position
 * This is perfect for a button that inserts text back to where user was typing
 * @param {string} text - The text to insert
 * @returns {Promise<boolean>} Success status
 */
async function focusAndInsertText(text) {
    if (!native) {
        throw new Error('TSF native module not loaded');
    }
    
    if (!initialized) {
        await initialize();
    }
    
    if (!text || typeof text !== 'string') {
        throw new TypeError('Text must be a non-empty string');
    }
    
    try {
        return native.focusAndInsertText(text);
    } catch (err) {
        console.error('Failed to focus and insert text:', err);
        return false;
    }
}

/**
 * Check if the native module is loaded and available
 * @returns {boolean} Module availability status
 */
function isAvailable() {
    return native !== undefined;
}

module.exports = {
    initialize,
    insertText,
    insertTextFallback,
    getFocusInfo,
    isTsfAvailable,
    isEditableWindow,
    setLastFocusedWindow,
    getLastFocusedWindow,
    focusLastWindow,
    focusAndInsertText,
    cleanup,
    isAvailable
};
