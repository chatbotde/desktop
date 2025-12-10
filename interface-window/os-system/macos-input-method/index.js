const path = require('path');
const os = require('os');

// Check if running on macOS
if (os.platform() !== 'darwin') {
  throw new Error('macOS Input Method module is only supported on macOS');
}

let nativeModule;

try {
  nativeModule = require('./build/Release/macos_input_method.node');
} catch (error) {
  console.error('Failed to load native module:', error.message);
  console.error('Please run: npm run build');
  throw error;
}

class MacOSInputMethod {
  constructor() {
    this.controller = new nativeModule.InputMethodController();
  }

  /**
   * Insert text at the current cursor position
   * @param {string} text - Text to insert
   * @returns {boolean} - Success status
   */
  insertText(text) {
    if (typeof text !== 'string') {
      throw new TypeError('Text must be a string');
    }
    return this.controller.insertText(text);
  }

  /**
   * Insert text and simulate typing effect
   * @param {string} text - Text to insert
   * @param {number} delayMs - Delay between characters in milliseconds
   * @returns {Promise<boolean>} - Success status
   */
  async insertTextWithTyping(text, delayMs = 50) {
    if (typeof text !== 'string') {
      throw new TypeError('Text must be a string');
    }
    return new Promise((resolve) => {
      this.controller.insertTextWithTyping(text, delayMs, (success) => {
        resolve(success);
      });
    });
  }

  /**
   * Get the currently selected text
   * @returns {string} - Selected text
   */
  getSelectedText() {
    return this.controller.getSelectedText();
  }

  /**
   * Replace selected text with new text
   * @param {string} text - New text
   * @returns {boolean} - Success status
   */
  replaceSelectedText(text) {
    if (typeof text !== 'string') {
      throw new TypeError('Text must be a string');
    }
    return this.controller.replaceSelectedText(text);
  }

  /**
   * Get information about the active application
   * @returns {Object} - { name, bundleId, pid }
   */
  getActiveApplication() {
    return this.controller.getActiveApplication();
  }

  /**
   * Check if text input is available in the focused element
   * @returns {boolean}
   */
  isTextInputActive() {
    return this.controller.isTextInputActive();
  }

  /**
   * Simulate keyboard shortcut
   * @param {string} key - Key character or special key name
   * @param {Object} modifiers - { command, shift, option, control }
   * @returns {boolean} - Success status
   */
  sendKeyboardShortcut(key, modifiers = {}) {
    return this.controller.sendKeyboardShortcut(key, modifiers);
  }

  /**
   * Get cursor position in the current text field
   * @returns {Object|null} - { x, y } or null if not available
   */
  getCursorPosition() {
    return this.controller.getCursorPosition();
  }

  /**
   * Start monitoring text input events
   * @param {Function} callback - Called with event data
   */
  startMonitoring(callback) {
    if (typeof callback !== 'function') {
      throw new TypeError('Callback must be a function');
    }
    this.controller.startMonitoring(callback);
  }

  /**
   * Stop monitoring text input events
   */
  stopMonitoring() {
    this.controller.stopMonitoring();
  }
}

module.exports = {
  MacOSInputMethod,
  createInputMethod: () => new MacOSInputMethod(),
  version: require('./package.json').version
};
