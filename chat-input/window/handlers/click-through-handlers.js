const { BrowserWindow, ipcMain } = require("electron");

/**
 * Click-through control IPC handlers
 */
class ClickThroughHandlers {
  static registerHandlers() {
    // Handle enabling click-through mode
    ipcMain.on("chat-input-enable-click-through", (event) => {
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
        // Enable click-through for the entire window
        // forward: true allows mouse events to pass through to windows behind
        chatInputWindow.setIgnoreMouseEvents(true, { forward: true });
        console.log('Chat input: Click-through enabled');
      }
    });

    // Handle disabling click-through mode
    ipcMain.on("chat-input-disable-click-through", (event) => {
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
        // Disable click-through - window will capture mouse events normally
        chatInputWindow.setIgnoreMouseEvents(false);
        console.log('Chat input: Click-through disabled');
      }
    });

    // Handle toggling click-through mode
    ipcMain.on("chat-input-toggle-click-through", (event) => {
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
        // Toggle click-through state
        const isCurrentlyIgnoring = chatInputWindow.isIgnoreMouseEvents();
        if (isCurrentlyIgnoring) {
          chatInputWindow.setIgnoreMouseEvents(false);
          console.log('Chat input: Click-through disabled');
        } else {
          chatInputWindow.setIgnoreMouseEvents(true, { forward: true });
          console.log('Chat input: Click-through enabled');
        }
      }
    });
  }
}

module.exports = { ClickThroughHandlers };