const { contextBridge, ipcRenderer } = require('electron');

// Verify contextBridge is available
if (!contextBridge) {
  console.error('[Preload] contextBridge is not available!');
}

// Verify ipcRenderer is available
if (!ipcRenderer) {
  console.error('[Preload] ipcRenderer is not available!');
}

console.log('[Preload] Starting to expose APIs...');

// Expose interfaceAPI
try {
  contextBridge.exposeInMainWorld('interfaceAPI', {
    // Basic window controls
    minimize: () => ipcRenderer.send('interface-window:minimize'),
    maximize: () => ipcRenderer.send('interface-window:maximize'),
    close: () => ipcRenderer.send('interface-window:close'),
    setIgnoreMouseEvents: (ignore, options) => {
      if (typeof ignore !== 'boolean') {
        return;
      }

      let sanitizedOptions;
      if (options && typeof options === 'object') {
        sanitizedOptions = {};
        if ('forward' in options) {
          sanitizedOptions.forward = !!options.forward;
        }

        if (Object.keys(sanitizedOptions).length === 0) {
          sanitizedOptions = undefined;
        }
      }

      ipcRenderer.send('interface-window:set-ignore-mouse-events', ignore, sanitizedOptions);
    },

    // Example: Send message to main process
    sendMessage: (channel, data) => {
      const validChannels = ['interface-action'];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },

    // Example: Receive message from main process
    onMessage: (channel, func) => {
      const validChannels = ['interface-update', 'text-selection-changed'];
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender` 
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },

    // Remove message listener
    removeMessageListener: (channel, func) => {
      const validChannels = ['interface-update', 'text-selection-changed'];
      if (validChannels.includes(channel)) {
        ipcRenderer.removeListener(channel, func);
      }
    }
  });

  console.log('[Preload] interfaceAPI exposed successfully');
} catch (error) {
  console.error('[Preload] Error exposing interfaceAPI:', error);
}

/**
 * Expose all Electron APIs dynamically
 */
const serviceNames = [
  'app',
  'autoUpdater',
  'clipboard',
  'desktopCapturer',
  'globalShortcut',
  'ipcMain',
  'net',
  'ollama',
  'process',
  'safeStorage',
  'screen'
];

const electronAPI = {};

serviceNames.forEach(name => {
  electronAPI[name] = new Proxy({}, {
    get: (target, prop) => {
      return (...args) => ipcRenderer.invoke(`${name}:${String(prop)}`, ...args);
    }
  });
});

// Explicitly define clipboard methods as Proxies don't survive contextBridge
electronAPI.clipboard = {
  readText: (...args) => ipcRenderer.invoke('clipboard:readText', ...args),
  writeText: (...args) => ipcRenderer.invoke('clipboard:writeText', ...args),
  readHTML: (...args) => ipcRenderer.invoke('clipboard:readHTML', ...args),
  writeHTML: (...args) => ipcRenderer.invoke('clipboard:writeHTML', ...args),
  readImage: (...args) => ipcRenderer.invoke('clipboard:readImage', ...args),
  writeImage: (...args) => ipcRenderer.invoke('clipboard:writeImage', ...args),
  clear: (...args) => ipcRenderer.invoke('clipboard:clear', ...args),
};

try {
  contextBridge.exposeInMainWorld('electronAPI', electronAPI);
  console.log('[Preload] electronAPI exposed successfully');
} catch (error) {
  console.error('[Preload] Error exposing electronAPI:', error);
}

// Text Services Framework API for inserting text into any application
try {
  contextBridge.exposeInMainWorld("tsfAPI", {
    /**
     * Initialize TSF system
     */
    initialize: () => ipcRenderer.invoke('tsf:initialize'),

    /**
     * Insert text into focused application
     * @param {string} text - Text to insert
     * @param {Object} options - Insertion options
     * @returns {Promise<boolean>} Success status
     */
    insertText: (text, options) => ipcRenderer.invoke('tsf:insert-text', text, options),

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
    isTsfAvailable: () => ipcRenderer.invoke('tsf:is-tsf-available'),

    /**
     * Check if focused window is editable
     * @returns {Promise<boolean>} Editable status
     */
    isEditableWindow: () => ipcRenderer.invoke('tsf:is-editable-window'),

    /**
     * Enable or disable text insertion
     * @param {boolean} enabled - Enable status
     */
    setEnabled: (enabled) => ipcRenderer.send('tsf:set-enabled', enabled),

    /**
     * Check if TSF is enabled
     * @returns {Promise<boolean>} Enabled status
     */
    isEnabled: () => ipcRenderer.invoke('tsf:is-enabled'),

    // Event listeners
    onFocusChanged: (callback) => {
      ipcRenderer.on('tsf:focus-changed', (event, focusInfo) => callback(focusInfo));
    },

    onTextInserted: (callback) => {
      ipcRenderer.on('tsf:text-inserted', (event, data) => callback(data));
    },

    onInsertFailed: (callback) => {
      ipcRenderer.on('tsf:insert-failed', (event, data) => callback(data));
    },

    onWarning: (callback) => {
      ipcRenderer.on('tsf:warning', (event, data) => callback(data));
    },

    onTextReplaced: (callback) => {
      ipcRenderer.on('tsf:text-replaced', (event, data) => callback(data));
    },

    onReplaceFailed: (callback) => {
      ipcRenderer.on('tsf:replace-failed', (event, data) => callback(data));
    },

    onSelectionDeleted: (callback) => {
      ipcRenderer.on('tsf:selection-deleted', (event, data) => callback(data));
    },

    /**
     * Get last external (non-Electron) focused application
     * @returns {Promise<Object>} Last external focus info
     */
    getLastExternalFocus: () => ipcRenderer.invoke('tsf:get-last-external-focus'),

    /**
     * Get last focused window from native tracker
     * @returns {Promise<Object>} Last focused window info
     */
    getLastFocusedWindow: () => ipcRenderer.invoke('tsf:get-last-focused-window'),

    /**
     * Focus the last tracked external application
     * @returns {Promise<boolean>} Success status
     */
    focusLastWindow: () => ipcRenderer.invoke('tsf:focus-last-window'),

    /**
     * Focus last window and insert text at caret position
     * Perfect for button that sends AI response back to where user was typing
     * @param {string} text - Text to insert
     * @returns {Promise<boolean>} Success status
     */
    focusAndInsertText: (text) => ipcRenderer.invoke('tsf:focus-and-insert-text', text),

    /**
     * Get selected text from focused application using TSF
     * @returns {Promise<string>} Selected text (empty string if none)
     */
    getSelectedText: () => ipcRenderer.invoke('tsf:get-selected-text'),

    /**
     * Replace selected text in focused application
     * @param {string} text - The replacement text
     * @returns {Promise<boolean>} Success status
     */
    replaceSelectedText: (text) => ipcRenderer.invoke('tsf:replace-selected-text', text),

    /**
     * Focus last window and replace selected text
     * Perfect for "Change" button that replaces user's selected text with AI response
     * @param {string} text - The replacement text
     * @returns {Promise<boolean>} Success status
     */
    focusAndReplaceText: (text) => ipcRenderer.invoke('tsf:focus-and-replace-text', text),

    /**
     * Delete selected text in focused application
     * @returns {Promise<boolean>} Success status
     */
    deleteSelection: () => ipcRenderer.invoke('tsf:delete-selection'),

    // Event for external app focus changes
    onExternalFocusChanged: (callback) => {
      ipcRenderer.on('tsf:external-focus-changed', (event, focusInfo) => callback(focusInfo));
    }
  });

  console.log('[Preload] tsfAPI exposed successfully');
} catch (error) {
  console.error('[Preload] Error exposing tsfAPI:', error);
}

// Expose the CaptureAPI to the renderer
console.log('[Preload] Exposing CaptureAPI to renderer...');
try {
  contextBridge.exposeInMainWorld("CaptureAPI", {
    // ==================== SCREENSHOT METHODS ====================
    
    /**
     * Take a screenshot
     * @param {Object} options - Screenshot options
     * @returns {Promise<Object>} Screenshot result
     */
    takeScreenshot: (options = {}) => {
      return ipcRenderer.invoke('interface-capture-screenshot', options);
    },

    /**
     * Take a screenshot of a specific window
     * @param {string} windowId - Window ID
     * @param {Object} options - Screenshot options
     * @returns {Promise<Object>} Screenshot result
     */
    takeWindowScreenshot: (windowId, options = {}) => {
      return ipcRenderer.invoke('interface-capture-window-screenshot', windowId, options);
    },

    /**
     * Take a screenshot of a specific area
     * @param {Object} area - Area coordinates {x, y, width, height}
     * @param {Object} options - Screenshot options
     * @returns {Promise<Object>} Screenshot result
     */
    takeAreaScreenshot: (area, options = {}) => {
      return ipcRenderer.invoke('interface-capture-area-screenshot', area, options);
    },

    /**
     * Get available screenshot sources
     * @param {boolean} includeWindows - Include window sources
     * @returns {Promise<Object>} Available sources
     */
    getScreenshotSources: (includeWindows = true) => {
      return ipcRenderer.invoke('interface-get-screenshot-sources', includeWindows);
    },

    /**
     * Quick screenshot capture (convenience method)
     * @returns {Promise<Object>} Screenshot result
     */
    quickScreenshot: () => {
      console.log('[Preload] quickScreenshot called, invoking interface-quick-screenshot');
      return ipcRenderer.invoke('interface-quick-screenshot');
    },

    /**
     * Check capture support
     * @returns {Promise<Object>} Support status
     */
    checkSupport: () => {
      return ipcRenderer.invoke('interface-check-capture-support');
    }
  });

  console.log('[Preload] CaptureAPI exposed successfully');
} catch (error) {
  console.error('[Preload] Error exposing CaptureAPI:', error);
  // Try to expose a minimal API for debugging
  try {
    contextBridge.exposeInMainWorld("CaptureAPI", {
      quickScreenshot: () => {
        console.error('[Preload] CaptureAPI not fully loaded, but quickScreenshot stub available');
        return Promise.resolve({ success: false, error: 'CaptureAPI not properly initialized' });
      }
    });
    console.log('[Preload] Fallback CaptureAPI exposed');
  } catch (fallbackError) {
    console.error('[Preload] Even fallback API failed:', fallbackError);
  }
}

// Expose Block API
try {
  contextBridge.exposeInMainWorld('blockAPI', {
    /**
     * Add an application to the block list
     * @param {string} processName - Process name (e.g., "Cursor.exe")
     * @returns {Promise<{success: boolean, message?: string, error?: string}>}
     */
    addApp: (processName) => ipcRenderer.invoke('block:add-app', processName),

    /**
     * Remove an application from the block list
     * @param {string} processName - Process name
     * @returns {Promise<{success: boolean, message?: string, error?: string}>}
     */
    removeApp: (processName) => ipcRenderer.invoke('block:remove-app', processName),

    /**
     * Get all blocked applications
     * @returns {Promise<{success: boolean, apps: string[], error?: string}>}
     */
    getApps: () => ipcRenderer.invoke('block:get-apps'),

    /**
     * Get current lock status
     * @returns {Promise<{success: boolean, status: {isLocked: boolean, blockedApp?: string}, lockEnabled: boolean, error?: string}>}
     */
    getStatus: () => ipcRenderer.invoke('block:get-status'),

    /**
     * Set lock enabled/disabled
     * @param {boolean} enabled - Enable or disable lock feature
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    setEnabled: (enabled) => ipcRenderer.invoke('block:set-enabled', enabled),

    /**
     * Listen to lock status changes
     * @param {function} callback - Callback function receiving lock status
     * @returns {function} Unsubscribe function
     */
    onLockChanged: (callback) => {
      const handler = (event, status) => callback(status);
      ipcRenderer.on('block:lock-changed', handler);
      return () => ipcRenderer.removeListener('block:lock-changed', handler);
    }
  });

  console.log('[Preload] blockAPI exposed successfully');
} catch (error) {
  console.error('[Preload] Error exposing blockAPI:', error);
}

console.log('[Preload] All APIs exposed, preload script complete');
