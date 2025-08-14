/**
 * Main window module entry point
 * Exports all window-related functionality
 */

const { WindowManager } = require("./window-manager");
const { ShortcutManager } = require("./shortcut-manager");
const { setupWindowBehavior, forceWindowAboveTaskbar } = require("./window-behavior");
const { applyWindowStyling, applyStyling, updateWindowOpacity } = require("./window-styling");
const { registerIpcHandlers } = require("./ipc-handlers");

module.exports = {
  // Main classes
  WindowManager,
  ShortcutManager,
  
  // Behavior functions
  setupWindowBehavior,
  forceWindowAboveTaskbar,
  
  // Styling functions
  applyWindowStyling,
  applyStyling,
  updateWindowOpacity,
  
  // IPC functions
  registerIpcHandlers
};
