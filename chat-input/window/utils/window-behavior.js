/**
 * Window behavior management for chat input window
 */
class WindowBehavior {
  constructor(chatInputWindow) {
    this.chatInputWindow = chatInputWindow;
    this.alwaysOnTopInterval = null;
  }

  /**
   * Setup comprehensive chat input window behavior
   */
  setupBehavior() {
    if (!this.chatInputWindow) return;

    // Handle window ready
    this.chatInputWindow.once("ready-to-show", () => {
      this.chatInputWindow.show();
      this.chatInputWindow.focus();
    });

    // Handle window close
    this.chatInputWindow.on("closed", () => {
      this.cleanup();
    });

    // Set the window to always stay on top with highest priority
    this.chatInputWindow.setAlwaysOnTop(true, "screen-saver", 3);

    // Platform-specific configurations for maximum always-on-top behavior
    this.configurePlatformSpecificBehavior();

    // Setup event listeners for maintaining behavior
    this.setupEventListeners();

    // Setup periodic maintenance
    this.setupPeriodicMaintenance();
  }

  /**
   * Configure platform-specific behavior for always-on-top
   */
  configurePlatformSpecificBehavior() {
    if (!this.chatInputWindow) return;

    if (process.platform === "win32") {
      // Windows: Stay above taskbar and system menus with maximum priority
      this.chatInputWindow.setAlwaysOnTop(true, "pop-up-menu", 2);
      this.chatInputWindow.setAlwaysOnTop(true, "floating", 2);

      // Force the window to stay above all other windows including taskbar
      setTimeout(() => {
        this.chatInputWindow.setAlwaysOnTop(false);
        this.chatInputWindow.setAlwaysOnTop(true, "screen-saver", 2);
      }, 100);
    } else if (process.platform === "darwin") {
      // macOS: Stay above dock and mission control
      this.chatInputWindow.setAlwaysOnTop(true, "floating", 2);
      this.chatInputWindow.setAlwaysOnTop(true, "pop-up-menu", 2);
    } else if (process.platform === "linux") {
      // Linux: Stay above panels and system elements
      this.chatInputWindow.setAlwaysOnTop(true, "pop-up-menu", 2);
      this.chatInputWindow.setAlwaysOnTop(true, "modal-panel", 2);
      this.chatInputWindow.setAlwaysOnTop(true, "floating", 2);
    }
  }

  /**
   * Setup event listeners for maintaining window behavior
   */
  setupEventListeners() {
    if (!this.chatInputWindow) return;

    // Add event listener to maintain always-on-top behavior
    this.chatInputWindow.on("focus", () => {
      if (process.platform === "win32") {
        this.chatInputWindow.setAlwaysOnTop(true, "screen-saver", 2);
      }
      // Ensure input is focused when window gains focus
      this.chatInputWindow.webContents.send("focus-input");
    });

    // Add event listener for when other windows might affect our position
    this.chatInputWindow.on("blur", () => {
      setTimeout(() => {
        if (this.chatInputWindow && !this.chatInputWindow.isDestroyed()) {
          if (process.platform === "win32") {
            this.chatInputWindow.setAlwaysOnTop(true, "screen-saver", 2);
          } else {
            this.chatInputWindow.setAlwaysOnTop(true, "floating", 2);
          }
        }
      }, 50);
    });
  }

  /**
   * Setup periodic maintenance for window behavior
   */
  setupPeriodicMaintenance() {
    if (!this.chatInputWindow) return;

    // Periodic check to ensure window stays above taskbar
    const maintainAlwaysOnTop = () => {
      if (
        this.chatInputWindow &&
        !this.chatInputWindow.isDestroyed() &&
        this.chatInputWindow.isVisible()
      ) {
        if (process.platform === "win32") {
          this.chatInputWindow.setAlwaysOnTop(true, "screen-saver", 2);
        } else {
          this.chatInputWindow.setAlwaysOnTop(true, "floating", 2);
        }
      }
    };

    // Check every 2 seconds to maintain position above taskbar
    this.alwaysOnTopInterval = setInterval(maintainAlwaysOnTop, 2000);

    // Clean up interval when window is destroyed
    this.chatInputWindow.on("closed", () => {
      this.cleanup();
    });
  }

  /**
   * Force window above taskbar
   */
  forceWindowAboveTaskbar() {
    if (this.chatInputWindow && !this.chatInputWindow.isDestroyed()) {
      // Force the window above taskbar with multiple attempts
      this.chatInputWindow.setAlwaysOnTop(false);
      setTimeout(() => {
        if (process.platform === "win32") {
          this.chatInputWindow.setAlwaysOnTop(true, "screen-saver", 2);
          this.chatInputWindow.setAlwaysOnTop(true, "floating", 2);
        } else {
          this.chatInputWindow.setAlwaysOnTop(true, "floating", 2);
        }
        // Bring to front
        this.chatInputWindow.showInactive();
        this.chatInputWindow.focus();
      }, 50);
    }
  }

  /**
   * Cleanup behavior resources
   */
  cleanup() {
    if (this.alwaysOnTopInterval) {
      clearInterval(this.alwaysOnTopInterval);
      this.alwaysOnTopInterval = null;
    }
  }

  /**
   * Get the interval reference (for external cleanup)
   */
  getInterval() {
    return this.alwaysOnTopInterval;
  }
}

module.exports = { WindowBehavior };