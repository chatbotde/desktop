/**
 * Security Manager
 * Provides security measures when the application is locked
 * - Disables global shortcuts
 * - Blocks IPC requests
 * - Prevents window interactions
 */

import { EventEmitter } from 'events';

export class SecurityManager extends EventEmitter {
  private isLocked: boolean = false;
  private globalShortcutRegistry: any = null;
  private originalShortcuts: Map<string, any> = new Map();
  private ipcBlockedChannels: Set<string> = new Set();

  constructor(globalShortcutRegistry?: any) {
    super();
    this.globalShortcutRegistry = globalShortcutRegistry;
  }

  /**
   * Lock the application - enable all security measures
   */
  lock(): void {
    if (this.isLocked) {
      return;
    }

    this.isLocked = true;
    this.disableGlobalShortcuts();
    this.emit('locked');
    console.log('SecurityManager: Application locked - all interactions disabled');
  }

  /**
   * Unlock the application - disable security measures
   */
  unlock(): void {
    if (!this.isLocked) {
      return;
    }

    this.isLocked = false;
    this.enableGlobalShortcuts();
    this.emit('unlocked');
    console.log('SecurityManager: Application unlocked - interactions enabled');
  }

  /**
   * Check if application is locked
   */
  isApplicationLocked(): boolean {
    return this.isLocked;
  }

  /**
   * Check if an IPC request should be blocked
   */
  shouldBlockIpcRequest(channel: string): boolean {
    if (!this.isLocked) {
      return false;
    }

    // Always allow block management IPC (to unlock and manage settings)
    if (channel.startsWith('block:')) {
      return false;
    }

    // Block all other IPC requests when locked
    // This includes:
    // - All electronAPI calls (app:, clipboard:, etc.)
    // - Capture API calls
    // - TSF API calls
    // - Any other custom IPC channels
    this.ipcBlockedChannels.add(channel);
    return true;
  }

  /**
   * Disable all global shortcuts
   */
  private disableGlobalShortcuts(): void {
    if (!this.globalShortcutRegistry) {
      return;
    }

    try {
      // Store original shortcuts
      const shortcuts = this.globalShortcutRegistry.getRegisteredShortcuts();
      this.originalShortcuts = new Map(shortcuts);

      // Unregister all shortcuts
      this.globalShortcutRegistry.unregisterAll();
      console.log('SecurityManager: Disabled all global shortcuts');
    } catch (error) {
      console.error('SecurityManager: Error disabling shortcuts:', error);
    }
  }

  /**
   * Re-enable global shortcuts
   */
  private enableGlobalShortcuts(): void {
    if (!this.globalShortcutRegistry || this.originalShortcuts.size === 0) {
      return;
    }

    try {
      // Re-register original shortcuts
      for (const [accelerator, { callback, description }] of this.originalShortcuts) {
        this.globalShortcutRegistry.register(accelerator, callback, description);
      }
      console.log('SecurityManager: Re-enabled global shortcuts');
    } catch (error) {
      console.error('SecurityManager: Error enabling shortcuts:', error);
    }
  }

  /**
   * Get list of blocked IPC channels
   */
  getBlockedChannels(): string[] {
    return Array.from(this.ipcBlockedChannels);
  }
}
