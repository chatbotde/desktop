/**
 * Global Shortcut Registry
 * Handles registration and management of global keyboard shortcuts
 * Follows: Single Responsibility Principle (SRP)
 */

const { globalShortcut } = require('electron');

class GlobalShortcutRegistry {
  constructor() {
    this.registeredShortcuts = new Map();
  }

  /**
   * Register a global shortcut
   * @param {string} accelerator - Shortcut key combination
   * @param {Function} callback - Function to execute
   * @param {string} description - Description of the shortcut
   * @returns {boolean} True if registered successfully
   */
  register(accelerator, callback, description = '') {
    if (this.registeredShortcuts.has(accelerator)) {
      console.warn(`GlobalShortcutRegistry: Shortcut ${accelerator} already registered`);
      return false;
    }

    const success = globalShortcut.register(accelerator, callback);

    if (success) {
      this.registeredShortcuts.set(accelerator, { callback, description });
      console.log(`GlobalShortcutRegistry: Registered ${accelerator}${description ? ` - ${description}` : ''}`);
    } else {
      console.error(`GlobalShortcutRegistry: Failed to register ${accelerator}`);
    }

    return success;
  }

  /**
   * Unregister a global shortcut
   * @param {string} accelerator - Shortcut key combination
   */
  unregister(accelerator) {
    if (this.registeredShortcuts.has(accelerator)) {
      globalShortcut.unregister(accelerator);
      this.registeredShortcuts.delete(accelerator);
      console.log(`GlobalShortcutRegistry: Unregistered ${accelerator}`);
    }
  }

  /**
   * Unregister all shortcuts
   */
  unregisterAll() {
    globalShortcut.unregisterAll();
    this.registeredShortcuts.clear();
    console.log('GlobalShortcutRegistry: Unregistered all shortcuts');
  }

  /**
   * Check if shortcut is registered
   * @param {string} accelerator - Shortcut key combination
   * @returns {boolean} True if registered
   */
  isRegistered(accelerator) {
    return globalShortcut.isRegistered(accelerator);
  }

  /**
   * Get all registered shortcuts
   * @returns {Map} Map of registered shortcuts
   */
  getRegisteredShortcuts() {
    return new Map(this.registeredShortcuts);
  }
}

module.exports = { GlobalShortcutRegistry };
