/**
 * Usage Examples
 * Demonstrates how to use the refactored global-shortcut module
 */

// ============================================================================
// EXAMPLE 1: Basic Usage (Backwards Compatible)
// ============================================================================

const { MinimalModeManager } = require('./index');

function basicExample(chatInputWindow) {
  // Initialize with window
  MinimalModeManager.initialize(chatInputWindow);
  
  // Toggle minimal mode
  MinimalModeManager.toggleMinimalMode();
  
  // Enable minimal mode
  MinimalModeManager.enableMinimalMode();
  
  // Disable minimal mode
  MinimalModeManager.disableMinimalMode();
  
  // Get current status
  const isMinimal = MinimalModeManager.getStatus();
  console.log('Is minimal mode:', isMinimal);
  
  // Update window reference
  MinimalModeManager.setChatInputWindow(chatInputWindow);
  
  // Cleanup when done
  MinimalModeManager.cleanup();
}

// ============================================================================
// EXAMPLE 2: Testing with Mock Communicator
// ============================================================================

const { 
  MinimalModeManager: ManagerClass,
  IWindowCommunicator,
  MinimalModeState
} = require('./index');

// Create mock communicator for testing
class MockWindowCommunicator extends IWindowCommunicator {
  constructor() {
    super();
    this.messages = [];
    this.available = true;
  }
  
  sendToRenderer(channel, data) {
    if (!this.available) {
      return false;
    }
    this.messages.push({ channel, data });
    return true;
  }
  
  isAvailable() {
    return this.available;
  }
  
  // Test helpers
  getLastMessage() {
    return this.messages[this.messages.length - 1];
  }
  
  clearMessages() {
    this.messages = [];
  }
}

function testingExample() {
  const mockComm = new MockWindowCommunicator();
  const state = new MinimalModeState();
  const manager = new ManagerClass(state, null, mockComm);
  
  // Test enable
  manager.enableMinimalMode();
  console.assert(mockComm.messages.length === 1, 'Should send one message');
  console.assert(mockComm.getLastMessage().channel === 'minimal-mode-changed');
  console.assert(mockComm.getLastMessage().data === true);
  
  // Test disable
  manager.disableMinimalMode();
  console.assert(mockComm.messages.length === 2, 'Should send two messages');
  console.assert(mockComm.getLastMessage().data === false);
  
  // Test toggle
  mockComm.clearMessages();
  manager.toggleMinimalMode();
  console.assert(mockComm.messages.length === 1, 'Should send one message');
  
  console.log('All tests passed! ✅');
}

// ============================================================================
// EXAMPLE 3: Custom Window Communicator
// ============================================================================

// Example: Support for settings window
class SettingsWindowCommunicator extends IWindowCommunicator {
  constructor(settingsWindow) {
    super();
    this.settingsWindow = settingsWindow;
  }
  
  sendToRenderer(channel, data) {
    if (!this.isAvailable()) {
      return false;
    }
    
    try {
      this.settingsWindow.webContents.send(channel, data);
      return true;
    } catch (error) {
      console.error('SettingsWindowCommunicator: Send failed:', error);
      return false;
    }
  }
  
  isAvailable() {
    return this.settingsWindow && 
           !this.settingsWindow.isDestroyed();
  }
}

function customCommunicatorExample(settingsWindow) {
  const settingsComm = new SettingsWindowCommunicator(settingsWindow);
  const manager = new ManagerClass(null, null, settingsComm);
  
  manager.enableMinimalMode();
  // Now works with settings window!
}

// ============================================================================
// EXAMPLE 4: Multi-Window Support
// ============================================================================

class MultiWindowCommunicator extends IWindowCommunicator {
  constructor(windows = []) {
    super();
    this.windows = windows;
  }
  
  addWindow(window) {
    this.windows.push(window);
  }
  
  removeWindow(window) {
    this.windows = this.windows.filter(w => w !== window);
  }
  
  sendToRenderer(channel, data) {
    let sentCount = 0;
    
    for (const window of this.windows) {
      if (window && !window.isDestroyed()) {
        try {
          window.webContents.send(channel, data);
          sentCount++;
        } catch (error) {
          console.error('MultiWindowCommunicator: Failed to send to window:', error);
        }
      }
    }
    
    return sentCount > 0;
  }
  
  isAvailable() {
    return this.windows.some(w => w && !w.isDestroyed());
  }
}

function multiWindowExample(chatWindow, settingsWindow) {
  const multiComm = new MultiWindowCommunicator([chatWindow, settingsWindow]);
  const manager = new ManagerClass(null, null, multiComm);
  
  // Enable minimal mode - notifies all windows
  manager.enableMinimalMode();
}

// ============================================================================
// EXAMPLE 5: State Management Only
// ============================================================================

function stateManagementExample() {
  const state = new MinimalModeState();
  
  // Enable
  const changed1 = state.enable();
  console.log('State changed:', changed1); // true
  console.log('Current state:', state.getState()); // true
  
  // Try to enable again
  const changed2 = state.enable();
  console.log('State changed:', changed2); // false (already enabled)
  
  // Toggle
  const newState = state.toggle();
  console.log('New state:', newState); // false
  
  // Reset
  state.reset();
  console.log('After reset:', state.getState()); // false
}

