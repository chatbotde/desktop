/**
 * Application Shortcut Manager
 * Registers and manages global keyboard shortcuts
 * 
 * Single Responsibility: Global shortcut registration
 */

class ApplicationShortcutManager {
  /**
   * @param {GlobalShortcutRegistry} shortcutRegistry
   * @param {Function} toggleInterfaceWindow - Callback to toggle interface window
   * @param {Function} showAndConnectAssistant - Callback to show window and connect assistant
   * @param {Function} showPromptInput - Callback to show window and open prompt input
   * @param {Function} toggleVoiceInsert - Callback to show window and toggle voice insert
   * @param {Function} showRectangleScreenshot - Callback to show window and open rectangle screenshot overlay
   * @param {Function} showAssignPin - Callback to show insert-pin assign overlay
   */
  constructor(shortcutRegistry, toggleInterfaceWindow, showAndConnectAssistant = null, showPromptInput = null, toggleVoiceInsert = null, showRectangleScreenshot = null, showAssignPin = null) {
    this.shortcutRegistry = shortcutRegistry;
    this.toggleInterfaceWindow = toggleInterfaceWindow;
    this.showAndConnectAssistant = showAndConnectAssistant;
    this.showPromptInput = showPromptInput;
    this.toggleVoiceInsert = toggleVoiceInsert;
    this.showRectangleScreenshot = showRectangleScreenshot;
    this.showAssignPin = showAssignPin;
  }

  /**
   * Register all global shortcuts
   */
  register() {
    // Ctrl+I - Toggle interface window
    this.shortcutRegistry.register(
      'CommandOrControl+I',
      () => this.toggleInterfaceWindow(),
      'Toggle interface window'
    );

    // Ctrl+H - Quit application
    this.shortcutRegistry.register(
      'CommandOrControl+H',
      () => {
        const { app } = require('electron');
        console.log('Shortcut: Ctrl+H pressed - Quitting app');
        app.exit(0);
      },
      'Quit application'
    );

    // Ctrl+\ - Show assistant sphere and connect
    if (this.showAndConnectAssistant) {
      console.log('ApplicationShortcutManager: Registering Ctrl+\\ shortcut');
      const accelerator = process.platform === 'darwin' ? 'Command+\\' : 'Control+\\';
      this.shortcutRegistry.register(
        accelerator,
        () => {
          console.log('Shortcut: Ctrl+\\ pressed - Showing and connecting assistant');
          this.showAndConnectAssistant();
        },
        'Show and connect assistant'
      );
    } else {
      console.log('ApplicationShortcutManager: showAndConnectAssistant is null, not registering Ctrl+\\');
    }

    // Ctrl+K / Cmd+K - Show prompt input (same as clicking the right transparent strip)
    if (this.showPromptInput) {
      console.log('ApplicationShortcutManager: Registering Ctrl+K shortcut');
      this.shortcutRegistry.register(
        'CommandOrControl+K',
        () => {
          console.log('Shortcut: Ctrl+K pressed - Showing prompt input');
          this.showPromptInput();
        },
        'Open prompt input'
      );
    } else {
      console.log('ApplicationShortcutManager: showPromptInput is null, not registering Ctrl+K');
    }

    // Ctrl+M / Cmd+M - Toggle voice insert transcript overlay
    if (this.toggleVoiceInsert) {
      console.log('ApplicationShortcutManager: Registering Ctrl+M shortcut');
      this.shortcutRegistry.register(
        'CommandOrControl+M',
        () => {
          console.log('Shortcut: Ctrl+M pressed - Toggling voice insert');
          this.toggleVoiceInsert();
        },
        'Toggle voice insert'
      );
    } else {
      console.log('ApplicationShortcutManager: toggleVoiceInsert is null, not registering Ctrl+M');
    }

    // Ctrl+Shift+g / Cmd+Shift+g - Rectangle screenshot (drag to select area)
    if (this.showRectangleScreenshot) {
      console.log('ApplicationShortcutManager: Registering Ctrl+Shift+g shortcut');
      this.shortcutRegistry.register(
        'CommandOrControl+Shift+g',
        () => {
          console.log('Shortcut: Ctrl+Shift+g pressed - Starting rectangle screenshot');
          this.showRectangleScreenshot();
        },
        'Rectangle screenshot'
      );
    } else {
      console.log('ApplicationShortcutManager: showRectangleScreenshot is null, not registering Ctrl+Shift+S');
    }

    // Ctrl+Shift+P - Assign insert pin to current/last focused app (small overlay)
    if (this.showAssignPin) {
      console.log('ApplicationShortcutManager: Registering Ctrl+Shift+P shortcut');
      this.shortcutRegistry.register(
        'CommandOrControl+Shift+P',
        () => {
          console.log('Shortcut: Ctrl+Shift+P pressed - Assign insert pin');
          this.showAssignPin();
        },
        'Assign insert pin'
      );
    } else {
      console.log('ApplicationShortcutManager: showAssignPin is null, not registering Ctrl+Shift+P');
    }
  }

  /**
   * Unregister all shortcuts
   */
  unregisterAll() {
    this.shortcutRegistry.unregisterAll();
  }
}

module.exports = { ApplicationShortcutManager };

