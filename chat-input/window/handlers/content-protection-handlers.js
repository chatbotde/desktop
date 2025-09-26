const { BrowserWindow, ipcMain } = require("electron");

/**
 * Content protection IPC handlers
 */
class ContentProtectionHandlers {
  static registerHandlers() {
    // Handle content protection toggle
    ipcMain.handle("chat-input-toggle-content-protection", async () => {
      const allWindows = BrowserWindow.getAllWindows();
      const chatInputWindow = allWindows.find((win) => {
        if (win.isDestroyed()) return false;
        try {
          return win.webContents.getURL().includes("chat-input.html");
        } catch {
          return false;
        }
      });

      if (chatInputWindow && !chatInputWindow.isDestroyed()) {
        const instance = this.getChatInputInstance();
        if (instance) {
          const newState = !instance.contentProtectionEnabled;
          instance.setContentProtectionEnabled(newState);
          console.log(`Chat Input: Content protection ${newState ? 'ENABLED' : 'DISABLED'}`);
          return newState;
        }
      }
      return false;
    });

    // Handle getting content protection status
    ipcMain.handle("chat-input-get-content-protection", async () => {
      const allWindows = BrowserWindow.getAllWindows();
      const chatInputWindow = allWindows.find((win) => {
        if (win.isDestroyed()) return false;
        try {
          return win.webContents.getURL().includes("chat-input.html");
        } catch {
          return false;
        }
      });

      if (chatInputWindow && !chatInputWindow.isDestroyed()) {
        const instance = this.getChatInputInstance();
        if (instance) {
          return instance.isContentProtectionEnabled();
        }
      }
      return false;
    });

    // Handle setting content protection state
    ipcMain.handle("chat-input-set-content-protection", async (event, enabled) => {
      const allWindows = BrowserWindow.getAllWindows();
      const chatInputWindow = allWindows.find((win) => {
        if (win.isDestroyed()) return false;
        try {
          return win.webContents.getURL().includes("chat-input.html");
        } catch {
          return false;
        }
      });

      if (chatInputWindow && !chatInputWindow.isDestroyed()) {
        const instance = this.getChatInputInstance();
        if (instance) {
          instance.setContentProtectionEnabled(enabled);
          console.log(`Chat Input: Content protection ${enabled ? 'ENABLED' : 'DISABLED'}`);
          return true;
        }
      }
      return false;
    });
  }

  /**
   * Helper function to get chat input instance
   */
  static getChatInputInstance() {
    const allWindows = BrowserWindow.getAllWindows();
    for (const win of allWindows) {
      if (win.isDestroyed()) continue;
      try {
        // Look for the chat input window by checking its reference
        if (win._chatInputInstance) {
          return win._chatInputInstance;
        }
      } catch (error) {
        continue;
      }
    }
    return null;
  }
}

module.exports = { ContentProtectionHandlers };