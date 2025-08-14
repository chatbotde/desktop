const { app } = require("electron");
const { WindowManager, ShortcutManager } = require("./window-main");

// Global instances
let windowManager = null;
let shortcutManager = null;

function createWindow(theme = "transparent") {
  if (!windowManager) {
    windowManager = new WindowManager();
  }
  
  const win = windowManager.createWindow(theme);
  
  // Setup shortcuts if not already done
  if (!shortcutManager) {
    shortcutManager = new ShortcutManager(windowManager);
    shortcutManager.registerAllShortcuts();
  }
  
  return win;
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  // Unregister all global shortcuts
  if (shortcutManager) {
    shortcutManager.unregisterAllShortcuts();
  }

  if (process.platform !== "darwin") app.quit();
});

app.on("will-quit", () => {
  // Unregister all global shortcuts before quitting
  if (shortcutManager) {
    shortcutManager.unregisterAllShortcuts();
  }
});
