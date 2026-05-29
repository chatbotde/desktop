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
   * Destroy interface window
   */
  destroyInterfaceWindow() {
    if (this.interfaceWindow) {
      // Accessing private window property is not ideal but necessary given the structure
      // or we can add a close/destroy method to InterfaceWindow
      if (this.interfaceWindow.window) {
        this.interfaceWindow.window.destroy();
      }
      this.interfaceWindow = null;
    }
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

  /**
   * Show interface window and trigger assistant connection
   */
  showAndConnectAssistant() {
    console.log('Application: Show and connect assistant requested');

    if (this.interfaceWindow && this.interfaceWindow.isLocked && this.interfaceWindow.isLocked()) {
      console.log('Application: Cannot show assistant - application is locked');
      return;
    }

    if (this.interfaceWindow) {
      this.interfaceWindow.show();
      this.sendToInterfaceWindow('assistant-connect', {});
    } else {
      this.interfaceWindow = new InterfaceWindow(this.shortcutRegistry);
      this.interfaceWindow.create();
      this.interfaceWindow.show();
      setTimeout(() => {
        this.sendToInterfaceWindow('assistant-connect', {});
      }, 1000);
    }
  }

  /**
   * Show interface window and open the prompt input (same effect as clicking the right edge strip).
   */
  showPromptInput() {
    console.log('Application: Show prompt input requested');

    if (this.interfaceWindow && this.interfaceWindow.isLocked && this.interfaceWindow.isLocked()) {
      console.log('Application: Cannot show prompt input - application is locked');
      return;
    }

    if (this.interfaceWindow) {
      this.interfaceWindow.show();
      this.sendToInterfaceWindow('show-prompt-input', {});
    } else {
      this.interfaceWindow = new InterfaceWindow(this.shortcutRegistry);
      this.interfaceWindow.create();
      this.interfaceWindow.show();
      setTimeout(() => {
        this.sendToInterfaceWindow('show-prompt-input', {});
      }, 1000);
    }
  }

  /**
   * Show interface window and toggle the voice insert transcript overlay.
   */
  toggleVoiceInsert() {
    console.log('Application: Toggle voice insert requested');

    if (this.interfaceWindow && this.interfaceWindow.isLocked && this.interfaceWindow.isLocked()) {
      console.log('Application: Cannot toggle voice insert - application is locked');
      return;
    }

    if (this.interfaceWindow) {
      this.interfaceWindow.show();
      this.sendToInterfaceWindow('toggle-voice-insert', {});
    } else {
      this.interfaceWindow = new InterfaceWindow(this.shortcutRegistry);
      this.interfaceWindow.create();
      this.interfaceWindow.show();
      setTimeout(() => {
        this.sendToInterfaceWindow('toggle-voice-insert', {});
      }, 1000);
    }
  }

  /**
   * Show interface window and open the rectangle screenshot overlay.
   */
  showRectangleScreenshot() {
    console.log('Application: Show rectangle screenshot requested');

    if (this.interfaceWindow && this.interfaceWindow.isLocked && this.interfaceWindow.isLocked()) {
      console.log('Application: Cannot show rectangle screenshot - application is locked');
      return;
    }

    if (this.interfaceWindow) {
      this.interfaceWindow.show();
      this.sendToInterfaceWindow('show-rectangle-screenshot', {});
    } else {
      this.interfaceWindow = new InterfaceWindow(this.shortcutRegistry);
      this.interfaceWindow.create();
      this.interfaceWindow.show();
      setTimeout(() => {
        this.sendToInterfaceWindow('show-rectangle-screenshot', {});
      }, 1000);
    }
  }
}

module.exports = { ApplicationWindowManager };

