/**
 * Application Window Manager
 * Manages window creation, toggling, and lifecycle
 * 
 * Single Responsibility: Window management operations
 */

const { InterfaceWindow } = require('../interface-window/dist/interface-window');

class ApplicationWindowManager {
  /**
   * @param {GlobalShortcutRegistry} shortcutRegistry
   */
  constructor(shortcutRegistry) {
    this.shortcutRegistry = shortcutRegistry;
    this.interfaceWindow = null;
  }

  /**
   * Create interface window
   */
  createInterfaceWindow() {
    if (!this.interfaceWindow) {
      this.interfaceWindow = new InterfaceWindow(this.shortcutRegistry);
      this.interfaceWindow.create();
    }
    return this.interfaceWindow;
  }

  /**
   * Toggle interface window visibility
   */
  toggleInterfaceWindow() {
    console.log('Application: Toggle interface window requested');
    
    // Check if application is locked
    if (this.interfaceWindow && this.interfaceWindow.isLocked && this.interfaceWindow.isLocked()) {
      console.log('Application: Cannot toggle - application is locked');
      return;
    }
    
    if (this.interfaceWindow) {
      this.interfaceWindow.toggle();
    } else {
      this.interfaceWindow = new InterfaceWindow(this.shortcutRegistry);
      this.interfaceWindow.create();
    }
  }

  /**
   * Get interface window instance
   * @returns {InterfaceWindow|null}
   */
  getInterfaceWindow() {
    return this.interfaceWindow;
  }

  /**
   * Send message to interface window
   * @param {string} channel - IPC channel name
   * @param {any} data - Data to send
   */
  sendToInterfaceWindow(channel, data) {
    if (this.interfaceWindow?.window) {
      this.interfaceWindow.window.webContents.send(channel, data);
    }
  }
}

module.exports = { ApplicationWindowManager };

