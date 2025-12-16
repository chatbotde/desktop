const { ipcMain } = require('electron');

class ClickThroughManager {
  constructor(window) {
    this.window = window;
  }

  setup() {
    if (!this.window) return;

    // Initial state: Content protection disabled (window can be captured)
    // This can be toggled via setContentProtection method
    this.contentProtectionEnabled = false;
    this.window.setContentProtection(false);

    // Initial state: Click-through enabled (transparent parts are clickable-through)
    // forward: true allows the renderer to see the mouse to detect hover
    this.setIgnoreMouseEvents(true , { forward: true });

    // Remove existing listeners to prevent duplicates
    ipcMain.removeAllListeners('interface-window:set-ignore-mouse-events');
    ipcMain.removeAllListeners('interface-window:set-content-protection');

    // Listen for hover state changes from the frontend
    ipcMain.on('interface-window:set-ignore-mouse-events', (event, ignore, options) => {
      // Verify the sender is our window
      if (this.window && !this.window.isDestroyed() && event.sender.id === this.window.webContents.id) {
        this.setIgnoreMouseEvents(ignore, options);
      }
    });

    // Listen for content protection changes from the frontend
    ipcMain.on('interface-window:set-content-protection', (event, enabled) => {
      // Verify the sender is our window
      if (this.window && !this.window.isDestroyed() && event.sender.id === this.window.webContents.id) {
        this.setContentProtection(enabled);
      }
    });
  }

  /**
   * Set the ignore mouse events state
   * @param {boolean} ignore - If true, clicks pass through the window. If false, window captures clicks.
   * @param {{ forward?: boolean }} [options] - Optional options forwarded to Electron.
   */
  setIgnoreMouseEvents(ignore, options) {
    if (!this.window || this.window.isDestroyed()) return;

    if (ignore) {
      // Enable click-through: Mouse events are passed to OS, but forwarded to renderer for hover detection
      // 'forward: true' is crucial here. It lets the browser still receive 'mousemove' / 'mouseenter'
      // events even when the window is transparent to clicks.
      const forwardFlag = options && typeof options === 'object' && 'forward' in options
        ? !!options.forward
        : true;
      const effectiveOptions = { forward: forwardFlag };
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
   * @param {boolean} enabled - If true, window is excluded from screen capture. If false, window can be captured.
   */
  setContentProtection(enabled) {
    if (!this.window || this.window.isDestroyed()) return;

    this.contentProtectionEnabled = !!enabled;
    this.window.setContentProtection(enabled);
    console.log(`[ClickThrough] Content protection ${enabled ? 'ENABLED' : 'DISABLED'} - window ${enabled ? 'excluded from' : 'included in'} screen capture`);
  }

  /**
   * Get the current content protection state
   * @returns {boolean} Current content protection state
   */
  getContentProtection() {
    return this.contentProtectionEnabled || false;
  }
}

module.exports = { ClickThroughManager };
