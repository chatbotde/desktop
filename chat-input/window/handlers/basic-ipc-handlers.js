const { BrowserWindow, ipcMain } = require("electron");
const { environmentConfig } = require("../../../utils/environment");

/**
 * Basic IPC handlers for chat input window
 */
class BasicIpcHandlers {
  static registerHandlers() {
    // Handle message sending from chat input to main window
    ipcMain.on("send-chat-message", (event, message) => {
      console.log("IPC: Received message from chat input:", message);

      // Find the main window from all windows
      const allWindows = BrowserWindow.getAllWindows();
      console.log("IPC: Found", allWindows.length, "windows");

      // Look for main window (the one that's not chat-input.html)
      const mainWindow = allWindows.find((win) => {
        if (win.isDestroyed()) return false;

        try {
          const url = win.webContents.getURL();
          console.log("IPC: Checking window URL:", url);

          // Use environment config to check if this is the main frontend window
          const isMainWindow = environmentConfig.isMainFrontendWindow(url) && 
                              !url.includes("chat-input.html") &&
                              !url.includes("launch-window.html");

          return isMainWindow;
        } catch (error) {
          console.log("IPC: Error checking window URL:", error);
          return false;
        }
      });

      if (mainWindow && !mainWindow.isDestroyed()) {
        console.log("IPC: Sending message to main window");
        try {
          mainWindow.webContents.send("receive-chat-message", message);
          console.log("IPC: Message sent successfully");
        } catch (error) {
          console.error("IPC: Error sending message to main window:", error);
        }
      } else {
        console.log("IPC: Main window not found or destroyed");
        console.log(
          "IPC: Available windows:",
          allWindows.map((win) => {
            try {
              return win.webContents.getURL();
            } catch {
              return "destroyed";
            }
          })
        );
      }

      // Find chat input window and clear input
      const chatInputWindow = allWindows.find((win) => {
        if (win.isDestroyed()) return false;
        try {
          const url = win.webContents.getURL();
          return url.includes("chat-input.html");
        } catch {
          return false;
        }
      });

      if (chatInputWindow && !chatInputWindow.isDestroyed()) {
        console.log("IPC: Clearing chat input");
        try {
          chatInputWindow.webContents.send("clear-input");
        } catch (error) {
          console.error("IPC: Error clearing chat input:", error);
        }
      }
    });

    // Handle stop streaming request from chat input to main window
    ipcMain.on("stop-streaming", (event) => {
      console.log("IPC: Received stop streaming request from chat input");

      // Find the main window
      const allWindows = BrowserWindow.getAllWindows();
      const mainWindow = allWindows.find((win) => {
        if (win.isDestroyed()) return false;
        try {
          const url = win.webContents.getURL();
          return environmentConfig.isMainFrontendWindow(url) && 
                 !url.includes("chat-input.html") &&
                 !url.includes("launch-window.html");
        } catch (error) {
          return false;
        }
      });

      if (mainWindow && !mainWindow.isDestroyed()) {
        console.log("IPC: Sending stop streaming to main window");
        try {
          mainWindow.webContents.send("stop-streaming");
          console.log("IPC: Stop streaming request sent successfully");
        } catch (error) {
          console.error("IPC: Error sending stop streaming to main window:", error);
        }
      } else {
        console.log("IPC: Main window not found for stop streaming");
      }
    });

    // Handle streaming status updates from main window to chat input
    ipcMain.on("notify-streaming-status", (event, status) => {
      console.log("IPC: Received streaming status update:", status);

      // Find the chat input window
      const allWindows = BrowserWindow.getAllWindows();
      const chatInputWindow = allWindows.find((win) => {
        if (win.isDestroyed()) return false;
        try {
          const url = win.webContents.getURL();
          return url.includes("chat-input.html");
        } catch {
          return false;
        }
      });

      if (chatInputWindow && !chatInputWindow.isDestroyed()) {
        console.log("IPC: Sending streaming status to chat input window");
        try {
          chatInputWindow.webContents.send("streaming-status", status);
        } catch (error) {
          console.error("IPC: Error sending streaming status to chat input:", error);
        }
      }
    });

    // Handle dynamic window height adjustment with debouncing
    let resizeTimeout = null;
    let lastResizeHeight = 0;
    
    ipcMain.on("chat-input-resize-height", (event, newHeight) => {
      // In fullscreen mode, we don't resize the window - it stays fullscreen
      // The UI will handle content layout within the fullscreen space
      console.log(`Fullscreen chat-input mode: Content height ${newHeight} - window remains fullscreen`);
      return;
    });

    // Handle chat input window controls
    ipcMain.handle("chat-input-close", () => {
      const allWindows = BrowserWindow.getAllWindows();
      const chatInputWindow = allWindows.find((win) =>
        win.webContents.getURL().includes("chat-input.html")
      );

      if (chatInputWindow && !chatInputWindow.isDestroyed()) {
        chatInputWindow.destroy();
      }
    });

    ipcMain.handle("chat-input-hide", () => {
      const allWindows = BrowserWindow.getAllWindows();
      const chatInputWindow = allWindows.find((win) =>
        win.webContents.getURL().includes("chat-input.html")
      );

      if (chatInputWindow && !chatInputWindow.isDestroyed()) {
        chatInputWindow.hide();
      }
    });

    // Handle hide chat input (alternative)
    ipcMain.on("hide-chat-input", () => {
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
        chatInputWindow.hide();
      }
    });
  }
}

module.exports = { BasicIpcHandlers };