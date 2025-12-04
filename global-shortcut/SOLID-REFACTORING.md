# Global Shortcut Module - SOLID Refactoring

This module handles global keyboard shortcuts and minimal mode functionality, refactored to follow **SOLID principles**.

## Architecture Overview

The module has been refactored from a monolithic class into focused, testable components following SOLID design principles.

## SOLID Principles Applied

### 1. Single Responsibility Principle (SRP)
Each class has ONE clear responsibility:

- **MinimalModeManager**: High-level coordination of minimal mode functionality
- **MinimalModeState**: State management only (enable/disable/toggle state)
- **MinimalModeIpcRegistry**: IPC handler registration and cleanup
- **MinimalModeNotifier**: Notifying renderer about state changes
- **ChatInputWindowCommunicator**: Window communication implementation
- **IWindowCommunicator**: Communication abstraction (interface)

### 2. Open/Closed Principle (OCP)
- **Open for extension**: New window communicators can be added by implementing `IWindowCommunicator`
- **Closed for modification**: Core logic doesn't need changes to support new window types
- Example: Add support for settings window by creating `SettingsWindowCommunicator`

### 3. Liskov Substitution Principle (LSP)
- `ChatInputWindowCommunicator` extends `IWindowCommunicator`
- Any communicator implementing the interface can be substituted
- `MinimalModeManager` works with any `IWindowCommunicator` implementation

### 4. Interface Segregation Principle (ISP)
- `IWindowCommunicator` provides minimal interface:
  - `sendToRenderer(channel, data)` - Send messages
  - `isAvailable()` - Check availability
- No client forced to implement unnecessary methods

### 5. Dependency Inversion Principle (DIP)
- `MinimalModeManager` depends on abstractions (`IWindowCommunicator`)
- Not on concrete implementations
- Dependencies injected via constructor (supports testing)
- High-level logic doesn't depend on low-level window details

## File Structure

```
global-shortcut/
├── minimal-mode-manager.js              # Main coordinator (high-level)
├── minimal-mode-state.js                # State management only
├── minimal-mode-ipc-registry.js         # IPC handler registration
├── minimal-mode-notifier.js             # Renderer notification
├── window-communicator.js               # Communication interface
├── chat-input-window-communicator.js    # Concrete communicator
├── index.js                             # Module entry point
└── README.md                            # Usage documentation
```

## Before vs After

### Before (152 lines in 1 file)
```
global-shortcut/
├── minimal-mode-manager.js (152 lines - all logic)
└── index.js (11 lines - simple export)
```

**Issues:**
- ❌ One class handling state, IPC, window communication, and notifications
- ❌ Direct dependency on concrete window instance
- ❌ Difficult to test individual components
- ❌ Hard to extend with new window types

### After (6 focused files)
```
global-shortcut/
├── minimal-mode-manager.js (123 lines)
├── minimal-mode-state.js (62 lines)
├── minimal-mode-ipc-registry.js (105 lines)
├── minimal-mode-notifier.js (42 lines)
├── window-communicator.js (32 lines)
├── chat-input-window-communicator.js (69 lines)
└── index.js (28 lines)
```

**Benefits:**
- ✅ Each class has single responsibility
- ✅ Easy to test with dependency injection
- ✅ Extensible with new communicators
- ✅ Clear separation of concerns
- ✅ Full backwards compatibility

## Usage

### Basic Usage (Backwards Compatible)
```javascript
const { MinimalModeManager } = require('./global-shortcut');

// Initialize with window
MinimalModeManager.initialize(chatInputWindow);

// Toggle minimal mode
MinimalModeManager.toggleMinimalMode();

// Enable/disable
MinimalModeManager.enableMinimalMode();
MinimalModeManager.disableMinimalMode();

// Get status
const isMinimal = MinimalModeManager.getStatus();

// Update window
MinimalModeManager.setChatInputWindow(newWindow);

// Cleanup
MinimalModeManager.cleanup();
```

### Advanced Usage (Custom Dependencies)
```javascript
const {
  MinimalModeManager,
  MinimalModeState,
  MinimalModeIpcRegistry,
  ChatInputWindowCommunicator
} = require('./global-shortcut');

// Create custom components
const state = new MinimalModeState();
const ipcRegistry = new MinimalModeIpcRegistry();
const communicator = new ChatInputWindowCommunicator(chatInputWindow);

// Inject dependencies
const manager = new MinimalModeManager(state, ipcRegistry, communicator);
manager.initialize(chatInputWindow);
```

### Testing with Mocks
```javascript
const { MinimalModeManager, IWindowCommunicator } = require('./global-shortcut');

// Create mock communicator
class MockWindowCommunicator extends IWindowCommunicator {
  constructor() {
    super();
    this.messages = [];
  }
  
  sendToRenderer(channel, data) {
    this.messages.push({ channel, data });
    return true;
  }
  
  isAvailable() {
    return true;
  }
}

// Test with mock
const mockComm = new MockWindowCommunicator();
const manager = new MinimalModeManager(null, null, mockComm);

manager.enableMinimalMode();
expect(mockComm.messages).toHaveLength(1);
expect(mockComm.messages[0].data).toBe(true);
```

## Benefits of This Design

### Maintainability
- Each component has clear, single purpose
- Easy to understand and modify individual parts
- Changes to one component don't affect others

### Testability
- Each component can be tested in isolation
- Easy to mock dependencies
- Dependency injection supports comprehensive testing

### Extensibility
- Add new window communicators without modifying core logic
- Easy to extend with new minimal mode behaviors
- Support for custom state management

### Flexibility
- Swap communicators at runtime
- Custom IPC handlers for different use cases
- Support for multiple window types

## Adding New Window Type

To support a new window type:

1. **Create Communicator Class**
   ```javascript
   // settings-window-communicator.js
   class SettingsWindowCommunicator extends IWindowCommunicator {
     constructor(settingsWindow) {
       super();
       this.settingsWindow = settingsWindow;
     }
     
     sendToRenderer(channel, data) {
       // Settings window-specific implementation
     }
     
     isAvailable() {
       // Check if settings window is available
     }
   }
   ```

2. **Use with Manager**
   ```javascript
   const settingsComm = new SettingsWindowCommunicator(settingsWindow);
   const manager = new MinimalModeManager(null, null, settingsComm);
   ```

3. **Done!** No modifications to existing code needed.

## Component Responsibilities

### MinimalModeManager
- Coordinates all minimal mode operations
- Initializes components
- Delegates to specialized components
- Maintains backwards compatibility

### MinimalModeState
- Tracks minimal mode state (on/off)
- Provides state manipulation methods
- Returns whether state changed
- Single source of truth for state

### MinimalModeIpcRegistry
- Registers IPC handlers
- Validates callbacks
- Unregisters handlers on cleanup
- Manages handler lifecycle

### MinimalModeNotifier
- Sends state change notifications
- Uses window communicator abstraction
- Handles notification failures gracefully
- Logs notification status

### ChatInputWindowCommunicator
- Implements window communication
- Handles chat input window specifics
- Validates window availability
- Error handling for destroyed windows

### IWindowCommunicator
- Defines communication contract
- Provides abstraction for DIP
- Minimal interface for ISP
- Base for all communicators

## Design Patterns Used

- **Dependency Injection**: Manager receives dependencies
- **Strategy Pattern**: Different window communicators
- **Singleton Pattern**: Default manager instance (backwards compatibility)

## Backwards Compatibility

The public API remains unchanged:
- Existing code using `MinimalModeManager` works without modification
- All original methods preserved
- Same initialization pattern
- Singleton instance exported for compatibility
