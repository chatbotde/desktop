/**
 * IPC (Inter-Process Communication) handlers for window controls and functionality
 */

const { ipcMain } = require("electron");
const { forceWindowAboveTaskbar } = require("./window-behavior");
const { updateWindowOpacity } = require("./window-styling");

function registerIpcHandlers(windowManager) {
  // Remove existing handlers to avoid duplicates
  removeExistingHandlers();

  // Window control handlers
  registerWindowControlHandlers(windowManager);
  
  // Window property handlers
  registerWindowPropertyHandlers(windowManager);
  
  // Theme handlers
  registerThemeHandlers(windowManager);
  
  // Screen capture handlers
  registerScreenCaptureHandlers();
}

function removeExistingHandlers() {
  const handlersToRemove = [
    "window-close",
    "window-minimize", 
    "window-maximize",
    "window-force-above-taskbar",
    "window-set-opacity",
    "window-toggle-mouse-ignore",
    "window-toggle-content-protection",
    "window-get-content-protection",
    "window-get-theme",
    "window-set-theme",
    "get-desktop-sources",
    "get-screen-info"
  ];

  handlersToRemove.forEach(handler => {
    ipcMain.removeAllListeners(handler);
  });
}

function registerWindowControlHandlers(windowManager) {
  ipcMain.handle("window-close", () => {
    const currentWindow = windowManager.getCurrentWindow();
    if (currentWindow) {
      currentWindow.close();
    }
  });

  ipcMain.handle("window-minimize", () => {
    const currentWindow = windowManager.getCurrentWindow();
    if (currentWindow) {
      currentWindow.minimize();
    }
  });

  ipcMain.handle("window-maximize", () => {
    const currentWindow = windowManager.getCurrentWindow();
    if (currentWindow) {
      if (currentWindow.isMaximized()) {
        currentWindow.unmaximize();
      } else {
        currentWindow.maximize();
      }
    }
  });

  ipcMain.handle("window-force-above-taskbar", () => {
    const currentWindow = windowManager.getCurrentWindow();
    if (currentWindow) {
      forceWindowAboveTaskbar(currentWindow);
    }
  });
}

function registerWindowPropertyHandlers(windowManager) {
  ipcMain.handle("window-set-opacity", (event, opacity) => {
    const currentWindow = windowManager.getCurrentWindow();
    if (currentWindow) {
      updateWindowOpacity(currentWindow, windowManager, opacity);
    }
  });

  ipcMain.handle("window-toggle-mouse-ignore", () => {
    const currentWindow = windowManager.getCurrentWindow();
    if (currentWindow) {
      const mouseIgnoreEnabled = !windowManager.isMouseIgnoreEnabled();
      windowManager.setMouseIgnoreEnabled(mouseIgnoreEnabled);
      currentWindow.setIgnoreMouseEvents(mouseIgnoreEnabled);
      return mouseIgnoreEnabled;
    }
    return false;
  });

  ipcMain.handle("window-toggle-content-protection", () => {
    const currentWindow = windowManager.getCurrentWindow();
    if (currentWindow) {
      const contentProtectionEnabled = !windowManager.isContentProtectionEnabled();
      windowManager.setContentProtectionEnabled(contentProtectionEnabled);
      currentWindow.setContentProtection(contentProtectionEnabled);
      console.log(`Content protection ${contentProtectionEnabled ? "enabled" : "disabled"}`);
      return contentProtectionEnabled;
    }
    return false;
  });

  ipcMain.handle("window-get-content-protection", () => {
    return windowManager.isContentProtectionEnabled();
  });
}

function registerThemeHandlers(windowManager) {
  ipcMain.handle("window-get-theme", () => {
    return windowManager.getCurrentTheme();
  });

  ipcMain.handle("window-set-theme", (event, theme) => {
    console.log(`Theme changed to: ${theme}`);
    return windowManager.recreateWindowWithTheme(theme);
  });
}

function registerScreenCaptureHandlers() {
  const { desktopCapturer, screen } = require("electron");

  ipcMain.handle("get-desktop-sources", async () => {
    try {
      const sources = await desktopCapturer.getSources({
        types: ["window", "screen"],
        thumbnailSize: { width: 150, height: 150 },
      });

      // Filter out this application's own window
      const filteredSources = sources.filter((source) => {
        const isOwnWindow =
          source.name.toLowerCase().includes("buddy") ||
          source.name.toLowerCase().includes("electron") ||
          (process.platform === "win32" && source.name.includes("Buddy")) ||
          (process.platform === "darwin" && source.name.includes("Buddy")) ||
          (process.platform === "linux" &&
            (source.name.includes("Buddy") || source.name.includes("buddy")));
        return !isOwnWindow;
      });

      return filteredSources.map((source) => ({
        id: source.id,
        name: source.name,
        thumbnail: source.thumbnail.toDataURL(),
      }));
    } catch (error) {
      console.error("Error getting desktop sources:", error);
      return [];
    }
  });

  ipcMain.handle("get-screen-info", () => {
    const displays = screen.getAllDisplays();
    const primaryDisplay = screen.getPrimaryDisplay();
    return {
      displays: displays.map((display) => ({
        id: display.id,
        bounds: display.bounds,
        workArea: display.workArea,
        scaleFactor: display.scaleFactor,
        rotation: display.rotation,
        primary: display.id === primaryDisplay.id,
      })),
      primaryDisplay: {
        id: primaryDisplay.id,
        bounds: primaryDisplay.bounds,
        workArea: primaryDisplay.workArea,
        scaleFactor: primaryDisplay.scaleFactor,
      },
    };
  });
}

module.exports = {
  registerIpcHandlers
};
