const { contextBridge, ipcRenderer } = require('electron');

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
    const validChannels = ['interface-update'];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender` 
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  }
});

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

contextBridge.exposeInMainWorld('electronAPI', electronAPI);


// Text Services Framework API for inserting text into any application
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
