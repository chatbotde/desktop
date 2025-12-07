const { ipcMain } = require('electron');

class ClickThroughManager {
  constructor(window) {
    this.window = window;
  }

  setup() {
    if (!this.window) return;

    // Enable content protection to prevent screen capture
    this.window.setContentProtection(false);

    // Initial state: Click-through enabled (transparent parts are clickable-through)
    // forward: true allows the renderer to see the mouse to detect hover
    this.setIgnoreMouseEvents(true);

    // Remove existing listeners to prevent duplicates
    ipcMain.removeAllListeners('interface-window:set-ignore-mouse-events');

    // Listen for hover state changes from the frontend
    ipcMain.on('interface-window:set-ignore-mouse-events', (event, ignore) => {
      // Verify the sender is our window
      if (this.window && !this.window.isDestroyed() && event.sender.id === this.window.webContents.id) {
        this.setIgnoreMouseEvents(ignore);
      }
    });
  }

  /**
   * Set the ignore mouse events state
   * @param {boolean} ignore - If true, clicks pass through the window. If false, window captures clicks.
   */
  setIgnoreMouseEvents(ignore) {
    if (!this.window || this.window.isDestroyed()) return;

    if (ignore) {
      // Enable click-through: Mouse events are passed to OS, but forwarded to renderer for hover detection
      // 'forward: true' is crucial here. It lets the browser still receive 'mousemove' / 'mouseenter'
      // events even when the window is transparent to clicks.
      this.window.setIgnoreMouseEvents(true, { forward: true });
    } else {
      // Disable click-through: Window captures all mouse events (for UI interaction)
      this.window.setIgnoreMouseEvents(false);
    }
  }
}

module.exports = { ClickThroughManager };
