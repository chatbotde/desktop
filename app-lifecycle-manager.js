/**
 * Application Lifecycle Manager
 * Handles app lifecycle events and initialization
 * Follows: Single Responsibility Principle (SRP)
 */

const { app } = require('electron');

class AppLifecycleManager {
  constructor() {
    this.isReady = false;
    this.initCallbacks = [];
  }

  /**
   * Wait for app to be ready and execute callback
   * @param {Function} callback - Function to execute when ready
   * @returns {Promise<void>}
   */
  async onReady(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    this.initCallbacks.push(callback);

    if (!this.isReady) {
      await app.whenReady();
      this.isReady = true;
      
      // Execute all callbacks
      for (const cb of this.initCallbacks) {
        try {
          await cb();
        } catch (error) {
          console.error('AppLifecycleManager: Error executing init callback:', error);
        }
      }
    }
  }

  /**
   * Handle window-all-closed event
   * @param {Function} handler - Handler function
   */
  onWindowsAllClosed(handler) {
    app.on('window-all-closed', handler);
  }

  /**
   * Handle will-quit event
   * @param {Function} handler - Handler function
   */
  onWillQuit(handler) {
    app.on('will-quit', handler);
  }

  /**
   * Set app user model ID (Windows)
   * @param {string} id - App ID
   */
  setAppId(id) {
    if (process.platform === 'win32') {
      app.setAppUserModelId(id);
      console.log('AppLifecycleManager: Set app ID:', id);
    }
  }

  /**
   * Get app information
   * @returns {Object} App information
   */
  getAppInfo() {
    return {
      isPackaged: app.isPackaged,
      NODE_ENV: process.env.NODE_ENV,
      platform: process.platform,
      arch: process.arch,
      electronVersion: process.versions.electron,
      nodeVersion: process.versions.node
    };
  }

  /**
   * Log app information
   */
  logAppInfo() {
    const info = this.getAppInfo();
    console.log('AppLifecycleManager: App starting...');
    console.log('AppLifecycleManager: Environment info:', info);
  }
}

module.exports = { AppLifecycleManager };
