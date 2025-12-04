/**
 * Startup module entry point
 * Exports auto-startup functionality and related components
 * 
 * Following SOLID principles:
 * - All components are loosely coupled
 * - Each component has a single responsibility
 * - Easy to extend with new platforms or strategies
 */

const { AutoStartupManager } = require('./auto-startup-manager');
const { PlatformStrategyFactory } = require('./platform-strategy-factory');
const { StartupInfoProvider } = require('./startup-info-provider');

// Export main manager (primary interface)
module.exports = {
  AutoStartupManager,
  // Export factory and info provider for advanced use cases
  PlatformStrategyFactory,
  StartupInfoProvider
};
