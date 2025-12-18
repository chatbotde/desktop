/**
 * Click Through Manager
 * Manages click-through behavior and content protection for the interface window
 */

import { ipcMain, BrowserWindow, IpcMainEvent } from 'electron';

interface IgnoreMouseEventsOptions {
  forward?: boolean;
}

export class ClickThroughManager {
  private window: BrowserWindow | null;
  private contentProtectionEnabled: boolean = false;

  constructor(window: BrowserWindow) {
    this.window = window;
  }

  /**
   * Setup click-through and content protection IPC handlers
   */
  setup(): void {
    if (!this.window) return;

    // Initial state: Content protection disabled (window can be captured)
    // This can be toggled via setContentProtection method
    this.contentProtectionEnabled = false;
    this.window.setContentProtection(false);

    // Initial state: Click-through enabled (transparent parts are clickable-through)
    // forward: true allows the renderer to see the mouse to detect hover
    this.setIgnoreMouseEvents(true, { forward: true });

    // Remove existing listeners to prevent duplicates
    ipcMain.removeAllListeners('interface-window:set-ignore-mouse-events');
    ipcMain.removeAllListeners('interface-window:set-content-protection');

    // Listen for hover state changes from the frontend
    ipcMain.on('interface-window:set-ignore-mouse-events', (event: IpcMainEvent, ignore: boolean, options?: IgnoreMouseEventsOptions) => {
      // Verify the sender is our window
      if (this.window && !this.window.isDestroyed() && event.sender.id === this.window.webContents.id) {
        this.setIgnoreMouseEvents(ignore, options);
      }
    });

    // Listen for content protection changes from the frontend
    ipcMain.on('interface-window:set-content-protection', (event: IpcMainEvent, enabled: boolean) => {
      // Verify the sender is our window
      if (this.window && !this.window.isDestroyed() && event.sender.id === this.window.webContents.id) {
        this.setContentProtection(enabled);
      }
    });
  }

  /**
   * Set the ignore mouse events state
   * @param ignore - If true, clicks pass through the window. If false, window captures clicks.
   * @param options - Optional options forwarded to Electron.
   */
  setIgnoreMouseEvents(ignore: boolean, options?: IgnoreMouseEventsOptions): void {
    if (!this.window || this.window.isDestroyed()) return;

    if (ignore) {
      // Enable click-through: Mouse events are passed to OS, but forwarded to renderer for hover detection
      // 'forward: true' is crucial here. It lets the browser still receive 'mousemove' / 'mouseenter'
      // events even when the window is transparent to clicks.
      const forwardFlag = options && typeof options === 'object' && 'forward' in options
        ? !!options.forward
        : true;
      const effectiveOptions: IgnoreMouseEventsOptions = { forward: forwardFlag };
      console.log('[ClickThrough] ENABLED - clicks pass through window', { forward: forwardFlag });
      this.window.setIgnoreMouseEvents(true, effectiveOptions);
    } else {
      // Disable click-through: Window captures all mouse events (for UI interaction)
      console.log('[ClickThrough] DISABLED - window captures clicks');
      this.window.setIgnoreMouseEvents(false);
    }
  }

  /**
   * Set the content protection state
   * @param enabled - If true, window is excluded from screen capture. If false, window can be captured.
   */
  setContentProtection(enabled: boolean): void {
    if (!this.window || this.window.isDestroyed()) return;

    this.contentProtectionEnabled = !!enabled;
    this.window.setContentProtection(enabled);
    console.log(`[ClickThrough] Content protection ${enabled ? 'ENABLED' : 'DISABLED'} - window ${enabled ? 'excluded from' : 'included in'} screen capture`);
  }

  /**
   * Get the current content protection state
   * @returns Current content protection state
   */
  getContentProtection(): boolean {
    return this.contentProtectionEnabled || false;
  }
}

// Export for CommonJS compatibility
module.exports = { ClickThroughManager };
