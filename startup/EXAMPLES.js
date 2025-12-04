/**
 * Usage Examples
 * Demonstrates how to use the refactored startup module
 */

// ============================================================================
// EXAMPLE 1: Basic Usage (Same as before - Backwards Compatible)
// ============================================================================

const { AutoStartupManager } = require('./startup');

async function basicExample() {
  const manager = new AutoStartupManager('MyApp');
  
  // Setup auto-startup (checks if already enabled)
  const success = await manager.setupAutoStartup();
  console.log('Setup successful:', success);
  
  // Check status
  const isEnabled = manager.isAutoStartupEnabled();
  console.log('Auto-startup enabled:', isEnabled);
  
  // Check if this is a startup launch
  const isStartup = manager.isStartupLaunch();
  console.log('Launched on startup:', isStartup);
  
  // Get full info
  const info = manager.getStartupInfo();
  console.log('Startup info:', info);
  // {
  //   isSetup: true,
  //   isEnabled: true,
  //   isStartupLaunch: false,
  //   platform: 'win32',
  //   startupArgs: []
  // }
}

// ============================================================================
// EXAMPLE 2: Enable/Disable Control
// ============================================================================

async function toggleExample() {
  const manager = new AutoStartupManager('MyApp');
  
  // Enable
  await manager.enableAutoStartup();
  console.log('Enabled:', manager.isAutoStartupEnabled());
  
  // Disable
  await manager.disableAutoStartup();
  console.log('Enabled:', manager.isAutoStartupEnabled());
  
  // Toggle (smart enable/disable)
  await manager.toggleAutoStartup();
  console.log('Toggled:', manager.isAutoStartupEnabled());
}

// ============================================================================
// EXAMPLE 3: Custom Strategy Injection (Advanced)
// ============================================================================

const { PlatformStrategyFactory } = require('./startup');

async function customStrategyExample() {
  // Manually create a strategy
  const strategy = PlatformStrategyFactory.createStrategy('win32', 'MyApp');
  
  // Inject custom strategy
  const manager = new AutoStartupManager('MyApp', strategy);
  
  await manager.enableAutoStartup();
}

// ============================================================================
// EXAMPLE 4: Testing with Mock Strategy
// ============================================================================

const { IPlatformStartupStrategy } = require('./startup/platform-startup-strategy');

// Create mock strategy for testing
class MockStartupStrategy extends IPlatformStartupStrategy {
  constructor() {
    super();
    this.enabled = false;
    this.enableCalls = 0;
    this.disableCalls = 0;
  }
  
  async enable() {
    this.enableCalls++;
    this.enabled = true;
    return true;
  }
  
  async disable() {
    this.disableCalls++;
    this.enabled = false;
    return true;
  }
  
  isEnabled() {
    return this.enabled;
  }
}

async function testingExample() {
  const mockStrategy = new MockStartupStrategy();
  const manager = new AutoStartupManager('TestApp', mockStrategy);
  
  // Test enable
  await manager.enableAutoStartup();
  console.assert(mockStrategy.enabled === true, 'Should be enabled');
  console.assert(mockStrategy.enableCalls === 1, 'Should call enable once');
  
  // Test disable
  await manager.disableAutoStartup();
  console.assert(mockStrategy.enabled === false, 'Should be disabled');
  console.assert(mockStrategy.disableCalls === 1, 'Should call disable once');
  
  // Test toggle
  await manager.toggleAutoStartup();
  console.assert(mockStrategy.enabled === true, 'Should be enabled after toggle');
  
  console.log('All tests passed! ✅');
}

// ============================================================================
// EXAMPLE 5: Platform Detection
// ============================================================================

const { StartupInfoProvider } = require('./startup');

function platformExample() {
  const platform = StartupInfoProvider.getPlatform();
  console.log('Current platform:', platform);
  
  const isStartup = StartupInfoProvider.isStartupLaunch();
  console.log('Is startup launch:', isStartup);
  
  const args = StartupInfoProvider.getStartupArgs();
  console.log('Startup arguments:', args);
  
  // Check platform support
  const supported = PlatformStrategyFactory.isPlatformSupported(platform);
  console.log('Platform supported:', supported);
  
  const allPlatforms = PlatformStrategyFactory.getSupportedPlatforms();
  console.log('All supported platforms:', allPlatforms);
}

// ============================================================================
// EXAMPLE 6: Error Handling
// ============================================================================

