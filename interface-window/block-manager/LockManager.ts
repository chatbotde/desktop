/**
 * Lock Manager
 * Listens to BlockManager events and hides/shows InterfaceWindow based on lock state
 */

import { EventEmitter } from 'events';
import { BlockManager, BlockStatus } from './BlockManager';
import { ActiveWindowMonitor } from './ActiveWindowMonitor';
import { SecurityManager } from './SecurityManager';
import { setupIpcSecurityMiddleware } from './ipc-security-middleware';

export class LockManager extends EventEmitter {
  private blockManager: BlockManager;
  private activeWindowMonitor: ActiveWindowMonitor;
  private interfaceWindow: any; // InterfaceWindow instance
  private securityManager: SecurityManager;
  private isLocked: boolean = false;
  private wasVisibleBeforeLock: boolean = false;

  constructor(
    blockManager: BlockManager,
    activeWindowMonitor: ActiveWindowMonitor,
    interfaceWindow: any,
    globalShortcutRegistry?: any
  ) {
    super();
    this.blockManager = blockManager;
    this.activeWindowMonitor = activeWindowMonitor;
    this.interfaceWindow = interfaceWindow;
    this.securityManager = new SecurityManager(globalShortcutRegistry);

    this.setupEventListeners();
    
    // Setup IPC security middleware
    setupIpcSecurityMiddleware(this.securityManager);
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Listen to lock status changes from BlockManager
    this.blockManager.on('lock-status-changed', (status: BlockStatus) => {
      this.handleLockStatusChange(status);
    });

    // Listen to blocked app active/inactive events
    this.activeWindowMonitor.on('blocked-app-active', () => {
      // Lock status will be updated by BlockManager
    });

    this.activeWindowMonitor.on('blocked-app-inactive', () => {
      // Lock status will be updated by BlockManager
    });

    // Listen to lock enabled changes
    this.blockManager.on('lock-enabled-changed', (enabled: boolean) => {
      if (!enabled && this.isLocked) {
        // If lock is disabled, unlock immediately
        this.unlock();
      } else if (enabled) {
        // If lock is enabled, check current status
        this.checkAndUpdateLock();
      }
    });
  }

  /**
   * Handle lock status change
   */
  private handleLockStatusChange(status: BlockStatus): void {
    if (status.isLocked && !this.isLocked) {
      this.lock(status);
    } else if (!status.isLocked && this.isLocked) {
      this.unlock();
    }
  }

  /**
   * Lock the window (hide it) and enable security
   */
  private lock(status: BlockStatus): void {
    if (!this.interfaceWindow || !this.interfaceWindow.window) {
      return;
    }

    // Remember if window was visible before locking
    this.wasVisibleBeforeLock = this.interfaceWindow.isVisible();

    // Hide the window
    this.interfaceWindow.hide();
    this.isLocked = true;

    // Enable security measures
    this.securityManager.lock();

    // Make window completely non-interactive
    if (this.interfaceWindow.window) {
      // Ignore all mouse events (clicks pass through)
      this.interfaceWindow.window.setIgnoreMouseEvents(true, { forward: false });
      // Prevent window from receiving focus
      this.interfaceWindow.window.setFocusable(false);
      // Prevent window from being shown via any method
      // Override show method temporarily
      const originalShow = this.interfaceWindow.window.show.bind(this.interfaceWindow.window);
      (this.interfaceWindow.window as any)._originalShow = originalShow;
      (this.interfaceWindow.window as any).show = () => {
        console.log('LockManager: Blocked window.show() - application is locked');
        // Don't show the window
      };
    }

    console.log('LockManager: Window locked (hidden) - Blocked:', status.blockedApp);
    this.emit('locked', status);
  }

  /**
   * Unlock the window (show it if it was visible before) and disable security
   */
  private unlock(): void {
    if (!this.interfaceWindow || !this.interfaceWindow.window) {
      return;
    }

    this.isLocked = false;

    // Disable security measures
    this.securityManager.unlock();

    // Make window interactive again
    if (this.interfaceWindow.window) {
      // Restore original show method
      if ((this.interfaceWindow.window as any)._originalShow) {
        this.interfaceWindow.window.show = (this.interfaceWindow.window as any)._originalShow;
        delete (this.interfaceWindow.window as any)._originalShow;
      }
      // Re-enable mouse events and focus
      this.interfaceWindow.window.setIgnoreMouseEvents(false);
      this.interfaceWindow.window.setFocusable(true);
    }

    // Show window if it was visible before lock
    if (this.wasVisibleBeforeLock) {
      this.interfaceWindow.show();
      console.log('LockManager: Window unlocked (shown)');
    } else {
      console.log('LockManager: Window unlocked (was not visible before lock)');
    }

    this.wasVisibleBeforeLock = false;
    this.emit('unlocked');
  }

  /**
   * Check current lock status and update if needed
   */
  private checkAndUpdateLock(): void {
    const status = this.blockManager.getLockStatus();
    this.handleLockStatusChange(status);
  }

  /**
   * Get current lock state
   */
  getLockState(): boolean {
    return this.isLocked;
  }

  /**
   * Start monitoring (delegates to monitors)
   */
  start(): void {
    this.activeWindowMonitor.start();
    console.log('LockManager: Started monitoring');
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    this.activeWindowMonitor.stop();
    console.log('LockManager: Stopped monitoring');
  }

  /**
   * Prevent window from showing when locked
   * This should be called before showing the window
   */
  canShow(): boolean {
    if (this.isLocked) {
      return false;
    }
    return true;
  }

  /**
   * Get security manager instance
   */
  getSecurityManager(): SecurityManager {
    return this.securityManager;
  }
}


