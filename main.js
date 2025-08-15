const { app, ipcMain } = require("electron");
const { LaunchWindowManager } = require("./launch-window");
const { registerIpcHandlers } = require("./window-main");

// Global instances
let launchWindowManager = null;
let ipcHandlersRegistered = false;

function createLaunchWindow() {
  if (!launchWindowManager) {
    launchWindowManager = new LaunchWindowManager();
  }
  
  const launchWin = launchWindowManager.createLaunchWindow();
  
  // Setup IPC handler for opening main window (only once)
  if (!ipcHandlersRegistered) {
    ipcMain.on('open-main-window', () => {
      launchWindowManager.openMainWindow();
    });
    ipcHandlersRegistered = true;
  }
  
  return launchWin;
}

app.whenReady().then(createLaunchWindow);

app.on("window-all-closed", () => {
  // Don't quit the app when all windows are closed
  // The launch window should persist
  // Only quit when explicitly closed via Ctrl+Alt+Y
});

app.on("will-quit", () => {
  // Clean up when quitting
  if (launchWindowManager) {
    launchWindowManager.closeLaunchWindow();
  }
});
