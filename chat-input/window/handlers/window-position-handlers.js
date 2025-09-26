const { BrowserWindow, ipcMain, screen } = require("electron");

/**
 * Window position and geometry IPC handlers
 */
class WindowPositionHandlers {
  static registerHandlers() {
    // Handle window position setting for drag
    ipcMain.on("chat-input-set-position", (event, { deltaX, deltaY }) => {
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
        const [currentX, currentY] = chatInputWindow.getPosition();
        const newX = currentX + deltaX;
        const newY = currentY + deltaY;

        // Get screen bounds to prevent dragging off screen
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
        const [windowWidth, windowHeight] = chatInputWindow.getSize();

        // Constrain to screen bounds
        const constrainedX = Math.max(0, Math.min(screenWidth - windowWidth, newX));
        const constrainedY = Math.max(0, Math.min(screenHeight - windowHeight, newY));

        chatInputWindow.setPosition(constrainedX, constrainedY);
      }
    });

    // Handle advanced window bounds setting
    ipcMain.on("chat-input-set-bounds", (event, bounds) => {
      // In fullscreen mode, we don't change window bounds - it stays fullscreen
      console.log('Fullscreen chat-input mode: Bounds setting disabled - window remains fullscreen');
      return;
    });

    // Handle getting current window geometry
    ipcMain.handle("chat-input-get-geometry", async (event) => {
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
        const [x, y] = chatInputWindow.getPosition();
        const [width, height] = chatInputWindow.getSize();
        const bounds = chatInputWindow.getBounds();
        
        return {
          position: { x, y },
          size: { width, height },
          bounds: bounds,
          isVisible: chatInputWindow.isVisible(),
          isFocused: chatInputWindow.isFocused()
        };
      }
      
      return null;
    });

    // Handle setting window size with optional centering
    ipcMain.on("chat-input-set-size", (event, { width, height, center = false }) => {
      // In fullscreen mode, we don't change window size - it stays fullscreen
      console.log(`Fullscreen chat-input mode: Size setting disabled - window remains fullscreen (${width}x${height})`);
      return;
    });

    // Handle animated window geometry changes
    ipcMain.on("chat-input-animate-geometry", (event, { targetBounds, duration = 300 }) => {
      // In fullscreen mode, we don't animate geometry changes - window stays fullscreen
      console.log('Fullscreen chat-input mode: Geometry animation disabled - window remains fullscreen');
      return;
    });

    // Handle smart window adjustment for UI elements
    ipcMain.on("chat-input-adjust-for-element", (event, { elementId, options = {} }) => {
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
        // Send element info request to renderer
        chatInputWindow.webContents.send('get-element-info', { elementId, options });
      }
    });

    // Handle getting screen information
    ipcMain.handle("chat-input-get-screen-info", async (event) => {
      const displays = screen.getAllDisplays();
      const primaryDisplay = screen.getPrimaryDisplay();
      
      return {
        primary: {
          id: primaryDisplay.id,
          bounds: primaryDisplay.bounds,
          workArea: primaryDisplay.workArea,
          workAreaSize: primaryDisplay.workAreaSize,
          scaleFactor: primaryDisplay.scaleFactor
        },
        all: displays.map(display => ({
          id: display.id,
          bounds: display.bounds,
          workArea: display.workArea,
          workAreaSize: display.workAreaSize,
          scaleFactor: display.scaleFactor,
          isPrimary: display.id === primaryDisplay.id
        }))
      };
    });

    // Handle setting window position relative to screen coordinates
    ipcMain.on("chat-input-set-screen-position", (event, { x, y, width, height }) => {
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
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
        
        const constrainedX = Math.max(0, Math.min(screenWidth - width, x));
        const constrainedY = Math.max(0, Math.min(screenHeight - height, y));
        const constrainedWidth = Math.max(100, Math.min(1400, width));
        const constrainedHeight = Math.max(80, Math.min(800, height));
        
        chatInputWindow.setBounds({
          x: constrainedX,
          y: constrainedY,
          width: constrainedWidth,
          height: constrainedHeight
        });
      }
    });
  }
}

module.exports = { WindowPositionHandlers };