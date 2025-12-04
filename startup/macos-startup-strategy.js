/**
 * macOS Startup Strategy
 * Handles macOS-specific auto-startup implementation
 * Follows: Single Responsibility Principle (SRP)
 */

const { app } = require('electron');
const { IPlatformStartupStrategy } = require('./platform-startup-strategy');

class MacOSStartupStrategy extends IPlatformStartupStrategy {
  /**
   * Enable auto-startup on macOS
   * @returns {Promise<boolean>}
   */
  async enable() {
    try {
      app.setLoginItemSettings({
        openAtLogin: true,
        openAsHidden: false,
        path: process.execPath
      });
      
      console.log('AutoStartup: macOS auto-startup enabled');
      return true;
    } catch (error) {
      console.error('AutoStartup: Failed to enable macOS auto-startup:', error);
      return false;
    }
  }

  /**
   * Disable auto-startup on macOS
   * @returns {Promise<boolean>}
   */
  async disable() {
    try {
      app.setLoginItemSettings({
        openAtLogin: false
      });
      
      console.log('AutoStartup: macOS auto-startup disabled');
      return true;
    } catch (error) {
      console.error('AutoStartup: Failed to disable macOS auto-startup:', error);
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
      console.error('AutoStartup: Failed to check macOS status:', error);
      return false;
    }
  }
}

module.exports = { MacOSStartupStrategy };
