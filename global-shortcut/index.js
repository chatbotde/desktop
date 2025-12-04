/**
 * Global Shortcut Module
 * Exports all global shortcut related functionality
 * 
 * Following SOLID principles:
 * - All components are loosely coupled
 * - Each component has a single responsibility
 * - Easy to extend and test
 */

const { MinimalModeManager } = require('./minimal-mode-manager');
const { MinimalModeState } = require('./minimal-mode-state');
const { MinimalModeIpcRegistry } = require('./minimal-mode-ipc-registry');
const { MinimalModeNotifier } = require('./minimal-mode-notifier');
const { ChatInputWindowCommunicator } = require('./chat-input-window-communicator');
const { IWindowCommunicator } = require('./window-communicator');

// Export main manager (primary interface)
module.exports = {
  MinimalModeManager,
  // Export components for advanced use cases and testing
  MinimalModeState,
  MinimalModeIpcRegistry,
  MinimalModeNotifier,
  ChatInputWindowCommunicator,
  IWindowCommunicator
};
