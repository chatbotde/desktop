/**
 * Auto Startup Manager
 * Handles automatic startup of the application on system boot/login
 * 
 * SOLID Principles Applied:
 * - Single Responsibility: Manages high-level startup coordination only
 * - Open/Closed: Extensible through strategy pattern, closed for modification
 * - Liskov Substitution: All platform strategies are interchangeable
 * - Interface Segregation: Strategies implement focused interfaces
 * - Dependency Inversion: Depends on abstractions (IPlatformStartupStrategy)
 */

const { PlatformStrategyFactory } = require('./platform-strategy-factory');
const { StartupInfoProvider } = require('./startup-info-provider');

class AutoStartupManager {
  /**
   * @param {string} appName - Application name
   * @param {IPlatformStartupStrategy} [strategy] - Optional custom strategy (for testing/extension)
   */
  constructor(appName = 'Buddy', strategy = null) {
    this.appName = appName;
    this.isSetup = false;
    
    // Use provided strategy or create platform-specific one
    // Follows Dependency Inversion Principle: depends on abstraction
    this.strategy = strategy || PlatformStrategyFactory.createStrategy(
      StartupInfoProvider.getPlatform(),
      appName
    );
  }

  /**
   * Setup auto-startup functionality
   * @returns {Promise<boolean>} Success status
   */
  async setupAutoStartup() {
    try {
      console.log('AutoStartup: Setting up auto-startup functionality...');
      
      // Check if auto-startup is already enabled
      if (this.strategy.isEnabled()) {
        console.log('AutoStartup: Already enabled');
        this.isSetup = true;
        return true;
      }

      // Enable auto-startup using platform strategy
      const result = await this.strategy.enable();
      
      if (result) {
        console.log('AutoStartup: Setup completed successfully');
        this.isSetup = true;
      }
      
      return result;
    } catch (error) {
      console.error('AutoStartup: Failed to setup auto-startup:', error);
      return false;
    }
  }

  /**
   * Enable auto-startup for the application
   * @returns {Promise<boolean>} Success status
   */
  async enableAutoStartup() {
    try {
      const result = await this.strategy.enable();
      
      if (result) {
        console.log('AutoStartup: Enabled for platform:', StartupInfoProvider.getPlatform());
        this.isSetup = true;
      }
      
      return result;
    } catch (error) {
      console.error('AutoStartup: Failed to enable auto-startup:', error);
      return false;
    }
  }

  /**
   * Disable auto-startup
   * @returns {Promise<boolean>} Success status
   */
  async disableAutoStartup() {
    try {
      const result = await this.strategy.disable();
      
      if (result) {
        console.log('AutoStartup: Disabled');
        this.isSetup = false;
      }
      
      return result;
    } catch (error) {
      console.error('AutoStartup: Failed to disable auto-startup:', error);
      return false;
    }
  }

  /**
   * Check if auto-startup is enabled
   * @returns {boolean} Enabled status
   */
  isAutoStartupEnabled() {
    try {
      return this.strategy.isEnabled();
    } catch (error) {
      console.error('AutoStartup: Failed to check status:', error);
      return false;
    }
  }

  /**
   * Toggle auto-startup
   * @returns {Promise<boolean>} Success status
   */
  async toggleAutoStartup() {
    try {
      if (this.isAutoStartupEnabled()) {
        return await this.disableAutoStartup();
      } else {
        return await this.enableAutoStartup();
      }
    } catch (error) {
      console.error('AutoStartup: Failed to toggle:', error);
      return false;
    }
  }

  /**
   * Check if this is a startup launch (launched by system on boot)
   * @returns {boolean} True if launched with --startup flag
   */
  isStartupLaunch() {
    return StartupInfoProvider.isStartupLaunch();
  }

  /**
   * Get startup info
   * @returns {Object} Startup information
   */
  getStartupInfo() {
    return {
      isSetup: this.isSetup,
      isEnabled: this.isAutoStartupEnabled(),
      isStartupLaunch: this.isStartupLaunch(),
      platform: StartupInfoProvider.getPlatform(),
      startupArgs: StartupInfoProvider.getStartupArgs()
    };
  }
}

module.exports = { AutoStartupManager };
