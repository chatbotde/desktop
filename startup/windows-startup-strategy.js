/**
 * Windows Startup Strategy
 * Handles Windows-specific auto-startup implementation
 * Follows: Single Responsibility Principle (SRP)
 */

const { app } = require('electron');
const { IPlatformStartupStrategy } = require('./platform-startup-strategy');
const { RegistryManager } = require('./registry-manager');

class WindowsStartupStrategy extends IPlatformStartupStrategy {
  /**
   * @param {string} appName - Application name
   * @param {RegistryManager} registryManager - Registry operations manager
   */
  constructor(appName, registryManager) {
    super();
    this.appName = appName;
    this.registryManager = registryManager;
  }

  /**
   * Enable auto-startup on Windows
   * @returns {Promise<boolean>}
   */
  async enable() {
    try {
      // Use Electron's built-in method for Windows
      app.setLoginItemSettings({
        openAtLogin: true,
        openAsHidden: false,
        path: process.execPath,
        args: ['--startup']
      });

      // Additional registry entry for more reliability (optional)
      await this.registryManager.addEntry(this.appName, `${process.execPath} --startup`);
      
      console.log('AutoStartup: Windows auto-startup enabled');
      return true;
    } catch (error) {
      console.error('AutoStartup: Failed to enable Windows auto-startup:', error);
      return false;
    }
  }

  /**
   * Disable auto-startup on Windows
   * @returns {Promise<boolean>}
   */
  async disable() {
    try {
      app.setLoginItemSettings({
        openAtLogin: false
      });

      await this.registryManager.removeEntry(this.appName);
      
      console.log('AutoStartup: Windows auto-startup disabled');
      return true;
    } catch (error) {
      console.error('AutoStartup: Failed to disable Windows auto-startup:', error);
      return false;
    }
  }

  /**
   * Check if auto-startup is enabled
   * @returns {boolean}
   */
  isEnabled() {
    try {
      return app.getLoginItemSettings().openAtLogin;
    } catch (error) {
      console.error('AutoStartup: Failed to check Windows status:', error);
      return false;
    }
  }
}

module.exports = { WindowsStartupStrategy };
