/**
 * Linux Startup Strategy
 * Handles Linux-specific auto-startup implementation
 * Follows: Single Responsibility Principle (SRP)
 */

const { app } = require('electron');
const { IPlatformStartupStrategy } = require('./platform-startup-strategy');
const { DesktopFileManager } = require('./desktop-file-manager');

class LinuxStartupStrategy extends IPlatformStartupStrategy {
  /**
   * @param {string} appName - Application name
   * @param {DesktopFileManager} desktopFileManager - Desktop file operations manager
   */
  constructor(appName, desktopFileManager) {
    super();
    this.appName = appName;
    this.desktopFileManager = desktopFileManager;
  }

  /**
   * Enable auto-startup on Linux
   * @returns {Promise<boolean>}
   */
  async enable() {
    try {
      // Create desktop entry for autostart
      await this.desktopFileManager.createDesktopEntry();
      
      // Also use Electron's method as fallback
      app.setLoginItemSettings({
        openAtLogin: true,
        openAsHidden: false,
        path: process.execPath,
        args: ['--startup']
      });
      
      console.log('AutoStartup: Linux auto-startup enabled');
      return true;
    } catch (error) {
      console.error('AutoStartup: Failed to enable Linux auto-startup:', error);
      return false;
    }
  }

  /**
   * Disable auto-startup on Linux
   * @returns {Promise<boolean>}
   */
  async disable() {
    try {
      app.setLoginItemSettings({
        openAtLogin: false
      });

      await this.desktopFileManager.removeDesktopEntry();
      
      console.log('AutoStartup: Linux auto-startup disabled');
      return true;
    } catch (error) {
      console.error('AutoStartup: Failed to disable Linux auto-startup:', error);
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
      console.error('AutoStartup: Failed to check Linux status:', error);
      return false;
    }
  }
}

module.exports = { LinuxStartupStrategy };
