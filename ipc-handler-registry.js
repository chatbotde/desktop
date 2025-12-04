/**
 * IPC Handler Registry
 * Centralized IPC handler registration and management
 * Follows: Single Responsibility Principle (SRP)
 */

const { ipcMain } = require('electron');

class IpcHandlerRegistry {
  constructor() {
    this.handlers = new Map();
  }

  /**
   * Register an IPC handler
   * @param {string} channel - IPC channel name
   * @param {Function} handler - Handler function
   * @param {string} type - Handler type ('on' or 'handle')
   */
  register(channel, handler, type = 'handle') {
    if (this.handlers.has(channel)) {
      console.warn(`IpcHandlerRegistry: Handler for ${channel} already registered`);
      return false;
    }

    if (type === 'handle') {
      ipcMain.handle(channel, handler);
    } else if (type === 'on') {
      ipcMain.on(channel, handler);
    } else {
      throw new Error(`Unknown handler type: ${type}`);
    }

    this.handlers.set(channel, { handler, type });
    console.log(`IpcHandlerRegistry: Registered ${type} handler for ${channel}`);
    return true;
  }

  /**
   * Unregister an IPC handler
   * @param {string} channel - IPC channel name
   */
  unregister(channel) {
    const handlerInfo = this.handlers.get(channel);
    if (!handlerInfo) {
      return false;
    }

    if (handlerInfo.type === 'handle') {
      ipcMain.removeHandler(channel);
    } else {
      ipcMain.removeAllListeners(channel);
    }

    this.handlers.delete(channel);
    console.log(`IpcHandlerRegistry: Unregistered handler for ${channel}`);
    return true;
  }

  /**
   * Unregister all handlers
   */
  unregisterAll() {
    for (const [channel, info] of this.handlers) {
      if (info.type === 'handle') {
        ipcMain.removeHandler(channel);
      } else {
        ipcMain.removeAllListeners(channel);
      }
    }
    this.handlers.clear();
    console.log('IpcHandlerRegistry: Unregistered all handlers');
  }

  /**
   * Check if handler is registered
   * @param {string} channel - IPC channel name
   * @returns {boolean} True if registered
   */
  isRegistered(channel) {
    return this.handlers.has(channel);
  }

  /**
   * Get all registered handlers
   * @returns {Map} Map of registered handlers
   */
  getRegisteredHandlers() {
    return new Map(this.handlers);
  }
}

module.exports = { IpcHandlerRegistry };
