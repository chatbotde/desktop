/**
 * Platform Strategy Factory
 * Creates appropriate platform-specific startup strategy
 * Follows: Open/Closed Principle (OCP) & Factory Pattern
 */

const { WindowsStartupStrategy } = require('./windows-startup-strategy');
const { MacOSStartupStrategy } = require('./macos-startup-strategy');
const { LinuxStartupStrategy } = require('./linux-startup-strategy');
const { RegistryManager } = require('./registry-manager');
const { DesktopFileManager } = require('./desktop-file-manager');

class PlatformStrategyFactory {
  /**
   * Create platform-specific startup strategy
   * @param {string} platform - Platform identifier (win32, darwin, linux)
   * @param {string} appName - Application name
   * @returns {IPlatformStartupStrategy} Platform-specific startup strategy
   * @throws {Error} If platform is not supported
   */
  static createStrategy(platform, appName) {
    switch (platform) {
      case 'win32':
        return new WindowsStartupStrategy(appName, new RegistryManager());
      
      case 'darwin':
        return new MacOSStartupStrategy();
      
      case 'linux':
        return new LinuxStartupStrategy(appName, new DesktopFileManager(appName));
      
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  /**
   * Get supported platforms
   * @returns {string[]} List of supported platforms
   */
  static getSupportedPlatforms() {
    return ['win32', 'darwin', 'linux'];
  }

  /**
   * Check if platform is supported
   * @param {string} platform - Platform identifier
   * @returns {boolean} True if platform is supported
   */
  static isPlatformSupported(platform) {
    return this.getSupportedPlatforms().includes(platform);
  }
}

module.exports = { PlatformStrategyFactory };
