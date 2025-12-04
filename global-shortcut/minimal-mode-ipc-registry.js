/**
 * IPC Handler Registry
 * Handles IPC handler registration for minimal mode
 * Follows: Single Responsibility Principle (SRP)
 */

const { ipcMain } = require('electron');

class MinimalModeIpcRegistry {
  constructor() {
    this.handlersRegistered = false;
  }

  /**
   * Register all IPC handlers for minimal mode
   * @param {Object} callbacks - Object with callback functions
   * @param {Function} callbacks.onToggle - Toggle callback
   * @param {Function} callbacks.onEnable - Enable callback
   * @param {Function} callbacks.onDisable - Disable callback
   * @param {Function} callbacks.onGetStatus - Get status callback
   * @returns {boolean} True if registered successfully
   */
  registerHandlers(callbacks) {
    if (this.handlersRegistered) {
      console.log('MinimalModeIpcRegistry: Handlers already registered');
      return false;
    }

    if (!this.validateCallbacks(callbacks)) {
      console.error('MinimalModeIpcRegistry: Invalid callbacks provided');
      return false;
    }

    // Register toggle handler
    ipcMain.on('minimal-mode-toggle', () => {
      console.log('MinimalModeIpcRegistry: Toggle requested');
      callbacks.onToggle();
    });

    // Register enable handler
    ipcMain.on('minimal-mode-enable', () => {
      console.log('MinimalModeIpcRegistry: Enable requested');
      callbacks.onEnable();
    });

    // Register disable handler
    ipcMain.on('minimal-mode-disable', () => {
      console.log('MinimalModeIpcRegistry: Disable requested');
      callbacks.onDisable();
    });

    // Register get status handler
    ipcMain.handle('minimal-mode-get-status', () => {
      return callbacks.onGetStatus();
    });

    this.handlersRegistered = true;
    console.log('MinimalModeIpcRegistry: All handlers registered successfully');
    return true;
  }

  /**
   * Validate callbacks object
   * @param {Object} callbacks - Callbacks to validate
   * @returns {boolean} True if valid
   * @private
   */
  validateCallbacks(callbacks) {
    return (
      callbacks &&
      typeof callbacks.onToggle === 'function' &&
      typeof callbacks.onEnable === 'function' &&
      typeof callbacks.onDisable === 'function' &&
      typeof callbacks.onGetStatus === 'function'
    );
  }

  /**
   * Unregister all IPC handlers
   */
  unregisterHandlers() {
    if (!this.handlersRegistered) {
      return;
    }

    ipcMain.removeAllListeners('minimal-mode-toggle');
    ipcMain.removeAllListeners('minimal-mode-enable');
    ipcMain.removeAllListeners('minimal-mode-disable');
    ipcMain.removeHandler('minimal-mode-get-status');

    this.handlersRegistered = false;
    console.log('MinimalModeIpcRegistry: All handlers unregistered');
  }

  /**
   * Check if handlers are registered
   * @returns {boolean} True if registered
   */
  isRegistered() {
    return this.handlersRegistered;
  }
}

module.exports = { MinimalModeIpcRegistry };
