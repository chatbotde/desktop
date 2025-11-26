/**
 * Minimal Mode Manager
 * 
 * Handles the "minimal mode" feature where Ctrl+M hides all UI elements
 * except the persistent toggle (transparent strip on the right side).
 * 
 * The user can:
 * 1. Press Ctrl+M to toggle minimal mode
 * 2. Click the persistent toggle to restore the UI
 * 
 * This creates a distraction-free experience while keeping
 * quick access available.
 */

const { ipcMain } = require('electron');

class MinimalModeManager {
  constructor() {
    this.isMinimalMode = false;
    this.chatInputWindow = null;
    this.ipcHandlersRegistered = false;
  }

  /**
   * Initialize the minimal mode manager with the chat input window
   * @param {ChatInputWindow} chatInputWindow - The chat input window instance
   */
  initialize(chatInputWindow) {
    this.chatInputWindow = chatInputWindow;
    this.registerIpcHandlers();
    console.log('MinimalModeManager: Initialized');
  }

  /**
   * Register IPC handlers for minimal mode control
   */
  registerIpcHandlers() {
    if (this.ipcHandlersRegistered) {
      return;
    }

    // Handle toggle minimal mode request from renderer
    ipcMain.on('minimal-mode-toggle', () => {
      console.log('MinimalModeManager: Toggle minimal mode requested');
      this.toggleMinimalMode();
    });

    // Handle enable minimal mode request
    ipcMain.on('minimal-mode-enable', () => {
      console.log('MinimalModeManager: Enable minimal mode requested');
      this.enableMinimalMode();
    });

    // Handle disable minimal mode request
    ipcMain.on('minimal-mode-disable', () => {
      console.log('MinimalModeManager: Disable minimal mode requested');
      this.disableMinimalMode();
    });

    // Handle get minimal mode status request
    ipcMain.handle('minimal-mode-get-status', () => {
      return this.isMinimalMode;
    });

    this.ipcHandlersRegistered = true;
    console.log('MinimalModeManager: IPC handlers registered');
  }

  /**
   * Toggle minimal mode on/off
   */
  toggleMinimalMode() {
    if (this.isMinimalMode) {
      this.disableMinimalMode();
    } else {
      this.enableMinimalMode();
    }
  }

  /**
   * Enable minimal mode - hide main UI, keep only persistent toggle
   */
  enableMinimalMode() {
    if (this.isMinimalMode) {
      console.log('MinimalModeManager: Already in minimal mode');
      return;
    }

    this.isMinimalMode = true;

    // Send message to renderer to update UI
    if (this.chatInputWindow && this.chatInputWindow.getChatInputWindow()) {
      const window = this.chatInputWindow.getChatInputWindow();
      if (!window.isDestroyed()) {
        window.webContents.send('minimal-mode-changed', true);
        console.log('MinimalModeManager: Minimal mode enabled');
      }
    }
  }

  /**
   * Disable minimal mode - show all UI elements
   */
  disableMinimalMode() {
    if (!this.isMinimalMode) {
      console.log('MinimalModeManager: Already in full mode');
      return;
    }

    this.isMinimalMode = false;

    // Send message to renderer to update UI
    if (this.chatInputWindow && this.chatInputWindow.getChatInputWindow()) {
      const window = this.chatInputWindow.getChatInputWindow();
      if (!window.isDestroyed()) {
        window.webContents.send('minimal-mode-changed', false);
        console.log('MinimalModeManager: Minimal mode disabled');
      }
    }
  }

  /**
   * Get current minimal mode status
   * @returns {boolean} True if in minimal mode
   */
  getStatus() {
    return this.isMinimalMode;
  }

  /**
   * Update chat input window reference
   * @param {ChatInputWindow} chatInputWindow - The chat input window instance
   */
  setChatInputWindow(chatInputWindow) {
    this.chatInputWindow = chatInputWindow;
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.chatInputWindow = null;
    this.isMinimalMode = false;
    console.log('MinimalModeManager: Cleaned up');
  }
}

// Singleton instance
const minimalModeManager = new MinimalModeManager();

module.exports = { MinimalModeManager: minimalModeManager };
