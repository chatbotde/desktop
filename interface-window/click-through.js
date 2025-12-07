const { ipcMain } = require('electron');

class ClickThroughManager {
  constructor(window) {
    this.window = window;
  }

  setup() {
    if (!this.window) return;

    // Enable content protection to prevent screen capture
    this.window.setContentProtection(true);

    // Initial state: Click-through enabled (transparent parts are clickable-through)
    // forward: true allows the renderer to see the mouse to detect hover
    this.setIgnoreMouseEvents(true);

    // Remove existing listeners to prevent duplicates
    ipcMain.removeAllListeners('interface-window:set-ignore-mouse-events');

    // Listen for hover state changes from the frontend
    ipcMain.on('interface-window:set-ignore-mouse-events', (event, ignore, options) => {
      // Verify the sender is our window
      if (this.window && !this.window.isDestroyed() && event.sender.id === this.window.webContents.id) {
        this.setIgnoreMouseEvents(ignore, options);
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
      this.window.setIgnoreMouseEvents(true, effectiveOptions);
    } else {
      // Disable click-through: Window captures all mouse events (for UI interaction)
      this.window.setIgnoreMouseEvents(false);
    }
  }
}

module.exports = { ClickThroughManager };
