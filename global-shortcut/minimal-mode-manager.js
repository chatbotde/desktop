/**
 * Minimal Mode Manager
 * 
 * Handles the "minimal mode" feature where Ctrl+M hides all UI elements
 * except the persistent toggle (transparent strip on the right side).
 * 
 * SOLID Principles Applied:
 * - Single Responsibility: Coordinates minimal mode functionality only
 * - Open/Closed: Extensible through dependency injection
 * - Liskov Substitution: Uses IWindowCommunicator abstraction
 * - Interface Segregation: Focused interfaces for each component
 * - Dependency Inversion: Depends on abstractions, not concrete classes
 */

const { MinimalModeState } = require('./minimal-mode-state');
const { MinimalModeIpcRegistry } = require('./minimal-mode-ipc-registry');
const { MinimalModeNotifier } = require('./minimal-mode-notifier');
const { ChatInputWindowCommunicator } = require('./chat-input-window-communicator');

class MinimalModeManager {
  /**
   * @param {MinimalModeState} state - State manager (optional for testing)
   * @param {MinimalModeIpcRegistry} ipcRegistry - IPC registry (optional for testing)
   * @param {IWindowCommunicator} windowCommunicator - Window communicator (optional for testing)
   */
  constructor(state = null, ipcRegistry = null, windowCommunicator = null) {
    // Use dependency injection (DIP) - allows testing with mocks
    this.state = state || new MinimalModeState();
    this.ipcRegistry = ipcRegistry || new MinimalModeIpcRegistry();
    this.windowCommunicator = windowCommunicator || new ChatInputWindowCommunicator();
    this.notifier = new MinimalModeNotifier(this.windowCommunicator);
  }

  /**
   * Initialize the minimal mode manager with the chat input window
   * @param {Object} chatInputWindow - The chat input window instance
   */
  initialize(chatInputWindow) {
    // Update window communicator
    this.windowCommunicator.setWindow(chatInputWindow);
    
    // Register IPC handlers with callbacks
    this.ipcRegistry.registerHandlers({
      onToggle: () => this.toggleMinimalMode(),
      onEnable: () => this.enableMinimalMode(),
      onDisable: () => this.disableMinimalMode(),
      onGetStatus: () => this.getStatus()
    });
    
    console.log('MinimalModeManager: Initialized');
  }

  /**
   * Toggle minimal mode on/off
   */
  toggleMinimalMode() {
    const newState = this.state.toggle();
    this.notifier.notifyStateChange(newState);
    console.log(`MinimalModeManager: Toggled to ${newState ? 'minimal' : 'full'} mode`);
  }

  /**
   * Enable minimal mode - hide main UI, keep only persistent toggle
   */
  enableMinimalMode() {
    const changed = this.state.enable();
    
    if (!changed) {
      console.log('MinimalModeManager: Already in minimal mode');
      return;
    }

    this.notifier.notifyStateChange(true);
    console.log('MinimalModeManager: Minimal mode enabled');
  }

  /**
   * Disable minimal mode - show all UI elements
   */
  disableMinimalMode() {
    const changed = this.state.disable();
    
    if (!changed) {
      console.log('MinimalModeManager: Already in full mode');
      return;
    }

    this.notifier.notifyStateChange(false);
    console.log('MinimalModeManager: Minimal mode disabled');
  }

  /**
   * Get current minimal mode status
   * @returns {boolean} True if in minimal mode
   */
  getStatus() {
    return this.state.getState();
  }

  /**
   * Update chat input window reference
   * @param {Object} chatInputWindow - The chat input window instance
   */
  setChatInputWindow(chatInputWindow) {
    this.windowCommunicator.setWindow(chatInputWindow);
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.windowCommunicator.clearWindow();
    this.ipcRegistry.unregisterHandlers();
    this.state.reset();
    console.log('MinimalModeManager: Cleaned up');
  }
}

// Singleton instance (for backwards compatibility)
const minimalModeManager = new MinimalModeManager();

module.exports = { MinimalModeManager: minimalModeManager };
