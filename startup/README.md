# Startup Module - SOLID Refactoring

This module handles automatic startup of the application on system boot/login across different platforms (Windows, macOS, Linux).

## Architecture Overview

The module has been refactored following **SOLID principles** to create a maintainable, extensible, and testable codebase.

## SOLID Principles Applied

### 1. Single Responsibility Principle (SRP)
Each class has one clear responsibility:

- **AutoStartupManager**: High-level coordination of startup functionality
- **WindowsStartupStrategy**: Windows-specific startup implementation
- **MacOSStartupStrategy**: macOS-specific startup implementation  
- **LinuxStartupStrategy**: Linux-specific startup implementation
- **RegistryManager**: Windows registry operations only
- **DesktopFileManager**: Linux desktop file operations only
- **StartupInfoProvider**: Startup information queries only
- **PlatformStrategyFactory**: Platform strategy creation only

### 2. Open/Closed Principle (OCP)
- **Open for extension**: Add new platforms by creating new strategy classes
- **Closed for modification**: No need to modify existing code to support new platforms
- The factory pattern allows adding new platform strategies without changing core logic

### 3. Liskov Substitution Principle (LSP)
- All platform strategies extend `IPlatformStartupStrategy`
- Any strategy can be substituted without breaking the application
- `AutoStartupManager` works with any strategy that implements the interface

### 4. Interface Segregation Principle (ISP)
- `IPlatformStartupStrategy` provides a minimal, focused interface
- Only three essential methods: `enable()`, `disable()`, `isEnabled()`
- No client is forced to depend on unused methods

### 5. Dependency Inversion Principle (DIP)
- `AutoStartupManager` depends on the abstraction `IPlatformStartupStrategy`
- High-level logic doesn't depend on low-level platform details
- Strategies are injected via constructor (supports dependency injection)

## File Structure

```
startup/
├── auto-startup-manager.js          # Main manager (high-level coordination)
├── platform-startup-strategy.js     # Base strategy interface
├── windows-startup-strategy.js      # Windows implementation
├── macos-startup-strategy.js        # macOS implementation
├── linux-startup-strategy.js        # Linux implementation
├── registry-manager.js              # Windows registry operations
├── desktop-file-manager.js          # Linux desktop file operations
├── platform-strategy-factory.js     # Factory for creating strategies
├── startup-info-provider.js         # Startup information utilities
└── index.js                         # Module entry point
```

## Usage

### Basic Usage
```javascript
const { AutoStartupManager } = require('./startup');

const manager = new AutoStartupManager('MyApp');

// Setup auto-startup
await manager.setupAutoStartup();

// Enable/disable
await manager.enableAutoStartup();
await manager.disableAutoStartup();

// Toggle
await manager.toggleAutoStartup();

// Check status
const isEnabled = manager.isAutoStartupEnabled();
const isStartup = manager.isStartupLaunch();

// Get info
const info = manager.getStartupInfo();
```

### Advanced Usage (Custom Strategy)
```javascript
const { AutoStartupManager, PlatformStrategyFactory } = require('./startup');

// Create custom strategy
const customStrategy = PlatformStrategyFactory.createStrategy('win32', 'MyApp');

// Inject strategy
const manager = new AutoStartupManager('MyApp', customStrategy);
```

### Testing with Mock Strategy
```javascript
class MockStartupStrategy extends IPlatformStartupStrategy {
  async enable() { return true; }
  async disable() { return true; }
  isEnabled() { return false; }
}

const manager = new AutoStartupManager('TestApp', new MockStartupStrategy());
```

## Benefits of This Design

### Maintainability
- Each component has a clear, single purpose
- Easy to understand and modify individual components
- Changes to one platform don't affect others

### Extensibility
- Add new platforms by creating a new strategy class
- Add the strategy to the factory
- No modification of existing code required

### Testability
- Each component can be tested in isolation
- Easy to mock dependencies
- Strategy injection supports dependency injection for testing

### Flexibility
- Swap strategies at runtime
- Easy to add platform-specific features
- Support for custom implementations

## Adding a New Platform

To add support for a new platform:

1. **Create Strategy Class**
   ```javascript
   // freebsd-startup-strategy.js
   class FreeBSDStartupStrategy extends IPlatformStartupStrategy {
     async enable() { /* implementation */ }
     async disable() { /* implementation */ }
     isEnabled() { /* implementation */ }
   }
   ```

2. **Update Factory**
   ```javascript
   // platform-strategy-factory.js
   case 'freebsd':
     return new FreeBSDStartupStrategy(appName);
   ```

3. **Done!** No other files need modification.

## Design Patterns Used

- **Strategy Pattern**: Platform-specific implementations
- **Factory Pattern**: Platform strategy creation
- **Dependency Injection**: Strategy injection into manager

## Backwards Compatibility

The public API remains unchanged:
- Existing code using `AutoStartupManager` works without modification
- All original methods are preserved
- Same constructor signature (with optional parameters for extension)
