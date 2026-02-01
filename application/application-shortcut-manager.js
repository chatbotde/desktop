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
   */
  constructor(shortcutRegistry, toggleInterfaceWindow) {
    this.shortcutRegistry = shortcutRegistry;
    this.toggleInterfaceWindow = toggleInterfaceWindow;
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
  }

  /**
   * Unregister all shortcuts
   */
  unregisterAll() {
    this.shortcutRegistry.unregisterAll();
  }
}

module.exports = { ApplicationShortcutManager };

