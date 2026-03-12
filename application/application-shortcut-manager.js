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
   */
  constructor(shortcutRegistry, toggleInterfaceWindow, showAndConnectAssistant = null) {
    this.shortcutRegistry = shortcutRegistry;
    this.toggleInterfaceWindow = toggleInterfaceWindow;
    this.showAndConnectAssistant = showAndConnectAssistant;
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
  }

  /**
   * Unregister all shortcuts
   */
  unregisterAll() {
    this.shortcutRegistry.unregisterAll();
  }
}

module.exports = { ApplicationShortcutManager };

