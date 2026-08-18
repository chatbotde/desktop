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
  /**
   * While DevTools is open we must keep the window capturing mouse events,
   * otherwise clicks pass straight through and DevTools (when docked inside
   * this window) becomes impossible to interact with. We remember the
   * renderer's last requested state so we can restore it on close.
   */
  private devToolsOpen: boolean = false;
  private lastRequestedIgnore: boolean = true;
  private lastRequestedOptions: IgnoreMouseEventsOptions = { forward: true };

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

    // Remember what the renderer wanted so we can restore it once DevTools closes.
    this.lastRequestedIgnore = ignore;
    this.lastRequestedOptions = options ?? { forward: true };

    // While DevTools is open, force the window to capture clicks so DevTools
    // (and the app UI) stay interactive. Ignore renderer hover requests.
    if (this.devToolsOpen) {
      console.log('[ClickThrough] Request ignored — DevTools open, keeping window interactive');
      this.window.setIgnoreMouseEvents(false);
      return;
    }

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
   * Toggle DevTools-open state. When open, the window is forced to capture
   * mouse events (click-through disabled) so DevTools can be used. When it
   * closes, the renderer's last requested click-through state is restored.
   * @param open - Whether DevTools is currently open.
   */
  setDevToolsOpen(open: boolean): void {
    if (!this.window || this.window.isDestroyed()) return;

    this.devToolsOpen = open;

    if (open) {
      console.log('[ClickThrough] DevTools opened — disabling click-through');
      this.window.setIgnoreMouseEvents(false);
    } else {
      console.log('[ClickThrough] DevTools closed — restoring click-through');
      this.setIgnoreMouseEvents(this.lastRequestedIgnore, this.lastRequestedOptions);
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
