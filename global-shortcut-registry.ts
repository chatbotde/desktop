/**
 * Global Shortcut Registry
 * Handles registration and management of global keyboard shortcuts
 * Follows: Single Responsibility Principle (SRP)
 */

import { globalShortcut } from 'electron';

interface ShortcutInfo {
  callback: () => void;
  description: string;
}

export class GlobalShortcutRegistry {
  private registeredShortcuts: Map<string, ShortcutInfo>;

  constructor() {
    this.registeredShortcuts = new Map();
  }

  /**
   * Register a global shortcut
   * @param accelerator - Shortcut key combination
   * @param callback - Function to execute
   * @param description - Description of the shortcut
   * @returns True if registered successfully
   */
  register(accelerator: string, callback: () => void, description: string = ''): boolean {
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
   * @param accelerator - Shortcut key combination
   */
  unregister(accelerator: string): void {
    if (this.registeredShortcuts.has(accelerator)) {
      globalShortcut.unregister(accelerator);
      this.registeredShortcuts.delete(accelerator);
      console.log(`GlobalShortcutRegistry: Unregistered ${accelerator}`);
    }
  }

  /**
   * Unregister all shortcuts
   */
  unregisterAll(): void {
    globalShortcut.unregisterAll();
    this.registeredShortcuts.clear();
    console.log('GlobalShortcutRegistry: Unregistered all shortcuts');
  }

  /**
   * Check if shortcut is registered
   * @param accelerator - Shortcut key combination
   * @returns True if registered
   */
  isRegistered(accelerator: string): boolean {
    return globalShortcut.isRegistered(accelerator);
  }

  /**
   * Get all registered shortcuts
   * @returns Map of registered shortcuts
   */
  getRegisteredShortcuts(): Map<string, ShortcutInfo> {
    return new Map(this.registeredShortcuts);
  }
}
