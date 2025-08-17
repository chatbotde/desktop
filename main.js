const { app, ipcMain } = require("electron");
const path = require("path");
const { LaunchWindowManager } = require("./launch-window");
const { registerIpcHandlers } = require("./window-main");
const { ChatInputWindow } = require("./chat-input/chat-input-window");

// Set app icon
if (process.platform === 'win32') {
  app.setAppUserModelId("com.sonicthinking.buddy");
}

// Global instances
let launchWindowManager = null;
let chatInputWindow = null;
let ipcHandlersRegistered = false;
let chatInputIpcHandlersRegistered = false;

function createLaunchWindow() {
  if (!launchWindowManager) {
    launchWindowManager = new LaunchWindowManager();
  }
  
  const launchWin = launchWindowManager.createLaunchWindow();
  
  // Ensure launch window has highest priority from start
  setTimeout(() => {
    if (launchWindowManager) {
      launchWindowManager.forceWindowAboveAll();
    }
  }, 500);
  
  // Setup IPC handlers (only once)
  if (!ipcHandlersRegistered) {
    console.log('Main: Setting up IPC handlers');
    
    ipcMain.on('open-main-window', () => {
      console.log('Main: Opening main window');
      const mainWindow = launchWindowManager.openMainWindow();
      
      // Create and show chat input window automatically
      if (!chatInputWindow) {
        console.log('Main: Creating chat input window');
        chatInputWindow = new ChatInputWindow();
        chatInputWindow.createChatInputWindow();
        chatInputWindow.setMainWindow(mainWindow);
        
        // Show chat input window after a short delay to ensure main window is ready
        setTimeout(() => {
          chatInputWindow.show();
          
          // Ensure launch window stays above chat input
          setTimeout(() => {
            if (launchWindowManager) {
              launchWindowManager.forceWindowAboveAll();
            }
          }, 200);
        }, 1000);
      } else {
        console.log('Main: Reusing existing chat input window');
        chatInputWindow.setMainWindow(mainWindow);
        chatInputWindow.show();
        
        // Ensure launch window stays above chat input
        setTimeout(() => {
          if (launchWindowManager) {
            launchWindowManager.forceWindowAboveAll();
          }
        }, 200);
      }
    });

    // Handle chat input window toggle
    ipcMain.on('toggle-chat-input', () => {
      console.log('Main: Toggle chat input requested');
      if (!chatInputWindow) {
        console.log('Main: Creating new chat input window');
        chatInputWindow = new ChatInputWindow();
        chatInputWindow.createChatInputWindow();
        
        // Set main window reference if available
        const mainWindow = launchWindowManager.getMainWindow();
        if (mainWindow) {
          chatInputWindow.setMainWindow(mainWindow);
        }
      } else {
        console.log('Main: Toggling existing chat input window');
        chatInputWindow.toggle();
        
        // Ensure launch window stays above chat input when toggled
        setTimeout(() => {
          if (launchWindowManager) {
            launchWindowManager.forceWindowAboveAll();
          }
        }, 200);
      }
    });

    // Launch window content protection handlers (Highest Priority)
    ipcMain.handle('launch-window-toggle-content-protection', () => {
      if (launchWindowManager) {
        const enabled = launchWindowManager.toggleContentProtection();
        console.log(`Main: Launch window content protection ${enabled ? 'ENABLED' : 'DISABLED'} with highest priority`);
        return enabled;
      }
      return false;
    });

    ipcMain.handle('launch-window-get-content-protection', () => {
      if (launchWindowManager) {
        return launchWindowManager.isContentProtectionEnabled();
      }
      return false;
    });

    ipcMain.handle('launch-window-enable-content-protection', () => {
      if (launchWindowManager) {
        launchWindowManager.enableContentProtection();
        console.log('Main: Launch window content protection ENABLED with highest priority');
        return true;
      }
      return false;
    });

    ipcMain.handle('launch-window-disable-content-protection', () => {
      if (launchWindowManager) {
        launchWindowManager.disableContentProtection();
        console.log('Main: Launch window content protection DISABLED');
        return true;
      }
      return false;
    });

    ipcHandlersRegistered = true;
    console.log('Main: IPC handlers registered');
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
  if (chatInputWindow) {
    chatInputWindow.destroy();
  }
  if (launchWindowManager) {
    launchWindowManager.closeLaunchWindow();
  }
});