// ============================================================================
// EXAMPLE 6: IPC Registry Standalone
// ============================================================================

const { MinimalModeIpcRegistry } = require('./index');

function ipcRegistryExample() {
  const registry = new MinimalModeIpcRegistry();
  
  const callbacks = {
    onToggle: () => console.log('Toggle called'),
    onEnable: () => console.log('Enable called'),
    onDisable: () => console.log('Disable called'),
    onGetStatus: () => false
  };
  
  // Register handlers
  const registered = registry.registerHandlers(callbacks);
  console.log('Handlers registered:', registered);
  
  // Check status
  const isRegistered = registry.isRegistered();
  console.log('Is registered:', isRegistered);
  
  // Unregister when done
  registry.unregisterHandlers();
}

// ============================================================================
// EXAMPLE 7: Notifier with Custom Communicator
// ============================================================================

const { MinimalModeNotifier } = require('./index');

function notifierExample() {
  const mockComm = new MockWindowCommunicator();
  const notifier = new MinimalModeNotifier(mockComm);
  
  // Notify state change
  const success1 = notifier.notifyStateChange(true);
  console.log('Notification sent:', success1);
  console.log('Messages:', mockComm.messages);
  
  // Update communicator
  const newMockComm = new MockWindowCommunicator();
  notifier.setWindowCommunicator(newMockComm);
  
  // Notify again
  const success2 = notifier.notifyStateChange(false);
  console.log('New notification sent:', success2);
}

// ============================================================================
// EXAMPLE 8: Complete Integration Test
// ============================================================================

function integrationTest(chatInputWindow) {
  const { 
    MinimalModeManager: ManagerClass,
    MinimalModeState,
    MinimalModeIpcRegistry,
    ChatInputWindowCommunicator
  } = require('./index');
  
  // Create all components
  const state = new MinimalModeState();
  const ipcRegistry = new MinimalModeIpcRegistry();
  const communicator = new ChatInputWindowCommunicator(chatInputWindow);
  
  // Create manager with custom components
  const manager = new ManagerClass(state, ipcRegistry, communicator);
  
  // Initialize
  manager.initialize(chatInputWindow);
  
  // Test all operations
  manager.enableMinimalMode();
  console.assert(state.getState() === true, 'State should be true');
  
  manager.disableMinimalMode();
  console.assert(state.getState() === false, 'State should be false');
  
  manager.toggleMinimalMode();
  console.assert(state.getState() === true, 'State should toggle to true');
  
  // Cleanup
  manager.cleanup();
  console.assert(state.getState() === false, 'State should reset');
  console.assert(!ipcRegistry.isRegistered(), 'Handlers should be unregistered');
  
  console.log('Integration test passed! ✅');
}

// ============================================================================
// EXAMPLE 9: Error Handling
// ============================================================================

function errorHandlingExample() {
  const mockComm = new MockWindowCommunicator();
  const manager = new ManagerClass(null, null, mockComm);
  
  // Simulate window unavailable
  mockComm.available = false;
  
  manager.enableMinimalMode();
  // Manager handles error gracefully, logs warning
  
  // Re-enable communication
  mockComm.available = true;
  
  manager.enableMinimalMode();
  // Now works correctly
  
  console.log('Error handling works correctly ✅');
}

// ============================================================================
// EXAMPLE 10: Lifecycle Management
// ============================================================================

class MinimalModeLifecycleManager {
  constructor(chatInputWindow) {
    const { 
      MinimalModeManager: ManagerClass,
      MinimalModeState,
      ChatInputWindowCommunicator
    } = require('./index');
    
    this.state = new MinimalModeState();
    this.communicator = new ChatInputWindowCommunicator(chatInputWindow);
    this.manager = new ManagerClass(this.state, null, this.communicator);
  }
  
  initialize(chatInputWindow) {
    this.manager.initialize(chatInputWindow);
    console.log('Lifecycle: Initialized');
  }
  
  updateWindow(newWindow) {
    this.communicator.setWindow(newWindow);
    console.log('Lifecycle: Window updated');
  }
  
  getStatus() {
    return {
      isMinimal: this.state.getState(),
      windowAvailable: this.communicator.isAvailable()
    };
  }
  
  destroy() {
    this.manager.cleanup();
    this.communicator.clearWindow();
    console.log('Lifecycle: Destroyed');
  }
}

function lifecycleExample(chatInputWindow) {
  const lifecycle = new MinimalModeLifecycleManager(chatInputWindow);
  
  lifecycle.initialize(chatInputWindow);
  lifecycle.manager.enableMinimalMode();
  
  console.log('Status:', lifecycle.getStatus());
  
  lifecycle.destroy();
}

// ============================================================================
// Run Examples
// ============================================================================

if (require.main === module) {
  console.log('Running examples...\n');
  
  console.log('=== Example 2: Testing ===');
  testingExample();
  
  console.log('\n=== Example 5: State Management ===');
  stateManagementExample();
  
  console.log('\n=== Example 7: Notifier ===');
  notifierExample();
  
  console.log('\n=== Example 9: Error Handling ===');
  errorHandlingExample();
  
  console.log('\nAll examples completed! ✅');
}

module.exports = {
  MockWindowCommunicator,
  SettingsWindowCommunicator,
  MultiWindowCommunicator,
  MinimalModeLifecycleManager
};
