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
   */
  constructor(shortcutRegistry, toggleInterfaceWindow, showAndConnectAssistant = null, showPromptInput = null) {
    this.shortcutRegistry = shortcutRegistry;
    this.toggleInterfaceWindow = toggleInterfaceWindow;
    this.showAndConnectAssistant = showAndConnectAssistant;
    this.showPromptInput = showPromptInput;
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
  }

  /**
   * Unregister all shortcuts
   */
  unregisterAll() {
    this.shortcutRegistry.unregisterAll();
  }
}

module.exports = { ApplicationShortcutManager };