async function errorHandlingExample() {
  const manager = new AutoStartupManager('MyApp');
  
  try {
    const success = await manager.enableAutoStartup();
    
    if (success) {
      console.log('Auto-startup enabled successfully');
    } else {
      console.log('Failed to enable auto-startup');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// ============================================================================
// EXAMPLE 7: Application Integration (Real-World)
// ============================================================================

class Application {
  constructor() {
    this.startupManager = new AutoStartupManager('MyAwesomeApp');
  }
  
  async initialize() {
    // Check if launched on startup
    if (this.startupManager.isStartupLaunch()) {
      console.log('Application launched on system startup');
      // Maybe show in system tray instead of main window
      this.startMinimized();
    } else {
      console.log('Application launched manually');
      this.showMainWindow();
    }
    
    // Setup auto-startup if not already done
    const info = this.startupManager.getStartupInfo();
    if (!info.isEnabled) {
      const userWantsAutoStartup = await this.askUserAboutAutoStartup();
      if (userWantsAutoStartup) {
        await this.startupManager.enableAutoStartup();
      }
    }
  }
  
  async onSettingsChange(autoStartupEnabled) {
    // User changed settings
    if (autoStartupEnabled) {
      await this.startupManager.enableAutoStartup();
    } else {
      await this.startupManager.disableAutoStartup();
    }
  }
  
  getAutoStartupStatus() {
    return this.startupManager.getStartupInfo();
  }
  
  startMinimized() {
    console.log('Starting minimized...');
  }
  
  showMainWindow() {
    console.log('Showing main window...');
  }
  
  async askUserAboutAutoStartup() {
    // Show dialog to user
    return true; // User's choice
  }
}

// ============================================================================
// EXAMPLE 8: Extending with New Platform (FreeBSD)
// ============================================================================

// Step 1: Create new strategy
class FreeBSDStartupStrategy extends IPlatformStartupStrategy {
  async enable() {
    console.log('Enabling auto-startup on FreeBSD');
    // FreeBSD-specific implementation
    // e.g., add to /usr/local/etc/rc.d/
    return true;
  }
  
  async disable() {
    console.log('Disabling auto-startup on FreeBSD');
    // FreeBSD-specific implementation
    return true;
  }
  
  isEnabled() {
    // FreeBSD-specific check
    return false;
  }
}

// Step 2: Use the new strategy
async function freebsdExample() {
  const freebsdStrategy = new FreeBSDStartupStrategy();
  const manager = new AutoStartupManager('MyApp', freebsdStrategy);
  
  await manager.enableAutoStartup();
  // Now works on FreeBSD!
}

// ============================================================================
// EXAMPLE 9: Cross-Platform Compatibility Check
// ============================================================================

async function crossPlatformExample() {
  const currentPlatform = StartupInfoProvider.getPlatform();
  
  if (!PlatformStrategyFactory.isPlatformSupported(currentPlatform)) {
    console.error(`Platform ${currentPlatform} is not supported`);
    console.log('Supported platforms:', 
      PlatformStrategyFactory.getSupportedPlatforms());
    return;
  }
  
  const manager = new AutoStartupManager('MyApp');
  await manager.setupAutoStartup();
  console.log('Auto-startup configured for', currentPlatform);
}

// ============================================================================
// EXAMPLE 10: Conditional Platform Strategy
// ============================================================================

async function conditionalStrategyExample() {
  const platform = StartupInfoProvider.getPlatform();
  let strategy;
  
  // Custom logic for strategy selection
  if (platform === 'win32' && process.env.USE_REGISTRY_ONLY) {
    // Custom Windows-only strategy
    strategy = new WindowsStartupStrategy('MyApp', new RegistryManager());
  } else {
    // Default strategy for platform
    strategy = PlatformStrategyFactory.createStrategy(platform, 'MyApp');
  }
  
  const manager = new AutoStartupManager('MyApp', strategy);
  await manager.enableAutoStartup();
}

// ============================================================================
// Run Examples
// ============================================================================

if (require.main === module) {
  (async () => {
    console.log('Running examples...\n');
    
    console.log('=== Example 1: Basic Usage ===');
    await basicExample();
    
    console.log('\n=== Example 4: Testing ===');
    await testingExample();
    
    console.log('\n=== Example 5: Platform Detection ===');
    platformExample();
    
    console.log('\nAll examples completed! ✅');
  })();
}

module.exports = {
  MockStartupStrategy,
  Application,
  FreeBSDStartupStrategy
};
