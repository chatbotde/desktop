/**
 * Platform Startup Strategy Interfaces
 * Defines abstractions for platform-specific auto-startup implementations
 * Follows: Interface Segregation Principle (ISP) & Dependency Inversion Principle (DIP)
 */

/**
 * Base interface for platform-specific startup strategies
 * Following ISP: Small, focused interface
 */
class IPlatformStartupStrategy {
  /**
   * Enable auto-startup for the platform
   * @returns {Promise<boolean>} Success status
   */
  async enable() {
    throw new Error('Method enable() must be implemented');
  }

  /**
   * Disable auto-startup for the platform
   * @returns {Promise<boolean>} Success status
   */
  async disable() {
    throw new Error('Method disable() must be implemented');
  }

  /**
   * Check if auto-startup is enabled
   * @returns {boolean} Enabled status
   */
  isEnabled() {
    throw new Error('Method isEnabled() must be implemented');
  }
}

module.exports = { IPlatformStartupStrategy };
