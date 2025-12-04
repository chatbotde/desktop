/**
 * Startup Info Provider
 * Provides startup-related information and utilities
 * Follows: Single Responsibility Principle (SRP)
 */

class StartupInfoProvider {
  /**
   * Check if this is a startup launch (launched by system on boot)
   * @returns {boolean} True if launched with --startup flag
   */
  static isStartupLaunch() {
    return process.argv.includes('--startup');
  }

  /**
   * Get current platform
   * @returns {string} Platform identifier
   */
  static getPlatform() {
    return process.platform;
  }

  /**
   * Get startup launch arguments
   * @returns {string[]} Startup arguments
   */
  static getStartupArgs() {
    return process.argv.filter(arg => arg.startsWith('--'));
  }
}

module.exports = { StartupInfoProvider };
